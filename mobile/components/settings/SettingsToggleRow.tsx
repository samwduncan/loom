/**
 * Settings row with toggle switch.
 *
 * Wraps SettingsRow with a Switch as the right accessory.
 * Reusable for future settings screens (not used in notification
 * settings -- batching is server-side per D-04).
 *
 * Features:
 * - Accent thumb color when active, overlay when inactive
 * - Haptic selection feedback on toggle
 */

import React, { useCallback } from 'react';
import { Switch } from 'react-native';
import * as Haptics from 'expo-haptics';

import { theme } from '../../theme/theme';
import { SettingsRow } from './SettingsRow';

export interface SettingsToggleRowProps {
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export function SettingsToggleRow({
  title,
  subtitle,
  value,
  onValueChange,
}: SettingsToggleRowProps) {
  const handleValueChange = useCallback(
    (newValue: boolean) => {
      Haptics.selectionAsync();
      onValueChange(newValue);
    },
    [onValueChange],
  );

  return (
    <SettingsRow
      title={title}
      subtitle={subtitle}
      rightAccessory={
        <Switch
          value={value}
          onValueChange={handleValueChange}
          trackColor={{
            false: theme.colors.border.subtle,
            true: 'rgba(196, 108, 88, 0.5)', // accent at 0.5 opacity
          }}
          thumbColor={value ? theme.colors.accent : theme.colors.surface.overlay}
          ios_backgroundColor={theme.colors.border.subtle}
        />
      }
    />
  );
}
