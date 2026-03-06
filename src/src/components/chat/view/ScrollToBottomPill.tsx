/**
 * ScrollToBottomPill -- Floating scroll-to-bottom button for chat streaming.
 *
 * Appears when user scrolls away from bottom during active streaming.
 * Frosted glass surface with down arrow icon and slide-up/down animation.
 *
 * Constitution: Named exports (2.2), design tokens only (7.14), no box-shadow (7.5).
 */

import { cn } from '@/utils/cn';
import './scroll-pill.css';

export interface ScrollToBottomPillProps {
  visible: boolean;
  onClick: () => void;
}

export function ScrollToBottomPill({
  visible,
  onClick,
}: ScrollToBottomPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Scroll to bottom"
      className={cn(
        'scroll-pill',
        'absolute bottom-4 left-1/2 -translate-x-1/2',
        'flex items-center gap-2',
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
