/**
 * Platform detection and URL resolution -- single source of truth.
 *
 * Detects whether the app is running inside a Capacitor native shell (iOS/Android)
 * or a standard web browser, and resolves API/WebSocket URLs accordingly.
 *
 * Web mode: returns relative paths (e.g., '/api/foo') -- same-origin, proxy handles routing.
 * Native mode: returns absolute URLs (e.g., 'http://100.86.4.57:5555/api/foo') -- direct to Express.
 *
 * No imports from @capacitor/core -- detection uses the window.Capacitor global
 * injected by the Capacitor runtime in all native contexts.
 *
 * Constitution: Named exports only (2.2), no default export.
 */

/**
 * True when running inside a Capacitor native shell (iOS/Android).
 * False in web browsers and test environments.
 *
 * Detection: Capacitor runtime injects `window.Capacitor` before any user JS runs.
 * We check for its existence without importing @capacitor/core.
 *
 * @example
 * // Web browser: IS_NATIVE === false
 * // Capacitor iOS app: IS_NATIVE === true
 */
export const IS_NATIVE: boolean =
  typeof window !== 'undefined' &&
  typeof (window as unknown as Record<string, unknown>).Capacitor !== 'undefined';

/**
 * Base URL for HTTP API requests.
 *
 * - Web: empty string (relative paths, same-origin proxy handles routing)
 * - Native: absolute URL to the Express server (default: Tailscale address)
 *
 * Override via VITE_API_URL env var for custom server addresses.
 *
 * @example
 * // Web: API_BASE === ''
 * // Native: API_BASE === 'http://100.86.4.57:5555'
 */
export const API_BASE: string = IS_NATIVE
  ? (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://100.86.4.57:5555'
  : '';

/**
 * Base URL for WebSocket connections.
 *
 * - Web: empty string (derived from window.location at connect time)
 * - Native: ws:// URL derived from API_BASE (http -> ws, https -> wss)
 *
 * @example
 * // Web: WS_BASE === ''
 * // Native: WS_BASE === 'ws://100.86.4.57:5555'
 */
export const WS_BASE: string = IS_NATIVE
  ? API_BASE.replace(/^http/, 'ws')
  : '';

/**
 * Resolve an API path to a full URL.
 *
 * - Web: returns the path unchanged (e.g., '/api/foo' -> '/api/foo')
 * - Native: prepends the server base (e.g., '/api/foo' -> 'http://100.86.4.57:5555/api/foo')
 *
 * @param path - API path starting with '/' (e.g., '/api/sessions')
 * @returns Resolved URL string
 *
 * @example
 * resolveApiUrl('/api/sessions') // Web: '/api/sessions'
 * resolveApiUrl('/api/sessions') // Native: 'http://100.86.4.57:5555/api/sessions'
 */
export function resolveApiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

/**
 * Resolve a WebSocket path to a full URL with auth token.
 *
 * - Web: derives from window.location (wss: if https:, ws: if http:)
 * - Native: uses WS_BASE (absolute ws:// URL to server)
 *
 * @param path - WebSocket path (e.g., '/ws' or '/shell')
 * @param token - JWT auth token for query string authentication
 * @returns Full WebSocket URL with token (e.g., 'ws://host/ws?token=abc')
 *
 * @example
 * resolveWsUrl('/ws', 'jwt123') // Web: 'ws://localhost:5184/ws?token=jwt123'
 * resolveWsUrl('/ws', 'jwt123') // Native: 'ws://100.86.4.57:5555/ws?token=jwt123'
 */
export function resolveWsUrl(path: string, token: string): string {
  if (IS_NATIVE) {
    return `${WS_BASE}${path}?token=${token}`;
  }
  // Web: derive from current page location (existing behavior)
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}${path}?token=${token}`;
}

/**
 * Resolve the shell WebSocket URL with auth token.
 *
 * Convenience wrapper around resolveWsUrl for the /shell endpoint.
 *
 * @param token - JWT auth token
 * @returns Full shell WebSocket URL (e.g., 'ws://host/shell?token=abc')
 */
export function resolveShellWsUrl(token: string): string {
  return resolveWsUrl('/shell', token);
}

/**
 * Minimal fetch wrapper for unauthenticated API calls.
 *
 * Used during auth bootstrap (before any JWT exists) -- separate from
 * apiFetch() which injects Authorization headers. Adds Content-Type
 * header and resolves the URL through the platform layer.
 *
 * @param path - API path (e.g., '/api/auth/status')
 * @param options - Standard RequestInit options (method, body, headers, etc.)
 * @returns Raw fetch Response
 *
 * @example
 * const res = await fetchAnon('/api/auth/status');
 * const data = await res.json();
 */
export async function fetchAnon(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(resolveApiUrl(path), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    },
  });
}
