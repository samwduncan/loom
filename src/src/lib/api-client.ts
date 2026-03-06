/**
 * API Client -- thin fetch wrapper with JWT auth header injection.
 *
 * Injects Authorization header from getToken(), throws on non-ok responses,
 * passes AbortSignal through for cancellation support.
 *
 * Constitution: Named exports only (2.2), no default export.
 */

import { getToken } from '@/lib/auth';

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  signal?: AbortSignal,
): Promise<T> {
  const token = getToken();
  const res = await fetch(path, {
    ...options,
    signal,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> | undefined),
    },
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}
