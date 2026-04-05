/**
 * ThinkingSegment -- expandable thinking block with auto-collapse on stream end.
 *
 * Behavior per D-05, D-06, D-07, D-08:
 * - Expanded during active streaming (isActive=true) -- user sees thinking text in real-time
 * - Auto-collapses when isActive transitions false (content phase begins)
 * - Collapsed: divider + "Thought for Xs" label, tap to re-expand
 * - No card/container (D-07) -- divider + text on base surface
 * - Thinking text in text-muted color (dimmed per D-07)
 *
 * Duration: Real elapsed time via useRef(Date.now()), NOT character-count heuristic (AR fix #6).
 * Animation: Expand spring (18/90/1.0 ~400ms) via Reanimated useAnimatedStyle for height.
 * Haptic: selectionAsync() on tap toggle.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { ThinkingBlock } from '@loom/shared/types/message';
import { createStyles } from '../../../theme/createStyles';
import { theme } from '../../../theme/theme';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ThinkingSegmentProps {
  block: ThinkingBlock;
  isActive: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EXPAND_TIMING = { duration: 200, easing: Easing.inOut(Easing.ease) };
const COLLAPSED_HEIGHT = 44; // iOS HIG 44pt minimum touch target

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function ThinkingSegmentInner({ block, isActive }: ThinkingSegmentProps) {
  // -------------------------------------------------------------------------
  // Duration tracking (AR fix #6: real elapsed time, not character-count)
  // -------------------------------------------------------------------------
  const startTimeRef = useRef<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (isActive && !startTimeRef.current) {
      startTimeRef.current = Date.now();
    }
    if (!isActive && startTimeRef.current) {
      const elapsed = Math.max(
        1,
        Math.round((Date.now() - startTimeRef.current) / 1000),
      );
      setElapsedSeconds(elapsed);
      // Don't reset startTimeRef -- one-shot capture
    }
  }, [isActive]);

  // -------------------------------------------------------------------------
  // Expand/collapse state
  // -------------------------------------------------------------------------
  const [isUserExpanded, setIsUserExpanded] = useState(false);
  const isExpanded = useSharedValue(isActive ? 1 : 0);
  const contentHeight = useRef(0);
  const prevIsActive = useRef(isActive);

  // Auto-collapse when streaming ends
  useEffect(() => {
    if (prevIsActive.current && !isActive) {
      // Transition from active to inactive -- auto-collapse
      isExpanded.value = withTiming(0, EXPAND_TIMING);
      setIsUserExpanded(false);
    } else if (!prevIsActive.current && isActive) {
      // Transition from inactive to active -- expand
      isExpanded.value = withTiming(1, EXPAND_TIMING);
    }
    prevIsActive.current = isActive;
  }, [isActive, isExpanded]);

  // Start expanded if initially active
  useEffect(() => {
    if (isActive) {
      isExpanded.value = 1;
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tap to toggle expand/collapse
  const handleToggle = useCallback(() => {
    if (isActive) return; // Don't allow collapse during active streaming

    Haptics.selectionAsync();
    const shouldExpand = isExpanded.value < 0.5;
    isExpanded.value = withTiming(shouldExpand ? 1 : 0, EXPAND_TIMING);
    setIsUserExpanded(shouldExpand);
  }, [isActive, isExpanded]);

  // Measure content height for animation
  const handleContentLayout = useCallback(
    (event: { nativeEvent: { layout: { height: number } } }) => {
      const height = event.nativeEvent.layout.height;
      if (height > 0) {
        contentHeight.current = height;
      }
    },
    [],
  );

  // Animated height interpolation
  const animatedContainerStyle = useAnimatedStyle(() => {
    const measuredHeight = contentHeight.current || 200; // Fallback until measured
    const targetHeight =
      COLLAPSED_HEIGHT +
      isExpanded.value * (measuredHeight - COLLAPSED_HEIGHT);

    return {
      height: Math.max(COLLAPSED_HEIGHT, targetHeight),
      overflow: 'hidden' as const,
    };
  });

  // -------------------------------------------------------------------------
  // Display text
  // -------------------------------------------------------------------------
  const summaryText = isActive
    ? 'Thinking...'
    : `Thought for ${elapsedSeconds}s`;

  const isCurrentlyExpanded = isActive || isUserExpanded;

  return (
    <Pressable
      onPress={handleToggle}
      disabled={isActive}
      accessibilityRole="button"
      accessibilityLabel={`Thinking block, ${isCurrentlyExpanded ? 'expanded' : 'collapsed'}. ${summaryText}`}
      accessibilityState={{ expanded: isCurrentlyExpanded }}
    >
      <Animated.View style={animatedContainerStyle}>
        <View onLayout={handleContentLayout}>
          {/* Divider line */}
          <View style={styles.divider} />

          {/* Summary label (always visible -- serves as collapsed content) */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>{summaryText}</Text>
          </View>

          {/* Thinking text content (visible when expanded) */}
          {block.text.length > 0 && (
            <View style={styles.contentContainer}>
              <Text style={styles.thinkingText}>{block.text}</Text>
            </View>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Memoized export
// ---------------------------------------------------------------------------

export const ThinkingSegment = React.memo(ThinkingSegmentInner);

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = createStyles((t) => ({
  divider: {
    height: 1,
    backgroundColor: t.colors.border.subtle,
    marginVertical: t.spacing.sm,
  },
  summaryRow: {
    minHeight: 44, // iOS HIG 44pt touch target — visual compactness via zero padding
    justifyContent: 'center',
    paddingVertical: 0,
  },
  summaryText: {
    fontSize: t.typography.small.fontSize,
    fontWeight: t.typography.small.fontWeight,
    lineHeight: t.typography.small.lineHeight,
    fontFamily: 'Inter-Regular',
    color: t.colors.text.muted,
  },
  contentContainer: {
    paddingBottom: t.spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: t.colors.text.muted,
    paddingLeft: t.spacing.sm,
  },
  thinkingText: {
    fontSize: t.typography.body.fontSize,
    fontWeight: t.typography.body.fontWeight,
    lineHeight: t.typography.body.lineHeight,
    fontFamily: 'Inter-Regular',
    color: t.colors.text.muted, // Dimmed per D-07
  },
}));
