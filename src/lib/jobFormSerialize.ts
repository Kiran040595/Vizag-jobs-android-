/**
 * Shared job form serialize/deserialize helpers (slim port of web adminJobs.js).
 */

export type JobFormValues = {
  slug: string;
  title: string;
  company: string;
  location: string;
  category: string;
  job_type: string;
  work_mode: string;
  experience: string;
  is_fresher: boolean;
  salary: string;
  apply_link: string;
  apply_mode: 'internal' | 'external';
  short_description: string;
  description: string;
  responsibilities: string;
  eligibility: string;
  warning: string;
  posted_at: string;
  expires_at: string;
  source_name: string;
  source_url: string;
  skills: string;
  company_logo_url: string;
  status: string;
  is_featured: boolean;
  is_instagram: boolean;
  group_link: string;
};

const MULTILINE_FIELDS = ['responsibilities', 'eligibility', 'skills'] as const;
const OPTIONAL_TEXT_FIELDS = [
  'salary',
  'apply_link',
  'short_description',
  'description',
  'warning',
  'source_name',
  'source_url',
  'company_logo_url',
  'work_mode',
  'group_link',
] as const;

const REQUIRED_DEFAULTS = {
  location: 'Visakhapatnam',
  experience: '',
};

export const slugify = (value: string): string =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

export const createSuggestedSlug = ({
  title,
  company,
  postedAt,
}: {
  title?: string;
  company?: string;
  postedAt?: string;
}): string => {
  const parts = [title, company];
  const date = postedAt ? new Date(postedAt) : null;
  if (date && !Number.isNaN(date.getTime())) {
    parts.push(date.toISOString().slice(0, 10));
  }
  return slugify(parts.filter(Boolean).join(' '));
};

const normalizeText = (value: unknown): string => String(value || '').trim();

const normalizeOptionalText = (value: unknown): string | null => {
  const next = normalizeText(value);
  return next || null;
};

const normalizeLineItems = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }
  return String(value || '')
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const toIsoString = (value: unknown): string | null => {
  const normalized = normalizeText(value);
  if (!normalized) return null;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const toBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  const text = String(value || '').trim().toLowerCase();
  return text === 'true' || text === '1' || text === 'yes';
};

export const getEmptyJobForm = (): JobFormValues => {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  return {
    slug: '',
    title: '',
    company: '',
    location: REQUIRED_DEFAULTS.location,
    category: '',
    job_type: '',
    work_mode: '',
    experience: REQUIRED_DEFAULTS.experience,
    is_fresher: false,
    salary: '',
    apply_link: '',
    apply_mode: 'external',
    short_description: '',
    description: '',
    responsibilities: '',
    eligibility: '',
    warning: '',
    posted_at: localDate,
    expires_at: '',
    source_name: '',
    source_url: '',
    skills: '',
    company_logo_url: '',
    status: 'draft',
    is_featured: false,
    is_instagram: false,
    group_link: '',
  };
};

export const serializeJobForm = (
  values: JobFormValues,
  statusOverride?: string,
): Record<string, unknown> => {
  const payload: Record<string, unknown> = {
    slug: normalizeText(values.slug),
    title: normalizeText(values.title),
    company: normalizeText(values.company),
    location: normalizeText(values.location) || REQUIRED_DEFAULTS.location,
    category: normalizeText(values.category),
    job_type: normalizeText(values.job_type),
    work_mode: normalizeOptionalText(values.work_mode),
    experience: normalizeText(values.experience) || REQUIRED_DEFAULTS.experience,
    is_fresher: toBoolean(values.is_fresher),
    posted_at: toIsoString(values.posted_at) || new Date().toISOString(),
    expires_at: toIsoString(values.expires_at),
    status: statusOverride || values.status || 'draft',
    is_featured: toBoolean(values.is_featured),
    is_instagram: toBoolean(values.is_instagram),
    group_link: normalizeOptionalText(values.group_link),
    apply_mode: values.apply_mode === 'internal' ? 'internal' : 'external',
  };

  for (const field of OPTIONAL_TEXT_FIELDS) {
    if (!(field in payload)) {
      payload[field] = normalizeOptionalText(values[field]);
    }
  }

  for (const field of MULTILINE_FIELDS) {
    payload[field] = normalizeLineItems(values[field]);
  }

  if (payload.apply_mode === 'internal') {
    payload.apply_link = null;
  }

  return payload;
};

export const deserializeJobForForm = (job: Record<string, unknown>): JobFormValues => {
  const formValues = getEmptyJobForm();
  return {
    ...formValues,
    slug: String(job.slug || ''),
    title: String(job.title || ''),
    company: String(job.company || ''),
    location: String(job.location || formValues.location),
    category: String(job.category || ''),
    job_type: String(job.job_type || ''),
    work_mode: String(job.work_mode || ''),
    experience: String(job.experience || ''),
    is_fresher: Boolean(job.is_fresher),
    salary: String(job.salary || ''),
    apply_link: String(job.apply_link || ''),
    apply_mode: job.apply_mode === 'internal' ? 'internal' : 'external',
    short_description: String(job.short_description || ''),
    description: String(job.description || ''),
    responsibilities: Array.isArray(job.responsibilities)
      ? job.responsibilities.join('\n')
      : String(job.responsibilities || ''),
    eligibility: Array.isArray(job.eligibility)
      ? job.eligibility.join('\n')
      : String(job.eligibility || ''),
    warning: String(job.warning || ''),
    posted_at: job.posted_at
      ? new Date(String(job.posted_at)).toISOString().slice(0, 16)
      : formValues.posted_at,
    expires_at: job.expires_at
      ? new Date(String(job.expires_at)).toISOString().slice(0, 16)
      : '',
    source_name: String(job.source_name || ''),
    source_url: String(job.source_url || ''),
    skills: Array.isArray(job.skills) ? job.skills.join('\n') : String(job.skills || ''),
    company_logo_url: String(job.company_logo_url || ''),
    status: String(job.status || 'draft'),
    is_featured: Boolean(job.is_featured),
    is_instagram: Boolean(job.is_instagram),
    group_link: String(job.group_link || ''),
  };
};

export const mapJobDbError = (error: { code?: string; message?: string } | null, fallback: string) => {
  if (error?.code === '23505' || error?.message?.toLowerCase().includes('duplicate key')) {
    return new Error('That slug already exists. Please adjust the slug and try again.');
  }
  return new Error(error?.message || fallback);
};
