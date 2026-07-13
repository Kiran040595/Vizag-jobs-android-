import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing } from '../theme';
import type { Job } from '../types';
import type { RootStackParamList } from '../navigation/types';
import { getSavedJobs, toggleSavedJob } from '../lib/savedJobs';
import JobCard from '../components/JobCard';

type Props = NativeStackScreenProps<RootStackParamList, 'SavedJobs'>;

export default function SavedJobsScreen({ navigation }: Props) {
  const [jobs, setJobs] = useState<Job[]>([]);

  const refresh = useCallback(() => {
    getSavedJobs().then(setJobs);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
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
        renderItem={({ item }) => (
          <JobCard
            job={item}
            saved
            onPress={() => navigation.navigate('JobDetails', { job: item })}
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
