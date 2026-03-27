/**
 * API Client tests -- verifies auth header injection, error handling, and AbortSignal passthrough.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiFetch, clearInflightRequests } from './api-client';

// Mock auth module
vi.mock('@/lib/auth', () => ({
  getToken: vi.fn(),
  refreshAuth: vi.fn(),
}));

import { getToken, refreshAuth } from '@/lib/auth';
const mockGetToken = vi.mocked(getToken);
const mockRefreshAuth = vi.mocked(refreshAuth);

describe('apiFetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('injects Authorization header when getToken returns a token', async () => {
    mockGetToken.mockReturnValue('test-jwt-token');
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    await apiFetch('/api/test');

    expect(mockFetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
      headers: expect.objectContaining({
        Authorization: 'Bearer test-jwt-token',
      }),
    }));
  });

  it('omits Authorization header when getToken returns null', async () => {
    mockGetToken.mockReturnValue(null);
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValue(new Response(JSON.stringify({ data: 1 }), { status: 200 }));

    await apiFetch('/api/test');

    const callHeaders = mockFetch.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(callHeaders).not.toHaveProperty('Authorization');
  });

  it('throws on non-ok response with status code', async () => {
    mockGetToken.mockReturnValue('token');
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValue(new Response('Not Found', { status: 404, statusText: 'Not Found' }));

    await expect(apiFetch('/api/missing')).rejects.toThrow('API error 404');
  });

  it('returns parsed JSON on success', async () => {
    mockGetToken.mockReturnValue('token');
    const mockFetch = vi.mocked(globalThis.fetch);
    const data = { sessions: [], total: 0 };
    mockFetch.mockResolvedValue(new Response(JSON.stringify(data), { status: 200 }));

    const result = await apiFetch<{ sessions: unknown[]; total: number }>('/api/sessions');
    expect(result).toEqual(data);
  });

  it('passes AbortSignal through to fetch for mutations', async () => {
    mockGetToken.mockReturnValue('token');
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
    const controller = new AbortController();

    // POST passes signal directly (no dedup)
    await apiFetch('/api/test', { method: 'POST' }, controller.signal);

    expect(mockFetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
      signal: controller.signal,
    }));
  });

  it('does not pass caller signal to shared GET fetch (dedup-safe)', async () => {
    mockGetToken.mockReturnValue('token');
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
    const controller = new AbortController();

    await apiFetch('/api/test', {}, controller.signal);

    // GET dedup: signal is NOT passed to the shared fetch
    expect(mockFetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
      signal: undefined,
    }));
  });

  it('merges custom headers with default headers', async () => {
    mockGetToken.mockReturnValue('token');
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));

    await apiFetch('/api/test', {
      headers: { 'X-Custom': 'value' },
    });

    const callHeaders = mockFetch.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(callHeaders).toHaveProperty('Authorization', 'Bearer token');
    expect(callHeaders).toHaveProperty('X-Custom', 'value');
  });

  it('retries once on 401 after calling refreshAuth', async () => {
    mockGetToken.mockReturnValue('stale-token');
    mockRefreshAuth.mockResolvedValue('fresh-token');
    const mockFetch = vi.mocked(globalThis.fetch);

    // First call returns 401
    mockFetch.mockResolvedValueOnce(new Response('Unauthorized', { status: 401, statusText: 'Unauthorized' }));
    // Retry succeeds
    const data = { success: true };
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(data), { status: 200 }));

    // After refreshAuth, getToken returns new token
    mockGetToken.mockReturnValue('fresh-token');

    const result = await apiFetch<{ success: boolean }>('/api/test');

    expect(result).toEqual(data);
    expect(mockRefreshAuth).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    // Second call should use fresh token
    const retryHeaders = mockFetch.mock.calls[1]?.[1]?.headers as Record<string, string>;
    expect(retryHeaders).toHaveProperty('Authorization', 'Bearer fresh-token');
  });

  it('does NOT retry on 401 if refreshAuth fails', async () => {
    mockGetToken.mockReturnValue('stale-token');
    mockRefreshAuth.mockRejectedValue(new Error('Auth failed'));
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValueOnce(new Response('Unauthorized', { status: 401, statusText: 'Unauthorized' }));

    await expect(apiFetch('/api/test')).rejects.toThrow('Auth failed');
    expect(mockFetch).toHaveBeenCalledTimes(1); // No retry
  });

  it('does NOT retry on non-401 errors', async () => {
    mockGetToken.mockReturnValue('token');
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValueOnce(new Response('Forbidden', { status: 403, statusText: 'Forbidden' }));

    await expect(apiFetch('/api/test')).rejects.toThrow('API error 403');
    expect(mockRefreshAuth).not.toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('does NOT retry on second 401 (no infinite loop)', async () => {
    mockGetToken.mockReturnValue('stale-token');
    mockRefreshAuth.mockResolvedValue('still-stale-token');
    const mockFetch = vi.mocked(globalThis.fetch);

    // Both calls return 401
    mockFetch.mockResolvedValueOnce(new Response('Unauthorized', { status: 401, statusText: 'Unauthorized' }));
    mockFetch.mockResolvedValueOnce(new Response('Unauthorized', { status: 401, statusText: 'Unauthorized' }));

    await expect(apiFetch('/api/test')).rejects.toThrow('API error 401');
    expect(mockRefreshAuth).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});

describe('apiFetch deduplication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearInflightRequests();
    mockGetToken.mockReturnValue('token');
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearInflightRequests();
  });

  function mockJsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      statusText: status === 200 ? 'OK' : 'Error',
      headers: { 'Content-Type': 'application/json' },
    });
  }

  it('dedup: two concurrent GET requests to the same URL share one fetch call', async () => {
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValue(mockJsonResponse({ data: 'hello' }));

    const p1 = apiFetch('/api/test');
    const p2 = apiFetch('/api/test');

    const [r1, r2] = await Promise.all([p1, p2]);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(r1).toEqual({ data: 'hello' });
    expect(r2).toEqual({ data: 'hello' });
  });

  it('dedup: a GET request after the first resolves fires a new fetch', async () => {
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValue(mockJsonResponse({ data: 'first' }));

    await apiFetch('/api/test');
    expect(mockFetch).toHaveBeenCalledTimes(1);

    mockFetch.mockResolvedValue(mockJsonResponse({ data: 'second' }));

    const result = await apiFetch('/api/test');
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ data: 'second' });
  });

  it('dedup: POST/PATCH/DELETE requests are never deduplicated', async () => {
    const mockFetch = vi.mocked(globalThis.fetch);
    // Use mockImplementation to return a fresh Response each call (body is single-use)
    mockFetch.mockImplementation(() =>
      Promise.resolve(mockJsonResponse({ ok: true })),
    );

    const p1 = apiFetch('/api/test', { method: 'POST', body: '{}' });
    const p2 = apiFetch('/api/test', { method: 'POST', body: '{}' });

    await Promise.all([p1, p2]);
    expect(mockFetch).toHaveBeenCalledTimes(2);

    // Also verify PATCH and DELETE
    mockFetch.mockClear();
    mockFetch.mockImplementation(() =>
      Promise.resolve(mockJsonResponse({ ok: true })),
    );

    const p3 = apiFetch('/api/test', { method: 'PATCH', body: '{}' });
    const p4 = apiFetch('/api/test', { method: 'DELETE' });

    await Promise.all([p3, p4]);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('dedup: if the shared promise rejects, all waiters receive the error and entry is cleaned', async () => {
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValue(mockJsonResponse(null, 500));

    const p1 = apiFetch('/api/fail');
    const p2 = apiFetch('/api/fail');

    await expect(p1).rejects.toThrow('API error 500');
    await expect(p2).rejects.toThrow('API error 500');

    // Entry should be cleaned up -- next call fires a fresh fetch
    mockFetch.mockResolvedValue(mockJsonResponse({ recovered: true }));
    const result = await apiFetch('/api/fail');
    expect(result).toEqual({ recovered: true });
    // 1 shared original + 1 new after cleanup
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('dedup: requests with different URLs are not deduplicated', async () => {
    const mockFetch = vi.mocked(globalThis.fetch);
    // Use mockImplementation to return a fresh Response each call
    mockFetch.mockImplementation(() =>
      Promise.resolve(mockJsonResponse({ data: 'a' })),
    );

    const p1 = apiFetch('/api/one');
    const p2 = apiFetch('/api/two');

    await Promise.all([p1, p2]);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
