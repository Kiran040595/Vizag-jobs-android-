import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import JobApplicationsList from '../components/JobApplicationsList';
import { useAdminAuth } from '../context/AdminAuthContext';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminJobApplications'>;

export default function AdminJobApplicationsScreen({ navigation, route }: Props) {
  const { isAdmin, isLoading, session } = useAdminAuth();

  useEffect(() => {
    if (!isLoading && (!session || !isAdmin)) navigation.replace('AdminLogin');
  }, [isAdmin, isLoading, navigation, session]);

  if (isLoading || !session || !isAdmin) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <JobApplicationsList
      jobId={route.params.jobId}
      description="Review applicants for this employer-submitted job."
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
});
