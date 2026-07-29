/**
 * Expo app config. Ensures production Vizag Jobs Supabase credentials are always
 * available to Metro/Gradle JS bundles — even when no `.env` is present, and even
 * when a local `.env` still has README placeholders like `<anon-key>`.
 *
 * Override with real EXPO_PUBLIC_SUPABASE_* values in `.env` when pointing at a
 * non-production project.
 */
const appJson = require('./app.json');

const PRODUCTION_SUPABASE_URL = 'https://fbyyfyhdglcpkhxskffj.supabase.co';
const PRODUCTION_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieXlmeWhkZ2xjcGtoeHNrZmZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMjQyMDUsImV4cCI6MjA5MjgwMDIwNX0.FN1Xt_j6LkPbS1zI77f6nL1aJlnR1q5EhK7z4AsqU5Q';

const isUsable = (value) => {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed === 'undefined' || trimmed === 'null') return false;
  // README / docs placeholders must not override production defaults.
  if (trimmed.includes('<') || trimmed.includes('>')) return false;
  if (/^(your-|changeme|replace|todo|xxx)/i.test(trimmed)) return false;
  return true;
};

const supabaseUrl = isUsable(process.env.EXPO_PUBLIC_SUPABASE_URL)
  ? process.env.EXPO_PUBLIC_SUPABASE_URL.trim()
  : PRODUCTION_SUPABASE_URL;
const supabaseAnonKey = isUsable(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY)
  ? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY.trim()
  : PRODUCTION_SUPABASE_ANON_KEY;
const jobsTable = isUsable(process.env.EXPO_PUBLIC_SUPABASE_JOBS_TABLE)
  ? process.env.EXPO_PUBLIC_SUPABASE_JOBS_TABLE.trim()
  : 'jobs';

// Make Expo's env inliner embed the resolved values into the JS bundle for
// both `expo start` and native release/debug APK builds.
process.env.EXPO_PUBLIC_SUPABASE_URL = supabaseUrl;
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = supabaseAnonKey;
process.env.EXPO_PUBLIC_SUPABASE_JOBS_TABLE = jobsTable;

module.exports = {
  ...appJson.expo,
  android: {
    ...appJson.expo.android,
    permissions: ['INTERNET', 'ACCESS_NETWORK_STATE'],
  },
  extra: {
    supabaseUrl,
    supabaseAnonKey,
    jobsTable,
  },
};
