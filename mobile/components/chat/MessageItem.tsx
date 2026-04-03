/**
 * MessageItem -- Dispatches to UserBubble or AssistantMessage based on role.
 *
 * Spacing: marginBottom varies by whether the next message is from the same role.
 * - 24px (theme.spacing.lg) between different roles
 * - 8px (theme.spacing.sm) between same role
 *
 * Wrapped in React.memo on message.id + message.content + message.isStreaming.
 */

import React from 'react';
import { View } from 'react-native';

import type { DisplayMessage } from '../../hooks/useMessageList';
import type { ToolCallState } from '@loom/shared/types/stream';
import { UserBubble } from './UserBubble';
import { AssistantMessage } from './AssistantMessage';
import { theme } from '../../theme/theme';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MessageItemProps {
  message: DisplayMessage;
  /** Role of the next message (for spacing). Null if last message. */
  nextMessageRole: 'user' | 'assistant' | null;
  onToolChipPress: (toolCall: ToolCallState) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function MessageItemInner({ message, nextMessageRole, onToolChipPress }: MessageItemProps) {
  // Spacing: lg (24px) between different roles, sm (8px) between same role
  const marginBottom =
    nextMessageRole === null
      ? theme.spacing.sm
      : nextMessageRole === message.role
        ? theme.spacing.sm
        : theme.spacing.lg;

  return (
    <View style={{ marginBottom }}>
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
    </View>
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
    prev.nextMessageRole === next.nextMessageRole
  );
});
