/**
 * MessageContainer -- shared CSS wrapper for both streaming ActiveMessage
 * and historical messages.
 *
 * CRITICAL: Both streaming and historical assistant messages MUST use this
 * wrapper to prevent CLS (Cumulative Layout Shift) jitter at the
 * streaming/historical boundary. Identical padding, line-height, and spacing.
 *
 * Supports all 5 message roles:
 *   user: right-aligned bubble with bg-card background
 *   assistant: full-width, no background
 *   system: centered, no constraints
 *   error: full-width, no bubble constraint
 *   task_notification: full-width, no bubble constraint
 *
 * Content-visibility optimization is handled by the CSS .msg-item class
 * applied in MessageList.tsx, not inline styles. See SCROLL-05 / Pitfall 5.
 *
 * Constitution: Named export (2.2), token-based styling (3.1), cn() for classes (3.6).
 */

import type { ReactNode } from 'react';
import type { MessageRole } from '@/types/message';
import { cn } from '@/utils/cn';

interface MessageContainerProps {
  children: ReactNode;
  role: MessageRole;
  /** When true, marks the message as actively streaming (no content-visibility optimization) */
  isStreaming?: boolean;
}

export function MessageContainer({ children, role, isStreaming = false }: MessageContainerProps) {
  // content-visibility is now handled by CSS .msg-item class on the parent wrapper
  // in MessageList.tsx. No inline style needed here. See SCROLL-05 / Pitfall 5.
  void isStreaming; // Kept in API for backwards compatibility; CSS class handles optimization
  return (
    <div
      className={cn(
        'px-4 py-3 leading-relaxed text-[length:var(--text-body)]',
        role === 'user' && 'flex justify-end',
        role === 'system' && 'flex justify-center',
      )}
      data-role={role}
      data-testid="message-container"
    >
      {role === 'user' ? (
        <div
          className={cn(
            'max-w-[80%] rounded-2xl px-4 py-2',
            'bg-card text-foreground',
          )}
        >
          {children}
        </div>
      ) : (
        <div className={cn(
          role === 'assistant' && 'w-full text-foreground',
          role === 'system' && 'text-foreground',
          role === 'error' && 'w-full text-foreground',
          role === 'task_notification' && 'w-full text-foreground',
        )}>
          {children}
        </div>
      )}
    </div>
  );
}
