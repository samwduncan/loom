/**
 * MessageList -- Inverted FlashList rendering DisplayMessage[].
 *
 * Uses @shopify/flash-list for streaming performance (5-10x fewer re-renders
 * than FlatList). estimatedItemSize=400 per Galaxies-dev reference.
 *
 * AR fix #9: Data is explicitly reversed ([...messages].reverse()) before passing
 * to the inverted FlashList. useMessageList returns oldest-first; inverted FlashList
 * renders index 0 at bottom, so data must be newest-first.
 *
 * FlashList key={sessionId} per Pitfall 7 -- forces unmount/remount on session
 * switch, preventing stale message flash.
 *
 * ToolDetailSheet rendered outside FlashList (Pitfall 4) with selectedToolCall state.
 * StreamingIndicator rendered below FlashList.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Keyboard, View } from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { FlashList } from '@shopify/flash-list';

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
  /** Ref forwarded to the FlashList for external scroll control */
  listRef?: React.RefObject<FlashList<DisplayMessage>>;
  /** Initial scroll offset to restore (CHAT-07: scroll preservation) */
  initialScrollOffset?: number;
  /** Height of the glass header -- adds paddingBottom in inverted FlashList (visual top padding) */
  headerHeight?: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MessageList({ messages, isStreaming, sessionId, onScroll, listRef, initialScrollOffset, headerHeight }: MessageListProps) {
  // Tool detail sheet state
  const [selectedToolCall, setSelectedToolCall] = useState<ToolCallState | null>(null);

  // AR fix #9: Explicitly reverse for inverted FlashList
  // useMessageList returns oldest-first; inverted FlashList renders index 0 at bottom
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
      // But in inverted FlashList, "below" in display = higher index in data
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

  // Restore initial scroll offset after data loads (CHAT-07)
  const localRef = React.useRef<FlashList<DisplayMessage>>(null);
  const flashListRef = listRef ?? localRef;

  useEffect(() => {
    if (initialScrollOffset && initialScrollOffset > 0 && reversedMessages.length > 0) {
      const timer = setTimeout(() => {
        flashListRef.current?.scrollToOffset({ offset: initialScrollOffset, animated: false });
      }, 100);
      return () => clearTimeout(timer);
    }
  // Only run once per session (key={sessionId} remounts, so this runs once)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, reversedMessages.length > 0]);

  // Tap outside composer to dismiss keyboard
  const handleTapDismiss = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  return (
    <View style={styles.container}>
      <FlashList
        ref={flashListRef}
        key={sessionId}
        data={reversedMessages}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        estimatedItemSize={400}
        inverted={true}
        contentContainerStyle={headerHeight ? { paddingBottom: headerHeight } : undefined}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyboardDismissMode="interactive"
        onTouchStart={handleTapDismiss}
      />

      {/* Streaming indicator below FlashList (above composer) */}
      <StreamingIndicator isStreaming={isStreaming} />

      {/* Tool detail sheet -- outside FlashList scroll hierarchy (Pitfall 4) */}
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
}));
