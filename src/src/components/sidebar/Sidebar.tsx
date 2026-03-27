/**
 * Sidebar -- Branded header with Loom wordmark, collapse/expand toggle,
 * New Chat button, and session list with date grouping.
 *
 * Expanded: aside with role="complementary", aria-label="Chat sessions",
 * Loom wordmark in Instrument Serif italic, collapse chevron,
 * NewChatButton, SessionList.
 * Collapsed: Fixed-position expand trigger at left edge.
 * Mobile: Fixed overlay drawer with backdrop (grid column stays 0px).
 *
 * Constitution: Named export (2.2), token-based styling (3.1), cn() for classes (3.6),
 * selector-only store access (4.2), z-index from dictionary (3.3).
 */

import { memo, useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router-dom';
import { Settings, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useUIStore } from '@/stores/ui';
import { ConnectionStatusIndicator } from '@/components/shared/ConnectionStatusIndicator';
import { NewChatButton } from './NewChatButton';
import { SessionList } from './SessionList';
import { QuickSettingsPanel } from './QuickSettingsPanel';

/* ─── Mobile detection (synced with ContentArea's 767px breakpoint) ─── */
const MOBILE_QUERY = '(max-width: 767px)';

function subscribeMobile(cb: () => void) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
  const mql = window.matchMedia(MOBILE_QUERY);
  mql.addEventListener('change', cb);
  return () => mql.removeEventListener('change', cb);
}

function getMobileSnapshot() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(MOBILE_QUERY).matches;
}

function getMobileServerSnapshot() { return false; }

export const Sidebar = memo(function Sidebar() {
  const isSidebarOpen = useUIStore((state) => state.sidebarOpen);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const openModal = useUIStore((state) => state.openModal);
  const isMobile = useSyncExternalStore(subscribeMobile, getMobileSnapshot, getMobileServerSnapshot);
  const location = useLocation();

  // Auto-close mobile drawer on route change (session select, new chat)
  const prevPathRef = useRef(location.pathname);
  useEffect(() => {
    if (isMobile && isSidebarOpen && prevPathRef.current !== location.pathname) {
      toggleSidebar();
    }
    prevPathRef.current = location.pathname;
  }, [location.pathname, isMobile, isSidebarOpen, toggleSidebar]);

  // ─── Swipe-to-close gesture for mobile drawer ───
  const sidebarPanelRef = useRef<HTMLDivElement>(null);
  const touchRef = useRef({ startX: 0, swiping: false });

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    touchRef.current.startX = touch.clientX;
    touchRef.current.swiping = false;
    if (sidebarPanelRef.current) {
      sidebarPanelRef.current.style.transition = 'none';
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    const deltaX = touch.clientX - touchRef.current.startX;
    if (deltaX < -10) touchRef.current.swiping = true;
    if (touchRef.current.swiping && sidebarPanelRef.current) {
      const clamped = Math.min(0, deltaX);
      sidebarPanelRef.current.style.transform = `translateX(${clamped}px)`;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!sidebarPanelRef.current) return;
    const el = sidebarPanelRef.current;

    // Read current transform to determine swipe distance
    const matrix = new DOMMatrix(getComputedStyle(el).transform);
    const currentX = matrix.m41;

    if (currentX < -100) {
      // Swipe past threshold — animate out then close
      el.style.transition = 'transform 200ms ease-out';
      el.style.transform = `translateX(-${el.offsetWidth}px)`;
      const onEnd = () => {
        el.removeEventListener('transitionend', onEnd);
        el.style.transition = '';
        el.style.transform = '';
        toggleSidebar();
      };
      el.addEventListener('transitionend', onEnd);
    } else {
      // Snap back
      el.style.transition = 'transform 200ms ease-out';
      el.style.transform = 'translateX(0)';
      const onEnd = () => {
        el.removeEventListener('transitionend', onEnd);
        el.style.transition = '';
      };
      el.addEventListener('transitionend', onEnd);
    }

    touchRef.current.swiping = false;
  }, [toggleSidebar]);

  // ─── Collapsed state ───
  if (!isSidebarOpen) {
    // Mobile: hamburger in top-left corner
    if (isMobile) {
      return (
        <button
          onClick={toggleSidebar}
          className={cn(
            'fixed left-3 top-3',
            'z-[var(--z-overlay)] p-3',
            'min-h-[44px] min-w-[44px]',
            'bg-surface-raised/80 backdrop-blur-sm rounded-lg',
            'border border-border/50',
            'text-muted hover:text-foreground',
            'transition-colors',
          )}
          aria-label="Open menu"
          type="button"
        >
          <Menu size={20} />
        </button>
      );
    }

    // Desktop: mid-left chevron
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
        <ChevronRight size={16} />
      </button>
    );
  }

  // ─── Sidebar content (shared between mobile overlay and desktop inline) ───
  const sidebarContent = (
    <aside
      role="complementary"
      aria-label="Sidebar navigation"
      className={cn(
        'bg-surface-raised border-r border-border',
        'overflow-hidden flex flex-col h-full',
        isMobile && 'w-[280px] max-w-[80vw]',
      )}
    >
      <header className="flex items-center justify-between p-4 border-b border-border">
        <span className="flex items-center gap-2">
          <span className="font-serif italic text-lg text-foreground">Loom</span>
          <ConnectionStatusIndicator />
        </span>
        <button
          onClick={toggleSidebar}
          className={cn(
            'p-3 md:p-1 rounded-md',
            'min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0',
            'flex items-center justify-center',
            'text-muted hover:text-foreground',
            'transition-colors',
          )}
          aria-label={isMobile ? 'Close menu' : 'Collapse sidebar'}
          type="button"
        >
          {isMobile ? <X size={16} /> : <ChevronLeft size={16} />}
        </button>
      </header>
      <div className="px-2 py-2 border-b border-border">
        <NewChatButton />
      </div>
      <SessionList />
      <footer className="mt-auto p-3 border-t border-border">
        <div className="flex items-center gap-1">
          <QuickSettingsPanel />
          <button
            onClick={() => openModal({ type: 'settings' })}
            className={cn(
              'p-3 md:p-2 rounded-md',
              'min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0',
              'text-muted hover:text-foreground',
              'transition-colors',
            )}
            aria-label="Open settings"
            type="button"
          >
            <Settings size={18} />
          </button>
        </div>
      </footer>
    </aside>
  );

  // ─── Mobile: fixed overlay drawer with backdrop ───
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[var(--z-overlay)] flex">
        <div
          ref={sidebarPanelRef}
          className="h-full shadow-xl"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {sidebarContent}
        </div>
        <button
          className="flex-1 bg-black/40 cursor-default"
          onClick={toggleSidebar}
          aria-label="Close menu"
          type="button"
          tabIndex={-1}
        />
      </div>
    );
  }

  // ─── Desktop: inline aside ───
  return sidebarContent;
});
