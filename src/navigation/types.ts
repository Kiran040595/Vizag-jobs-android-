import type { Job } from '../types';

export type RootStackParamList = {
  Home: undefined;
  JobDetails: { job: Job };
  SavedJobs: undefined;
};
