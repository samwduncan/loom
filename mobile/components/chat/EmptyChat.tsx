/**
 * EmptyChat -- empty state for new chat sessions.
 *
 * Modeled after Claude iOS: centered greeting with generous vertical space,
 * minimal chrome, no visual noise. Chips are functional but understated.
 */

import { useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { AtmosphericLayer } from './AtmosphericLayer';
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
      {/* Atmospheric depth — behind all content, max 6% opacity */}
      <AtmosphericLayer visible />
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
    paddingBottom: '20%',
  },
  content: {
    alignItems: 'center' as const,
    gap: t.spacing.sm,                          // 8px — strict 8px grid per spec §3
    paddingHorizontal: t.spacing.xl,            // 32px
  },
  greeting: {
    ...t.typography.headline,                   // 20px/600 per spec §2.1
    color: t.colors.text.primary,
    textAlign: 'center' as const,
    marginTop: t.spacing.sm,                    // 8px
  },
  subtitle: {
    ...t.typography.body,                       // 16px/400 per spec §2.1
    color: t.colors.text.muted,                 // muted for section headers per spec §1.6
    textAlign: 'center' as const,
  },
  chipsRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'center' as const,
    gap: t.spacing.sm,                          // 8px — button gap per spec §3
    marginTop: t.spacing.lg,                    // 24px
  },
  chip: {
    height: 36,
    paddingHorizontal: t.spacing.sm + t.spacing.xs, // 12px
    justifyContent: 'center' as const,
    borderRadius: t.radii.pill,
    backgroundColor: 'transparent',
    borderWidth: StyleSheet.hairlineWidth,       // 0.5px per spec §1.7
    borderColor: t.colors.border.medium,         // default divider border
  },
  chipText: {
    ...t.typography.label,                       // 13px/500 per spec §2.1
    color: t.colors.text.secondary,
  },
}));

