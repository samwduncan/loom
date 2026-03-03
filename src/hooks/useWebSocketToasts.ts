import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useWebSocket } from '../contexts/WebSocketContext';
import type { ConnectionState } from '../contexts/WebSocketContext';

/**
 * Fires toast notifications on WebSocket connection state transitions.
 * - Reconnect -> success toast ("Connection restored")
 * - Disconnect/reconnecting -> warning toast ("Connection lost. Reconnecting...")
 * - Initial connection -> no toast (only re-connections)
 * - 1s debounce prevents toast spam on flaky connections
 */
export function useWebSocketToasts() {
  const { connectionState } = useWebSocket();
  const prevStateRef = useRef<ConnectionState>(connectionState);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const hasEverConnectedRef = useRef(false);

  useEffect(() => {
    const prev = prevStateRef.current;
    prevStateRef.current = connectionState;

    // Track if we've ever been connected (skip initial connect toast)
    if (connectionState === 'connected') {
      const wasConnected = hasEverConnectedRef.current;
      hasEverConnectedRef.current = true;

      // Only toast on RE-connection, not initial connection
      if (!wasConnected) return;
    }

    // Skip if no actual state change
    if (prev === connectionState) return;

    // Clear any pending debounced toast
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce to prevent rapid-fire toasts on flaky connections
    debounceRef.current = setTimeout(() => {
      if (connectionState === 'connected' && prev !== 'connected') {
        toast.success('Connection restored', { duration: 2000 });
      } else if (connectionState === 'reconnecting') {
        toast.warning('Connection lost. Reconnecting...', { duration: 4000 });
      }
    }, 1000);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [connectionState]);
}
