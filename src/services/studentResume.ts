import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import {
  resolveResumeContentType,
  validateResumeFile,
  type ResumeFileLike,
} from '../lib/studentResumeFile';

const RESUME_BUCKET = 'student-resumes';

const getExtension = (fileName: string): string => {
  const parts = String(fileName || '').split('.');
  return parts.length > 1 ? (parts.pop() as string).toLowerCase() : '';
};

export { resolveResumeContentType, validateResumeFile } from '../lib/studentResumeFile';

export const uploadStudentResume = async (file: ResumeFileLike, userId: string): Promise<string> => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  const validationError = validateResumeFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const extension = getExtension(file.name);
  const path = `${userId}/resume-${Date.now()}.${extension}`;
  const contentType = resolveResumeContentType(file.name, file.type);

  const response = await fetch(file.uri);
  if (!response.ok) {
    throw new Error('Could not read the selected resume file.');
  }
  const blob = await response.blob();

  const { error } = await supabase.storage.from(RESUME_BUCKET).upload(path, blob, {
    upsert: true,
    contentType: contentType || blob.type || 'application/octet-stream',
  });

  if (error) {
    throw new Error(error.message);
  }

  return path;
};

export const createResumeSignedUrl = async (resumePath: string, expiresIn = 3600): Promise<string> => {
  if (!isSupabaseConfigured || !supabase || !resumePath) {
    return '';
  }

  const { data, error } = await supabase.storage
    .from(RESUME_BUCKET)
    .createSignedUrl(resumePath, expiresIn);

  if (error) {
    throw new Error(error.message);
  }

  return data?.signedUrl || '';
};

export const saveResumePathOnProfile = async (resumePath: string): Promise<void> => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('You must be signed in.');
  }

  const { error } = await supabase
    .from('student_profiles')
    .update({ resume_path: resumePath })
    .eq('user_id', user.id);

  if (error) {
    throw new Error(error.message);
  }
};
