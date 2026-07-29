import { findSimilarJobs, scoreJobSimilarity } from '../similarJobs';
import { parseJobDeepLinkPath } from '../jobDeepLink';
import { buildJobSharePayload } from '../jobShare';
import { normalizeBlogBodyMarkdown } from '../blogBodyMarkdown';
import type { Job } from '../../types';

const base: Job = {
  id: '1',
  title: 'React Developer',
  company: 'Vizag Tech',
  location: 'Visakhapatnam',
  category: 'IT & Software',
  jobType: 'Full-Time',
  salary: '₹6 LPA',
  isFresher: 'Yes',
  skills: 'React, TypeScript, Node',
};

const jobs: Job[] = [
  base,
  {
    id: '2',
    title: 'Frontend Engineer',
    company: 'Coastal Soft',
    location: 'Visakhapatnam',
    category: 'IT & Software',
    jobType: 'Full-Time',
    salary: '₹5 LPA',
    isFresher: 'Yes',
    skills: 'React, CSS',
  },
  {
    id: '3',
    title: 'Civil Site Engineer',
    company: 'BuildCo',
    location: 'Gajuwaka',
    category: 'Civil Engineering',
    jobType: 'Full-Time',
    salary: '₹3 LPA',
    isFresher: 'No',
    skills: 'AutoCAD',
  },
  {
    id: '4',
    title: 'React Native Dev',
    company: 'Vizag Tech',
    location: 'Visakhapatnam',
    category: 'IT & Software',
    jobType: 'Contract',
    salary: '₹4 LPA',
    isFresher: 'Yes',
    skills: 'React Native, TypeScript',
  },
];

describe('findSimilarJobs', () => {
  it('ranks IT jobs with skill overlap above unrelated categories', () => {
    const similar = findSimilarJobs(jobs, base, 6);
    expect(similar.map((j) => j.id).slice(0, 2)).toEqual(['2', '4']);
    expect(scoreJobSimilarity(base, jobs[1])).toBeGreaterThan(scoreJobSimilarity(base, jobs[2]));
  });

  it('excludes the current job and returns at most the limit', () => {
    const similar = findSimilarJobs(jobs, base, 1);
    expect(similar).toHaveLength(1);
    expect(similar[0].id).not.toBe(base.id);
  });
});

describe('parseJobDeepLinkPath', () => {
  it('parses /job/:slug and /jobs/:uuid', () => {
    expect(parseJobDeepLinkPath('/job/react-developer-vizag')).toEqual({
      slug: 'react-developer-vizag',
    });
    expect(parseJobDeepLinkPath('/jobs/11111111-1111-1111-1111-111111111111')).toEqual({
      jobId: '11111111-1111-1111-1111-111111111111',
    });
  });

  it('parses /jobs/:segment/:slug and ignores category landings', () => {
    expect(parseJobDeepLinkPath('/jobs/it/react-developer-vizag')).toEqual({
      slug: 'react-developer-vizag',
    });
    expect(parseJobDeepLinkPath('/jobs/it')).toBeNull();
    expect(parseJobDeepLinkPath('/jobs/latest')).toBeNull();
  });

  it('accepts absolute jobsinvizag.in URLs', () => {
    expect(parseJobDeepLinkPath('https://jobsinvizag.in/jobs/it/some-slug')).toEqual({
      slug: 'some-slug',
    });
  });
});

describe('buildJobSharePayload', () => {
  it('builds WhatsApp and Telegram share URLs', () => {
    const payload = buildJobSharePayload({
      id: '1',
      slug: 'react-developer-vizag',
      title: 'React Developer',
      company: 'Vizag Tech',
      location: 'Visakhapatnam',
    });
    expect(payload.url).toContain('/jobs/react-developer-vizag');
    expect(payload.whatsappUrl).toContain('wa.me');
    expect(payload.telegramUrl).toContain('t.me/share');
    expect(payload.fullMessage).toContain(payload.url);
  });
});

describe('normalizeBlogBodyMarkdown', () => {
  it('expands escaped newlines into paragraphs', () => {
    const out = normalizeBlogBodyMarkdown('First sentence. Second sentence.\\nThird line.');
    expect(out).toContain('\n');
  });
});
