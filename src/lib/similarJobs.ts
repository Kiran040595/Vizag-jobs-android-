import { normalizeJobCategory } from '../data/categories';
import type { Job } from '../types';

/** Pick similar jobs by category (then company), excluding the current job. */
export const findSimilarJobs = (jobs: Job[], current: Job, limit = 6): Job[] => {
  if (!current || !Array.isArray(jobs) || jobs.length === 0) return [];

  const currentCategory = normalizeJobCategory(current.category);
  const currentCompany = String(current.company || '')
    .trim()
    .toLowerCase();

  const scored = jobs
    .filter((job) => job.id !== current.id)
    .map((job) => {
      let score = 0;
      const category = normalizeJobCategory(job.category);
      if (currentCategory && category && category === currentCategory) score += 3;
      const company = String(job.company || '')
        .trim()
        .toLowerCase();
      if (currentCompany && company && company === currentCompany) score += 2;
      return { job, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((entry) => entry.job);
};
