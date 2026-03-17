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

import { memo, lazy, Suspense } from 'react';
import { cn } from '@/utils/cn';
import { useUIStore } from '@/stores/ui';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { PanelErrorBoundary } from '@/components/shared/ErrorBoundary';
import { ConnectionBanner } from '@/components/shared/ConnectionBanner';
import { ContentArea } from '@/components/content-area/view/ContentArea';
import { SkipLink } from '@/components/a11y/SkipLink';

const LazySettingsModal = lazy(() =>
  import('@/components/settings/SettingsModal').then((m) => ({
    default: m.SettingsModal,
  })),
);

const LazyCommandPalette = lazy(() =>
  import('@/components/command-palette/CommandPalette').then((m) => ({
    default: m.CommandPalette,
  })),
);

export const AppShell = memo(function AppShell() {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);

  return (
    <>
    <SkipLink />
    <ConnectionBanner />
    <div
      data-testid="app-shell"
      data-sidebar-state={sidebarOpen ? 'expanded' : 'collapsed-hidden'}
      className={cn('grid h-dvh overflow-hidden bg-surface-base')}
      style={{
        gridTemplateColumns:
          'var(--sidebar-width, var(--sidebar-expanded-width, 280px)) 1fr var(--artifact-width, 0px)',
        gridTemplateRows: '1fr',
      }}
    >
      <div className="overflow-hidden min-w-0">
        <PanelErrorBoundary panelName="sidebar">
          <Sidebar />
        </PanelErrorBoundary>
      </div>

      <main role="main" id="main-content" className="overflow-hidden min-w-0">
        <PanelErrorBoundary panelName="content">
          <ContentArea />
        </PanelErrorBoundary>
      </main>

      {/* Artifact column: 0px width, reserved for future phases */}
      <div className="overflow-hidden min-w-0" />
    </div>

    <Suspense fallback={null}>
      <LazySettingsModal />
    </Suspense>

    <Suspense fallback={null}>
      <LazyCommandPalette />
    </Suspense>
  </>
  );
});
