/**
 * shell-input -- module-level register/deregister for shell WebSocket sendInput.
 *
 * Enables imperative cross-component terminal input without Zustand.
 * Terminal input is imperative (not reactive state), so a module-level
 * ref pattern (same as CodeEditor's _saveFn) is the right fit.
 *
 * TerminalPanel registers its sendInput on mount, deregisters on unmount.
 * Other components use sendToShell() to send commands to the terminal.
 *
 * Constitution: Named exports (2.2), no default export.
 */

let _sendInputFn: ((data: string) => void) | null = null;
const _pendingQueue: string[] = [];

/**
 * Register the shell's sendInput function (called by TerminalPanel on mount).
 * Drains any queued commands that arrived before the terminal connected.
 */
export function registerShellInput(fn: (data: string) => void): void {
  _sendInputFn = fn;
  // Drain pending commands
  while (_pendingQueue.length > 0) {
    const data = _pendingQueue.shift()!; // ASSERT: length > 0
    _sendInputFn(data);
  }
}

/**
 * Deregister the shell's sendInput function (called by TerminalPanel on unmount).
 * Clears any pending queued commands since the terminal is disconnecting.
 */
export function unregisterShellInput(): void {
  _sendInputFn = null;
  _pendingQueue.length = 0;
}

/**
 * Send data to the terminal. Returns true if sent immediately, false if queued.
 * When the terminal is not yet connected, data is queued and drained on registration.
 */
export function sendToShell(data: string): boolean {
  if (_sendInputFn) {
    _sendInputFn(data);
    return true;
  }
  _pendingQueue.push(data);
  return false;
}
