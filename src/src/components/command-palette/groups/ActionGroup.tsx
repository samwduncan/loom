/**
 * ActionGroup -- New Session, Toggle Thinking, Toggle Sidebar commands.
 *
 * Constitution: Named export (2.2), selector-only store access (4.2).
 */

import { Command } from 'cmdk';
import { Plus, Eye, PanelLeft } from 'lucide-react';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CommandPaletteItem } from '../CommandPaletteItem';
import { useUIStore } from '@/stores/ui';

export interface ActionGroupProps {
  onClose: () => void;
}

export const ActionGroup = function ActionGroup({ onClose }: ActionGroupProps) {
  const navigate = useNavigate();
  const toggleThinking = useUIStore((s) => s.toggleThinking);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  const handleNewSession = useCallback(() => {
    navigate('/chat');
    onClose();
  }, [navigate, onClose]);

  const handleToggleThinking = useCallback(() => {
    toggleThinking();
    onClose();
  }, [toggleThinking, onClose]);

  const handleToggleSidebar = useCallback(() => {
    toggleSidebar();
    onClose();
  }, [toggleSidebar, onClose]);

  return (
    <Command.Group heading="Actions">
      <CommandPaletteItem
        icon={<Plus size={16} />}
        label="New Session"
        onSelect={handleNewSession}
      />
      <CommandPaletteItem
        icon={<Eye size={16} />}
        label="Toggle Thinking Visibility"
        onSelect={handleToggleThinking}
      />
      <CommandPaletteItem
        icon={<PanelLeft size={16} />}
        label="Toggle Sidebar"
        onSelect={handleToggleSidebar}
      />
    </Command.Group>
  );
};
