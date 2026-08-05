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
import { upsertEmployerProfile } from '../services/employerJobs';
import { colors, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'EmployerProfile'>;

export default function EmployerProfileScreen({ navigation }: Props) {
  const { isLoading, profile, refreshEmployerAccess, session, user } = useEmployerAuth();
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !session) navigation.replace('EmployerLogin');
  }, [isLoading, navigation, session]);

  useEffect(() => {
    queueMicrotask(() => {
      setCompanyName(String(profile?.company_name || user?.user_metadata?.company_name || ''));
      setContactName(String(profile?.contact_name || ''));
      setContactEmail(String(profile?.contact_email || user?.email || ''));
      setPhone(String(profile?.phone || ''));
      setWebsite(String(profile?.website || ''));
      setLogoUrl(String(profile?.company_logo_url || ''));
    });
  }, [profile, user]);

  const onSave = async () => {
    setError('');
    setNotice('');
    setSubmitting(true);
    try {
      await upsertEmployerProfile({
        company_name: companyName,
        contact_name: contactName,
        contact_email: contactEmail,
        phone,
        website,
        company_logo_url: logoUrl,
      });
      if (user?.id) await refreshEmployerAccess(user.id);
      setNotice('Company profile saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || !session) {
    return <ActivityIndicator style={styles.loader} color={colors.primary} size="large" />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Company profile</Text>
        <Text style={styles.subtitle}>
          These details are used on your job submissions and to contact your team.
        </Text>
        <FormField
          label="Company name"
          value={companyName}
          onChangeText={setCompanyName}
          placeholder="Your company Pvt Ltd"
        />
        <FormField label="Contact name" value={contactName} onChangeText={setContactName} />
        <FormField
          label="Contact email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={contactEmail}
          onChangeText={setContactEmail}
        />
        <FormField
          label="Phone"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <FormField
          label="Website"
          autoCapitalize="none"
          keyboardType="url"
          value={website}
          onChangeText={setWebsite}
          placeholder="https://..."
        />
        <FormField
          label="Company logo URL"
          autoCapitalize="none"
          keyboardType="url"
          value={logoUrl}
          onChangeText={setLogoUrl}
          placeholder="https://..."
        />
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable
          style={[styles.primaryBtn, submitting && styles.disabled]}
          onPress={onSave}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.primaryText}>Save profile</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  loader: { flex: 1, backgroundColor: colors.bg },
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
  disabled: { opacity: 0.7 },
});
