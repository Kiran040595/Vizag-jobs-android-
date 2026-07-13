/**
 * Local saved-jobs store backed by AsyncStorage, mirroring the web app's
 * localStorage-based saved jobs (src/lib/savedJobs.js).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Job } from '../types';

const STORAGE_KEY = 'vizagJobs_saved_v1';

export const getSavedJobs = async (): Promise<Job[]> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
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
  const jobs = await getSavedJobs();
  const exists = jobs.some((j) => j.id === job.id);
  const next = exists ? jobs.filter((j) => j.id !== job.id) : [job, ...jobs];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return !exists;
};
