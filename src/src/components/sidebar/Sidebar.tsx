/**
 * Sidebar -- Branded header with Loom wordmark, collapse/expand toggle,
 * New Chat button, and session list with date grouping.
 *
 * Expanded: aside with role="complementary", aria-label="Chat sessions",
 * Loom wordmark in Instrument Serif italic, collapse chevron,
 * NewChatButton, SessionList.
 * Collapsed: Fixed-position expand trigger at left edge.
 *
 * Constitution: Named export (2.2), token-based styling (3.1), cn() for classes (3.6),
 * selector-only store access (4.2), z-index from dictionary (3.3).
 */

import { memo } from 'react';
import { cn } from '@/utils/cn';
import { useUIStore } from '@/stores/ui';
import { NewChatButton } from './NewChatButton';
import { SessionList } from './SessionList';

export const Sidebar = memo(function Sidebar() {
  const isSidebarOpen = useUIStore((state) => state.sidebarOpen);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);

  if (!isSidebarOpen) {
    return (
      <button
        onClick={toggleSidebar}
        className={cn(
          'fixed left-0 top-1/2 -translate-y-1/2',
          'z-[var(--z-overlay)] p-2',
          'bg-surface-raised rounded-r-md border-r border-border',
          'text-muted hover:text-foreground',
          'transition-colors',
        )}
        aria-label="Expand sidebar"
        type="button"
      >
        {/* Chevron right */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    );
  }

  return (
    <aside
      role="complementary"
      aria-label="Chat sessions"
      className={cn(
        'bg-surface-raised border-r border-border',
        'overflow-hidden flex flex-col h-full',
      )}
    >
      <header className="flex items-center justify-between p-4 border-b border-border">
        <span className="font-serif italic text-lg text-foreground">Loom</span>
        <button
          onClick={toggleSidebar}
          className={cn(
            'p-1 rounded-md',
            'text-muted hover:text-foreground',
            'transition-colors',
          )}
          aria-label="Collapse sidebar"
          type="button"
        >
          {/* Chevron left */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </header>
      <div className="px-2 py-2 border-b border-border">
        <NewChatButton />
      </div>
      <SessionList />
    </aside>
  );
});
