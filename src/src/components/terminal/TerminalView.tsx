/**
 * TerminalView -- xterm.js terminal instance with resize and input wiring.
 *
 * Manages the xterm.js Terminal lifecycle: mount, open, fit, dispose.
 * Parent (TerminalPanel) owns the WebSocket hook and passes callbacks.
 *
 * Props pattern:
 *   onData: user keystrokes -> parent routes to sendInput
 *   onResize: terminal resized -> parent routes to sendResize
 *   onReady: terminal opened -> parent gets write fn + initial dims, connects WS
 *
 * Constitution: Named export (2.2), cn() (3.6), design tokens (3.1).
 */

import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { getTerminalTheme } from './terminal-theme';
import { useUIStore } from '@/stores/ui';
import './styles/terminal.css';

interface TerminalViewProps {
  /** Called when user types in the terminal */
  onData: (data: string) => void;
  /** Called when terminal dimensions change */
  onResize: (cols: number, rows: number) => void;
  /** Called after terminal.open() + fit() with write fn and initial dimensions */
  onReady: (write: (data: string) => void, cols: number, rows: number) => void;
}

export const TerminalView = function TerminalView({
  onData,
  onResize,
  onReady,
}: TerminalViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const activeTab = useUIStore((s) => s.activeTab);
  const codeFontFamily = useUIStore((s) => s.theme.codeFontFamily);

  // Stable refs for callbacks to avoid effect re-runs
  const onDataRef = useRef(onData);
  const onResizeRef = useRef(onResize);
  const onReadyRef = useRef(onReady);
  onDataRef.current = onData;
  onResizeRef.current = onResize;
  onReadyRef.current = onReady;

  // Mount: create Terminal, load addons, open, fit, wire callbacks
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const terminal = new Terminal({
      fontSize: 14,
      fontFamily: codeFontFamily || 'JetBrains Mono',
      cursorBlink: true,
      scrollback: 5000,
      theme: getTerminalTheme(),
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);
    terminal.open(container);
    fitAddon.fit();

    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Wire user input
    const dataDisposable = terminal.onData((data) => {
      onDataRef.current(data);
    });

    // Notify parent that terminal is ready
    onReadyRef.current(
      terminal.write.bind(terminal),
      terminal.cols,
      terminal.rows,
    );

    // ResizeObserver with debounce for container size changes
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const observer = new ResizeObserver(() => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        // Only fit when visible (offsetParent is null when display:none / hidden)
        if (container.offsetParent !== null && fitAddonRef.current) {
          fitAddonRef.current.fit();
          if (terminalRef.current) {
            onResizeRef.current(
              terminalRef.current.cols,
              terminalRef.current.rows,
            );
          }
        }
      }, 100);
    });
    observer.observe(container);

    return () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      observer.disconnect();
      dataDisposable.dispose();
      terminal.dispose();
      terminalRef.current = null;
      fitAddonRef.current = null;
    };
    // codeFontFamily intentionally excluded -- terminal font set at creation time
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fit when Shell tab becomes active (container goes from hidden to visible)
  useEffect(() => {
    if (activeTab !== 'shell') return;

    // setTimeout 0 allows browser to compute layout after display change
    const timer = setTimeout(() => {
      if (
        containerRef.current?.offsetParent !== null &&
        fitAddonRef.current &&
        terminalRef.current
      ) {
        fitAddonRef.current.fit();
        onResizeRef.current(
          terminalRef.current.cols,
          terminalRef.current.rows,
        );
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [activeTab]);

  return (
    <div
      ref={containerRef}
      className="terminal-container"
      data-testid="terminal-container"
    />
  );
};
