/**
 * Supabase client, mirroring the web app (src/lib/supabaseClient.js).
 *
 * Credentials are read from Expo public env vars. Invalid / placeholder values
 * (e.g. README's `<anon-key>`) are ignored so the app always falls back to the
 * production Vizag Jobs project (same public anon key embedded in the
 * jobsinvizag.in web bundle). Bundled sample data is only used when a live
 * fetch fails (see services/jobs.ts).
 *
 * Auth sessions persist via AsyncStorage so students stay signed in.
 *
 * Set these in a `.env` file (see `.env.example`) to override:
 *   EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
 */
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { resolveSupabaseCredential } from './supabaseCredentials';

/** Production Vizag Jobs project (jobsinvizag.in) — public anon credentials. */
const PRODUCTION_SUPABASE_URL = 'https://fbyyfyhdglcpkhxskffj.supabase.co';
const PRODUCTION_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieXlmeWhkZ2xjcGtoeHNrZmZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMjQyMDUsImV4cCI6MjA5MjgwMDIwNX0.FN1Xt_j6LkPbS1zI77f6nL1aJlnR1q5EhK7z4AsqU5Q';

const supabaseUrl = resolveSupabaseCredential(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  PRODUCTION_SUPABASE_URL,
);
const supabaseAnonKey = resolveSupabaseCredential(
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  PRODUCTION_SUPABASE_ANON_KEY,
);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Shared client for public job reads and student auth/apply.
 * Session persistence keeps students signed in across app restarts.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;

export const jobsTable = resolveSupabaseCredential(
  process.env.EXPO_PUBLIC_SUPABASE_JOBS_TABLE,
  'jobs',
);

/** Exposed for diagnostics in the sample-data banner. */
export const supabaseHost = (() => {
  try {
    return new URL(supabaseUrl).host;
  } catch {
    return supabaseUrl;
  }
})();
