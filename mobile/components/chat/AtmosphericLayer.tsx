/**
 * AtmosphericLayer — Ambient depth effect for the empty chat state.
 *
 * Tier 1 implementation: 4 animated LinearGradient strips simulating volumetric
 * light rays from top-center, plus 3 fade overlays creating a natural vignette.
 *
 * Based on better-chatbot's WebGL atmospheric effects, simplified to pure
 * React Native animation. Uses expo-linear-gradient for proper gradient rendering.
 *
 * Rules (from LOOM-DESIGN-SYSTEM.md Part 4.4):
 * 1. Max total opacity: 6% — if you notice the effect, it's too strong
 * 2. Only on empty state — hides when messages appear (5s fade-out)
 * 3. Returns after 60s idle
 * 4. Entrance: 5-second fade-in (eyes adjusting)
 * 5. Reduced motion: disabled entirely
 * 6. Z-order: behind all content
 * 7. Performance: <5% CPU when active, 0% when hidden
 */

import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { theme } from '../../theme/theme';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Warm white for ray color — NOT pure white, matches border base warmth
const RAY_COLOR_A = 'rgba(222, 220, 209, 0.03)';  // Subtle warm glow
const RAY_COLOR_B = 'rgba(222, 220, 209, 0.02)';  // Even subtler
const TRANSPARENT = 'transparent';

// bg-chat for fade overlays (vignette)
const BG_CHAT = theme.colors.surface.base;  // rgb(33,33,31)
const BG_CHAT_OPAQUE = 'rgba(33, 33, 31, 1)';

// Animation timing
const FADE_IN_MS = 5000;   // 5s entrance — very slow
const FADE_OUT_MS = 5000;  // 5s exit
const DRIFT_CYCLE_A = 25000;  // 25s per drift cycle (ray group 1)
const DRIFT_CYCLE_B = 35000;  // 35s per drift cycle (ray group 2)
const DRIFT_CYCLE_C = 30000;  // 30s per drift cycle (ray group 3)
const DRIFT_CYCLE_D = 40000;  // 40s per drift cycle (ray group 4)

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AtmosphericLayerProps {
  visible: boolean;
}

export function AtmosphericLayer({ visible }: AtmosphericLayerProps) {
  const masterOpacity = useSharedValue(0);
  const reduceMotionRef = useRef(false);

  // Drift values for 4 ray strips — slow sinusoidal position shifts
  const drift1 = useSharedValue(0);
  const drift2 = useSharedValue(0);
  const drift3 = useSharedValue(0);
  const drift4 = useSharedValue(0);

  // Check reduced motion preference
  useEffect(() => {
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (isReduced) => {
        reduceMotionRef.current = isReduced;
        if (isReduced) {
          masterOpacity.value = withTiming(0, { duration: 500 });
          cancelAnimation(drift1);
          cancelAnimation(drift2);
          cancelAnimation(drift3);
          cancelAnimation(drift4);
        }
      },
    );

    AccessibilityInfo.isReduceMotionEnabled().then((isReduced) => {
      reduceMotionRef.current = isReduced;
    });

    return () => subscription.remove();
  }, [masterOpacity, drift1, drift2, drift3, drift4]);

  // Master visibility fade
  useEffect(() => {
    if (reduceMotionRef.current) return;

    if (visible) {
      masterOpacity.value = withTiming(1, {
        duration: FADE_IN_MS,
        easing: Easing.out(Easing.cubic),
      });

      // Start drift animations — infinite slow oscillation
      drift1.value = withRepeat(
        withSequence(
          withTiming(15, { duration: DRIFT_CYCLE_A, easing: Easing.inOut(Easing.sin) }),
          withTiming(-15, { duration: DRIFT_CYCLE_A, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
      );
      drift2.value = withRepeat(
        withSequence(
          withTiming(-12, { duration: DRIFT_CYCLE_B, easing: Easing.inOut(Easing.sin) }),
          withTiming(12, { duration: DRIFT_CYCLE_B, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
      );
      drift3.value = withRepeat(
        withSequence(
          withTiming(10, { duration: DRIFT_CYCLE_C, easing: Easing.inOut(Easing.sin) }),
          withTiming(-10, { duration: DRIFT_CYCLE_C, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
      );
      drift4.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: DRIFT_CYCLE_D, easing: Easing.inOut(Easing.sin) }),
          withTiming(8, { duration: DRIFT_CYCLE_D, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
      );
    } else {
      masterOpacity.value = withTiming(0, {
        duration: FADE_OUT_MS,
        easing: Easing.in(Easing.cubic),
      });
      // Stop drift when hidden to save CPU
      cancelAnimation(drift1);
      cancelAnimation(drift2);
      cancelAnimation(drift3);
      cancelAnimation(drift4);
    }
  }, [visible, masterOpacity, drift1, drift2, drift3, drift4]);

  // Animated styles for ray strips
  const masterStyle = useAnimatedStyle(() => ({
    opacity: masterOpacity.value,
  }));

  const ray1Style = useAnimatedStyle(() => ({
    transform: [{ translateX: drift1.value }, { rotate: '-8deg' }],
  }));

  const ray2Style = useAnimatedStyle(() => ({
    transform: [{ translateX: drift2.value }, { rotate: '5deg' }],
  }));

  const ray3Style = useAnimatedStyle(() => ({
    transform: [{ translateX: drift3.value }, { rotate: '12deg' }],
  }));

  const ray4Style = useAnimatedStyle(() => ({
    transform: [{ translateX: drift4.value }, { rotate: '-3deg' }],
  }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, masterStyle]}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {/* Ray strip 1 — wide, left of center */}
      <Animated.View style={[styles.rayStrip, styles.ray1, ray1Style]}>
        <LinearGradient
          colors={[RAY_COLOR_A, TRANSPARENT]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.7 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Ray strip 2 — narrow, right of center */}
      <Animated.View style={[styles.rayStrip, styles.ray2, ray2Style]}>
        <LinearGradient
          colors={[RAY_COLOR_B, TRANSPARENT]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.6 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Ray strip 3 — medium, center-right */}
      <Animated.View style={[styles.rayStrip, styles.ray3, ray3Style]}>
        <LinearGradient
          colors={[RAY_COLOR_A, TRANSPARENT]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.55 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Ray strip 4 — wide, center-left, dimmer */}
      <Animated.View style={[styles.rayStrip, styles.ray4, ray4Style]}>
        <LinearGradient
          colors={[RAY_COLOR_B, TRANSPARENT]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.65 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Fade overlays — vignette containing the rays */}
      {/* Bottom fade: opaque bg-chat from bottom to 50% up */}
      <LinearGradient
        colors={[TRANSPARENT, BG_CHAT_OPAQUE]}
        start={{ x: 0.5, y: 0.4 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Left fade: opaque bg-chat from left edge to 20% in */}
      <LinearGradient
        colors={[BG_CHAT_OPAQUE, TRANSPARENT]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 0.2, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Right fade: opaque bg-chat from right edge to 80% in */}
      <LinearGradient
        colors={[TRANSPARENT, BG_CHAT_OPAQUE]}
        start={{ x: 0.8, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  rayStrip: {
    position: 'absolute',
    top: -40,  // Extend above viewport for natural origin
    overflow: 'hidden',
  },
  ray1: {
    left: '15%',
    width: 120,
    height: '80%',
  },
  ray2: {
    left: '55%',
    width: 80,
    height: '70%',
  },
  ray3: {
    left: '40%',
    width: 100,
    height: '65%',
  },
  ray4: {
    left: '25%',
    width: 140,
    height: '75%',
  },
});
