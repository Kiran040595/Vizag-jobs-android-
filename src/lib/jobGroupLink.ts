/** Default Instagram channel for daily Vizag job updates. */
export const DEFAULT_INSTAGRAM_CHANNEL_URL =
  'https://www.instagram.com/channel/Abb3Uh4CEdmuzv6D/';

export const normalizeGroupLink = (value = ''): string => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

export const getJobGroupLink = (job: { groupLink?: string | null } | null | undefined): string =>
  normalizeGroupLink(job?.groupLink || '');

export const getDailyUpdatesChannelUrl = (): string => DEFAULT_INSTAGRAM_CHANNEL_URL;

export const buildJobPublicUrl = (job: {
  slug?: string | null;
  id?: string;
} | null | undefined): string => {
  if (job?.slug) return `https://jobsinvizag.in/jobs/${encodeURIComponent(job.slug)}`;
  if (job?.id) return `https://jobsinvizag.in/jobs/${encodeURIComponent(job.id)}`;
  return 'https://jobsinvizag.in';
};
