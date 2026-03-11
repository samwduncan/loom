/**
 * TerminalPanel -- composing container for terminal header, view, and overlay.
 *
 * Owns the useShellWebSocket hook and useProjectContext, wires props
 * down to child components. This is the lazy-loaded entry point from
 * ContentArea.
 *
 * Constitution: Named export (2.2), cn() (3.6), selector-only store (4.2).
 */

import { useRef, useCallback } from 'react';
import { useShellWebSocket } from '@/hooks/useShellWebSocket';
import { useProjectContext } from '@/hooks/useProjectContext';
import { TerminalHeader } from './TerminalHeader';
import { TerminalView } from './TerminalView';
import { TerminalOverlay } from './TerminalOverlay';

export const TerminalPanel = function TerminalPanel() {
  const { projectName } = useProjectContext();

  const writeRef = useRef<((data: string) => void) | null>(null);

  const {
    state,
    sendInput,
    sendResize,
    connect,
    disconnect,
    restart,
    onOutput,
    authUrl,
    clearAuthUrl,
  } = useShellWebSocket({ projectPath: projectName });

  // When terminal is ready: store write fn, wire output, and connect WS
  const handleReady = useCallback(
    (write: (data: string) => void, cols: number, rows: number) => {
      writeRef.current = write;
      onOutput((data: string) => {
        writeRef.current?.(data);
      });
      connect(cols, rows);
    },
    [onOutput, connect],
  );

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
    <div className="flex h-full flex-col">
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
