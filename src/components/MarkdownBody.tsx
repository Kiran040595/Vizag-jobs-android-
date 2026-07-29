import React from 'react';
import { StyleSheet, Text } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { colors, spacing } from '../theme';

type Props = {
  children?: string | null;
};

/**
 * Lightweight markdown renderer for job descriptions and blog bodies.
 * Falls back to plain text when the body has no markdown markers.
 */
export default function MarkdownBody({ children }: Props) {
  const body = String(children || '').trim();
  if (!body) return null;

  const looksLikeMarkdown =
    /(^|\n)\s{0,3}#{1,6}\s|(^|\n)\s*[-*+]\s|(^|\n)\s*\d+\.\s|\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\)/.test(
      body,
    );

  if (!looksLikeMarkdown) {
    return <Text style={styles.plain}>{body}</Text>;
  }

  return <Markdown style={markdownStyles}>{body}</Markdown>;
}

const styles = StyleSheet.create({
  plain: { fontSize: 14, color: colors.textMuted, lineHeight: 21 },
});

const markdownStyles = StyleSheet.create({
  body: { color: colors.textMuted, fontSize: 14, lineHeight: 21 },
  heading1: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  heading2: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  heading3: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  paragraph: { marginTop: 0, marginBottom: spacing.sm },
  bullet_list: { marginBottom: spacing.sm },
  ordered_list: { marginBottom: spacing.sm },
  list_item: { marginBottom: 4 },
  strong: { fontWeight: '800', color: colors.text },
  link: { color: colors.primary, textDecorationLine: 'underline' },
  code_inline: {
    backgroundColor: colors.blueSoft,
    color: colors.primaryDark,
    borderRadius: 4,
    paddingHorizontal: 4,
  },
  fence: {
    backgroundColor: colors.blueSoft,
    borderColor: colors.blueSoftBorder,
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
});
