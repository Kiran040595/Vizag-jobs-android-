import 'react-native-gesture-handler';
import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  NavigationContainer,
  DefaultTheme,
  getStateFromPath as defaultGetStateFromPath,
  type LinkingOptions,
} from '@react-navigation/native';
import { colors } from './src/theme';
import { StudentAuthProvider } from './src/context/StudentAuthContext';
import { EmployerAuthProvider } from './src/context/EmployerAuthContext';
import { AdminAuthProvider } from './src/context/AdminAuthContext';
import { handleAuthDeepLink } from './src/lib/authDeepLink';
import { parseJobDeepLinkPath } from './src/lib/jobDeepLink';
import RootNavigator from './src/navigation/RootNavigator';
import type { RootStackParamList } from './src/navigation/types';
import { usePushNotifications } from './src/hooks/usePushNotifications';

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.bg, primary: colors.primary },
};

const linkingConfig: LinkingOptions<RootStackParamList>['config'] = {
  screens: {
    MainTabs: {
      screens: {
        Jobs: 'jobs',
        Saved: 'saved-jobs',
        Account: 'account',
      },
    },
    JobDetails: 'job/:slug',
    StudentLogin: 'student/login',
    StudentRegister: 'student/register',
    StudentForgotPassword: 'student/forgot-password',
    StudentResetPassword: 'student/reset-password',
    StudentProfile: 'student/profile',
    StudentApplications: 'student/applied-jobs',
    StudentApply: 'student/apply/:jobId',
    EmployerLogin: 'employer/login',
    EmployerRegister: 'employer/register',
    EmployerForgotPassword: 'employer/forgot-password',
    EmployerResetPassword: 'employer/reset-password',
    EmployerHome: 'employer/home',
    EmployerProfile: 'employer/profile',
    EmployerJobs: 'employer/jobs',
    EmployerJobForm: 'employer/jobs/form/:jobId?',
    EmployerJobApplications: 'employer/jobs/:jobId/applications',
    AdminLogin: 'admin/login',
    AdminHome: 'admin/home',
    AdminJobApplications: 'admin/jobs/:jobId/applications',
    JobAlerts: 'job-alerts',
    Feedback: 'feedback',
    BlogList: 'blog',
    BlogPost: 'blog/:slug',
    Legal: 'legal/:page',
  },
};

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [
    Linking.createURL('/'),
    'vizagjobs://',
    'https://jobsinvizag.in',
    'https://www.jobsinvizag.in',
  ],
  config: linkingConfig,
  getStateFromPath(path, options) {
    const jobParams = parseJobDeepLinkPath(path);
    if (jobParams) {
      return {
        routes: [
          { name: 'MainTabs' },
          {
            name: 'JobDetails',
            params: jobParams,
          },
        ],
      };
    }
    return defaultGetStateFromPath(path, options);
  },
};

function PushBootstrap() {
  usePushNotifications();
  return null;
}

export default function App() {
  const handledUrl = useRef<string | null>(null);

  useEffect(() => {
    const consume = async (url: string | null) => {
      if (!url || handledUrl.current === url) return;
      handledUrl.current = url;
      await handleAuthDeepLink(url);
    };

    void Linking.getInitialURL().then((url) => consume(url));
    const sub = Linking.addEventListener('url', ({ url }) => {
      void consume(url);
    });
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <StudentAuthProvider>
        <EmployerAuthProvider>
          <AdminAuthProvider>
            <PushBootstrap />
            <NavigationContainer theme={navTheme} linking={linking}>
              <StatusBar style="light" />
              <RootNavigator />
            </NavigationContainer>
          </AdminAuthProvider>
        </EmployerAuthProvider>
      </StudentAuthProvider>
    </SafeAreaProvider>
  );
}
