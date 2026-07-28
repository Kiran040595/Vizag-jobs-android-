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
import StudentProfileScreen from '../screens/StudentProfileScreen';
import StudentApplicationsScreen from '../screens/StudentApplicationsScreen';
import StudentApplyScreen from '../screens/StudentApplyScreen';

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
      <Stack.Screen name="StudentProfile" component={StudentProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen
        name="StudentApplications"
        component={StudentApplicationsScreen}
        options={{ title: 'Applied jobs' }}
      />
      <Stack.Screen name="StudentApply" component={StudentApplyScreen} options={{ title: 'Apply' }} />
    </Stack.Navigator>
  );
}
