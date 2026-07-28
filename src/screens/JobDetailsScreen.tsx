import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../theme';
import type { Job } from '../types';
import type { RootStackParamList } from '../navigation/types';
import { formatRelativePostedAt } from '../lib/freshness';
import { isJobSaved, toggleSavedJob } from '../lib/savedJobs';
import { fetchJobById } from '../services/jobs';

type Props = NativeStackScreenProps<RootStackParamList, 'JobDetails'>;

const Row = ({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string | null;
}) => {
  if (!value) return null;
  return (
    <View style={styles.metaRow}>
      <Ionicons name={icon} size={16} color={colors.primary} />
      <Text style={styles.metaLabel}>{label}:</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
};

const Section = ({ title, body }: { title: string; body?: string | null }) => {
  if (!body) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionBody}>{body}</Text>
    </View>
  );
};

export default function JobDetailsScreen({ route }: Props) {
  const { job: initialJob } = route.params;
  const [job, setJob] = useState<Job>(initialJob);
  const [loadingDetail, setLoadingDetail] = useState(
    () => Boolean(initialJob.slug || initialJob.id),
  );
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    isJobSaved(initialJob.id).then(setSaved);
  }, [initialJob.id]);

  useEffect(() => {
    let active = true;
    const key = initialJob.slug || initialJob.id;
    if (!key) {
      return () => {
        active = false;
      };
    }
    fetchJobById(key).then((full) => {
      if (!active) return;
      if (full) setJob(full);
      setLoadingDetail(false);
    });
    return () => {
      active = false;
    };
  }, [initialJob.id, initialJob.slug]);

  const onToggle = async () => {
    const nowSaved = await toggleSavedJob(job);
    setSaved(nowSaved);
  };

  const onApply = () => {
    const url =
      job.applyLink ||
      job.sourceUrl ||
      (job.slug ? `https://jobsinvizag.in/jobs/${encodeURIComponent(job.slug)}` : null) ||
      'https://jobsinvizag.in';
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.badgeRow}>
          {job.isFeatured ? (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredText}>FEATURED</Text>
            </View>
          ) : null}
          {job.sourceName ? (
            <View style={styles.sourceBadge}>
              <Text style={styles.sourceText}>via {job.sourceName}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.title}>{job.title}</Text>
        {job.company ? <Text style={styles.company}>{job.company}</Text> : null}
        {job.postedAt ? (
          <Text style={styles.posted}>Posted {formatRelativePostedAt(job.postedAt)}</Text>
        ) : null}

        <View style={styles.metaCard}>
          <Row icon="location" label="Location" value={job.location} />
          <Row icon="pricetag" label="Category" value={job.category} />
          <Row icon="time" label="Type" value={job.jobType} />
          <Row icon="business" label="Work mode" value={job.workMode} />
          <Row icon="ribbon" label="Experience" value={job.experience} />
          <Row icon="cash" label="Salary" value={job.salary} />
          <Row icon="school" label="Fresher friendly" value={job.isFresher} />
        </View>

        {loadingDetail ? (
          <View style={styles.detailLoading}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.detailLoadingText}>Loading full job details…</Text>
          </View>
        ) : null}

        <Section title="About this role" body={job.description || job.shortDescription} />
        <Section title="Responsibilities" body={job.responsibilities} />
        <Section title="Eligibility" body={job.eligibility} />
        <Section title="Skills" body={job.skills} />
        <Section title="Note" body={job.warning} />
      </ScrollView>

      <View style={styles.actionBar}>
        <Pressable
          onPress={onToggle}
          style={[styles.saveBtn, saved && styles.saveBtnActive]}
          accessibilityRole="button"
          accessibilityLabel={saved ? 'Remove from saved jobs' : 'Save job'}
        >
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={saved ? colors.primary : colors.textMuted}
          />
        </Pressable>
        <Pressable onPress={onApply} style={styles.applyBtn} accessibilityRole="button" accessibilityLabel="Apply now">
          <Text style={styles.applyText}>Apply Now</Text>
          <Ionicons name="open-outline" size={18} color={colors.white} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  badgeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  featuredBadge: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentBorder,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  featuredText: { color: '#155e75', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  sourceBadge: {
    backgroundColor: colors.blueSoft,
    borderColor: colors.blueSoftBorder,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sourceText: { color: colors.primaryDark, fontSize: 10, fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '900', color: colors.text, lineHeight: 28 },
  company: { fontSize: 15, fontWeight: '700', color: colors.textMuted, marginTop: spacing.xs },
  posted: { fontSize: 12, color: colors.textSubtle, marginTop: spacing.xs },
  metaCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  metaLabel: { fontSize: 13, fontWeight: '700', color: colors.text },
  metaValue: { fontSize: 13, color: colors.textMuted, flex: 1 },
  detailLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  detailLoadingText: { fontSize: 13, color: colors.textMuted },
  section: { marginTop: spacing.xl },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  sectionBody: { fontSize: 14, color: colors.textMuted, lineHeight: 21 },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  saveBtn: {
    height: 48,
    width: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnActive: { backgroundColor: colors.blueSoft, borderColor: colors.blueSoftBorder },
  applyBtn: {
    flex: 1,
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  applyText: { color: colors.white, fontSize: 16, fontWeight: '800' },
});
