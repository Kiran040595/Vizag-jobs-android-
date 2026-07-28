import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import FormField from '../components/FormField';
import { useStudentAuth } from '../context/StudentAuthContext';
import { applyButtonLabel, isInternalApplyJob } from '../lib/jobApplyMode';
import { formatApplicationStatus } from '../lib/applicationStatus';
import type { RootStackParamList } from '../navigation/types';
import type { Job } from '../types';
import {
  fetchMyApplicationForJob,
  formatApplicationTime,
  submitJobApplication,
  type JobApplication,
} from '../services/jobApplications';
import { fetchJobs } from '../services/jobs';
import { colors, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'StudentApply'>;

export default function StudentApplyScreen({ navigation, route }: Props) {
  const { jobId } = route.params;
  const { isStudent, mappedProfile, profileComplete, profile, session } = useStudentAuth();
  const [job, setJob] = useState<Job | null>(route.params.job ?? null);
  const [existing, setExisting] = useState<JobApplication | null>(null);
  const [coverNote, setCoverNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!session || !isStudent) {
      navigation.replace('StudentLogin', { applyJobId: jobId });
    }
  }, [session, isStudent, navigation, jobId]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [jobsResult, application] = await Promise.all([
          route.params.job ? Promise.resolve({ jobs: [route.params.job] }) : fetchJobs(),
          fetchMyApplicationForJob(jobId),
        ]);
        if (!active) return;
        const found =
          jobsResult.jobs.find((item) => item.id === jobId) || route.params.job || null;
        setJob(found);
        setExisting(application);
        setError(found ? '' : 'Could not find this job.');
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Could not load this job.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [jobId, route.params.job]);

  const onSubmit = async () => {
    setError('');
    setNotice('');
    if (!profileComplete) {
      setError('Complete your student profile before applying.');
      return;
    }
    if (!isInternalApplyJob(job)) {
      setError('This job accepts applications on an external site.');
      return;
    }
    setSubmitting(true);
    try {
      await submitJobApplication({ jobId, coverNote });
      setNotice('Your application was submitted successfully.');
      setTimeout(() => {
        navigation.replace('StudentApplications');
      }, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit your application.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.eyebrow}>Applying for</Text>
        <Text style={styles.title}>{job?.title || 'Job'}</Text>
        <Text style={styles.subtitle}>
          {[job?.company, job?.location].filter(Boolean).join(' · ')}
        </Text>

        {existing ? (
          <View style={styles.existing}>
            <Text style={styles.existingTitle}>
              You already applied{existing.submittedAt ? ` on ${formatApplicationTime(existing.submittedAt)}` : ''}.
            </Text>
            <Text style={styles.existingBody}>
              Current status: {formatApplicationStatus(existing.status)}
            </Text>
            <Pressable onPress={() => navigation.navigate('StudentApplications')}>
              <Text style={styles.link}>View all applied jobs</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.form}>
            {!profileComplete ? (
              <View style={styles.warn}>
                <Text style={styles.warnText}>
                  Complete your student profile before applying on Vizag Jobs.
                </Text>
                <Pressable onPress={() => navigation.navigate('StudentProfile')}>
                  <Text style={styles.link}>Edit profile</Text>
                </Pressable>
              </View>
            ) : null}

            <View style={styles.metaGrid}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Name</Text>
                <Text style={styles.metaValue}>
                  {mappedProfile?.fullName || String(profile?.full_name || '—')}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Phone</Text>
                <Text style={styles.metaValue}>
                  {mappedProfile?.phone || String(profile?.phone || '—')}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Email</Text>
                <Text style={styles.metaValue}>
                  {mappedProfile?.contactEmail || String(profile?.contact_email || '—')}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Education</Text>
                <Text style={styles.metaValue}>
                  {[mappedProfile?.degree, mappedProfile?.branch, mappedProfile?.graduationYear]
                    .filter(Boolean)
                    .join(' · ') || '—'}
                </Text>
              </View>
            </View>

            <FormField
              label="Cover note (optional)"
              value={coverNote}
              onChangeText={setCoverNote}
              multiline
              numberOfLines={4}
              style={styles.coverNote}
              placeholder="Briefly explain why you are a good fit."
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}
            {notice ? <Text style={styles.notice}>{notice}</Text> : null}

            <Pressable
              style={[styles.primaryBtn, (submitting || !profileComplete) && styles.disabled]}
              onPress={onSubmit}
              disabled={submitting || !profileComplete}
            >
              {submitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.primaryText}>{applyButtonLabel(job)}</Text>
              )}
            </Pressable>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textSubtle,
  },
  title: { marginTop: spacing.sm, fontSize: 22, fontWeight: '900', color: colors.text },
  subtitle: { marginTop: spacing.xs, color: colors.textMuted, marginBottom: spacing.lg },
  existing: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  existingTitle: { color: '#047857', fontWeight: '700', lineHeight: 20 },
  existingBody: { marginTop: spacing.sm, color: '#065f46', fontWeight: '700' },
  form: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  warn: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  warnText: { color: '#92400e', fontWeight: '600', marginBottom: spacing.sm },
  metaGrid: { gap: spacing.md, marginBottom: spacing.lg },
  metaItem: {},
  metaLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.textSubtle,
  },
  metaValue: { marginTop: 4, color: colors.text, fontWeight: '600' },
  coverNote: { minHeight: 110, textAlignVertical: 'top' },
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
  notice: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    color: '#047857',
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.7 },
  primaryText: { color: colors.white, fontWeight: '800', fontSize: 16 },
  link: { color: colors.primary, fontWeight: '800', marginTop: spacing.sm },
});
