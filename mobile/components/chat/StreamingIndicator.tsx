/**
 * StreamingIndicator -- Pulsing accent line during active streaming.
 *
 * 2px height accent line at bottom of message area.
 * Opacity pulse: 0.8 -> 0.3 over 750ms each direction (1.5s full cycle per UI-SPEC).
 * Entrance: Standard spring opacity 0->0.8.
 * Exit: opacity fade to 0 (200ms withTiming).
 *
 * Only renders content when isStreaming is true.
 * Wrapped in React.memo on isStreaming.
 *
 * Pure presentational: no store imports, no side effects beyond animation.
 */

import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { TypingDots } from './TypingDots';
import { theme } from '../../theme/theme';
import { createStyles } from '../../theme/createStyles';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface StreamingIndicatorProps {
  isStreaming: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function StreamingIndicatorInner({ isStreaming }: StreamingIndicatorProps) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isStreaming) {
      // Entrance: spring to 0.8, then start pulse
      opacity.value = withSpring(0.8, theme.springs.standard, (finished) => {
        'worklet';
        if (finished) {
          // Start pulsing: 0.8 -> 0.3 over 750ms, then reverse (1.5s cycle)
          opacity.value = withRepeat(
            withTiming(0.3, { duration: 750, easing: Easing.inOut(Easing.ease) }),
            -1,
            true,
          );
        }
      });
    } else {
      // Exit: fade to 0
      cancelAnimation(opacity);
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [isStreaming, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!isStreaming) return null;

  return (
    <View style={styles.wrapper}>
      <View style={styles.dotsRow}>
        <TypingDots />
      </View>
      <Animated.View style={[styles.line, animatedStyle]} />
    </View>
  );
}

/**
 * Memoized StreamingIndicator -- only re-renders when isStreaming changes.
 */
export const StreamingIndicator = React.memo(
  StreamingIndicatorInner,
  (prev, next) => prev.isStreaming === next.isStreaming,
);

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = createStyles((t) => ({
  wrapper: {
    gap: t.spacing.xs,
  },
  dotsRow: {
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.xs,
  },
  line: {
    height: 2,
    backgroundColor: t.colors.accent,
    marginHorizontal: t.spacing.md,
  },
}));
