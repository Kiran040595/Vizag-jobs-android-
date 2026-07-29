/**
 * Coarse job segment used for similar-job ranking and public URL paths.
 * Ported from the web app (`src/lib/jobRoutes.js` → `getJobCategorySegment`).
 */
import type { Job } from '../types';

const normalizeValue = (value = ''): string => String(value).trim().toLowerCase();

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const hasKeyword = (value: string, keyword: string): boolean => {
  const normalizedKeyword = normalizeValue(keyword);
  if (!normalizedKeyword) return false;

  if (/^[a-z0-9\s/-]+$/.test(normalizedKeyword)) {
    const pattern = normalizedKeyword
      .split(/\s+/)
      .map(escapeRegex)
      .join('[\\\\s/-]+');
    return new RegExp(`(^|[^a-z0-9])${pattern}([^a-z0-9]|$)`, 'i').test(value);
  }

  return value.includes(normalizedKeyword);
};

const includesAny = (value: string, keywords: string[]): boolean =>
  keywords.some((keyword) => hasKeyword(value, keyword));

const collectSearchText = (job: Partial<Job> = {}): string =>
  [
    job.title,
    job.company,
    job.category,
    job.jobType,
    job.workMode,
    job.description,
    job.shortDescription,
    job.skills,
    job.sourceName,
  ]
    .filter(Boolean)
    .map((v) => normalizeValue(String(v)))
    .join(' ');

const isFresherJob = (job: Partial<Job> = {}): boolean => {
  const isFresherValue = normalizeValue(job.isFresher);
  return isFresherValue === 'yes' || isFresherValue === 'true' || isFresherValue === 't';
};

/** Coarse segment id for a job (e.g. `it`, `it-fresher`, `civil`, `part-time`). */
export const getJobCategorySegment = (job: Partial<Job> = {}): string => {
  const text = collectSearchText(job);
  const fresher = isFresherJob(job);

  if (
    includesAny(text, [
      'bank',
      'banking',
      'bank po',
      'bank clerk',
      'clerk',
      'relationship officer',
      'loan officer',
    ])
  ) {
    return fresher ? 'bank-fresher' : 'bank';
  }

  if (
    includesAny(text, [
      'government',
      'govt',
      'sarkari',
      'railway',
      'police',
      'psc',
      'municipal',
      'collectorate',
    ])
  ) {
    return fresher ? 'govt-fresher' : 'govt';
  }

  if (includesAny(text, ['part-time', 'part time', 'parttime'])) {
    return 'part-time';
  }

  if (includesAny(text, ['work from home', 'work-from-home', 'wfh', 'remote', 'hybrid'])) {
    return 'work-from-home';
  }

  if (
    includesAny(text, [
      'software',
      'information technology',
      'developer',
      'java',
      'python',
      'react',
      'angular',
      'full stack',
      'frontend',
      'backend',
      'dotnet',
      '.net',
      'qa engineer',
      'software testing',
      'data analyst',
      'ml engineer',
      'ai engineer',
      'enovia',
    ])
  ) {
    return fresher ? 'it-fresher' : 'it';
  }

  if (
    includesAny(text, [
      'teacher',
      'teaching',
      'faculty',
      'lecturer',
      'professor',
      'tutor',
      'school',
      'educator',
    ])
  ) {
    return 'teaching';
  }

  if (
    includesAny(text, [
      'hospital',
      'medical',
      'nurse',
      'clinic',
      'healthcare',
      'doctor',
      'patient care',
    ])
  ) {
    return 'hospital';
  }

  if (includesAny(text, ['pharma', 'pharmaceutical', 'lab', 'laboratory', 'chemist', 'drug'])) {
    return 'pharma';
  }

  if (
    includesAny(text, [
      'account',
      'accounts',
      'accountant',
      'finance',
      'auditor',
      'bookkeeper',
      'book keeping',
      'bookkeeping',
      'gst',
      'tax',
    ])
  ) {
    return 'accounts';
  }

  if (
    includesAny(text, [
      'sales',
      'marketing',
      'business development',
      'telecaller',
      'field executive',
      'brand promoter',
    ])
  ) {
    return 'sales';
  }

  if (
    includesAny(text, [
      'bpo',
      'call center',
      'customer support',
      'customer care',
      'chat support',
      'voice process',
      'non voice',
    ])
  ) {
    return 'bpo';
  }

  if (includesAny(text, ['hr', 'human resource', 'recruitment', 'talent acquisition', 'payroll'])) {
    return 'hr';
  }

  if (
    includesAny(text, [
      'civil',
      'construction',
      'site engineer',
      'structural',
      'quantity surveyor',
    ])
  ) {
    return fresher ? 'civil-fresher' : 'civil';
  }

  if (
    includesAny(text, ['mechanical', 'production', 'manufacturing', 'plant', 'hvac', 'cnc'])
  ) {
    return fresher ? 'mechanical-fresher' : 'mechanical';
  }

  if (includesAny(text, ['electrical', 'eee', 'power', 'substation', 'electrician'])) {
    return fresher ? 'electrical-fresher' : 'electrical';
  }

  if (includesAny(text, ['ece', 'electronics', 'embedded', 'vlsi', 'telecom'])) {
    return fresher ? 'ece-fresher' : 'ece';
  }

  if (
    includesAny(text, [
      'hotel',
      'hospitality',
      'restaurant',
      'retail',
      'store',
      'cashier',
      'waiter',
    ])
  ) {
    return 'hospitality';
  }

  if (
    includesAny(text, [
      'logistics',
      'warehouse',
      'delivery',
      'driver',
      'dispatch',
      'supply chain',
    ])
  ) {
    return 'logistics';
  }

  if (fresher) return 'fresher';
  return 'jobs';
};
