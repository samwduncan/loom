/**
 * Settings data hooks -- per-tab data fetching with abort cleanup and mutation support.
 *
 * Each hook returns { data, isLoading, error, refetch } plus domain-specific mutations.
 * All use apiFetch<T> with AbortController for unmount cleanup.
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

// --- Internal helpers ---

/** Default model display labels per provider (client-side, not from API). */
const PROVIDER_DEFAULT_MODELS: Record<string, string> = {
  claude: 'Sonnet',
  codex: 'GPT-5.3 Codex',
  gemini: 'Gemini 3.1 Pro',
};

interface FetchState<T> {
  data: T;
  isLoading: boolean;
  error: string | null;
}

function useFetchState<T>(initial: T) {
  const [state, setState] = useState<FetchState<T>>({
    data: initial,
    isLoading: true,
    error: null,
  });
  return { state, setState };
}

// --- Hooks ---

export function useAgentStatuses() {
  const { state, setState } = useFetchState<ProviderStatus[]>([]);
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
            defaultModel: PROVIDER_DEFAULT_MODELS[p],
          }))
          .catch((err) => ({
            provider: p,
            authenticated: false,
            email: null,
            error: err instanceof Error ? err.message : 'Unknown error',
            defaultModel: PROVIDER_DEFAULT_MODELS[p],
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
  }, [setState]);

  useEffect(() => {
    refetch();
    return () => {
      abortRef.current?.abort();
    };
  }, [refetch]);

  return { ...state, refetch };
}

export function useApiKeys() {
  const { state, setState } = useFetchState<ApiKeyResponse[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const refetch = useCallback(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    apiFetch<ApiKeyResponse[]>('/api/settings/api-keys', {}, controller.signal)
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
  }, [setState]);

  useEffect(() => {
    refetch();
    return () => {
      abortRef.current?.abort();
    };
  }, [refetch]);

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

  return { ...state, refetch, addKey, deleteKey, toggleKey };
}

export function useCredentials() {
  const { state, setState } = useFetchState<CredentialResponse[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const refetch = useCallback(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    apiFetch<CredentialResponse[]>('/api/settings/credentials', {}, controller.signal)
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
  }, [setState]);

  useEffect(() => {
    refetch();
    return () => {
      abortRef.current?.abort();
    };
  }, [refetch]);

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

  return { ...state, refetch, addCredential, deleteCredential };
}

export function useGitConfig() {
  const { state, setState } = useFetchState<GitConfigResponse | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const refetch = useCallback(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    apiFetch<GitConfigResponse>('/api/user/git-config', {}, controller.signal)
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
  }, [setState]);

  useEffect(() => {
    refetch();
    return () => {
      abortRef.current?.abort();
    };
  }, [refetch]);

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

  return { ...state, refetch, saveGitConfig };
}

export function useMcpServers(provider: 'claude' | 'codex') {
  const { state, setState } = useFetchState<McpServer[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const endpoint =
    provider === 'claude' ? '/api/mcp/config/read' : '/api/codex/mcp/config/read';

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
  }, [endpoint, setState]);

  useEffect(() => {
    refetch();
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
