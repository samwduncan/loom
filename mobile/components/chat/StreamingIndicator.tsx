/**
 * StreamingIndicator -- thin 2px accent line that pulses during streaming.
 *
 * Per D-26: 2px height, accent color (rgb(196, 108, 88)), pulsing opacity
 * 0.3 to 0.8 over 1.5s cycle. Disappears when streaming completes.
 *
 * Uses Reanimated withRepeat + withTiming for opacity pulse.
 */

import { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { ACCENT } from '../../lib/colors';

interface StreamingIndicatorProps {
  isStreaming: boolean;
}

export function StreamingIndicator({ isStreaming }: StreamingIndicatorProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    if (isStreaming) {
      opacity.value = withRepeat(
        withTiming(0.8, { duration: 1500 }),
        -1, // infinite
        true, // reverse: 0.3 -> 0.8 -> 0.3
      );
    } else {
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [isStreaming, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!isStreaming) return null;

  return (
    <Animated.View
      style={[
        {
          height: 2,
          width: '100%',
          backgroundColor: ACCENT,
        },
        animatedStyle,
      ]}
    />
  );
}
