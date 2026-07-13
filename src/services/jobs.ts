/**
 * Job data service. Fetches published jobs from Supabase when configured,
 * otherwise returns bundled sample data so the app is fully runnable offline.
 *
 * The row -> UI mapping mirrors `processJobData` in the web app
 * (Kiran040595/vizag-jobs: src/services/jobs.js) so the same `jobs` table backs
 * both the website and this app.
 */
import type { Job } from '../types';
import { isSupabaseConfigured, jobsTable, supabase } from '../lib/supabaseClient';
import { SAMPLE_JOBS } from '../data/sampleJobs';

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
  'salary',
  'short_description',
  'description',
  'responsibilities',
  'eligibility',
  'skills',
  'company_logo_url',
  'source_name',
  'apply_link',
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

const processJobData = (row: Row): Job => ({
  id: String(row.id),
  slug: normalizeText(row.slug) ?? undefined,
  title: normalizeText(row.title, '') as string,
  company: normalizeText(row.company),
  location: normalizeText(row.location),
  category: normalizeText(row.category),
  jobType: normalizeText(row.job_type),
  workMode: normalizeText(row.work_mode),
  experience: normalizeText(row.experience),
  isFresher: row.is_fresher ? 'Yes' : 'No',
  isFeatured: Boolean(row.is_featured),
  salary: normalizeText(row.salary),
  shortDescription: normalizeText(row.short_description),
  description: normalizeText(row.description),
  responsibilities: normalizeText(row.responsibilities),
  eligibility: normalizeText(row.eligibility),
  skills: normalizeText(row.skills),
  companyLogoUrl: normalizeText(row.company_logo_url),
  sourceName: normalizeText(row.source_name),
  applyLink: normalizeText(row.apply_link),
  postedAt: normalizeText(row.posted_at),
  expiresAt: normalizeText(row.expires_at),
  status: normalizeText(row.status),
});

/** Public display window: jobs posted within the last 30 days (matches web). */
const minPostedAtIso = (): string =>
  new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

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
    const { data, error } = await supabase
      .from(jobsTable)
      .select(LIST_COLUMNS)
      .eq('status', 'published')
      .gte('posted_at', minPostedAtIso())
      .order('posted_at', { ascending: false })
      .limit(1000);

    if (error) throw error;
    const jobs = (data ?? []).map((row) => processJobData(row as unknown as Row));
    // If the table is empty or misconfigured, fall back so the UI still works.
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
