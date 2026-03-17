/**
 * Auth module tests — JWT storage and auto-auth bootstrap flow.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getToken, setToken, clearToken, bootstrapAuth, refreshAuth } from '@/lib/auth';

// ---------------------------------------------------------------------------
// Mock localStorage
// ---------------------------------------------------------------------------
const mockStorage = new Map<string, string>();

const localStorageMock: Storage = {
  getItem: vi.fn((key: string) => mockStorage.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => {
    mockStorage.set(key, value);
  }),
  removeItem: vi.fn((key: string) => {
    mockStorage.delete(key);
  }),
  clear: vi.fn(() => mockStorage.clear()),
  get length() {
    return mockStorage.size;
  },
  key: vi.fn(() => null),
};

// ---------------------------------------------------------------------------
// Mock fetch
// ---------------------------------------------------------------------------
const mockFetch = vi.fn<(input: string | URL | Request, init?: RequestInit) => Promise<Response>>();

beforeEach(() => {
  vi.stubGlobal('localStorage', localStorageMock);
  vi.stubGlobal('fetch', mockFetch);
  import.meta.env.VITE_AUTH_USERNAME = 'admin';
  import.meta.env.VITE_AUTH_PASSWORD = 'admin123';
  mockStorage.clear();
  vi.clearAllMocks();
});

afterEach(() => {
  delete import.meta.env.VITE_AUTH_USERNAME;
  delete import.meta.env.VITE_AUTH_PASSWORD;
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// getToken / setToken / clearToken
// ---------------------------------------------------------------------------
describe('token storage', () => {
  it('getToken returns null when no token stored', () => {
    expect(getToken()).toBeNull();
  });

  it('setToken stores and getToken retrieves', () => {
    setToken('test-jwt-123');
    expect(getToken()).toBe('test-jwt-123');
  });

  it('clearToken removes stored token', () => {
    setToken('test-jwt-123');
    clearToken();
    expect(getToken()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// bootstrapAuth
// ---------------------------------------------------------------------------
describe('bootstrapAuth', () => {
  it('returns existing token without fetching', async () => {
    setToken('existing-token');

    const token = await bootstrapAuth();

    expect(token).toBe('existing-token');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('auto-registers when needsSetup is true', async () => {
    // Mock /api/auth/status
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ needsSetup: true }), { status: 200 }),
    );
    // Mock /api/auth/register
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ token: 'new-register-token' }), {
        status: 200,
      }),
    );

    const token = await bootstrapAuth();

    expect(token).toBe('new-register-token');
    expect(getToken()).toBe('new-register-token');

    // Verify register was called with correct body
    const registerCall = mockFetch.mock.calls[1];
    expect(registerCall?.[0]).toBe('/api/auth/register');
    const body = JSON.parse(registerCall?.[1]?.body as string) as {
      username: string;
      password: string;
    };
    expect(body.username).toBe('admin');
    expect(body.password).toBe('admin123');
  });

  it('auto-logins when setup already done', async () => {
    // Mock /api/auth/status
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ needsSetup: false }), { status: 200 }),
    );
    // Mock /api/auth/login
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ token: 'login-token' }), { status: 200 }),
    );

    const token = await bootstrapAuth();

    expect(token).toBe('login-token');
    expect(getToken()).toBe('login-token');

    // Verify login was called
    const loginCall = mockFetch.mock.calls[1];
    expect(loginCall?.[0]).toBe('/api/auth/login');
  });

  it('throws when env credentials are missing', async () => {
    delete import.meta.env.VITE_AUTH_USERNAME;
    delete import.meta.env.VITE_AUTH_PASSWORD;

    await expect(bootstrapAuth()).rejects.toThrow(
      'VITE_AUTH_USERNAME and VITE_AUTH_PASSWORD must be set',
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('throws on failed login', async () => {
    // Mock /api/auth/status
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ needsSetup: false }), { status: 200 }),
    );
    // Mock /api/auth/login failure
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
      }),
    );

    await expect(bootstrapAuth()).rejects.toThrow(
      'Auto-auth failed -- manual login required',
    );
    expect(getToken()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// refreshAuth
// ---------------------------------------------------------------------------
describe('refreshAuth', () => {
  it('clears existing token and re-bootstraps', async () => {
    setToken('stale-token');

    // Mock /api/auth/status
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ needsSetup: false }), { status: 200 }),
    );
    // Mock /api/auth/login
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ token: 'fresh-token' }), { status: 200 }),
    );

    const token = await refreshAuth();

    expect(token).toBe('fresh-token');
    expect(getToken()).toBe('fresh-token');
    // clearToken was called (localStorage.removeItem)
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('loom-jwt');
  });

  it('throws after bootstrapAuth fails (no infinite loop)', async () => {
    setToken('stale-token');

    // Mock /api/auth/status
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ needsSetup: false }), { status: 200 }),
    );
    // Mock /api/auth/login failure
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'fail' }), { status: 401 }),
    );

    await expect(refreshAuth()).rejects.toThrow();
  });

  it('deduplicates concurrent calls (single in-flight promise)', async () => {
    setToken('stale-token');

    let resolveStatus: ((v: Response) => void) | null = null;
    // First call to /api/auth/status will block
    mockFetch.mockImplementationOnce(
      () => new Promise<Response>((resolve) => { resolveStatus = resolve; }),
    );

    // Start two concurrent refreshAuth calls
    const p1 = refreshAuth();
    const p2 = refreshAuth();

    // Both should share the same promise -- only 1 fetch call so far
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Now resolve the status call
    resolveStatus!(new Response(JSON.stringify({ needsSetup: false }), { status: 200 })); // ASSERT: resolveStatus is set by mockImplementationOnce callback above

    // Mock login response
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ token: 'deduped-token' }), { status: 200 }),
    );

    const [t1, t2] = await Promise.all([p1, p2]);
    expect(t1).toBe('deduped-token');
    expect(t2).toBe('deduped-token');
  });
});
