/** Detect PostgREST / Postgres "relation missing" errors for graceful fallbacks. */
export const isMissingRelation = (message: string | undefined): boolean => {
  const text = String(message || '').toLowerCase();
  return (
    text.includes('does not exist') ||
    text.includes('could not find the table') ||
    text.includes('schema cache') ||
    (text.includes('relation') && text.includes('not exist'))
  );
};
