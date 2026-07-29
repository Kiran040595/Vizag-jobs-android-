import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

const FEEDBACK_TYPES = new Set(['feature_request', 'problem', 'general']);

export const FEEDBACK_TYPE_OPTIONS = [
  { value: 'feature_request', label: 'Feature request' },
  { value: 'problem', label: 'Problem in the app' },
  { value: 'general', label: 'General feedback' },
];

export const validateSiteFeedbackInput = ({
  feedbackType,
  authorName,
  authorEmail,
  body,
  honeypot = '',
}: {
  feedbackType?: string;
  authorName?: string;
  authorEmail?: string;
  body?: string;
  honeypot?: string;
}): string => {
  if (honeypot) return 'Submission blocked.';

  const name = (authorName || '').trim();
  const email = (authorEmail || '').trim();
  const message = (body || '').trim();
  const type = (feedbackType || '').trim();

  if (!FEEDBACK_TYPES.has(type)) return 'Please choose a feedback type.';
  if (!name && !email) return 'Please enter your name or email.';
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Please enter a valid email address.';
  }
  if (message.length < 10) return 'Please enter at least 10 characters.';
  return '';
};

export const submitSiteFeedback = async ({
  feedbackType,
  authorName,
  authorEmail,
  body,
  pageUrl,
  honeypot = '',
  authorUserId = null,
}: {
  feedbackType: string;
  authorName?: string;
  authorEmail?: string;
  body: string;
  pageUrl?: string;
  honeypot?: string;
  authorUserId?: string | null;
}): Promise<{ submitted: boolean }> => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  const validationError = validateSiteFeedbackInput({
    feedbackType,
    authorName,
    authorEmail,
    body,
    honeypot,
  });
  if (validationError) throw new Error(validationError);

  let resolvedUserId = authorUserId || null;
  if (!resolvedUserId) {
    const { data: sessionData } = await supabase.auth.getSession();
    resolvedUserId = sessionData?.session?.user?.id || null;
  }

  const { error } = await supabase.from('site_feedback').insert({
    feedback_type: feedbackType,
    author_name: (authorName || '').trim() || null,
    author_email: (authorEmail || '').trim() || null,
    author_user_id: resolvedUserId,
    body: body.trim(),
    page_url: (pageUrl || '').trim() || null,
    wants_public: false,
    status: 'pending',
  });

  if (error) throw new Error(error.message);
  return { submitted: true };
};
