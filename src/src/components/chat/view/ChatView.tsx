/**
 * ChatView -- main chat content area replacing ChatPlaceholder.
 *
 * Reads sessionId from URL params, coordinates session loading via
 * useSessionSwitch, and renders the appropriate state:
 * - No session: ChatEmptyState + ChatComposer
 * - Loading: MessageListSkeleton + ChatComposer
 * - Loaded: MessageList + ChatComposer
 *
 * URL sync on mount/param change handles direct navigation, browser
 * back/forward, and sidebar clicks.
 *
 * Constitution: Named exports (2.2), selector-only store access (4.2).
 */

import { useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useProjectContext } from '@/hooks/useProjectContext';
import { useSessionSwitch } from '@/hooks/useSessionSwitch';
import { useTimelineStore } from '@/stores/timeline';
import { ChatEmptyState } from '@/components/chat/view/ChatEmptyState';
import { MessageList } from '@/components/chat/view/MessageList';
import { MessageListSkeleton } from '@/components/chat/view/MessageListSkeleton';
import { ChatComposer } from '@/components/chat/composer/ChatComposer';
import type { Message } from '@/types/message';

/** Module-level constant for Zustand selector reference stability (v5 pattern) */
const EMPTY_MESSAGES: Message[] = [];

export function ChatView() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { projectName } = useProjectContext();
  const { switchSession, isLoadingMessages } = useSessionSwitch();

  const activeSessionId = useTimelineStore((state) => state.activeSessionId);
  const messages = useTimelineStore((state) => {
    if (!state.activeSessionId) return EMPTY_MESSAGES;
    const session = state.sessions.find((s) => s.id === state.activeSessionId);
    return session?.messages ?? EMPTY_MESSAGES;
  });
  // URL sync: when sessionId param changes (direct nav, back/forward, sidebar click).
  // Skip stub sessions — they are optimistic placeholders that will be reconciled
  // to real session IDs by onSessionCreated in websocket-init.ts.
  useEffect(() => {
    if (sessionId && sessionId !== activeSessionId && projectName && !sessionId.startsWith('stub-')) {
      switchSession(projectName, sessionId);
    }
  }, [sessionId, activeSessionId, projectName, switchSession]);

  // Stream finalization callback -- no-op since the finalized message is already
  // in the store via ActiveMessage's handleFlush. The streaming state is managed
  // by the stream store's endStream action (called from websocket-init).
  const handleStreamFinalized = useCallback(() => {
    // Message already added to store by ActiveMessage.handleFlush
  }, []);

  // Determine content state.
  // Prefer activeSessionId over stub session IDs from URL — stubs are optimistic
  // placeholders that get reconciled to real IDs by onSessionCreated.
  const hasSession = Boolean(sessionId || activeSessionId);
  const effectiveSessionId = (sessionId?.startsWith('stub-') ? activeSessionId : sessionId) ?? activeSessionId;

  return (
    <div className="flex h-full flex-col" data-testid="chat-view">
      {!hasSession ? (
        // No session selected -- show empty state
        <ChatEmptyState />
      ) : isLoadingMessages && messages.length === 0 ? (
        // Loading messages -- show skeleton
        <MessageListSkeleton />
      ) : (
        // Messages loaded (or streaming into empty session)
        <MessageList
          messages={messages}
          sessionId={effectiveSessionId ?? ''}
          onStreamFinalized={handleStreamFinalized}
        />
      )}
      <ChatComposer
        projectName={projectName}
        sessionId={effectiveSessionId ?? null}
      />
    </div>
  );
}
