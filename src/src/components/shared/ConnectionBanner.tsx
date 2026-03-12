/**
 * ConnectionBanner — Error banner and reconnection overlay for connection failures.
 *
 * Shows nothing when connected or initially connecting.
 * Shows error banner (red) when disconnected with error (ERR-01: backend crash).
 * Shows reconnection overlay with attempt count when reconnecting (ERR-02).
 * Shows "Connection lost" with manual reconnect button when disconnected without error.
 */

import { memo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { cn } from '@/utils/cn';
import { useConnectionStore } from '@/stores/connection';
import { wsClient } from '@/lib/websocket-client';

export const ConnectionBanner = memo(function ConnectionBanner() {
  const { status, error, reconnectAttempts } = useConnectionStore(
    useShallow((s) => ({
      status: s.providers.claude.status,
      error: s.providers.claude.error,
      reconnectAttempts: s.providers.claude.reconnectAttempts,
    })),
  );

  // No banner when connected or initially connecting
  if (status === 'connected' || status === 'connecting') {
    return null;
  }

  // ERR-01: Backend crash — disconnected with error message
  if (status === 'disconnected' && error) {
    return (
      <div
        role="alert"
        className={cn(
          'fixed top-0 inset-x-0 z-[var(--z-toast)]',
          'bg-destructive/90 text-foreground',
          'px-4 py-3 text-sm text-center',
          'backdrop-blur-sm',
        )}
      >
        <span className="font-medium">Connection Error:</span> {error}
      </div>
    );
  }

  // ERR-02: Reconnecting — overlay with attempt counter
  if (status === 'reconnecting') {
    return (
      <div
        role="alert"
        className={cn(
          'fixed inset-0 z-[var(--z-overlay)]',
          'flex items-center justify-center',
          'bg-[var(--backdrop-overlay)] backdrop-blur-sm',
        )}
      >
        <div
          className={cn(
            'bg-surface-overlay border border-border rounded-lg',
            'px-6 py-4 text-center shadow-lg',
          )}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="inline-block size-2 rounded-full bg-warning animate-pulse" />
            <span className="text-foreground font-medium">Reconnecting...</span>
          </div>
          <p className="text-muted text-sm">
            Attempt {reconnectAttempts}
          </p>
        </div>
      </div>
    );
  }

  // Disconnected without error — manual reconnect
  return (
    <div
      role="alert"
      className={cn(
        'fixed top-0 inset-x-0 z-[var(--z-toast)]',
        'bg-surface-overlay text-foreground',
        'px-4 py-3 text-sm text-center',
        'border-b border-border',
      )}
    >
      <span>Connection lost</span>
      <button
        type="button"
        onClick={() => wsClient.tryReconnect()}
        className={cn(
          'ml-3 px-3 py-1 rounded-md text-sm',
          'bg-primary text-primary-foreground',
          'hover:bg-primary-hover transition-colors',
        )}
      >
        Reconnect
      </button>
    </div>
  );
});
