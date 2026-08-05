import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

const ADMIN_ACCESS_CACHE_TTL_MS = 15 * 60 * 1000;
const ADMIN_ACCESS_CACHE_KEY = 'vizagjobs:admin-access-cache';

type AdminAuthContextValue = {
  authError: string;
  isAdmin: boolean;
  isLoading: boolean;
  isSupabaseConfigured: boolean;
  refreshAdminAccess: (userId: string) => Promise<boolean>;
  session: Session | null;
  signIn: (args: { email: string; password: string }) => Promise<unknown>;
  signOut: () => Promise<void>;
  user: User | null;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

const readAdminAccessCache = async (userId: string): Promise<boolean | null> => {
  try {
    const rawValue = await AsyncStorage.getItem(ADMIN_ACCESS_CACHE_KEY);
    if (!rawValue) return null;
    const cached = JSON.parse(rawValue) as {
      userId?: string;
      isAdmin?: boolean;
      expiresAt?: number;
    };
    if (cached.userId !== userId) return null;
    if (typeof cached.expiresAt !== 'number' || cached.expiresAt <= Date.now()) {
      await AsyncStorage.removeItem(ADMIN_ACCESS_CACHE_KEY);
      return null;
    }
    return Boolean(cached.isAdmin);
  } catch {
    return null;
  }
};

const writeAdminAccessCache = async (userId: string, isAdmin: boolean) => {
  try {
    await AsyncStorage.setItem(
      ADMIN_ACCESS_CACHE_KEY,
      JSON.stringify({
        userId,
        isAdmin,
        expiresAt: Date.now() + ADMIN_ACCESS_CACHE_TTL_MS,
      }),
    );
  } catch {
    // Keep auth usable when local storage is unavailable.
  }
};

const clearAdminAccessCache = async () => {
  try {
    await AsyncStorage.removeItem(ADMIN_ACCESS_CACHE_KEY);
  } catch {
    // Keep sign-out usable when local storage is unavailable.
  }
};

const getAdminMembership = async (userId: string): Promise<boolean> => {
  if (!supabase || !userId) return false;
  const { data, error } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data?.user_id);
};

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(() => isSupabaseConfigured && Boolean(supabase));
  const [authError, setAuthError] = useState('');

  const refreshAdminAccess = useCallback(async (userId: string) => {
    const access = await getAdminMembership(userId);
    setIsAdmin(access);
    await writeAdminAccessCache(userId, access);
    return access;
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return undefined;
    let isMounted = true;

    const syncSession = async (nextSession: Session | null, showLoader = false) => {
      if (!isMounted) return;
      if (showLoader) setIsLoading(true);
      setAuthError('');
      setSession(nextSession);

      if (!nextSession?.user) {
        setIsAdmin(false);
        await clearAdminAccessCache();
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const cached = await readAdminAccessCache(nextSession.user.id);
        const access = cached ?? (await getAdminMembership(nextSession.user.id));
        if (!isMounted) return;
        setIsAdmin(access);
        await writeAdminAccessCache(nextSession.user.id, access);
      } catch (error) {
        if (!isMounted) return;
        setIsAdmin(false);
        setAuthError(error instanceof Error ? error.message : 'Could not verify admin access.');
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
  }, []);

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
        const access = await refreshAdminAccess(data.session.user.id);
        setIsLoading(false);
        if (!access) {
          await supabase.auth.signOut();
          throw new Error('This account does not have admin access.');
        }
      }
      return data;
    },
    [refreshAdminAccess],
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    await clearAdminAccessCache();
  }, []);

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      authError,
      isAdmin,
      isLoading,
      isSupabaseConfigured,
      refreshAdminAccess,
      session,
      signIn,
      signOut,
      user: session?.user ?? null,
    }),
    [authError, isAdmin, isLoading, refreshAdminAccess, session, signIn, signOut],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthContextValue {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error('useAdminAuth must be used within an AdminAuthProvider.');
  return context;
}
