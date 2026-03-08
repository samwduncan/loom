/**
 * StreamingCursor -- Reusable pulsing cursor for active streaming content.
 *
 * Two variants:
 * - 'primary' (default): Uses --accent-primary for content streaming
 * - 'muted': Uses --text-muted for thinking block streaming
 *
 * Constitution: Named export (2.2), CSS via classes only (7.14).
 */

import { cn } from '@/utils/cn';

interface StreamingCursorProps {
  variant?: 'primary' | 'muted';
}

export function StreamingCursor({ variant = 'primary' }: StreamingCursorProps) {
  return (
    <span
      className={cn('streaming-cursor', variant === 'muted' && 'streaming-cursor--muted')}
      data-testid="streaming-cursor"
      aria-hidden="true"
    />
  );
}
