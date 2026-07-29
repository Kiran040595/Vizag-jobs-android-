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
import { supabase } from '../lib/supabaseClient';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'StudentResetPassword'>;

export default function StudentResetPasswordScreen({ navigation }: Props) {
  const { isLoading, isSupabaseConfigured, session, signOut, updatePassword } = useStudentAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [recoveryChecked, setRecoveryChecked] = useState(false);

  useEffect(() => {
    if (!supabase) {
      queueMicrotask(() => setRecoveryChecked(true));
      return undefined;
    }

    let ignore = false;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (ignore) return;
      if (event === 'PASSWORD_RECOVERY' || nextSession) {
        setRecoveryReady(true);
      }
      setRecoveryChecked(true);
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (ignore) return;
      if (data.session) setRecoveryReady(true);
      setRecoveryChecked(true);
    });

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, []);

  const canReset = recoveryReady || Boolean(session);

  const onSubmit = async () => {
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await updatePassword(password);
      try {
        await signOut();
      } catch {
        // Ignore sign-out failures; password was already updated.
      }
      navigation.replace('StudentLogin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update password.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Supabase is not configured.</Text>
      </View>
    );
  }

  if (isLoading || !recoveryChecked) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.subtitle}>Checking reset link…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Reset password</Text>

        {!canReset ? (
          <>
            <Text style={styles.error}>
              This reset link is invalid or has expired. Request a new one and try again.
            </Text>
            <Pressable
              onPress={() => navigation.replace('StudentForgotPassword')}
              style={styles.linkBtn}
            >
              <Text style={styles.linkText}>Request a new reset link</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.subtitle}>Enter a new password for your student account.</Text>
            <FormField
              label="New password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
            />
            <FormField
              label="Confirm new password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repeat password"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable
              style={[styles.primaryBtn, submitting && styles.disabled]}
              onPress={onSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.primaryText}>Update password</Text>
              )}
            </Pressable>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    padding: spacing.lg,
  },
  title: { fontSize: 24, fontWeight: '900', color: colors.text },
  subtitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    color: colors.textMuted,
    lineHeight: 20,
  },
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
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.7 },
  primaryText: { color: colors.white, fontWeight: '800', fontSize: 16 },
  linkBtn: { marginTop: spacing.lg, alignItems: 'center' },
  linkText: { color: colors.primary, fontWeight: '700' },
});
