import type { NavigatorScreenParams } from '@react-navigation/native';
import type { BlogPost } from '../services/blogs';
import type { Job } from '../types';

export type MainTabParamList = {
  Jobs: undefined;
  Saved: undefined;
  Account: undefined;
};

export type LegalPage = 'about' | 'privacy' | 'terms' | 'disclaimer';

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  /** Pass a full `job`, or `jobId` / `slug` for deep links (detail will fetch). */
  JobDetails: { job?: Job; jobId?: string; slug?: string };
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
  JobAlerts: undefined;
  Feedback: undefined;
  BlogList: undefined;
  BlogPost: { slug: string; post?: BlogPost };
  Legal: { page: LegalPage };
};
