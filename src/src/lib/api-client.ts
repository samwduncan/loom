/**
 * API Client -- thin fetch wrapper with JWT auth header injection.
 *
 * Injects Authorization header from getToken(), throws on non-ok responses,
 * passes AbortSignal through for cancellation support.
 * Auto-retries once on 401 via refreshAuth() (token refresh + retry).
 *
 * Request deduplication: concurrent identical GET requests share a single
 * in-flight fetch via `inflightRequests` Map. Each consumer gets a cloned
 * Response so all can read the body. The map self-cleans in `.finally()`.
 * POST/PATCH/DELETE are never deduplicated (mutation safety).
 *
 * Constitution: Named exports only (2.2), no default export.
 */

import { getToken, refreshAuth } from '@/lib/auth';

/**
 * In-flight GET request deduplication map.
 * Key: request path. Value: the pending fetch Promise<Response>.
 * Cleaned up via .finally() when the promise settles.
 */
const inflightRequests = new Map<string, Promise<Response>>();

/** Exposed for test cleanup only -- not for production use. */
export function clearInflightRequests(): void {
  inflightRequests.clear();
}

/**
 * Process a Response: check status, parse JSON, throw on error.
 * Used by both the original caller and dedup waiters.
 */
async function processResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  signal?: AbortSignal,
): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();
  const isGet = method === 'GET';

  // Dedup: return existing in-flight promise for identical GET requests.
  // Each consumer clones the response so all can independently read the body.
  if (isGet) {
    const existing = inflightRequests.get(path);
    if (existing) {
      const cloned = await existing.then((r) => r.clone());
      return processResponse<T>(cloned);
    }
  }

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

  // For GET requests, store the fetch promise in the dedup map
  const fetchPromise = doFetch();
  if (isGet) {
    inflightRequests.set(path, fetchPromise);
    // Self-clean when settled (success or failure)
    fetchPromise.finally(() => {
      inflightRequests.delete(path);
    });
  }

  // Original caller also clones when dedup is active, so the stored
  // promise's Response stays unconsumed for other waiters.
  const res = isGet ? (await fetchPromise).clone() : await fetchPromise;

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

  return processResponse<T>(res);
}
