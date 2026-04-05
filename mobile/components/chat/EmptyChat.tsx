/**
 * EmptyChat -- empty state for new chat sessions.
 *
 * Modeled after Claude iOS: centered greeting with generous vertical space,
 * minimal chrome, no visual noise. Chips are functional but understated.
 */

import { useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Sparkles } from 'lucide-react-native';
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
// Greeting
// ---------------------------------------------------------------------------

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

// ---------------------------------------------------------------------------
// Suggestion chips — smaller, more like Claude iOS pills
// ---------------------------------------------------------------------------

const SUGGESTIONS = [
  'Code review',
  'Debug',
  'Explain',
  'Refactor',
];

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
// Stagger entrance
// ---------------------------------------------------------------------------

function useStaggerEntrance(delayMs: number) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);

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
// Component
// ---------------------------------------------------------------------------

interface EmptyChatProps {
  onSuggestionPress?: (text: string) => void;
}

export function EmptyChat({ onSuggestionPress }: EmptyChatProps) {
  const greeting = useMemo(() => getGreeting(), []);

  const iconStyle = useStaggerEntrance(0);
  const greetingStyle = useStaggerEntrance(100);
  const subtitleStyle = useStaggerEntrance(180);
  const chipsStyle = useStaggerEntrance(280);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Icon — like Claude's spark, not a generic bot */}
        <Animated.View style={iconStyle}>
          <Sparkles
            size={32}
            color={theme.colors.accent}
            strokeWidth={1.5}
          />
        </Animated.View>

        {/* Greeting — large, centered, serif-like feel */}
        <Animated.Text style={[styles.greeting, greetingStyle]} maxFontSizeMultiplier={1.3}>
          {greeting}
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text style={[styles.subtitle, subtitleStyle]} maxFontSizeMultiplier={1.3}>
          How can I help?
        </Animated.Text>

        {/* Chips — row, not scroll. 4 items fit on screen. */}
        <Animated.View style={[styles.chipsRow, chipsStyle]}>
          {SUGGESTIONS.map((label) => (
            <SuggestionChip
              key={label}
              label={label}
              onPress={onSuggestionPress}
            />
          ))}
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
    gap: t.spacing.md,
    paddingHorizontal: t.spacing.xl,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '600' as const,
    fontFamily: 'Inter-SemiBold',
    lineHeight: 28,
    color: t.colors.text.primary,
    textAlign: 'center' as const,
    marginTop: t.spacing.sm,
  },
  subtitle: {
    ...t.typography.body,
    color: t.colors.text.muted,
    textAlign: 'center' as const,
  },
  chipsRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'center' as const,
    gap: t.spacing.sm,
    marginTop: t.spacing.lg,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: t.radii.full,
    backgroundColor: 'transparent',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: t.colors.border.interactive, // Slightly more visible than subtle
  },
  chipText: {
    ...t.typography.small,
    color: t.colors.text.secondary,
  },
}));

