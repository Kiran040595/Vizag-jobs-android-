import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import type { MainTabParamList, RootStackParamList } from './types';
import HomeScreen from '../screens/HomeScreen';
import SavedJobsScreen from '../screens/SavedJobsScreen';
import AccountScreen from '../screens/AccountScreen';
import JobDetailsScreen from '../screens/JobDetailsScreen';
import StudentLoginScreen from '../screens/StudentLoginScreen';
import StudentRegisterScreen from '../screens/StudentRegisterScreen';
import StudentForgotPasswordScreen from '../screens/StudentForgotPasswordScreen';
import StudentResetPasswordScreen from '../screens/StudentResetPasswordScreen';
import StudentProfileScreen from '../screens/StudentProfileScreen';
import StudentApplicationsScreen from '../screens/StudentApplicationsScreen';
import StudentApplyScreen from '../screens/StudentApplyScreen';
import EmployerLoginScreen from '../screens/EmployerLoginScreen';
import EmployerRegisterScreen from '../screens/EmployerRegisterScreen';
import EmployerForgotPasswordScreen from '../screens/EmployerForgotPasswordScreen';
import EmployerResetPasswordScreen from '../screens/EmployerResetPasswordScreen';
import EmployerHomeScreen from '../screens/EmployerHomeScreen';
import EmployerProfileScreen from '../screens/EmployerProfileScreen';
import EmployerJobsScreen from '../screens/EmployerJobsScreen';
import EmployerJobFormScreen from '../screens/EmployerJobFormScreen';
import EmployerJobApplicationsScreen from '../screens/EmployerJobApplicationsScreen';
import AdminLoginScreen from '../screens/AdminLoginScreen';
import AdminHomeScreen from '../screens/AdminHomeScreen';
import AdminJobApplicationsScreen from '../screens/AdminJobApplicationsScreen';
import FeedbackScreen from '../screens/FeedbackScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.heroVia },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '800' },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarIcon: ({ color, size }) => {
          const name =
            route.name === 'Jobs'
              ? 'briefcase'
              : route.name === 'Saved'
                ? 'bookmark'
                : 'person-circle';
          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Jobs" component={HomeScreen} options={{ headerShown: false, title: 'Jobs' }} />
      <Tab.Screen name="Saved" component={SavedJobsScreen} options={{ title: 'Saved Jobs' }} />
      <Tab.Screen name="Account" component={AccountScreen} options={{ title: 'Account' }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.heroVia },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '800' },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="JobDetails" component={JobDetailsScreen} options={{ title: 'Job Details' }} />
      <Stack.Screen name="StudentLogin" component={StudentLoginScreen} options={{ title: 'Student sign in' }} />
      <Stack.Screen
        name="StudentRegister"
        component={StudentRegisterScreen}
        options={{ title: 'Create account' }}
      />
      <Stack.Screen
        name="StudentForgotPassword"
        component={StudentForgotPasswordScreen}
        options={{ title: 'Forgot password' }}
      />
      <Stack.Screen
        name="StudentResetPassword"
        component={StudentResetPasswordScreen}
        options={{ title: 'Reset password' }}
      />
      <Stack.Screen name="StudentProfile" component={StudentProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen
        name="StudentApplications"
        component={StudentApplicationsScreen}
        options={{ title: 'Applied jobs' }}
      />
      <Stack.Screen name="StudentApply" component={StudentApplyScreen} options={{ title: 'Apply' }} />
      <Stack.Screen
        name="EmployerLogin"
        component={EmployerLoginScreen}
        options={{ title: 'Employer sign in' }}
      />
      <Stack.Screen
        name="EmployerRegister"
        component={EmployerRegisterScreen}
        options={{ title: 'Employer account' }}
      />
      <Stack.Screen
        name="EmployerForgotPassword"
        component={EmployerForgotPasswordScreen}
        options={{ title: 'Forgot password' }}
      />
      <Stack.Screen
        name="EmployerResetPassword"
        component={EmployerResetPasswordScreen}
        options={{ title: 'Reset password' }}
      />
      <Stack.Screen
        name="EmployerHome"
        component={EmployerHomeScreen}
        options={{ title: 'Employer portal' }}
      />
      <Stack.Screen
        name="EmployerProfile"
        component={EmployerProfileScreen}
        options={{ title: 'Company profile' }}
      />
      <Stack.Screen
        name="EmployerJobs"
        component={EmployerJobsScreen}
        options={{ title: 'My jobs' }}
      />
      <Stack.Screen
        name="EmployerJobForm"
        component={EmployerJobFormScreen}
        options={{ title: 'Job submission' }}
      />
      <Stack.Screen
        name="EmployerJobApplications"
        component={EmployerJobApplicationsScreen}
        options={{ title: 'Applications' }}
      />
      <Stack.Screen
        name="AdminLogin"
        component={AdminLoginScreen}
        options={{ title: 'Admin sign in' }}
      />
      <Stack.Screen
        name="AdminHome"
        component={AdminHomeScreen}
        options={{ title: 'Admin reviews' }}
      />
      <Stack.Screen
        name="AdminJobApplications"
        component={AdminJobApplicationsScreen}
        options={{ title: 'Applications' }}
      />
      <Stack.Screen name="Feedback" component={FeedbackScreen} options={{ title: 'Feedback' }} />
    </Stack.Navigator>
  );
}
