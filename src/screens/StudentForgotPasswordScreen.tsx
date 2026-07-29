import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import FormField from '../components/FormField';
import { useStudentAuth } from '../context/StudentAuthContext';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'StudentForgotPassword'>;

export default function StudentForgotPasswordScreen({ navigation }: Props) {
  const { isSupabaseConfigured, requestPasswordReset } = useStudentAuth();
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setError('');
    setNotice('');
    if (!isSupabaseConfigured) {
      setError('Connect Supabase credentials to reset passwords.');
      return;
    }
    setSubmitting(true);
    try {
      await requestPasswordReset(identifier);
      setNotice(
        'If an account matches, we sent a password reset link to your registered email. Check inbox and spam.',
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not send reset link.';
      if (/enter your email|valid 10-digit/i.test(message)) {
        setError(message);
      } else {
        setNotice(
          'If an account matches, we sent a password reset link to your registered email. Check inbox and spam.',
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Forgot password</Text>
        <Text style={styles.subtitle}>
          Enter the email or mobile number you used to register. We will send a reset link to your
          registered email.
        </Text>

        <FormField
          label="Email or mobile"
          autoCapitalize="none"
          autoCorrect={false}
          value={identifier}
          onChangeText={setIdentifier}
          placeholder="you@email.com or 98xxxxxxxx"
        />

        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.primaryBtn, submitting && styles.disabled]}
          onPress={onSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.primaryText}>Send reset link</Text>
          )}
        </Pressable>

        <Pressable onPress={() => navigation.navigate('StudentLogin')} style={styles.linkBtn}>
          <Text style={styles.linkText}>Back to sign in</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { fontSize: 24, fontWeight: '900', color: colors.text },
  subtitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    color: colors.textMuted,
    lineHeight: 20,
  },
  notice: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    color: '#047857',
    marginBottom: spacing.md,
    fontWeight: '600',
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
