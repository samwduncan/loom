/**
 * Connection Store — WebSocket and provider connection state.
 *
 * Tracks connection status for all three providers (claude, codex, gemini).
 * In M1, only claude is actively used. M4 activates the others.
 *
 * Uses Persist middleware for model selection only. Live connection status,
 * errors, and reconnect attempts are always ephemeral.
 *
 * Constitution: Selector-only access (4.2), named actions (4.5), no default export (2.2).
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ConnectionStatus,
  ProviderId,
  ProviderConnection,
} from '@/types/provider';

interface ConnectionState {
  // Data
  providers: Record<ProviderId, ProviderConnection>;

  // Actions
  updateProviderStatus: (
    providerId: ProviderId,
    status: ConnectionStatus,
  ) => void;
  setProviderError: (providerId: ProviderId, error: string | null) => void;
  setProviderModel: (providerId: ProviderId, modelId: string | null) => void;
  incrementReconnectAttempts: (providerId: ProviderId) => void;
  resetReconnectAttempts: (providerId: ProviderId) => void;
  connect: (providerId: ProviderId) => void;
  disconnect: (providerId: ProviderId) => void;
  reset: () => void;
}

const DEFAULT_PROVIDER_CONNECTION: ProviderConnection = {
  status: 'disconnected',
  lastConnected: null,
  reconnectAttempts: 0,
  error: null,
  modelId: null,
};

const INITIAL_PROVIDERS: Record<ProviderId, ProviderConnection> = {
  claude: { ...DEFAULT_PROVIDER_CONNECTION },
  codex: { ...DEFAULT_PROVIDER_CONNECTION },
  gemini: { ...DEFAULT_PROVIDER_CONNECTION },
};

export const useConnectionStore = create<ConnectionState>()(
  persist(
    (set) => ({
      providers: {
        claude: { ...DEFAULT_PROVIDER_CONNECTION },
        codex: { ...DEFAULT_PROVIDER_CONNECTION },
        gemini: { ...DEFAULT_PROVIDER_CONNECTION },
      },

      updateProviderStatus: (
        providerId: ProviderId,
        status: ConnectionStatus,
      ) => {
        set((state) => ({
          providers: {
            ...state.providers,
            [providerId]: {
              ...state.providers[providerId],
              status,
              ...(status === 'connected'
                ? { lastConnected: new Date().toISOString() }
                : {}),
            },
          },
        }));
      },

      setProviderError: (providerId: ProviderId, error: string | null) => {
        set((state) => ({
          providers: {
            ...state.providers,
            [providerId]: {
              ...state.providers[providerId],
              error,
            },
          },
        }));
      },

      setProviderModel: (providerId: ProviderId, modelId: string | null) => {
        set((state) => ({
          providers: {
            ...state.providers,
            [providerId]: {
              ...state.providers[providerId],
              modelId,
            },
          },
        }));
      },

      incrementReconnectAttempts: (providerId: ProviderId) => {
        set((state) => ({
          providers: {
            ...state.providers,
            [providerId]: {
              ...state.providers[providerId],
              reconnectAttempts:
                (state.providers[providerId].reconnectAttempts ?? 0) + 1,
            },
          },
        }));
      },

      resetReconnectAttempts: (providerId: ProviderId) => {
        set((state) => ({
          providers: {
            ...state.providers,
            [providerId]: {
              ...state.providers[providerId],
              reconnectAttempts: 0,
            },
          },
        }));
      },

      connect: (providerId: ProviderId) => {
        set((state) => ({
          providers: {
            ...state.providers,
            [providerId]: {
              ...state.providers[providerId],
              status: 'connecting' as ConnectionStatus,
              error: null,
              reconnectAttempts: 0,
            },
          },
        }));
      },

      disconnect: (providerId: ProviderId) => {
        set((state) => ({
          providers: {
            ...state.providers,
            [providerId]: {
              ...state.providers[providerId],
              status: 'disconnected' as ConnectionStatus,
            },
          },
        }));
      },

      reset: () => {
        set({
          providers: {
            claude: { ...INITIAL_PROVIDERS.claude },
            codex: { ...INITIAL_PROVIDERS.codex },
            gemini: { ...INITIAL_PROVIDERS.gemini },
          },
        });
      },
    }),
    {
      name: 'loom-connection',
      version: 1,
      partialize: (state) => ({
        // Persist model selections only. Status/error/reconnect are ephemeral.
        providers: {
          claude: { modelId: state.providers.claude.modelId },
          codex: { modelId: state.providers.codex.modelId },
          gemini: { modelId: state.providers.gemini.modelId },
        },
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as {
          providers?: Partial<
            Record<ProviderId, Partial<ProviderConnection>>
          >;
        };
        // Deep-merge providers so partialize'd modelId doesn't clobber
        // ephemeral fields (status, reconnectAttempts, error, etc.)
        return {
          ...currentState,
          providers: {
            claude: {
              ...currentState.providers.claude,
              ...(persisted.providers?.claude ?? {}),
            },
            codex: {
              ...currentState.providers.codex,
              ...(persisted.providers?.codex ?? {}),
            },
            gemini: {
              ...currentState.providers.gemini,
              ...(persisted.providers?.gemini ?? {}),
            },
          },
        };
      },
      migrate: (persistedState: unknown, _version: number) => {
        // Version 1: initial schema, no migration needed
        return persistedState as {
          providers: Record<ProviderId, { modelId: string | null }>;
        };
      },
    },
  ),
);
