import type { NavigatorScreenParams } from '@react-navigation/native';
import type { Job } from '../types';

export type MainTabParamList = {
  Jobs: undefined;
  Saved: undefined;
  Account: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  JobDetails: { job: Job };
  StudentLogin: { applyJobId?: string } | undefined;
  StudentRegister: { applyJobId?: string } | undefined;
  StudentForgotPassword: undefined;
  StudentResetPassword: undefined;
  StudentProfile: undefined;
  StudentApplications: undefined;
  StudentApply: { jobId: string; job?: Job };
  Feedback: undefined;
};
