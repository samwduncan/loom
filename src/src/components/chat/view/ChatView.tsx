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
import { Brain, Search, Download } from 'lucide-react';
import { useProjectContext } from '@/hooks/useProjectContext';
import { getSessionProject } from '@/lib/session-project-map';
import { useSessionSwitch } from '@/hooks/useSessionSwitch';
import { usePaginatedMessages } from '@/hooks/usePaginatedMessages';
import { useMessageSearch } from '@/hooks/useMessageSearch';
import { useTimelineStore } from '@/stores/timeline';
import { useUIStore } from '@/stores/ui';
import { useNavigateAwayGuard } from '@/hooks/useNavigateAwayGuard';
import { EmptyState } from '@/components/shared/EmptyState';
import { ChatEmptyState } from '@/components/chat/view/ChatEmptyState';
import { MessageList } from '@/components/chat/view/MessageList';
import { MessageListSkeleton } from '@/components/chat/view/MessageListSkeleton';
import { ChatComposer } from '@/components/chat/composer/ChatComposer';
import { PermissionBanner } from '@/components/chat/tools/PermissionBanner';
import { SearchBar } from '@/components/chat/view/SearchBar';
import { StatusLine } from '@/components/chat/view/StatusLine';
import { exportAsMarkdown, exportAsJSON } from '@/lib/export-conversation';
import { LiveAnnouncer } from '@/components/a11y/LiveAnnouncer';
import { useStreamAnnouncements } from '@/components/a11y/useStreamAnnouncements';
import { LiveSessionBanner } from '@/components/chat/view/LiveSessionBanner';
import { wsClient } from '@/lib/websocket-client';
import { useStreamStore } from '@/stores/stream';
import { cn } from '@/utils/cn';
import type { Message } from '@/types/message';

/** Module-level constant for Zustand selector reference stability (v5 pattern) */
const EMPTY_MESSAGES: Message[] = [];

export function ChatView() {
  useNavigateAwayGuard();
  const { sessionId } = useParams<{ sessionId: string }>();
  const { projectName: defaultProject } = useProjectContext();
  // Use session-specific project if available (cross-project support)
  const projectName = (sessionId && getSessionProject(sessionId)) || defaultProject;
  const paginationSessionId = (sessionId?.startsWith('stub-') ? null : sessionId) ?? null;
  const pagination = usePaginatedMessages(projectName, paginationSessionId);
  const { switchSession, isLoadingMessages } = useSessionSwitch(pagination.setInitialPaginationState);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const search = useMessageSearch();
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const activeSessionId = useTimelineStore((state) => state.activeSessionId);
  const thinkingExpanded = useUIStore((state) => state.thinkingExpanded);
  const toggleThinking = useUIStore((state) => state.toggleThinking);
  // Use URL sessionId as the source of truth for which messages to display.
  // Falls back to activeSessionId for streaming-created sessions (no URL yet)
  // or when the URL still has a stub- ID after session reconciliation
  // (replaceState doesn't trigger useParams update until next React render).
  const effectiveSessionId = (sessionId?.startsWith('stub-') ? activeSessionId : sessionId) ?? activeSessionId;
  const messages = useTimelineStore((state) => {
    if (!effectiveSessionId) return EMPTY_MESSAGES;
    const session = state.sessions.find((s) => s.id === effectiveSessionId);
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

  // Live session attach state
  const isLiveAttached = useStreamStore((s) =>
    sessionId ? s.liveAttachedSessions.has(sessionId) : false,
  );
  const detachLiveSession = useStreamStore((s) => s.detachLiveSession);
  const sessionUpdatedAt = useTimelineStore((state) => {
    if (!sessionId) return null;
    const session = state.sessions.find((s) => s.id === sessionId);
    return session?.updatedAt ?? null;
  });

  // Auto-attach to live sessions: if session's last activity is within 5 minutes, attempt attach.
  // Runs once per sessionId (not on isLiveAttached changes). Cleanup auto-detaches.
  // Track whether we sent attach so cleanup knows to detach.
  const didAttachRef = useRef(false);

  useEffect(() => {
    didAttachRef.current = false;
    if (!sessionId || !projectName || sessionId.startsWith('stub-')) return;

    // Don't auto-attach if already attached
    if (isLiveAttached) return;

    // Check if session appears "active" based on recent updatedAt
    if (!sessionUpdatedAt) return;

    const lastActivity = new Date(sessionUpdatedAt).getTime();
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

    if (lastActivity > fiveMinutesAgo) {
      wsClient.send({
        type: 'attach-session',
        sessionId,
        projectName,
      });
      didAttachRef.current = true;
    }

    // Auto-detach when navigating away from this session
    return () => {
      if (didAttachRef.current) {
        wsClient.send({ type: 'detach-session', sessionId });
        detachLiveSession(sessionId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally runs once per sessionId, not on isLiveAttached changes
  }, [sessionId, projectName]);

  // Determine content state.
  const hasSession = Boolean(sessionId || activeSessionId);

  // Session title for export (selector-only store access per 4.2)
  const sessionTitle = useTimelineStore((state) => {
    if (!effectiveSessionId) return 'Conversation';
    const session = state.sessions.find((s) => s.id === effectiveSessionId);
    return session?.title || 'Conversation';
  });

  // Keyboard shortcut: Cmd+F / Ctrl+F opens search.
  const { open: searchOpen, isOpen: searchIsOpen } = search;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        if (!searchIsOpen) {
          searchOpen();
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen, searchIsOpen]);

  // Close export dropdown on outside click
  useEffect(() => {
    if (!exportOpen) return;
    function handleClick(e: MouseEvent) {
      // ASSERT: MouseEvent.target is always a Node in DOM event handlers
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [exportOpen]);

  // Export handlers
  const handleExportMarkdown = useCallback(() => {
    exportAsMarkdown(messages, sessionTitle);
    setExportOpen(false);
  }, [messages, sessionTitle]);

  const handleExportJSON = useCallback(() => {
    exportAsJSON(messages, sessionTitle);
    setExportOpen(false);
  }, [messages, sessionTitle]);

  // Search: filter messages when search is active
  const displayMessages = search.isOpen ? search.filterMessages(messages) : messages;

  // Screen reader announcements for streaming and tool events
  const announcement = useStreamAnnouncements();

  // Suggestion chip handler: sets composer input text via state
  const [suggestionText, setSuggestionText] = useState<string | null>(null);
  const handleSuggestionClick = useCallback((text: string) => {
    setSuggestionText(text);
    // Clear after a tick so re-clicking same chip works
    requestAnimationFrame(() => setSuggestionText(null));
  }, []);

  return (
    <>
    <LiveAnnouncer message={announcement} />
    <div
      className={cn(
        'relative grid h-full',
        search.isOpen
          ? 'grid-rows-[auto_1fr_auto_auto_auto_auto]'
          : 'grid-rows-[1fr_auto_auto_auto_auto]',
      )}
      data-testid="chat-view"
    >
      {/* Header controls -- thinking toggle, search, export */}
      {hasSession && (
        <div className="absolute right-3 top-2 z-[var(--z-dropdown)] flex items-center gap-1">
          <button
            type="button"
            onClick={toggleThinking}
            className={cn(
              'rounded-md p-3 md:p-1.5',
              'min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0',
              'transition-colors duration-150',
              'hover:bg-[color-mix(in_oklch,var(--text-muted)_10%,transparent)]',
              thinkingExpanded ? 'text-foreground' : 'text-muted',
            )}
            title={thinkingExpanded ? 'Collapse all thinking' : 'Expand all thinking'}
            data-testid="thinking-toggle"
          >
            <Brain className="size-4" />
          </button>
          <button
            type="button"
            onClick={search.toggle}
            className={cn(
              'rounded-md p-3 md:p-1.5',
              'min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0',
              'transition-colors duration-150',
              'hover:bg-[color-mix(in_oklch,var(--text-muted)_10%,transparent)]',
              search.isOpen ? 'text-foreground' : 'text-muted',
            )}
            title="Search messages (Cmd+F)"
            data-testid="search-toggle"
          >
            <Search className="size-4" />
          </button>
          <div ref={exportRef} className="relative">
            <button
              type="button"
              onClick={() => setExportOpen((p) => !p)}
              className={cn(
                'rounded-md p-3 md:p-1.5',
                'min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0',
                'transition-colors duration-150',
                'hover:bg-[color-mix(in_oklch,var(--text-muted)_10%,transparent)]',
                'text-muted',
              )}
              title="Export conversation"
              data-testid="export-toggle"
            >
              <Download className="size-4" />
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-full mt-1 min-w-[160px] rounded-md border border-border bg-surface-overlay py-1 shadow-lg">
                <button
                  type="button"
                  onClick={handleExportMarkdown}
                  className="w-full px-3 py-3 md:py-1.5 text-left text-sm text-foreground hover:bg-[color-mix(in_oklch,var(--text-muted)_10%,transparent)]"
                >
                  Export as Markdown
                </button>
                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="w-full px-3 py-3 md:py-1.5 text-left text-sm text-foreground hover:bg-[color-mix(in_oklch,var(--text-muted)_10%,transparent)]"
                >
                  Export as JSON
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Search bar -- slides in between header and messages */}
      {search.isOpen && (
        <SearchBar
          query={search.query}
          onQueryChange={search.setQuery}
          onClose={search.close}
          resultCount={displayMessages.length}
        />
      )}
      {!hasSession ? (
        // No session selected -- show empty state with suggestion chips
        <ChatEmptyState onSuggestionClick={handleSuggestionClick} />
      ) : isLoadingMessages && messages.length === 0 ? (
        // Loading messages -- show skeleton
        <MessageListSkeleton />
      ) : search.isOpen && search.debouncedQuery && displayMessages.length === 0 ? (
        // Search active with no matching messages (only when session exists)
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon={<Search className="size-8" />}
            heading="No matching messages"
            description="Try different search terms"
          />
        </div>
      ) : (
        // Messages loaded (or streaming into empty session)
        <MessageList
          messages={displayMessages}
          sessionId={effectiveSessionId ?? ''}
          scrollContainerRef={scrollContainerRef}
          searchQuery={search.debouncedQuery}
          highlightText={search.debouncedQuery ? search.highlightText : undefined}
          hasMore={pagination.hasMore}
          isFetchingMore={pagination.isFetchingMore}
          onLoadMore={pagination.loadMore}
        />
      )}
      {sessionId && <LiveSessionBanner sessionId={sessionId} />}
      <StatusLine />
      <PermissionBanner sessionId={effectiveSessionId ?? null} />
      <ChatComposer
        projectName={projectName}
        sessionId={effectiveSessionId ?? null}
        scrollContainerRef={scrollContainerRef}
        suggestionText={suggestionText}
      />
    </div>
    </>
  );
}
