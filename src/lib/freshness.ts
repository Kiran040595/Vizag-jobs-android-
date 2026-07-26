/**
 * Relative "posted at" formatting, ported from the web app's jobFreshness.
 */

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const formatRelativePostedAt = (postedAt?: string | null): string => {
  if (!postedAt) return '';
  const ts = new Date(postedAt).getTime();
  if (Number.isNaN(ts)) return '';
  const diff = Date.now() - ts;
  if (diff < 0) return 'Just now';
  if (diff < HOUR) {
    const mins = Math.max(1, Math.floor(diff / MINUTE));
    return `${mins} min${mins === 1 ? '' : 's'} ago`;
  }
  if (diff < DAY) {
    const hrs = Math.floor(diff / HOUR);
    return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  }
  const days = Math.floor(diff / DAY);
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? '' : 's'} ago`;
};

/** Highlight jobs posted within the last 24h (matches web "new" badge window). */
export const shouldHighlightPostedTime = (postedAt?: string | null): boolean => {
  if (!postedAt) return false;
  const ts = new Date(postedAt).getTime();
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts < DAY;
};
