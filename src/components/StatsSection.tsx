import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../theme';

export interface SiteStats {
  activeJobs: number;
  companies: number;
  newThisWeek: number;
  categories: number;
}

const Stat = ({ value, label }: { value: number; label: string }) => (
  <View style={styles.stat}>
    <Text style={styles.value}>{value}</Text>
    <Text style={styles.label}>{label}</Text>
  </View>
);

export default function StatsSection({ stats }: { stats: SiteStats }) {
  return (
    <View style={styles.wrap}>
      <Stat value={stats.activeJobs} label="Active Jobs" />
      <Stat value={stats.companies} label="Companies Hiring" />
      <Stat value={stats.newThisWeek} label="New This Week" />
      <Stat value={stats.categories} label="Job Categories" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  stat: { width: '50%', alignItems: 'center', paddingVertical: spacing.sm },
  value: { fontSize: 24, fontWeight: '900', color: colors.primary },
  label: { marginTop: 2, fontSize: 12, fontWeight: '600', color: colors.textSubtle },
});
