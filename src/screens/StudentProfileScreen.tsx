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
import { pickResumeDocument } from '../lib/pickResumeDocument';
import {
  clearPendingApplyJobId,
  getPendingApplyJobId,
} from '../lib/studentApplyRedirect';
import { resumeFileDisplayName, type ResumeFileLike } from '../lib/studentResumeFile';
import {
  STUDENT_BRANCH_OPTIONS,
  STUDENT_DEGREE_OPTIONS,
  STUDENT_GRADUATION_YEAR_OPTIONS,
  STUDENT_SKILL_OPTIONS,
} from '../lib/studentProfileOptions';
import type { RootStackParamList } from '../navigation/types';
import { upsertStudentProfile } from '../services/studentJobs';
import { saveResumePathOnProfile, uploadStudentResume } from '../services/studentResume';
import { colors, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'StudentProfile'>;

export default function StudentProfileScreen({ navigation }: Props) {
  const { isStudent, profile, refreshStudentAccess, session, user } = useStudentAuth();

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
  const [resumePath, setResumePath] = useState<string | null>(null);
  const [pendingResume, setPendingResume] = useState<ResumeFileLike | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);

  useEffect(() => {
    if (!isStudent) {
      navigation.replace('StudentLogin');
    }
  }, [isStudent, navigation]);

  useEffect(() => {
    if (!profile) return;
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setFullName(String(profile.full_name || ''));
      setCollege(String(profile.college || ''));
      setPhone(String(profile.phone || '').replace(/^\+91/, ''));
      setDegree(profile.degree ? [String(profile.degree)] : []);
      setBranch(profile.branch ? [String(profile.branch)] : []);
      setGraduationYear(profile.graduation_year ? [String(profile.graduation_year)] : []);
      setIsFresher([profile.is_fresher === false ? 'no' : 'yes']);
      setSkills(Array.isArray(profile.skills) ? (profile.skills as string[]) : []);
      setCertifications(
        Array.isArray(profile.certifications)
          ? (profile.certifications as string[]).join('; ')
          : String(profile.certifications || ''),
      );
      setCategories(
        Array.isArray(profile.target_job_categories)
          ? (profile.target_job_categories as string[])
          : [],
      );
      setPrimaryRole(String(profile.primary_target_role || ''));
      setRoleExperience(
        profile.role_experience_level ? [String(profile.role_experience_level)] : [],
      );
      setAvailability(profile.availability ? [String(profile.availability)] : []);
      setLocations(
        Array.isArray(profile.preferred_locations) ? (profile.preferred_locations as string[]) : [],
      );
      setSalaryMin(profile.expected_salary_min ? String(profile.expected_salary_min) : '');
      setSalaryMax(profile.expected_salary_max ? String(profile.expected_salary_max) : '');
      setResumePath(profile.resume_path ? String(profile.resume_path) : null);
      setPendingResume(null);
    });
    return () => {
      active = false;
    };
  }, [profile]);

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

  const onPickResume = async () => {
    setError('');
    setNotice('');
    try {
      const file = await pickResumeDocument();
      if (!file) return;
      setPendingResume(file);
      setNotice(`Selected ${file.name}. Save profile to upload.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not select resume.');
    }
  };

  const onUploadResumeNow = async () => {
    if (!pendingResume || !session?.user?.id) return;
    setError('');
    setNotice('');
    setUploadingResume(true);
    try {
      const path = await uploadStudentResume(pendingResume, session.user.id);
      await saveResumePathOnProfile(path);
      setResumePath(path);
      setPendingResume(null);
      await refreshStudentAccess(session.user.id);
      setNotice('Resume uploaded.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload resume.');
    } finally {
      setUploadingResume(false);
    }
  };

  const onSave = async () => {
    setError('');
    setNotice('');
    setSubmitting(true);
    try {
      await upsertStudentProfile({
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
        contact_email: String(profile?.contact_email || user?.email || ''),
      });
      if (pendingResume && session?.user?.id) {
        const path = await uploadStudentResume(pendingResume, session.user.id);
        await saveResumePathOnProfile(path);
        setResumePath(path);
        setPendingResume(null);
      }
      if (session?.user?.id) {
        await refreshStudentAccess(session.user.id);
      }
      const pendingApplyId = await getPendingApplyJobId();
      if (pendingApplyId) {
        await clearPendingApplyJobId();
        setNotice('Profile saved. Continuing to apply…');
        navigation.replace('StudentApply', { jobId: pendingApplyId });
        return;
      }
      setNotice('Profile saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your profile.');
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
        <Text style={styles.title}>Student profile</Text>
        <Text style={styles.subtitle}>Keep this up to date so employers can review your fit.</Text>

        <FormField label="Full name" value={fullName} onChangeText={setFullName} />
        <FormField label="College / university" value={college} onChangeText={setCollege} />
        <FormField
          label="Mobile (10-digit)"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
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
        <Text style={styles.chipLabel}>Fresher?</Text>
        <ChipSelect
          options={[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
          ]}
          selected={isFresher}
          onChange={setIsFresher}
          multi={false}
        />
        <Text style={styles.chipLabel}>Target categories</Text>
        <ChipSelect options={categoryOptions} selected={categories} onChange={setCategories} max={8} />
        <FormField label="Primary target role" value={primaryRole} onChangeText={setPrimaryRole} />
        <Text style={styles.chipLabel}>Role experience</Text>
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
        <Text style={styles.chipLabel}>Preferred locations</Text>
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
        />
        <View style={styles.salaryRow}>
          <View style={styles.salaryHalf}>
            <FormField
              label="Salary min (₹)"
              keyboardType="number-pad"
              value={salaryMin}
              onChangeText={setSalaryMin}
            />
          </View>
          <View style={styles.salaryHalf}>
            <FormField
              label="Salary max (₹)"
              keyboardType="number-pad"
              value={salaryMax}
              onChangeText={setSalaryMax}
            />
          </View>
        </View>

        <Text style={styles.chipLabel}>Resume (PDF / Word, max 5 MB)</Text>
        <View style={styles.resumeBox}>
          <Text style={styles.resumeMeta}>
            {pendingResume
              ? `Selected: ${pendingResume.name}`
              : resumePath
                ? `Saved: ${resumeFileDisplayName(resumePath)}`
                : 'No resume uploaded yet.'}
          </Text>
          <View style={styles.resumeActions}>
            <Pressable style={styles.secondaryBtn} onPress={onPickResume}>
              <Text style={styles.secondaryText}>Choose file</Text>
            </Pressable>
            {pendingResume ? (
              <Pressable
                style={[styles.secondaryBtn, uploadingResume && styles.disabled]}
                onPress={onUploadResumeNow}
                disabled={uploadingResume}
              >
                {uploadingResume ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <Text style={styles.secondaryText}>Upload now</Text>
                )}
              </Pressable>
            ) : null}
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}

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
  title: { fontSize: 22, fontWeight: '900', color: colors.text },
  subtitle: { marginTop: spacing.sm, marginBottom: spacing.lg, color: colors.textMuted },
  chipLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  salaryRow: { flexDirection: 'row', gap: spacing.md },
  salaryHalf: { flex: 1 },
  resumeBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  resumeMeta: { color: colors.textMuted, fontWeight: '600', marginBottom: spacing.sm },
  resumeActions: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.blueSoftBorder,
    backgroundColor: colors.blueSoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { color: colors.primaryDark, fontWeight: '800' },
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
    marginTop: spacing.md,
  },
  disabled: { opacity: 0.7 },
  primaryText: { color: colors.white, fontWeight: '800', fontSize: 16 },
});
