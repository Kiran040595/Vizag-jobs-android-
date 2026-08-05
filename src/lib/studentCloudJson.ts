/**
 * Cloud-backed JSON prefs for a signed-in student.
 * Prefers dedicated tables when present; otherwise uses the private
 * student-resumes storage folder (same path ACL as resumes).
 */
import { isSupabaseConfigured, supabase } from './supabaseClient';
import { isMissingRelation } from './supabaseErrors';

const RESUME_BUCKET = 'student-resumes';

export const downloadStudentJson = async <T>(
  userId: string,
  fileName: string,
): Promise<T | null> => {
  if (!isSupabaseConfigured || !supabase || !userId) return null;
  const path = `${userId}/${fileName}`;
  const { data, error } = await supabase.storage.from(RESUME_BUCKET).download(path);
  if (error || !data) return null;
  try {
    const text = await data.text();
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
};

export const uploadStudentJson = async (
  userId: string,
  fileName: string,
  payload: unknown,
): Promise<boolean> => {
  if (!isSupabaseConfigured || !supabase || !userId) return false;
  const path = `${userId}/${fileName}`;
  const body = JSON.stringify(payload);
  const { error } = await supabase.storage.from(RESUME_BUCKET).upload(path, body, {
    upsert: true,
    contentType: 'application/octet-stream',
  });
  return !error;
};

export const getAuthUserId = async (): Promise<string | null> => {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id || null;
};

export { isMissingRelation, RESUME_BUCKET };
