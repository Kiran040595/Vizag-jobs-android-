import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import JobApplicationsList from '../components/JobApplicationsList';
import { useEmployerAuth } from '../context/EmployerAuthContext';
import type { RootStackParamList } from '../navigation/types';
import { fetchMyJobById } from '../services/employerJobs';
import { colors, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'EmployerJobApplications'>;

export default function EmployerJobApplicationsScreen({ navigation, route }: Props) {
  const { isEmployer, isLoading: authLoading, session } = useEmployerAuth();
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!session || !isEmployer)) navigation.replace('EmployerLogin');
  }, [authLoading, isEmployer, navigation, session]);

  useEffect(() => {
    let active = true;
    void fetchMyJobById(route.params.jobId)
      .then((job) => {
        if (active) setDescription(`${String(job.title || 'Job')} · ${String(job.company || '')}`);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Could not load the job.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [route.params.jobId]);

  if (authLoading || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }
  return <JobApplicationsList jobId={route.params.jobId} description={description} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    padding: spacing.lg,
  },
  error: { color: '#be123c', fontWeight: '600', textAlign: 'center' },
});
