/**
 * Chat screen route -- fully wired chat interface for a given session ID.
 *
 * Renders: ChatHeader + (EmptyChat | MessageList) + ScrollToBottomPill + Composer
 *
 * Data flow:
 * - Route params provide: id, projectName, projectPath (from createSession or handleSessionPress)
 * - useMessageList fetches persisted messages and merges live streaming content
 * - useScrollToBottom (AR fix #8: reuse existing hook) provides scroll pill logic
 * - useScrollPosition persists/restores scroll offset per session in MMKV (CHAT-07)
 *
 * KeyboardAvoidingView from react-native-keyboard-controller matches system curve.
 */

import { useEffect, useCallback, useState } from 'react';
import { View } from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { ChatHeader } from '../../../../components/navigation/ChatHeader';
import { MessageList } from '../../../../components/chat/MessageList';
import { Composer } from '../../../../components/chat/Composer';
import { EmptyChat } from '../../../../components/chat/EmptyChat';
import { ScrollToBottomPill } from '../../../../components/chat/ScrollToBottomPill';
import { useMessageList } from '../../../../hooks/useMessageList';
import { useScrollPosition } from '../../../../hooks/useScrollPosition';
import { useScrollToBottom } from '../../../../hooks/useScrollToBottom';
import { useStreamStore } from '../../../../stores/index';
import { createStyles } from '../../../../theme/createStyles';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ChatScreen() {
  const { id, projectName, projectPath } = useLocalSearchParams<{
    id: string;
    projectName?: string;
    projectPath?: string;
  }>();

  const sessionId = id ?? 'new';
  const resolvedProjectName = projectName ?? '';
  const resolvedProjectPath = projectPath ?? '';

  // Message data
  const { messages, isLoading, isStreaming, fetchMessages } = useMessageList();

  // Scroll-to-bottom detection (AR fix #8: reuse existing hook, do NOT reimplement)
  const {
    showPill,
    scrollToBottom,
    onScroll: scrollToBottomOnScroll,
    listRef,
  } = useScrollToBottom(messages.length > 0);

  // Scroll position persistence (CHAT-07, D-32)
  const { saveOffset, getOffset } = useScrollPosition();
  const [initialScrollOffset, setInitialScrollOffset] = useState(0);

  // Compose scroll handlers: both useScrollToBottom and useScrollPosition need to fire
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollToBottomOnScroll(event);
      saveOffset(sessionId, event.nativeEvent.contentOffset.y);
    },
    [scrollToBottomOnScroll, sessionId, saveOffset],
  );

  // -------------------------------------------------------------------------
  // On mount / session change: fetch messages, set active session, restore scroll
  // -------------------------------------------------------------------------

  useEffect(() => {
    // Set active session in stream store
    useStreamStore.getState().setActiveSessionId(sessionId);

    // Restore scroll offset
    const offset = getOffset(sessionId);
    setInitialScrollOffset(offset);

    // Fetch messages (skip for stub sessions -- no messages yet)
    if (!sessionId.startsWith('stub-') && resolvedProjectName) {
      fetchMessages(resolvedProjectName, sessionId);
    }
    // Run on mount and sessionId change (key={sessionId} on FlatList remounts MessageList)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Session title: "New Chat" for stub sessions, project name otherwise
  const title = sessionId.startsWith('stub-') || sessionId === 'new'
    ? 'New Chat'
    : resolvedProjectName || 'Chat';

  const showEmptyState = messages.length === 0 && !isLoading;

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={styles.container}
    >
      <ChatHeader title={title} />

      <View style={styles.content}>
        {showEmptyState ? (
          <EmptyChat />
        ) : (
          <MessageList
            messages={messages}
            isStreaming={isStreaming}
            sessionId={sessionId}
            onScroll={handleScroll}
            listRef={listRef}
            initialScrollOffset={initialScrollOffset}
          />
        )}

        {/* Scroll-to-bottom pill: visible when scrolled up during streaming */}
        <ScrollToBottomPill
          isVisible={showPill && isStreaming}
          onPress={scrollToBottom}
        />
      </View>

      <Composer
        sessionId={sessionId}
        projectPath={resolvedProjectPath}
        projectName={resolvedProjectName}
      />
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = createStyles((t) => ({
  container: {
    flex: 1,
    backgroundColor: t.colors.surface.base,
  },
  content: {
    flex: 1,
  },
}));
