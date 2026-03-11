/**
 * useShellWebSocket — React hook wrapping ShellWebSocketClient.
 *
 * Manages WebSocket lifecycle and auth URL state.
 * Does NOT auto-connect on mount. Caller connects after xterm.open()
 * so terminal dimensions (cols/rows) are known.
 *
 * Constitution: Named exports only (2.2), no default export.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { ShellWebSocketClient } from '@/lib/shell-ws-client';
import { getToken } from '@/lib/auth';
import type { ShellConnectionState } from '@/types/shell';

interface UseShellWebSocketParams {
  projectPath: string;
}

interface UseShellWebSocketReturn {
  state: ShellConnectionState;
  sendInput: (data: string) => void;
  sendResize: (cols: number, rows: number) => void;
  connect: (cols: number, rows: number) => void;
  disconnect: () => void;
  restart: () => void;
  /** Single-slot callback setter. Only one consumer at a time — last call wins. */
  setOutputCallback: (callback: (data: string) => void) => void;
  authUrl: { url: string; autoOpen: boolean } | null;
  clearAuthUrl: () => void;
}

export function useShellWebSocket(
  params: UseShellWebSocketParams,
): UseShellWebSocketReturn {
  const { projectPath } = params;

  const clientRef = useRef<ShellWebSocketClient | null>(null);
  const [state, setState] = useState<ShellConnectionState>('disconnected');
  const [authUrl, setAuthUrl] = useState<{
    url: string;
    autoOpen: boolean;
  } | null>(null);

  // Initialize client once using null-check pattern (lint-safe for refs-during-render)
  if (clientRef.current == null) {
    clientRef.current = new ShellWebSocketClient();
  }

  // Wire up callbacks + token getter, cleanup on unmount
  useEffect(() => {
    const client = clientRef.current;
    if (!client) return;

    client.getToken = getToken;
    client.onStateChange = (newState) => {
      setState(newState);
    };
    client.onAuthUrl = (url, autoOpen) => {
      setAuthUrl({ url, autoOpen });
    };

    return () => {
      client.onStateChange = null;
      client.onAuthUrl = null;
      client.getToken = null;
      client.disconnect();
    };
  }, []);

  const connect = useCallback(
    (cols: number, rows: number) => {
      clientRef.current?.connect({
        projectPath,
        cols,
        rows,
      });
    },
    [projectPath],
  );

  const disconnect = useCallback(() => {
    clientRef.current?.disconnect();
  }, []);

  const restart = useCallback(() => {
    clientRef.current?.restart();
  }, []);

  const sendInput = useCallback((data: string) => {
    clientRef.current?.sendInput(data);
  }, []);

  const sendResize = useCallback((cols: number, rows: number) => {
    clientRef.current?.sendResize(cols, rows);
  }, []);

  const setOutputCallback = useCallback((callback: (data: string) => void) => {
    if (clientRef.current) {
      clientRef.current.onOutput = callback;
    }
  }, []);

  const clearAuthUrl = useCallback(() => {
    setAuthUrl(null);
  }, []);

  return {
    state,
    sendInput,
    sendResize,
    connect,
    disconnect,
    restart,
    setOutputCallback,
    authUrl,
    clearAuthUrl,
  };
}
