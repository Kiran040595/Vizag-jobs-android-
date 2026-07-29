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
  EmployerLogin: undefined;
  EmployerRegister: undefined;
  EmployerForgotPassword: undefined;
  EmployerResetPassword: undefined;
  EmployerHome: undefined;
  EmployerProfile: undefined;
  EmployerJobs: undefined;
  EmployerJobForm: { jobId?: string } | undefined;
  EmployerJobApplications: { jobId: string };
  AdminLogin: undefined;
  AdminHome: undefined;
  AdminJobApplications: { jobId: string };
  Feedback: undefined;
};
