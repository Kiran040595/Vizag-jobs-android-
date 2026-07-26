import { applyJobFilters, paginate, isAnyFilterActive, DEFAULT_FILTERS } from '../jobFilters';
import type { Job, Filters } from '../../types';

const hoursAgo = (h: number) => new Date(Date.now() - h * 60 * 60 * 1000).toISOString();

const jobs: Job[] = [
  {
    id: '1', title: 'React Native Developer', company: 'Vizag TechWorks', location: 'Visakhapatnam',
    category: 'IT & Software', jobType: 'Full-Time', salary: '₹6 LPA', isFresher: 'No',
    skills: 'React Native, TypeScript', postedAt: hoursAgo(2),
  },
  {
    id: '2', title: 'Civil Site Engineer', company: 'Coastal Constructions', location: 'Gajuwaka',
    category: 'Civil Engineering', jobType: 'Full-Time', salary: '₹3 LPA', isFresher: 'No',
    skills: 'AutoCAD', postedAt: hoursAgo(10),
  },
  {
    id: '3', title: 'Telecaller Walk-in', company: 'FinReach', location: 'Dwaraka Nagar',
    category: 'Banking & Finance', jobType: 'Walk-in', salary: '₹18k', isFresher: 'Yes',
    skills: 'Telecalling', postedAt: hoursAgo(28),
  },
  {
    id: '4', title: 'HR Intern', company: 'TalentBridge', location: 'Visakhapatnam',
    category: 'HR & Admin', jobType: 'Internship', salary: '₹10k', isFresher: 'Yes',
    skills: 'Recruitment', postedAt: hoursAgo(24 * 20),
  },
];

const f = (overrides: Partial<Filters>): Filters => ({ ...DEFAULT_FILTERS, ...overrides });

describe('applyJobFilters', () => {
  it('returns all jobs with default filters', () => {
    expect(applyJobFilters(jobs, DEFAULT_FILTERS)).toHaveLength(4);
  });

  it('filters by free-text search across title/skills', () => {
    const res = applyJobFilters(jobs, f({ q: 'react' }));
    expect(res.map((j) => j.id)).toEqual(['1']);
  });

  it('search requires ALL tokens to match', () => {
    expect(applyJobFilters(jobs, f({ q: 'react native' }))).toHaveLength(1);
    expect(applyJobFilters(jobs, f({ q: 'react civil' }))).toHaveLength(0);
  });

  it('filters by concrete category id', () => {
    expect(applyJobFilters(jobs, f({ category: 'it' })).map((j) => j.id)).toEqual(['1']);
  });

  it('supports the "engineering" umbrella category', () => {
    expect(applyJobFilters(jobs, f({ category: 'engineering' })).map((j) => j.id)).toEqual(['2']);
  });

  it('supports the "fresher" pseudo-category', () => {
    expect(applyJobFilters(jobs, f({ category: 'fresher' })).map((j) => j.id).sort()).toEqual(['3', '4']);
  });

  it('supports the "walk-in" pseudo-category via job type', () => {
    expect(applyJobFilters(jobs, f({ category: 'walk-in' })).map((j) => j.id)).toEqual(['3']);
  });

  it('filters by job type', () => {
    expect(applyJobFilters(jobs, f({ jobType: 'internship' })).map((j) => j.id)).toEqual(['4']);
  });

  it('filters by freshness window', () => {
    expect(applyJobFilters(jobs, f({ freshness: '24h' })).map((j) => j.id).sort()).toEqual(['1', '2']);
    expect(applyJobFilters(jobs, f({ freshness: '7d' })).map((j) => j.id).sort()).toEqual(['1', '2', '3']);
  });

  it('composes multiple filters', () => {
    const res = applyJobFilters(jobs, f({ category: 'fresher', jobType: 'internship' }));
    expect(res.map((j) => j.id)).toEqual(['4']);
  });
});

describe('paginate', () => {
  it('slices items into pages', () => {
    const items = Array.from({ length: 25 }, (_, i) => i);
    expect(paginate(items, 1, 12)).toHaveLength(12);
    expect(paginate(items, 3, 12)).toEqual([24]);
  });
});

describe('isAnyFilterActive', () => {
  it('is false for defaults and true when any filter set', () => {
    expect(isAnyFilterActive(DEFAULT_FILTERS)).toBe(false);
    expect(isAnyFilterActive(f({ q: 'react' }))).toBe(true);
    expect(isAnyFilterActive(f({ category: 'it' }))).toBe(true);
  });
});
