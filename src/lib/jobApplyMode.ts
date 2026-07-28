export const APPLY_MODE_EXTERNAL = 'external';
export const APPLY_MODE_INTERNAL = 'internal';

export type ApplyMode = typeof APPLY_MODE_EXTERNAL | typeof APPLY_MODE_INTERNAL;

export const isInternalApplyJob = (job: { applyMode?: string | null } | null | undefined): boolean =>
  job?.applyMode === APPLY_MODE_INTERNAL;

export const isExternalApplyJob = (job: { applyMode?: string | null } | null | undefined): boolean =>
  !isInternalApplyJob(job);

export const jobSupportsApply = (job: { applyMode?: string | null; applyLink?: string | null } | null | undefined): boolean => {
  if (!job) return false;
  if (isInternalApplyJob(job)) return true;
  return Boolean(job.applyLink);
};

export const applyButtonLabel = (job: { applyMode?: string | null } | null | undefined): string =>
  isInternalApplyJob(job) ? 'Apply on Vizag Jobs' : 'Apply Now';
