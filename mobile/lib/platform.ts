// Native app connects to backend over Tailscale HTTPS
export const API_BASE = 'https://samsara.tailad2401.ts.net:5555';
export const WS_BASE = 'wss://samsara.tailad2401.ts.net:5555';

export function resolveApiUrl(path: string): string {
  return `${API_BASE}${path.startsWith('/') ? path : '/' + path}`;
}

export function resolveWsUrl(path: string, token: string): string {
  const base = `${WS_BASE}${path.startsWith('/') ? path : '/' + path}`;
  return `${base}?token=${encodeURIComponent(token)}`;
}
