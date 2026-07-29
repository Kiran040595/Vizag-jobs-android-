const KNOWN_SECTION_HEADINGS = [
  'About the Role',
  'Skills Required',
  'Skills',
  'Key Responsibilities',
  'Responsibilities',
  'Who Can Apply',
  'How to Apply',
  'Why Join',
  'FAQs',
  'FAQ',
];

const normalizeInlineMarkdown = (text: string): string => {
  let out = text;

  for (const heading of KNOWN_SECTION_HEADINGS) {
    const re = new RegExp(`(#{1,3}\\s+${heading.replace(/\s+/g, '\\s+')})\\s+`, 'gi');
    out = out.replace(re, '$1\n\n');
  }

  out = out.replace(/\s+(#{1,3}\s+[A-Za-z])/g, '\n\n$1');
  out = out.replace(/([.!?])\s+\*\s+/g, '$1\n\n* ');
  out = out.replace(/\n{3,}/g, '\n\n');

  return out.trim();
};

/** Strip source attribution and scrape references from public job copy. */
export const sanitizeJobDescriptionForDisplay = (text?: string | null): string => {
  if (!text?.trim()) return '';

  let out = text;

  out = out.replace(
    /^\s*(?:#{1,3}\s*)?(?:\*\*)?(?:Source|Job source|Originally posted on|Posted on|Apply via|Scraped from)(?:\*\*)?[:\s].*$/gim,
    '',
  );
  out = out.replace(/^\s*(?:LinkedIn|Naukri|Indeed)(?:\s+(?:Jobs?|Post|listing))?\s*$/gim, '');
  out = out.replace(
    /\[([^\]]*)\]\(\s*https?:\/\/(?:[\w.-]+\.)?(?:linkedin|naukri|indeed)\.com[^)]*\)/gi,
    '$1',
  );
  out = out.replace(/\bhttps?:\/\/(?:[\w.-]+\.)?(?:linkedin|naukri|indeed)\.com\S*/gi, '');
  out = out.replace(/\n{3,}/g, '\n\n');

  return normalizeInlineMarkdown(out);
};

/** SEO descriptions already include ## headings and bullet sections. */
export const looksLikeStructuredJobDescription = (text?: string | null): boolean =>
  /(^|\n)#{1,3}\s+\S/m.test(text || '');

export type DescriptionBlock =
  | { type: 'heading'; text: string; level: number }
  | { type: 'bullet'; text: string }
  | { type: 'paragraph'; text: string };

const stripInlineMarkers = (line: string): string =>
  line
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();

/** Parse sanitized markdown-ish job copy into simple display blocks. */
export const parseJobDescriptionBlocks = (text?: string | null): DescriptionBlock[] => {
  const sanitized = sanitizeJobDescriptionForDisplay(text);
  if (!sanitized) return [];

  const lines = sanitized.split(/\n/);
  const blocks: DescriptionBlock[] = [];
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const joined = paragraph.join(' ').trim();
    if (joined) blocks.push({ type: 'paragraph', text: stripInlineMarkers(joined) });
    paragraph = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      blocks.push({
        type: 'heading',
        level: heading[1].length,
        text: stripInlineMarkers(heading[2]),
      });
      continue;
    }

    const bullet = line.match(/^[-*+]\s+(.+)$/);
    if (bullet) {
      flushParagraph();
      blocks.push({ type: 'bullet', text: stripInlineMarkers(bullet[1]) });
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  return blocks;
};
