export const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(['pdf', 'doc', 'docx']);

const EXTENSION_CONTENT_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

const ALLOWED_CONTENT_TYPES = new Set(Object.values(EXTENSION_CONTENT_TYPES));

const getExtension = (fileName: string): string => {
  const parts = String(fileName || '').split('.');
  return parts.length > 1 ? (parts.pop() as string).toLowerCase() : '';
};

export type ResumeFileLike = {
  name: string;
  size: number;
  type?: string;
  uri: string;
};

export const resolveResumeContentType = (fileName: string, fileType = ''): string => {
  const extension = getExtension(fileName);
  const normalizedType = String(fileType || '').trim().toLowerCase();

  if (ALLOWED_CONTENT_TYPES.has(normalizedType)) {
    return normalizedType;
  }

  return EXTENSION_CONTENT_TYPES[extension] || '';
};

export const validateResumeFile = (file: ResumeFileLike | null | undefined): string => {
  if (!file) {
    return '';
  }

  const extension = getExtension(file.name);
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return 'Upload a PDF or Word document (.pdf, .doc, .docx).';
  }

  if (file.size > MAX_RESUME_BYTES) {
    return 'Resume must be 5 MB or smaller.';
  }

  return '';
};

export const resumeFileDisplayName = (resumePath: string | null | undefined): string => {
  if (!resumePath) return '';
  const parts = String(resumePath).split('/');
  return parts[parts.length - 1] || resumePath;
};
