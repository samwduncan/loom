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

/**
 * Register the shell's sendInput function (called by TerminalPanel on mount).
 */
export function registerShellInput(fn: (data: string) => void): void {
  _sendInputFn = fn;
}

/**
 * Deregister the shell's sendInput function (called by TerminalPanel on unmount).
 */
export function unregisterShellInput(): void {
  _sendInputFn = null;
}

/**
 * Send data to the terminal. Returns true if terminal is connected, false otherwise.
 */
export function sendToShell(data: string): boolean {
  if (_sendInputFn) {
    _sendInputFn(data);
    return true;
  }
  return false;
}
