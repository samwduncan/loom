/**
 * MessageList -- Inverted FlatList rendering DisplayMessage[].
 *
 * NOTE: FlashList v2 removed `inverted` prop support. Staying with FlatList
 * for inverted chat lists until FlashList re-adds it.
 *
 * AR fix #9: Data is explicitly reversed ([...messages].reverse()) before passing
 * to the inverted FlatList. useMessageList returns oldest-first; inverted FlatList
 * renders index 0 at bottom, so data must be newest-first.
 *
 * FlatList key={sessionId} per Pitfall 7 -- forces unmount/remount on session
 * switch, preventing stale message flash.
 *
 * ToolDetailSheet rendered outside FlatList (Pitfall 4) with selectedToolCall state.
 * StreamingIndicator rendered below FlatList.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

import type { DisplayMessage } from '../../hooks/useMessageList';
import type { ToolCallState } from '@loom/shared/types/stream';
import { MessageItem } from './MessageItem';
import { StreamingIndicator } from './StreamingIndicator';
import { ToolDetailSheet } from './segments/ToolDetailSheet';
import { createStyles } from '../../theme/createStyles';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MessageListProps {
  messages: DisplayMessage[];
  isStreaming: boolean;
  sessionId: string;
  /** External scroll handler (composed with internal if any) */
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  /** Ref forwarded to the FlatList for external scroll control */
  listRef?: React.RefObject<FlatList<DisplayMessage>>;
  /** Initial scroll offset to restore (CHAT-07: scroll preservation) */
  initialScrollOffset?: number;
  /** Height of the glass header -- adds paddingBottom in inverted FlatList (visual top padding) */
  headerHeight?: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MessageList({ messages, isStreaming, sessionId, onScroll, listRef, initialScrollOffset, headerHeight }: MessageListProps) {
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
      const nextMsg = index < reversedMessages.length - 1 ? reversedMessages[index + 1] : null;
      const nextMessageRole = nextMsg?.role ?? null;

      return (
        <MessageItem
          message={item}
          nextMessageRole={nextMessageRole}
          onToolChipPress={handleToolChipPress}
          index={index}
        />
      );
    },
    [reversedMessages, handleToolChipPress],
  );

  // Restore initial scroll offset after data loads (CHAT-07)
  const localRef = React.useRef<FlatList<DisplayMessage>>(null);
  const flatListRef = listRef ?? localRef;

  useEffect(() => {
    if (initialScrollOffset && initialScrollOffset > 0 && reversedMessages.length > 0) {
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: initialScrollOffset, animated: false });
      }, 100);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, reversedMessages.length > 0]);

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        key={sessionId}
        data={reversedMessages}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        inverted={true}
        maintainVisibleContentPosition={{
          minIndexForVisible: 1,
          autoscrollToTopThreshold: 100,
        }}
        contentContainerStyle={[styles.contentContainer, headerHeight ? { paddingBottom: headerHeight } : undefined]}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyboardDismissMode="interactive"
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
