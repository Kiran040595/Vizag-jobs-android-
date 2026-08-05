import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEmployerAuth } from '../context/EmployerAuthContext';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'EmployerHome'>;

export default function EmployerHomeScreen({ navigation }: Props) {
  const { isEmployer, isLoading, profile, session, signOut } = useEmployerAuth();
  const [error, setError] = useState('');
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!isLoading && (!session || !isEmployer)) navigation.replace('EmployerLogin');
  }, [isEmployer, isLoading, navigation, session]);

  const onSignOut = async () => {
    setError('');
    setSigningOut(true);
    try {
      await signOut();
      navigation.replace('EmployerLogin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign out.');
    } finally {
      setSigningOut(false);
    }
  };

  if (isLoading || !session || !isEmployer) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>{profile?.company_name || 'Employer portal'}</Text>
      <Text style={styles.subtitle}>
        Submit jobs for review and manage applications from Vizag candidates.
      </Text>
      <Pressable style={styles.menuBtn} onPress={() => navigation.navigate('EmployerJobs')}>
        <Text style={styles.menuTitle}>My jobs</Text>
        <Text style={styles.menuBody}>Track pending, published, and rejected submissions</Text>
      </Pressable>
      <Pressable
        style={styles.menuBtn}
        onPress={() => navigation.navigate('EmployerJobForm')}
      >
        <Text style={styles.menuTitle}>Post a job</Text>
        <Text style={styles.menuBody}>Submit a new listing for admin review</Text>
      </Pressable>
      <Pressable style={styles.menuBtn} onPress={() => navigation.navigate('EmployerProfile')}>
        <Text style={styles.menuTitle}>Company profile</Text>
        <Text style={styles.menuBody}>Update contact details, website, and logo</Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable
        style={[styles.signOutBtn, signingOut && styles.disabled]}
        onPress={onSignOut}
        disabled={signingOut}
      >
        {signingOut ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Text style={styles.signOutText}>Sign out</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, backgroundColor: colors.bg },
  title: { fontSize: 24, fontWeight: '900', color: colors.text },
  subtitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    color: colors.textMuted,
    lineHeight: 20,
  },
  menuBtn: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  menuTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  menuBody: { marginTop: spacing.xs, color: colors.textMuted, lineHeight: 19 },
  error: { color: '#be123c', fontWeight: '600', marginTop: spacing.sm },
  signOutBtn: {
    height: 48,
    marginTop: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: { color: colors.primary, fontWeight: '800' },
  disabled: { opacity: 0.7 },
});
