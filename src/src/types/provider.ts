/**
 * Provider types — ProviderId union and connection state for all AI providers.
 *
 * ProviderId is the single source of truth for supported providers across the
 * entire V2 codebase. In M1, only 'claude' is actively used; M4 activates
 * codex and gemini.
 */

export type ProviderId = 'claude' | 'codex' | 'gemini';

export interface ProviderContext {
  providerId: ProviderId;
  modelId: string;
  agentName: string | null;
}

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting';

export interface ProviderConnection {
  status: ConnectionStatus;
  lastConnected: string | null;
  reconnectAttempts: number;
  error: string | null;
  modelId: string | null;
}
