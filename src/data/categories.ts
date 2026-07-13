/**
 * Category taxonomy ported from the web app
 * (Kiran040595/vizag-jobs: src/lib/jobCategoryTaxonomy.js).
 */

export interface JobCategory {
  id: string;
  value: string;
  label: string;
  aliases: string[];
}

export const JOB_CATEGORIES: JobCategory[] = [
  { id: 'it', value: 'IT & Software', label: 'IT & Software', aliases: ['it', 'software', 'information technology', 'tech', 'developer', 'programming'] },
  { id: 'civil', value: 'Civil Engineering', label: 'Civil Engineering', aliases: ['civil', 'construction', 'structural', 'site engineer'] },
  { id: 'mechanical', value: 'Mechanical Engineering', label: 'Mechanical Engineering', aliases: ['mechanical', 'production', 'manufacturing', 'plant', 'hvac'] },
  { id: 'electrical', value: 'Electrical / EEE', label: 'Electrical / EEE', aliases: ['electrical', 'eee', 'power', 'substation'] },
  { id: 'ece', value: 'ECE / Electronics', label: 'ECE / Electronics', aliases: ['ece', 'electronics', 'embedded', 'communication', 'vlsi', 'telecom'] },
  { id: 'banking', value: 'Banking & Finance', label: 'Banking & Finance', aliases: ['banking', 'finance', 'accountant', 'accounts', 'nbfc', 'insurance'] },
  { id: 'bpo', value: 'BPO / Customer Support', label: 'BPO / Customer Support', aliases: ['bpo', 'customer support', 'call center', 'voice process', 'telecaller'] },
  { id: 'sales', value: 'Sales & Marketing', label: 'Sales & Marketing', aliases: ['sales', 'marketing', 'business development', 'bde', 'digital marketing'] },
  { id: 'hr', value: 'HR & Admin', label: 'HR & Admin', aliases: ['human resources', 'recruitment', 'admin', 'office assistant', 'back office'] },
  { id: 'healthcare', value: 'Healthcare', label: 'Healthcare', aliases: ['healthcare', 'medical', 'nurse', 'pharma', 'hospital', 'lab technician'] },
  { id: 'education', value: 'Education', label: 'Education', aliases: ['education', 'teacher', 'faculty', 'trainer', 'lecturer', 'tutor'] },
  { id: 'hospitality', value: 'Hospitality & Retail', label: 'Hospitality & Retail', aliases: ['hospitality', 'retail', 'hotel', 'restaurant', 'store', 'cashier'] },
  { id: 'logistics', value: 'Logistics & Supply Chain', label: 'Logistics & Supply Chain', aliases: ['logistics', 'supply chain', 'warehouse', 'delivery', 'driver', 'dispatch'] },
];

const ENGINEERING_IDS = new Set(['civil', 'mechanical', 'electrical', 'ece']);

export interface CategoryOption {
  id: string;
  label: string;
}

export const FILTER_CATEGORY_OPTIONS: CategoryOption[] = [
  { id: 'all', label: 'All Categories' },
  ...JOB_CATEGORIES.map((c) => ({ id: c.id, label: c.label })),
  { id: 'engineering', label: 'All Engineering' },
  { id: 'non-it', label: 'Non-IT Jobs' },
  { id: 'fresher', label: 'Fresher Jobs' },
  { id: 'walk-in', label: 'Walk-in Interviews' },
];

const CATEGORY_BY_ID = new Map(JOB_CATEGORIES.map((c) => [c.id, c]));

export const normalizeJobCategory = (value: string | null | undefined): string => {
  const text = String(value ?? '').trim().toLowerCase();
  if (!text) return '';
  for (const cat of JOB_CATEGORIES) {
    if (cat.id === text || cat.value.toLowerCase() === text || cat.label.toLowerCase() === text) {
      return cat.id;
    }
    if (cat.aliases.some((a) => text.includes(a))) {
      return cat.id;
    }
  }
  return '';
};

const isEngineeringJob = (job: { category?: string | null }): boolean =>
  ENGINEERING_IDS.has(normalizeJobCategory(job.category));

const isItJob = (job: { category?: string | null }): boolean =>
  normalizeJobCategory(job.category) === 'it';

/** Whether a job matches the selected category-filter id. */
export const jobMatchesCategoryFilter = (
  job: { category?: string | null; isFresher?: string; jobType?: string | null },
  categoryId: string,
): boolean => {
  if (!categoryId || categoryId === 'all') return true;
  if (categoryId === 'engineering') return isEngineeringJob(job);
  if (categoryId === 'non-it') return !isItJob(job) && !isEngineeringJob(job);
  if (categoryId === 'fresher') return String(job.isFresher).toLowerCase() === 'yes';
  if (categoryId === 'walk-in') return /walk[\s-]?in/i.test(String(job.jobType ?? ''));
  const canonical = normalizeJobCategory(job.category);
  return canonical === categoryId && CATEGORY_BY_ID.has(categoryId);
};
