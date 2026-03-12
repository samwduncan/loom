/**
 * WebSocket client singleton — class-based connection manager with reconnection
 * state machine, content stream subscription, and stream backlog buffer.
 *
 * Zero React imports. Updates connection store via injected callbacks
 * (configure method). Components read state from Zustand stores, send
 * messages via wsClient.send().
 *
 * Constitution: Named exports only (2.2), no default export, no React deps.
 */

import type { ServerMessage, ClientMessage } from '@/types/websocket';
import { isServerMessage } from '@/types/websocket';

export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting';

interface WebSocketClientCallbacks {
  onMessage: (msg: ServerMessage) => void;
  onStateChange: (state: ConnectionState) => void;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private state: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private token: string | null = null;
  private readonly maxReconnectDelay = 30_000;

  // Callback injection -- set once during app init
  private onMessageCb: ((msg: ServerMessage) => void) | null = null;
  private onStateChangeCb: ((state: ConnectionState) => void) | null = null;

  // Content stream subscribers (Phase 6 hooks subscribe here)
  private contentListeners: Set<(token: string) => void> = new Set();

  // Stream backlog buffer -- accumulates tokens when no listeners subscribed
  private streamBuffer: string[] = [];
  private isStreamActive = false;

  /**
   * Set callbacks for message handling and state change notifications.
   * Called once during app initialization.
   */
  configure(callbacks: WebSocketClientCallbacks): void {
    this.onMessageCb = callbacks.onMessage;
    this.onStateChangeCb = callbacks.onStateChange;
  }

  /**
   * Open a WebSocket connection. Builds URL from window.location.
   */
  connect(token: string): void {
    this.token = token;
    this.setState('connecting');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${window.location.host}/ws?token=${token}`;

    this.ws = new WebSocket(url);
    this.ws.onopen = () => this.handleOpen();
    this.ws.onclose = (event) => this.handleClose(event);
    this.ws.onerror = () => this.handleError();
    this.ws.onmessage = (event) => this.handleMessage(event);
  }

  /**
   * Attempt to reconnect using the stored token.
   * No-op if no token is stored (never connected before).
   * Used by ConnectionBanner's manual reconnect button.
   */
  tryReconnect(): void {
    if (!this.token) return;
    this.reconnect();
  }

  /**
   * Cleanly close the WebSocket connection. Clears reconnection timers.
   */
  disconnect(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.token = null;

    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      this.ws.close(1000);
      this.ws = null;
    }

    this.setState('disconnected');
  }

  /**
   * Send a message to the backend. Returns false if not connected.
   */
  send(msg: ClientMessage): boolean {
    if (this.state !== 'connected' || !this.ws) {
      return false;
    }
    this.ws.send(JSON.stringify(msg));
    return true;
  }

  /**
   * Get the current connection state.
   */
  getState(): ConnectionState {
    return this.state;
  }

  /**
   * Subscribe to content tokens. If stream backlog exists, replay it
   * immediately to the new listener. Returns an unsubscribe function.
   */
  subscribeContent(listener: (token: string) => void): () => void {
    this.contentListeners.add(listener);

    // Replay backlog to late subscriber
    if (this.streamBuffer.length > 0) {
      for (const token of this.streamBuffer) {
        listener(token);
      }
    }

    return () => {
      this.contentListeners.delete(listener);
    };
  }

  /**
   * Emit a content token. Always buffers during active stream (for late
   * subscribers to replay). Delivers to current listeners immediately.
   */
  emitContent(token: string): void {
    if (this.isStreamActive) {
      this.streamBuffer.push(token);
    }

    for (const listener of this.contentListeners) {
      listener(token);
    }
  }

  /**
   * Mark the start of a new content stream. Clears any previous backlog.
   */
  startContentStream(): void {
    this.isStreamActive = true;
    this.streamBuffer = [];
  }

  /**
   * Mark the end of a content stream. Buffer contents kept for late subscribers.
   */
  endContentStream(): void {
    this.isStreamActive = false;
  }

  /**
   * Check if a content stream is currently active.
   */
  getIsStreamActive(): boolean {
    return this.isStreamActive;
  }

  // ---------------------------------------------------------------------------
  // Private handlers
  // ---------------------------------------------------------------------------

  private setState(newState: ConnectionState): void {
    this.state = newState;
    this.onStateChangeCb?.(newState);
  }

  private handleOpen(): void {
    this.setState('connected');
    this.reconnectAttempts = 0;

    // Sync state with backend on every connect/reconnect
    this.send({ type: 'get-active-sessions' });
  }

  private handleClose(event: CloseEvent): void {
    const shouldReconnect =
      event.code !== 1000 &&
      this.token !== null &&
      this.state !== 'disconnected';

    if (shouldReconnect) {
      this.scheduleReconnect();
    } else {
      this.setState('disconnected');
    }
  }

  private handleError(): void {
    // No state transition -- the close event handles it.
    // Just notify state change callback with current state.
    this.onStateChangeCb?.(this.state);
  }

  private handleMessage(event: MessageEvent): void {
    let parsed: unknown;
    try {
      parsed = JSON.parse(event.data as string);
    } catch {
      console.warn('[WebSocketClient] Failed to parse message:', event.data);
      return;
    }

    if (!isServerMessage(parsed)) {
      console.warn('[WebSocketClient] Malformed message (no type field):', parsed);
      return;
    }

    this.onMessageCb?.(parsed);
  }

  private scheduleReconnect(): void {
    this.setState('reconnecting');

    const delay = Math.min(
      1000 * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay,
    );
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.reconnect();
    }, delay);
  }

  private reconnect(): void {
    if (!this.token) return;

    // Null out old WS handlers before creating new connection to prevent
    // ghost handlers on stale reference if GC is slow
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
    }

    this.setState('connecting');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${window.location.host}/ws?token=${this.token}`;

    this.ws = new WebSocket(url);
    this.ws.onopen = () => this.handleOpen();
    this.ws.onclose = (event) => this.handleClose(event);
    this.ws.onerror = () => this.handleError();
    this.ws.onmessage = (event) => this.handleMessage(event);
  }
}

export const wsClient = new WebSocketClient();
