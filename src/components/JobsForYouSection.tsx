import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Job } from '../types';
import type { RankedJob } from '../lib/studentJobMatch';
import { colors, radius, spacing } from '../theme';

type Props = {
  rankedJobs: RankedJob[];
  onOpenJob: (job: Job) => void;
};

export default function JobsForYouSection({ rankedJobs, onOpenJob }: Props) {
  if (!rankedJobs.length) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Jobs for you</Text>
      <Text style={styles.subtitle}>Matched from your profile preferences and skills.</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {rankedJobs.map(({ job, reasons }) => (
          <Pressable
            key={job.id}
            style={styles.card}
            onPress={() => onOpenJob(job)}
            accessibilityRole="button"
          >
            <Text style={styles.cardTitle} numberOfLines={2}>
              {job.title}
            </Text>
            <Text style={styles.cardMeta} numberOfLines={1}>
              {[job.company, job.location].filter(Boolean).join(' · ')}
            </Text>
            {reasons.length ? (
              <View style={styles.reasons}>
                {reasons.slice(0, 2).map((reason) => (
                  <View key={reason} style={styles.reasonChip}>
                    <Text style={styles.reasonText}>{reason}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: spacing.lg, paddingBottom: spacing.sm },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    paddingHorizontal: spacing.lg,
  },
  subtitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    color: colors.textMuted,
    paddingHorizontal: spacing.lg,
    fontSize: 13,
  },
  row: { paddingHorizontal: spacing.lg, gap: spacing.md },
  card: {
    width: 220,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  cardTitle: { fontSize: 14, fontWeight: '800', color: colors.text, minHeight: 36 },
  cardMeta: { marginTop: spacing.sm, fontSize: 12, color: colors.textMuted },
  reasons: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: spacing.sm },
  reasonChip: {
    backgroundColor: colors.blueSoft,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  reasonText: { fontSize: 10, fontWeight: '700', color: colors.primaryDark },
});
