/**
 * UserBubble -- User message bubble with ring outline (better-chatbot pattern).
 *
 * Right-aligned (alignSelf: flex-end), maxWidth 78%, rounded 16px,
 * surface-raised background, ring border, NO drop shadow.
 *
 * Entrance animation per D-26: Standard spring, opacity 0->1, translateY 20->0.
 * Animation only fires on mount (hasAnimated ref prevents re-animation).
 *
 * Wrapped in React.memo on content + showTimestamp.
 * Pure presentational: no store imports, no side effects.
 */

import React, { useCallback } from 'react';
import { ActionSheetIOS, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

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
  const handleLongPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Copy', 'Cancel'],
          cancelButtonIndex: 1,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            Clipboard.setStringAsync(content);
          }
        },
      );
    } else {
      Clipboard.setStringAsync(content);
    }
  }, [content]);

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
    <View style={styles.container}>
      <Pressable onLongPress={handleLongPress} delayLongPress={400}>
        <View style={styles.bubble}>
          <Text style={styles.text}>{content}</Text>
        </View>
      </Pressable>
      {showTimestamp && formattedTime ? (
        <Text style={styles.timestamp}>{formattedTime}</Text>
      ) : null}
    </View>
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
    maxWidth: '78%',
  },
  bubble: {
    backgroundColor: t.colors.surface.raised,   // #1e1e18 per spec §1.1
    borderRadius: t.radii['2xl'],                // 16px
    paddingHorizontal: t.spacing.md,             // 16px — 8px grid
    paddingVertical: t.spacing.sm + t.spacing.xs, // 12px — 8px grid (8+4)
    borderWidth: StyleSheet.hairlineWidth,        // 0.5px — spec §1.7
    borderColor: t.colors.border.strong,          // card edges use border.strong per spec §1.7
    ...t.shadows.composer,                         // subtle shadow per spec §5
  },
  text: {
    ...t.typography.body,
    color: t.colors.text.primary,
  },
  timestamp: {
    ...t.typography.meta,                         // timestamps use meta tier per spec §2.1
    color: t.colors.text.muted,
    marginTop: t.spacing.xs,
    alignSelf: 'flex-end' as const,
  },
}));
