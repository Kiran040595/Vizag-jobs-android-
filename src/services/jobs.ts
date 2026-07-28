/**
 * Job data service. Fetches published jobs from the Vizag Jobs Supabase
 * project (same `jobs` table as jobsinvizag.in). Falls back to bundled sample
 * data only when a live fetch fails so the UI still works offline.
 *
 * Mapping mirrors `processJobData` / list vs detail column split in the web app
 * (Kiran040595/vizag-jobs: src/services/jobs.js).
 */
import type { Job } from '../types';
import { isSupabaseConfigured, jobsTable, supabase } from '../lib/supabaseClient';
import { getMinPostedAtIsoForPublicDisplay } from '../lib/jobDisplayWindow';
import { SAMPLE_JOBS } from '../data/sampleJobs';

/** Supabase/PostgREST page size for paginated job list fetches (matches web). */
const JOB_LIST_PAGE_SIZE = 1000;

/**
 * Slim column allow-list for listing queries — home-page card, filters, search,
 * and freshness. Heavy fields load on the detail screen via `fetchJobById`.
 */
const LIST_COLUMNS = [
  'id',
  'slug',
  'title',
  'company',
  'location',
  'category',
  'job_type',
  'work_mode',
  'experience',
  'is_fresher',
  'is_featured',
  'is_instagram',
  'group_link',
  'salary',
  'short_description',
  'skills',
  'company_logo_url',
  'source_name',
  'posted_at',
  'expires_at',
  'status',
].join(', ');

const normalizeText = (value: unknown, fallback: string | null = null): string | null => {
  if (value === null || value === undefined) return fallback;
  if (Array.isArray(value)) return value.filter(Boolean).join(', ');
  return String(value);
};

type Row = Record<string, unknown>;

const processJobData = (row: Row, index = 0): Job => ({
  id: String(row.id ?? `supabase-job-${index + 1}`),
  slug: normalizeText(row.slug) ?? undefined,
  title: normalizeText(row.title, '') as string,
  company: normalizeText(row.company),
  location: normalizeText(row.location, 'Visakhapatnam'),
  category: normalizeText(row.category),
  jobType: normalizeText(row.job_type),
  workMode: normalizeText(row.work_mode),
  experience: normalizeText(row.experience),
  isFresher: row.is_fresher ? 'Yes' : 'No',
  isFeatured: Boolean(row.is_featured),
  isInstagram: Boolean(row.is_instagram),
  groupLink: normalizeText(row.group_link),
  salary: normalizeText(row.salary),
  shortDescription: normalizeText(row.short_description),
  description: normalizeText(row.description),
  responsibilities: normalizeText(row.responsibilities),
  eligibility: normalizeText(row.eligibility),
  warning: normalizeText(row.warning),
  skills: normalizeText(row.skills),
  companyLogoUrl: normalizeText(row.company_logo_url),
  sourceName: normalizeText(row.source_name),
  sourceUrl: normalizeText(row.source_url),
  applyLink: normalizeText(row.apply_link),
  applyMode: row.apply_mode === 'internal' ? 'internal' : 'external',
  postedAt: normalizeText(row.posted_at),
  expiresAt: normalizeText(row.expires_at),
  status: normalizeText(row.status),
});

const fetchJobsPaginated = async (): Promise<Row[]> => {
  if (!supabase) return [];

  const minPostedAt = getMinPostedAtIsoForPublicDisplay();
  let offset = 0;
  const allRows: Row[] = [];

  while (true) {
    const from = offset;
    const to = offset + JOB_LIST_PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from(jobsTable)
      .select(LIST_COLUMNS)
      .eq('status', 'published')
      .gte('posted_at', minPostedAt)
      .order('is_featured', { ascending: false })
      .order('posted_at', { ascending: false })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    if (!Array.isArray(data) || data.length === 0) break;

    allRows.push(...(data as unknown as Row[]));
    if (data.length < JOB_LIST_PAGE_SIZE) break;
    offset += JOB_LIST_PAGE_SIZE;
  }

  return allRows;
};

export interface FetchResult {
  jobs: Job[];
  usingSampleData: boolean;
  error?: string;
}

export const fetchJobs = async (): Promise<FetchResult> => {
  if (!isSupabaseConfigured || !supabase) {
    return { jobs: SAMPLE_JOBS, usingSampleData: true };
  }

  try {
    const rows = await fetchJobsPaginated();
    const jobs = rows.map((row, index) => processJobData(row, index));
    if (jobs.length === 0) {
      return { jobs: SAMPLE_JOBS, usingSampleData: true };
    }
    return { jobs, usingSampleData: false };
  } catch (err) {
    return {
      jobs: SAMPLE_JOBS,
      usingSampleData: true,
      error: err instanceof Error ? err.message : 'Failed to load jobs',
    };
  }
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Fetch a single published job by UUID `id` or `slug` (full row for detail UI).
 * Returns null when no matching published job exists in the public display window.
 */
export const fetchJobById = async (idOrSlug: string): Promise<Job | null> => {
  if (!idOrSlug || !isSupabaseConfigured || !supabase) return null;

  const key = String(idOrSlug);
  const lookupColumn = UUID_RE.test(key) ? 'id' : 'slug';

  try {
    const { data, error } = await supabase
      .from(jobsTable)
      .select('*')
      .eq(lookupColumn, key)
      .eq('status', 'published')
      .gte('posted_at', getMinPostedAtIsoForPublicDisplay())
      .limit(1);

    if (error) throw error;
    const row = Array.isArray(data) && data.length > 0 ? (data[0] as Row) : null;
    return row ? processJobData(row, 0) : null;
  } catch {
    return null;
  }
};
