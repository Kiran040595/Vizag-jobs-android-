import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { JOB_CATEGORIES } from '../data/categories';
import {
  getJobAlertPrefs,
  openEmailSubscribeCompose,
  saveJobAlertPrefs,
  submitGuestJobAlertRequest,
  type JobAlertPrefs,
} from '../lib/jobAlerts';
import { useStudentAuth } from '../context/StudentAuthContext';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'JobAlerts'>;

const ALERT_CATEGORIES = [
  ...JOB_CATEGORIES.map((c) => ({ id: c.id, label: c.label })),
  { id: 'fresher', label: 'Fresher Jobs' },
  { id: 'walk-in', label: 'Walk-in Interviews' },
];

export default function JobAlertsScreen(_props: Props) {
  const { mappedProfile, session, isStudent } = useStudentAuth();
  const [prefs, setPrefs] = useState<JobAlertPrefs | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void getJobAlertPrefs().then((loaded) => {
      if (!active) return;
      const email =
        loaded.email ||
        mappedProfile?.contactEmail ||
        session?.user?.email ||
        '';
      setPrefs({ ...loaded, email });
    });
    return () => {
      active = false;
    };
  }, [mappedProfile?.contactEmail, session?.user?.email]);

  const toggleCategory = useCallback((id: string) => {
    setPrefs((prev) => {
      if (!prev) return prev;
      const has = prev.categories.includes(id);
      return {
        ...prev,
        categories: has
          ? prev.categories.filter((c) => c !== id)
          : [...prev.categories, id],
      };
    });
  }, []);

  const onSave = async () => {
    if (!prefs) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const saved = await saveJobAlertPrefs(prefs);
      setPrefs(saved);
      if (prefs.emailEnabled && prefs.email) {
        await submitGuestJobAlertRequest({
          email: prefs.email,
          categories: prefs.categories,
        }).catch(() => ({ submitted: true, usedFeedback: false }));
      }
      setMessage(
        isStudent
          ? 'Alerts saved. They sync with your account on this and other devices.'
          : 'Preferences saved on this device.',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save alerts.');
    } finally {
      setSaving(false);
    }
  };

  const onEmailCompose = async () => {
    if (!prefs) return;
    try {
      await openEmailSubscribeCompose(prefs.email, prefs.categories.map((id) => {
        const match = ALERT_CATEGORIES.find((c) => c.id === id);
        return match?.label || id;
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open email app.');
    }
  };

  if (!prefs) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Stay updated</Text>
      <Text style={styles.subtitle}>
        Choose categories and how you want to hear about new Vizag openings.
      </Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={prefs.email}
        onChangeText={(email) => setPrefs({ ...prefs, email })}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>Email alerts</Text>
          <Text style={styles.rowBody}>We will use your email for digest updates</Text>
        </View>
        <Switch
          value={prefs.emailEnabled}
          onValueChange={(emailEnabled) => setPrefs({ ...prefs, emailEnabled })}
          trackColor={{ true: colors.primary }}
        />
      </View>

      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>Push notifications</Text>
          <Text style={styles.rowBody}>
            Application status and Q&amp;A replies while you use the app
          </Text>
        </View>
        <Switch
          value={prefs.pushEnabled}
          onValueChange={(pushEnabled) => setPrefs({ ...prefs, pushEnabled })}
          trackColor={{ true: colors.primary }}
        />
      </View>

      <Text style={[styles.label, { marginTop: spacing.lg }]}>Categories</Text>
      <View style={styles.chips}>
        {ALERT_CATEGORIES.map((cat) => {
          const active = prefs.categories.includes(cat.id);
          return (
            <Pressable
              key={cat.id}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => toggleCategory(cat.id)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {message ? <Text style={styles.success}>{message}</Text> : null}

      <Pressable
        style={[styles.primaryBtn, saving && styles.disabled]}
        onPress={onSave}
        disabled={saving}
        accessibilityRole="button"
      >
        {saving ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.primaryText}>Save alerts</Text>
        )}
      </Pressable>

      <Pressable style={styles.secondaryBtn} onPress={onEmailCompose} accessibilityRole="button">
        <Text style={styles.secondaryText}>Subscribe by email</Text>
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
  label: { fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  rowText: { flex: 1, paddingRight: spacing.md },
  rowTitle: { fontWeight: '800', color: colors.text },
  rowBody: { marginTop: 4, color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: '700', fontSize: 13 },
  chipTextActive: { color: colors.white },
  error: { color: '#be123c', fontWeight: '600', marginTop: spacing.md },
  success: { color: '#047857', fontWeight: '600', marginTop: spacing.md },
  primaryBtn: {
    marginTop: spacing.xl,
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
  disabled: { opacity: 0.7 },
});
