/**
 * API Client factory -- fetch wrapper with JWT auth, deduplication, and 401 retry.
 *
 * Platform-agnostic: accepts injected auth provider, URL resolver, and optional
 * auth refresh callback. No import.meta.env, no localStorage, no window refs.
 *
 * Request deduplication: concurrent identical GET requests share a single
 * in-flight fetch. Each consumer gets a cloned Response so all can read
 * the body. The map self-cleans in `.finally()`.
 *
 * Dedup safety:
 * - AbortSignal is NOT passed into the shared fetch (secondary callers'
 *   signals must not abort the shared request). Instead, each caller's
 *   signal is checked after the shared fetch resolves.
 * - 401 handling runs for the original caller; deduped callers who see
 *   a 401 clone trigger their own refresh+retry cycle.
 */

import type { AuthProvider } from './auth';

export interface ApiClientOptions {
  auth: AuthProvider;
  resolveUrl: (path: string) => string;
  onAuthRefresh?: () => Promise<string | null>;
}

export interface ApiClient {
  apiFetch: <T>(path: string, options?: RequestInit, signal?: AbortSignal) => Promise<T>;
  clearInflightRequests: () => void;
}

export function createApiClient(options: ApiClientOptions): ApiClient {
  const { auth, resolveUrl, onAuthRefresh } = options;

  /**
   * In-flight GET request deduplication map.
   * Key: request path. Value: the pending fetch Promise<Response>.
   * Cleaned up via .finally() when the promise settles.
   */
  const inflightRequests = new Map<string, Promise<Response>>();

  /** Exposed for test cleanup only -- not for production use. */
  function clearInflightRequests(): void {
    inflightRequests.clear();
  }

  /**
   * Process a Response: check status, parse JSON, throw on error.
   */
  async function processResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
      throw new Error(`API error ${res.status}: ${res.statusText}`);
    }
    return res.json() as Promise<T>;
  }

  /**
   * Single-attempt fetch with current auth token.
   * Signal is optional -- deduped requests omit it so one caller can't abort another.
   */
  function doFetch(path: string, fetchOpts: RequestInit, signal?: AbortSignal): Promise<Response> {
    const token = auth.getToken();
    return fetch(resolveUrl(path), {
      ...fetchOpts,
      signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(fetchOpts.headers as Record<string, string> | undefined),
      },
    });
  }

  /**
   * Handle 401 by refreshing auth and retrying once.
   */
  async function handleUnauthorized<T>(path: string, fetchOpts: RequestInit, signal?: AbortSignal): Promise<T> {
    if (!onAuthRefresh) {
      throw new Error('API error 401: Unauthorized');
    }
    await onAuthRefresh();
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }
    const retryRes = await doFetch(path, fetchOpts, signal);
    if (!retryRes.ok) {
      throw new Error(`API error ${retryRes.status}: ${retryRes.statusText}`);
    }
    return retryRes.json() as Promise<T>;
  }

  async function apiFetch<T>(
    path: string,
    fetchOpts: RequestInit = {},
    signal?: AbortSignal,
  ): Promise<T> {
    const method = (fetchOpts.method ?? 'GET').toUpperCase();
    const isGet = method === 'GET';

    // Dedup: join existing in-flight GET request.
    // The shared fetch has NO abort signal -- individual callers check their own signal after.
    if (isGet) {
      const existing = inflightRequests.get(path);
      if (existing) {
        // Check caller's own signal before waiting
        if (signal?.aborted) {
          throw new DOMException('Aborted', 'AbortError');
        }
        try {
          const cloned = await existing.then((r) => r.clone());
          // Check caller's signal after await
          if (signal?.aborted) {
            throw new DOMException('Aborted', 'AbortError');
          }
          // Handle 401 for deduped callers too
          if (cloned.status === 401) {
            return handleUnauthorized<T>(path, fetchOpts, signal);
          }
          return processResponse<T>(cloned);
        } catch (err) {
          // If the shared request was aborted by someone else, retry with our own signal
          if (err instanceof DOMException && err.name === 'AbortError' && !signal?.aborted) {
            return apiFetch<T>(path, fetchOpts, signal);
          }
          throw err;
        }
      }
    }

    // For GET requests, create a shared fetch WITHOUT signal (dedup-safe).
    // For mutations, pass signal through normally.
    const fetchPromise = isGet
      ? doFetch(path, fetchOpts) // No signal -- shared across callers
      : doFetch(path, fetchOpts, signal);

    if (isGet) {
      inflightRequests.set(path, fetchPromise);
      fetchPromise.finally(() => {
        inflightRequests.delete(path);
      });
    }

    // Check caller's signal before waiting
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    const res = isGet ? (await fetchPromise).clone() : await fetchPromise;

    // Check caller's signal after await
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    if (res.status === 401) {
      return handleUnauthorized<T>(path, fetchOpts, signal);
    }

    return processResponse<T>(res);
  }

  return { apiFetch, clearInflightRequests };
}
