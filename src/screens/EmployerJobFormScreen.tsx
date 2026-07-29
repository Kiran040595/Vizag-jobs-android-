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
import ChipSelect from '../components/ChipSelect';
import FormField from '../components/FormField';
import { useEmployerAuth } from '../context/EmployerAuthContext';
import { JOB_CATEGORIES } from '../data/categories';
import type { JobFormValues } from '../lib/jobFormSerialize';
import type { RootStackParamList } from '../navigation/types';
import {
  createEmployerJob,
  createSuggestedSlug,
  deserializeJobForForm,
  fetchMyJobById,
  getEmptyEmployerJobForm,
  updateEmployerJob,
} from '../services/employerJobs';
import { colors, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'EmployerJobForm'>;

const REQUIRED_FIELDS: (keyof JobFormValues)[] = ['title', 'company', 'category', 'job_type'];
const CATEGORY_OPTIONS = JOB_CATEGORIES.map((category) => ({
  value: category.value,
  label: category.label,
}));

export default function EmployerJobFormScreen({ navigation, route }: Props) {
  const { isEmployer, isLoading: authLoading, profile, session } = useEmployerAuth();
  const jobId = route.params?.jobId;
  const companyName = String(profile?.company_name || '');
  const [values, setValues] = useState<JobFormValues>(() =>
    getEmptyEmployerJobForm(companyName),
  );
  const [slugManual, setSlugManual] = useState(Boolean(jobId));
  const [loading, setLoading] = useState(Boolean(jobId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && (!session || !isEmployer)) navigation.replace('EmployerLogin');
  }, [authLoading, isEmployer, navigation, session]);

  useEffect(() => {
    if (!jobId) {
      queueMicrotask(() => {
        setValues((current) => ({
          ...current,
          company: companyName || current.company,
        }));
      });
      return;
    }
    let active = true;
    queueMicrotask(() => {
      if (active) setLoading(true);
    });
    void fetchMyJobById(jobId)
      .then((job) => {
        if (!active) return;
        if (!['pending', 'draft'].includes(String(job.status || ''))) {
          setError('Only pending submissions can be edited.');
          return;
        }
        setValues(deserializeJobForForm(job));
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Could not load the job.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [companyName, jobId]);

  const setText = (name: keyof JobFormValues, value: string) => {
    setValues((current) => {
      const next = { ...current, [name]: value };
      if (!slugManual && ['title', 'company', 'posted_at'].includes(name)) {
        next.slug = createSuggestedSlug({
          title: String(next.title || ''),
          company: String(next.company || ''),
          postedAt: String(next.posted_at || ''),
        });
      }
      return next;
    });
    if (name === 'slug') setSlugManual(true);
  };

  const onSubmit = async () => {
    setError('');
    const missing = REQUIRED_FIELDS.find((field) => !String(values[field] || '').trim());
    if (missing) {
      setError(`Please fill the ${missing.replace('_', ' ')} field.`);
      return;
    }
    if (!values.slug.trim()) {
      setError('Please provide a slug for this job.');
      return;
    }
    if (values.apply_mode === 'external' && !values.apply_link.trim()) {
      setError('Add an external apply link or choose on-platform applications.');
      return;
    }

    setSaving(true);
    try {
      if (jobId) await updateEmployerJob(jobId, values);
      else await createEmployerJob(values);
      navigation.replace('EmployerJobs');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit the job.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.loadingText}>Loading job…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{jobId ? 'Edit submission' : 'Post a job'}</Text>
        <Text style={styles.subtitle}>
          Submissions are reviewed by the Vizag Jobs team before publication.
        </Text>
        <FormField label="Title" value={values.title} onChangeText={(text) => setText('title', text)} />
        <FormField
          label="Company"
          value={values.company}
          onChangeText={(text) => setText('company', text)}
          editable={!companyName}
        />
        <Text style={styles.chipLabel}>Category</Text>
        <ChipSelect
          options={CATEGORY_OPTIONS}
          selected={values.category ? [values.category] : []}
          onChange={(selected) => setText('category', selected[0] || '')}
          multi={false}
        />
        <Text style={styles.chipLabel}>Job type</Text>
        <ChipSelect
          options={['Full-time', 'Part-time', 'Contract', 'Internship', 'Walk-in']}
          selected={values.job_type ? [values.job_type] : []}
          onChange={(selected) => setText('job_type', selected[0] || '')}
          multi={false}
        />
        <FormField
          label="Location"
          value={values.location}
          onChangeText={(text) => setText('location', text)}
        />
        <Text style={styles.chipLabel}>Work mode</Text>
        <ChipSelect
          options={['On-site', 'Hybrid', 'Remote']}
          selected={values.work_mode ? [values.work_mode] : []}
          onChange={(selected) => setText('work_mode', selected[0] || '')}
          multi={false}
        />
        <FormField
          label="Experience"
          value={values.experience}
          onChangeText={(text) => setText('experience', text)}
          placeholder="e.g. 0-2 years"
        />
        <FormField
          label="Salary"
          value={values.salary}
          onChangeText={(text) => setText('salary', text)}
          placeholder="e.g. ₹3-5 LPA"
        />
        <Text style={styles.chipLabel}>Apply mode</Text>
        <ChipSelect
          options={[
            { value: 'internal', label: 'Apply on Vizag Jobs' },
            { value: 'external', label: 'External apply link' },
          ]}
          selected={[values.apply_mode]}
          onChange={(selected) =>
            setValues((current) => ({
              ...current,
              apply_mode: selected[0] === 'external' ? 'external' : 'internal',
            }))
          }
          multi={false}
        />
        {values.apply_mode === 'external' ? (
          <FormField
            label="Apply link"
            autoCapitalize="none"
            keyboardType="url"
            value={values.apply_link}
            onChangeText={(text) => setText('apply_link', text)}
            placeholder="https://..."
          />
        ) : null}
        <FormField
          label="Slug"
          autoCapitalize="none"
          value={values.slug}
          onChangeText={(text) => setText('slug', text)}
          placeholder="auto-generated-job-slug"
        />
        <FormField
          label="Short description"
          value={values.short_description}
          onChangeText={(text) => setText('short_description', text)}
          multiline
          textAlignVertical="top"
          style={styles.shortInput}
        />
        <FormField
          label="Description"
          value={values.description}
          onChangeText={(text) => setText('description', text)}
          multiline
          textAlignVertical="top"
          style={styles.longInput}
        />
        <FormField
          label="Responsibilities (one per line)"
          value={values.responsibilities}
          onChangeText={(text) => setText('responsibilities', text)}
          multiline
          textAlignVertical="top"
          style={styles.longInput}
        />
        <FormField
          label="Eligibility (one per line)"
          value={values.eligibility}
          onChangeText={(text) => setText('eligibility', text)}
          multiline
          textAlignVertical="top"
          style={styles.longInput}
        />
        <FormField
          label="Skills (one per line)"
          value={values.skills}
          onChangeText={(text) => setText('skills', text)}
          multiline
          textAlignVertical="top"
          style={styles.longInput}
        />
        <Pressable
          style={styles.checkRow}
          onPress={() => setValues((current) => ({ ...current, is_fresher: !current.is_fresher }))}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: values.is_fresher }}
        >
          <View style={[styles.checkbox, values.is_fresher && styles.checkboxOn]}>
            {values.is_fresher ? <Text style={styles.checkMark}>✓</Text> : null}
          </View>
          <Text style={styles.checkText}>This is a fresher job</Text>
        </Pressable>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable
          style={[styles.primaryBtn, saving && styles.disabled]}
          onPress={onSubmit}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.primaryText}>
              {jobId ? 'Resubmit for review' : 'Submit for review'}
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  loadingText: { marginTop: spacing.sm, color: colors.textMuted },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { fontSize: 24, fontWeight: '900', color: colors.text },
  subtitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    color: colors.textMuted,
    lineHeight: 20,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  shortInput: { minHeight: 88 },
  longInput: { minHeight: 112 },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginVertical: spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkMark: { color: colors.white, fontWeight: '900' },
  checkText: { color: colors.text, fontWeight: '600' },
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
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: colors.white, fontSize: 16, fontWeight: '800' },
  disabled: { opacity: 0.7 },
});
