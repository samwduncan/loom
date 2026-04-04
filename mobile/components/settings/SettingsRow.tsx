/**
 * Reusable settings list item with title, subtitle, and right accessory slot.
 *
 * Features:
 * - 56px minimum height, surface-raised background
 * - Micro spring scale 0.97 on press (matches SessionItem pattern)
 * - Haptic Impact Light on press
 * - Right accessory node vertically centered
 */

import React, { useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import { theme } from '../../theme/theme';
import { createStyles } from '../../theme/createStyles';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface SettingsRowProps {
  title: string;
  subtitle?: string;
  rightAccessory?: React.ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
}

export function SettingsRow({
  title,
  subtitle,
  rightAccessory,
  onPress,
  accessibilityLabel,
}: SettingsRowProps) {
  const scale = useSharedValue(1);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, theme.springs.micro);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, theme.springs.micro);
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  }, [onPress]);

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={!onPress}
      style={[styles.container, pressStyle]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
    >
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {rightAccessory ? (
        <View style={styles.accessory}>{rightAccessory}</View>
      ) : null}
    </AnimatedPressable>
  );
}

const styles = createStyles((t) => ({
  container: {
    minHeight: 56,
    backgroundColor: t.colors.surface.raised,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.md,
  },
  content: {
    flex: 1,
    justifyContent: 'center' as const,
  },
  title: {
    ...t.typography.body,
    color: t.colors.text.primary,
  },
  subtitle: {
    ...t.typography.small,
    color: t.colors.text.muted,
    marginTop: 2,
  },
  accessory: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginLeft: t.spacing.sm,
  },
}));
