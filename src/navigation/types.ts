import type { NavigatorScreenParams } from '@react-navigation/native';
import type { Job } from '../types';

export type MainTabParamList = {
  Jobs: undefined;
  Saved: undefined;
  Account: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  /** Pass `job` when already loaded, or `jobId` (uuid/slug) to fetch. */
  JobDetails: {
    job?: Job;
    jobId?: string;
    questionId?: string;
  };
  StudentLogin: { applyJobId?: string } | undefined;
  StudentRegister: { applyJobId?: string } | undefined;
  StudentForgotPassword: undefined;
  StudentResetPassword: undefined;
  StudentProfile: undefined;
  StudentApplications: { highlightApplicationId?: string } | undefined;
  StudentApply: { jobId: string; job?: Job };
  Feedback: undefined;
};
