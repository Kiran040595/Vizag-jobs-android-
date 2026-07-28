import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import {
  APPLICATION_STATUSES,
  formatApplicationStatus,
  normalizeApplicationStatus,
} from '../lib/applicationStatus';
import { fetchStudentProfile } from './studentJobs';

const APPLICATION_COLUMNS = `
  id,
  job_id,
  student_user_id,
  status,
  cover_note,
  resume_path,
  resume_share_token,
  profile_snapshot,
  submitted_at,
  updated_at
`;

export type JobApplication = {
  id: string;
  jobId: string;
  studentUserId: string;
  status: string;
  coverNote: string;
  resumePath: string;
  resumeShareToken: string;
  profileSnapshot: Record<string, unknown>;
  submittedAt: string | null;
  updatedAt: string | null;
  job: {
    id: string;
    slug?: string | null;
    title?: string | null;
    company?: string | null;
    status?: string | null;
  } | null;
};

const mapApplication = (row: Record<string, unknown> | null): JobApplication | null => {
  if (!row) return null;

  const jobRow = row.job as Record<string, unknown> | null | undefined;
  const job = jobRow
    ? {
        id: String(jobRow.id),
        slug: jobRow.slug ? String(jobRow.slug) : null,
        title: jobRow.title ? String(jobRow.title) : null,
        company: jobRow.company ? String(jobRow.company) : null,
        status: jobRow.status ? String(jobRow.status) : null,
      }
    : null;

  return {
    id: String(row.id),
    jobId: String(row.job_id),
    studentUserId: String(row.student_user_id),
    status: normalizeApplicationStatus(row.status) as string,
    coverNote: String(row.cover_note || ''),
    resumePath: String(row.resume_path || ''),
    resumeShareToken: String(row.resume_share_token || ''),
    profileSnapshot: (row.profile_snapshot as Record<string, unknown>) || {},
    submittedAt: row.submitted_at ? String(row.submitted_at) : null,
    updatedAt: row.updated_at ? String(row.updated_at) : null,
    job,
  };
};

const buildProfileSnapshot = (profile: Record<string, unknown>) => ({
  fullName: profile.full_name || '',
  college: profile.college || '',
  degree: profile.degree || '',
  branch: profile.branch || '',
  graduationYear: profile.graduation_year || null,
  phone: profile.phone || '',
  contactEmail: profile.contact_email || '',
  skills: Array.isArray(profile.skills) ? profile.skills : [],
  certifications: Array.isArray(profile.certifications) ? profile.certifications : [],
  isFresher: Boolean(profile.is_fresher),
  targetJobCategories: Array.isArray(profile.target_job_categories)
    ? profile.target_job_categories
    : [],
  primaryTargetRole: profile.primary_target_role || '',
  roleExperienceLevel: profile.role_experience_level || '',
  preferredLocations: Array.isArray(profile.preferred_locations)
    ? profile.preferred_locations
    : [],
  availability: profile.availability || '',
  expectedSalaryMin: profile.expected_salary_min || null,
  expectedSalaryMax: profile.expected_salary_max || null,
});

export const fetchMyApplicationForJob = async (jobId: string): Promise<JobApplication | null> => {
  if (!isSupabaseConfigured || !supabase || !jobId) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('job_applications')
    .select(APPLICATION_COLUMNS)
    .eq('job_id', jobId)
    .eq('student_user_id', user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return mapApplication(data as Record<string, unknown> | null);
};

export const fetchMyApplications = async (): Promise<JobApplication[]> => {
  if (!isSupabaseConfigured || !supabase) return [];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('job_applications')
    .select(`
      ${APPLICATION_COLUMNS},
      job:jobs (
        id,
        slug,
        title,
        company,
        status
      )
    `)
    .eq('student_user_id', user.id)
    .order('submitted_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map((row) => mapApplication(row as Record<string, unknown>)!).filter(Boolean);
};

export const submitJobApplication = async ({
  jobId,
  coverNote,
}: {
  jobId: string;
  coverNote?: string;
}): Promise<JobApplication> => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('You must be signed in as a student.');
  }

  const profile = await fetchStudentProfile();
  if (!profile) {
    throw new Error('Complete your student profile before applying.');
  }

  const trimmedCover = String(coverNote || '').trim();
  const resumePath = profile.resume_path ? String(profile.resume_path) : null;

  const { data, error } = await supabase
    .from('job_applications')
    .insert({
      job_id: jobId,
      student_user_id: user.id,
      cover_note: trimmedCover || null,
      resume_path: resumePath,
      profile_snapshot: buildProfileSnapshot(profile),
      status: 'applied',
    })
    .select(APPLICATION_COLUMNS)
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('You have already applied for this job.');
    }
    throw new Error(error.message);
  }

  return mapApplication(data as Record<string, unknown>)!;
};

export { formatApplicationStatus };

export const formatApplicationTime = (value: string | null | undefined): string => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const APPLICATION_STATUSES_SET = new Set(APPLICATION_STATUSES);
