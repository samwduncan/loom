/**
 * API Client -- thin fetch wrapper with JWT auth header injection.
 *
 * Injects Authorization header from getToken(), throws on non-ok responses,
 * passes AbortSignal through for cancellation support.
 * Auto-retries once on 401 via refreshAuth() (token refresh + retry).
 *
 * Constitution: Named exports only (2.2), no default export.
 */

import { getToken, refreshAuth } from '@/lib/auth';

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  signal?: AbortSignal,
): Promise<T> {
  const doFetch = () => {
    const token = getToken();
    return fetch(path, {
      ...options,
      signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers as Record<string, string> | undefined),
      },
    });
  };

  const res = await doFetch();

  if (res.status === 401) {
    // Attempt token refresh and retry once
    await refreshAuth();
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }
    const retryRes = await doFetch();
    if (!retryRes.ok) {
      throw new Error(`API error ${retryRes.status}: ${retryRes.statusText}`);
    }
    return retryRes.json() as Promise<T>;
  }

  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}
