import React, { useEffect, useMemo, useState } from 'react';
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
import { useStudentAuth } from '../context/StudentAuthContext';
import {
  STUDENT_AVAILABILITY_OPTIONS,
  STUDENT_JOB_CATEGORY_OPTIONS,
  STUDENT_PREFERRED_LOCATION_OPTIONS,
  STUDENT_ROLE_EXPERIENCE_OPTIONS,
} from '../lib/studentCareerPreferences';
import { EMPTY_STUDENT_CONSENTS } from '../lib/studentConsent';
import {
  getPendingApplyJobId,
  setPendingApplyJobId,
} from '../lib/studentApplyRedirect';
import {
  STUDENT_BRANCH_OPTIONS,
  STUDENT_DEGREE_OPTIONS,
  STUDENT_GRADUATION_YEAR_OPTIONS,
  STUDENT_SKILL_OPTIONS,
} from '../lib/studentProfileOptions';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'StudentRegister'>;

export default function StudentRegisterScreen({ navigation, route }: Props) {
  const { signUp, isSupabaseConfigured } = useStudentAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [college, setCollege] = useState('');
  const [phone, setPhone] = useState('');
  const [degree, setDegree] = useState<string[]>([]);
  const [branch, setBranch] = useState<string[]>([]);
  const [graduationYear, setGraduationYear] = useState<string[]>([]);
  const [isFresher, setIsFresher] = useState<string[]>(['yes']);
  const [skills, setSkills] = useState<string[]>([]);
  const [certifications, setCertifications] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [primaryRole, setPrimaryRole] = useState('');
  const [roleExperience, setRoleExperience] = useState<string[]>([]);
  const [availability, setAvailability] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [consents, setConsents] = useState({ ...EMPTY_STUDENT_CONSENTS });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (route.params?.applyJobId) {
      void setPendingApplyJobId(route.params.applyJobId);
    }
  }, [route.params?.applyJobId]);

  const skillOptions = useMemo(
    () => STUDENT_SKILL_OPTIONS.map((item) => ({ value: item.value, label: item.label })),
    [],
  );
  const categoryOptions = useMemo(
    () => STUDENT_JOB_CATEGORY_OPTIONS.map((item) => ({ value: item.value, label: item.label })),
    [],
  );
  const experienceOptions = useMemo(
    () => STUDENT_ROLE_EXPERIENCE_OPTIONS.map((item) => ({ value: item.value, label: item.label })),
    [],
  );
  const availabilityOptions = useMemo(
    () => STUDENT_AVAILABILITY_OPTIONS.map((item) => ({ value: item.value, label: item.label })),
    [],
  );

  const toggleConsent = (key: keyof typeof consents) => {
    setConsents((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const onSubmit = async () => {
    setError('');
    if (!isSupabaseConfigured) {
      setError('Connect Supabase credentials to enable student registration.');
      return;
    }
    setSubmitting(true);
    try {
      await signUp({
        email,
        phone,
        password,
        consents,
        profile: {
          full_name: fullName,
          college,
          phone,
          degree: degree[0],
          branch: branch[0],
          graduation_year: graduationYear[0],
          is_fresher: isFresher[0] === 'yes',
          skills,
          certifications,
          target_job_categories: categories,
          primary_target_role: primaryRole,
          role_experience_level: roleExperience[0],
          preferred_locations: locations,
          availability: availability[0],
          expected_salary_min: salaryMin || null,
          expected_salary_max: salaryMax || null,
          contact_email: email,
        },
      });
      const applyJobId = route.params?.applyJobId || (await getPendingApplyJobId());
      if (applyJobId) {
        navigation.replace('StudentApply', { jobId: applyJobId });
      } else {
        navigation.navigate('MainTabs', { screen: 'Account' });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create your account.');
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
        <Text style={styles.title}>Create student account</Text>
        <Text style={styles.subtitle}>
          One-step profile so you can apply to jobs posted on Vizag Jobs.
        </Text>

        <Text style={styles.section}>Account</Text>
        <FormField
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="you@email.com"
        />
        <FormField
          label="Mobile (10-digit)"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          placeholder="98xxxxxxxx"
        />
        <FormField
          label="Password (min 6 characters)"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder="Create a password"
        />

        <Text style={styles.section}>Education</Text>
        <FormField label="Full name" value={fullName} onChangeText={setFullName} placeholder="Your name" />
        <FormField
          label="College / university"
          value={college}
          onChangeText={setCollege}
          placeholder="College name"
        />
        <Text style={styles.chipLabel}>Degree</Text>
        <ChipSelect options={[...STUDENT_DEGREE_OPTIONS]} selected={degree} onChange={setDegree} multi={false} />
        <Text style={styles.chipLabel}>Branch</Text>
        <ChipSelect options={[...STUDENT_BRANCH_OPTIONS]} selected={branch} onChange={setBranch} multi={false} />
        <Text style={styles.chipLabel}>Graduation year</Text>
        <ChipSelect
          options={STUDENT_GRADUATION_YEAR_OPTIONS}
          selected={graduationYear}
          onChange={setGraduationYear}
          multi={false}
        />
        <Text style={styles.chipLabel}>Are you a fresher?</Text>
        <ChipSelect
          options={[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
          ]}
          selected={isFresher}
          onChange={setIsFresher}
          multi={false}
        />

        <Text style={styles.section}>Career preferences</Text>
        <Text style={styles.chipLabel}>Target job categories</Text>
        <ChipSelect options={categoryOptions} selected={categories} onChange={setCategories} max={8} />
        <FormField
          label="Primary target role"
          value={primaryRole}
          onChangeText={setPrimaryRole}
          placeholder="e.g. React Native Developer"
        />
        <Text style={styles.chipLabel}>Experience in this role</Text>
        <ChipSelect
          options={experienceOptions}
          selected={roleExperience}
          onChange={setRoleExperience}
          multi={false}
        />
        <Text style={styles.chipLabel}>Availability</Text>
        <ChipSelect
          options={availabilityOptions}
          selected={availability}
          onChange={setAvailability}
          multi={false}
        />
        <Text style={styles.chipLabel}>Preferred work locations</Text>
        <ChipSelect
          options={[...STUDENT_PREFERRED_LOCATION_OPTIONS]}
          selected={locations}
          onChange={setLocations}
          max={8}
        />
        <Text style={styles.chipLabel}>Skills</Text>
        <ChipSelect options={skillOptions} selected={skills} onChange={setSkills} max={16} />
        <FormField
          label="Certifications / courses"
          value={certifications}
          onChangeText={setCertifications}
          placeholder="e.g. AWS Cloud Practitioner; None"
        />
        <View style={styles.salaryRow}>
          <View style={styles.salaryHalf}>
            <FormField
              label="Expected salary min (₹)"
              keyboardType="number-pad"
              value={salaryMin}
              onChangeText={setSalaryMin}
              placeholder="Optional"
            />
          </View>
          <View style={styles.salaryHalf}>
            <FormField
              label="Expected salary max (₹)"
              keyboardType="number-pad"
              value={salaryMax}
              onChangeText={setSalaryMax}
              placeholder="Optional"
            />
          </View>
        </View>

        <Text style={styles.section}>Consents</Text>
        {(
          [
            ['terms', 'I agree to the Terms of Service and Privacy Policy'],
            ['shareWithEmployers', 'I agree to share my profile with matching employers in Vizag'],
            ['accurateInfo', 'I confirm my information is accurate'],
            ['age18', 'I confirm I am 18 or older'],
          ] as const
        ).map(([key, label]) => (
          <Pressable
            key={key}
            style={styles.consentRow}
            onPress={() => toggleConsent(key)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: consents[key] }}
          >
            <View style={[styles.checkbox, consents[key] && styles.checkboxOn]}>
              {consents[key] ? <Text style={styles.checkMark}>✓</Text> : null}
            </View>
            <Text style={styles.consentText}>{label}</Text>
          </Pressable>
        ))}

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
            <Text style={styles.primaryText}>Create account</Text>
          )}
        </Pressable>

        <Pressable
          onPress={() =>
            navigation.navigate('StudentLogin', { applyJobId: route.params?.applyJobId })
          }
          style={styles.linkBtn}
        >
          <Text style={styles.linkText}>Already have an account? Sign in</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { fontSize: 24, fontWeight: '900', color: colors.text },
  subtitle: { marginTop: spacing.sm, marginBottom: spacing.lg, color: colors.textMuted, lineHeight: 20 },
  section: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  salaryRow: { flexDirection: 'row', gap: spacing.md },
  salaryHalf: { flex: 1 },
  consentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.md },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkMark: { color: colors.white, fontWeight: '900', fontSize: 12 },
  consentText: { flex: 1, color: colors.textMuted, lineHeight: 20 },
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
    marginTop: spacing.md,
  },
  disabled: { opacity: 0.7 },
  primaryText: { color: colors.white, fontWeight: '800', fontSize: 16 },
  linkBtn: { marginTop: spacing.lg, alignItems: 'center', marginBottom: spacing.xl },
  linkText: { color: colors.primary, fontWeight: '700' },
});
