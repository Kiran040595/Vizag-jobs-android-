import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Job } from '../types';
import { colors, radius, spacing } from '../theme';
import { formatRelativePostedAt, shouldHighlightPostedTime } from '../lib/freshness';

interface Props {
  job: Job;
  saved: boolean;
  onPress: () => void;
  onToggleSave: () => void;
}

const Highlight = ({ label, value }: { label: string; value: string }) => (
  <Text style={styles.highlight} numberOfLines={1}>
    <Text style={styles.highlightLabel}>{label}: </Text>
    {value}
  </Text>
);

export default function JobCard({ job, saved, onPress, onToggleSave }: Props) {
  const relative = formatRelativePostedAt(job.postedAt);
  const isNew = shouldHighlightPostedTime(job.postedAt);

  return (
    <View style={[styles.card, job.isFeatured && styles.cardFeatured]}>
      <Pressable
        onPress={onToggleSave}
        hitSlop={8}
        style={[styles.saveBtn, saved && styles.saveBtnActive]}
        accessibilityRole="button"
        accessibilityLabel={saved ? `Remove ${job.title} from saved jobs` : `Save ${job.title}`}
      >
        <Ionicons
          name={saved ? 'bookmark' : 'bookmark-outline'}
          size={20}
          color={saved ? colors.primary : colors.textSubtle}
        />
      </Pressable>

      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.cardBody, pressed && styles.cardPressed]}
        accessibilityRole="button"
        accessibilityLabel={`${job.title} at ${job.company ?? 'a company'} in ${job.location ?? 'Visakhapatnam'}`}
      >
        <View style={styles.badgeRow}>
        {job.isFeatured ? (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredText}>FEATURED</Text>
          </View>
        ) : null}
        {isNew ? (
          <View style={styles.newBadge}>
            <Text style={styles.newText}>NEW</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {job.title}
      </Text>
      {job.company ? (
        <Text style={styles.company} numberOfLines={1}>
          {job.company}
        </Text>
      ) : null}

      <View style={styles.highlights}>
        {job.location ? <Highlight label="Location" value={job.location} /> : null}
        {job.category ? <Highlight label="Category" value={job.category} /> : null}
        {job.jobType ? <Highlight label="Type" value={job.jobType} /> : null}
        {job.salary ? <Highlight label="Salary" value={job.salary} /> : null}
      </View>

      <View style={styles.footer}>
        <Text style={styles.posted}>{relative}</Text>
        <View style={styles.viewRow}>
          <Text style={styles.viewText}>View details</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </View>
      </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardFeatured: { borderColor: colors.accentBorder },
  cardBody: {},
  cardPressed: { opacity: 0.85 },
  saveBtn: {
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
    height: 36,
    width: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  saveBtnActive: { backgroundColor: colors.blueSoft, borderWidth: 1, borderColor: colors.blueSoftBorder },
  badgeRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.xs },
  featuredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentBorder,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  featuredText: { color: '#155e75', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  newBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  newText: { color: '#166534', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  title: { fontSize: 16, fontWeight: '800', color: colors.text, paddingRight: 40, lineHeight: 21 },
  company: { marginTop: 3, fontSize: 13, fontWeight: '600', color: colors.textMuted },
  highlights: { marginTop: spacing.md, gap: 4 },
  highlight: { fontSize: 13, color: colors.textMuted },
  highlightLabel: { fontWeight: '700', color: colors.text },
  footer: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  posted: { fontSize: 12, color: colors.textSubtle },
  viewRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewText: { fontSize: 13, fontWeight: '700', color: colors.primary },
});
