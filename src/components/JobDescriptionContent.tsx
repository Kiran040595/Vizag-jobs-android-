import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme';
import {
  looksLikeStructuredJobDescription,
  parseJobDescriptionBlocks,
  sanitizeJobDescriptionForDisplay,
} from '../lib/jobDescriptionDisplay';

type Props = {
  title?: string;
  body?: string | null;
};

/** Renders plain or lightly structured (markdown-ish) job description text. */
export default function JobDescriptionContent({ title, body }: Props) {
  const sanitized = sanitizeJobDescriptionForDisplay(body);
  if (!sanitized) return null;

  const structured = looksLikeStructuredJobDescription(sanitized);
  const blocks = structured ? parseJobDescriptionBlocks(sanitized) : null;

  return (
    <View style={styles.section}>
      {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
      {blocks && blocks.length > 0 ? (
        blocks.map((block, index) => {
          if (block.type === 'heading') {
            return (
              <Text
                key={`h-${index}`}
                style={[styles.heading, block.level >= 3 && styles.headingSmall]}
              >
                {block.text}
              </Text>
            );
          }
          if (block.type === 'bullet') {
            return (
              <Text key={`b-${index}`} style={styles.bullet}>
                • {block.text}
              </Text>
            );
          }
          return (
            <Text key={`p-${index}`} style={styles.sectionBody}>
              {block.text}
            </Text>
          );
        })
      ) : (
        <Text style={styles.sectionBody}>{sanitized}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.lg },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  heading: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  headingSmall: { fontSize: 14 },
  bullet: {
    color: colors.textMuted,
    lineHeight: 22,
    marginBottom: 4,
    paddingLeft: 2,
  },
  sectionBody: {
    color: colors.textMuted,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
});
