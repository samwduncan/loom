/**
 * ChatView -- main chat content area.
 *
 * Reads sessionId from URL params, coordinates session loading via
 * useSessionSwitch, and renders the appropriate state:
 * - No session: ChatEmptyState + ChatComposer
 * - Loading: MessageListSkeleton + ChatComposer
 * - Loaded: MessageList + ChatComposer
 *
 * Uses CSS Grid (1fr auto) for scroll-stable layout -- composer height
 * changes don't cause scroll position jumps.
 *
 * Constitution: Named exports (2.2), selector-only store access (4.2).
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Brain } from 'lucide-react';
import { useProjectContext } from '@/hooks/useProjectContext';
import { useSessionSwitch } from '@/hooks/useSessionSwitch';
import { useTimelineStore } from '@/stores/timeline';
import { useUIStore } from '@/stores/ui';
import { ChatEmptyState } from '@/components/chat/view/ChatEmptyState';
import { MessageList } from '@/components/chat/view/MessageList';
import { MessageListSkeleton } from '@/components/chat/view/MessageListSkeleton';
import { ChatComposer } from '@/components/chat/composer/ChatComposer';
import { PermissionBanner } from '@/components/chat/tools/PermissionBanner';
import { StatusLine } from '@/components/chat/view/StatusLine';
import { cn } from '@/utils/cn';
import type { Message } from '@/types/message';

/** Module-level constant for Zustand selector reference stability (v5 pattern) */
const EMPTY_MESSAGES: Message[] = [];

export function ChatView() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { projectName } = useProjectContext();
  const { switchSession, isLoadingMessages } = useSessionSwitch();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const activeSessionId = useTimelineStore((state) => state.activeSessionId);
  const thinkingExpanded = useUIStore((state) => state.thinkingExpanded);
  const toggleThinking = useUIStore((state) => state.toggleThinking);
  // Use URL sessionId as the source of truth for which messages to display.
  // Falls back to activeSessionId for streaming-created sessions (no URL yet).
  const displaySessionId = sessionId ?? activeSessionId;
  const messages = useTimelineStore((state) => {
    if (!displaySessionId) return EMPTY_MESSAGES;
    const session = state.sessions.find((s) => s.id === displaySessionId);
    return session?.messages ?? EMPTY_MESSAGES;
  });
  // URL sync: when sessionId param changes (direct nav, back/forward, sidebar click).
  // Skip stub sessions -- they are optimistic placeholders that will be reconciled
  // to real session IDs by onSessionCreated in websocket-init.ts.
  // Trigger fetch whenever URL points to a session with no loaded messages.
  useEffect(() => {
    if (sessionId && projectName && !sessionId.startsWith('stub-') && messages.length === 0) {
      switchSession(projectName, sessionId);
    }
  }, [sessionId, projectName, messages.length, switchSession]);

  // Stream finalization callback -- no-op since the finalized message is already
  // in the store via ActiveMessage's handleFlush.
  const handleStreamFinalized = useCallback(() => {
    // Message already added to store by ActiveMessage.handleFlush
  }, []);

  // Determine content state.
  const hasSession = Boolean(sessionId || activeSessionId);
  const effectiveSessionId = (sessionId?.startsWith('stub-') ? activeSessionId : sessionId) ?? activeSessionId;

  // Suggestion chip handler: sets composer input text via state
  const [suggestionText, setSuggestionText] = useState<string | null>(null);
  const handleSuggestionClick = useCallback((text: string) => {
    setSuggestionText(text);
    // Clear after a tick so re-clicking same chip works
    requestAnimationFrame(() => setSuggestionText(null));
  }, []);

  return (
    <div
      className="relative grid h-full grid-rows-[1fr_auto_auto_auto]"
      data-testid="chat-view"
    >
      {/* Thinking toggle — collapses/expands all thinking blocks globally */}
      {hasSession && (
        <button
          type="button"
          onClick={toggleThinking}
          className={cn(
            'absolute right-3 top-2 z-[var(--z-dropdown)] rounded-md p-1.5',
            'transition-colors duration-150',
            'hover:bg-[color-mix(in_oklch,var(--text-muted)_10%,transparent)]',
            thinkingExpanded ? 'text-foreground' : 'text-muted',
          )}
          title={thinkingExpanded ? 'Collapse all thinking' : 'Expand all thinking'}
          data-testid="thinking-toggle"
        >
          <Brain className="size-4" />
        </button>
      )}
      {!hasSession ? (
        // No session selected -- show empty state with suggestion chips
        <ChatEmptyState onSuggestionClick={handleSuggestionClick} />
      ) : isLoadingMessages && messages.length === 0 ? (
        // Loading messages -- show skeleton
        <MessageListSkeleton />
      ) : (
        // Messages loaded (or streaming into empty session)
        <MessageList
          messages={messages}
          sessionId={effectiveSessionId ?? ''}
          onStreamFinalized={handleStreamFinalized}
          scrollContainerRef={scrollContainerRef}
        />
      )}
      <StatusLine />
      <PermissionBanner sessionId={effectiveSessionId ?? null} />
      <ChatComposer
        projectName={projectName}
        sessionId={effectiveSessionId ?? null}
        scrollContainerRef={scrollContainerRef}
        suggestionText={suggestionText}
      />
    </div>
  );
}
