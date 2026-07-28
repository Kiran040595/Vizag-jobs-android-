/** Canonical application status values stored in `job_applications.status`. */
export const APPLICATION_STATUSES = [
  'applied',
  'viewed',
  'processing',
  'hired',
  'rejected',
  'withdrawn',
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

const LEGACY_APPLICATION_STATUS_MAP: Record<string, ApplicationStatus> = {
  submitted: 'applied',
  shortlisted: 'processing',
};

export const normalizeApplicationStatus = (status: unknown): ApplicationStatus | string => {
  const value = String(status || '').trim().toLowerCase();
  if (!value) return 'applied';
  return LEGACY_APPLICATION_STATUS_MAP[value] || value;
};

export const formatApplicationStatus = (status: unknown): string => {
  switch (normalizeApplicationStatus(status)) {
    case 'applied':
      return 'Applied';
    case 'viewed':
      return 'Viewed';
    case 'processing':
      return 'Processing';
    case 'hired':
      return 'Hired';
    case 'rejected':
      return 'Rejected';
    case 'withdrawn':
      return 'Withdrawn';
    default:
      return String(status || '');
  }
};

export const getApplicationStatusDescription = (status: unknown): string => {
  switch (normalizeApplicationStatus(status)) {
    case 'applied':
      return 'Your application was submitted and is waiting for review.';
    case 'viewed':
      return 'The employer or admin has opened your application.';
    case 'processing':
      return 'Your application is under active review or in the interview pipeline.';
    case 'hired':
      return 'Congratulations — you were selected for this role.';
    case 'rejected':
      return 'This application was not moved forward for this role.';
    case 'withdrawn':
      return 'You withdrew this application.';
    default:
      return 'Application status update.';
  }
};

export const APPLICATION_STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  applied: { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' },
  viewed: { bg: '#f1f5f9', border: '#e2e8f0', text: '#334155' },
  processing: { bg: '#fffbeb', border: '#fde68a', text: '#92400e' },
  hired: { bg: '#ecfdf5', border: '#a7f3d0', text: '#047857' },
  rejected: { bg: '#fff1f2', border: '#fecdd3', text: '#be123c' },
  withdrawn: { bg: '#f8fafc', border: '#e2e8f0', text: '#475569' },
};

export const getApplicationStatusColors = (status: unknown) =>
  APPLICATION_STATUS_COLORS[normalizeApplicationStatus(status)] || APPLICATION_STATUS_COLORS.applied;

export const STUDENT_STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'applied', label: 'Applied' },
  { id: 'viewed', label: 'Viewed' },
  { id: 'processing', label: 'Processing' },
  { id: 'hired', label: 'Hired' },
  { id: 'rejected', label: 'Rejected' },
] as const;
