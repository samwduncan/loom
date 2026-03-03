import type { ConnectionState } from '../../../../contexts/WebSocketContext';

interface ConnectionStatusDotProps {
  state: ConnectionState;
}

/**
 * Small colored circle indicating WebSocket connection status.
 *
 * - Green (#6bbf59) when connected
 * - Amber (#d4a574) with pulse animation when reconnecting
 * - Red (#c15a4a) when disconnected
 */
export default function ConnectionStatusDot({ state }: ConnectionStatusDotProps) {
  const colors: Record<ConnectionState, string> = {
    connected: 'bg-[#6bbf59]',
    reconnecting: 'bg-[#d4a574]',
    disconnected: 'bg-[#c15a4a]',
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
