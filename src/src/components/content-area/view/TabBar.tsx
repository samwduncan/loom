/**
 * TabBar -- Horizontal tab bar for switching workspace panels.
 *
 * Renders Chat, Files, Shell, Git tabs with icons, labels, and keyboard
 * shortcut hints. Hidden on mobile viewports (<768px) via Tailwind `hidden md:flex`.
 *
 * Constitution: Named export (2.2), cn() for classes (3.6), selector-only store (4.2),
 * token-based styling (3.1).
 */

import { useCallback, type KeyboardEvent } from 'react';
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

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      const currentIndex = TABS.findIndex((t) => t.id === activeTab);
      let nextIndex: number | null = null;

      if (e.key === 'ArrowRight') {
        nextIndex = (currentIndex + 1) % TABS.length;
      } else if (e.key === 'ArrowLeft') {
        nextIndex = (currentIndex - 1 + TABS.length) % TABS.length;
      } else if (e.key === 'Home') {
        nextIndex = 0;
      } else if (e.key === 'End') {
        nextIndex = TABS.length - 1;
      }

      if (nextIndex !== null) {
        e.preventDefault();
        const nextTab = TABS[nextIndex]; // ASSERT: nextIndex is bounded by TABS.length
        if (nextTab) {
          handleTabClick(nextTab.id);
          requestAnimationFrame(() => {
            document.getElementById(`tab-${nextTab.id}`)?.focus();
          });
        }
      }
    },
    [activeTab, handleTabClick],
  );

  return (
    <nav
      role="tablist"
      aria-label="Workspace panels"
      onKeyDown={handleKeyDown}
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
            tabIndex={isActive ? 0 : -1}
            onClick={() => handleTabClick(id)}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
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
