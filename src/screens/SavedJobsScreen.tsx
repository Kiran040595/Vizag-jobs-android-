import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect, type CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';
import type { Job } from '../types';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';
import { getSavedJobs, toggleSavedJob } from '../lib/savedJobs';
import JobCard from '../components/JobCard';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Saved'>,
  NativeStackScreenProps<RootStackParamList>
>;

export default function SavedJobsScreen({ navigation }: Props) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async (mode: 'focus' | 'pull' = 'focus') => {
    if (mode === 'pull') setRefreshing(true);
    const next = await getSavedJobs();
    setJobs(next);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh('focus');
    }, [refresh]),
  );

  const onToggleSave = useCallback(async (job: Job) => {
    await toggleSavedJob(job);
    setJobs((prev) => prev.filter((j) => j.id !== job.id));
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refresh('pull')}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => (
          <JobCard
            job={item}
            saved
            onPress={() => navigation.navigate('JobDetails', { job: item, jobId: item.id })}
            onToggleSave={() => onToggleSave(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="bookmark-outline" size={48} color={colors.borderStrong} />
            <Text style={styles.emptyTitle}>No saved jobs yet</Text>
            <Text style={styles.emptyBody}>
              Tap the bookmark on any job to save it for later.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, flexGrow: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: spacing.xxl },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: colors.text, marginTop: spacing.md },
  emptyBody: { marginTop: spacing.sm, textAlign: 'center', color: colors.textMuted, lineHeight: 20 },
});
