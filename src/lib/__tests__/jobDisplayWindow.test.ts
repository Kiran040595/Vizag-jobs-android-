import { getMinPostedAtIsoForPublicDisplay, isPostedAtWithinPublicDisplayWindow } from '../jobDisplayWindow';

describe('jobDisplayWindow', () => {
  it('returns an ISO timestamp about 30 days ago', () => {
    const iso = getMinPostedAtIsoForPublicDisplay();
    const ageMs = Date.now() - new Date(iso).getTime();
    const days = ageMs / (24 * 60 * 60 * 1000);
    expect(days).toBeGreaterThan(29.9);
    expect(days).toBeLessThan(30.1);
  });

  it('accepts recent posts and rejects older ones', () => {
    const recent = new Date().toISOString();
    const old = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString();
    expect(isPostedAtWithinPublicDisplayWindow(recent)).toBe(true);
    expect(isPostedAtWithinPublicDisplayWindow(old)).toBe(false);
    expect(isPostedAtWithinPublicDisplayWindow(null)).toBe(false);
  });
});
