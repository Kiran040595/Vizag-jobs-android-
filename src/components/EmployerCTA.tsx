import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme';

export default function EmployerCTA() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <Ionicons name="business" size={24} color={colors.primary} />
        <Text style={styles.heading}>Are you an Employer?</Text>
        <Text style={styles.body}>
          Post your job and reach skilled candidates in Visakhapatnam.
        </Text>
        <Pressable
          style={styles.btn}
          onPress={() => navigation.navigate('EmployerRegister')}
          accessibilityRole="button"
          accessibilityLabel="Post a Job"
        >
          <Text style={styles.btnText}>Post a Job</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Ionicons name="notifications" size={24} color={colors.accent} />
        <Text style={styles.heading}>Stay Updated with Vizag Jobs</Text>
        <Text style={styles.body}>
          Get the latest job updates by email or browse new openings anytime.
        </Text>
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
  btn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  btnText: { color: colors.white, fontWeight: '800', fontSize: 14 },
});
