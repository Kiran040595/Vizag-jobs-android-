import React from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme';

interface Props {
  searchTerm: string;
  onChangeSearch: (text: string) => void;
  onSubmit: () => void;
  savedCount: number;
  onOpenSaved: () => void;
}

export default function HeroSection({
  searchTerm,
  onChangeSearch,
  onSubmit,
  savedCount,
  onOpenSaved,
}: Props) {
  return (
    <LinearGradient
      colors={[colors.heroFrom, colors.heroVia, colors.heroTo]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.hero}
    >
      <View style={styles.topBar}>
        <View style={styles.brand}>
          <Ionicons name="briefcase" size={20} color={colors.white} />
          <Text style={styles.brandText}>Vizag Jobs</Text>
        </View>
        <Pressable onPress={onOpenSaved} style={styles.savedBtn} accessibilityRole="button" accessibilityLabel="View saved jobs">
          <Ionicons name="bookmark" size={16} color={colors.white} />
          <Text style={styles.savedBtnText}>Saved{savedCount ? ` (${savedCount})` : ''}</Text>
        </Pressable>
      </View>

      <Text style={styles.title}>Find the Right Job in Visakhapatnam</Text>
      <Text style={styles.subtitle}>
        Your one-stop platform for IT, engineering, fresher and experienced jobs in Vizag
      </Text>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={colors.textSubtle} style={styles.searchIcon} />
        <TextInput
          value={searchTerm}
          onChangeText={onChangeSearch}
          onSubmitEditing={onSubmit}
          placeholder="Search jobs, companies, skills..."
          placeholderTextColor={colors.textSubtle}
          style={styles.input}
          returnKeyType="search"
          accessibilityLabel="Search jobs"
        />
        <Pressable onPress={onSubmit} style={styles.searchBtn} accessibilityRole="button" accessibilityLabel="Search">
          <Text style={styles.searchBtnText}>Search</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  brandText: { color: colors.white, fontSize: 18, fontWeight: '800' },
  savedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  savedBtnText: { color: colors.white, fontSize: 13, fontWeight: '700' },
  title: { color: colors.white, fontSize: 26, fontWeight: '900', lineHeight: 32 },
  subtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: spacing.sm, lineHeight: 20 },
  searchRow: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    paddingVertical: 4,
  },
  searchIcon: { marginRight: spacing.sm },
  input: { flex: 1, fontSize: 15, color: colors.text, paddingVertical: spacing.sm },
  searchBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  searchBtnText: { color: colors.white, fontWeight: '800', fontSize: 14 },
});
