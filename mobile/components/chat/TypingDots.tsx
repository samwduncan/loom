/**
 * TypingDots -- 3-dot pulsing indicator for active streaming.
 *
 * Pattern adapted from better-chatbot think.tsx:
 * 3 circles (6px), staggered scale+opacity pulse, 1.5s infinite cycle.
 * Uses Reanimated withRepeat + withDelay for stagger.
 */

import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { theme } from '../../theme/theme';

const DOT_SIZE = 6;
const DOT_GAP = 6;
const DURATION = 750; // ms per half-cycle (1.5s full)
const DELAYS = [0, 150, 300];

function Dot({ delay }: { delay: number }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    // Scale: 1 -> 1.4 -> 1, repeating
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.4, { duration: DURATION, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: DURATION, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      ),
    );
    // Opacity: 0.4 -> 1 -> 0.4, repeating
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: DURATION, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.4, { duration: DURATION, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      ),
    );
  }, [delay, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: DOT_SIZE,
          height: DOT_SIZE,
          borderRadius: DOT_SIZE / 2,
          backgroundColor: theme.colors.accent,
        },
        animatedStyle,
      ]}
    />
  );
}

export function TypingDots() {
  return (
    <View style={{ flexDirection: 'row', gap: DOT_GAP, alignItems: 'center' }}>
      {DELAYS.map((d, i) => (
        <Dot key={i} delay={d} />
      ))}
    </View>
  );
}
