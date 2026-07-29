import { getJobCategorySegment } from './jobCategorySegment';
import type { Job } from '../types';

const toSkillSet = (skills: string | null | undefined): Set<string> =>
  new Set(
    String(skills || '')
      .split(',')
      .map((skill) => skill.trim().toLowerCase())
      .filter(Boolean),
  );

const normalize = (value: string | null | undefined): string =>
  String(value || '')
    .trim()
    .toLowerCase();

/**
 * Score how similar `candidate` is to `job`. Higher is more similar.
 * Mirrors web `SimilarJobs.jsx` weighting (segment, category, skills, type, fresher, company, location).
 */
export const scoreJobSimilarity = (job: Job, candidate: Job): number => {
  let score = 0;
  const baseSegment = getJobCategorySegment(job);
  const baseSkills = toSkillSet(job.skills);

  if (getJobCategorySegment(candidate) === baseSegment) score += 5;

  if (normalize(candidate.category) && normalize(candidate.category) === normalize(job.category)) {
    score += 3;
  }

  const candidateSkills = toSkillSet(candidate.skills);
  let overlap = 0;
  baseSkills.forEach((skill) => {
    if (candidateSkills.has(skill)) overlap += 1;
  });
  score += overlap * 2;

  if (normalize(candidate.jobType) && normalize(candidate.jobType) === normalize(job.jobType)) {
    score += 2;
  }

  if (normalize(candidate.isFresher) === normalize(job.isFresher)) score += 1;

  if (normalize(candidate.company) && normalize(candidate.company) === normalize(job.company)) {
    score += 1;
  }

  if (normalize(candidate.location) && normalize(candidate.location) === normalize(job.location)) {
    score += 1;
  }

  return score;
};

/** Pick similar jobs excluding the current job (default limit 6). */
export const findSimilarJobs = (jobs: Job[], current: Job, limit = 6): Job[] => {
  if (!current || !Array.isArray(jobs) || jobs.length === 0) return [];

  return jobs
    .filter((candidate) => candidate && candidate.id !== current.id)
    .map((candidate) => ({
      job: candidate,
      score: scoreJobSimilarity(current, candidate),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.job);
};
