import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  APPLICATION_STATUSES,
  formatApplicationStatus,
  getApplicationStatusColors,
} from '../lib/applicationStatus';
import {
  fetchJobApplications,
  formatApplicationTime,
  getApplicationResumeUrl,
  updateApplicationStatus,
  type JobApplication,
} from '../services/jobApplications';
import { colors, radius, spacing } from '../theme';

const REVIEW_STATUSES = APPLICATION_STATUSES.filter((status) => status !== 'withdrawn');

type Props = {
  jobId: string;
  description?: string;
};

const snapshotText = (snapshot: Record<string, unknown>, ...keys: string[]) => {
  const value = keys.map((key) => snapshot[key]).find(Boolean);
  return value == null ? '' : String(value);
};

export default function JobApplicationsList({ jobId, description }: Props) {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState('');

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setLoading(true);
      setError('');
    });
    void fetchJobApplications(jobId)
      .then((rows) => {
        if (active) setApplications(rows);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Could not load applications.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [jobId]);

  const changeStatus = async (applicationId: string, status: string) => {
    setUpdatingId(applicationId);
    setError('');
    try {
      const updated = await updateApplicationStatus({ applicationId, status });
      setApplications((current) =>
        current.map((application) => (application.id === updated.id ? updated : application)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update application.');
    } finally {
      setUpdatingId('');
    }
  };

  const openResume = async (application: JobApplication) => {
    try {
      const url = await getApplicationResumeUrl(application);
      if (!url) throw new Error('Resume is not available.');
      await Linking.openURL(url);
    } catch (err) {
      Alert.alert('Could not open resume', err instanceof Error ? err.message : 'Try again.');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.loadingText}>Loading applications…</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Job applications</Text>
      <Text style={styles.subtitle}>
        {description || `${applications.length} applicant${applications.length === 1 ? '' : 's'}`}
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {applications.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No applications yet</Text>
          <Text style={styles.emptyBody}>Students will appear here after applying to this job.</Text>
        </View>
      ) : (
        applications.map((application) => {
          const snapshot = application.profileSnapshot || {};
          const name = snapshotText(snapshot, 'fullName', 'full_name') || 'Applicant';
          const email = snapshotText(snapshot, 'contactEmail', 'contact_email');
          const rawPhone = snapshotText(snapshot, 'phone');
          const phone = rawPhone.replace(/\D/g, '').slice(-10);
          const degree = snapshotText(snapshot, 'degree');
          const branch = snapshotText(snapshot, 'branch');
          const year = snapshotText(snapshot, 'graduationYear', 'graduation_year');
          const college = snapshotText(snapshot, 'college');
          const skills = Array.isArray(snapshot.skills)
            ? snapshot.skills.map(String).filter(Boolean).join(', ')
            : '';

          return (
            <View key={application.id} style={styles.card}>
              <View style={styles.headingRow}>
                <View style={styles.headingCopy}>
                  <Text style={styles.applicantName}>{name}</Text>
                  <Text style={styles.qualification}>
                    {[degree, branch, year].filter(Boolean).join(' · ') || 'Qualification not provided'}
                  </Text>
                  {college ? <Text style={styles.meta}>{college}</Text> : null}
                </View>
                <Text style={styles.appliedAt}>{formatApplicationTime(application.submittedAt)}</Text>
              </View>

              <View style={styles.contactBox}>
                <Text style={styles.contactLabel}>Email</Text>
                <Pressable disabled={!email} onPress={() => Linking.openURL(`mailto:${email}`)}>
                  <Text style={[styles.contactValue, email && styles.link]}>
                    {email || 'Not provided'}
                  </Text>
                </Pressable>
                <Text style={styles.contactLabel}>Phone / WhatsApp</Text>
                <View style={styles.contactActions}>
                  <Text style={styles.contactValue}>{rawPhone || 'Not provided'}</Text>
                  {phone ? (
                    <>
                      <Pressable onPress={() => Linking.openURL(`tel:${phone}`)}>
                        <Text style={styles.link}>Call</Text>
                      </Pressable>
                      <Pressable onPress={() => Linking.openURL(`https://wa.me/91${phone}`)}>
                        <Text style={styles.whatsapp}>WhatsApp</Text>
                      </Pressable>
                    </>
                  ) : null}
                </View>
              </View>

              {skills ? (
                <Text style={styles.detail}>
                  <Text style={styles.detailLabel}>Skills: </Text>
                  {skills}
                </Text>
              ) : null}
              {application.coverNote ? (
                <Text style={styles.detail}>
                  <Text style={styles.detailLabel}>Cover note: </Text>
                  {application.coverNote}
                </Text>
              ) : null}

              {application.resumePath ? (
                <Pressable style={styles.resumeBtn} onPress={() => openResume(application)}>
                  <Text style={styles.resumeText}>Open resume</Text>
                </Pressable>
              ) : (
                <Text style={styles.noResume}>No resume attached</Text>
              )}

              <Text style={styles.statusLabel}>Application status</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.statusRow}
              >
                {REVIEW_STATUSES.map((status) => {
                  const selected = application.status === status;
                  const palette = getApplicationStatusColors(status);
                  return (
                    <Pressable
                      key={status}
                      disabled={updatingId === application.id}
                      onPress={() => changeStatus(application.id, status)}
                      style={[
                        styles.statusChip,
                        {
                          backgroundColor: selected ? palette.bg : colors.surface,
                          borderColor: selected ? palette.border : colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.statusText, selected && { color: palette.text }]}>
                        {formatApplicationStatus(status)}
                      </Text>
                    </Pressable>
                  );
                })}
                {updatingId === application.id ? (
                  <ActivityIndicator color={colors.primary} />
                ) : null}
              </ScrollView>
            </View>
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
  title: { fontSize: 24, fontWeight: '900', color: colors.text },
  subtitle: { marginTop: spacing.xs, marginBottom: spacing.xl, color: colors.textMuted },
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
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  headingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  headingCopy: { flex: 1 },
  applicantName: { color: colors.text, fontWeight: '900', fontSize: 18 },
  qualification: { marginTop: spacing.xs, color: colors.textMuted },
  meta: { marginTop: spacing.xs, color: colors.textSubtle },
  appliedAt: { maxWidth: 100, color: colors.textSubtle, fontSize: 11, textAlign: 'right' },
  contactBox: {
    marginTop: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    padding: spacing.md,
  },
  contactLabel: {
    marginTop: spacing.xs,
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  contactValue: { marginTop: spacing.xs, color: colors.text },
  contactActions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.md },
  link: { color: colors.primary, fontWeight: '700' },
  whatsapp: { color: colors.success, fontWeight: '800' },
  detail: { marginTop: spacing.md, color: colors.textMuted, lineHeight: 20 },
  detailLabel: { color: colors.text, fontWeight: '800' },
  resumeBtn: {
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.blueSoftBorder,
    backgroundColor: colors.blueSoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  resumeText: { color: colors.primaryDark, fontWeight: '800' },
  noResume: { marginTop: spacing.md, color: colors.textSubtle, fontStyle: 'italic' },
  statusLabel: { marginTop: spacing.lg, marginBottom: spacing.xs, color: colors.text, fontWeight: '800' },
  statusRow: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  statusChip: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  statusText: { color: colors.textMuted, fontWeight: '700', fontSize: 12 },
});
