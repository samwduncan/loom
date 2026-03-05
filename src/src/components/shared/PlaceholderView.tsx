/**
 * PlaceholderView — Generic reusable placeholder for empty route states.
 *
 * Renders centered content with title and optional message in muted styling.
 * Used by route placeholder components for /chat, /dashboard, /settings.
 *
 * Constitution: Named export (2.2), cn() for classes (3.6), token-based styling (3.1).
 */

import { cn } from '@/utils/cn';

export interface PlaceholderViewProps {
  title: string;
  message?: string;
}

export function PlaceholderView({ title, message }: PlaceholderViewProps) {
  return (
    <div className={cn('flex items-center justify-center h-full')}>
      <div className="text-center space-y-2">
        <p className="text-muted text-lg">{title}</p>
        {message != null && (
          <p className="text-muted text-sm">{message}</p>
        )}
      </div>
    </div>
  );
}
