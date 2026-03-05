/**
 * AppShell — CSS Grid skeleton providing the spatial structure for all content.
 *
 * Three columns: sidebar | content (via Outlet) | artifact (reserved at 0px).
 * h-dvh + overflow-hidden enforces SHELL-02 (no document scrollbar).
 * data-sidebar-state attribute drives CSS variables for sidebar width.
 *
 * Constitution: Named export (2.2), token-based styling (3.1), cn() for classes (3.6),
 * selector-only store access (4.2), inline style only for dynamic grid dimensions (3.2).
 */

import { memo } from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { useUIStore } from '@/stores/ui';
import { Sidebar } from '@/components/sidebar/Sidebar';

export const AppShell = memo(function AppShell() {
  const sidebarState = useUIStore((state) => state.sidebarState);

  return (
    <div
      data-testid="app-shell"
      data-sidebar-state={sidebarState}
      className={cn('grid h-dvh overflow-hidden bg-surface-base')}
      style={{
        gridTemplateColumns:
          'var(--sidebar-width, var(--sidebar-expanded-width, 280px)) 1fr var(--artifact-width, 0px)',
        gridTemplateRows: '1fr',
      }}
    >
      <div className="overflow-hidden min-w-0">
        <Sidebar />
      </div>

      <main role="main" className="overflow-hidden min-w-0">
        <Outlet />
      </main>

      {/* Artifact column: 0px width, reserved for future phases */}
      <div className="overflow-hidden min-w-0" />
    </div>
  );
});
