/**
 * Chat screen route -- fully wired chat interface for a given session ID.
 *
 * Renders: Content area (EmptyChat | MessageList + ScrollToBottomPill) + ChatHeader + Composer
 *
 * CRITICAL RENDER ORDER: ChatHeader renders AFTER the content View in the DOM tree.
 * expo-blur requires BlurView to render after the dynamic content (FlatList) it blurs.
 * ChatHeader is absolutely positioned with zIndex 10 to visually stack on top.
 * The content View gets paddingTop: HEADER_HEIGHT so both EmptyChat and MessageList
 * are pushed below the glass header.
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { getWsClient, setCurrentViewingSessionId } from '../../../../lib/websocket-init';
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

  // Compute glass header height: safe area top + header row (56px)
  // Fallback 44 for pre-layout when insets haven't resolved yet
  const insets = useSafeAreaInsets();
  const HEADER_HEIGHT = (insets?.top ?? 44) + 56;

  // Model name for header indicator (D-12)
  const modelName = useStreamStore((s) => s.modelName);

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

  // Report viewed session to server for per-session push gating (D-01)
  // Server uses this to suppress push notifications for the session the user is viewing
  useEffect(() => {
    setCurrentViewingSessionId(sessionId);
    return () => setCurrentViewingSessionId(null);
  }, [sessionId]);

  // Session title: "New Chat" for stub sessions, project name otherwise
  const title = sessionId.startsWith('stub-') || sessionId === 'new'
    ? 'New Chat'
    : resolvedProjectName || 'Chat';

  // Suggestion chip handler: send message directly via WebSocket (same logic as Composer.handleSend)
  const handleSuggestionPress = useCallback(
    (text: string) => {
      const wsClient = getWsClient();
      if (!wsClient) return;

      const options: Record<string, unknown> = {
        projectPath: resolvedProjectPath,
        projectName: resolvedProjectName,
      };
      if (sessionId && !sessionId.startsWith('stub-')) {
        options.sessionId = sessionId;
      }

      wsClient.send({
        type: 'claude-command',
        command: text,
        options,
      });
    },
    [sessionId, resolvedProjectPath, resolvedProjectName],
  );

  const showEmptyState = messages.length === 0 && !isLoading;

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={styles.container}
    >
      {/* Content area -- rendered FIRST in DOM so BlurView header works.
          paddingTop offsets both EmptyChat and MessageList below glass header. */}
      <View style={[styles.content, { paddingTop: HEADER_HEIGHT }]}>
        {showEmptyState ? (
          <EmptyChat onSuggestionPress={handleSuggestionPress} />
        ) : (
          <MessageList
            messages={messages}
            isStreaming={isStreaming}
            sessionId={sessionId}
            onScroll={handleScroll}
            listRef={listRef}
            initialScrollOffset={initialScrollOffset}
            headerHeight={HEADER_HEIGHT}
          />
        )}

        {/* Scroll-to-bottom pill: visible when scrolled up during streaming */}
        <ScrollToBottomPill
          isVisible={showPill && isStreaming}
          onPress={scrollToBottom}
        />
      </View>

      {/* Glass header -- rendered AFTER content in DOM for BlurView blur correctness.
          Visually stacked on top via absolute positioning + zIndex. */}
      <ChatHeader title={title} modelName={modelName ?? ''} />

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
