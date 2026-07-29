import { resolveSupabaseCredential } from '../supabaseCredentials';

describe('resolveSupabaseCredential', () => {
  const fallback = 'https://fbyyfyhdglcpkhxskffj.supabase.co';

  it('uses fallback for missing, empty, and placeholder values', () => {
    expect(resolveSupabaseCredential(undefined, fallback)).toBe(fallback);
    expect(resolveSupabaseCredential('', fallback)).toBe(fallback);
    expect(resolveSupabaseCredential('   ', fallback)).toBe(fallback);
    expect(resolveSupabaseCredential('undefined', fallback)).toBe(fallback);
    expect(resolveSupabaseCredential('<anon-key>', fallback)).toBe(fallback);
    expect(resolveSupabaseCredential('your-anon-key-here', fallback)).toBe(fallback);
  });

  it('keeps real credential overrides', () => {
    const key =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieXlmeWhkZ2xjcGtoeHNrZmZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMjQyMDUsImV4cCI6MjA5MjgwMDIwNX0.FN1Xt_j6LkPbS1zI77f6nL1aJlnR1q5EhK7z4AsqU5Q';
    expect(resolveSupabaseCredential(key, fallback)).toBe(key);
    expect(resolveSupabaseCredential(` ${fallback} `, 'other')).toBe(fallback);
  });
});
