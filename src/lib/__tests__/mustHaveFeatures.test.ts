import { isMissingRelation } from '../supabaseErrors';

describe('isMissingRelation', () => {
  it('detects missing-table style PostgREST errors', () => {
    expect(isMissingRelation('relation "public.student_saved_jobs" does not exist')).toBe(true);
    expect(isMissingRelation('Could not find the table public.job_alert_subscriptions')).toBe(true);
    expect(isMissingRelation('schema cache')).toBe(true);
    expect(isMissingRelation('permission denied')).toBe(false);
  });
});
