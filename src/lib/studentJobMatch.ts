import { normalizeJobCategory } from '../data/categories';
import { normalizeSkillValue } from './studentProfileOptions';
import { parsePreferredLocations, parseTargetJobCategories } from './studentCareerPreferences';
import type { Job } from '../types';

/** Max jobs returned by personalized ranking. */
export const JOBS_FOR_YOU_LIMIT = 8;

/**
 * Student career category → canonical job.category value(s).
 */
export const STUDENT_CATEGORY_TO_JOB_CATEGORIES: Record<string, string[]> = {
  software_frontend: ['IT & Software'],
  software_backend: ['IT & Software'],
  software_full_stack: ['IT & Software'],
  data_analytics: ['IT & Software'],
  testing_qa: ['IT & Software'],
  telecaller_bpo: ['BPO / Customer Support'],
  customer_support: ['BPO / Customer Support'],
  sales_marketing: ['Sales & Marketing'],
  digital_marketing: ['Sales & Marketing'],
  accounting_finance: ['Banking & Finance'],
  mechanical_production: ['Mechanical Engineering'],
  electrical_electronics: ['Electrical / EEE', 'ECE / Electronics'],
  civil_construction: ['Civil Engineering'],
  medical_healthcare: ['Healthcare'],
  pharma_lab: ['Healthcare'],
  delivery_logistics: ['Logistics & Supply Chain'],
  operations_admin: ['HR & Admin'],
  teaching_training: ['Education'],
  retail_hospitality: ['Hospitality & Retail'],
  other: ['General'],
};

const normalizeText = (value: unknown): string => String(value || '').trim().toLowerCase();

const normalizeLocationToken = (value: unknown): string =>
  normalizeText(value)
    .replace(/visakhapatnam/g, 'vizag')
    .replace(/vishakhapatnam/g, 'vizag')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const LOCATION_ALIASES: Record<string, string[]> = {
  vizag: ['vizag', 'visakhapatnam', 'vishakhapatnam'],
  remote: ['remote', 'work from home', 'wfh', 'hybrid'],
};

export const expandLocationTokens = (locations: string[] = []): string[] => {
  const tokens = new Set<string>();
  for (const location of locations) {
    const normalized = normalizeLocationToken(location);
    if (!normalized) continue;
    tokens.add(normalized);
    for (const [key, aliases] of Object.entries(LOCATION_ALIASES)) {
      if (normalized.includes(key) || aliases.some((alias) => normalized.includes(alias))) {
        aliases.forEach((alias) => tokens.add(alias));
      }
    }
  }
  return [...tokens];
};

const toJobSkillTokens = (job: Job): Set<string> => {
  const fromSkills = String(job?.skills || '')
    .split(/[,|/]/)
    .map((item) => normalizeSkillValue(item))
    .filter(Boolean);

  const haystack = [job?.title, job?.shortDescription, job?.description]
    .map(normalizeText)
    .join(' ');

  const tokens = new Set(fromSkills);
  for (const skill of fromSkills) {
    if (skill && haystack.includes(skill)) {
      tokens.add(skill);
    }
  }
  return tokens;
};

const jobCategoryValues = (job: Job): string[] => {
  const normalized = normalizeJobCategory(job?.category);
  return normalized ? [normalized] : [];
};

const isJobFresherFriendly = (job: Job): boolean | null => {
  const value = job?.isFresher;
  if (typeof value === 'boolean') return value;
  const text = normalizeText(value);
  if (text === 'yes' || text === 'true') return true;
  if (text === 'no' || text === 'false') return false;
  return null;
};

export type StudentMatchProfile = {
  skills: string[];
  targetJobCategories: string[];
  preferredLocations: string[];
  primaryTargetRole: string;
  isFresher: boolean | null;
};

export const normalizeStudentMatchProfile = (
  profile: Record<string, unknown> | null | undefined,
): StudentMatchProfile | null => {
  if (!profile) return null;

  const skills = Array.isArray(profile.skills)
    ? profile.skills.map((item) => normalizeSkillValue(String(item))).filter(Boolean)
    : [];

  const targetJobCategories = parseTargetJobCategories(
    profile.target_job_categories ?? profile.targetJobCategories,
  );

  const preferredLocations = parsePreferredLocations(
    profile.preferred_locations ?? profile.preferredLocations,
  );

  const primaryTargetRole = String(
    profile.primary_target_role ?? profile.primaryTargetRole ?? '',
  ).trim();

  const isFresher =
    typeof profile.is_fresher === 'boolean'
      ? profile.is_fresher
      : typeof profile.isFresher === 'boolean'
        ? (profile.isFresher as boolean)
        : null;

  return {
    skills,
    targetJobCategories,
    preferredLocations,
    primaryTargetRole,
    isFresher,
  };
};

export const mapStudentCategoriesToJobCategories = (studentCategories: string[] = []): string[] => {
  const values = new Set<string>();
  for (const category of parseTargetJobCategories(studentCategories)) {
    const mapped = STUDENT_CATEGORY_TO_JOB_CATEGORIES[category] || [];
    mapped.forEach((value) => values.add(value));
  }
  return [...values];
};

export const scoreJobForStudent = (
  job: Job,
  profileInput: Record<string, unknown> | null | undefined,
): { score: number; reasons: string[] } => {
  const profile = normalizeStudentMatchProfile(profileInput);
  if (!job || !profile) {
    return { score: 0, reasons: [] };
  }

  let score = 0;
  const reasons: string[] = [];

  const wantedCategories = new Set(
    mapStudentCategoriesToJobCategories(profile.targetJobCategories).map(normalizeText),
  );
  const jobCategories = jobCategoryValues(job).map(normalizeText);
  const categoryHit = jobCategories.some((category) => wantedCategories.has(category));
  if (categoryHit) {
    score += 8;
    reasons.push('Category match');
  }

  const studentSkills = new Set(profile.skills);
  const jobSkills = toJobSkillTokens(job);
  const titleHaystack = normalizeText([job.title, job.company, job.shortDescription].join(' '));
  let skillHits = 0;
  for (const skill of studentSkills) {
    if (jobSkills.has(skill) || titleHaystack.includes(skill)) {
      skillHits += 1;
    }
  }
  if (skillHits > 0) {
    score += skillHits * 3;
    reasons.push(skillHits === 1 ? '1 skill match' : `${skillHits} skills match`);
  }

  if (profile.isFresher === true) {
    const fresher = isJobFresherFriendly(job);
    if (fresher === true) {
      score += 3;
      reasons.push('Fresher-friendly');
    } else if (fresher === false) {
      score -= 1;
    }
  }

  const locationTokens = expandLocationTokens(profile.preferredLocations);
  const jobLocation = normalizeLocationToken(job.location);
  if (locationTokens.length > 0 && jobLocation) {
    const locationHit = locationTokens.some(
      (token) => jobLocation.includes(token) || token.includes(jobLocation),
    );
    if (locationHit) {
      score += 2;
      reasons.push('Location match');
    }
  }

  const role = normalizeText(profile.primaryTargetRole);
  if (role && role.length >= 3) {
    const roleTokens = role.split(/\s+/).filter((token) => token.length >= 3);
    const title = normalizeText(job.title);
    const roleHits = roleTokens.filter((token) => title.includes(token)).length;
    if (roleHits > 0) {
      score += Math.min(roleHits, 3);
      reasons.push('Role match');
    }
  }

  return { score, reasons };
};

export type RankedJob = { job: Job; score: number; reasons: string[] };

export const rankJobsForStudent = (
  jobs: Job[] = [],
  profileInput: Record<string, unknown> | null | undefined,
  limit = JOBS_FOR_YOU_LIMIT,
): RankedJob[] => {
  const profile = normalizeStudentMatchProfile(profileInput);
  if (!profile || !Array.isArray(jobs) || jobs.length === 0) {
    return [];
  }

  return jobs
    .map((job) => {
      const { score, reasons } = scoreJobForStudent(job, profile);
      return { job, score, reasons };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const aPosted = Date.parse(a.job?.postedAt || '') || 0;
      const bPosted = Date.parse(b.job?.postedAt || '') || 0;
      return bPosted - aPosted;
    })
    .slice(0, Math.max(1, limit));
};
