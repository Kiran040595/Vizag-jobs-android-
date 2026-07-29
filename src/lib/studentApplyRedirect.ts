import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_APPLY_KEY = 'vizagjobs:pending-apply-job-id';

export const setPendingApplyJobId = async (jobId: string | null | undefined): Promise<void> => {
  if (!jobId) {
    await AsyncStorage.removeItem(PENDING_APPLY_KEY);
    return;
  }
  await AsyncStorage.setItem(PENDING_APPLY_KEY, String(jobId));
};

export const getPendingApplyJobId = async (): Promise<string | null> => {
  const value = await AsyncStorage.getItem(PENDING_APPLY_KEY);
  return value || null;
};

export const clearPendingApplyJobId = async (): Promise<void> => {
  await AsyncStorage.removeItem(PENDING_APPLY_KEY);
};
