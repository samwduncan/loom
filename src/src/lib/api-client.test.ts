/**
 * API Client tests -- verifies auth header injection, error handling, and AbortSignal passthrough.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiFetch } from './api-client';

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

  it('passes AbortSignal through to fetch', async () => {
    mockGetToken.mockReturnValue('token');
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
    const controller = new AbortController();

    await apiFetch('/api/test', {}, controller.signal);

    expect(mockFetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
      signal: controller.signal,
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
