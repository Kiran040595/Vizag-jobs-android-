const MARKDOWN_BLOCK_START = /^(#{1,6}\s|[-*+]\s|\d+\.\s|>\s|```|---|\*\*\*)/;

const splitSentences = (text: string): string[] => {
  const sentences = text.match(/[^.!?]+[.!?]+(?:["')\]]\s*)?|\S+/g);
  return sentences ? sentences.map((sentence) => sentence.trim()).filter(Boolean) : [text.trim()];
};

const splitWallTextIntoParagraphs = (text: string): string => {
  const trimmed = String(text || '').trim();
  if (!trimmed) return trimmed;

  const sentences = splitSentences(trimmed);
  if (sentences.length <= 1) return trimmed;

  const paragraphs: string[] = [];
  let chunk: string[] = [];

  for (let index = 0; index < sentences.length; index += 1) {
    chunk.push(sentences[index]);
    const atEnd = index === sentences.length - 1;
    const shouldBreak = chunk.length >= 3 || (chunk.length >= 2 && atEnd);

    if (shouldBreak) {
      paragraphs.push(chunk.join(' '));
      chunk = [];
    }
  }

  if (chunk.length) {
    paragraphs.push(chunk.join(' '));
  }

  return paragraphs.join('\n\n');
};

/**
 * Ensure blog Markdown renders as multiple paragraphs.
 * Ported from the web app (`src/lib/blogBodyMarkdown.js`).
 */
export const normalizeBlogBodyMarkdown = (body: string | null | undefined): string => {
  let text = String(body || '').trim();
  if (!text) return text;

  if (text.includes('\\n')) {
    text = text.replace(/\\n/g, '\n');
  }

  text = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

  if (/\n\n/.test(text)) {
    return text;
  }

  if (text.includes('\n')) {
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const isListBlock =
      lines.length > 0 && lines.every((line) => /^[-*+]\s/.test(line) || /^\d+\.\s/.test(line));
    if (isListBlock) {
      return lines.join('\n');
    }

    const isMarkdownBlock = lines.every((line) => MARKDOWN_BLOCK_START.test(line));
    if (isMarkdownBlock) {
      return lines.join('\n\n');
    }

    return lines.join('\n\n');
  }

  return splitWallTextIntoParagraphs(text);
};
