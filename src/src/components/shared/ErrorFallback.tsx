/**
 * ErrorFallback — Fallback UI components for the three-tier error boundary hierarchy.
 *
 * Three tiers:
 *   AppErrorFallback — Full-screen "Something went wrong" with reload button
 *   PanelErrorFallback — Centered card within a panel with retry button
 *   MessageErrorFallback — Compact inline placeholder with retry
 *
 * Constitution: Named exports (2.2), cn() for classes (3.6), token-based styling only (3.1).
 */

import { useState, useCallback } from 'react';
import { cn } from '@/utils/cn';

// ---------- Shared warning icon ----------

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('size-6', className)}
      aria-hidden="true"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function SmallWarningIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('size-3.5', className)}
      aria-hidden="true"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

// ---------- Props types ----------

export interface AppErrorFallbackProps {
  error: Error;
  onReload: () => void;
}

export interface PanelErrorFallbackProps {
  error: Error;
  panelName: string;
  onRetry: () => void;
}

export interface MessageErrorFallbackProps {
  error: Error;
  onRetry: () => void;
}

// ---------- AppErrorFallback ----------

export function AppErrorFallback({ error, onReload }: AppErrorFallbackProps) {
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);

  const toggleDetails = useCallback(() => {
    setIsDetailsVisible((prev) => !prev);
  }, []);

  return (
    <div
      data-testid="app-error-fallback"
      className={cn('flex items-center justify-center h-dvh bg-surface-base')}
    >
      <div className={cn('bg-surface-overlay rounded-lg p-8 max-w-md text-center space-y-4')}>
        <WarningIcon className="mx-auto text-warning" />

        <h1 className={cn('text-foreground text-lg font-semibold')}>
          Something went wrong
        </h1>

        <p className={cn('text-secondary-foreground text-sm')}>
          The application encountered an unexpected error.
        </p>

        <button
          type="button"
          onClick={onReload}
          className={cn(
            'bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium',
            'hover:bg-primary-hover transition-colors',
          )}
        >
          Reload
        </button>

        <div>
          <button
            type="button"
            onClick={toggleDetails}
            className={cn('text-muted text-xs underline cursor-pointer')}
          >
            {isDetailsVisible ? 'Hide details' : 'Show details'}
          </button>

          {isDetailsVisible && (
            <pre
              className={cn(
                'text-left text-xs text-muted overflow-auto max-h-40',
                'bg-surface-base p-3 rounded font-mono mt-2',
              )}
            >
              {error.message}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- PanelErrorFallback ----------

export function PanelErrorFallback({ error, panelName, onRetry }: PanelErrorFallbackProps) {
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);

  const toggleDetails = useCallback(() => {
    setIsDetailsVisible((prev) => !prev);
  }, []);

  return (
    <div
      data-testid="panel-error-fallback"
      className={cn('flex items-center justify-center h-full p-6')}
    >
      <div className={cn('bg-surface-overlay rounded-lg p-6 max-w-sm text-center space-y-3')}>
        <WarningIcon className="mx-auto text-warning size-5" />

        <p className={cn('text-secondary-foreground text-sm')}>
          Something went wrong in {panelName}
        </p>

        <button
          type="button"
          onClick={onRetry}
          className={cn(
            'bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium',
            'hover:bg-primary-hover transition-colors',
          )}
        >
          Try again
        </button>

        <div>
          <button
            type="button"
            onClick={toggleDetails}
            className={cn('text-muted text-xs underline cursor-pointer')}
          >
            {isDetailsVisible ? 'Hide details' : 'Show details'}
          </button>

          {isDetailsVisible && (
            <pre
              className={cn(
                'text-left text-xs text-muted overflow-auto max-h-40',
                'bg-surface-base p-3 rounded font-mono mt-2',
              )}
            >
              {error.message}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- MessageErrorFallback ----------

export function MessageErrorFallback({ error: _error, onRetry }: MessageErrorFallbackProps) {
  return (
    <div
      data-testid="message-error-fallback"
      className={cn('flex items-center gap-2 px-3 py-1.5 text-muted text-xs')}
    >
      <SmallWarningIcon className="text-warning shrink-0" />
      <span>Failed to render this message</span>
      <button
        type="button"
        onClick={onRetry}
        className={cn(
          'text-muted hover:text-foreground text-xs underline cursor-pointer transition-colors',
        )}
      >
        Retry
      </button>
    </div>
  );
}
