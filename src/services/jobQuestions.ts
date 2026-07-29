import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

const QUESTION_COLUMNS = `
  id,
  job_id,
  asker_name,
  asker_email,
  asker_user_id,
  body,
  status,
  answer_body,
  answered_by,
  answered_at,
  published_at,
  published_by,
  created_at
`;

export type JobQuestion = {
  id: string;
  jobId: string;
  askerName: string;
  askerEmail: string;
  askerUserId: string | null;
  body: string;
  status: string;
  answerBody: string;
  answeredBy: string | null;
  answeredAt: string | null;
  publishedAt: string | null;
  publishedBy: string | null;
  createdAt: string | null;
};

const mapQuestion = (row: Record<string, unknown> | null): JobQuestion | null => {
  if (!row) return null;
  return {
    id: String(row.id),
    jobId: String(row.job_id),
    askerName: String(row.asker_name || ''),
    askerEmail: String(row.asker_email || ''),
    askerUserId: row.asker_user_id ? String(row.asker_user_id) : null,
    body: String(row.body || ''),
    status: String(row.status || ''),
    answerBody: String(row.answer_body || ''),
    answeredBy: row.answered_by ? String(row.answered_by) : null,
    answeredAt: row.answered_at ? String(row.answered_at) : null,
    publishedAt: row.published_at ? String(row.published_at) : null,
    publishedBy: row.published_by ? String(row.published_by) : null,
    createdAt: row.created_at ? String(row.created_at) : null,
  };
};

export const validateQuestionInput = ({
  askerName,
  askerEmail,
  body,
}: {
  askerName?: string;
  askerEmail?: string;
  body?: string;
}): string => {
  const name = (askerName || '').trim();
  const email = (askerEmail || '').trim();
  const questionBody = (body || '').trim();

  if (!name && !email) return 'Please enter your name or email.';
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Please enter a valid email address.';
  }
  if (questionBody.length < 3) return 'Please enter a question with at least 3 characters.';
  return '';
};

export const submitJobQuestion = async ({
  jobId,
  askerName,
  askerEmail,
  body,
  askerUserId = null,
}: {
  jobId: string;
  askerName?: string;
  askerEmail?: string;
  body: string;
  askerUserId?: string | null;
}): Promise<{ submitted: boolean }> => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  const validationError = validateQuestionInput({ askerName, askerEmail, body });
  if (validationError) throw new Error(validationError);

  let resolvedUserId = askerUserId || null;
  if (!resolvedUserId) {
    const { data: sessionData } = await supabase.auth.getSession();
    resolvedUserId = sessionData?.session?.user?.id || null;
  }

  const { error } = await supabase.from('job_questions').insert({
    job_id: jobId,
    asker_name: (askerName || '').trim() || null,
    asker_email: (askerEmail || '').trim() || null,
    asker_user_id: resolvedUserId,
    body: body.trim(),
    status: 'pending',
  });

  if (error) throw new Error(error.message);
  return { submitted: true };
};

export const fetchPublishedJobQuestions = async (jobId: string): Promise<JobQuestion[]> => {
  if (!isSupabaseConfigured || !supabase || !jobId) return [];

  const { data, error } = await supabase
    .from('job_questions')
    .select(QUESTION_COLUMNS)
    .eq('job_id', jobId)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || [])
    .map((row) => mapQuestion(row as Record<string, unknown>))
    .filter(Boolean) as JobQuestion[];
};
