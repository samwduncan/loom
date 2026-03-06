/**
 * WebSocket init wiring tests -- verifies initializeWebSocket connects
 * the WS client, multiplexer, and stores together.
 *
 * Mocks all dependencies to test wiring in isolation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ServerMessage } from '@/types/websocket';
import type { ConnectionState } from '@/lib/websocket-client';

// ---------------------------------------------------------------------------
// Mock dependencies
// ---------------------------------------------------------------------------

const mockConfigure = vi.fn();
const mockConnect = vi.fn();
const mockSend = vi.fn().mockReturnValue(true);
const mockEmitContent = vi.fn();
const mockStartContentStream = vi.fn();
const mockEndContentStream = vi.fn();

vi.mock('@/lib/websocket-client', () => ({
  wsClient: {
    configure: (...args: unknown[]) => mockConfigure(...args),
    connect: (...args: unknown[]) => mockConnect(...args),
    send: (...args: unknown[]) => mockSend(...args),
    emitContent: (...args: unknown[]) => mockEmitContent(...args),
    startContentStream: (...args: unknown[]) => mockStartContentStream(...args),
    endContentStream: (...args: unknown[]) => mockEndContentStream(...args),
  },
}));

// Mock stream store
const mockStartStream = vi.fn();
const mockEndStream = vi.fn();
const mockAddToolCall = vi.fn();
const mockUpdateToolCall = vi.fn();
const mockSetThinkingState = vi.fn();
const mockSetActivityText = vi.fn();

vi.mock('@/stores/stream', () => ({
  useStreamStore: {
    getState: () => ({
      startStream: mockStartStream,
      endStream: mockEndStream,
      addToolCall: mockAddToolCall,
      updateToolCall: mockUpdateToolCall,
      setThinkingState: mockSetThinkingState,
      setActivityText: mockSetActivityText,
      thinkingState: null,
    }),
  },
}));

// Mock connection store
const mockUpdateProviderStatus = vi.fn();
const mockSetProviderError = vi.fn();
const mockIncrementReconnectAttempts = vi.fn();
const mockResetReconnectAttempts = vi.fn();

vi.mock('@/stores/connection', () => ({
  useConnectionStore: {
    getState: () => ({
      updateProviderStatus: mockUpdateProviderStatus,
      setProviderError: mockSetProviderError,
      incrementReconnectAttempts: mockIncrementReconnectAttempts,
      resetReconnectAttempts: mockResetReconnectAttempts,
    }),
  },
}));

// Mock auth
const mockBootstrapAuth = vi.fn().mockResolvedValue('test-token');

vi.mock('@/lib/auth', () => ({
  bootstrapAuth: () => mockBootstrapAuth(),
}));

// Mock multiplexer (we test multiplexer separately -- here we test wiring)
vi.mock('@/lib/stream-multiplexer', () => ({
  routeServerMessage: vi.fn(),
}));

import { initializeWebSocket } from '@/lib/websocket-init';

describe('initializeWebSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBootstrapAuth.mockResolvedValue('test-token');
  });

  it('calls bootstrapAuth then wsClient.connect with token', async () => {
    await initializeWebSocket();

    expect(mockBootstrapAuth).toHaveBeenCalled();
    expect(mockConnect).toHaveBeenCalledWith('test-token');
  });

  it('calls wsClient.configure with onMessage and onStateChange', async () => {
    await initializeWebSocket();

    expect(mockConfigure).toHaveBeenCalledWith({
      onMessage: expect.any(Function),
      onStateChange: expect.any(Function),
    });
  });

  it('propagates bootstrapAuth errors', async () => {
    mockBootstrapAuth.mockRejectedValue(new Error('Auth failed'));

    await expect(initializeWebSocket()).rejects.toThrow('Auth failed');
  });

  describe('onStateChange callback', () => {
    let onStateChange: (state: ConnectionState) => void;

    beforeEach(async () => {
      await initializeWebSocket();
      const configCall = mockConfigure.mock.calls[0] as [{ onMessage: (msg: ServerMessage) => void; onStateChange: (state: ConnectionState) => void }];
      onStateChange = configCall[0].onStateChange;
    });

    it('maps connected to updateProviderStatus + resetReconnectAttempts + clearError', () => {
      onStateChange('connected');

      expect(mockUpdateProviderStatus).toHaveBeenCalledWith('claude', 'connected');
      expect(mockResetReconnectAttempts).toHaveBeenCalledWith('claude');
      expect(mockSetProviderError).toHaveBeenCalledWith('claude', null);
    });

    it('maps reconnecting to updateProviderStatus + incrementReconnectAttempts', () => {
      onStateChange('reconnecting');

      expect(mockUpdateProviderStatus).toHaveBeenCalledWith('claude', 'reconnecting');
      expect(mockIncrementReconnectAttempts).toHaveBeenCalledWith('claude');
    });

    it('maps connecting to updateProviderStatus', () => {
      onStateChange('connecting');

      expect(mockUpdateProviderStatus).toHaveBeenCalledWith('claude', 'connecting');
    });

    it('maps disconnected to updateProviderStatus', () => {
      onStateChange('disconnected');

      expect(mockUpdateProviderStatus).toHaveBeenCalledWith('claude', 'disconnected');
    });
  });

  describe('onMessage callback', () => {
    let onMessage: (msg: ServerMessage) => void;

    beforeEach(async () => {
      await initializeWebSocket();
      const configCall = mockConfigure.mock.calls[0] as [{ onMessage: (msg: ServerMessage) => void; onStateChange: (state: ConnectionState) => void }];
      onMessage = configCall[0].onMessage;
    });

    it('triggers streamStore.startStream on first claude-response', () => {
      const msg: ServerMessage = {
        type: 'claude-response',
        data: {
          type: 'assistant',
          message: { content: [{ type: 'text', text: 'hello' }] },
          session_id: 's1',
        },
        sessionId: 's1',
      };

      onMessage(msg);

      expect(mockStartContentStream).toHaveBeenCalled();
      expect(mockStartStream).toHaveBeenCalled();
    });

    it('does not call startStream on second consecutive claude-response', () => {
      const msg: ServerMessage = {
        type: 'claude-response',
        data: {
          type: 'assistant',
          message: { content: [{ type: 'text', text: 'hello' }] },
          session_id: 's1',
        },
        sessionId: 's1',
      };

      onMessage(msg);
      onMessage(msg);

      // startStream should only be called once
      expect(mockStartStream).toHaveBeenCalledTimes(1);
    });

    it('resets isCurrentlyStreaming on claude-complete', () => {
      // First, start streaming
      const responseMsg: ServerMessage = {
        type: 'claude-response',
        data: {
          type: 'assistant',
          message: { content: [{ type: 'text', text: 'hello' }] },
          session_id: 's1',
        },
        sessionId: 's1',
      };
      onMessage(responseMsg);
      mockStartStream.mockClear();
      mockStartContentStream.mockClear();

      // Then complete
      const completeMsg: ServerMessage = {
        type: 'claude-complete',
        sessionId: 's1',
        exitCode: 0,
        isNewSession: false,
      };
      onMessage(completeMsg);

      expect(mockEndContentStream).toHaveBeenCalled();

      // Next claude-response should trigger startStream again
      onMessage(responseMsg);
      expect(mockStartStream).toHaveBeenCalledTimes(1);
    });

    it('resets isCurrentlyStreaming on claude-error', () => {
      // Start streaming
      const responseMsg: ServerMessage = {
        type: 'claude-response',
        data: {
          type: 'assistant',
          message: { content: [{ type: 'text', text: 'hello' }] },
          session_id: 's1',
        },
        sessionId: 's1',
      };
      onMessage(responseMsg);
      mockStartStream.mockClear();
      mockStartContentStream.mockClear();

      // Error
      const errorMsg: ServerMessage = {
        type: 'claude-error',
        error: 'process crashed',
        sessionId: 's1',
      };
      onMessage(errorMsg);

      expect(mockEndContentStream).toHaveBeenCalled();

      // Next response should trigger startStream again
      onMessage(responseMsg);
      expect(mockStartStream).toHaveBeenCalledTimes(1);
    });
  });

  describe('mid-stream disconnect', () => {
    let onMessage: (msg: ServerMessage) => void;
    let onStateChange: (state: ConnectionState) => void;

    beforeEach(async () => {
      await initializeWebSocket();
      const configCall = mockConfigure.mock.calls[0] as [{ onMessage: (msg: ServerMessage) => void; onStateChange: (state: ConnectionState) => void }];
      onMessage = configCall[0].onMessage;
      onStateChange = configCall[0].onStateChange;
    });

    it('sets error message on disconnect during streaming (preserves partial content)', () => {
      // Start streaming
      const responseMsg: ServerMessage = {
        type: 'claude-response',
        data: {
          type: 'assistant',
          message: { content: [{ type: 'text', text: 'partial' }] },
          session_id: 's1',
        },
        sessionId: 's1',
      };
      onMessage(responseMsg);

      // Disconnect mid-stream
      onStateChange('disconnected');

      expect(mockSetProviderError).toHaveBeenCalledWith(
        'claude',
        'Connection lost during response',
      );
      // Should NOT call endStream -- keep partial content visible
      expect(mockEndStream).not.toHaveBeenCalled();
    });
  });
});
