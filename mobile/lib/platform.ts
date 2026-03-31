// Native app connects to backend over Tailscale
export const API_BASE = 'http://100.86.4.57:5555';
export const WS_BASE = 'ws://100.86.4.57:5555';

export function resolveApiUrl(path: string): string {
  return `${API_BASE}${path.startsWith('/') ? path : '/' + path}`;
}

export function resolveWsUrl(path: string, token: string): string {
  const base = `${WS_BASE}${path.startsWith('/') ? path : '/' + path}`;
  return `${base}?token=${encodeURIComponent(token)}`;
}
