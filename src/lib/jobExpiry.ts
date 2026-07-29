import type { Job } from '../types';

/** True when the job has an expires_at in the past. */
export const isJobExpired = (job: Pick<Job, 'expiresAt'> | null | undefined): boolean => {
  const expiresAt = job?.expiresAt;
  if (!expiresAt) return false;
  const expires = new Date(expiresAt);
  return !Number.isNaN(expires.getTime()) && expires.getTime() < Date.now();
};
