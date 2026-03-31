/**
 * SendButton -- circular 36px send/stop toggle for the chat composer.
 *
 * Per D-14 / Soul doc Composer section:
 * - Empty state: surface-raised bg, ArrowUp icon (20px, text-muted)
 * - Has text state: accent bg with Glow shadow, ArrowUp icon in white.
 *   Transition: 200ms withTiming from surface-raised to accent.
 * - Streaming state: destructive bg, Square icon (16px, white).
 *   Send button transforms to stop button. 200ms color transition.
 *
 * Per Soul doc "Sending a Message":
 * - Micro spring scale (0.85 to 1.0) on press
 * - Impact Light haptic on press
 */

import { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ArrowUp, Square } from 'lucide-react-native';
import { SPRING } from '../../lib/springs';
import { SURFACE, ACCENT, DESTRUCTIVE } from '../../lib/colors';

interface SendButtonProps {
  hasText: boolean;
  isStreaming: boolean;
  onSend: () => void;
  onStop: () => void;
}

export function SendButton({ hasText, isStreaming, onSend, onStop }: SendButtonProps) {
  const scale = useSharedValue(1);
  // 0 = empty, 1 = has text, 2 = streaming
  const colorPhase = useSharedValue(0);

  useEffect(() => {
    if (isStreaming) {
      colorPhase.value = withTiming(2, { duration: 200 });
    } else if (hasText) {
      colorPhase.value = withTiming(1, { duration: 200 });
    } else {
      colorPhase.value = withTiming(0, { duration: 200 });
    }
  }, [hasText, isStreaming, colorPhase]);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.85, SPRING.micro);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING.micro);
  }, [scale]);

  const handlePress = useCallback(() => {
    if (isStreaming) {
      onStop();
    } else if (hasText) {
      onSend();
    }
  }, [isStreaming, hasText, onSend, onStop]);

  const animatedStyle = useAnimatedStyle(() => {
    const bgColor = interpolateColor(
      colorPhase.value,
      [0, 1, 2],
      [SURFACE.raised, ACCENT, DESTRUCTIVE],
    );

    return {
      transform: [{ scale: scale.value }],
      backgroundColor: bgColor,
      // Glow shadow when active (has text or streaming)
      shadowColor: colorPhase.value > 0.5 ? ACCENT : 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: colorPhase.value > 0.5 ? 0.25 : 0,
      shadowRadius: 16,
    };
  });

  const iconColor = hasText || isStreaming ? 'rgb(255, 255, 255)' : 'rgb(148, 144, 141)';

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={!hasText && !isStreaming}
    >
      <Animated.View style={[styles.button, animatedStyle]}>
        {isStreaming ? (
          <Square size={16} color={iconColor} fill={iconColor} strokeWidth={0} />
        ) : (
          <ArrowUp size={20} color={iconColor} strokeWidth={2.5} />
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
