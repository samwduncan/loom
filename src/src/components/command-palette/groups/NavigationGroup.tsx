/**
 * NavigationGroup -- Tab switching + Open Settings commands for the command palette.
 *
 * 5 items: Switch to Chat/Files/Shell/Git tabs, and Open Settings modal.
 * Each shows a keyboard shortcut hint via Kbd.
 *
 * Constitution: Named export (2.2), selector-only store access (4.2),
 * cn() for classes (3.6), token-based colors (3.1).
 */

import { Command } from 'cmdk';
import { MessageSquare, FolderTree, Terminal, GitBranch, Settings } from 'lucide-react';
import { useCallback } from 'react';
import { CommandPaletteItem } from '../CommandPaletteItem';
import { useUIStore } from '@/stores/ui';
import type { TabId } from '@/types/ui';
import type { LucideIcon } from 'lucide-react';

export interface NavigationGroupProps {
  onClose: () => void;
}

const NAV_ITEMS: Array<{
  id: string;
  label: string;
  tab: TabId;
  Icon: LucideIcon;
  shortcut: string;
}> = [
  { id: 'nav-chat', label: 'Switch to Chat', tab: 'chat', Icon: MessageSquare, shortcut: '\u23181' },
  { id: 'nav-files', label: 'Switch to Files', tab: 'files', Icon: FolderTree, shortcut: '\u23182' },
  { id: 'nav-shell', label: 'Switch to Shell', tab: 'shell', Icon: Terminal, shortcut: '\u23183' },
  { id: 'nav-git', label: 'Switch to Git', tab: 'git', Icon: GitBranch, shortcut: '\u23184' },
];

export const NavigationGroup = function NavigationGroup({ onClose }: NavigationGroupProps) {
  const setActiveTab = useUIStore((s) => s.setActiveTab);
  const openModal = useUIStore((s) => s.openModal);

  const handleTabSelect = useCallback((item: typeof NAV_ITEMS[number]) => {
    setActiveTab(item.tab);
    onClose();
  }, [setActiveTab, onClose]);

  const handleOpenSettings = useCallback(() => {
    openModal({ type: 'settings' });
    onClose();
  }, [openModal, onClose]);

  return (
    <Command.Group heading="Navigation">
      {NAV_ITEMS.map((item) => (
        <CommandPaletteItem
          key={item.id}
          icon={<item.Icon size={16} />}
          label={item.label}
          shortcut={item.shortcut}
          onSelect={() => handleTabSelect(item)}
        />
      ))}
      <CommandPaletteItem
        icon={<Settings size={16} />}
        label="Open Settings"
        onSelect={handleOpenSettings}
      />
    </Command.Group>
  );
};
