import { supabase } from '../lib/supabaseClient';
import {
  createSuggestedSlug,
  deserializeJobForForm,
  getEmptyJobForm,
  mapJobDbError,
  serializeJobForm,
  type JobFormValues,
} from '../lib/jobFormSerialize';

const JOBS_TABLE = process.env.EXPO_PUBLIC_SUPABASE_JOBS_TABLE || 'jobs';

export type EmployerProfileInput = {
  company_name: string;
  contact_name?: string | null;
  contact_email?: string | null;
  phone?: string | null;
  website?: string | null;
  company_logo_url?: string | null;
};

export type EmployerProfileRow = EmployerProfileInput & {
  user_id: string;
  is_active?: boolean | null;
  [key: string]: unknown;
};

export type EmployerJobRow = Record<string, unknown> & {
  id: string;
  title?: string;
  company?: string;
  status?: string;
  apply_mode?: string;
  rejection_reason?: string | null;
};

const requireUser = async () => {
  if (!supabase) throw new Error('Supabase is not configured.');
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be signed in.');
  return user;
};

export const getEmptyEmployerJobForm = (companyName = ''): JobFormValues => {
  const form = getEmptyJobForm();
  return {
    ...form,
    company: companyName || form.company,
    source_name: '',
    source_url: '',
    apply_mode: 'internal',
    is_featured: false,
    status: 'pending',
  };
};

export const serializeEmployerJobForm = (values: JobFormValues): Record<string, unknown> => {
  const payload = serializeJobForm(values, 'pending');
  const applyMode = values.apply_mode === 'external' ? 'external' : 'internal';
  return {
    ...payload,
    apply_mode: applyMode,
    apply_link: applyMode === 'external' ? payload.apply_link : null,
    is_featured: false,
    source_name: null,
    source_url: null,
  };
};

export const fetchEmployerProfile = async (): Promise<EmployerProfileRow | null> => {
  if (!supabase) throw new Error('Supabase is not configured.');
  const user = await requireUser();
  const { data, error } = await supabase
    .from('employer_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw mapJobDbError(error, 'Could not load your company profile.');
  return (data as EmployerProfileRow | null) ?? null;
};

export const upsertEmployerProfile = async (
  profile: EmployerProfileInput,
): Promise<EmployerProfileRow> => {
  if (!supabase) throw new Error('Supabase is not configured.');
  const user = await requireUser();
  const payload = {
    user_id: user.id,
    company_name: String(profile.company_name || '').trim(),
    contact_name: String(profile.contact_name || '').trim() || null,
    contact_email: String(profile.contact_email || '').trim() || user.email || null,
    phone: String(profile.phone || '').trim() || null,
    website: String(profile.website || '').trim() || null,
    company_logo_url: String(profile.company_logo_url || '').trim() || null,
    is_active: true,
  };
  if (!payload.company_name) throw new Error('Company name is required.');

  const { data, error } = await supabase
    .from('employer_profiles')
    .upsert(payload, { onConflict: 'user_id' })
    .select('*')
    .single();
  if (error) throw mapJobDbError(error, 'Could not save your company profile.');
  return data as EmployerProfileRow;
};

export const fetchMyJobs = async (userId?: string): Promise<EmployerJobRow[]> => {
  if (!supabase) throw new Error('Supabase is not configured.');
  const currentUserId = userId || (await requireUser()).id;
  const { data, error } = await supabase
    .from(JOBS_TABLE)
    .select('*')
    .eq('created_by', currentUserId)
    .order('created_at', { ascending: false });
  if (error) throw mapJobDbError(error, 'Could not load your job submissions.');
  return (data || []) as EmployerJobRow[];
};

export const fetchMyJobById = async (jobId: string): Promise<EmployerJobRow> => {
  if (!supabase) throw new Error('Supabase is not configured.');
  const user = await requireUser();
  const { data, error } = await supabase
    .from(JOBS_TABLE)
    .select('*')
    .eq('id', jobId)
    .eq('created_by', user.id)
    .maybeSingle();
  if (error) throw mapJobDbError(error, 'Could not load the job.');
  if (!data) throw new Error('Job not found.');
  return data as EmployerJobRow;
};

export const createEmployerJob = async (values: JobFormValues): Promise<EmployerJobRow> => {
  if (!supabase) throw new Error('Supabase is not configured.');
  const user = await requireUser();
  const payload: Record<string, unknown> = {
    ...serializeEmployerJobForm(values),
    created_by: user.id,
  };
  if (!payload.slug) {
    payload.slug = createSuggestedSlug({
      title: String(payload.title || ''),
      company: String(payload.company || ''),
      postedAt: String(payload.posted_at || ''),
    });
  }

  const { data, error } = await supabase.from(JOBS_TABLE).insert(payload).select('*').single();
  if (error) throw mapJobDbError(error, 'Could not submit the job for review.');
  return data as EmployerJobRow;
};

export const updateEmployerJob = async (
  jobId: string,
  values: JobFormValues,
): Promise<EmployerJobRow> => {
  if (!supabase) throw new Error('Supabase is not configured.');
  const existing = await fetchMyJobById(jobId);
  if (!['pending', 'draft'].includes(String(existing.status || ''))) {
    throw new Error('Only pending submissions can be edited.');
  }

  const { data, error } = await supabase
    .from(JOBS_TABLE)
    .update(serializeEmployerJobForm(values))
    .eq('id', jobId)
    .eq('created_by', String(existing.created_by || ''))
    .select('*')
    .single();
  if (error) throw mapJobDbError(error, 'Could not update the job submission.');
  return data as EmployerJobRow;
};

export { createSuggestedSlug, deserializeJobForForm };
