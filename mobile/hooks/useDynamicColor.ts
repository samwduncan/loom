/**
 * Dynamic color hook -- Reanimated shared values for streaming warmth shift
 * and error cooling per NATIVE-APP-SOUL.md.
 *
 * colorPhase: 0 = idle, 1 = streaming, -1 = error
 * accentPulse: sinusoidal 0.6-1.0 during streaming (2.5s period)
 * backgroundStyle: animated backgroundColor via interpolateColor
 *
 * Respects AccessibilityInfo.isReduceMotionEnabled -- snaps instantly
 * instead of animating when reduce motion is enabled.
 */

import { useEffect, useRef } from 'react';
import { AccessibilityInfo } from 'react-native';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  interpolateColor,
  cancelAnimation,
  type SharedValue,
} from 'react-native-reanimated';
import { IDLE_BG, STREAMING_BG, ERROR_BG, COLOR_TIMING } from '../lib/colors';

interface DynamicColorResult {
  /** Animated style with backgroundColor for the chat background */
  backgroundStyle: ReturnType<typeof useAnimatedStyle>;
  /** Shared value pulsing 0.6-1.0 during streaming (accent opacity) */
  accentPulse: SharedValue<number>;
  /** Transition to streaming state (warm shift + pulse) */
  enterStreaming: () => void;
  /** Transition back to idle state */
  exitStreaming: () => void;
  /** Transition to error state (cool shift) */
  enterError: () => void;
}

export function useDynamicColor(): DynamicColorResult {
  // -1 = error, 0 = idle, 1 = streaming
  const colorPhase = useSharedValue(0);
  const accentPulse = useSharedValue(1);
  const reduceMotion = useRef(false);

  useEffect(() => {
    // Check reduce motion preference on mount
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      reduceMotion.current = enabled;
    });

    // Listen for changes
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => {
        reduceMotion.current = enabled;
      },
    );

    return () => {
      subscription.remove();
    };
  }, []);

  const backgroundStyle = useAnimatedStyle(() => {
    const bg = interpolateColor(
      colorPhase.value,
      [-1, 0, 1],
      [ERROR_BG, IDLE_BG, STREAMING_BG],
    );
    return { backgroundColor: bg };
  });

  const enterStreaming = () => {
    if (reduceMotion.current) {
      colorPhase.value = 1;
      accentPulse.value = 0.8; // Static middle value
      return;
    }
    colorPhase.value = withTiming(1, COLOR_TIMING);
    // Sinusoidal pulse: 0.6 -> 1.0 -> 0.6 over 2.5s
    accentPulse.value = withRepeat(
      withTiming(0.6, { duration: 1250 }),
      -1, // infinite
      true, // reverse
    );
  };

  const exitStreaming = () => {
    if (reduceMotion.current) {
      colorPhase.value = 0;
      accentPulse.value = 1;
      return;
    }
    colorPhase.value = withTiming(0, COLOR_TIMING);
    cancelAnimation(accentPulse);
    accentPulse.value = withTiming(1, COLOR_TIMING);
  };

  const enterError = () => {
    if (reduceMotion.current) {
      colorPhase.value = -1;
      return;
    }
    colorPhase.value = withTiming(-1, COLOR_TIMING);
    // Stop any streaming pulse
    cancelAnimation(accentPulse);
    accentPulse.value = withTiming(1, COLOR_TIMING);
  };

  return { backgroundStyle, accentPulse, enterStreaming, exitStreaming, enterError };
}
