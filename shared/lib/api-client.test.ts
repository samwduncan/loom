/**
 * API Client factory tests -- verifies auth header injection, error handling,
 * deduplication, AbortSignal passthrough, and 401 retry via onAuthRefresh.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createApiClient } from '../lib/api-client';
import type { AuthProvider } from '../lib/auth';

function createMockAuth(): AuthProvider {
  return {
    getToken: vi.fn().mockReturnValue('test-jwt-token'),
    setToken: vi.fn(),
    clearToken: vi.fn(),
  };
}

function createMockResolveUrl(): (path: string) => string {
  return (path: string) => path; // identity -- returns path unchanged
}

describe('createApiClient - apiFetch', () => {
  let auth: ReturnType<typeof createMockAuth>;
  let onAuthRefresh: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    auth = createMockAuth();
    onAuthRefresh = vi.fn();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function makeClient(overrides?: { onAuthRefresh?: () => Promise<string | null> }) {
    return createApiClient({
      auth,
      resolveUrl: createMockResolveUrl(),
      onAuthRefresh: overrides?.onAuthRefresh ?? onAuthRefresh,
    });
  }

  it('injects Authorization header when auth.getToken returns a token', async () => {
    const client = makeClient();
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    await client.apiFetch('/api/test');

    expect(mockFetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
      headers: expect.objectContaining({
        Authorization: 'Bearer test-jwt-token',
      }),
    }));
  });

  it('omits Authorization header when auth.getToken returns null', async () => {
    (auth.getToken as ReturnType<typeof vi.fn>).mockReturnValue(null);
    const client = makeClient();
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValue(new Response(JSON.stringify({ data: 1 }), { status: 200 }));

    await client.apiFetch('/api/test');

    const callHeaders = mockFetch.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(callHeaders).not.toHaveProperty('Authorization');
  });

  it('throws on non-ok response with status code', async () => {
    const client = makeClient();
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValue(new Response('Not Found', { status: 404, statusText: 'Not Found' }));

    await expect(client.apiFetch('/api/missing')).rejects.toThrow('API error 404');
  });

  it('returns parsed JSON on success', async () => {
    const client = makeClient();
    const mockFetch = vi.mocked(globalThis.fetch);
    const data = { sessions: [], total: 0 };
    mockFetch.mockResolvedValue(new Response(JSON.stringify(data), { status: 200 }));

    const result = await client.apiFetch<{ sessions: unknown[]; total: number }>('/api/sessions');
    expect(result).toEqual(data);
  });

  it('passes AbortSignal through to fetch for mutations', async () => {
    const client = makeClient();
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
    const controller = new AbortController();

    await client.apiFetch('/api/test', { method: 'POST' }, controller.signal);

    expect(mockFetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
      signal: controller.signal,
    }));
  });

  it('does not pass caller signal to shared GET fetch (dedup-safe)', async () => {
    const client = makeClient();
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
    const controller = new AbortController();

    await client.apiFetch('/api/test', {}, controller.signal);

    expect(mockFetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
      signal: undefined,
    }));
  });

  it('merges custom headers with default headers', async () => {
    const client = makeClient();
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));

    await client.apiFetch('/api/test', {
      headers: { 'X-Custom': 'value' },
    });

    const callHeaders = mockFetch.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(callHeaders).toHaveProperty('Authorization', 'Bearer test-jwt-token');
    expect(callHeaders).toHaveProperty('X-Custom', 'value');
  });

  it('retries once on 401 after calling onAuthRefresh', async () => {
    (auth.getToken as ReturnType<typeof vi.fn>).mockReturnValue('stale-token');
    onAuthRefresh.mockResolvedValue('fresh-token');
    const client = makeClient();
    const mockFetch = vi.mocked(globalThis.fetch);

    mockFetch.mockResolvedValueOnce(new Response('Unauthorized', { status: 401, statusText: 'Unauthorized' }));
    const data = { success: true };
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(data), { status: 200 }));

    (auth.getToken as ReturnType<typeof vi.fn>).mockReturnValue('fresh-token');

    const result = await client.apiFetch<{ success: boolean }>('/api/test');

    expect(result).toEqual(data);
    expect(onAuthRefresh).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    const retryHeaders = mockFetch.mock.calls[1]?.[1]?.headers as Record<string, string>;
    expect(retryHeaders).toHaveProperty('Authorization', 'Bearer fresh-token');
  });

  it('does NOT retry on 401 if onAuthRefresh fails', async () => {
    (auth.getToken as ReturnType<typeof vi.fn>).mockReturnValue('stale-token');
    onAuthRefresh.mockRejectedValue(new Error('Auth failed'));
    const client = makeClient();
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValueOnce(new Response('Unauthorized', { status: 401, statusText: 'Unauthorized' }));

    await expect(client.apiFetch('/api/test')).rejects.toThrow('Auth failed');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('does NOT retry on non-401 errors', async () => {
    const client = makeClient();
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValueOnce(new Response('Forbidden', { status: 403, statusText: 'Forbidden' }));

    await expect(client.apiFetch('/api/test')).rejects.toThrow('API error 403');
    expect(onAuthRefresh).not.toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('does NOT retry on second 401 (no infinite loop)', async () => {
    (auth.getToken as ReturnType<typeof vi.fn>).mockReturnValue('stale-token');
    onAuthRefresh.mockResolvedValue('still-stale-token');
    const client = makeClient();
    const mockFetch = vi.mocked(globalThis.fetch);

    mockFetch.mockResolvedValueOnce(new Response('Unauthorized', { status: 401, statusText: 'Unauthorized' }));
    mockFetch.mockResolvedValueOnce(new Response('Unauthorized', { status: 401, statusText: 'Unauthorized' }));

    await expect(client.apiFetch('/api/test')).rejects.toThrow('API error 401');
    expect(onAuthRefresh).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('throws 401 Unauthorized when no onAuthRefresh is provided', async () => {
    const client = createApiClient({
      auth,
      resolveUrl: createMockResolveUrl(),
      // No onAuthRefresh
    });
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValueOnce(new Response('Unauthorized', { status: 401, statusText: 'Unauthorized' }));

    await expect(client.apiFetch('/api/test')).rejects.toThrow('API error 401: Unauthorized');
  });
});

describe('createApiClient - deduplication', () => {
  let auth: ReturnType<typeof createMockAuth>;

  beforeEach(() => {
    vi.clearAllMocks();
    auth = createMockAuth();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function makeClient() {
    return createApiClient({
      auth,
      resolveUrl: createMockResolveUrl(),
    });
  }

  function mockJsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      statusText: status === 200 ? 'OK' : 'Error',
      headers: { 'Content-Type': 'application/json' },
    });
  }

  it('dedup: two concurrent GET requests to the same URL share one fetch call', async () => {
    const client = makeClient();
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValue(mockJsonResponse({ data: 'hello' }));

    const p1 = client.apiFetch('/api/test');
    const p2 = client.apiFetch('/api/test');

    const [r1, r2] = await Promise.all([p1, p2]);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(r1).toEqual({ data: 'hello' });
    expect(r2).toEqual({ data: 'hello' });
  });

  it('dedup: a GET request after the first resolves fires a new fetch', async () => {
    const client = makeClient();
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValue(mockJsonResponse({ data: 'first' }));

    await client.apiFetch('/api/test');
    expect(mockFetch).toHaveBeenCalledTimes(1);

    mockFetch.mockResolvedValue(mockJsonResponse({ data: 'second' }));

    const result = await client.apiFetch('/api/test');
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ data: 'second' });
  });

  it('dedup: POST/PATCH/DELETE requests are never deduplicated', async () => {
    const client = makeClient();
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockImplementation(() =>
      Promise.resolve(mockJsonResponse({ ok: true })),
    );

    const p1 = client.apiFetch('/api/test', { method: 'POST', body: '{}' });
    const p2 = client.apiFetch('/api/test', { method: 'POST', body: '{}' });

    await Promise.all([p1, p2]);
    expect(mockFetch).toHaveBeenCalledTimes(2);

    mockFetch.mockClear();
    mockFetch.mockImplementation(() =>
      Promise.resolve(mockJsonResponse({ ok: true })),
    );

    const p3 = client.apiFetch('/api/test', { method: 'PATCH', body: '{}' });
    const p4 = client.apiFetch('/api/test', { method: 'DELETE' });

    await Promise.all([p3, p4]);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('dedup: if the shared promise rejects, all waiters receive the error and entry is cleaned', async () => {
    const client = makeClient();
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValue(mockJsonResponse(null, 500));

    const p1 = client.apiFetch('/api/fail');
    const p2 = client.apiFetch('/api/fail');

    await expect(p1).rejects.toThrow('API error 500');
    await expect(p2).rejects.toThrow('API error 500');

    mockFetch.mockResolvedValue(mockJsonResponse({ recovered: true }));
    const result = await client.apiFetch('/api/fail');
    expect(result).toEqual({ recovered: true });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('dedup: requests with different URLs are not deduplicated', async () => {
    const client = makeClient();
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockImplementation(() =>
      Promise.resolve(mockJsonResponse({ data: 'a' })),
    );

    const p1 = client.apiFetch('/api/one');
    const p2 = client.apiFetch('/api/two');

    await Promise.all([p1, p2]);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
