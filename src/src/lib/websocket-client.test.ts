/**
 * WebSocket client tests — connection state machine, reconnection,
 * message dispatch, content stream subscription, and stream backlog.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebSocketClient } from '@/lib/websocket-client';
import type { ConnectionState } from '@/lib/websocket-client';
import type { ServerMessage, ClientMessage } from '@/types/websocket';

// ---------------------------------------------------------------------------
// Mock WebSocket
// ---------------------------------------------------------------------------

type MockWSHandler = ((event: unknown) => void) | null;

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  url: string;
  onopen: MockWSHandler = null;
  onclose: MockWSHandler = null;
  onerror: MockWSHandler = null;
  onmessage: MockWSHandler = null;
  readyState = 0; // CONNECTING
  sentMessages: string[] = [];
  closedWith: { code?: number; reason?: string } | null = null;

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  send(data: string): void {
    this.sentMessages.push(data);
  }

  close(code?: number, reason?: string): void {
    this.closedWith = { code, reason };
  }

  // Test helpers
  simulateOpen(): void {
    this.readyState = 1; // OPEN
    this.onopen?.({});
  }

  simulateClose(code = 1006, reason = ''): void {
    this.readyState = 3; // CLOSED
    this.onclose?.({ code, reason, wasClean: code === 1000 });
  }

  simulateError(): void {
    this.onerror?.({});
  }

  simulateMessage(data: unknown): void {
    this.onmessage?.({ data: JSON.stringify(data) });
  }

  simulateRawMessage(data: string): void {
    this.onmessage?.({ data });
  }
}

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

let client: WebSocketClient;
let onMessage: ReturnType<typeof vi.fn<(msg: ServerMessage) => void>>;
let onStateChange: ReturnType<typeof vi.fn<(state: ConnectionState) => void>>;

beforeEach(() => {
  vi.useFakeTimers();
  MockWebSocket.instances = [];
  vi.stubGlobal('WebSocket', MockWebSocket);
  vi.stubGlobal('window', {
    location: {
      protocol: 'http:',
      host: 'localhost:5184',
    },
  });

  client = new WebSocketClient();
  onMessage = vi.fn();
  onStateChange = vi.fn();
  client.configure({ onMessage, onStateChange });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
function getLastWS(): MockWebSocket {
  const ws = MockWebSocket.instances[MockWebSocket.instances.length - 1];
  if (!ws) throw new Error('No MockWebSocket instance');
  return ws;
}

// ---------------------------------------------------------------------------
// Connection
// ---------------------------------------------------------------------------
describe('connect', () => {
  it('creates WebSocket with correct URL', () => {
    client.connect('test-token');

    const ws = getLastWS();
    expect(ws.url).toBe('ws://localhost:5184/ws?token=test-token');
  });

  it('transitions to connecting then connected on open', () => {
    client.connect('test-token');
    expect(onStateChange).toHaveBeenCalledWith('connecting');
    expect(client.getState()).toBe('connecting');

    getLastWS().simulateOpen();
    expect(onStateChange).toHaveBeenCalledWith('connected');
    expect(client.getState()).toBe('connected');
  });

  it('sends get-active-sessions on open', () => {
    client.connect('test-token');
    getLastWS().simulateOpen();

    const ws = getLastWS();
    expect(ws.sentMessages).toHaveLength(1);
    const firstMsg = ws.sentMessages[0];
    expect(firstMsg).toBeDefined();
    const sent = JSON.parse(firstMsg as string) as ClientMessage;
    expect(sent.type).toBe('get-active-sessions');
  });
});

// ---------------------------------------------------------------------------
// Reconnection
// ---------------------------------------------------------------------------
describe('auto-reconnect', () => {
  it('schedules reconnect on abnormal close', () => {
    client.connect('test-token');
    getLastWS().simulateOpen();

    // Reset to check reconnecting state
    onStateChange.mockClear();

    getLastWS().simulateClose(1006, 'Abnormal closure');

    expect(onStateChange).toHaveBeenCalledWith('reconnecting');
    expect(client.getState()).toBe('reconnecting');
  });

  it('does not reconnect on normal close (code 1000)', () => {
    client.connect('test-token');
    getLastWS().simulateOpen();
    onStateChange.mockClear();

    getLastWS().simulateClose(1000, 'Normal closure');

    expect(onStateChange).toHaveBeenCalledWith('disconnected');
    expect(client.getState()).toBe('disconnected');
  });

  it('uses exponential backoff for reconnect delays', () => {
    client.connect('test-token');
    getLastWS().simulateOpen();

    // First abnormal close: delay = 1000 * 2^0 = 1000ms, then attempts 0->1
    getLastWS().simulateClose(1006);

    expect(MockWebSocket.instances).toHaveLength(1); // no reconnect yet
    vi.advanceTimersByTime(999);
    expect(MockWebSocket.instances).toHaveLength(1); // still waiting
    vi.advanceTimersByTime(1);
    expect(MockWebSocket.instances).toHaveLength(2); // reconnected at 1000ms

    // Don't open -- simulate another close immediately (attempts still climbing)
    // The reconnect creates a new WS. Close it without opening.
    getLastWS().simulateClose(1006); // delay = 1000 * 2^1 = 2000ms, then attempts 1->2

    vi.advanceTimersByTime(1999);
    expect(MockWebSocket.instances).toHaveLength(2); // not yet
    vi.advanceTimersByTime(1);
    expect(MockWebSocket.instances).toHaveLength(3); // reconnected at 2000ms
  });

  it('caps reconnect delay at 30 seconds', () => {
    client.connect('test-token');
    getLastWS().simulateOpen();

    // Simulate many failed reconnection cycles (close without opening)
    // to push attempts past the 30s cap threshold.
    // delay sequence: 1s, 2s, 4s, 8s, 16s, 32s->capped at 30s
    getLastWS().simulateClose(1006); // delay 1s
    vi.advanceTimersByTime(1000);
    getLastWS().simulateClose(1006); // delay 2s
    vi.advanceTimersByTime(2000);
    getLastWS().simulateClose(1006); // delay 4s
    vi.advanceTimersByTime(4000);
    getLastWS().simulateClose(1006); // delay 8s
    vi.advanceTimersByTime(8000);
    getLastWS().simulateClose(1006); // delay 16s
    vi.advanceTimersByTime(16_000);
    getLastWS().simulateClose(1006); // delay 32s -> capped at 30s

    const countBefore = MockWebSocket.instances.length;
    vi.advanceTimersByTime(29_999);
    expect(MockWebSocket.instances.length).toBe(countBefore); // not yet
    vi.advanceTimersByTime(1);
    expect(MockWebSocket.instances.length).toBe(countBefore + 1); // reconnected at 30s
  });

  it('resets reconnect attempts on successful connect', () => {
    client.connect('test-token');
    getLastWS().simulateOpen();

    // Trigger reconnect cycle
    getLastWS().simulateClose(1006);
    vi.advanceTimersByTime(1000); // first reconnect at 1s
    getLastWS().simulateOpen();

    // After a successful connect, next close should use initial backoff (1s, not 2s)
    getLastWS().simulateClose(1006);
    vi.advanceTimersByTime(1000);
    expect(MockWebSocket.instances.length).toBeGreaterThanOrEqual(3);
  });
});

// ---------------------------------------------------------------------------
// Disconnect
// ---------------------------------------------------------------------------
describe('disconnect', () => {
  it('closes socket with code 1000', () => {
    client.connect('test-token');
    getLastWS().simulateOpen();

    client.disconnect();

    expect(getLastWS().closedWith?.code).toBe(1000);
    expect(client.getState()).toBe('disconnected');
  });

  it('clears reconnect timer', () => {
    client.connect('test-token');
    getLastWS().simulateOpen();
    getLastWS().simulateClose(1006); // triggers reconnect timer

    expect(client.getState()).toBe('reconnecting');

    client.disconnect();
    expect(client.getState()).toBe('disconnected');

    // Advancing time should NOT create a new WebSocket
    const countBefore = MockWebSocket.instances.length;
    vi.advanceTimersByTime(60_000);
    expect(MockWebSocket.instances.length).toBe(countBefore);
  });
});

// ---------------------------------------------------------------------------
// Send
// ---------------------------------------------------------------------------
describe('send', () => {
  it('returns true when connected', () => {
    client.connect('test-token');
    getLastWS().simulateOpen();

    const result = client.send({ type: 'get-active-sessions' });

    expect(result).toBe(true);
    // get-active-sessions from handleOpen + the one we just sent
    expect(getLastWS().sentMessages).toHaveLength(2);
  });

  it('returns false when disconnected', () => {
    const result = client.send({ type: 'get-active-sessions' });

    expect(result).toBe(false);
  });

  it('returns false when connecting', () => {
    client.connect('test-token');
    // Don't simulate open -- still connecting

    const result = client.send({ type: 'get-active-sessions' });

    expect(result).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Message handling
// ---------------------------------------------------------------------------
describe('message handling', () => {
  it('dispatches valid JSON messages to onMessage callback', () => {
    client.connect('test-token');
    getLastWS().simulateOpen();

    const msg: ServerMessage = {
      type: 'session-created',
      sessionId: 'test-session',
    };
    getLastWS().simulateMessage(msg);

    expect(onMessage).toHaveBeenCalledWith(msg);
  });

  it('skips malformed JSON messages', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    client.connect('test-token');
    getLastWS().simulateOpen();

    getLastWS().simulateRawMessage('not valid json{{{');

    expect(onMessage).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('skips messages without type field', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    client.connect('test-token');
    getLastWS().simulateOpen();

    getLastWS().simulateMessage({ data: 'no type field' });

    expect(onMessage).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// Content stream subscription
// ---------------------------------------------------------------------------
describe('subscribeContent', () => {
  it('listener receives emitContent calls', () => {
    const listener = vi.fn();
    client.subscribeContent(listener);

    client.emitContent('hello ');
    client.emitContent('world');

    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenCalledWith('hello ');
    expect(listener).toHaveBeenCalledWith('world');
  });

  it('unsubscribe stops delivery', () => {
    const listener = vi.fn();
    const unsub = client.subscribeContent(listener);

    client.emitContent('before');
    unsub();
    client.emitContent('after');

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith('before');
  });

  it('multiple listeners all receive tokens', () => {
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    client.subscribeContent(listener1);
    client.subscribeContent(listener2);

    client.emitContent('token');

    expect(listener1).toHaveBeenCalledWith('token');
    expect(listener2).toHaveBeenCalledWith('token');
  });
});

// ---------------------------------------------------------------------------
// Stream backlog buffer
// ---------------------------------------------------------------------------
describe('stream backlog', () => {
  it('buffers tokens when no listeners are subscribed', () => {
    client.startContentStream();
    client.emitContent('token1');
    client.emitContent('token2');

    const listener = vi.fn();
    client.subscribeContent(listener);

    // Backlog replayed on subscribe
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenCalledWith('token1');
    expect(listener).toHaveBeenCalledWith('token2');
  });

  it('clears buffer on startContentStream (new stream resets buffer)', () => {
    client.emitContent('old-token');

    client.startContentStream(); // clears backlog

    const listener = vi.fn();
    client.subscribeContent(listener);

    // Old tokens cleared
    expect(listener).not.toHaveBeenCalled();
  });

  it('delivers to listeners immediately and buffers during active stream', () => {
    const listener = vi.fn();
    client.subscribeContent(listener);

    client.startContentStream();
    client.emitContent('direct-token');

    expect(listener).toHaveBeenCalledWith('direct-token');
    expect(listener).toHaveBeenCalledTimes(1);

    // Late subscriber joins mid-stream — gets replay of buffered tokens
    const lateListener = vi.fn();
    client.subscribeContent(lateListener);
    expect(lateListener).toHaveBeenCalledWith('direct-token');
  });

  it('does not buffer when stream is not active', () => {
    const listener = vi.fn();
    client.subscribeContent(listener);

    // No startContentStream — emit outside of a stream
    client.emitContent('unbuffered-token');

    expect(listener).toHaveBeenCalledWith('unbuffered-token');

    // Late subscriber gets no replay (not buffered outside stream)
    const lateListener = vi.fn();
    client.subscribeContent(lateListener);
    expect(lateListener).not.toHaveBeenCalled();
  });

  it('keeps buffer after endContentStream for late subscribers', () => {
    client.startContentStream();
    client.emitContent('buffered');
    client.endContentStream();

    const listener = vi.fn();
    client.subscribeContent(listener);

    expect(listener).toHaveBeenCalledWith('buffered');
  });
});

// ---------------------------------------------------------------------------
// State change callback
// ---------------------------------------------------------------------------
describe('onStateChange callback', () => {
  it('fires on every state transition', () => {
    client.connect('test-token');
    expect(onStateChange).toHaveBeenCalledWith('connecting');

    getLastWS().simulateOpen();
    expect(onStateChange).toHaveBeenCalledWith('connected');

    getLastWS().simulateClose(1006);
    expect(onStateChange).toHaveBeenCalledWith('reconnecting');

    vi.advanceTimersByTime(1000);
    expect(onStateChange).toHaveBeenCalledWith('connecting');

    getLastWS().simulateOpen();
    expect(onStateChange).toHaveBeenCalledWith('connected');

    client.disconnect();
    expect(onStateChange).toHaveBeenCalledWith('disconnected');
  });
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------
describe('error handling', () => {
  it('handleError fires onStateChange with current state', () => {
    client.connect('test-token');
    onStateChange.mockClear();

    getLastWS().simulateError();

    // Error doesn't transition state -- just notifies
    expect(onStateChange).toHaveBeenCalledWith('connecting');
  });
});
