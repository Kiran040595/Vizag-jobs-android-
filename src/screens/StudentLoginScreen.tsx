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
import {
  getPendingApplyJobId,
  setPendingApplyJobId,
} from '../lib/studentApplyRedirect';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'StudentLogin'>;

export default function StudentLoginScreen({ navigation, route }: Props) {
  const { signIn, isSupabaseConfigured } = useStudentAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (route.params?.applyJobId) {
      void setPendingApplyJobId(route.params.applyJobId);
    }
  }, [route.params?.applyJobId]);

  const continueAfterAuth = async () => {
    const applyJobId = route.params?.applyJobId || (await getPendingApplyJobId());
    if (applyJobId) {
      navigation.replace('StudentApply', { jobId: applyJobId });
      return;
    }
    navigation.goBack();
  };

  const onSubmit = async () => {
    setError('');
    if (!isSupabaseConfigured) {
      setError('Connect Supabase credentials to enable student login.');
      return;
    }
    setSubmitting(true);
    try {
      await signIn({ identifier, password });
      await continueAfterAuth();
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
        <Text style={styles.title}>Student sign in</Text>
        <Text style={styles.subtitle}>
          Use the email or mobile number from your Vizag Jobs student account.
        </Text>

        {!isSupabaseConfigured ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>
              Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and
              EXPO_PUBLIC_SUPABASE_ANON_KEY to enable live auth.
            </Text>
          </View>
        ) : null}

        <FormField
          label="Email or mobile"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          value={identifier}
          onChangeText={setIdentifier}
          placeholder="you@email.com or 98xxxxxxxx"
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
          onPress={() => navigation.navigate('StudentForgotPassword')}
          style={styles.linkBtn}
          accessibilityRole="button"
        >
          <Text style={styles.linkText}>Forgot password?</Text>
        </Pressable>

        <Pressable
          onPress={() =>
            navigation.navigate('StudentRegister', { applyJobId: route.params?.applyJobId })
          }
          style={styles.linkBtn}
          accessibilityRole="button"
        >
          <Text style={styles.linkText}>New here? Create a student account</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
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
