/**
 * RecentGroup -- Recent commands shown when search is empty.
 *
 * Maps recent entries back to appropriate icons based on group name.
 * Only renders when recents exist and search is empty (caller controls visibility).
 *
 * Constitution: Named export (2.2), token-based colors (3.1).
 */

import { Command } from 'cmdk';
import {
  MessageSquare,
  FolderTree,
  Terminal,
  GitBranch,
  Settings,
  Plus,
  Eye,
  PanelLeft,
  FileText,
  Slash,
  FolderOpen,
  Search,
} from 'lucide-react';
import { useCallback } from 'react';
import { CommandPaletteItem } from '../CommandPaletteItem';
import type { RecentEntry } from '../hooks/useRecentCommands';
import type { ReactNode } from 'react';

export interface RecentGroupProps {
  recents: RecentEntry[];
  onClose: () => void;
}

const GROUP_ICONS: Record<string, ReactNode> = {
  Navigation: <MessageSquare size={16} />,
  Sessions: <MessageSquare size={16} />,
  Files: <FileText size={16} />,
  Actions: <Plus size={16} />,
  Commands: <Slash size={16} />,
  Projects: <FolderOpen size={16} />,
};

/** More specific icon mapping for known recent entry IDs. */
function getIconForRecent(entry: RecentEntry): ReactNode {
  if (entry.id === 'nav-chat') return <MessageSquare size={16} />;
  if (entry.id === 'nav-files') return <FolderTree size={16} />;
  if (entry.id === 'nav-shell') return <Terminal size={16} />;
  if (entry.id === 'nav-git') return <GitBranch size={16} />;
  if (entry.id === 'nav-settings') return <Settings size={16} />;
  if (entry.id === 'action-new-session') return <Plus size={16} />;
  if (entry.id === 'action-toggle-thinking') return <Eye size={16} />;
  if (entry.id === 'action-toggle-sidebar') return <PanelLeft size={16} />;
  return GROUP_ICONS[entry.group] ?? <Search size={16} />;
}

export const RecentGroup = function RecentGroup({ recents, onClose }: RecentGroupProps) {
  const handleSelect = useCallback((_entry: RecentEntry) => {
    // Re-execution of recent commands requires knowledge of the original action.
    // For now, just close the palette -- full re-execution deferred to when
    // we have a command registry that maps IDs to actions.
    onClose();
  }, [onClose]);

  if (recents.length === 0) return null;

  return (
    <Command.Group heading="Recent">
      {recents.map((entry) => (
        <CommandPaletteItem
          key={entry.id}
          icon={getIconForRecent(entry)}
          label={entry.label}
          onSelect={() => handleSelect(entry)}
        />
      ))}
    </Command.Group>
  );
};
