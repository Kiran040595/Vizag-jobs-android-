import * as Linking from 'expo-linking';
import { supabase } from './supabaseClient';

const parseParams = (url: string): Record<string, string> => {
  const params: Record<string, string> = {};
  try {
    const parsed = Linking.parse(url);
    if (parsed.queryParams) {
      for (const [key, value] of Object.entries(parsed.queryParams)) {
        if (typeof value === 'string') params[key] = value;
      }
    }
  } catch {
    // ignore parse failures
  }

  const hashIndex = url.indexOf('#');
  if (hashIndex >= 0) {
    const hash = url.slice(hashIndex + 1);
    for (const part of hash.split('&')) {
      const [rawKey, rawValue = ''] = part.split('=');
      if (rawKey) params[decodeURIComponent(rawKey)] = decodeURIComponent(rawValue);
    }
  }

  return params;
};

/** Exchange recovery / auth deep links into a Supabase session when possible. */
export const handleAuthDeepLink = async (url: string | null | undefined): Promise<boolean> => {
  if (!url || !supabase) return false;

  try {
    if (url.includes('code=')) {
      const { error } = await supabase.auth.exchangeCodeForSession(url);
      if (!error) return true;
    }

    const params = parseParams(url);
    const accessToken = params.access_token;
    const refreshToken = params.refresh_token;
    if (accessToken && refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (!error) return true;
    }
  } catch {
    return false;
  }

  return false;
};
