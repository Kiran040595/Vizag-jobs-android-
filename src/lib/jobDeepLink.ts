import type { Job } from '../types';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Category landing path segments on jobsinvizag.in (not job slugs). */
const CATEGORY_LANDING_SEGMENTS = new Set([
  'it',
  'fresher',
  'part-time',
  'civil',
  'mechanical',
  'electrical',
  'ece',
  'engineering',
  'banking',
  'bpo',
  'sales',
  'hr',
  'healthcare',
  'education',
  'hospitality',
  'logistics',
  'latest',
  'non-it',
  'walk-in',
]);

export type JobDeepLinkParams = {
  jobId?: string;
  slug?: string;
};

/**
 * Parse public job URL paths from jobsinvizag.in / vizagjobs:// into
 * navigation params for JobDetails.
 *
 * Supported shapes:
 * - `/job/:slug`
 * - `/jobs/:id` (UUID)
 * - `/jobs/:slug` (when not a category landing)
 * - `/jobs/:segment/:slug`
 */
export const parseJobDeepLinkPath = (rawPath: string): JobDeepLinkParams | null => {
  const path = String(rawPath || '')
    .replace(/^https?:\/\/[^/]+/i, '')
    .replace(/^\/*/, '')
    .replace(/\/+$/, '')
    .split('?')[0]
    .split('#')[0];

  if (!path) return null;

  const parts = path.split('/').filter(Boolean);
  if (parts.length === 0) return null;

  if (parts[0] === 'job' && parts[1]) {
    const key = decodeURIComponent(parts[1]);
    return UUID_RE.test(key) ? { jobId: key } : { slug: key };
  }

  if (parts[0] === 'jobs') {
    if (parts.length === 2) {
      const key = decodeURIComponent(parts[1]);
      if (CATEGORY_LANDING_SEGMENTS.has(key.toLowerCase())) {
        return null;
      }
      return UUID_RE.test(key) ? { jobId: key } : { slug: key };
    }
    if (parts.length >= 3) {
      const key = decodeURIComponent(parts[parts.length - 1]);
      return UUID_RE.test(key) ? { jobId: key } : { slug: key };
    }
  }

  return null;
};

/** Minimal placeholder so JobDetails can mount before the full row loads. */
export const buildJobPlaceholder = (params: JobDeepLinkParams): Job => ({
  id: params.jobId || params.slug || 'loading',
  slug: params.slug,
  title: 'Loading…',
  company: null,
  location: null,
  category: null,
  jobType: null,
  salary: null,
});
