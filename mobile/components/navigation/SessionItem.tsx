/**
 * Session item for the drawer SectionList.
 *
 * Features:
 * - Swipe-left-to-delete via Swipeable (react-native-gesture-handler)
 * - Pulsing accent dot for running sessions (D-10)
 * - Active session: bg highlight (raised surface) + borderRadius 12 + font-medium
 *   NO left accent border (removed per visual clone spec)
 * - Stagger entrance animation: 30ms delay per item, max 10 animated (D-13)
 * - PressableScale with Micro spring and haptic feedback
 *
 * Props: session, isActive, isRunning, index, onPress, onDelete
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { View, Text, Pressable } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { haptic } from '../../lib/haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import type { SessionData } from '../../hooks/useSessions';
import { relativeTime } from '../../hooks/useSessions';
import { theme } from '../../theme/theme';
import { createStyles } from '../../theme/createStyles';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SessionItemProps {
  session: SessionData;
  isActive: boolean;
  isRunning: boolean;
  index: number;
  onPress: () => void;
  onDelete: () => void;
}

// ---------------------------------------------------------------------------
// Animated Pressable for spring scale feedback
// ---------------------------------------------------------------------------

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ---------------------------------------------------------------------------
// Running Dot (pulsing accent indicator per D-10)
// ---------------------------------------------------------------------------

function RunningDot() {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1.0, { duration: 750 }),
      -1, // infinite
      true, // reverse
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.runningDot, animatedStyle]} />;
}

// ---------------------------------------------------------------------------
// Right action for swipe-to-delete
// ---------------------------------------------------------------------------

function renderRightActions() {
  return (
    <View style={styles.deleteAction}>
      <Text style={styles.deleteText}>Delete</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// SessionItem
// ---------------------------------------------------------------------------

export function SessionItem({
  session,
  isActive,
  isRunning,
  index,
  onPress,
  onDelete,
}: SessionItemProps) {
  const swipeableRef = useRef<Swipeable>(null);

  // Stagger entrance animation
  const entryOpacity = useSharedValue(0);
  const entryTranslateY = useSharedValue(10);
  const hasAnimated = useRef(false);

  // Press scale
  const scale = useSharedValue(1);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    if (index < 10) {
      const delay = index * 30;
      entryOpacity.value = withDelay(delay, withSpring(1, theme.springs.standard));
      entryTranslateY.value = withDelay(delay, withSpring(0, theme.springs.standard));
    } else {
      entryOpacity.value = 1;
      entryTranslateY.value = 0;
    }
  }, [index, entryOpacity, entryTranslateY]);

  const entryStyle = useAnimatedStyle(() => ({
    opacity: entryOpacity.value,
    transform: [{ translateY: entryTranslateY.value }],
  }));

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, theme.springs.micro);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, theme.springs.micro);
  }, [scale]);

  const handlePress = useCallback(() => {
    haptic.selection();
    onPress();
  }, [onPress]);

  const handleSwipeableOpen = useCallback(
    (direction: 'left' | 'right') => {
      if (direction === 'right') {
        haptic.transition();
        onDelete();
        // Close the swipeable after triggering delete
        swipeableRef.current?.close();
      }
    },
    [onDelete],
  );

  return (
    <Animated.View style={entryStyle}>
      <Swipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        onSwipeableOpen={handleSwipeableOpen}
        overshootRight={false}
        friction={2}
        rightThreshold={40}
      >
        <AnimatedPressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          style={[
            styles.itemContainer,
            pressStyle,
            isActive && styles.activeItem,
          ]}
          accessibilityRole="button"
          accessibilityLabel={session.title}
        >
          <View style={styles.textContainer}>
            <Text
              style={[styles.title, isActive && styles.activeTitle]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {session.title}
            </Text>
            <Text style={styles.subtitle}>
              {relativeTime(session.updatedAt)}
            </Text>
          </View>

          {isRunning && <RunningDot />}
        </AnimatedPressable>
      </Swipeable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = createStyles((t) => ({
  itemContainer: {
    minHeight: 48,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: t.spacing.md,
    paddingVertical: 10,
    marginHorizontal: t.spacing.sm,
    borderRadius: t.radii.md, // 12px
    backgroundColor: 'transparent',
  },
  activeItem: {
    backgroundColor: t.colors.surface.raised,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center' as const,
  },
  title: {
    ...t.typography.body,
    color: t.colors.text.primary,
  },
  activeTitle: {
    fontWeight: '600' as const,
    fontFamily: 'Inter-SemiBold',
  },
  subtitle: {
    ...t.typography.caption,
    color: t.colors.text.muted,
    marginTop: 2,
  },
  runningDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: t.colors.accent,
    marginLeft: t.spacing.sm,
  },
  deleteAction: {
    backgroundColor: t.colors.destructive,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    width: 80,
  },
  deleteText: {
    color: '#ffffff',
    ...t.typography.body,
    fontWeight: '600' as const,
  },
}));
