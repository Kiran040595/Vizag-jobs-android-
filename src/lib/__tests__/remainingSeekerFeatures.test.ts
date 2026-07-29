import {
  parseApplyRouteJobId,
  parseJobRouteIdentifier,
  parseQuestionIdFromPath,
} from '../parseJobRouteIdentifier';
import { resolveJobSourceAttribution } from '../jobSourceAttribution';
import { isJobExpired } from '../jobExpiry';
import {
  looksLikeStructuredJobDescription,
  sanitizeJobDescriptionForDisplay,
} from '../jobDescriptionDisplay';

describe('parseJobRouteIdentifier', () => {
  it('parses modern, legacy, and direct job paths', () => {
    expect(parseJobRouteIdentifier('/jobs/it/react-native-developer-vizag')).toBe(
      'react-native-developer-vizag',
    );
    expect(parseJobRouteIdentifier('/job/react-native-developer-vizag')).toBe(
      'react-native-developer-vizag',
    );
    expect(parseJobRouteIdentifier('/jobs/f0e7b6ab-7bdc-48bb-b29a-3944453a21f3')).toBe(
      'f0e7b6ab-7bdc-48bb-b29a-3944453a21f3',
    );
    expect(parseJobRouteIdentifier('https://jobsinvizag.in/jobs/it/foo-bar')).toBe('foo-bar');
  });

  it('ignores list-only paths', () => {
    expect(parseJobRouteIdentifier('/jobs/latest')).toBe('');
  });

  it('parses apply route and question query', () => {
    expect(parseApplyRouteJobId('/student/apply/abc-123')).toBe('abc-123');
    expect(parseQuestionIdFromPath('/jobs/it/foo?question=q1')).toBe('q1');
  });
});

describe('job description + source + expiry helpers', () => {
  it('sanitizes and detects structured descriptions', () => {
    const raw = '## About the Role\nBuild apps.\n\n## Skills\n* React\nSource: LinkedIn';
    const cleaned = sanitizeJobDescriptionForDisplay(raw);
    expect(cleaned).not.toMatch(/Source:/i);
    expect(looksLikeStructuredJobDescription(cleaned)).toBe(true);
  });

  it('resolves source attribution', () => {
    expect(
      resolveJobSourceAttribution({
        sourceName: 'Naukri',
        sourceUrl: 'https://www.naukri.com/job/123',
      }),
    ).toEqual({ label: 'Naukri', href: 'https://www.naukri.com/job/123' });
    expect(
      resolveJobSourceAttribution({
        sourceName: 'Admin',
        sourceUrl: 'https://jobsinvizag.in/jobs/x',
      }),
    ).toBeNull();
  });

  it('detects expired jobs', () => {
    expect(isJobExpired({ expiresAt: '2020-01-01T00:00:00.000Z' })).toBe(true);
    expect(isJobExpired({ expiresAt: null })).toBe(false);
    expect(isJobExpired({ expiresAt: new Date(Date.now() + 86400000).toISOString() })).toBe(false);
  });
});
