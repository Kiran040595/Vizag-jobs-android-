import * as Linking from 'expo-linking';

/** Deep-link redirect target for Supabase auth emails (password reset, confirm). */
export const getAuthRedirectUrl = (path: string): string => {
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  return Linking.createURL(normalized);
};
