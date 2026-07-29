import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { mapStudentProfileRow, type MappedStudentProfile } from '../lib/mapStudentProfile';
import { resolveStudentLoginEmail } from '../lib/studentPhoneAuth';
import { validateStudentConsents, type StudentConsents } from '../lib/studentConsent';
import { validateStudentProfilePayload, type StudentProfileInput } from '../lib/studentProfileValidation';
import { recordStudentRegistrationConsents } from '../services/studentConsent';
import { upsertStudentProfile } from '../services/studentJobs';

const STUDENT_ACCESS_CACHE_TTL_MS = 15 * 60 * 1000;
const STUDENT_ACCESS_CACHE_KEY = 'vizagjobs:student-access-cache';

type AccessState = {
  isStudent: boolean;
  profile: Record<string, unknown> | null;
  mappedProfile: MappedStudentProfile | null;
  profileComplete: boolean;
};

type StudentAuthContextValue = {
  authError: string;
  isStudent: boolean;
  isLoading: boolean;
  isSupabaseConfigured: boolean;
  profile: Record<string, unknown> | null;
  mappedProfile: MappedStudentProfile | null;
  profileComplete: boolean;
  refreshStudentAccess: (userId: string) => Promise<AccessState>;
  requestPasswordReset: (identifier: string) => Promise<void>;
  session: Session | null;
  signIn: (args: { identifier: string; password: string }) => Promise<unknown>;
  signOut: () => Promise<void>;
  signUp: (args: {
    email: string;
    phone?: string;
    password: string;
    profile: StudentProfileInput;
    consents: StudentConsents;
  }) => Promise<unknown>;
  updatePassword: (password: string) => Promise<void>;
  user: User | null;
};

const StudentAuthContext = createContext<StudentAuthContextValue | null>(null);

const readStudentAccessCache = async (userId: string): Promise<AccessState | null> => {
  try {
    const rawValue = await AsyncStorage.getItem(STUDENT_ACCESS_CACHE_KEY);
    if (!rawValue) return null;
    const cached = JSON.parse(rawValue) as {
      userId?: string;
      isStudent?: boolean;
      profile?: Record<string, unknown> | null;
      profileComplete?: boolean;
      expiresAt?: number;
    };
    if (!cached || cached.userId !== userId) return null;
    if (typeof cached.expiresAt !== 'number' || cached.expiresAt <= Date.now()) {
      await AsyncStorage.removeItem(STUDENT_ACCESS_CACHE_KEY);
      return null;
    }
    return {
      isStudent: Boolean(cached.isStudent),
      profile: cached.profile ?? null,
      mappedProfile: mapStudentProfileRow(cached.profile ?? null),
      profileComplete: Boolean(cached.profileComplete),
    };
  } catch {
    return null;
  }
};

const writeStudentAccessCache = async (
  userId: string,
  isStudent: boolean,
  profile: Record<string, unknown> | null,
  profileComplete: boolean,
) => {
  try {
    await AsyncStorage.setItem(
      STUDENT_ACCESS_CACHE_KEY,
      JSON.stringify({
        userId,
        isStudent,
        profile,
        profileComplete,
        expiresAt: Date.now() + STUDENT_ACCESS_CACHE_TTL_MS,
      }),
    );
  } catch {
    // Ignore cache write failures.
  }
};

const clearStudentAccessCache = async () => {
  try {
    await AsyncStorage.removeItem(STUDENT_ACCESS_CACHE_KEY);
  } catch {
    // Ignore.
  }
};

const getStudentProfile = async (userId: string): Promise<AccessState> => {
  if (!supabase || !userId) {
    return { isStudent: false, profile: null, mappedProfile: null, profileComplete: false };
  }

  const { data, error } = await supabase
    .from('student_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;

  const row = data as Record<string, unknown> | null;
  const isStudent = Boolean(row?.user_id && row.is_active !== false);
  const mapped = mapStudentProfileRow(row);
  return {
    isStudent,
    profile: row,
    mappedProfile: mapped,
    profileComplete: Boolean(mapped?.profileComplete),
  };
};

export function StudentAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isStudent, setIsStudent] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [mappedProfile, setMappedProfile] = useState<MappedStudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(() => isSupabaseConfigured && Boolean(supabase));
  const [authError, setAuthError] = useState('');

  const applyAccess = useCallback((access: AccessState) => {
    setIsStudent(access.isStudent);
    setProfile(access.profile);
    setMappedProfile(access.mappedProfile);
    setProfileComplete(access.profileComplete);
  }, []);

  const refreshStudentAccess = useCallback(
    async (userId: string) => {
      const access = await getStudentProfile(userId);
      applyAccess(access);
      await writeStudentAccessCache(userId, access.isStudent, access.profile, access.profileComplete);
      return access;
    },
    [applyAccess],
  );

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return undefined;

    let isMounted = true;

    const syncSession = async (nextSession: Session | null, options: { showLoader?: boolean } = {}) => {
      if (!isMounted) return;
      if (options.showLoader) setIsLoading(true);

      setAuthError('');
      setSession(nextSession);

      if (!nextSession?.user) {
        applyAccess({ isStudent: false, profile: null, mappedProfile: null, profileComplete: false });
        await clearStudentAccessCache();
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const cached = await readStudentAccessCache(nextSession.user.id);
        const access = cached ?? (await getStudentProfile(nextSession.user.id));
        if (!isMounted) return;
        applyAccess(access);
        await writeStudentAccessCache(
          nextSession.user.id,
          access.isStudent,
          access.profile,
          access.profileComplete,
        );
      } catch (error) {
        if (!isMounted) return;
        applyAccess({ isStudent: false, profile: null, mappedProfile: null, profileComplete: false });
        setAuthError(error instanceof Error ? error.message : 'Could not verify student access.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) return;
      if (error) {
        setAuthError(error.message);
        setIsLoading(false);
        return;
      }
      void syncSession(data.session, { showLoader: true });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void syncSession(nextSession, { showLoader: true });
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [applyAccess]);

  const signIn = useCallback(
    async ({ identifier, password }: { identifier: string; password: string }) => {
      if (!supabase) throw new Error('Supabase is not configured.');

      const loginEmail = await resolveStudentLoginEmail(supabase, identifier);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });
      if (error) throw error;

      if (data.session?.user) {
        setSession(data.session);
        const access = await refreshStudentAccess(data.session.user.id);
        setIsLoading(false);
        if (!access.isStudent) {
          await supabase.auth.signOut();
          await clearStudentAccessCache();
          setSession(null);
          applyAccess({ isStudent: false, profile: null, mappedProfile: null, profileComplete: false });
          throw new Error(
            'This account is not registered as a student. Create a student account, or use the employer login on the website.',
          );
        }
      }

      return data;
    },
    [applyAccess, refreshStudentAccess],
  );

  const signUp = useCallback(
    async ({
      email,
      phone,
      password,
      profile: profileInput,
      consents,
    }: {
      email: string;
      phone?: string;
      password: string;
      profile: StudentProfileInput;
      consents: StudentConsents;
    }) => {
      if (!supabase) throw new Error('Supabase is not configured.');

      const signupEmail = String(email || '').trim();
      if (!signupEmail) throw new Error('Email is required.');

      validateStudentConsents(consents);

      const nextProfile: StudentProfileInput = {
        ...profileInput,
        contact_email: profileInput.contact_email || signupEmail,
        phone: profileInput.phone || phone,
      };
      const validatedProfile = validateStudentProfilePayload(nextProfile);

      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password,
        options: {
          data: {
            user_type: 'student',
            full_name: validatedProfile.full_name,
            college: validatedProfile.college,
            phone: validatedProfile.phone,
            auth_method: 'email',
            registration_consents: true,
          },
        },
      });
      if (error) throw error;

      let nextSession = data.session;
      if (data.user && !nextSession) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: signupEmail,
          password,
        });
        if (signInError) throw signInError;
        nextSession = signInData.session;
      }

      if (!data.user || !nextSession) {
        throw new Error('Account created but sign-in did not complete. Try signing in.');
      }

      setSession(nextSession);
      await upsertStudentProfile({
        ...nextProfile,
        contact_email: validatedProfile.contact_email || signupEmail,
      });
      await recordStudentRegistrationConsents(consents, { userId: data.user.id });
      await refreshStudentAccess(data.user.id);
      setIsLoading(false);
      return { ...data, session: nextSession };
    },
    [refreshStudentAccess],
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    await clearStudentAccessCache();
  }, []);

  const requestPasswordReset = useCallback(async (identifier: string) => {
    if (!supabase) throw new Error('Supabase is not configured.');
    const loginEmail = await resolveStudentLoginEmail(supabase, identifier);
    const { error } = await supabase.auth.resetPasswordForEmail(loginEmail, {
      redirectTo: 'vizagjobs://student/reset-password',
    });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    if (!supabase) throw new Error('Supabase is not configured.');
    const nextPassword = String(password || '');
    if (nextPassword.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }
    const { error } = await supabase.auth.updateUser({ password: nextPassword });
    if (error) throw error;
  }, []);

  const value = useMemo<StudentAuthContextValue>(
    () => ({
      authError,
      isStudent,
      isLoading,
      isSupabaseConfigured,
      profile,
      mappedProfile,
      profileComplete,
      refreshStudentAccess,
      requestPasswordReset,
      session,
      signIn,
      signOut,
      signUp,
      updatePassword,
      user: session?.user ?? null,
    }),
    [
      authError,
      isStudent,
      isLoading,
      mappedProfile,
      profile,
      profileComplete,
      refreshStudentAccess,
      requestPasswordReset,
      session,
      signIn,
      signOut,
      signUp,
      updatePassword,
    ],
  );

  return <StudentAuthContext.Provider value={value}>{children}</StudentAuthContext.Provider>;
}

export function useStudentAuth(): StudentAuthContextValue {
  const context = useContext(StudentAuthContext);
  if (!context) {
    throw new Error('useStudentAuth must be used within a StudentAuthProvider.');
  }
  return context;
}
