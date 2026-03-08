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
 * Finalized (non-streaming) messages get content-visibility: auto for
 * off-screen rendering optimization in long conversations.
 *
 * Constitution: Named export (2.2), token-based styling (3.1), cn() for classes (3.6).
 */

import type { CSSProperties, ReactNode } from 'react';
import type { MessageRole } from '@/types/message';
import { cn } from '@/utils/cn';

interface MessageContainerProps {
  children: ReactNode;
  role: MessageRole;
  /** When true, disables content-visibility optimization (for actively streaming messages) */
  isStreaming?: boolean;
}

/** content-visibility styles for finalized messages -- skips off-screen rendering */
const contentVisibilityStyle: CSSProperties = {
  contentVisibility: 'auto',
  containIntrinsicHeight: 'auto 200px',
};

export function MessageContainer({ children, role, isStreaming = false }: MessageContainerProps) {
  return (
    <div
      className={cn(
        'px-4 py-3 leading-relaxed text-[length:var(--text-body)]',
        role === 'user' && 'flex justify-end',
        role === 'system' && 'flex justify-center',
      )}
      data-role={role}
      data-testid="message-container"
      style={!isStreaming ? contentVisibilityStyle : undefined}
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
