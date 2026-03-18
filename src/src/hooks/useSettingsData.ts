/**
 * Settings data hooks -- per-tab data fetching with abort cleanup and mutation support.
 *
 * Each hook returns { data, isLoading, error, refetch } plus domain-specific mutations.
 * Simple hooks use useFetch<T> for shared lifecycle; useAgentStatuses and useMcpServers
 * have custom fetch logic (Promise.all / response transform) so they inline the pattern.
 *
 * Constitution: Named exports (2.2), no default export.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '@/lib/api-client';
import type {
  ApiKeyResponse,
  CliAuthStatus,
  CredentialResponse,
  GitConfigResponse,
  McpConfigReadResponse,
  McpServer,
  ProviderStatus,
} from '@/types/settings';

// --- Generic fetch hook ---

interface FetchState<T> {
  data: T;
  isLoading: boolean;
  error: string | null;
}

/**
 * Generic fetch hook — handles abort, loading, error, and refetch for any endpoint.
 * Eliminates per-hook boilerplate; each settings hook calls this and adds mutations.
 */
function useFetch<T>(url: string, initial: T) {
  const [state, setState] = useState<FetchState<T>>({
    data: initial,
    isLoading: true,
    error: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  const refetch = useCallback(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    apiFetch<T>(url, {}, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setState({ data, isLoading: false, error: null });
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: err instanceof Error ? err.message : 'Fetch failed',
          }));
        }
      });
  }, [url]);

  useEffect(() => {
    refetch(); // eslint-disable-line react-hooks/set-state-in-effect -- Fetching external data is a valid effect use case
    return () => {
      abortRef.current?.abort();
    };
  }, [refetch]);

  return { ...state, refetch };
}

// --- Hooks ---

/** Fetches status from all 3 providers in parallel. Custom logic (Promise.all). */
export function useAgentStatuses() {
  const [state, setState] = useState<FetchState<ProviderStatus[]>>({
    data: [],
    isLoading: true,
    error: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  const refetch = useCallback(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    const providers = ['claude', 'codex', 'gemini'] as const;
    Promise.all(
      providers.map((p) =>
        apiFetch<CliAuthStatus>(`/api/cli/${p}/status`, {}, controller.signal)
          .then((res) => ({
            provider: p,
            authenticated: res.authenticated,
            email: res.email,
            error: res.error,
          }))
          .catch((err) => ({
            provider: p,
            authenticated: false,
            email: null,
            error: err instanceof Error ? err.message : 'Unknown error',
          })),
      ),
    )
      .then((statuses) => {
        if (!controller.signal.aborted) {
          setState({ data: statuses, isLoading: false, error: null });
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: err instanceof Error ? err.message : 'Fetch failed',
          }));
        }
      });
  }, []);

  useEffect(() => {
    refetch(); // eslint-disable-line react-hooks/set-state-in-effect -- Fetching external data
    return () => {
      abortRef.current?.abort();
    };
  }, [refetch]);

  return { ...state, refetch };
}

export function useApiKeys() {
  const { refetch, ...rest } = useFetch<ApiKeyResponse[]>('/api/settings/api-keys', []);

  const addKey = useCallback(
    async (keyName: string) => {
      await apiFetch('/api/settings/api-keys', {
        method: 'POST',
        body: JSON.stringify({ key_name: keyName }),
      });
      refetch();
    },
    [refetch],
  );

  const deleteKey = useCallback(
    async (id: number) => {
      await apiFetch(`/api/settings/api-keys/${id}`, { method: 'DELETE' });
      refetch();
    },
    [refetch],
  );

  const toggleKey = useCallback(
    async (id: number, isActive: boolean) => {
      await apiFetch(`/api/settings/api-keys/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: isActive ? 1 : 0 }),
      });
      refetch();
    },
    [refetch],
  );

  return { ...rest, refetch, addKey, deleteKey, toggleKey };
}

export function useCredentials() {
  const { refetch, ...rest } = useFetch<CredentialResponse[]>('/api/settings/credentials', []);

  const addCredential = useCallback(
    async (data: {
      credential_name: string;
      credential_type: string;
      credential_value: string;
      description?: string;
    }) => {
      await apiFetch('/api/settings/credentials', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      refetch();
    },
    [refetch],
  );

  const deleteCredential = useCallback(
    async (id: number) => {
      await apiFetch(`/api/settings/credentials/${id}`, { method: 'DELETE' });
      refetch();
    },
    [refetch],
  );

  return { ...rest, refetch, addCredential, deleteCredential };
}

export function useGitConfig() {
  const { refetch, ...rest } = useFetch<GitConfigResponse | null>('/api/user/git-config', null);

  const saveGitConfig = useCallback(
    async (gitName: string, gitEmail: string) => {
      await apiFetch('/api/user/git-config', {
        method: 'POST',
        body: JSON.stringify({ gitName, gitEmail }),
      });
      refetch();
    },
    [refetch],
  );

  return { ...rest, refetch, saveGitConfig };
}

/** MCP servers — custom logic (response transform: McpConfigReadResponse → McpServer[]). */
export function useMcpServers(provider: 'claude' | 'codex') {
  const endpoint =
    provider === 'claude' ? '/api/mcp/config/read' : '/api/codex/mcp/config/read';

  const [state, setState] = useState<FetchState<McpServer[]>>({
    data: [],
    isLoading: true,
    error: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  const refetch = useCallback(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    apiFetch<McpConfigReadResponse>(endpoint, {}, controller.signal)
      .then((res) => {
        if (!controller.signal.aborted) {
          setState({ data: res.servers, isLoading: false, error: null });
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: err instanceof Error ? err.message : 'Fetch failed',
          }));
        }
      });
  }, [endpoint]);

  useEffect(() => {
    refetch(); // eslint-disable-line react-hooks/set-state-in-effect -- Fetching external data
    return () => {
      abortRef.current?.abort();
    };
  }, [refetch]);

  const addServer = useCallback(
    async (data: {
      name: string;
      type: 'stdio' | 'http' | 'sse';
      config: Record<string, unknown>;
    }) => {
      const addEndpoint =
        provider === 'claude' ? '/api/mcp/config/add' : '/api/codex/mcp/config/add';
      await apiFetch(addEndpoint, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      refetch();
    },
    [provider, refetch],
  );

  const removeServer = useCallback(
    async (name: string) => {
      const removeEndpoint =
        provider === 'claude'
          ? '/api/mcp/config/remove'
          : '/api/codex/mcp/config/remove';
      await apiFetch(removeEndpoint, {
        method: 'DELETE',
        body: JSON.stringify({ name }),
      });
      refetch();
    },
    [provider, refetch],
  );

  return { ...state, refetch, addServer, removeServer };
}
