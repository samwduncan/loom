/**
 * MessageList -- Inverted FlatList rendering DisplayMessage[].
 *
 * AR fix #9: Data is explicitly reversed ([...messages].reverse()) before passing
 * to the inverted FlatList. useMessageList returns oldest-first; inverted FlatList
 * renders index 0 at bottom, so data must be newest-first.
 *
 * FlatList key={sessionId} per Pitfall 7 -- forces unmount/remount on session
 * switch, preventing stale message flash.
 *
 * maintainVisibleContentPosition per RESEARCH.md Pitfall 1 -- prevents scroll
 * jump when new messages are added above the visible area.
 *
 * ToolDetailSheet rendered outside FlatList (Pitfall 4) with selectedToolCall state.
 * StreamingIndicator rendered below FlatList.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';

import type { DisplayMessage } from '../../hooks/useMessageList';
import type { ToolCallState } from '@loom/shared/types/stream';
import { MessageItem } from './MessageItem';
import { StreamingIndicator } from './StreamingIndicator';
import { ToolDetailSheet } from './segments/ToolDetailSheet';
import { theme } from '../../theme/theme';
import { createStyles } from '../../theme/createStyles';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MessageListProps {
  messages: DisplayMessage[];
  isStreaming: boolean;
  sessionId: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MessageList({ messages, isStreaming, sessionId }: MessageListProps) {
  // Tool detail sheet state
  const [selectedToolCall, setSelectedToolCall] = useState<ToolCallState | null>(null);

  // AR fix #9: Explicitly reverse for inverted FlatList
  // useMessageList returns oldest-first; inverted FlatList renders index 0 at bottom
  const reversedMessages = useMemo(() => [...messages].reverse(), [messages]);

  const handleToolChipPress = useCallback((toolCall: ToolCallState) => {
    setSelectedToolCall(toolCall);
  }, []);

  const handleDismissSheet = useCallback(() => {
    setSelectedToolCall(null);
  }, []);

  const keyExtractor = useCallback((item: DisplayMessage) => item.id, []);

  const renderItem = useCallback(
    ({ item, index }: { item: DisplayMessage; index: number }) => {
      // In reversed (newest-first) data, the next message visually below is at index-1
      // But in inverted FlatList, "below" in display = higher index in data
      // So the next message in the conversation (older) is at index+1
      const nextMsg = index < reversedMessages.length - 1 ? reversedMessages[index + 1] : null;
      const nextMessageRole = nextMsg?.role ?? null;

      return (
        <MessageItem
          message={item}
          nextMessageRole={nextMessageRole}
          onToolChipPress={handleToolChipPress}
        />
      );
    },
    [reversedMessages, handleToolChipPress],
  );

  return (
    <View style={styles.container}>
      <FlatList
        key={sessionId}
        data={reversedMessages}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        inverted={true}
        maintainVisibleContentPosition={{
          minIndexForVisible: 1,
          autoscrollToTopThreshold: 100,
        }}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Streaming indicator below FlatList (above composer) */}
      <StreamingIndicator isStreaming={isStreaming} />

      {/* Tool detail sheet -- outside FlatList scroll hierarchy (Pitfall 4) */}
      <ToolDetailSheet
        toolCall={selectedToolCall}
        isVisible={!!selectedToolCall}
        onDismiss={handleDismissSheet}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = createStyles((t) => ({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: t.spacing.md,
    paddingTop: t.spacing.md, // Appears as bottom in inverted FlatList
  },
}));
