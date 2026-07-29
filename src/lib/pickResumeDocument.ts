import * as DocumentPicker from 'expo-document-picker';
import { validateResumeFile, type ResumeFileLike } from '../lib/studentResumeFile';

export const pickResumeDocument = async (): Promise<ResumeFileLike | null> => {
  const result = await DocumentPicker.getDocumentAsync({
    type: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets?.length) {
    return null;
  }

  const asset = result.assets[0];
  const file: ResumeFileLike = {
    name: asset.name || 'resume.pdf',
    size: asset.size ?? 0,
    type: asset.mimeType || '',
    uri: asset.uri,
  };

  const validationError = validateResumeFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  return file;
};
