import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, type CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useStudentAuth } from '../context/StudentAuthContext';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Account'>,
  NativeStackScreenProps<RootStackParamList>
>;

export default function AccountScreen({ navigation }: Props) {
  const {
    isLoading,
    isStudent,
    isSupabaseConfigured,
    mappedProfile,
    profileComplete,
    session,
    signOut,
  } = useStudentAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      setError('');
    }, []),
  );

  const onSignOut = async () => {
    setSigningOut(true);
    setError('');
    try {
      await signOut();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign out.');
    } finally {
      setSigningOut(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!session || !isStudent) {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Your account</Text>
        <Text style={styles.subtitle}>
          Sign in as a student to apply on Vizag Jobs, track applications, and manage your profile.
        </Text>
        {!isSupabaseConfigured ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>
              Live auth needs Supabase credentials. Browsing jobs still works with sample data.
            </Text>
          </View>
        ) : null}
        <Pressable
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('StudentLogin')}
          accessibilityRole="button"
        >
          <Text style={styles.primaryText}>Student sign in</Text>
        </Pressable>
        <Pressable
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('StudentRegister')}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryText}>Create student account</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>{mappedProfile?.fullName || 'Student account'}</Text>
      <Text style={styles.subtitle}>
        {mappedProfile?.contactEmail || session.user.email}
        {mappedProfile?.phone ? ` · ${mappedProfile.phone}` : ''}
      </Text>

      <View style={[styles.statusCard, profileComplete ? styles.statusOk : styles.statusWarn]}>
        <Text style={styles.statusTitle}>
          {profileComplete ? 'Profile complete' : 'Profile incomplete'}
        </Text>
        <Text style={styles.statusBody}>
          {profileComplete
            ? 'You can apply to jobs posted directly on Vizag Jobs.'
            : 'Finish your profile before applying on-platform.'}
        </Text>
      </View>

      <Pressable
        style={styles.menuBtn}
        onPress={() => navigation.navigate('StudentProfile')}
        accessibilityRole="button"
      >
        <Text style={styles.menuTitle}>Edit profile</Text>
        <Text style={styles.menuBody}>Education, skills, and career preferences</Text>
      </Pressable>

      <Pressable
        style={styles.menuBtn}
        onPress={() => navigation.navigate('StudentApplications')}
        accessibilityRole="button"
      >
        <Text style={styles.menuTitle}>Applied jobs</Text>
        <Text style={styles.menuBody}>Track application status from employers</Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.signOutBtn, signingOut && styles.disabled]}
        onPress={onSignOut}
        disabled={signingOut}
        accessibilityRole="button"
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
  subtitle: { marginTop: spacing.sm, marginBottom: spacing.xl, color: colors.textMuted, lineHeight: 20 },
  banner: {
    backgroundColor: '#fef9c3',
    borderColor: '#fde68a',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  bannerText: { color: '#854d0e', fontSize: 13, fontWeight: '600', lineHeight: 18 },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: colors.white, fontWeight: '800', fontSize: 16 },
  secondaryBtn: {
    marginTop: spacing.md,
    borderRadius: radius.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  secondaryText: { color: colors.primary, fontWeight: '800', fontSize: 16 },
  statusCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  statusOk: { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' },
  statusWarn: { backgroundColor: '#fffbeb', borderColor: '#fde68a' },
  statusTitle: { fontWeight: '800', color: colors.text, fontSize: 15 },
  statusBody: { marginTop: spacing.xs, color: colors.textMuted, lineHeight: 20 },
  menuBtn: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  menuTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  menuBody: { marginTop: spacing.xs, color: colors.textMuted },
  error: { color: '#be123c', fontWeight: '600', marginBottom: spacing.md },
  signOutBtn: {
    marginTop: spacing.lg,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  disabled: { opacity: 0.7 },
  signOutText: { color: colors.primary, fontWeight: '800' },
});
