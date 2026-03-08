/**
 * ScrollToBottomPill -- Floating scroll-to-bottom button for chat streaming.
 *
 * Appears when user scrolls away from bottom (200px+ threshold).
 * Frosted glass surface with down arrow icon and slide-up/down animation.
 * Shows unread message count badge when new messages arrive while scrolled up.
 *
 * Constitution: Named exports (2.2), design tokens only (7.14), no box-shadow (7.5).
 */

import { cn } from '@/utils/cn';
import './scroll-pill.css';

export interface ScrollToBottomPillProps {
  visible: boolean;
  onClick: () => void;
  unreadCount?: number;
}

export function ScrollToBottomPill({
  visible,
  onClick,
  unreadCount = 0,
}: ScrollToBottomPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={
        unreadCount > 0
          ? `Scroll to bottom (${unreadCount} new messages)`
          : 'Scroll to bottom'
      }
      data-testid="scroll-to-bottom-pill"
      className={cn(
        'scroll-pill',
        'absolute bottom-4 left-1/2 -translate-x-1/2',
        'relative flex items-center gap-2',
        'rounded-full px-4 py-2',
        'text-sm font-sans text-foreground',
        'border border-border',
        'backdrop-blur-[var(--glass-blur)]',
        'cursor-pointer',
        visible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-2 pointer-events-none',
      )}
      style={{
        zIndex: 'var(--z-scroll-pill)',
      }}
    >
      {unreadCount > 0 && (
        <span
          className={cn(
            'scroll-pill-badge',
            'absolute -top-2 -right-2',
            'min-w-[1.25rem] h-5 rounded-full',
            'bg-primary text-primary-foreground',
            'text-xs flex items-center justify-center font-medium',
            'px-1',
          )}
          data-testid="scroll-pill-badge"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M8 3v10M4 9l4 4 4-4" />
      </svg>
      <span>Scroll to bottom</span>
    </button>
  );
}
