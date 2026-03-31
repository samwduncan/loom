/**
 * MessageList -- scrollable list of chat messages with FlashList, streaming
 * indicator, and scroll-to-bottom pill.
 *
 * Per Soul doc Chat Thread: FlashList/FlatList filling space between header
 * and composer. Normal order with scrollToEnd (NOT inverted list -- research
 * anti-pattern).
 *
 * Auto-scrolls to bottom when new content arrives AND user is at bottom.
 * Does NOT auto-scroll if user has scrolled up (via useScrollToBottom).
 *
 * Renders MessageBubble for each message. During streaming, the last message
 * in the array is already the virtual streaming message from useMessageList.
 */

import { useEffect, useRef, useCallback } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { MessageBubble } from './MessageBubble';
import { StreamingIndicator } from './StreamingIndicator';
import { ScrollToBottomPill } from './ScrollToBottomPill';
import { useScrollToBottom } from '../../hooks/useScrollToBottom';
import type { DisplayMessage } from '../../hooks/useMessageList';

interface MessageListProps {
  messages: DisplayMessage[];
  isStreaming: boolean;
}

/**
 * Attempts FlashList import; falls back to FlatList.
 * FlashList v2 installed as @shopify/flash-list but may not resolve in all
 * Metro configs. FlatList is the safe fallback.
 */
let ListComponent: any = FlatList;
let hasFlashList = false;
try {
  const flashListModule = require('@shopify/flash-list');
  if (flashListModule?.FlashList) {
    ListComponent = flashListModule.FlashList;
    hasFlashList = true;
  }
} catch {
  // FlashList unavailable -- use FlatList
}

export function MessageList({ messages, isStreaming }: MessageListProps) {
  const { isAtBottom, showPill, scrollToBottom, onScroll, listRef } =
    useScrollToBottom(messages.length > 0);
  const prevMessageCount = useRef(messages.length);

  // Auto-scroll to bottom when new messages arrive (if user is at bottom)
  useEffect(() => {
    if (messages.length > prevMessageCount.current && isAtBottom) {
      // Small delay to let layout settle before scrolling
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }
    prevMessageCount.current = messages.length;
  }, [messages.length, isAtBottom, scrollToBottom]);

  // During streaming, continuously scroll if at bottom
  useEffect(() => {
    if (isStreaming && isAtBottom) {
      const interval = setInterval(() => {
        scrollToBottom();
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isStreaming, isAtBottom, scrollToBottom]);

  const renderItem = useCallback(
    ({ item, index }: { item: DisplayMessage; index: number }) => {
      const previousRole = index > 0 ? messages[index - 1].role : null;
      const isFirstInGroup = index === 0 || messages[index - 1].role !== item.role;
      return (
        <MessageBubble
          message={item}
          isLastMessage={index === messages.length - 1}
          previousRole={previousRole}
          isFirstInGroup={isFirstInGroup}
        />
      );
    },
    [messages],
  );

  const keyExtractor = useCallback((item: DisplayMessage) => item.id, []);

  return (
    <View style={styles.container}>
      <ListComponent
        ref={listRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        // FlashList v2 uses estimatedItemSize; FlatList ignores it
        {...(hasFlashList ? { estimatedItemSize: 80 } : {})}
      />
      <StreamingIndicator isStreaming={isStreaming} />
      <ScrollToBottomPill visible={showPill} onPress={scrollToBottom} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  contentContainer: {
    paddingTop: 16,
    paddingBottom: 16,
  },
});
