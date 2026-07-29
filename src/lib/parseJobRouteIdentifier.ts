/** Extract job slug or id from public job detail paths (mirrors web). */
export const parseJobRouteIdentifier = (pathname = ''): string => {
  const path = String(pathname || '').trim();
  if (!path) return '';

  // Absolute URLs → pathname only
  let normalized = path;
  try {
    if (/^https?:\/\//i.test(path)) {
      normalized = new URL(path).pathname;
    }
  } catch {
    // keep as-is
  }

  if (!normalized.startsWith('/')) normalized = `/${normalized}`;

  const segmentMatch = normalized.match(/^\/jobs\/[^/]+\/([^/]+)\/?$/);
  if (segmentMatch) return decodeURIComponent(segmentMatch[1]);

  const legacyMatch = normalized.match(/^\/job\/([^/]+)\/?$/);
  if (legacyMatch) return decodeURIComponent(legacyMatch[1]);

  const directMatch = normalized.match(/^\/jobs\/([^/]+)\/?$/);
  if (directMatch) {
    const segment = decodeURIComponent(directMatch[1]);
    // Skip non-job list paths like /jobs/latest
    if (['latest', 'saved', 'category'].includes(segment.toLowerCase())) return '';
    return segment;
  }

  // Query-style: ?question= on a job path already handled above; bare ids
  const bare = normalized.replace(/^\//, '');
  if (/^[0-9a-f-]{8,}$/i.test(bare) || /^[a-z0-9-]+$/i.test(bare)) {
    return bare;
  }

  return '';
};

/** Extract job id from the internal apply route. */
export const parseApplyRouteJobId = (pathname = ''): string => {
  const path = String(pathname || '');
  const match = path.match(/\/student\/apply\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : '';
};

/** Best-effort question id from notification link or query. */
export const parseQuestionIdFromPath = (pathname = ''): string | undefined => {
  try {
    const raw = String(pathname || '');
    const url = /^https?:\/\//i.test(raw)
      ? new URL(raw)
      : new URL(raw, 'https://jobsinvizag.in');
    const q = url.searchParams.get('question');
    return q || undefined;
  } catch {
    return undefined;
  }
};
