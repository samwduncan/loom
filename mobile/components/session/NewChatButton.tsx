/**
 * New Chat button -- accent CTA at top of drawer (D-13).
 *
 * Full-width within drawer padding (mx-4), 44px min height,
 * accent background, rounded-xl, Micro spring press feedback.
 */

import React, { useCallback } from 'react';
import { Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { SPRING } from '../../lib/springs';
import { ACCENT } from '../../lib/colors';

interface NewChatButtonProps {
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function NewChatButton({ onPress }: NewChatButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, SPRING.micro);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING.micro);
  }, [scale]);

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        animatedStyle,
        {
          minHeight: 44,
          backgroundColor: ACCENT,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          marginHorizontal: 16,
        },
      ]}
    >
      <Text
        style={{
          fontSize: 15,
          fontWeight: '600',
          color: '#fff',
        }}
      >
        New Chat
      </Text>
    </AnimatedPressable>
  );
}
