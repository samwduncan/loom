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

export interface NavigationGroupProps {
  onClose: () => void;
  addRecent: (entry: { id: string; label: string; group: string }) => void;
}

const NAV_ITEMS: Array<{
  id: string;
  label: string;
  tab: TabId;
  icon: React.ReactNode;
  shortcut: string;
}> = [
  { id: 'nav-chat', label: 'Switch to Chat', tab: 'chat', icon: <MessageSquare size={16} />, shortcut: '\u23181' },
  { id: 'nav-files', label: 'Switch to Files', tab: 'files', icon: <FolderTree size={16} />, shortcut: '\u23182' },
  { id: 'nav-shell', label: 'Switch to Shell', tab: 'shell', icon: <Terminal size={16} />, shortcut: '\u23183' },
  { id: 'nav-git', label: 'Switch to Git', tab: 'git', icon: <GitBranch size={16} />, shortcut: '\u23184' },
];

export const NavigationGroup = function NavigationGroup({ onClose, addRecent }: NavigationGroupProps) {
  const setActiveTab = useUIStore((s) => s.setActiveTab);
  const openModal = useUIStore((s) => s.openModal);

  const handleTabSelect = useCallback((item: typeof NAV_ITEMS[number]) => {
    setActiveTab(item.tab);
    addRecent({ id: item.id, label: item.label, group: 'Navigation' });
    onClose();
  }, [setActiveTab, onClose, addRecent]);

  const handleOpenSettings = useCallback(() => {
    openModal({ type: 'settings' });
    addRecent({ id: 'nav-settings', label: 'Open Settings', group: 'Navigation' });
    onClose();
  }, [openModal, onClose, addRecent]);

  return (
    <Command.Group heading="Navigation">
      {NAV_ITEMS.map((item) => (
        <CommandPaletteItem
          key={item.id}
          icon={item.icon}
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
