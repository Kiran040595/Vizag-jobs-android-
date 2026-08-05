import {
  createSuggestedSlug,
  getEmptyJobForm,
  serializeJobForm,
  deserializeJobForForm,
} from '../jobFormSerialize';

describe('jobFormSerialize', () => {
  it('creates slugs and serializes employer-style forms', () => {
    const slug = createSuggestedSlug({
      title: 'React Native Developer',
      company: 'Vizag Tech',
      postedAt: '2026-07-29T10:00:00.000Z',
    });
    expect(slug).toContain('react-native-developer');

    const form = getEmptyJobForm();
    form.title = 'Civil Engineer';
    form.company = 'Coastal Co';
    form.category = 'Civil Engineering';
    form.job_type = 'Full-Time';
    form.apply_mode = 'internal';
    form.responsibilities = 'Site visits\nQuality checks';
    form.slug = slug;

    const payload = serializeJobForm(form, 'pending');
    expect(payload.status).toBe('pending');
    expect(payload.apply_mode).toBe('internal');
    expect(payload.apply_link).toBeNull();
    expect(payload.responsibilities).toEqual(['Site visits', 'Quality checks']);

    const roundTrip = deserializeJobForForm({
      ...payload,
      id: '1',
      responsibilities: payload.responsibilities,
    });
    expect(roundTrip.title).toBe('Civil Engineer');
    expect(roundTrip.responsibilities).toContain('Site visits');
  });
});
