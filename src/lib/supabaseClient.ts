/**
 * Supabase client, mirroring the web app (src/lib/supabaseClient.js).
 *
 * Credentials are read from Expo public env vars. When they are absent the app
 * falls back to the production Vizag Jobs project (same public anon key embedded
 * in the jobsinvizag.in web bundle), so list/detail screens stay live by default.
 * Bundled sample data is only used when a live fetch fails (see services/jobs.ts).
 *
 * Set these in a `.env` file (see `.env.example`) to override:
 *   EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
 */
import 'react-native-url-polyfill/auto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/** Production Vizag Jobs project (jobsinvizag.in) — public anon credentials. */
const PRODUCTION_SUPABASE_URL = 'https://fbyyfyhdglcpkhxskffj.supabase.co';
const PRODUCTION_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieXlmeWhkZ2xjcGtoeHNrZmZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMjQyMDUsImV4cCI6MjA5MjgwMDIwNX0.FN1Xt_j6LkPbS1zI77f6nL1aJlnR1q5EhK7z4AsqU5Q';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || PRODUCTION_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || PRODUCTION_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Anon-only client for public reads (job lists, detail pages).
 * Matches web `supabasePublic`: no session persist / refresh so lists never
 * block on auth lock.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storageKey: 'vizagjobs-public-anon',
      },
    })
  : null;

export const jobsTable = process.env.EXPO_PUBLIC_SUPABASE_JOBS_TABLE || 'jobs';
