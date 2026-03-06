/**
 * SessionList -- scrollable session list with date grouping.
 *
 * Subscribes to timeline store sessions array via selector (once).
 * Groups sessions via groupSessionsByDate. Maps groups to DateGroupHeader
 * + SessionItem children. Shows SessionListSkeleton when loading.
 *
 * SessionItem receives data as props (NOT subscribing per-item to store).
 * Anti-pattern avoidance per RESEARCH.md.
 *
 * Constitution: Named export (2.2), selector-only store access (4.2),
 * 200-line limit (2.4), cn() for classes (3.6).
 */

import { useState, useCallback, type MouseEvent } from 'react';
import { cn } from '@/utils/cn';
import { useTimelineStore } from '@/stores/timeline';
import { useSessionList } from '@/hooks/useSessionList';
import { groupSessionsByDate } from '@/lib/formatTime';
import { apiFetch } from '@/lib/api-client';
import { useProjectContext } from '@/hooks/useProjectContext';
import { DateGroupHeader } from './DateGroupHeader';
import { SessionItem } from './SessionItem';
import { SessionContextMenu } from './SessionContextMenu';
import { SessionListSkeleton } from './SessionListSkeleton';
import { NewChatButton } from './NewChatButton';

interface ContextMenuState {
  isOpen: boolean;
  position: { x: number; y: number };
  sessionId: string | null;
}

export function SessionList() {
  const sessions = useTimelineStore((s) => s.sessions);
  const activeSessionId = useTimelineStore((s) => s.activeSessionId);
  const setActiveSession = useTimelineStore((s) => s.setActiveSession);
  const removeSession = useTimelineStore((s) => s.removeSession);
  const { isLoading, error } = useSessionList();
  const { projectName } = useProjectContext();

  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isOpen: false,
    position: { x: 0, y: 0 },
    sessionId: null,
  });

  const handleSessionClick = useCallback(
    (sessionId: string) => {
      setActiveSession(sessionId);
    },
    [setActiveSession],
  );

  const handleContextMenu = useCallback(
    (e: MouseEvent<HTMLDivElement>, sessionId: string) => {
      e.preventDefault();
      setContextMenu({
        isOpen: true,
        position: { x: e.clientX, y: e.clientY },
        sessionId,
      });
    },
    [],
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, isOpen: false, sessionId: null }));
  }, []);

  const handleRename = useCallback(() => {
    // Rename will be implemented with an inline editor in a future plan
    closeContextMenu();
  }, [closeContextMenu]);

  const handleDelete = useCallback(async () => {
    const sessionId = contextMenu.sessionId;
    if (!sessionId || !projectName) {
      closeContextMenu();
      return;
    }

    try {
      await apiFetch(
        `/api/projects/${encodeURIComponent(projectName)}/sessions/${sessionId}`,
        { method: 'DELETE' },
      );
      removeSession(sessionId);
    } catch (err) {
      console.error('Failed to delete session:', err);
    }

    closeContextMenu();
  }, [contextMenu.sessionId, projectName, removeSession, closeContextMenu]);

  if (isLoading) {
    return <SessionListSkeleton />;
  }

  if (error) {
    return (
      <div className="px-3 py-4 text-center text-[length:0.75rem] text-destructive">
        Failed to load sessions
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 px-4 py-8">
        <p className="text-muted text-[length:var(--text-body)] mb-3">
          No conversations yet
        </p>
        <NewChatButton />
      </div>
    );
  }

  const groups = groupSessionsByDate(sessions);

  return (
    <>
      <div
        className={cn('flex-1 overflow-y-auto')}
        role="listbox"
        aria-label="Chat sessions list"
      >
        {groups.map((group) => (
          <div key={group.label}>
            <DateGroupHeader label={group.label} />
            {group.sessions.map((session) => (
              <SessionItem
                key={session.id}
                id={session.id}
                title={session.title}
                updatedAt={session.updatedAt}
                providerId={session.providerId}
                isActive={session.id === activeSessionId}
                onClick={() => handleSessionClick(session.id)}
                onContextMenu={(e) => handleContextMenu(e, session.id)}
              />
            ))}
          </div>
        ))}
      </div>

      <SessionContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onRename={handleRename}
        onDelete={() => void handleDelete()}
        onClose={closeContextMenu}
      />
    </>
  );
}
