/**
 * Connection hook -- subscribes to Zustand connection store for Claude provider.
 *
 * CRITICAL (A-2): ConnectionStore has `providers: Record<ProviderId, ProviderConnection>`,
 * NOT a flat `status` field. The correct access path is:
 *   state.providers.claude.status   (NOT state.status)
 *   state.providers.claude.error    (NOT state.error)
 *
 * Derives convenience booleans (isConnected, isReconnecting) from the raw status.
 */

import { useConnectionStore } from '../stores/index';
import type { ConnectionStatus } from '@loom/shared/types/provider';

export interface UseConnectionReturn {
  status: ConnectionStatus;
  isConnected: boolean;
  isReconnecting: boolean;
  error: string | null;
}

export function useConnection(): UseConnectionReturn {
  const status = useConnectionStore((state) => state.providers.claude.status);
  const error = useConnectionStore((state) => state.providers.claude.error);

  return {
    status,
    isConnected: status === 'connected',
    isReconnecting: status === 'reconnecting',
    error,
  };
}
