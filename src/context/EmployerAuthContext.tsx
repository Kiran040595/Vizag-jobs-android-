import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session, User } from '@supabase/supabase-js';
import { getAuthRedirectUrl } from '../lib/authRedirect';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

const EMPLOYER_ACCESS_CACHE_TTL_MS = 15 * 60 * 1000;
const EMPLOYER_ACCESS_CACHE_KEY = 'vizagjobs:employer-access-cache';

export type EmployerProfile = {
  user_id: string;
  company_name: string;
  contact_name?: string | null;
  contact_email?: string | null;
  phone?: string | null;
  website?: string | null;
  company_logo_url?: string | null;
  is_active?: boolean | null;
  [key: string]: unknown;
};

type EmployerAccess = {
  isEmployer: boolean;
  profile: EmployerProfile | null;
};

type EmployerAuthContextValue = EmployerAccess & {
  authError: string;
  isLoading: boolean;
  isSupabaseConfigured: boolean;
  refreshEmployerAccess: (userId: string) => Promise<EmployerAccess>;
  requestPasswordReset: (email: string) => Promise<void>;
  session: Session | null;
  signIn: (args: { email: string; password: string }) => Promise<unknown>;
  signOut: () => Promise<void>;
  signUp: (args: { email: string; password: string; companyName: string }) => Promise<unknown>;
  updatePassword: (password: string) => Promise<void>;
  user: User | null;
};

const EmployerAuthContext = createContext<EmployerAuthContextValue | null>(null);

const readEmployerAccessCache = async (userId: string): Promise<EmployerAccess | null> => {
  try {
    const rawValue = await AsyncStorage.getItem(EMPLOYER_ACCESS_CACHE_KEY);
    if (!rawValue) return null;
    const cached = JSON.parse(rawValue) as {
      userId?: string;
      isEmployer?: boolean;
      profile?: EmployerProfile | null;
      expiresAt?: number;
    };
    if (cached.userId !== userId) return null;
    if (typeof cached.expiresAt !== 'number' || cached.expiresAt <= Date.now()) {
      await AsyncStorage.removeItem(EMPLOYER_ACCESS_CACHE_KEY);
      return null;
    }
    return {
      isEmployer: Boolean(cached.isEmployer),
      profile: cached.profile ?? null,
    };
  } catch {
    return null;
  }
};

const writeEmployerAccessCache = async (userId: string, access: EmployerAccess) => {
  try {
    await AsyncStorage.setItem(
      EMPLOYER_ACCESS_CACHE_KEY,
      JSON.stringify({
        userId,
        ...access,
        expiresAt: Date.now() + EMPLOYER_ACCESS_CACHE_TTL_MS,
      }),
    );
  } catch {
    // Keep auth usable when local storage is unavailable.
  }
};

const clearEmployerAccessCache = async () => {
  try {
    await AsyncStorage.removeItem(EMPLOYER_ACCESS_CACHE_KEY);
  } catch {
    // Keep sign-out usable when local storage is unavailable.
  }
};

const getEmployerAccess = async (userId: string): Promise<EmployerAccess> => {
  if (!supabase || !userId) return { isEmployer: false, profile: null };

  const { data, error } = await supabase
    .from('employer_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;

  const profile = (data as EmployerProfile | null) ?? null;
  return {
    isEmployer: Boolean(profile?.user_id && profile.is_active !== false),
    profile,
  };
};

export function EmployerAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isEmployer, setIsEmployer] = useState(false);
  const [profile, setProfile] = useState<EmployerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(() => isSupabaseConfigured && Boolean(supabase));
  const [authError, setAuthError] = useState('');

  const applyAccess = useCallback((access: EmployerAccess) => {
    setIsEmployer(access.isEmployer);
    setProfile(access.profile);
  }, []);

  const refreshEmployerAccess = useCallback(
    async (userId: string) => {
      const access = await getEmployerAccess(userId);
      applyAccess(access);
      await writeEmployerAccessCache(userId, access);
      return access;
    },
    [applyAccess],
  );

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return undefined;
    let isMounted = true;

    const syncSession = async (nextSession: Session | null, showLoader = false) => {
      if (!isMounted) return;
      if (showLoader) setIsLoading(true);
      setAuthError('');
      setSession(nextSession);

      if (!nextSession?.user) {
        applyAccess({ isEmployer: false, profile: null });
        await clearEmployerAccessCache();
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const cached = await readEmployerAccessCache(nextSession.user.id);
        const access = cached ?? (await getEmployerAccess(nextSession.user.id));
        if (!isMounted) return;
        applyAccess(access);
        await writeEmployerAccessCache(nextSession.user.id, access);
      } catch (error) {
        if (!isMounted) return;
        applyAccess({ isEmployer: false, profile: null });
        setAuthError(error instanceof Error ? error.message : 'Could not verify employer access.');
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
      void syncSession(data.session, true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      const showLoader = ['SIGNED_OUT', 'USER_UPDATED', 'PASSWORD_RECOVERY'].includes(event);
      void syncSession(nextSession, showLoader);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [applyAccess]);

  const signIn = useCallback(
    async ({ email, password }: { email: string; password: string }) => {
      if (!supabase) throw new Error('Supabase is not configured.');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: String(email || '').trim().toLowerCase(),
        password,
      });
      if (error) throw error;
      if (data.session?.user) {
        setSession(data.session);
        const access = await refreshEmployerAccess(data.session.user.id);
        setIsLoading(false);
        if (!access.isEmployer) {
          await supabase.auth.signOut();
          throw new Error('This account is not an active employer account.');
        }
      }
      return data;
    },
    [refreshEmployerAccess],
  );

  const signUp = useCallback(
    async ({
      email,
      password,
      companyName,
    }: {
      email: string;
      password: string;
      companyName: string;
    }) => {
      if (!supabase) throw new Error('Supabase is not configured.');
      const trimmedEmail = String(email || '').trim().toLowerCase();
      const trimmedCompany = String(companyName || '').trim();
      if (!trimmedCompany) throw new Error('Company name is required.');
      if (password.length < 6) throw new Error('Password must be at least 6 characters.');

      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: { user_type: 'employer', company_name: trimmedCompany },
          emailRedirectTo: getAuthRedirectUrl('employer/login'),
        },
      });
      if (error) throw error;
      if (data.session?.user) {
        setSession(data.session);
        await refreshEmployerAccess(data.session.user.id);
        setIsLoading(false);
      }
      return data;
    },
    [refreshEmployerAccess],
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    await clearEmployerAccessCache();
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    if (!supabase) throw new Error('Supabase is not configured.');
    const trimmed = String(email || '').trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      throw new Error('Enter the email address for your employer account.');
    }
    const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: getAuthRedirectUrl('employer/reset-password'),
    });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    if (!supabase) throw new Error('Supabase is not configured.');
    if (String(password || '').length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  }, []);

  const value = useMemo<EmployerAuthContextValue>(
    () => ({
      authError,
      isEmployer,
      isLoading,
      isSupabaseConfigured,
      profile,
      refreshEmployerAccess,
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
      isEmployer,
      isLoading,
      profile,
      refreshEmployerAccess,
      requestPasswordReset,
      session,
      signIn,
      signOut,
      signUp,
      updatePassword,
    ],
  );

  return <EmployerAuthContext.Provider value={value}>{children}</EmployerAuthContext.Provider>;
}

export function useEmployerAuth(): EmployerAuthContextValue {
  const context = useContext(EmployerAuthContext);
  if (!context) {
    throw new Error('useEmployerAuth must be used within an EmployerAuthProvider.');
  }
  return context;
}
