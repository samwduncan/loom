/**
 * Platform detection and URL resolution tests.
 *
 * Two describe blocks:
 * 1. Web mode (default) -- statically imported module, window.Capacitor undefined
 * 2. Native mode (mocked) -- vi.stubGlobal + vi.resetModules + dynamic import
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Static import for web mode tests (window.Capacitor is undefined in test env)
import {
  IS_NATIVE,
  API_BASE,
  WS_BASE,
  resolveApiUrl,
  resolveWsUrl,
  resolveShellWsUrl,
  fetchAnon,
} from './platform';

describe('platform (web mode — default)', () => {
  it('IS_NATIVE is false when window.Capacitor is undefined', () => {
    expect(IS_NATIVE).toBe(false);
  });

  it('API_BASE is empty string in web mode', () => {
    expect(API_BASE).toBe('');
  });

  it('WS_BASE is empty string in web mode', () => {
    expect(WS_BASE).toBe('');
  });

  it('resolveApiUrl returns the path unchanged in web mode', () => {
    expect(resolveApiUrl('/api/foo')).toBe('/api/foo');
    expect(resolveApiUrl('/api/auth/status')).toBe('/api/auth/status');
  });

  it('resolveWsUrl builds URL from window.location in web mode', () => {
    // jsdom defaults: location.protocol = 'http:', location.host = 'localhost:3000' (or similar)
    const url = resolveWsUrl('/ws', 'tok123');
    // Should start with ws: (since jsdom uses http:)
    expect(url).toMatch(/^ws:/);
    expect(url).toContain('/ws?token=tok123');
  });

  it('resolveShellWsUrl returns URL with /shell path', () => {
    const url = resolveShellWsUrl('tok456');
    expect(url).toContain('/shell?token=tok456');
  });
});

describe('platform (web mode — fetchAnon)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetchAnon calls global fetch with resolved URL and Content-Type header', async () => {
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    await fetchAnon('/api/auth/status');

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/auth/status',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    );
  });

  it('fetchAnon passes through custom options (method, body)', async () => {
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValue(new Response(JSON.stringify({ token: 'abc' }), { status: 200 }));

    await fetchAnon('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username: 'test', password: 'pass' }),
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/auth/register',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ username: 'test', password: 'pass' }),
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    );
  });

  it('fetchAnon allows custom headers to override defaults', async () => {
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValue(new Response('{}', { status: 200 }));

    await fetchAnon('/api/test', {
      headers: { 'X-Custom': 'value', 'Content-Type': 'text/plain' },
    });

    const callHeaders = mockFetch.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(callHeaders['X-Custom']).toBe('value');
    // Custom Content-Type should override the default
    expect(callHeaders['Content-Type']).toBe('text/plain');
  });
});

describe('platform (native mode — mocked)', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('IS_NATIVE is true when window.Capacitor is defined', async () => {
    vi.stubGlobal('Capacitor', { isNativePlatform: () => true });
    const mod = await import('./platform');
    expect(mod.IS_NATIVE).toBe(true);
  });

  it('API_BASE is the Tailscale server URL in native mode', async () => {
    vi.stubGlobal('Capacitor', { isNativePlatform: () => true });
    const mod = await import('./platform');
    expect(mod.API_BASE).toBe('http://100.86.4.57:5555');
  });

  it('WS_BASE converts http to ws in native mode', async () => {
    vi.stubGlobal('Capacitor', { isNativePlatform: () => true });
    const mod = await import('./platform');
    expect(mod.WS_BASE).toBe('ws://100.86.4.57:5555');
  });

  it('resolveApiUrl returns absolute URL in native mode', async () => {
    vi.stubGlobal('Capacitor', { isNativePlatform: () => true });
    const mod = await import('./platform');
    expect(mod.resolveApiUrl('/api/foo')).toBe('http://100.86.4.57:5555/api/foo');
  });

  it('resolveWsUrl returns absolute ws:// URL in native mode', async () => {
    vi.stubGlobal('Capacitor', { isNativePlatform: () => true });
    const mod = await import('./platform');
    expect(mod.resolveWsUrl('/ws', 'tok123')).toBe('ws://100.86.4.57:5555/ws?token=tok123');
  });

  it('resolveShellWsUrl returns absolute ws:// URL with /shell in native mode', async () => {
    vi.stubGlobal('Capacitor', { isNativePlatform: () => true });
    const mod = await import('./platform');
    expect(mod.resolveShellWsUrl('tok123')).toBe('ws://100.86.4.57:5555/shell?token=tok123');
  });
});
