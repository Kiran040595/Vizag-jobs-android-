import React, { useMemo, useState } from 'react';
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
import ChipSelect from '../components/ChipSelect';
import FormField from '../components/FormField';
import { useStudentAuth } from '../context/StudentAuthContext';
import type { RootStackParamList } from '../navigation/types';
import { FEEDBACK_TYPE_OPTIONS, submitSiteFeedback } from '../services/siteFeedback';
import { colors, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Feedback'>;

export default function FeedbackScreen({ navigation }: Props) {
  const { mappedProfile, session, user } = useStudentAuth();
  const [feedbackType, setFeedbackType] = useState<string[]>(['general']);
  const [authorName, setAuthorName] = useState(mappedProfile?.fullName || '');
  const [authorEmail, setAuthorEmail] = useState(
    mappedProfile?.contactEmail || user?.email || '',
  );
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const typeOptions = useMemo(
    () => FEEDBACK_TYPE_OPTIONS.map((item) => ({ value: item.value, label: item.label })),
    [],
  );

  const onSubmit = async () => {
    setError('');
    setNotice('');
    setSubmitting(true);
    try {
      await submitSiteFeedback({
        feedbackType: feedbackType[0] || 'general',
        authorName,
        authorEmail,
        body,
        pageUrl: 'vizagjobs://feedback',
        authorUserId: session?.user?.id || null,
      });
      setNotice('Thanks — your feedback was submitted.');
      setBody('');
      setTimeout(() => navigation.goBack(), 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit feedback.');
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
        <Text style={styles.title}>Send feedback</Text>
        <Text style={styles.subtitle}>
          Tell us about a problem, feature idea, or anything else about Vizag Jobs.
        </Text>

        <Text style={styles.chipLabel}>Type</Text>
        <ChipSelect
          options={typeOptions}
          selected={feedbackType}
          onChange={setFeedbackType}
          multi={false}
        />
        <FormField label="Name" value={authorName} onChangeText={setAuthorName} />
        <FormField
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={authorEmail}
          onChangeText={setAuthorEmail}
        />
        <FormField
          label="Message"
          value={body}
          onChangeText={setBody}
          multiline
          numberOfLines={5}
          style={styles.body}
          placeholder="What should we know?"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}

        <Pressable
          style={[styles.primaryBtn, submitting && styles.disabled]}
          onPress={onSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.primaryText}>Submit feedback</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { fontSize: 22, fontWeight: '900', color: colors.text },
  subtitle: { marginTop: spacing.sm, marginBottom: spacing.lg, color: colors.textMuted },
  chipLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  body: { minHeight: 120, textAlignVertical: 'top' },
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
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.7 },
  primaryText: { color: colors.white, fontWeight: '800', fontSize: 16 },
});
