/**
 * SessionList -- multi-project session list with search, pins, and bulk selection.
 * Consumes useMultiProjectSessions for project > date > session rendering.
 * Wires useSessionSearch, useSessionPins, and useSessionSelection hooks.
 * Constitution: Named export (2.2), selector-only store access (4.2), cn() (3.6).
 */

import { useState, useCallback, useEffect, useRef, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { MessageSquare, Search } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useTimelineStore } from '@/stores/timeline';
import { useStreamStore } from '@/stores/stream';
import { useSessionList } from '@/hooks/useSessionList';
import { useMultiProjectSessions } from '@/hooks/useMultiProjectSessions';
import { useSessionSearch } from '@/hooks/useSessionSearch';
import { useSessionPins } from '@/hooks/useSessionPins';
import { hoistPinnedSessions } from '@/lib/sessionGrouping';
import { useSessionSelection } from '@/hooks/useSessionSelection';
import { apiFetch } from '@/lib/api-client';
import { useProjectContext } from '@/hooks/useProjectContext';
import { EmptyState } from '@/components/shared/EmptyState';
import { InlineError } from '@/components/shared/InlineError';
import { ProjectHeader } from './ProjectHeader';
import { DateGroupHeader } from './DateGroupHeader';
import { SessionItem } from './SessionItem';
import { SessionContextMenu } from './SessionContextMenu';
import { SessionListSkeleton } from './SessionListSkeleton';
import { NewChatButton } from './NewChatButton';
import { DeleteSessionDialog } from './DeleteSessionDialog';
import { SearchInput } from './SearchInput';
import { BulkActionBar } from './BulkActionBar';
import { DRAFTS_CHANGED_EVENT } from '@/components/chat/composer/useDraftPersistence';

const DRAFTS_STORAGE_KEY = 'loom-composer-drafts';

function readDraftSessionIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DRAFTS_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return new Set();
    return new Set(Object.keys(parsed));
  } catch { return new Set(); }
}

export function SessionList() {
  const navigate = useNavigate();
  const activeSessionId = useTimelineStore((s) => s.activeSessionId);
  const sessions = useTimelineStore((s) => s.sessions);
  const removeSession = useTimelineStore((s) => s.removeSession);
  const addSession = useTimelineStore((s) => s.addSession);
  const updateSessionTitle = useTimelineStore((s) => s.updateSessionTitle);
  const streamingSessionId = useStreamStore((s) => s.isStreaming ? s.activeSessionId : null);
  const liveAttachedSessions = useStreamStore((s) => s.liveAttachedSessions);
  const notifiedSessions = useStreamStore((s) => s.notifiedSessions);
  const clearNotifiedSession = useStreamStore((s) => s.clearNotifiedSession);
  const { projectName } = useProjectContext();

  useSessionList(); // Populates timeline store (needed by ChatView)

  const {
    projectGroups: rawGroups, isLoading: multiLoading, error: multiError,
    expandedProjects, toggleProject, refetch,
  } = useMultiProjectSessions();

  const { query, setQuery, filterGroups } = useSessionSearch();
  const { pinnedIds, togglePin, isPinned } = useSessionPins();
  const selection = useSessionSelection();

  // Apply pin hoisting then search filtering
  const hoisted = hoistPinnedSessions(rawGroups, pinnedIds);
  const projectGroups = filterGroups(hoisted);

  const isSearching = query.trim().length > 0;

  const scrollRef = useRef<HTMLDivElement>(null);
  const handleProjectToggle = useCallback((name: string) => {
    const scrollTop = scrollRef.current?.scrollTop ?? 0;
    toggleProject(name);
    requestAnimationFrame(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollTop; });
  }, [toggleProject]);

  const [draftSessionIds, setDraftSessionIds] = useState<Set<string>>(readDraftSessionIds);
  useEffect(() => {
    const refresh = () => setDraftSessionIds(readDraftSessionIds());
    const onStorage = (e: StorageEvent) => { if (e.key === DRAFTS_STORAGE_KEY) refresh(); };
    window.addEventListener(DRAFTS_CHANGED_EVENT, refresh);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(DRAFTS_CHANGED_EVENT, refresh);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'single'; id: string } | { type: 'bulk' } | null>(null);
  const [contextMenu, setContextMenu] = useState({
    isOpen: false, position: { x: 0, y: 0 }, sessionId: null as string | null,
  });

  const handleSessionClick = useCallback(
    (sessionId: string) => {
      clearNotifiedSession(sessionId);
      navigate(`/chat/${sessionId}`);
    }, [navigate, clearNotifiedSession],
  );
  const handleContextMenu = useCallback((e: MouseEvent<HTMLDivElement>, sessionId: string) => {
    e.preventDefault();
    setContextMenu({ isOpen: true, position: { x: e.clientX, y: e.clientY }, sessionId });
  }, []);
  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, isOpen: false, sessionId: null }));
  }, []);
  const handleRename = useCallback(() => {
    const id = contextMenu.sessionId;
    closeContextMenu();
    if (id) setEditingSessionId(id);
  }, [contextMenu.sessionId, closeContextMenu]);

  // PERF-02: Rename is already optimistic -- updates title immediately, rolls back on API failure
  const handleSessionRename = useCallback(async (sessionId: string, newTitle: string) => {
    const previousTitle = sessions.find((s) => s.id === sessionId)?.title;
    updateSessionTitle(sessionId, newTitle);
    setEditingSessionId(null);
    try {
      await apiFetch(
        `/api/projects/${encodeURIComponent(projectName)}/sessions/${encodeURIComponent(sessionId)}`,
        { method: 'PATCH', body: JSON.stringify({ title: newTitle }) },
      );
    } catch {
      if (previousTitle !== undefined) updateSessionTitle(sessionId, previousTitle);
      toast.error('Failed to rename session');
    }
  }, [sessions, updateSessionTitle, projectName]);

  const handleDelete = useCallback(() => {
    const id = contextMenu.sessionId;
    closeContextMenu();
    if (id) setDeleteTarget({ type: 'single', id });
  }, [contextMenu.sessionId, closeContextMenu, setDeleteTarget]);

  // PERF-02: Pin is client-only (localStorage) -- already instant, no API call
  const handlePin = useCallback(() => {
    const id = contextMenu.sessionId;
    if (id) togglePin(id);
  }, [contextMenu.sessionId, togglePin]);

  const handleSelectFromMenu = useCallback(() => {
    const id = contextMenu.sessionId;
    if (id) selection.toggle(id);
  }, [contextMenu.sessionId, selection]);

  const handleBulkDeleteRequest = useCallback(() => {
    setDeleteTarget({ type: 'bulk' });
  }, [setDeleteTarget]);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'bulk') {
      // Bulk deletes wait for API -- complexity not worth optimistic handling
      await selection.bulkDelete(rawGroups, activeSessionId, navigate, removeSession);
      setDeleteTarget(null);
      return;
    }

    // Single delete -- optimistic: remove from UI immediately, rollback on failure
    const deleteSessionId = deleteTarget.id;
    if (!projectName) { setDeleteTarget(null); return; }

    // Capture full session object for rollback (messages may be empty from rehydration -- that's fine)
    const capturedSession = sessions.find((s) => s.id === deleteSessionId);
    const wasActive = deleteSessionId === activeSessionId;

    // Optimistic UI update: remove session immediately
    removeSession(deleteSessionId);
    setDeleteTarget(null);

    // Navigate away if this was the active session
    if (wasActive) {
      const remaining = sessions
        .filter((s) => s.id !== deleteSessionId)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      navigate(remaining.length > 0 ? `/chat/${remaining[0]!.id}` : '/chat'); // ASSERT: length check
    }

    // Fire API in background
    try {
      await apiFetch(
        `/api/projects/${encodeURIComponent(projectName)}/sessions/${encodeURIComponent(deleteSessionId)}`,
        { method: 'DELETE' },
      );
      // Success -- no action needed, UI already updated
    } catch (err) {
      console.error('Failed to delete session:', err);
      // Rollback: restore the session into the sidebar
      if (capturedSession) {
        addSession(capturedSession);
      }
      // Navigate back to the restored session if it was active
      if (wasActive && capturedSession) {
        navigate(`/chat/${capturedSession.id}`);
      }
      toast.error('Failed to delete session');
    }
  }, [deleteTarget, projectName, activeSessionId, sessions, removeSession, addSession, navigate, selection, rawGroups, setDeleteTarget]);

  const deleteCount = deleteTarget?.type === 'bulk' ? selection.selectedIds.size : 1;

  if (multiLoading) return <SessionListSkeleton />;
  if (multiError) {
    return <InlineError message="Failed to load sessions" onRetry={refetch} />;
  }

  const totalVisible = projectGroups.reduce((sum, p) => sum + p.visibleCount, 0);
  if (totalVisible === 0 && !isSearching) {
    return (
      <EmptyState
        icon={<MessageSquare className="size-8" />}
        heading="No conversations yet"
        description="Start a new conversation to get going"
        action={<NewChatButton />}
        className="flex-1"
      />
    );
  }

  return (
    <>
      <div className="px-2 py-1.5">
        <SearchInput value={query} onChange={setQuery} />
      </div>
      <div ref={scrollRef} className={cn('flex-1 overflow-y-auto')} role="listbox" aria-label="Chat sessions list">
        {totalVisible === 0 && isSearching && (
          <div className="px-3 py-4">
            <EmptyState
              icon={<Search className="size-8" />}
              heading="No matching sessions"
              description="Try different search terms"
            />
          </div>
        )}
        {projectGroups.map((project) => {
          // During active search, bypass collapsed state to show all matches
          const isExpanded = isSearching || expandedProjects.has(project.projectName);
          return (
            <div key={project.projectName}>
              <ProjectHeader
                displayName={project.displayName}
                sessionCount={project.visibleCount}
                isExpanded={isExpanded}
                onToggle={() => handleProjectToggle(project.projectName)}
                isCurrentProject={project.projectName === projectName}
              />
              {isExpanded && project.dateGroups.map((dateGroup) => (
                <div key={dateGroup.label}>
                  <DateGroupHeader label={dateGroup.label} />
                  {dateGroup.sessions.map((session) => (
                    <SessionItem
                      key={session.id}
                      id={session.id}
                      title={session.title}
                      updatedAt={session.updatedAt}
                      providerId={session.providerId}
                      isActive={session.id === activeSessionId}
                      isStreaming={session.id === streamingSessionId}
                      isLiveAttached={liveAttachedSessions.has(session.id)}
                      hasNewActivity={notifiedSessions.has(session.id)}
                      hasDraft={draftSessionIds.has(session.id)}
                      isEditing={editingSessionId === session.id}
                      searchQuery={isSearching ? query : undefined}
                      isPinned={isPinned(session.id)}
                      isSelecting={selection.isSelecting}
                      isSelected={selection.selectedIds.has(session.id)}
                      onToggleSelect={() => selection.toggle(session.id)}
                      onClick={() => handleSessionClick(session.id)}
                      onContextMenu={(e) => handleContextMenu(e, session.id)}
                      onRename={handleSessionRename}
                    />
                  ))}
                </div>
              ))}
            </div>
          );
        })}
      </div>
      {selection.isSelecting && selection.selectedIds.size > 0 && (
        <BulkActionBar
          count={selection.selectedIds.size}
          onDelete={handleBulkDeleteRequest}
          onCancel={selection.clear}
        />
      )}
      <SessionContextMenu
        isOpen={contextMenu.isOpen} position={contextMenu.position}
        onRename={handleRename} onDelete={handleDelete} onClose={closeContextMenu}
        onPin={handlePin}
        isPinned={contextMenu.sessionId ? isPinned(contextMenu.sessionId) : false}
        onSelect={handleSelectFromMenu}
      />
      <DeleteSessionDialog
        isOpen={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onConfirm={() => void confirmDelete()}
        count={deleteCount}
      />
    </>
  );
}
