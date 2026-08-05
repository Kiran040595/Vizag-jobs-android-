/**
 * Saved-jobs store: local AsyncStorage + cloud sync when a student is signed in.
 *
 * Sync order:
 * 1. Local device cache (always)
 * 2. `student_saved_jobs` table when available (see supabase/migrations)
 * 3. Fallback: private storage file `{userId}/saved-jobs.json`
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Job } from '../types';
import { isSupabaseConfigured, supabase } from './supabaseClient';
import {
  downloadStudentJson,
  getAuthUserId,
  isMissingRelation,
  uploadStudentJson,
} from './studentCloudJson';

const STORAGE_KEY = 'vizagJobs_saved_v1';
const CLOUD_FILE = 'saved-jobs.json';

type SavedJobSnapshot = Job & { savedAt?: string };

const parseJobs = (raw: string | null): SavedJobSnapshot[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && item.id);
  } catch {
    return [];
  }
};

const writeLocal = async (jobs: SavedJobSnapshot[]): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
};

const readLocal = async (): Promise<SavedJobSnapshot[]> => {
  try {
    return parseJobs(await AsyncStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
};

const mergeById = (
  primary: SavedJobSnapshot[],
  secondary: SavedJobSnapshot[],
): SavedJobSnapshot[] => {
  const map = new Map<string, SavedJobSnapshot>();
  for (const job of [...secondary, ...primary]) {
    if (!job?.id) continue;
    map.set(String(job.id), job);
  }
  return Array.from(map.values()).sort((a, b) => {
    const aAt = a.savedAt ? Date.parse(a.savedAt) : 0;
    const bAt = b.savedAt ? Date.parse(b.savedAt) : 0;
    return bAt - aAt;
  });
};

const fetchFromTable = async (userId: string): Promise<SavedJobSnapshot[] | null> => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('student_saved_jobs')
    .select('job_id, job_snapshot, saved_at')
    .eq('user_id', userId)
    .order('saved_at', { ascending: false });

  if (error) {
    if (isMissingRelation(error.message)) return null;
    return null;
  }

  return (data || [])
    .map((row) => {
      const snapshot = (row.job_snapshot || {}) as SavedJobSnapshot;
      return {
        ...snapshot,
        id: String(row.job_id || snapshot.id || ''),
        savedAt: row.saved_at ? String(row.saved_at) : snapshot.savedAt,
      };
    })
    .filter((job) => job.id);
};

const replaceTableRows = async (
  userId: string,
  jobs: SavedJobSnapshot[],
): Promise<boolean> => {
  if (!supabase) return false;
  const { error: deleteError } = await supabase
    .from('student_saved_jobs')
    .delete()
    .eq('user_id', userId);
  if (deleteError) {
    if (isMissingRelation(deleteError.message)) return false;
    return false;
  }
  if (jobs.length === 0) return true;
  const { error } = await supabase.from('student_saved_jobs').insert(
    jobs.map((job) => ({
      user_id: userId,
      job_id: job.id,
      job_snapshot: job,
      saved_at: job.savedAt || new Date().toISOString(),
    })),
  );
  return !error;
};

const syncCloud = async (jobs: SavedJobSnapshot[], userId: string): Promise<void> => {
  const tableOk = await replaceTableRows(userId, jobs);
  if (!tableOk) {
    await uploadStudentJson(userId, CLOUD_FILE, { jobs, updatedAt: new Date().toISOString() });
  }
};

const pullCloud = async (userId: string): Promise<SavedJobSnapshot[]> => {
  const fromTable = await fetchFromTable(userId);
  if (fromTable) return fromTable;
  const fromFile = await downloadStudentJson<{ jobs?: SavedJobSnapshot[] }>(userId, CLOUD_FILE);
  return Array.isArray(fromFile?.jobs) ? fromFile.jobs.filter((j) => j?.id) : [];
};

/** Load saved jobs, merging cloud when signed in. */
export const getSavedJobs = async (): Promise<Job[]> => {
  const local = await readLocal();
  const userId = await getAuthUserId();
  if (!userId || !isSupabaseConfigured) return local;

  try {
    const remote = await pullCloud(userId);
    const merged = mergeById(local, remote);
    await writeLocal(merged);
    // Push merged set so devices converge
    void syncCloud(merged, userId);
    return merged;
  } catch {
    return local;
  }
};

export const getSavedJobIds = async (): Promise<string[]> => {
  const jobs = await getSavedJobs();
  return jobs.map((j) => j.id);
};

export const isJobSaved = async (jobId: string): Promise<boolean> => {
  const ids = await getSavedJobIds();
  return ids.includes(jobId);
};

/** Toggle a job's saved state; returns the new saved state. */
export const toggleSavedJob = async (job: Job): Promise<boolean> => {
  const jobs = await readLocal();
  const exists = jobs.some((j) => j.id === job.id);
  const next: SavedJobSnapshot[] = exists
    ? jobs.filter((j) => j.id !== job.id)
    : [{ ...job, savedAt: new Date().toISOString() }, ...jobs];
  await writeLocal(next);

  const userId = await getAuthUserId();
  if (userId) {
    void syncCloud(next, userId);
  }
  return !exists;
};

/** Force pull+merge from cloud (e.g. after sign-in). */
export const syncSavedJobsFromCloud = async (): Promise<Job[]> => getSavedJobs();
