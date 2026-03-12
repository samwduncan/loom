/**
 * TerminalPanel -- composing container for terminal header, view, and overlay.
 *
 * Owns the useShellWebSocket hook and useProjectContext, wires props
 * down to child components. This is the lazy-loaded entry point from
 * ContentArea.
 *
 * Constitution: Named export (2.2), cn() (3.6), selector-only store (4.2).
 */

import { useRef, useCallback, useEffect } from 'react';
import { useShellWebSocket } from '@/hooks/useShellWebSocket';
import { useProjectContext } from '@/hooks/useProjectContext';
import { registerShellInput, unregisterShellInput } from '@/lib/shell-input';
import { TerminalHeader } from './TerminalHeader';
import { TerminalView } from './TerminalView';
import { TerminalOverlay } from './TerminalOverlay';

export const TerminalPanel = function TerminalPanel() {
  const { projectPath, isLoading } = useProjectContext();

  const writeRef = useRef<((data: string) => void) | null>(null);
  const dimsRef = useRef<{ cols: number; rows: number } | null>(null);
  const hasConnectedRef = useRef(false);

  const {
    state,
    sendInput,
    sendResize,
    connect,
    disconnect,
    restart,
    setOutputCallback,
    authUrl,
    clearAuthUrl,
  } = useShellWebSocket({ projectPath });

  // When terminal is ready: store write fn, wire output, and connect WS
  const handleReady = useCallback(
    (write: (data: string) => void, cols: number, rows: number) => {
      writeRef.current = write;
      dimsRef.current = { cols, rows };
      setOutputCallback((data: string) => {
        writeRef.current?.(data);
      });

      // Connect immediately if project path is already available
      if (!isLoading && projectPath) {
        connect(cols, rows);
        hasConnectedRef.current = true;
      }
    },
    [setOutputCallback, connect, isLoading, projectPath],
  );

  // Auto-connect when project path resolves after terminal is ready
  useEffect(() => {
    if (!isLoading && projectPath && dimsRef.current && !hasConnectedRef.current) {
      connect(dimsRef.current.cols, dimsRef.current.rows);
      hasConnectedRef.current = true;
    }
  }, [isLoading, projectPath, connect]);

  // Register sendInput for cross-component terminal access
  useEffect(() => {
    registerShellInput(sendInput);
    return () => unregisterShellInput();
  }, [sendInput]);

  // User keystrokes from terminal -> WS
  const handleData = useCallback(
    (data: string) => {
      sendInput(data);
    },
    [sendInput],
  );

  // Terminal resize -> WS
  const handleResize = useCallback(
    (cols: number, rows: number) => {
      sendResize(cols, rows);
    },
    [sendResize],
  );

  return (
    <div data-terminal="" className="flex h-full flex-col">
      <TerminalHeader
        state={state}
        onRestart={restart}
        onDisconnect={disconnect}
      />
      <div className="relative flex-1 min-h-0">
        <TerminalView
          onData={handleData}
          onResize={handleResize}
          onReady={handleReady}
        />
        <TerminalOverlay
          visible={state === 'disconnected'}
          onReconnect={restart}
          authUrl={authUrl}
          onDismissAuth={clearAuthUrl}
        />
      </div>
    </div>
  );
};
