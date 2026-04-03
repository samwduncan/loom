/**
 * Unit tests for WebSocket init lifecycle.
 *
 * Tests init/disconnect, double-init guard, AppState background/foreground
 * lifecycle (30s grace period), and D-14 MMKV snapshot on background during streaming.
 *
 * Per D-15: hooks and state logic only, no component rendering.
 */

// --- Mocks must be declared BEFORE imports ---

const mockConnect = jest.fn();
const mockDisconnect = jest.fn();
const mockConfigure = jest.fn();
const mockGetState = jest.fn(() => 'disconnected');
const mockSend = jest.fn();
const mockStartContentStream = jest.fn();
const mockEndContentStream = jest.fn();
const mockEmitContent = jest.fn();
const mockGetLastCloseCode = jest.fn(() => 1000);

jest.mock('@loom/shared/lib/websocket-client', () => ({
  WebSocketClient: jest.fn().mockImplementation(() => ({
    connect: mockConnect,
    disconnect: mockDisconnect,
    configure: mockConfigure,
    getState: mockGetState,
    send: mockSend,
    startContentStream: mockStartContentStream,
    endContentStream: mockEndContentStream,
    emitContent: mockEmitContent,
    getLastCloseCode: mockGetLastCloseCode,
  })),
}));

jest.mock('@loom/shared/lib/stream-multiplexer', () => ({
  routeServerMessage: jest.fn((msg: any, callbacks: any) => {
    // Simulate content token routing for claude-response messages
    if (msg.type === 'claude-response' && msg.text && callbacks.onContentToken) {
      callbacks.onContentToken(msg.text);
    }
  }),
}));

// Mock the platform module
jest.mock('../../lib/platform', () => ({
  resolveWsUrl: jest.fn((path: string, token: string) => `wss://test${path}?token=${token}`),
  resolveApiUrl: jest.fn((path: string) => `https://test${path}`),
  API_BASE: 'https://test',
  WS_BASE: 'wss://test',
}));

// Mock the auth-provider module
const mockGetToken = jest.fn(() => 'test-token');
jest.mock('../../lib/auth-provider', () => ({
  nativeAuthProvider: {
    getToken: () => mockGetToken(),
    setToken: jest.fn(),
    clearToken: jest.fn(),
  },
}));

// Mock the stores
const mockUpdateProviderStatus = jest.fn();
const mockResetReconnectAttempts = jest.fn();
const mockSetProviderError = jest.fn();
const mockIncrementReconnectAttempts = jest.fn();
const mockStartStream = jest.fn();
const mockEndStream = jest.fn();
const mockClearStreamingFlag = jest.fn();
const mockSetActivityText = jest.fn();
const mockSetActiveSessionId = jest.fn();

let mockIsStreaming = false;
let mockActiveSessionId: string | null = null;

jest.mock('../../stores/index', () => ({
  useTimelineStore: {
    getState: jest.fn(() => ({
      activeSessionId: null,
      sessions: [],
      replaceSessionId: jest.fn(),
      addSession: jest.fn(),
      setActiveSession: jest.fn(),
    })),
  },
  useConnectionStore: {
    getState: jest.fn(() => ({
      updateProviderStatus: mockUpdateProviderStatus,
      resetReconnectAttempts: mockResetReconnectAttempts,
      setProviderError: mockSetProviderError,
      incrementReconnectAttempts: mockIncrementReconnectAttempts,
    })),
  },
  useStreamStore: {
    getState: jest.fn(() => ({
      isStreaming: mockIsStreaming,
      activeSessionId: mockActiveSessionId,
      startStream: mockStartStream,
      endStream: mockEndStream,
      clearStreamingFlag: mockClearStreamingFlag,
      setActivityText: mockSetActivityText,
      setActiveSessionId: mockSetActiveSessionId,
      thinkingState: null,
      setThinkingState: jest.fn(),
      addToolCall: jest.fn(),
      updateToolCall: jest.fn(),
      setTokenBudget: jest.fn(),
      setPermissionRequest: jest.fn(),
      clearPermissionRequest: jest.fn(),
      setResultData: jest.fn(),
      attachLiveSession: jest.fn(),
      detachLiveSession: jest.fn(),
    })),
  },
}));

import { AppState } from 'react-native';
import { initializeWebSocket, disconnectWebSocket, getStreamSnapshot, clearStreamSnapshot } from '../../lib/websocket-init';
import { WebSocketClient } from '@loom/shared/lib/websocket-client';

// Capture AppState callback by intercepting addEventListener
let appStateCallback: ((state: string) => void) | null = null;

afterAll(() => {
  // Ensure clean shutdown to avoid worker exit warning
  disconnectWebSocket();
  jest.useRealTimers();
});

beforeEach(() => {
  // Reset module state by disconnecting
  disconnectWebSocket();
  jest.clearAllMocks();
  appStateCallback = null;
  mockIsStreaming = false;
  mockActiveSessionId = null;
  mockGetToken.mockReturnValue('test-token');
  mockGetState.mockReturnValue('disconnected');

  // Intercept AppState.addEventListener to capture the callback
  (AppState.addEventListener as jest.Mock).mockImplementation(
    (_event: string, callback: (state: string) => void) => {
      appStateCallback = callback;
      return { remove: jest.fn() };
    },
  );
});

describe('websocket-init', () => {
  it('initializeWebSocket creates a WebSocketClient and calls connect with stored token', async () => {
    await initializeWebSocket();

    expect(WebSocketClient).toHaveBeenCalledTimes(1);
    expect(mockConfigure).toHaveBeenCalledTimes(1);
    expect(mockConnect).toHaveBeenCalledWith('test-token');
  });

  it('double-init is prevented (second call is no-op)', async () => {
    await initializeWebSocket();
    await initializeWebSocket();

    // WebSocketClient constructor should only be called once
    expect(WebSocketClient).toHaveBeenCalledTimes(1);
    expect(mockConnect).toHaveBeenCalledTimes(1);
  });

  it('disconnectWebSocket nulls client and resets state', async () => {
    await initializeWebSocket();

    disconnectWebSocket();

    // After disconnect, a new init should create a fresh client
    await initializeWebSocket();
    expect(WebSocketClient).toHaveBeenCalledTimes(2);
  });

  it('AppState background sets a 30s timer to disconnect', async () => {
    jest.useFakeTimers();

    await initializeWebSocket();
    expect(appStateCallback).toBeTruthy();

    // Trigger background
    appStateCallback!('background');

    // Disconnect should not be called immediately
    expect(mockDisconnect).not.toHaveBeenCalled();

    // Advance by 30 seconds
    jest.advanceTimersByTime(30000);

    // Now disconnect should have been called
    expect(mockDisconnect).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  it('AppState active after background clears timer and reconnects with fresh token via .connect(token)', async () => {
    jest.useFakeTimers();

    await initializeWebSocket();

    // Go to background
    appStateCallback!('background');

    // Come back to foreground before 30s elapses
    mockGetState.mockReturnValue('disconnected');
    mockGetToken.mockReturnValue('fresh-token');
    appStateCallback!('active');

    // Timer should have been cleared -- advancing should NOT cause disconnect
    jest.advanceTimersByTime(30000);
    expect(mockDisconnect).not.toHaveBeenCalled();

    // Should have called connect with fresh token (NOT tryReconnect)
    // connect is called once in init + once in foreground resume
    expect(mockConnect).toHaveBeenCalledWith('fresh-token');

    jest.useRealTimers();
  });

  it('background during active streaming saves MMKV snapshot (D-14)', async () => {
    await initializeWebSocket();

    // Set up streaming state in the mock store
    mockIsStreaming = true;
    mockActiveSessionId = 'session-123';

    // Get the onMessage callback from configure to simulate content tokens
    // that fill the streamContentAccumulator
    const configureCall = mockConfigure.mock.calls[0][0];
    const onMessage = configureCall.onMessage;

    // Simulate stream start + content tokens to fill the accumulator
    // First message of type 'claude-response' triggers stream start internally
    onMessage({ type: 'claude-response', text: 'Hello' });
    onMessage({ type: 'claude-response', text: ' World' });

    // Trigger background
    appStateCallback!('background');

    // Verify MMKV snapshot was saved
    const snapshot = getStreamSnapshot('session-123');
    expect(snapshot).not.toBeNull();
    expect(snapshot!.sessionId).toBe('session-123');
    expect(snapshot!.content).toBeTruthy();
    expect(snapshot!.timestamp).toBeTruthy();

    // Verify stream was marked as interrupted
    expect(mockClearStreamingFlag).toHaveBeenCalled();

    // Clean up
    clearStreamSnapshot('session-123');
  });
});
