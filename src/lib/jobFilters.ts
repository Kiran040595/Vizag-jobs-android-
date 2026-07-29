/**
 * Pure job-list filter helpers, ported from the web app
 * (Kiran040595/vizag-jobs: src/lib/jobFilters.js).
 *
 * Filtering is client-side over the in-memory job list so search, category,
 * job-type and freshness all compose predictably.
 */
import type { Filters, Job } from '../types';
import { jobMatchesCategoryFilter, normalizeJobCategory } from '../data/categories';

export const PAGE_SIZE = 12;

export interface Option {
  id: string;
  label: string;
  hours?: number;
}

export const JOB_TYPE_OPTIONS: Option[] = [
  { id: 'all', label: 'All' },
  { id: 'full-time', label: 'Full-Time' },
  { id: 'part-time', label: 'Part-Time' },
  { id: 'internship', label: 'Internship' },
  { id: 'contract', label: 'Contract' },
];

export const FRESHNESS_OPTIONS: Option[] = [
  { id: 'all', label: 'Anytime' },
  { id: '24h', label: 'Last 24 hours', hours: 24 },
  { id: '7d', label: 'Last 7 days', hours: 24 * 7 },
  { id: '30d', label: 'Last 30 days', hours: 24 * 30 },
];

export const DEFAULT_FILTERS: Filters = Object.freeze({
  q: '',
  category: 'all',
  jobType: 'all',
  freshness: 'all',
  instagramOnly: false,
});

export const isAnyFilterActive = (filters: Filters): boolean =>
  Boolean((filters.q ?? '').trim()) ||
  filters.category !== 'all' ||
  filters.jobType !== 'all' ||
  filters.freshness !== 'all' ||
  Boolean(filters.instagramOnly);

const matchesSearchText = (job: Job, q: string): boolean => {
  if (!q) return true;
  const blob = [
    job.title,
    job.company,
    job.skills,
    job.shortDescription,
    job.category,
    normalizeJobCategory(job.category),
    job.location,
    job.experience,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  return tokens.every((token) => blob.includes(token));
};

const normalizeJobType = (value: string | null | undefined): string =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .trim();

const matchesJobType = (job: Job, wanted: string): boolean => {
  if (wanted === 'all') return true;
  const v = normalizeJobType(job.jobType);
  if (!v) return false;
  if (v === wanted) return true;
  if (wanted === 'internship' && v.startsWith('intern')) return true;
  if (wanted === 'full-time' && (v === 'fulltime' || v === 'full')) return true;
  if (wanted === 'part-time' && (v === 'parttime' || v === 'part')) return true;
  return false;
};

const matchesFreshness = (job: Job, freshnessId: string): boolean => {
  if (freshnessId === 'all') return true;
  const option = FRESHNESS_OPTIONS.find((o) => o.id === freshnessId);
  if (!option?.hours) return true;
  if (!job.postedAt) return false;
  const postedMs = new Date(job.postedAt).getTime();
  if (Number.isNaN(postedMs)) return false;
  const cutoff = Date.now() - option.hours * 60 * 60 * 1000;
  return postedMs >= cutoff;
};

/** Apply all active filters to the in-memory job list. */
export const applyJobFilters = (jobs: Job[], filters: Filters): Job[] => {
  const q = (filters.q ?? '').trim().toLowerCase();
  return jobs.filter(
    (job) =>
      matchesSearchText(job, q) &&
      jobMatchesCategoryFilter(job, filters.category) &&
      matchesJobType(job, filters.jobType) &&
      matchesFreshness(job, filters.freshness) &&
      (!filters.instagramOnly || Boolean(job.isInstagram)),
  );
};

/** Slice a filtered list into a 1-based page of PAGE_SIZE items. */
export const paginate = <T,>(items: T[], page: number, pageSize = PAGE_SIZE): T[] => {
  const start = Math.max(page - 1, 0) * pageSize;
  return items.slice(start, start + pageSize);
};
