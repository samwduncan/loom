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
import { useSessionSwitch } from '@/hooks/useSessionSwitch';
import { useMessageSearch } from '@/hooks/useMessageSearch';
import { useTimelineStore } from '@/stores/timeline';
import { useUIStore } from '@/stores/ui';
import { useNavigateAwayGuard } from '@/hooks/useNavigateAwayGuard';
import { ChatEmptyState } from '@/components/chat/view/ChatEmptyState';
import { MessageList } from '@/components/chat/view/MessageList';
import { MessageListSkeleton } from '@/components/chat/view/MessageListSkeleton';
import { ChatComposer } from '@/components/chat/composer/ChatComposer';
import { PermissionBanner } from '@/components/chat/tools/PermissionBanner';
import { SearchBar } from '@/components/chat/view/SearchBar';
import { StatusLine } from '@/components/chat/view/StatusLine';
import { exportAsMarkdown, exportAsJSON } from '@/lib/export-conversation';
import { cn } from '@/utils/cn';
import type { Message } from '@/types/message';

/** Module-level constant for Zustand selector reference stability (v5 pattern) */
const EMPTY_MESSAGES: Message[] = [];

export function ChatView() {
  useNavigateAwayGuard();
  const { sessionId } = useParams<{ sessionId: string }>();
  const { projectName } = useProjectContext();
  const { switchSession, isLoadingMessages } = useSessionSwitch();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const search = useMessageSearch();
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

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


  // Determine content state.
  const hasSession = Boolean(sessionId || activeSessionId);
  const effectiveSessionId = (sessionId?.startsWith('stub-') ? activeSessionId : sessionId) ?? activeSessionId;

  // Session title for export (selector-only store access per 4.2)
  const sessionTitle = useTimelineStore((state) => {
    if (!displaySessionId) return 'Conversation';
    const session = state.sessions.find((s) => s.id === displaySessionId);
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

  // Suggestion chip handler: sets composer input text via state
  const [suggestionText, setSuggestionText] = useState<string | null>(null);
  const handleSuggestionClick = useCallback((text: string) => {
    setSuggestionText(text);
    // Clear after a tick so re-clicking same chip works
    requestAnimationFrame(() => setSuggestionText(null));
  }, []);

  return (
    <div
      className={cn(
        'relative grid h-full',
        search.isOpen
          ? 'grid-rows-[auto_1fr_auto_auto_auto]'
          : 'grid-rows-[1fr_auto_auto_auto]',
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
              'rounded-md p-1.5',
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
              'rounded-md p-1.5',
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
                'rounded-md p-1.5',
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
                  className="w-full px-3 py-1.5 text-left text-sm text-foreground hover:bg-[color-mix(in_oklch,var(--text-muted)_10%,transparent)]"
                >
                  Export as Markdown
                </button>
                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="w-full px-3 py-1.5 text-left text-sm text-foreground hover:bg-[color-mix(in_oklch,var(--text-muted)_10%,transparent)]"
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
      ) : (
        // Messages loaded (or streaming into empty session)
        <MessageList
          messages={displayMessages}
          sessionId={effectiveSessionId ?? ''}
          scrollContainerRef={scrollContainerRef}
          searchQuery={search.debouncedQuery}
          highlightText={search.highlightText}
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
