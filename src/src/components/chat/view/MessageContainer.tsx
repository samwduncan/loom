/**
 * MessageContainer -- shared CSS wrapper for both streaming ActiveMessage
 * and historical messages.
 *
 * CRITICAL: Both streaming and historical assistant messages MUST use this
 * wrapper to prevent CLS (Cumulative Layout Shift) jitter at the
 * streaming/historical boundary. Identical padding, line-height, and spacing.
 *
 * User role: right-aligned bubble with accent-primary-muted background.
 * Assistant role: full-width, no background.
 *
 * Constitution: Named export (2.2), token-based styling (3.1), cn() for classes (3.6).
 */

import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface MessageContainerProps {
  children: ReactNode;
  role: 'user' | 'assistant';
}

export function MessageContainer({ children, role }: MessageContainerProps) {
  return (
    <div
      className={cn(
        'px-4 py-3 leading-relaxed text-[length:var(--text-body)]',
        role === 'user' && 'flex justify-end',
      )}
      data-role={role}
      data-testid="message-container"
    >
      {role === 'user' ? (
        <div
          className={cn(
            'max-w-[80%] rounded-2xl px-4 py-2',
            'bg-primary-muted text-foreground',
          )}
        >
          {children}
        </div>
      ) : (
        <div className="w-full text-foreground">{children}</div>
      )}
    </div>
  );
}
