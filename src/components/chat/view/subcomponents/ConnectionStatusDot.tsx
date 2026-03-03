import type { ConnectionState } from '../../../../contexts/WebSocketContext';

interface ConnectionStatusDotProps {
  state: ConnectionState;
}

/**
 * Small colored circle indicating WebSocket connection status.
 *
 * - Green (status-connected) when connected
 * - Amber (status-reconnecting) with pulse animation when reconnecting
 * - Red (status-disconnected) when disconnected
 */
export default function ConnectionStatusDot({ state }: ConnectionStatusDotProps) {
  const colors: Record<ConnectionState, string> = {
    connected: 'bg-status-connected',
    reconnecting: 'bg-status-reconnecting',
    disconnected: 'bg-status-disconnected',
  };

  const pulseClass = state === 'reconnecting' ? 'animate-pulse' : '';

  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${colors[state]} ${pulseClass} transition-colors duration-300`}
      title={`Connection: ${state}`}
      role="status"
      aria-label={`Connection status: ${state}`}
    />
  );
}
