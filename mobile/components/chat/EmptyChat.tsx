/**
 * EmptyChat -- empty state for new chat sessions.
 *
 * D-33: Provider avatar (24px circle, surface-overlay bg, Bot icon) + model name
 * (Small 13px, text-muted) + "How can I help?" (Body 15px, text-primary).
 *
 * Entrance: Standard spring, opacity 0->1 on all elements.
 * Reads modelName from useStreamStore (defaults to "Claude").
 */

import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { Bot } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { theme } from '../../theme/theme';
import { createStyles } from '../../theme/createStyles';
import { useStreamStore } from '../../stores/index';

export function EmptyChat() {
  const modelName = useStreamStore((s) => s.modelName) ?? 'Claude';

  // Entrance animation
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  useEffect(() => {
    opacity.value = withSpring(1, theme.springs.standard);
    translateY.value = withSpring(0, theme.springs.standard);
  }, [opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, animatedStyle]}>
        {/* Provider avatar */}
        <View style={styles.avatar}>
          <Bot
            size={16}
            color={theme.colors.text.primary}
            strokeWidth={2}
          />
        </View>

        {/* Model name */}
        <Text style={styles.modelName}>{modelName}</Text>

        {/* Greeting */}
        <Text style={styles.greeting}>How can I help?</Text>
      </Animated.View>
    </View>
  );
}

const styles = createStyles((t) => ({
  container: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  content: {
    alignItems: 'center' as const,
    gap: t.spacing.sm,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: t.radii.full,
    backgroundColor: t.colors.surface.overlay,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  modelName: {
    ...t.typography.small,
    color: t.colors.text.muted,
  },
  greeting: {
    ...t.typography.body,
    color: t.colors.text.primary,
    textAlign: 'center' as const,
  },
}));
