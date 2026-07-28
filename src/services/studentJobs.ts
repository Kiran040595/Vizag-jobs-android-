import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import {
  validateStudentProfilePayload,
  type StudentProfileInput,
  type StudentProfilePayload,
} from '../lib/studentProfileValidation';

const mapError = (error: { message?: string } | null, fallbackMessage: string): Error =>
  new Error(error?.message || fallbackMessage);

export const fetchStudentProfile = async (): Promise<Record<string, unknown> | null> => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('You must be signed in.');
  }

  const { data, error } = await supabase
    .from('student_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    throw mapError(error, 'Could not load your student profile.');
  }

  return data as Record<string, unknown> | null;
};

export const upsertStudentProfile = async (
  profile: StudentProfileInput,
): Promise<Record<string, unknown>> => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('You must be signed in.');
  }

  const validated: StudentProfilePayload = validateStudentProfilePayload(profile);

  const payload = {
    user_id: user.id,
    ...validated,
    contact_email: validated.contact_email || user.email || null,
    is_active: true,
  };

  const { data, error } = await supabase
    .from('student_profiles')
    .upsert(payload, { onConflict: 'user_id' })
    .select('*')
    .single();

  if (error) {
    throw mapError(error, 'Could not save your profile.');
  }

  return data as Record<string, unknown>;
};

export { validateStudentProfilePayload };
