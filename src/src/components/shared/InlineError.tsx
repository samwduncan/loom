/**
 * InlineError -- fetch-error display with optional retry button.
 *
 * Renders a centered column with AlertCircle icon, error message,
 * and an optional retry button wired to a refetch callback.
 *
 * Constitution: Named export (2.2), cn() for classes (3.6), design tokens only (3.1).
 */

import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

export interface InlineErrorProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function InlineError({ message, onRetry, className }: InlineErrorProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-2 px-4 py-6 text-center',
        className,
      )}
    >
      <AlertCircle className="size-5 text-destructive" />
      <p className="text-sm text-[var(--text-muted)]">{message}</p>
      {onRetry && (
        <Button variant="outline" size="xs" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
