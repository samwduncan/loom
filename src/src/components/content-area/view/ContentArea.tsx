/**
 * ContentArea -- Mount-once container with CSS show/hide for all workspace panels.
 *
 * All four panels (Chat, Files, Shell, Git) are rendered simultaneously in the DOM.
 * The active panel is shown; others are hidden via the CSS 'hidden' class.
 * This preserves panel state (scroll position, form inputs, terminal sessions)
 * across tab switches.
 *
 * Mobile viewports (<768px) override activeTab to 'chat' in the render path
 * (no store mutation) to ensure Chat is always visible on small screens.
 *
 * Constitution: Named export (2.2), cn() for classes (3.6), selector-only store (4.2),
 * token-based styling (3.1).
 */

import { useMemo, useSyncExternalStore } from 'react';
import { Terminal, GitBranch } from 'lucide-react';
import { useUIStore } from '@/stores/ui';
import type { TabId } from '@/types/ui';
import { TabBar } from './TabBar';
import { PanelPlaceholder } from './PanelPlaceholder';
import { useTabKeyboardShortcuts } from '../hooks/useTabKeyboardShortcuts';
import { PanelErrorBoundary } from '@/components/shared/ErrorBoundary';
import { ChatView } from '@/components/chat/view/ChatView';
import { FileTreePanel } from '@/components/file-tree/FileTreePanel';

// Mobile detection via matchMedia. Functions are called by useSyncExternalStore.
// matchMedia is called per-invocation (not cached) to support test mocking.
const MOBILE_QUERY = '(max-width: 767px)';

function subscribeMobile(cb: () => void) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => {};
  }
  const mql = window.matchMedia(MOBILE_QUERY);
  mql.addEventListener('change', cb);
  return () => mql.removeEventListener('change', cb);
}

function getMobileSnapshot() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(MOBILE_QUERY).matches;
}

function getMobileServerSnapshot() {
  return false;
}

export function ContentArea() {
  useTabKeyboardShortcuts();

  const rawActiveTab = useUIStore((s) => s.activeTab);

  // Mobile override: force chat on small viewports (LAY-06)
  // Synchronous in the render path -- no useEffect flash, no store mutation
  const isMobile = useSyncExternalStore(subscribeMobile, getMobileSnapshot, getMobileServerSnapshot);
  const activeTab = isMobile ? 'chat' : rawActiveTab;

  // Stable element references — created once per mount, inside React's render cycle
  // so context is available. useMemo([]) = mount-once, matching the CSS show/hide pattern.
  const panels = useMemo<Array<{ id: TabId; content: React.ReactNode }>>(() => [
    { id: 'chat', content: <ChatView /> },
    { id: 'files', content: <FileTreePanel /> },
    { id: 'shell', content: <PanelPlaceholder name="Shell" icon={Terminal} /> },
    { id: 'git', content: <PanelPlaceholder name="Git" icon={GitBranch} /> },
  ], []);

  return (
    <div className="flex h-full flex-col">
      <TabBar />
      <div className="relative flex-1 min-h-0">
        {panels.map(({ id, content }) => (
          <div
            key={id}
            id={`panel-${id}`}
            role="tabpanel"
            aria-labelledby={`tab-${id}`}
            className={activeTab === id ? 'h-full' : 'hidden'}
          >
            <PanelErrorBoundary panelName={id} resetKeys={activeTab === id ? [activeTab] : []}>
              {content}
            </PanelErrorBoundary>
          </div>
        ))}
      </div>
    </div>
  );
}
