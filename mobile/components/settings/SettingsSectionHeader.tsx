/**
 * Uppercase section divider label for settings screens.
 *
 * Renders 12px caption text in uppercase with theme-muted color.
 * Follows UI-SPEC spacing: horizontal md, top lg, bottom sm.
 */

import React from 'react';
import { Text, View } from 'react-native';

import { createStyles } from '../../theme/createStyles';

interface SettingsSectionHeaderProps {
  title: string;
}

export function SettingsSectionHeader({ title }: SettingsSectionHeaderProps) {
  return (
    <View style={styles.container} accessibilityRole="header">
      <Text style={styles.label}>{title}</Text>
    </View>
  );
}

const styles = createStyles((t) => ({
  container: {
    paddingHorizontal: t.spacing.md,
    paddingTop: t.spacing.lg,
    paddingBottom: t.spacing.sm,
  },
  label: {
    ...t.typography.meta,
    color: t.colors.text.muted,
    textTransform: 'uppercase' as const,
  },
}));
