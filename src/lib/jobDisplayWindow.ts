/** Published jobs older than this many days are hidden from the public app. */
export const JOB_DISPLAY_MAX_AGE_DAYS = 30;

/** Minimum `posted_at` (inclusive) for jobs shown in the app (matches web). */
export const getMinPostedAtIsoForPublicDisplay = (): string => {
  const ms = JOB_DISPLAY_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  return new Date(Date.now() - ms).toISOString();
};

export const isPostedAtWithinPublicDisplayWindow = (
  postedAtIso: string | null | undefined,
): boolean => {
  if (!postedAtIso) return false;
  return new Date(postedAtIso).getTime() >= new Date(getMinPostedAtIsoForPublicDisplay()).getTime();
};
