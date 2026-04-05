/**
 * EmptyChat -- empty state for new chat sessions.
 *
 * Features:
 * - 50px avatar circle with 30px Bot icon
 * - Time-based greeting ("Good morning/afternoon/evening")
 * - Suggestion chips: horizontal ScrollView, 6 items
 * - Suggestion chips (visual, not yet interactive)
 * - Entrance animation: Standard spring, opacity 0->1
 */

import { useCallback, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Bot } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { haptic } from '../../lib/haptics';
import { theme } from '../../theme/theme';
import { createStyles } from '../../theme/createStyles';
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Interactive chip with micro-spring press animation
// ---------------------------------------------------------------------------

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function SuggestionChip({ label, onPress }: { label: string; onPress?: (text: string) => void }) {
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.95, theme.springs.micro);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, theme.springs.micro);
  }, [scale]);

  const handlePress = useCallback(() => {
    haptic.selection();
    onPress?.(label);
  }, [onPress, label]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[styles.chip, animStyle]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Text style={styles.chipText}>{label}</Text>
    </AnimatedPressable>
  );
}

// ---------------------------------------------------------------------------
// Staggered element helper
// ---------------------------------------------------------------------------

function useStaggerEntrance(delayMs: number) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  useEffect(() => {
    opacity.value = withDelay(delayMs, withSpring(1, theme.springs.standard));
    translateY.value = withDelay(delayMs, withSpring(0, theme.springs.standard));
  }, [delayMs, opacity, translateY]);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface EmptyChatProps {
  onSuggestionPress?: (text: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EmptyChat({ onSuggestionPress }: EmptyChatProps) {
  const greeting = useMemo(() => getGreeting(), []);

  // Stagger entrance: avatar 0ms, greeting 80ms, subtitle 160ms, chips 240ms
  const avatarStyle = useStaggerEntrance(0);
  const greetingStyle = useStaggerEntrance(80);
  const subtitleStyle = useStaggerEntrance(160);
  const chipsStyle = useStaggerEntrance(240);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Provider avatar -- larger circle */}
        <Animated.View style={[styles.avatar, avatarStyle]}>
          <Bot
            size={30}
            color={theme.colors.text.primary}
            strokeWidth={1.5}
          />
        </Animated.View>

        {/* Time-based greeting */}
        <Animated.Text style={[styles.greeting, greetingStyle]} maxFontSizeMultiplier={1.3}>{greeting}</Animated.Text>

        {/* Subtitle */}
        <Animated.Text style={[styles.subtitle, subtitleStyle]} maxFontSizeMultiplier={1.3}>How can I help?</Animated.Text>

        {/* Suggestion chips */}
        <Animated.View style={chipsStyle}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContainer}
            style={styles.chipsScroll}
          >
            {SUGGESTIONS.map((label) => (
              <SuggestionChip
                key={label}
                label={label}
                onPress={onSuggestionPress}
              />
            ))}
          </ScrollView>
        </Animated.View>
      </View>
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
