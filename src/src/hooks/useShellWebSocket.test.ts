import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock auth module
vi.mock('@/lib/auth', () => ({
  getToken: vi.fn(() => 'test-token'),
}));

// ---------------------------------------------------------------------------
// Mock WebSocket
// ---------------------------------------------------------------------------

type WsHandler = (event: Record<string, unknown>) => void;

class MockWebSocket {
  static instances: MockWebSocket[] = [];

  url: string;
  readyState = 0; // CONNECTING
  handlers: Record<string, WsHandler[]> = {};

  // ASSERT: WebSocket constants needed for readyState checks
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;
  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSING = 2;
  readonly CLOSED = 3;

  send = vi.fn();
  close = vi.fn();

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  addEventListener(event: string, handler: WsHandler): void {
    if (!this.handlers[event]) this.handlers[event] = [];
    this.handlers[event]!.push(handler); // ASSERT: guard above ensures handlers[event] is defined
  }

  removeEventListener(event: string, handler: WsHandler): void {
    if (this.handlers[event]) {
      this.handlers[event] = this.handlers[event]!.filter( // ASSERT: guard above ensures handlers[event] is defined
        (h) => h !== handler,
      );
    }
  }

  // Test helpers
  simulateOpen(): void {
    this.readyState = 1; // OPEN
    this.handlers['open']?.forEach((h) => h({}));
  }

  simulateMessage(data: unknown): void {
    this.handlers['message']?.forEach((h) =>
      h({ data: JSON.stringify(data) }),
    );
  }

  simulateClose(code = 1000): void {
    this.readyState = 3; // CLOSED
    this.handlers['close']?.forEach((h) => h({ code }));
  }
}

/** Get the most recently created MockWebSocket instance. */
function lastWs(): MockWebSocket {
  return MockWebSocket.instances[MockWebSocket.instances.length - 1]!; // ASSERT: tests always create a WS before calling lastWs
}

// Install mock globally
const OriginalWebSocket = globalThis.WebSocket;
beforeEach(() => {
  MockWebSocket.instances = [];
  globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;
});
afterEach(() => {
  globalThis.WebSocket = OriginalWebSocket;
});

// ---------------------------------------------------------------------------
// ShellWebSocketClient tests
// ---------------------------------------------------------------------------

describe('ShellWebSocketClient', () => {
  // Lazy import so the mock WebSocket is in place
  let ShellWebSocketClient: typeof import('@/lib/shell-ws-client').ShellWebSocketClient;

  beforeEach(async () => {
    const mod = await import('@/lib/shell-ws-client');
    ShellWebSocketClient = mod.ShellWebSocketClient;
  });

  it('connect() creates WebSocket with token from getToken()', () => {
    const client = new ShellWebSocketClient();
    client.getToken = () => 'my-jwt';
    client.connect({
      projectPath: '/home/user/project',
      cols: 80,
      rows: 24,
    });

    expect(MockWebSocket.instances).toHaveLength(1);
    expect(lastWs().url).toContain('/shell?token=my-jwt');
  });

  it('connect() does nothing when getToken returns null', () => {
    const client = new ShellWebSocketClient();
    client.getToken = () => null;
    client.connect({
      projectPath: '/home/user/project',
      cols: 80,
      rows: 24,
    });

    expect(MockWebSocket.instances).toHaveLength(0);
  });

  it('transitions state to connecting on connect, connected on open', () => {
    const client = new ShellWebSocketClient();
    client.getToken = () => 'tok';
    const stateChanges: string[] = [];
    client.onStateChange = (s: string) => stateChanges.push(s);

    client.connect({
      projectPath: '/p',
      cols: 80,
      rows: 24,
    });
    expect(stateChanges).toContain('connecting');

    lastWs().simulateOpen();
    expect(stateChanges).toContain('connected');
  });

  it('sends init message on WS open', () => {
    const client = new ShellWebSocketClient();
    client.getToken = () => 'tok';
    client.connect({
      projectPath: '/home/user/project',
      cols: 120,
      rows: 40,
    });

    const ws = lastWs();
    ws.simulateOpen();

    expect(ws.send).toHaveBeenCalledWith(
      JSON.stringify({
        type: 'init',
        projectPath: '/home/user/project',
        cols: 120,
        rows: 40,
      }),
    );
  });

  it('dispatches output messages to onOutput callback', () => {
    const client = new ShellWebSocketClient();
    client.getToken = () => 'tok';
    const outputs: string[] = [];
    client.onOutput = (data: string) => outputs.push(data);

    client.connect({
      projectPath: '/p',
      cols: 80,
      rows: 24,
    });

    const ws = lastWs();
    ws.simulateOpen();
    ws.simulateMessage({ type: 'output', data: 'hello world' });

    expect(outputs).toEqual(['hello world']);
  });

  it('dispatches auth_url messages to onAuthUrl callback', () => {
    const client = new ShellWebSocketClient();
    client.getToken = () => 'tok';
    const authUrls: Array<{ url: string; autoOpen: boolean }> = [];
    client.onAuthUrl = (url: string, autoOpen: boolean) =>
      authUrls.push({ url, autoOpen });

    client.connect({
      projectPath: '/p',
      cols: 80,
      rows: 24,
    });

    const ws = lastWs();
    ws.simulateOpen();
    ws.simulateMessage({
      type: 'auth_url',
      url: 'https://auth.example.com',
      autoOpen: true,
    });

    expect(authUrls).toEqual([
      { url: 'https://auth.example.com', autoOpen: true },
    ]);
  });

  it('sendInput sends correct JSON', () => {
    const client = new ShellWebSocketClient();
    client.getToken = () => 'tok';
    client.connect({
      projectPath: '/p',
      cols: 80,
      rows: 24,
    });

    const ws = lastWs();
    ws.simulateOpen();
    client.sendInput('ls -la\r');

    expect(ws.send).toHaveBeenCalledWith(
      JSON.stringify({ type: 'input', data: 'ls -la\r' }),
    );
  });

  it('sendResize sends correct JSON', () => {
    const client = new ShellWebSocketClient();
    client.getToken = () => 'tok';
    client.connect({
      projectPath: '/p',
      cols: 80,
      rows: 24,
    });

    const ws = lastWs();
    ws.simulateOpen();
    client.sendResize(100, 50);

    expect(ws.send).toHaveBeenCalledWith(
      JSON.stringify({ type: 'resize', cols: 100, rows: 50 }),
    );
  });

  it('disconnect closes WS with code 1000', () => {
    const client = new ShellWebSocketClient();
    client.getToken = () => 'tok';
    client.connect({
      projectPath: '/p',
      cols: 80,
      rows: 24,
    });

    const ws = lastWs();
    ws.simulateOpen();
    client.disconnect();

    expect(ws.close).toHaveBeenCalledWith(1000);
  });

  it('disconnect transitions state to disconnected', () => {
    const client = new ShellWebSocketClient();
    client.getToken = () => 'tok';
    const stateChanges: string[] = [];
    client.onStateChange = (s: string) => stateChanges.push(s);

    client.connect({
      projectPath: '/p',
      cols: 80,
      rows: 24,
    });

    const ws = lastWs();
    ws.simulateOpen();
    client.disconnect();

    expect(stateChanges[stateChanges.length - 1]).toBe('disconnected');
  });

  it('restart() returns false when never connected', () => {
    const client = new ShellWebSocketClient();
    client.getToken = () => 'tok';
    expect(client.restart()).toBe(false);
  });

  it('restart() reconnects with fresh token', () => {
    const client = new ShellWebSocketClient();
    let tokenVersion = 'token-v1';
    client.getToken = () => tokenVersion;

    client.connect({ projectPath: '/p', cols: 80, rows: 24 });
    lastWs().simulateOpen();

    // Change token before restart
    tokenVersion = 'token-v2';
    const result = client.restart();

    expect(result).toBe(true);
    expect(MockWebSocket.instances).toHaveLength(2);
    expect(lastWs().url).toContain('token=token-v2');
  });
});

// ---------------------------------------------------------------------------
// useShellWebSocket hook tests
// ---------------------------------------------------------------------------

describe('useShellWebSocket', () => {
  let useShellWebSocket: typeof import('@/hooks/useShellWebSocket').useShellWebSocket;

  beforeEach(async () => {
    const mod = await import('@/hooks/useShellWebSocket');
    useShellWebSocket = mod.useShellWebSocket;
  });

  it('returns initial disconnected state', () => {
    const { result } = renderHook(() =>
      useShellWebSocket({ projectPath: '/p' }),
    );

    expect(result.current.state).toBe('disconnected');
    expect(result.current.authUrl).toBeNull();
  });

  it('connect creates WebSocket with token from getToken()', () => {
    const { result } = renderHook(() =>
      useShellWebSocket({ projectPath: '/p' }),
    );

    act(() => {
      result.current.connect(80, 24);
    });

    expect(MockWebSocket.instances).toHaveLength(1);
    expect(lastWs().url).toContain('token=test-token');
  });

  it('updates authUrl state on auth_url message', () => {
    const { result } = renderHook(() =>
      useShellWebSocket({ projectPath: '/p' }),
    );

    act(() => {
      result.current.connect(80, 24);
    });

    const ws = lastWs();
    act(() => {
      ws.simulateOpen();
    });

    act(() => {
      ws.simulateMessage({
        type: 'auth_url',
        url: 'https://auth.example.com',
        autoOpen: false,
      });
    });

    expect(result.current.authUrl).toEqual({
      url: 'https://auth.example.com',
      autoOpen: false,
    });
  });

  it('clearAuthUrl resets authUrl to null', () => {
    const { result } = renderHook(() =>
      useShellWebSocket({ projectPath: '/p' }),
    );

    act(() => {
      result.current.connect(80, 24);
    });

    const ws = lastWs();
    act(() => {
      ws.simulateOpen();
      ws.simulateMessage({
        type: 'auth_url',
        url: 'https://auth.example.com',
        autoOpen: false,
      });
    });

    act(() => {
      result.current.clearAuthUrl();
    });

    expect(result.current.authUrl).toBeNull();
  });

  it('disconnect cleans up WebSocket', () => {
    const { result } = renderHook(() =>
      useShellWebSocket({ projectPath: '/p' }),
    );

    act(() => {
      result.current.connect(80, 24);
    });

    const ws = lastWs();
    act(() => {
      ws.simulateOpen();
    });

    act(() => {
      result.current.disconnect();
    });

    expect(ws.close).toHaveBeenCalledWith(1000);
  });

  it('unmount disconnects WebSocket', () => {
    const { result, unmount } = renderHook(() =>
      useShellWebSocket({ projectPath: '/p' }),
    );

    act(() => {
      result.current.connect(80, 24);
    });

    const ws = lastWs();
    act(() => {
      ws.simulateOpen();
    });

    unmount();

    expect(ws.close).toHaveBeenCalledWith(1000);
  });
});
