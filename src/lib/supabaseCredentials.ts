/**
 * Resolve Expo public Supabase env values, ignoring placeholders so a bad
 * `.env` (e.g. README's `<anon-key>`) cannot override production defaults.
 */
export const resolveSupabaseCredential = (
  value: string | undefined,
  fallback: string,
): string => {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  if (trimmed === 'undefined' || trimmed === 'null') return fallback;
  if (trimmed.includes('<') || trimmed.includes('>')) return fallback;
  if (/^(your-|changeme|replace|todo|xxx)/i.test(trimmed)) return fallback;
  return trimmed;
};
