/**
 * MessageItem -- Dispatches to UserBubble or AssistantMessage based on role.
 *
 * Spacing: marginBottom varies by whether the next message is from the same role.
 * - 24px (theme.spacing.lg) between different roles
 * - 8px (theme.spacing.sm) between same role
 *
 * Wrapped in React.memo on message.id + message.content + message.isStreaming.
 */

import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';

import type { DisplayMessage } from '../../hooks/useMessageList';
import type { ToolCallState } from '@loom/shared/types/stream';
import { UserBubble } from './UserBubble';
import { AssistantMessage } from './AssistantMessage';
import { theme } from '../../theme/theme';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/** Max items that get stagger delay. Beyond this, items appear instantly. */
const MAX_STAGGER_INDEX = 8;
/** Delay in ms between each staggered item. */
const STAGGER_DELAY = 40;

interface MessageItemProps {
  message: DisplayMessage;
  /** Role of the next message (for spacing). Null if last message. */
  nextMessageRole: 'user' | 'assistant' | null;
  onToolChipPress: (toolCall: ToolCallState) => void;
  /** Index in the list for stagger entrance animation. */
  index?: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function MessageItemInner({ message, nextMessageRole, onToolChipPress, index = 0 }: MessageItemProps) {
  // Spacing: lg (24px) between different roles, sm (8px) between same role
  const marginBottom =
    nextMessageRole === null
      ? theme.spacing.sm
      : nextMessageRole === message.role
        ? theme.spacing.sm
        : theme.spacing.lg;

  // Stagger entrance: items beyond MAX_STAGGER_INDEX appear instantly
  const shouldAnimate = index < MAX_STAGGER_INDEX;
  const opacity = useSharedValue(shouldAnimate ? 0 : 1);
  const translateY = useSharedValue(shouldAnimate ? 16 : 0);

  useEffect(() => {
    if (shouldAnimate) {
      const delay = index * STAGGER_DELAY;
      opacity.value = withDelay(delay, withSpring(1, theme.springs.standard));
      translateY.value = withDelay(delay, withSpring(0, theme.springs.standard));
    }
  }, [shouldAnimate, index, opacity, translateY]);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[{ marginBottom }, entranceStyle]}>
      {message.role === 'user' ? (
        <UserBubble
          content={message.content}
          timestamp={message.timestamp}
          showTimestamp={message.showTimestamp}
        />
      ) : (
        <AssistantMessage
          message={message}
          onToolChipPress={onToolChipPress}
        />
      )}
    </Animated.View>
  );
}

/**
 * Memoized MessageItem -- re-renders when id, content, or streaming state changes.
 */
export const MessageItem = React.memo(MessageItemInner, (prev, next) => {
  return (
    prev.message.id === next.message.id &&
    prev.message.content === next.message.content &&
    prev.message.isStreaming === next.message.isStreaming &&
    prev.nextMessageRole === next.nextMessageRole &&
    prev.index === next.index
  );
});
