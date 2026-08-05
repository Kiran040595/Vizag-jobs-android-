import React from 'react';
import { View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useEmployerAuth } from '../context/EmployerAuthContext';
import { colors, radius, spacing } from '../theme';

export default function EmployerCTA() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isEmployer, session } = useEmployerAuth();

  const onPostJob = () => {
    if (session && isEmployer) {
      navigation.navigate('EmployerJobForm', undefined);
      return;
    }
    if (session) {
      navigation.navigate('EmployerLogin');
      return;
    }
    navigation.navigate('EmployerRegister');
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <Ionicons name="business" size={24} color={colors.primary} />
        <Text style={styles.heading}>Are you an Employer?</Text>
        <Text style={styles.body}>
          Post your job and reach skilled candidates in Visakhapatnam.
        </Text>
        <View style={styles.btnRow}>
          <Pressable
            style={styles.btnSecondary}
            onPress={() =>
              navigation.navigate(session && isEmployer ? 'EmployerHome' : 'EmployerLogin')
            }
            accessibilityRole="button"
          >
            <Text style={styles.btnSecondaryText}>
              {session && isEmployer ? 'Dashboard' : 'Sign in'}
            </Text>
          </Pressable>
          <Pressable
            style={styles.btn}
            onPress={onPostJob}
            accessibilityRole="button"
            accessibilityLabel="Post a Job"
          >
            <Text style={styles.btnText}>Post a Job</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <Ionicons name="notifications" size={24} color={colors.accent} />
        <Text style={styles.heading}>Stay Updated with Vizag Jobs</Text>
        <Text style={styles.body}>
          Get the latest job updates by email or push, and browse new openings anytime.
        </Text>
        <View style={styles.btnRow}>
          <Pressable
            style={styles.btn}
            onPress={() => navigation.navigate('JobAlerts')}
            accessibilityRole="button"
          >
            <Text style={styles.btnText}>Set up alerts</Text>
          </Pressable>
          <Pressable
            style={styles.btnAccent}
            onPress={() =>
              Linking.openURL('https://www.instagram.com/channel/Abb3Uh4CEdmuzv6D/')
            }
            accessibilityRole="link"
          >
            <Text style={styles.btnText}>Instagram</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.lg, marginTop: spacing.md, gap: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'flex-start',
  },
  heading: { fontSize: 17, fontWeight: '800', color: colors.text, marginTop: spacing.sm },
  body: { fontSize: 14, color: colors.textMuted, marginTop: spacing.xs, lineHeight: 20 },
  btnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  btnAccent: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  btnSecondary: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  btnText: { color: colors.white, fontWeight: '800', fontSize: 14 },
  btnSecondaryText: { color: colors.primary, fontWeight: '800', fontSize: 14 },
});
