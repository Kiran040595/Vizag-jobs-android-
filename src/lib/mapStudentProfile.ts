import {
  formatAvailabilityLabel,
  formatJobCategoryLabel,
  formatRoleExperienceLabel,
  isAllowedAvailability,
  isAllowedRoleExperienceLevel,
  normalizeCareerText,
  parseExpectedSalary,
  parsePreferredLocations,
  parseTargetJobCategories,
} from './studentCareerPreferences';
import {
  formatSkillLabel,
  isAllowedBranch,
  isAllowedDegree,
  isAllowedGraduationYear,
  normalizeSkillValue,
} from './studentProfileOptions';
import { isValidStudentPhone } from './studentPhoneAuth';
import { hasStudentRegistrationConsents } from './studentConsent';

const PLACEHOLDER_NAME = 'your name';

export type MappedStudentProfile = {
  userId: string;
  fullName: string;
  college: string;
  degree: string;
  branch: string;
  graduationYear: number | null;
  contactEmail: string;
  phone: string;
  skills: string[];
  skillLabels: string[];
  certifications: string[];
  certificationsText: string;
  targetJobCategories: string[];
  targetJobCategoryLabels: string[];
  primaryTargetRole: string;
  roleExperienceLevel: string;
  roleExperienceLabel: string;
  preferredLocations: string[];
  availability: string;
  availabilityLabel: string;
  expectedSalaryMin: number | null;
  expectedSalaryMax: number | null;
  isFresher: boolean;
  isActive: boolean;
  hasRegistrationConsents: boolean;
  resumePath: string | null;
  profileComplete: boolean;
};

export const mapStudentProfileRow = (row: Record<string, unknown> | null | undefined): MappedStudentProfile | null => {
  if (!row) return null;

  const fullName = String(row.full_name || '').trim();
  const college = String(row.college || '').trim();
  const degree = String(row.degree || '').trim();
  const branch = String(row.branch || '').trim();
  const graduationYear =
    row.graduation_year === null || row.graduation_year === undefined
      ? null
      : Number(row.graduation_year);
  const phone = String(row.phone || '').trim();
  const skills = Array.isArray(row.skills)
    ? row.skills.map(normalizeSkillValue).filter(Boolean)
    : [];
  const certifications = Array.isArray(row.certifications)
    ? row.certifications.map((item) => String(item || '').trim()).filter(Boolean)
    : [];
  const certificationsText = certifications.join('; ');
  const targetJobCategories = parseTargetJobCategories(row.target_job_categories);
  const targetJobCategoryLabels = targetJobCategories.map(formatJobCategoryLabel);
  const primaryTargetRole = normalizeCareerText(row.primary_target_role);
  const roleExperienceLevel = String(row.role_experience_level || '').trim();
  const preferredLocations = parsePreferredLocations(row.preferred_locations);
  const availability = String(row.availability || '').trim();
  const expectedSalaryMin = parseExpectedSalary(row.expected_salary_min);
  const expectedSalaryMax = parseExpectedSalary(row.expected_salary_max);
  const isFresher = row.is_fresher !== false;
  const hasRegistrationConsents = hasStudentRegistrationConsents(row);

  const profileComplete =
    Boolean(fullName) &&
    fullName.toLowerCase() !== PLACEHOLDER_NAME &&
    Boolean(college) &&
    isAllowedDegree(degree) &&
    isAllowedBranch(branch) &&
    isAllowedGraduationYear(graduationYear ? String(graduationYear) : '') &&
    isValidStudentPhone(phone) &&
    skills.length > 0 &&
    certifications.length > 0 &&
    typeof row.is_fresher === 'boolean' &&
    targetJobCategories.length > 0 &&
    Boolean(primaryTargetRole) &&
    isAllowedRoleExperienceLevel(roleExperienceLevel) &&
    isAllowedAvailability(availability) &&
    preferredLocations.length > 0 &&
    hasRegistrationConsents;

  return {
    userId: String(row.user_id || ''),
    fullName,
    college,
    degree,
    branch,
    graduationYear: Number.isFinite(graduationYear as number) ? (graduationYear as number) : null,
    contactEmail: String(row.contact_email || ''),
    phone,
    skills,
    skillLabels: skills.map(formatSkillLabel),
    certifications,
    certificationsText,
    targetJobCategories,
    targetJobCategoryLabels,
    primaryTargetRole,
    roleExperienceLevel,
    roleExperienceLabel: formatRoleExperienceLabel(roleExperienceLevel),
    preferredLocations,
    availability,
    availabilityLabel: formatAvailabilityLabel(availability),
    expectedSalaryMin,
    expectedSalaryMax,
    isFresher,
    isActive: Boolean(row.is_active),
    hasRegistrationConsents,
    resumePath: row.resume_path ? String(row.resume_path) : null,
    profileComplete,
  };
};
