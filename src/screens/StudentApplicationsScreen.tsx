import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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

export default function StudentApplicationsScreen({ navigation, route }: Props) {
  const { isStudent } = useStudentAuth();
  const highlightApplicationId = route.params?.highlightApplicationId;
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const loadApplications = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'refresh') setRefreshing(true);
    else setLoading(true);
    try {
      const rows = await fetchMyApplications();
      setApplications(rows);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load applications.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!isStudent) {
        navigation.replace('StudentLogin');
        return undefined;
      }

      let active = true;
      void loadApplications('initial').then(() => {
        if (!active) return;
      });

      return () => {
        active = false;
      };
    }, [isStudent, navigation, loadApplications]),
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void loadApplications('refresh')}
              tintColor={colors.primary}
            />
          }
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
            const jobKey = item.job?.id || item.job?.slug;
            const highlighted = highlightApplicationId === item.id;
            const statusUpdated =
              item.updatedAt &&
              item.submittedAt &&
              item.updatedAt !== item.submittedAt;
            return (
              <Pressable
                style={[styles.card, highlighted && styles.cardHighlight]}
                onPress={() => {
                  if (jobKey) {
                    navigation.navigate('JobDetails', { jobId: jobKey });
                  }
                }}
                accessibilityRole="button"
                accessibilityLabel={`View job posting for ${item.job?.title || 'job'}`}
              >
                <View style={styles.cardTop}>
                  <View style={styles.cardText}>
                    <Text style={styles.jobTitle}>{item.job?.title || 'Job'}</Text>
                    {item.job?.company ? (
                      <Text style={styles.company}>{item.job.company}</Text>
                    ) : null}
                    <Text style={styles.meta}>Applied {formatApplicationTime(item.submittedAt)}</Text>
                    {statusUpdated ? (
                      <Text style={styles.meta}>
                        Status updated {formatApplicationTime(item.updatedAt)}
                      </Text>
                    ) : null}
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
                {jobKey ? <Text style={styles.viewJob}>View job posting →</Text> : null}
              </Pressable>
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
  cardHighlight: { borderColor: colors.primary, backgroundColor: colors.blueSoft },
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
  statusText: { fontSize: 11, fontWeight: '800' },
  description: { marginTop: spacing.md, color: colors.textMuted, lineHeight: 20, fontSize: 13 },
  viewJob: { marginTop: spacing.md, color: colors.primary, fontWeight: '800', fontSize: 13 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  loadingText: { color: colors.textMuted },
  empty: { alignItems: 'center', paddingTop: spacing.xxl, paddingHorizontal: spacing.lg },
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  primaryText: { color: colors.white, fontWeight: '800' },
  error: {
    color: '#be123c',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    fontWeight: '600',
  },
});
