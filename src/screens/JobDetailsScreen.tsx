import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import { formatRelativePostedAt } from '../lib/freshness';
import { isJobSaved, toggleSavedJob } from '../lib/savedJobs';
import { applyButtonLabel, isInternalApplyJob, jobSupportsApply } from '../lib/jobApplyMode';
import { useStudentAuth } from '../context/StudentAuthContext';
import { fetchMyApplicationForJob } from '../services/jobApplications';

type Props = NativeStackScreenProps<RootStackParamList, 'JobDetails'>;

const Row = ({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value?: string | null }) => {
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

export default function JobDetailsScreen({ navigation, route }: Props) {
  const { job } = route.params;
  const { isLoading, isStudent, profileComplete, session } = useStudentAuth();
  const [saved, setSaved] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  useEffect(() => {
    isJobSaved(job.id).then(setSaved);
  }, [job.id]);

  useEffect(() => {
    let active = true;

    if (!session || !isStudent) {
      queueMicrotask(() => {
        if (active) setAlreadyApplied(false);
      });
      return () => {
        active = false;
      };
    }

    fetchMyApplicationForJob(job.id)
      .then((application) => {
        if (active) setAlreadyApplied(Boolean(application));
      })
      .catch(() => {
        if (active) setAlreadyApplied(false);
      });
    return () => {
      active = false;
    };
  }, [job.id, session, isStudent]);

  const onToggle = async () => {
    const nowSaved = await toggleSavedJob(job);
    setSaved(nowSaved);
  };

  const onApply = () => {
    if (!jobSupportsApply(job)) {
      Alert.alert('Apply unavailable', 'This listing does not have an apply path yet.');
      return;
    }

    if (alreadyApplied) return;

    if (session && isStudent && profileComplete) {
      if (isInternalApplyJob(job)) {
        navigation.navigate('StudentApply', { jobId: job.id, job });
        return;
      }
      if (job.applyLink) {
        void Linking.openURL(job.applyLink);
      }
      return;
    }

    if (session && isStudent && !profileComplete) {
      navigation.navigate('StudentProfile');
      return;
    }

    if (isInternalApplyJob(job)) {
      navigation.navigate('StudentLogin', { applyJobId: job.id });
      return;
    }

    // External apply: guests can open the link; signed-in students without
    // profile are nudged to complete profile first above.
    if (job.applyLink) {
      void Linking.openURL(job.applyLink);
    }
  };

  const canApply = jobSupportsApply(job);
  const label = alreadyApplied ? 'Applied' : applyButtonLabel(job);

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

        <Section title="About this role" body={job.description || job.shortDescription} />
        <Section title="Responsibilities" body={job.responsibilities} />
        <Section title="Eligibility" body={job.eligibility} />
        <Section title="Skills" body={job.skills} />
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
        {canApply ? (
          <Pressable
            onPress={onApply}
            style={[styles.applyBtn, alreadyApplied && styles.applyBtnDone]}
            disabled={isLoading || alreadyApplied}
            accessibilityRole="button"
            accessibilityLabel={label}
          >
            <Text style={styles.applyText}>{label}</Text>
            {!alreadyApplied && !isInternalApplyJob(job) ? (
              <Ionicons name="open-outline" size={18} color={colors.white} />
            ) : null}
          </Pressable>
        ) : null}
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
  applyBtnDone: { backgroundColor: colors.success },
  applyText: { color: colors.white, fontSize: 16, fontWeight: '800' },
});
