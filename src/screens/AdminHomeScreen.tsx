import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAdminAuth } from '../context/AdminAuthContext';
import type { RootStackParamList } from '../navigation/types';
import {
  approveAdminJob,
  fetchPendingEmployerJobs,
  rejectAdminJob,
} from '../services/adminJobs';
import type { EmployerJobRow } from '../services/employerJobs';
import { colors, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminHome'>;

export default function AdminHomeScreen({ navigation }: Props) {
  const { isAdmin, isLoading: authLoading, session, signOut } = useAdminAuth();
  const [jobs, setJobs] = useState<EmployerJobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [rejectingJob, setRejectingJob] = useState<EmployerJobRow | null>(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!authLoading && (!session || !isAdmin)) navigation.replace('AdminLogin');
  }, [authLoading, isAdmin, navigation, session]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!isAdmin) {
        setLoading(false);
        return () => {
          active = false;
        };
      }
      setLoading(true);
      setError('');
      void fetchPendingEmployerJobs()
        .then((rows) => {
          if (active) setJobs(rows);
        })
        .catch((err) => {
          if (active) setError(err instanceof Error ? err.message : 'Could not load pending jobs.');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [isAdmin]),
  );

  const approve = async (jobId: string) => {
    setBusyId(jobId);
    setError('');
    try {
      await approveAdminJob(jobId);
      setJobs((current) => current.filter((job) => job.id !== jobId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not approve the job.');
    } finally {
      setBusyId('');
    }
  };

  const reject = async () => {
    if (!rejectingJob) return;
    setBusyId(rejectingJob.id);
    setError('');
    try {
      await rejectAdminJob(rejectingJob.id, reason);
      setJobs((current) => current.filter((job) => job.id !== rejectingJob.id));
      setRejectingJob(null);
      setReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reject the job.');
    } finally {
      setBusyId('');
    }
  };

  const onSignOut = async () => {
    setError('');
    try {
      await signOut();
      navigation.replace('AdminLogin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign out.');
    }
  };

  if (authLoading || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.loadingText}>Loading admin reviews…</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Admin reviews</Text>
        <Text style={styles.subtitle}>Approve or reject jobs submitted by employers.</Text>
        <View style={styles.countCard}>
          <Text style={styles.count}>{jobs.length}</Text>
          <Text style={styles.countLabel}>Pending review{jobs.length === 1 ? '' : 's'}</Text>
        </View>
        <View style={styles.webNote}>
          <Text style={styles.webNoteTitle}>Mobile review portal</Text>
          <Text style={styles.webNoteBody}>
            Full jobs, employers, students, feedback, and blog CMS tools remain on the web admin.
          </Text>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {jobs.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>All caught up</Text>
            <Text style={styles.emptyBody}>There are no employer jobs waiting for review.</Text>
          </View>
        ) : (
          jobs.map((job) => (
            <View key={job.id} style={styles.card}>
              <Text style={styles.jobTitle}>{String(job.title || 'Untitled job')}</Text>
              <Text style={styles.company}>{String(job.company || '')}</Text>
              <Text style={styles.meta}>
                {[job.category, job.job_type, job.location].filter(Boolean).map(String).join(' · ')}
              </Text>
              {job.short_description ? (
                <Text style={styles.description}>{String(job.short_description)}</Text>
              ) : null}
              <View style={styles.actions}>
                <Pressable
                  style={[styles.approveBtn, busyId === job.id && styles.disabled]}
                  onPress={() => approve(job.id)}
                  disabled={Boolean(busyId)}
                >
                  {busyId === job.id ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={styles.approveText}>Approve</Text>
                  )}
                </Pressable>
                <Pressable
                  style={styles.rejectBtn}
                  onPress={() => {
                    setReason('');
                    setRejectingJob(job);
                  }}
                  disabled={Boolean(busyId)}
                >
                  <Text style={styles.rejectText}>Reject</Text>
                </Pressable>
                <Pressable
                  style={styles.applicationsBtn}
                  onPress={() => navigation.navigate('AdminJobApplications', { jobId: job.id })}
                >
                  <Text style={styles.applicationsText}>Applications</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
        <Pressable style={styles.signOutBtn} onPress={onSignOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={Boolean(rejectingJob)}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectingJob(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Reject job</Text>
            <Text style={styles.modalBody}>
              Add an optional reason for {String(rejectingJob?.title || 'this submission')}.
            </Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="Reason for rejection"
              placeholderTextColor={colors.textSubtle}
              value={reason}
              onChangeText={setReason}
              multiline
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setRejectingJob(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.confirmRejectBtn, Boolean(busyId) && styles.disabled]}
                onPress={reject}
                disabled={Boolean(busyId)}
              >
                <Text style={styles.confirmRejectText}>Reject job</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  loadingText: { marginTop: spacing.sm, color: colors.textMuted },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, backgroundColor: colors.bg },
  title: { fontSize: 24, fontWeight: '900', color: colors.text },
  subtitle: { marginTop: spacing.xs, marginBottom: spacing.lg, color: colors.textMuted },
  countCard: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    backgroundColor: colors.heroVia,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  count: { color: colors.white, fontSize: 30, fontWeight: '900' },
  countLabel: { color: colors.white, fontWeight: '700' },
  webNote: {
    backgroundColor: colors.blueSoft,
    borderWidth: 1,
    borderColor: colors.blueSoftBorder,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  webNoteTitle: { color: colors.primaryDark, fontWeight: '800' },
  webNoteBody: { color: colors.textMuted, marginTop: spacing.xs, lineHeight: 19 },
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
  jobTitle: { color: colors.text, fontWeight: '900', fontSize: 18 },
  company: { marginTop: spacing.xs, color: colors.textMuted, fontWeight: '600' },
  meta: { marginTop: spacing.sm, color: colors.textSubtle, fontSize: 13 },
  description: { marginTop: spacing.sm, color: colors.textMuted, lineHeight: 20 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  approveBtn: {
    minHeight: 40,
    backgroundColor: colors.success,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveText: { color: colors.white, fontWeight: '800' },
  rejectBtn: {
    minHeight: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#fecdd3',
    backgroundColor: '#fff1f2',
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectText: { color: '#be123c', fontWeight: '800' },
  applicationsBtn: {
    minHeight: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.blueSoftBorder,
    backgroundColor: colors.blueSoft,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applicationsText: { color: colors.primaryDark, fontWeight: '800' },
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
  signOutBtn: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  signOutText: { color: colors.primary, fontWeight: '800' },
  disabled: { opacity: 0.65 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  modalTitle: { color: colors.text, fontWeight: '900', fontSize: 20 },
  modalBody: { marginTop: spacing.sm, color: colors.textMuted, lineHeight: 20 },
  reasonInput: {
    minHeight: 100,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  cancelBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  cancelText: { color: colors.textMuted, fontWeight: '800' },
  confirmRejectBtn: {
    borderRadius: radius.md,
    backgroundColor: '#be123c',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  confirmRejectText: { color: colors.white, fontWeight: '800' },
});
