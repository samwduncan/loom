/**
 * SessionGroup -- Fuzzy-searched session list for the command palette.
 *
 * Renders sessions filtered by useCommandSearch. Selecting a session switches
 * to the Chat tab and navigates to that session.
 *
 * Constitution: Named export (2.2), selector-only store access (4.2).
 */

import { Command } from 'cmdk';
import { MessageSquare } from 'lucide-react';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CommandPaletteItem } from '../CommandPaletteItem';
import { useUIStore } from '@/stores/ui';
import { useTimelineStore } from '@/stores/timeline';
import type { Session } from '@/types/session';

export interface SessionGroupProps {
  sessions: Session[];
  onClose: () => void;
  addRecent: (entry: { id: string; label: string; group: string }) => void;
}

export const SessionGroup = function SessionGroup({ sessions, onClose, addRecent }: SessionGroupProps) {
  const navigate = useNavigate();
  const setActiveTab = useUIStore((s) => s.setActiveTab);
  const setActiveSession = useTimelineStore((s) => s.setActiveSession);

  const handleSelect = useCallback((session: Session) => {
    setActiveTab('chat');
    setActiveSession(session.id);
    navigate('/chat/' + session.id);
    addRecent({ id: 'session-' + session.id, label: session.title, group: 'Sessions' });
    onClose();
  }, [setActiveTab, setActiveSession, navigate, onClose, addRecent]);

  if (sessions.length === 0) return null;

  return (
    <Command.Group heading="Sessions">
      {sessions.map((session) => (
        <CommandPaletteItem
          key={session.id}
          icon={<MessageSquare size={16} />}
          label={session.title}
          onSelect={() => handleSelect(session)}
        />
      ))}
    </Command.Group>
  );
};
