/**
 * Supabase client, mirroring the web app (src/lib/supabaseClient.js).
 *
 * Credentials are read from Expo public env vars. When they are absent the app
 * falls back to bundled sample data (see services/jobs.ts), so it runs fully
 * offline until real Supabase credentials are provided.
 *
 * Auth sessions persist via AsyncStorage so students stay signed in.
 */
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        storage: AsyncStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;

export const jobsTable = process.env.EXPO_PUBLIC_SUPABASE_JOBS_TABLE || 'jobs';
