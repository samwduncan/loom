/**
 * ScrollToBottomPill -- floating glass pill to jump to latest message.
 *
 * Appears when user scrolls up during streaming (showPill && isStreaming).
 * Glass treatment: BlurView intensity 40, tint "dark", rgba overlay, border-subtle.
 * Entrance: Standard spring, opacity 0->1, translateY 20->0 (bouncy).
 * Exit: withTiming opacity 0, 150ms.
 * Tap: Selection haptic + onPress callback.
 *
 * @see D-32: scroll position preservation
 * @see 75-UI-SPEC.md: ScrollToBottomPill spec
 */

import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { ChevronDown } from 'lucide-react-native';

import { theme } from '../../theme/theme';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ScrollToBottomPillProps {
  isVisible: boolean;
  onPress: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ScrollToBottomPill({ isVisible, onPress }: ScrollToBottomPillProps) {
  const translateY = useSharedValue(20);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      // Standard spring entrance
      opacity.value = withSpring(1, theme.springs.standard);
      translateY.value = withSpring(0, theme.springs.standard);
    } else {
      // Fast timing exit
      opacity.value = withTiming(0, { duration: 150 });
      translateY.value = withTiming(20, { duration: 150 });
    }
  }, [isVisible, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const handlePress = () => {
    Haptics.selectionAsync();
    onPress();
  };

  // Don't render at all when fully hidden (pointer events pass through)
  if (!isVisible && opacity.value === 0) return null;

  return (
    <AnimatedPressable
      style={[styles.wrapper, animatedStyle]}
      onPress={handlePress}
      hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
      accessibilityRole="button"
      accessibilityLabel="Scroll to bottom"
    >
      <BlurView intensity={40} tint="dark" style={styles.blur}>
        <View style={styles.overlay}>
          <ChevronDown
            size={16}
            color={theme.colors.accent}
            strokeWidth={2.5}
          />
        </View>
      </BlurView>
    </AnimatedPressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    borderRadius: 9999,
    overflow: 'hidden',
    // Subtle border
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  blur: {
    borderRadius: 9999,
    overflow: 'hidden',
  },
  overlay: {
    backgroundColor: theme.colors.glass,
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
