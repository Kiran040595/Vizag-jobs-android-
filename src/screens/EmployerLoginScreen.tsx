import React, { useEffect, useState } from 'react';
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

type Props = NativeStackScreenProps<RootStackParamList, 'EmployerLogin'>;

export default function EmployerLoginScreen({ navigation }: Props) {
  const { isEmployer, isLoading, isSupabaseConfigured, session, signIn } = useEmployerAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && session && isEmployer) navigation.replace('EmployerHome');
  }, [isEmployer, isLoading, navigation, session]);

  const onSubmit = async () => {
    setError('');
    if (!isSupabaseConfigured) {
      setError('Connect Supabase credentials to enable employer login.');
      return;
    }
    setSubmitting(true);
    try {
      await signIn({ email, password });
      navigation.replace('EmployerHome');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.');
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
        <Text style={styles.title}>Employer sign in</Text>
        <Text style={styles.subtitle}>
          Manage company details, submit jobs, and review applicants.
        </Text>
        <FormField
          label="Email"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="you@company.com"
        />
        <FormField
          label="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder="Your password"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable
          style={[styles.primaryBtn, submitting && styles.disabled]}
          onPress={onSubmit}
          disabled={submitting}
          accessibilityRole="button"
        >
          {submitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.primaryText}>Sign in</Text>
          )}
        </Pressable>
        <Pressable
          style={styles.linkBtn}
          onPress={() => navigation.navigate('EmployerForgotPassword')}
        >
          <Text style={styles.linkText}>Forgot password?</Text>
        </Pressable>
        <Pressable
          style={styles.linkBtn}
          onPress={() => navigation.navigate('EmployerRegister')}
        >
          <Text style={styles.linkText}>New employer? Create an account</Text>
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
