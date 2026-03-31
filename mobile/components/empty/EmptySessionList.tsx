/**
 * Empty session list state -- per D-24.
 *
 * Centered vertically in drawer: "No sessions yet" (15px Body, text-muted)
 * with NewChatButton below. Standard spring entrance on first load
 * (opacity 0->1, translateY 20->0).
 */

import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { SPRING } from '../../lib/springs';
import { NewChatButton } from '../session/NewChatButton';

interface EmptySessionListProps {
  onNewChat: () => void;
}

export function EmptySessionList({ onNewChat }: EmptySessionListProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withSpring(1, SPRING.standard);
    translateY.value = withSpring(0, SPRING.standard);
  }, [opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 16,
        },
        animatedStyle,
      ]}
    >
      <Text
        style={{
          fontSize: 15,
          color: 'rgb(148, 144, 141)',
          textAlign: 'center',
          marginBottom: 16,
        }}
      >
        No sessions yet
      </Text>
      <View style={{ width: '100%' }}>
        <NewChatButton onPress={onNewChat} />
      </View>
    </Animated.View>
  );
}
