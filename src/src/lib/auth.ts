/**
 * Auth module -- JWT storage, retrieval, and auto-auth bootstrap (web platform).
 *
 * Exports webAuthProvider implementing the shared AuthProvider interface,
 * plus standalone functions for backward compatibility.
 *
 * Constitution: Named exports only (2.2), no default export.
 */

import type { AuthProvider } from '@loom/shared/lib/auth';
import { fetchAnon } from '@/lib/platform';

const TOKEN_KEY = 'loom-jwt';

/** In-flight refresh promise for deduplication of concurrent 401 retries. */
let refreshPromise: Promise<string> | null = null;

/**
 * Web AuthProvider implementation -- localStorage-based token storage.
 * Passed to shared API client and WebSocket client factories.
 */
export const webAuthProvider: AuthProvider = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
};

// Standalone functions for backward compatibility (used throughout web codebase)
export function getToken(): string | null {
  return webAuthProvider.getToken();
}

export function setToken(token: string): void {
  webAuthProvider.setToken(token);
}

export function clearToken(): void {
  webAuthProvider.clearToken();
}

/**
 * Force-refresh auth: clears the current token and re-bootstraps.
 * Deduplicates concurrent calls -- if a refresh is already in-flight,
 * subsequent calls return the same promise.
 */
export async function refreshAuth(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    clearToken();
    return bootstrapAuth();
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

/**
 * Auto-auth flow:
 * 1. Return existing token if one exists in localStorage.
 * 2. Check /api/auth/status -- if needsSetup, POST /api/auth/register.
 * 3. Otherwise POST /api/auth/login.
 * 4. On login failure, throw for fallback UI.
 *
 * Credentials default to env vars with hardcoded fallbacks (single-user dev tool).
 */
export async function bootstrapAuth(): Promise<string> {
  const existing = getToken();
  if (existing) return existing;

  // Platform mode: skip real auth, server doesn't validate tokens
  if (import.meta.env.VITE_IS_PLATFORM === 'true') {
    const platformToken = 'platform-mode';
    setToken(platformToken);
    return platformToken;
  }

  const username = import.meta.env.VITE_AUTH_USERNAME;
  const password = import.meta.env.VITE_AUTH_PASSWORD;

  if (!username || !password) {
    throw new Error(
      'VITE_AUTH_USERNAME and VITE_AUTH_PASSWORD must be set in environment',
    );
  }

  const statusRes = await fetchAnon('/api/auth/status');
  const status = (await statusRes.json()) as { needsSetup: boolean }; // ASSERT: /api/auth/status returns { needsSetup }

  if (status.needsSetup) {
    const res = await fetchAnon('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      throw new Error('Auto-registration failed');
    }
    const data = (await res.json()) as { token: string }; // ASSERT: register endpoint returns { token } on success
    setToken(data.token);
    return data.token;
  }

  const res = await fetchAnon('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    throw new Error('Auto-auth failed -- manual login required');
  }

  const data = (await res.json()) as { token: string }; // ASSERT: login endpoint returns { token } on success
  setToken(data.token);
  return data.token;
}
