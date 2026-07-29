import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEmployerAuth } from '../context/EmployerAuthContext';
import type { RootStackParamList } from '../navigation/types';
import {
  fetchMyJobs,
  type EmployerJobRow,
} from '../services/employerJobs';
import { fetchJobApplicationStats } from '../services/jobApplications';
import { colors, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'EmployerJobs'>;

const statusLabel = (job: EmployerJobRow) => {
  if (job.status === 'published') return 'Live on portal';
  if (job.status === 'pending') return 'Pending review';
  if (job.status === 'archived' && job.rejection_reason) return 'Rejected';
  if (job.status === 'archived') return 'Archived';
  return String(job.status || 'Draft');
};

const statusStyle = (status: string | undefined) => {
  if (status === 'published') return styles.statusPublished;
  if (status === 'pending') return styles.statusPending;
  if (status === 'archived') return styles.statusArchived;
  return styles.statusDraft;
};

export default function EmployerJobsScreen({ navigation }: Props) {
  const { isEmployer, isLoading: authLoading, session, user } = useEmployerAuth();
  const [jobs, setJobs] = useState<EmployerJobRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const userId = user?.id;

  useEffect(() => {
    if (!authLoading && (!session || !isEmployer)) navigation.replace('EmployerLogin');
  }, [authLoading, isEmployer, navigation, session]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const load = async () => {
        if (!userId || !isEmployer) {
          if (active) setLoading(false);
          return;
        }
        setLoading(true);
        setError('');
        try {
          const rows = await fetchMyJobs(userId);
          const publishedIds = rows
            .filter((job) => job.status === 'published')
            .map((job) => String(job.id));
          const stats = await fetchJobApplicationStats(publishedIds);
          if (active) {
            setJobs(rows);
            setCounts(stats.byJobId);
          }
        } catch (err) {
          if (active) setError(err instanceof Error ? err.message : 'Could not load jobs.');
        } finally {
          if (active) setLoading(false);
        }
      };
      void load();
      return () => {
        active = false;
      };
    }, [isEmployer, userId]),
  );

  const openJob = (job: EmployerJobRow) => {
    if (job.status === 'published') {
      navigation.navigate('EmployerJobApplications', { jobId: job.id });
    } else if (job.status === 'pending' || job.status === 'draft') {
      navigation.navigate('EmployerJobForm', { jobId: job.id });
    }
  };

  if (authLoading || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.loadingText}>Loading your jobs…</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>My job submissions</Text>
          <Text style={styles.subtitle}>Track pending, live, and rejected listings.</Text>
        </View>
        <Pressable style={styles.addBtn} onPress={() => navigation.navigate('EmployerJobForm')}>
          <Text style={styles.addText}>Post job</Text>
        </Pressable>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {jobs.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No submissions yet</Text>
          <Text style={styles.emptyBody}>Post your first job and our team will review it.</Text>
        </View>
      ) : (
        jobs.map((job) => {
          const isTappable = ['published', 'pending', 'draft'].includes(String(job.status || ''));
          return (
            <Pressable
              key={job.id}
              style={({ pressed }) => [styles.card, pressed && isTappable && styles.pressed]}
              onPress={() => openJob(job)}
              disabled={!isTappable}
            >
              <View style={styles.statusRow}>
                <Text style={styles.jobTitle}>{String(job.title || 'Untitled job')}</Text>
                <Text style={[styles.statusBadge, statusStyle(job.status)]}>{statusLabel(job)}</Text>
              </View>
              <Text style={styles.company}>{String(job.company || '')}</Text>
              {job.status === 'published' ? (
                <Text style={styles.meta}>
                  {counts[job.id] || 0} applicant{counts[job.id] === 1 ? '' : 's'} · Tap to review
                </Text>
              ) : null}
              {job.status === 'pending' || job.status === 'draft' ? (
                <Text style={styles.meta}>Tap to edit and resubmit</Text>
              ) : null}
              {job.rejection_reason ? (
                <Text style={styles.rejection}>Reason: {String(job.rejection_reason)}</Text>
              ) : null}
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  loadingText: { marginTop: spacing.sm, color: colors.textMuted },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, backgroundColor: colors.bg },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  headerCopy: { flex: 1 },
  title: { fontSize: 24, fontWeight: '900', color: colors.text },
  subtitle: { marginTop: spacing.xs, marginBottom: spacing.xl, color: colors.textMuted },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  addText: { color: colors.white, fontWeight: '800' },
  error: {
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    color: '#be123c',
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  pressed: { opacity: 0.72 },
  statusRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  jobTitle: { flex: 1, color: colors.text, fontWeight: '800', fontSize: 17 },
  statusBadge: {
    borderWidth: 1,
    borderRadius: radius.pill,
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: 11,
    fontWeight: '800',
  },
  statusPublished: { color: '#047857', borderColor: '#a7f3d0', backgroundColor: '#ecfdf5' },
  statusPending: { color: '#1d4ed8', borderColor: '#bfdbfe', backgroundColor: '#eff6ff' },
  statusDraft: { color: '#92400e', borderColor: '#fde68a', backgroundColor: '#fffbeb' },
  statusArchived: { color: colors.textMuted, borderColor: colors.border, backgroundColor: colors.bg },
  company: { marginTop: spacing.xs, color: colors.textMuted },
  meta: { marginTop: spacing.sm, color: colors.primary, fontWeight: '700', fontSize: 13 },
  rejection: { marginTop: spacing.sm, color: '#be123c', lineHeight: 19 },
  empty: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    borderRadius: radius.lg,
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyTitle: { color: colors.text, fontWeight: '800', fontSize: 17 },
  emptyBody: { marginTop: spacing.sm, color: colors.textMuted, textAlign: 'center' },
});
