/**
 * EmptyChat -- empty state for new chat sessions.
 *
 * Features:
 * - 50px avatar circle with 30px Bot icon
 * - Time-based greeting ("Good morning/afternoon/evening")
 * - Suggestion chips: horizontal ScrollView, 6 items
 * - First-run detection via MMKV hasLaunchedBefore flag
 * - Entrance animation: Standard spring, opacity 0->1
 */

import { useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Bot } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { MMKV } from 'react-native-mmkv';

import { theme } from '../../theme/theme';
import { createStyles } from '../../theme/createStyles';
import { useStreamStore } from '../../stores/index';

// ---------------------------------------------------------------------------
// Greeting helper
// ---------------------------------------------------------------------------

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

// ---------------------------------------------------------------------------
// Suggestion chips
// ---------------------------------------------------------------------------

const SUGGESTIONS = [
  'Code review',
  'Bug fix',
  'Research',
  'Explain code',
  'Refactor',
  'Debug',
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const mmkv = new MMKV();

export function EmptyChat() {
  const modelName = useStreamStore((s) => s.modelName) ?? 'Claude';
  const isFirstLaunch = useRef(!mmkv.getBoolean('hasLaunchedBefore'));

  // Mark as launched
  useEffect(() => {
    if (isFirstLaunch.current) {
      mmkv.set('hasLaunchedBefore', true);
    }
  }, []);

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

  const greeting = getGreeting();

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, animatedStyle]}>
        {/* Provider avatar — larger circle */}
        <View style={styles.avatar}>
          <Bot
            size={30}
            color={theme.colors.text.primary}
            strokeWidth={1.5}
          />
        </View>

        {/* Time-based greeting */}
        <Text style={styles.greeting}>{greeting}</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>How can I help?</Text>

        {/* Suggestion chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContainer}
          style={styles.chipsScroll}
        >
          {SUGGESTIONS.map((label) => (
            <View key={label} style={styles.chip}>
              <Text style={styles.chipText}>{label}</Text>
            </View>
          ))}
        </ScrollView>
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
    paddingHorizontal: t.spacing.lg,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: t.colors.surface.overlay,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: t.spacing.sm,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '600' as const,
    fontFamily: 'Inter-SemiBold',
    lineHeight: 30,
    color: t.colors.text.primary,
    textAlign: 'center' as const,
  },
  subtitle: {
    ...t.typography.body,
    color: t.colors.text.secondary,
    textAlign: 'center' as const,
  },
  chipsScroll: {
    marginTop: t.spacing.lg,
    maxHeight: 48,
  },
  chipsContainer: {
    gap: 12,
    paddingHorizontal: t.spacing.xs,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: t.colors.surface.raised,
    borderWidth: 1,
    borderColor: t.colors.border.subtle,
  },
  chipText: {
    ...t.typography.small,
    color: t.colors.text.secondary,
  },
}));
