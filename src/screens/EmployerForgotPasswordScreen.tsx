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
import { useEmployerAuth } from '../context/EmployerAuthContext';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'EmployerForgotPassword'>;

export default function EmployerForgotPasswordScreen({ navigation }: Props) {
  const { isSupabaseConfigured, requestPasswordReset } = useEmployerAuth();
  const [email, setEmail] = useState('');
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
      await requestPasswordReset(email);
      setNotice(
        'If an account matches, we sent a reset link to that email. Check your inbox and spam.',
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not send reset link.';
      if (/enter the email/i.test(message)) setError(message);
      else {
        setNotice(
          'If an account matches, we sent a reset link to that email. Check your inbox and spam.',
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
          Enter the email for your employer account and we will send a reset link.
        </Text>
        <FormField
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="you@company.com"
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
        <Pressable style={styles.linkBtn} onPress={() => navigation.navigate('EmployerLogin')}>
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
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: colors.white, fontSize: 16, fontWeight: '800' },
  linkBtn: { marginTop: spacing.lg, alignItems: 'center' },
  linkText: { color: colors.primary, fontWeight: '700' },
  disabled: { opacity: 0.7 },
});
