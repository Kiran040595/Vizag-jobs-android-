import { mapJobDbError } from '../lib/jobFormSerialize';
import { supabase } from '../lib/supabaseClient';
import type { EmployerJobRow } from './employerJobs';

const JOBS_TABLE = process.env.EXPO_PUBLIC_SUPABASE_JOBS_TABLE || 'jobs';

export type AdminEmployerRow = {
  user_id: string;
  company_name: string;
  contact_email: string | null;
  is_active: boolean;
};

const requireAdminUser = async () => {
  if (!supabase) throw new Error('Supabase is not configured.');
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be signed in as an admin.');
  return user;
};

export const fetchEmployerSubmittedJobs = async (): Promise<EmployerJobRow[]> => {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase
    .from(JOBS_TABLE)
    .select('*')
    .not('created_by', 'is', null)
    .order('created_at', { ascending: false });
  if (error) throw mapJobDbError(error, 'Could not load employer-submitted jobs.');
  return (data || []) as EmployerJobRow[];
};

export const fetchPendingEmployerJobs = async (): Promise<EmployerJobRow[]> => {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase
    .from(JOBS_TABLE)
    .select('*')
    .not('created_by', 'is', null)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw mapJobDbError(error, 'Could not load pending employer jobs.');
  return (data || []) as EmployerJobRow[];
};

export const approveAdminJob = async (jobId: string): Promise<EmployerJobRow> => {
  if (!supabase) throw new Error('Supabase is not configured.');
  const user = await requireAdminUser();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from(JOBS_TABLE)
    .update({
      status: 'published',
      posted_at: now,
      reviewed_at: now,
      reviewed_by: user.id,
      rejection_reason: null,
    })
    .eq('id', jobId)
    .select('*')
    .single();
  if (error) throw mapJobDbError(error, 'Could not approve the job.');
  return data as EmployerJobRow;
};

export const rejectAdminJob = async (
  jobId: string,
  rejectionReason = '',
): Promise<EmployerJobRow> => {
  if (!supabase) throw new Error('Supabase is not configured.');
  const user = await requireAdminUser();
  const { data, error } = await supabase
    .from(JOBS_TABLE)
    .update({
      status: 'archived',
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      rejection_reason: String(rejectionReason || '').trim() || null,
    })
    .eq('id', jobId)
    .select('*')
    .single();
  if (error) throw mapJobDbError(error, 'Could not reject the job.');
  return data as EmployerJobRow;
};

export const fetchAdminEmployers = async (): Promise<AdminEmployerRow[]> => {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase
    .from('employer_profiles')
    .select('user_id, company_name, contact_email, is_active')
    .order('company_name', { ascending: true });
  if (error) throw mapJobDbError(error, 'Could not load employers.');
  return (data || []).map((row) => ({
    user_id: String(row.user_id),
    company_name: String(row.company_name || ''),
    contact_email: row.contact_email ? String(row.contact_email) : null,
    is_active: row.is_active !== false,
  }));
};

export const setEmployerActive = async (
  userId: string,
  isActive: boolean,
): Promise<AdminEmployerRow> => {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase
    .from('employer_profiles')
    .update({ is_active: Boolean(isActive) })
    .eq('user_id', userId)
    .select('user_id, company_name, contact_email, is_active')
    .single();
  if (error) throw mapJobDbError(error, 'Could not update employer status.');
  return {
    user_id: String(data.user_id),
    company_name: String(data.company_name || ''),
    contact_email: data.contact_email ? String(data.contact_email) : null,
    is_active: data.is_active !== false,
  };
};
