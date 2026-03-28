/**
 * Shell WebSocket client — manages connection to the /shell endpoint.
 *
 * Each terminal panel gets its own ShellWebSocketClient instance (not a
 * singleton like the chat WebSocketClient). No auto-reconnect -- the user
 * clicks Reconnect explicitly.
 *
 * Constitution: Named exports only (2.2), no default export, no React deps.
 */

import type {
  ShellConnectionState,
  ShellClientMessage,
  ShellServerMessage,
} from '@/types/shell';
import { resolveShellWsUrl } from '@/lib/platform';

export class ShellWebSocketClient {
  private ws: WebSocket | null = null;
  private _state: ShellConnectionState = 'disconnected';
  private lastParams: {
    projectPath: string;
    cols: number;
    rows: number;
  } | null = null;

  /**
   * Token getter — called fresh on each connect/restart so the token is
   * never stale. Set by the hook before connect().
   */
  getToken: (() => string | null) | null = null;

  // Callbacks — set by consumers before connect()
  onOutput: ((data: string) => void) | null = null;
  onAuthUrl: ((url: string, autoOpen: boolean) => void) | null = null;
  onStateChange: ((state: ShellConnectionState) => void) | null = null;

  /**
   * Current connection state.
   */
  get state(): ShellConnectionState {
    return this._state;
  }

  /**
   * Open a WebSocket connection to the /shell endpoint.
   */
  connect(params: {
    projectPath: string;
    cols: number;
    rows: number;
  }): void {
    // Clean up any existing connection
    if (this.ws) {
      this.disconnect();
    }

    const token = this.getToken?.();
    if (!token) {
      console.warn('[ShellWS] No auth token available');
      return;
    }

    this.lastParams = params;
    this.setState('connecting');

    // Token must be in the URL query string — the WebSocket API does not
    // support custom headers, and the backend's verifyClient reads the token
    // from searchParams during the upgrade handshake. This is standard
    // practice for WebSocket auth. The URL is not exposed in browser history
    // or Referer headers (WebSocket connections are not navigations).
    const url = resolveShellWsUrl(token);

    this.ws = new WebSocket(url);

    this.ws.addEventListener('open', this.handleOpen);
    this.ws.addEventListener('message', this.handleMessage);
    this.ws.addEventListener('close', this.handleClose);
    this.ws.addEventListener('error', this.handleError);
  }

  /**
   * Send terminal input data to the backend.
   */
  sendInput(data: string): void {
    this.send({ type: 'input', data });
  }

  /**
   * Notify backend of terminal resize.
   */
  sendResize(cols: number, rows: number): void {
    this.send({ type: 'resize', cols, rows });
  }

  /**
   * Cleanly close the WebSocket connection.
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.removeEventListener('open', this.handleOpen);
      this.ws.removeEventListener('message', this.handleMessage);
      this.ws.removeEventListener('close', this.handleClose);
      this.ws.removeEventListener('error', this.handleError);
      this.ws.close(1000);
      this.ws = null;
    }
    this.setState('disconnected');
  }

  /**
   * Disconnect and reconnect with the same parameters.
   * Fetches a fresh token via getToken(). No-ops if never connected.
   */
  restart(): boolean {
    const params = this.lastParams;
    this.disconnect();
    if (params) {
      this.connect(params);
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private setState(newState: ShellConnectionState): void {
    this._state = newState;
    this.onStateChange?.(newState);
  }

  private send(msg: ShellClientMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  private handleOpen = (): void => {
    this.setState('connected');

    if (this.lastParams) {
      const { projectPath, cols, rows } = this.lastParams;
      this.send({
        type: 'init',
        projectPath,
        isPlainShell: true,
        cols,
        rows,
      });
    }
  };

  private handleMessage = (event: MessageEvent): void => {
    let parsed: ShellServerMessage;
    try {
      parsed = JSON.parse(event.data as string) as ShellServerMessage;
    } catch {
      console.warn('[ShellWS] Failed to parse message:', event.data);
      return;
    }

    switch (parsed.type) {
      case 'output':
        this.onOutput?.(parsed.data);
        break;
      case 'auth_url':
        this.onAuthUrl?.(parsed.url, parsed.autoOpen);
        break;
    }
  };

  private handleClose = (): void => {
    this.ws = null;
    this.setState('disconnected');
  };

  private handleError = (): void => {
    // Close event will follow and handle state transition
  };
}
