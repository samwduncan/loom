/**
 * WebSocket client -- Web wrapper around shared factory.
 *
 * Injects web-specific URL resolver and auth provider.
 * Creates the singleton wsClient instance used throughout the web app.
 *
 * Re-exports WebSocketClient class and ConnectionState type for backward compatibility.
 *
 * Constitution: Named exports only (2.2), no default export, no React deps.
 */

import { WebSocketClient } from '@loom/shared/lib/websocket-client';
import type { WsConnectionState } from '@loom/shared/lib/websocket-client';
import { webAuthProvider } from '@/lib/auth';
import { resolveWsUrl } from '@/lib/platform';

// Re-export class and type for backward compatibility
export { WebSocketClient };
export type ConnectionState = WsConnectionState;

// Singleton instance with web-specific dependencies injected
export const wsClient = new WebSocketClient({
  resolveWsUrl,
  auth: webAuthProvider,
});
