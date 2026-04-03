/**
 * UserBubble -- User message bubble with surface-raised styling.
 *
 * Right-aligned (alignSelf: flex-end), maxWidth 85%, rounded-xl,
 * surface-raised background, shadow-subtle.
 *
 * Entrance animation per D-26: Standard spring, opacity 0->1, translateY 20->0.
 * Animation only fires on mount (hasAnimated ref prevents re-animation).
 *
 * Wrapped in React.memo on content + showTimestamp.
 *
 * Pure presentational: no store imports, no side effects.
 */

import React, { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { theme } from '../../theme/theme';
import { createStyles } from '../../theme/createStyles';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface UserBubbleProps {
  content: string;
  timestamp: string;
  showTimestamp: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function UserBubbleInner({ content, timestamp, showTimestamp }: UserBubbleProps) {
  const hasAnimated = useRef(false);
  const opacity = useSharedValue(hasAnimated.current ? 1 : 0);
  const translateY = useSharedValue(hasAnimated.current ? 0 : 20);

  useEffect(() => {
    if (!hasAnimated.current) {
      hasAnimated.current = true;
      opacity.value = withSpring(1, theme.springs.standard);
      translateY.value = withSpring(0, theme.springs.standard);
    }
  }, [opacity, translateY]);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  // Format timestamp for display
  const formattedTime = React.useMemo(() => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }, [timestamp]);

  return (
    <Animated.View style={[styles.container, entranceStyle]}>
      <View style={[styles.bubble, theme.shadows.subtle]}>
        <Text style={styles.text}>{content}</Text>
      </View>
      {showTimestamp && formattedTime ? (
        <Text style={styles.timestamp}>{formattedTime}</Text>
      ) : null}
    </Animated.View>
  );
}

/**
 * Memoized UserBubble -- only re-renders when content or showTimestamp changes.
 */
export const UserBubble = React.memo(UserBubbleInner, (prev, next) => {
  return prev.content === next.content && prev.showTimestamp === next.showTimestamp;
});

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = createStyles((t) => ({
  container: {
    alignSelf: 'flex-end' as const,
    maxWidth: '85%',
  },
  bubble: {
    backgroundColor: t.colors.surface.raised,
    borderRadius: t.radii.xl,
    padding: t.spacing.md,
  },
  text: {
    ...t.typography.body,
    color: t.colors.text.primary,
  },
  timestamp: {
    ...t.typography.small,
    color: t.colors.text.muted,
    marginTop: t.spacing.xs,
    alignSelf: 'flex-end' as const,
  },
}));
