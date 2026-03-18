/**
 * SessionList -- multi-project session list with collapsible project groups.
 * Consumes useMultiProjectSessions for project > date > session rendering.
 * Constitution: Named export (2.2), selector-only store access (4.2), cn() (3.6).
 */

import { useState, useCallback, useEffect, useRef, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';
import { useTimelineStore } from '@/stores/timeline';
import { useStreamStore } from '@/stores/stream';
import { useSessionList } from '@/hooks/useSessionList';
import { useMultiProjectSessions } from '@/hooks/useMultiProjectSessions';
import { apiFetch } from '@/lib/api-client';
import { useProjectContext } from '@/hooks/useProjectContext';
import { ProjectHeader } from './ProjectHeader';
import { DateGroupHeader } from './DateGroupHeader';
import { SessionItem } from './SessionItem';
import { SessionContextMenu } from './SessionContextMenu';
import { SessionListSkeleton } from './SessionListSkeleton';
import { NewChatButton } from './NewChatButton';
import { DeleteSessionDialog } from './DeleteSessionDialog';
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
  const updateSessionTitle = useTimelineStore((s) => s.updateSessionTitle);
  const streamingSessionId = useStreamStore((s) => s.isStreaming ? s.activeSessionId : null);
  const { projectName } = useProjectContext();

  useSessionList(); // Populates timeline store (needed by ChatView)

  const {
    projectGroups, isLoading: multiLoading, error: multiError,
    expandedProjects, toggleProject,
  } = useMultiProjectSessions();

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
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState({
    isOpen: false, position: { x: 0, y: 0 }, sessionId: null as string | null,
  });

  const handleSessionClick = useCallback(
    (sessionId: string) => { navigate(`/chat/${sessionId}`); }, [navigate],
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
    if (id) setDeleteSessionId(id);
  }, [contextMenu.sessionId, closeContextMenu]);

  const confirmDelete = useCallback(async () => {
    if (!deleteSessionId || !projectName) { setDeleteSessionId(null); return; }
    const wasActive = deleteSessionId === activeSessionId;
    try {
      await apiFetch(
        `/api/projects/${encodeURIComponent(projectName)}/sessions/${deleteSessionId}`,
        { method: 'DELETE' },
      );
      removeSession(deleteSessionId);
      if (wasActive) {
        const remaining = sessions
          .filter((s) => s.id !== deleteSessionId)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        navigate(remaining.length > 0 ? `/chat/${remaining[0]!.id}` : '/chat'); // ASSERT: length check
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
      toast.error('Failed to delete session');
    }
    setDeleteSessionId(null);
  }, [deleteSessionId, projectName, activeSessionId, sessions, removeSession, navigate]);

  if (multiLoading) return <SessionListSkeleton />;
  if (multiError) {
    return (
      <div className="px-3 py-4 text-center text-[length:0.75rem] text-destructive">
        Failed to load sessions
      </div>
    );
  }

  const totalVisible = projectGroups.reduce((sum, p) => sum + p.visibleCount, 0);
  if (totalVisible === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 px-4 py-8">
        <p className="text-muted text-[length:var(--text-body)] mb-3">No conversations yet</p>
        <NewChatButton />
      </div>
    );
  }

  return (
    <>
      <div ref={scrollRef} className={cn('flex-1 overflow-y-auto')} role="listbox" aria-label="Chat sessions list">
        {projectGroups.map((project) => (
          <div key={project.projectName}>
            <ProjectHeader
              displayName={project.displayName}
              sessionCount={project.visibleCount}
              isExpanded={expandedProjects.has(project.projectName)}
              onToggle={() => handleProjectToggle(project.projectName)}
              isCurrentProject={project.projectName === projectName}
            />
            {expandedProjects.has(project.projectName) && project.dateGroups.map((dateGroup) => (
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
                    hasDraft={draftSessionIds.has(session.id)}
                    isEditing={editingSessionId === session.id}
                    onClick={() => handleSessionClick(session.id)}
                    onContextMenu={(e) => handleContextMenu(e, session.id)}
                    onRename={handleSessionRename}
                  />
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
      <SessionContextMenu
        isOpen={contextMenu.isOpen} position={contextMenu.position}
        onRename={handleRename} onDelete={handleDelete} onClose={closeContextMenu}
      />
      <DeleteSessionDialog
        isOpen={deleteSessionId !== null}
        onOpenChange={(open) => { if (!open) setDeleteSessionId(null); }}
        onConfirm={() => void confirmDelete()}
      />
    </>
  );
}
