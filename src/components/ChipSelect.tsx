import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing } from '../theme';

type Option = { value: string; label: string };

type Props = {
  options: Option[] | readonly string[];
  selected: string[];
  onChange: (next: string[]) => void;
  multi?: boolean;
  max?: number;
};

const toOptions = (options: Option[] | readonly string[]): Option[] =>
  options.map((item) => (typeof item === 'string' ? { value: item, label: item } : item));

export default function ChipSelect({ options, selected, onChange, multi = true, max = 16 }: Props) {
  const items = toOptions(options);

  const toggle = (value: string) => {
    if (!multi) {
      onChange(selected.includes(value) ? [] : [value]);
      return;
    }
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
      return;
    }
    if (selected.length >= max) return;
    onChange([...selected, value]);
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {items.map((item) => {
        const active = selected.includes(item.value);
        return (
          <Pressable
            key={item.value}
            onPress={() => toggle(item.value)}
            style={[styles.chip, active && styles.chipActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'nowrap', gap: spacing.sm, paddingVertical: spacing.xs },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipActive: {
    backgroundColor: colors.blueSoft,
    borderColor: colors.primary,
  },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  chipTextActive: { color: colors.primaryDark },
});
