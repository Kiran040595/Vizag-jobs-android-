export const STUDENT_JOB_CATEGORY_OPTIONS = [
  { value: 'software_frontend', label: 'Software Frontend' },
  { value: 'software_backend', label: 'Software Backend' },
  { value: 'software_full_stack', label: 'Software Full Stack' },
  { value: 'data_analytics', label: 'Data / Analytics' },
  { value: 'testing_qa', label: 'Testing / QA' },
  { value: 'telecaller_bpo', label: 'Telecaller / BPO' },
  { value: 'customer_support', label: 'Customer Support' },
  { value: 'sales_marketing', label: 'Sales / Marketing' },
  { value: 'digital_marketing', label: 'Digital Marketing' },
  { value: 'accounting_finance', label: 'Accounting / Finance' },
  { value: 'mechanical_production', label: 'Mechanical / Production' },
  { value: 'electrical_electronics', label: 'Electrical / Electronics' },
  { value: 'civil_construction', label: 'Civil / Construction' },
  { value: 'medical_healthcare', label: 'Medical / Healthcare' },
  { value: 'pharma_lab', label: 'Pharma / Lab' },
  { value: 'delivery_logistics', label: 'Delivery / Logistics' },
  { value: 'operations_admin', label: 'Operations / Admin' },
  { value: 'teaching_training', label: 'Teaching / Training' },
  { value: 'retail_hospitality', label: 'Retail / Hospitality' },
  { value: 'other', label: 'Other' },
] as const;

export const STUDENT_ROLE_EXPERIENCE_OPTIONS = [
  { value: 'fresher', label: 'Fresher' },
  { value: '0_6_months', label: '0-6 months' },
  { value: '6_12_months', label: '6-12 months' },
  { value: '1_2_years', label: '1-2 years' },
  { value: '2_4_years', label: '2-4 years' },
  { value: '4_plus_years', label: '4+ years' },
] as const;

export const STUDENT_AVAILABILITY_OPTIONS = [
  { value: 'immediate', label: 'Immediate' },
  { value: 'within_15_days', label: 'Within 15 days' },
  { value: 'within_30_days', label: 'Within 30 days' },
  { value: 'more_than_30_days', label: 'More than 30 days' },
] as const;

export const STUDENT_PREFERRED_LOCATION_OPTIONS = [
  'Visakhapatnam',
  'Vizag',
  'Gajuwaka',
  'Madhurawada',
  'Anakapalle',
  'Remote',
  'Hybrid',
  'Other (Andhra Pradesh)',
] as const;

const CATEGORY_LABEL_BY_VALUE = new Map(
  STUDENT_JOB_CATEGORY_OPTIONS.map((option) => [option.value, option.label]),
);
const EXPERIENCE_LABEL_BY_VALUE = new Map(
  STUDENT_ROLE_EXPERIENCE_OPTIONS.map((option) => [option.value, option.label]),
);
const AVAILABILITY_LABEL_BY_VALUE = new Map(
  STUDENT_AVAILABILITY_OPTIONS.map((option) => [option.value, option.label]),
);

const normalizeToken = (value: unknown): string =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

export const normalizeCareerText = (value: unknown, maxLength = 120): string =>
  String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, maxLength);

const humanizeToken = (value: string): string =>
  String(value || '')
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const resolveTargetJobCategoryToken = (raw: unknown): string => {
  const text = String(raw || '').trim();
  if (!text) return '';

  const token = normalizeToken(text);
  const known = STUDENT_JOB_CATEGORY_OPTIONS.find(
    (option) => option.value === token || option.label.toLowerCase() === text.toLowerCase(),
  );
  if (known) return known.value;
  if (token.length < 2 || token.length > 64) return '';
  return token;
};

export const parseTargetJobCategories = (values: unknown): string[] => {
  const list = Array.isArray(values) ? values : [];
  return [...new Set(list.map(resolveTargetJobCategoryToken).filter(Boolean))].slice(0, 8);
};

export const parsePreferredLocations = (value: unknown): string[] => {
  const list = Array.isArray(value) ? value : String(value || '').split(/[,;\n]/);
  return list
    .map((item) => normalizeCareerText(item, 64))
    .filter(Boolean)
    .slice(0, 8);
};

export const parseExpectedSalary = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(String(value).replace(/[^\d]/g, ''));
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.min(parsed, 10_000_000);
};

export const isAllowedRoleExperienceLevel = (value: unknown): boolean =>
  STUDENT_ROLE_EXPERIENCE_OPTIONS.some((option) => option.value === String(value || '').trim());

export const isAllowedAvailability = (value: unknown): boolean =>
  STUDENT_AVAILABILITY_OPTIONS.some((option) => option.value === String(value || '').trim());

export const formatJobCategoryLabel = (value: unknown): string => {
  const key = String(value || '').trim();
  return CATEGORY_LABEL_BY_VALUE.get(key as (typeof STUDENT_JOB_CATEGORY_OPTIONS)[number]['value']) || humanizeToken(key) || key;
};

export const formatRoleExperienceLabel = (value: unknown): string =>
  EXPERIENCE_LABEL_BY_VALUE.get(String(value || '').trim() as (typeof STUDENT_ROLE_EXPERIENCE_OPTIONS)[number]['value']) ||
  String(value || '').trim();

export const formatAvailabilityLabel = (value: unknown): string =>
  AVAILABILITY_LABEL_BY_VALUE.get(String(value || '').trim() as (typeof STUDENT_AVAILABILITY_OPTIONS)[number]['value']) ||
  String(value || '').trim();
