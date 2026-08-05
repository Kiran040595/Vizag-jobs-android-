/**
 * Job alert preferences: local + cloud sync for signed-in students.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';
import { isSupabaseConfigured, supabase } from './supabaseClient';
import {
  downloadStudentJson,
  getAuthUserId,
  isMissingRelation,
  uploadStudentJson,
} from './studentCloudJson';
import { SITE_CONTACT_EMAIL } from './siteContact';

const LOCAL_KEY = 'vizagJobs_job_alerts_v1';
const CLOUD_FILE = 'job-alerts.json';

export type JobAlertPrefs = {
  email: string;
  categories: string[];
  pushEnabled: boolean;
  emailEnabled: boolean;
  updatedAt?: string;
};

export const DEFAULT_JOB_ALERT_PREFS: JobAlertPrefs = {
  email: '',
  categories: [],
  pushEnabled: true,
  emailEnabled: true,
};

const parsePrefs = (raw: string | null): JobAlertPrefs => {
  if (!raw) return { ...DEFAULT_JOB_ALERT_PREFS };
  try {
    const parsed = JSON.parse(raw);
    return {
      email: String(parsed.email || ''),
      categories: Array.isArray(parsed.categories)
        ? parsed.categories.map(String).filter(Boolean)
        : [],
      pushEnabled: parsed.pushEnabled !== false,
      emailEnabled: parsed.emailEnabled !== false,
      updatedAt: parsed.updatedAt ? String(parsed.updatedAt) : undefined,
    };
  } catch {
    return { ...DEFAULT_JOB_ALERT_PREFS };
  }
};

const writeLocal = async (prefs: JobAlertPrefs): Promise<void> => {
  await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(prefs));
};

const upsertTable = async (userId: string, prefs: JobAlertPrefs): Promise<boolean> => {
  if (!supabase) return false;
  const { error } = await supabase.from('job_alert_subscriptions').upsert(
    {
      user_id: userId,
      email: prefs.email || null,
      categories: prefs.categories,
      push_enabled: prefs.pushEnabled,
      email_enabled: prefs.emailEnabled,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
  if (error) {
    if (isMissingRelation(error.message)) return false;
    return false;
  }
  return true;
};

const fetchTable = async (userId: string): Promise<JobAlertPrefs | null> => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('job_alert_subscriptions')
    .select('email, categories, push_enabled, email_enabled, updated_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    if (isMissingRelation(error.message)) return null;
    return null;
  }
  if (!data) return null;
  return {
    email: String(data.email || ''),
    categories: Array.isArray(data.categories) ? data.categories.map(String) : [],
    pushEnabled: data.push_enabled !== false,
    emailEnabled: data.email_enabled !== false,
    updatedAt: data.updated_at ? String(data.updated_at) : undefined,
  };
};

export const getJobAlertPrefs = async (): Promise<JobAlertPrefs> => {
  const local = parsePrefs(await AsyncStorage.getItem(LOCAL_KEY));
  const userId = await getAuthUserId();
  if (!userId || !isSupabaseConfigured) return local;

  try {
    const fromTable = await fetchTable(userId);
    const fromFile =
      fromTable ||
      (await downloadStudentJson<JobAlertPrefs>(userId, CLOUD_FILE));
    if (!fromFile) return local;

    const merged: JobAlertPrefs = {
      email: fromFile.email || local.email,
      categories:
        fromFile.categories?.length > 0 ? fromFile.categories : local.categories,
      pushEnabled: fromFile.pushEnabled ?? local.pushEnabled,
      emailEnabled: fromFile.emailEnabled ?? local.emailEnabled,
      updatedAt: fromFile.updatedAt || local.updatedAt,
    };
    await writeLocal(merged);
    return merged;
  } catch {
    return local;
  }
};

export const saveJobAlertPrefs = async (prefs: JobAlertPrefs): Promise<JobAlertPrefs> => {
  const next: JobAlertPrefs = {
    ...prefs,
    email: prefs.email.trim(),
    categories: [...new Set(prefs.categories)],
    updatedAt: new Date().toISOString(),
  };
  await writeLocal(next);

  const userId = await getAuthUserId();
  if (userId) {
    const tableOk = await upsertTable(userId, next);
    if (!tableOk) {
      await uploadStudentJson(userId, CLOUD_FILE, next);
    }
  }
  return next;
};

/** Opens the same mailto subscribe flow used on jobsinvizag.in. */
export const openEmailSubscribeCompose = async (
  email?: string,
  categories: string[] = [],
): Promise<void> => {
  const categoryLine =
    categories.length > 0 ? categories.join(', ') : 'IT, fresher, etc.';
  const subject = encodeURIComponent('Subscribe to Vizag job alerts');
  const body = encodeURIComponent(
    `Hi,\n\nPlease add me to job alert updates for Visakhapatnam.\n\nMy email: ${email || ''}\nPreferred categories: ${categoryLine}\n`,
  );
  await Linking.openURL(`mailto:${SITE_CONTACT_EMAIL}?subject=${subject}&body=${body}`);
};

/** Guest subscribe: record via site_feedback when possible, always offer mailto. */
export const submitGuestJobAlertRequest = async ({
  email,
  categories,
}: {
  email: string;
  categories: string[];
}): Promise<{ submitted: boolean; usedFeedback: boolean }> => {
  const trimmed = email.trim();
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    throw new Error('Please enter a valid email address.');
  }

  let usedFeedback = false;
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('site_feedback').insert({
      feedback_type: 'feature_request',
      author_email: trimmed,
      author_name: null,
      author_user_id: null,
      body: `Job alert subscribe request. Categories: ${
        categories.length ? categories.join(', ') : 'all'
      }`,
      page_url: 'vizagjobs://job-alerts',
      wants_public: false,
      status: 'pending',
    });
    usedFeedback = !error;
  }

  return { submitted: true, usedFeedback };
};
