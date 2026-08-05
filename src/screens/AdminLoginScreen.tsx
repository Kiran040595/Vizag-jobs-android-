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
import { useAdminAuth } from '../context/AdminAuthContext';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminLogin'>;

export default function AdminLoginScreen({ navigation }: Props) {
  const { isAdmin, isLoading, isSupabaseConfigured, session, signIn } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && session && isAdmin) navigation.replace('AdminHome');
  }, [isAdmin, isLoading, navigation, session]);

  const onSubmit = async () => {
    setError('');
    if (!isSupabaseConfigured) {
      setError('Connect Supabase credentials to enable admin login.');
      return;
    }
    setSubmitting(true);
    try {
      await signIn({ email, password });
      navigation.replace('AdminHome');
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
        <Text style={styles.title}>Admin sign in</Text>
        <Text style={styles.subtitle}>
          Review employer submissions and manage on-platform applicants.
        </Text>
        <FormField
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="admin@jobsinvizag.in"
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
        >
          {submitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.primaryText}>Sign in</Text>
          )}
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
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: colors.white, fontSize: 16, fontWeight: '800' },
  disabled: { opacity: 0.7 },
});
