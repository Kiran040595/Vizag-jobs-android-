/**
 * Public-facing Job shape consumed by the UI.
 *
 * Mirrors the shape produced by the web app's `processJobData` mapping in
 * `src/services/jobs.js` (Kiran040595/vizag-jobs), so the same Supabase `jobs`
 * table can back both the website and this React Native app.
 */
export interface Job {
  id: string;
  slug?: string;
  title: string;
  company: string | null;
  location: string | null;
  category: string | null;
  jobType: string | null;
  workMode?: string | null;
  experience?: string | null;
  isFresher?: string; // 'Yes' | 'No'
  isFeatured?: boolean;
  isInstagram?: boolean;
  groupLink?: string | null;
  salary: string | null;
  shortDescription?: string | null;
  description?: string | null;
  responsibilities?: string | null;
  eligibility?: string | null;
  warning?: string | null;
  skills?: string | null;
  companyLogoUrl?: string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
  applyLink?: string | null;
  applyMode?: 'internal' | 'external';
  postedAt?: string | null; // ISO timestamp
  expiresAt?: string | null;
  status?: string | null;
}

export interface Filters {
  q: string;
  category: string;
  jobType: string;
  freshness: string;
}
