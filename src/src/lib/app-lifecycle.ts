/**
 * App lifecycle event listener -- Capacitor App plugin integration.
 *
 * Listens for app state changes (foreground/background transitions) on native.
 * The primary use case is triggering WebSocket reconnection when the app
 * returns from background, since iOS suspends WebSocket connections.
 *
 * On web: returns null immediately (no-op).
 *
 * Constitution: Named exports only (2.2), no default export.
 */

import { IS_NATIVE } from '@/lib/platform';

/**
 * Initialize the Capacitor App lifecycle listener.
 *
 * Registers an `appStateChange` listener that fires `onForeground` when the app
 * transitions from background to foreground (isActive becomes true).
 *
 * Returns a cleanup function that removes the listener, or null if on web
 * or if initialization failed.
 *
 * @param onForeground - Callback invoked when app returns to foreground
 * @returns Cleanup function to remove the listener, or null on web/failure
 *
 * @example
 * const cleanup = await initAppLifecycle(() => {
 *   wsClient.tryReconnect();
 * });
 * // Later: cleanup?.();
 */
export async function initAppLifecycle(
  onForeground: () => void,
): Promise<(() => void) | null> {
  if (!IS_NATIVE) return null;

  try {
    const { App } = await import('@capacitor/app');
    const handle = await App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) onForeground();
    });
    return () => {
      handle.remove();
    };
  } catch (err: unknown) {
    console.warn('[app-lifecycle] Failed to initialize App lifecycle listener:', err);
    return null;
  }
}
