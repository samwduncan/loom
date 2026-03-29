/**
 * App lifecycle hook -- reconnects WebSocket on foreground return (native only).
 *
 * When the iOS app returns from background, WebSocket connections are typically
 * suspended by the OS. This hook listens for foreground events via the Capacitor
 * App plugin and triggers a reconnect if the Claude provider is disconnected.
 *
 * Mount in AppShell (root layout component). On web, this is a no-op.
 *
 * Debounces rapid foreground events by 300ms to prevent connection storms (D-19).
 *
 * Constitution: Named exports only (2.2), no default export.
 */

import { useEffect, useRef } from 'react';
import { IS_NATIVE } from '@/lib/platform';
import { initAppLifecycle } from '@/lib/app-lifecycle';
import { useConnectionStore } from '@/stores/connection';
import { wsClient } from '@/lib/websocket-client';

/**
 * React hook that listens for app foreground return (native only)
 * and triggers WebSocket reconnect if the Claude provider is disconnected.
 *
 * On web: no-op. On native: registers an appStateChange listener with
 * a 300ms debounce to prevent rapid reconnect attempts.
 */
export function useAppLifecycle(): void {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!IS_NATIVE) return;

    let cleanup: (() => void) | null = null;

    const handleForeground = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const claudeStatus = useConnectionStore.getState().providers.claude.status;
        if (claudeStatus !== 'connected') {
          wsClient.tryReconnect();
        }
      }, 300);
    };

    initAppLifecycle(handleForeground).then((cleanupFn) => {
      cleanup = cleanupFn;
    });

    return () => {
      cleanup?.();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);
}
