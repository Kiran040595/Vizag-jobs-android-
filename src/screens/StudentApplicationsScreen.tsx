import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useStudentAuth } from '../context/StudentAuthContext';
import {
  formatApplicationStatus,
  getApplicationStatusColors,
  getApplicationStatusDescription,
  normalizeApplicationStatus,
  STUDENT_STATUS_FILTERS,
} from '../lib/applicationStatus';
import type { RootStackParamList } from '../navigation/types';
import {
  fetchMyApplications,
  formatApplicationTime,
  type JobApplication,
} from '../services/jobApplications';
import { colors, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'StudentApplications'>;

export default function StudentApplicationsScreen({ navigation }: Props) {
  const { isStudent } = useStudentAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useFocusEffect(
    useCallback(() => {
      if (!isStudent) {
        navigation.replace('StudentLogin');
        return undefined;
      }

      let active = true;
      setLoading(true);
      fetchMyApplications()
        .then((rows) => {
          if (!active) return;
          setApplications(rows);
          setError('');
        })
        .catch((err) => {
          if (!active) return;
          setError(err instanceof Error ? err.message : 'Could not load applications.');
        })
        .finally(() => {
          if (active) setLoading(false);
        });

      return () => {
        active = false;
      };
    }, [isStudent, navigation]),
  );

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return applications;
    return applications.filter(
      (application) => normalizeApplicationStatus(application.status) === statusFilter,
    );
  }, [applications, statusFilter]);

  const statusCounts = useMemo(() => {
    return applications.reduce<Record<string, number>>((counts, application) => {
      const status = normalizeApplicationStatus(application.status);
      counts[status] = (counts[status] || 0) + 1;
      return counts;
    }, {});
  }, [applications]);

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!loading && applications.length > 0 ? (
        <FlatList
          horizontal
          data={[...STUDENT_STATUS_FILTERS]}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
          renderItem={({ item }) => {
            const count = item.id === 'all' ? applications.length : statusCounts[item.id] || 0;
            const active = statusFilter === item.id;
            return (
              <Pressable
                onPress={() => setStatusFilter(item.id)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {item.label} ({count})
                </Text>
              </Pressable>
            );
          }}
        />
      ) : null}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading your applied jobs…</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>
                {applications.length === 0 ? 'No applied jobs yet' : 'No jobs in this status'}
              </Text>
              <Text style={styles.emptyBody}>
                {applications.length === 0
                  ? 'Apply to jobs posted directly on Vizag Jobs to track status here.'
                  : 'Try another filter to see your applications.'}
              </Text>
              {applications.length === 0 ? (
                <Pressable
                  style={styles.primaryBtn}
                  onPress={() => navigation.navigate('MainTabs', { screen: 'Jobs' })}
                >
                  <Text style={styles.primaryText}>Browse jobs</Text>
                </Pressable>
              ) : null}
            </View>
          }
          renderItem={({ item }) => {
            const statusColors = getApplicationStatusColors(item.status);
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.cardText}>
                    <Text style={styles.jobTitle}>{item.job?.title || 'Job'}</Text>
                    {item.job?.company ? (
                      <Text style={styles.company}>{item.job.company}</Text>
                    ) : null}
                    <Text style={styles.meta}>Applied {formatApplicationTime(item.submittedAt)}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: statusColors.bg, borderColor: statusColors.border },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: statusColors.text }]}>
                      {formatApplicationStatus(item.status)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.description}>
                  {getApplicationStatusDescription(item.status)}
                </Text>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  filters: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  filterChip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontWeight: '700', color: colors.textMuted, fontSize: 13 },
  filterTextActive: { color: colors.white },
  list: { padding: spacing.lg, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  cardText: { flex: 1 },
  jobTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  company: { marginTop: 2, color: colors.textMuted, fontWeight: '600' },
  meta: { marginTop: spacing.sm, color: colors.textSubtle, fontSize: 12 },
  statusBadge: {
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  statusText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  description: {
    marginTop: spacing.md,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.textMuted,
    lineHeight: 20,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: spacing.md, color: colors.textMuted },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  emptyBody: {
    marginTop: spacing.sm,
    textAlign: 'center',
    color: colors.textMuted,
    lineHeight: 20,
  },
  primaryBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  primaryText: { color: colors.white, fontWeight: '800' },
  error: {
    margin: spacing.lg,
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    color: '#be123c',
    fontWeight: '600',
  },
});
