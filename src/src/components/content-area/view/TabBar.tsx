/**
 * TabBar -- Horizontal tab bar for switching workspace panels.
 *
 * Renders Chat, Files, Shell, Git tabs with icons, labels, and keyboard
 * shortcut hints. Hidden on mobile viewports (<768px) via Tailwind `hidden md:flex`.
 *
 * Constitution: Named export (2.2), cn() for classes (3.6), selector-only store (4.2),
 * token-based styling (3.1).
 */

import { useCallback } from 'react';
import { MessageSquare, FolderTree, Terminal, GitBranch, type LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useUIStore } from '@/stores/ui';
import type { TabId } from '@/types/ui';

interface TabConfig {
  id: TabId;
  label: string;
  icon: LucideIcon;
  shortcut: string;
}

const TABS: TabConfig[] = [
  { id: 'chat', label: 'Chat', icon: MessageSquare, shortcut: '1' },
  { id: 'files', label: 'Files', icon: FolderTree, shortcut: '2' },
  { id: 'shell', label: 'Shell', icon: Terminal, shortcut: '3' },
  { id: 'git', label: 'Git', icon: GitBranch, shortcut: '4' },
];

export function TabBar() {
  const activeTab = useUIStore((s) => s.activeTab);
  const setActiveTab = useUIStore((s) => s.setActiveTab);

  const handleTabClick = useCallback(
    (id: TabId) => {
      setActiveTab(id);
      // Focus the newly active panel so keyboard users land inside it.
      // The mount-once CSS show/hide pattern means panels stay in DOM;
      // without this, focus can get stuck in a visually hidden panel.
      requestAnimationFrame(() => {
        document.getElementById(`panel-${id}`)?.focus();
      });
    },
    [setActiveTab],
  );

  return (
    <nav
      role="tablist"
      aria-label="Workspace panels"
      className={cn(
        'hidden md:flex items-center gap-0.5 px-2',
        'h-10 border-b border-border/8 bg-surface-base',
      )}
    >
      {TABS.map(({ id, label, icon: Icon, shortcut }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            role="tab"
            id={`tab-${id}`}
            aria-selected={isActive}
            aria-controls={`panel-${id}`}
            onClick={() => handleTabClick(id)}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              isActive
                ? 'text-foreground bg-surface-raised'
                : 'text-muted hover:text-foreground hover:bg-surface-raised/50',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{label}</span>
            <kbd
              className={cn(
                'hidden lg:inline-block ml-1 text-[10px] opacity-40',
                'font-mono',
              )}
            >
              {'\u2318'}{shortcut}
            </kbd>
          </button>
        );
      })}
    </nav>
  );
}
