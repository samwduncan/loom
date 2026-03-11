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

import { useState, useCallback, useEffect, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';
import { useTimelineStore } from '@/stores/timeline';
import { useSessionList } from '@/hooks/useSessionList';
import { groupSessionsByDate } from '@/lib/formatTime';
import { apiFetch } from '@/lib/api-client';
import { useProjectContext } from '@/hooks/useProjectContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DateGroupHeader } from './DateGroupHeader';
import { SessionItem } from './SessionItem';
import { SessionContextMenu } from './SessionContextMenu';
import { SessionListSkeleton } from './SessionListSkeleton';
import { NewChatButton } from './NewChatButton';
import { DRAFTS_CHANGED_EVENT } from '@/components/chat/composer/useDraftPersistence';

const DRAFTS_STORAGE_KEY = 'loom-composer-drafts';

function readDraftSessionIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DRAFTS_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return new Set();
    return new Set(Object.keys(parsed));
  } catch {
    return new Set();
  }
}

interface ContextMenuState {
  isOpen: boolean;
  position: { x: number; y: number };
  sessionId: string | null;
}

export function SessionList() {
  const navigate = useNavigate();
  const sessions = useTimelineStore((s) => s.sessions);
  const activeSessionId = useTimelineStore((s) => s.activeSessionId);
  const removeSession = useTimelineStore((s) => s.removeSession);
  const updateSessionTitle = useTimelineStore((s) => s.updateSessionTitle);
  const { isLoading, error } = useSessionList();
  const { projectName } = useProjectContext();

  // Draft indicator: read localStorage for sessions with drafts
  const [draftSessionIds, setDraftSessionIds] = useState<Set<string>>(readDraftSessionIds);

  useEffect(() => {
    const refresh = () => setDraftSessionIds(readDraftSessionIds());
    const onStorage = (e: StorageEvent) => {
      if (e.key === DRAFTS_STORAGE_KEY) refresh();
    };
    // Same-tab updates via custom event
    window.addEventListener(DRAFTS_CHANGED_EVENT, refresh);
    // Cross-tab updates via storage event
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(DRAFTS_CHANGED_EVENT, refresh);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);

  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isOpen: false,
    position: { x: 0, y: 0 },
    sessionId: null,
  });

  const handleSessionClick = useCallback(
    (sessionId: string) => {
      navigate(`/chat/${sessionId}`);
    },
    [navigate],
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
    const sessionId = contextMenu.sessionId;
    closeContextMenu();
    if (sessionId) {
      setEditingSessionId(sessionId);
    }
  }, [contextMenu.sessionId, closeContextMenu]);

  const handleSessionRename = useCallback(
    (sessionId: string, newTitle: string) => {
      updateSessionTitle(sessionId, newTitle);
      setEditingSessionId(null);
    },
    [updateSessionTitle],
  );

  const handleDelete = useCallback(() => {
    const sessionId = contextMenu.sessionId;
    closeContextMenu();
    if (sessionId) {
      setDeleteSessionId(sessionId);
    }
  }, [contextMenu.sessionId, closeContextMenu]);

  const confirmDelete = useCallback(async () => {
    if (!deleteSessionId || !projectName) {
      setDeleteSessionId(null);
      return;
    }

    const wasActive = deleteSessionId === activeSessionId;

    try {
      await apiFetch(
        `/api/projects/${encodeURIComponent(projectName)}/sessions/${deleteSessionId}`,
        { method: 'DELETE' },
      );
      removeSession(deleteSessionId);

      if (wasActive) {
        // Find the most recent remaining session (excluding the deleted one)
        const remaining = sessions
          .filter((s) => s.id !== deleteSessionId)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

        if (remaining.length > 0) {
          navigate(`/chat/${remaining[0]!.id}`); // ASSERT: length check above guarantees [0] exists
        } else {
          navigate('/chat');
        }
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
      toast.error('Failed to delete session');
    }

    setDeleteSessionId(null);
  }, [deleteSessionId, projectName, activeSessionId, sessions, removeSession, navigate]);

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

      <SessionContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onRename={handleRename}
        onDelete={handleDelete}
        onClose={closeContextMenu}
      />

      <AlertDialog
        open={deleteSessionId !== null}
        onOpenChange={(open) => { if (!open) setDeleteSessionId(null); }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this session and all its messages. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => void confirmDelete()}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
