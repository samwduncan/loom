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
const mockSetActiveSessionId = vi.fn();
const mockSetPermissionRequest = vi.fn();
const mockClearPermissionRequest = vi.fn();

const mockSetState = vi.fn();

vi.mock('@/stores/stream', () => ({
  useStreamStore: {
    getState: () => ({
      startStream: mockStartStream,
      endStream: mockEndStream,
      addToolCall: mockAddToolCall,
      updateToolCall: mockUpdateToolCall,
      setThinkingState: mockSetThinkingState,
      setActivityText: mockSetActivityText,
      setActiveSessionId: mockSetActiveSessionId,
      setPermissionRequest: mockSetPermissionRequest,
      clearPermissionRequest: mockClearPermissionRequest,
      thinkingState: null,
    }),
    setState: (...args: unknown[]) => mockSetState(...args),
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
const mockRouteServerMessage = vi.fn();
vi.mock('@/lib/stream-multiplexer', () => ({
  routeServerMessage: (...args: unknown[]) => mockRouteServerMessage(...args),
}));

// Mock timeline store for stub session reconciliation tests
const mockAddSession = vi.fn();
const mockRemoveSession = vi.fn();
const mockSetActiveSession = vi.fn();
const mockAddMessage = vi.fn();
const mockUpdateSessionTitle = vi.fn();
const mockReplaceSessionId = vi.fn();

interface MockSession {
  id: string;
  title: string;
  messages: Array<{ id: string; role: string; content: string }>;
  providerId: string;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

let mockTimelineSessions: MockSession[] = [];

vi.mock('@/stores/timeline', () => ({
  useTimelineStore: {
    getState: () => ({
      sessions: mockTimelineSessions,
      addSession: mockAddSession,
      removeSession: mockRemoveSession,
      setActiveSession: mockSetActiveSession,
      addMessage: mockAddMessage,
      updateSessionTitle: mockUpdateSessionTitle,
      replaceSessionId: mockReplaceSessionId,
    }),
  },
}));

import { initializeWebSocket, _resetInitForTesting } from '@/lib/websocket-init';

describe('initializeWebSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBootstrapAuth.mockResolvedValue('test-token');
    mockTimelineSessions = [];
    _resetInitForTesting();
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

  describe('projects_updated callback wiring', () => {
    let onMessage: (msg: ServerMessage) => void;

    beforeEach(async () => {
      await initializeWebSocket();
      const configCall = mockConfigure.mock.calls[0] as [{ onMessage: (msg: ServerMessage) => void; onStateChange: (state: ConnectionState) => void }];
      onMessage = configCall[0].onMessage;
    });

    it('dispatches loom:projects-updated CustomEvent when projects_updated callback fires', () => {
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

      // Send a non-claude-response message so routeServerMessage is called
      const msg: ServerMessage = {
        type: 'projects_updated',
        projects: [],
        timestamp: '2026-01-01T00:00:00Z',
        changeType: 'update',
        changedFile: 'test.ts',
        watchProvider: 'fs',
      };
      onMessage(msg);

      // routeServerMessage was called with the callbacks object
      expect(mockRouteServerMessage).toHaveBeenCalled();
      // Extract the callbacks argument (2nd arg to routeServerMessage)
      const callArgs = mockRouteServerMessage.mock.calls[0] as [unknown, { onProjectsUpdated: () => void }, unknown];
      const callbacks = callArgs[1];

      // Manually invoke the callback to verify its wiring
      callbacks.onProjectsUpdated();
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'loom:projects-updated' }),
      );

      dispatchSpy.mockRestore();
    });
  });

  describe('stub session reconciliation', () => {
    function extractCallbacks() {
      const configCall = mockConfigure.mock.calls[0] as [{ onMessage: (msg: ServerMessage) => void; onStateChange: (state: ConnectionState) => void }];
      const onMessage = configCall[0].onMessage;
      const dummyMsg: ServerMessage = { type: 'error', error: 'test' };
      onMessage(dummyMsg);
      const callArgs = mockRouteServerMessage.mock.calls[0] as [unknown, {
        onSessionCreated: (sid: string) => void;
        onActiveSessions: (sessions: unknown) => void;
      }, unknown];
      return callArgs[1];
    }

    it('uses replaceSessionId for atomic stub-to-real swap (not addSession+removeSession)', async () => {
      const replaceStateSpy = vi.spyOn(window.history, 'replaceState');

      await initializeWebSocket();
      const callbacks = extractCallbacks();

      mockTimelineSessions.push({
        id: 'stub-abc123',
        title: 'Hello world',
        messages: [{ id: 'msg-1', role: 'user', content: 'Hello world' }],
        providerId: 'claude',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
        metadata: {},
      });

      callbacks.onSessionCreated('real-session-id');

      // Verify: atomic replaceSessionId called (NOT addSession+removeSession)
      expect(mockReplaceSessionId).toHaveBeenCalledWith('stub-abc123', 'real-session-id');
      expect(mockAddSession).not.toHaveBeenCalled();
      expect(mockRemoveSession).not.toHaveBeenCalled();
      expect(mockAddMessage).not.toHaveBeenCalled();

      // Verify: URL was updated via replaceState
      expect(replaceStateSpy).toHaveBeenCalledWith(null, '', '/chat/real-session-id');

      // Verify: active session set to real ID
      expect(mockSetActiveSession).toHaveBeenCalledWith('real-session-id');

      replaceStateSpy.mockRestore();
    });

    it('migrates draft key from stub ID to real ID in localStorage', async () => {
      await initializeWebSocket();
      const callbacks = extractCallbacks();

      // Set up stub session and draft
      mockTimelineSessions.push({
        id: 'stub-draft123',
        title: 'Draft Chat',
        messages: [],
        providerId: 'claude',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
        metadata: {},
      });

      localStorage.setItem('loom-composer-drafts', JSON.stringify({
        'stub-draft123': 'my draft text',
        'other-session': 'other draft',
      }));

      callbacks.onSessionCreated('real-draft-id');

      const drafts = JSON.parse(localStorage.getItem('loom-composer-drafts') ?? '{}');
      expect(drafts['real-draft-id']).toBe('my draft text');
      expect(drafts['stub-draft123']).toBeUndefined();
      expect(drafts['other-session']).toBe('other draft');
    });

    afterEach(() => {
      localStorage.removeItem('loom-composer-drafts');
    });

    it('onActiveSessions populates the active streaming sessions set', async () => {
      const { getActiveStreamingSessions } = await import('@/lib/websocket-init');

      await initializeWebSocket();
      const callbacks = extractCallbacks();

      callbacks.onActiveSessions({
        claude: ['sess-1', 'sess-2'],
        codex: ['sess-3'],
        gemini: [],
      });

      const activeSet = getActiveStreamingSessions();
      expect(activeSet.has('sess-1')).toBe(true);
      expect(activeSet.has('sess-2')).toBe(true);
      expect(activeSet.has('sess-3')).toBe(true);
      expect(activeSet.size).toBe(3);
    });
  });

  describe('permission request callback wiring', () => {
    it('wires onPermissionRequest to streamStore.setPermissionRequest', async () => {
      await initializeWebSocket();

      const configCall = mockConfigure.mock.calls[0] as [{ onMessage: (msg: ServerMessage) => void; onStateChange: (state: ConnectionState) => void }];
      const onMessage = configCall[0].onMessage;

      // Send a dummy message to capture callbacks
      const dummyMsg: ServerMessage = { type: 'error', error: 'test' };
      onMessage(dummyMsg);

      const callArgs = mockRouteServerMessage.mock.calls[0] as [unknown, {
        onPermissionRequest: (requestId: string, toolName: string, input: unknown, sessionId: string | null) => void;
        onPermissionCancelled: (requestId: string) => void;
      }, unknown];
      const callbacks = callArgs[1];

      // Invoke onPermissionRequest callback
      callbacks.onPermissionRequest('pr-1', 'Bash', { command: 'npm test' }, 's1');

      expect(mockSetPermissionRequest).toHaveBeenCalledWith({
        requestId: 'pr-1',
        toolName: 'Bash',
        input: { command: 'npm test' },
        sessionId: 's1',
        receivedAt: expect.any(Number),
      });
    });

    it('wires onPermissionCancelled to streamStore.clearPermissionRequest', async () => {
      await initializeWebSocket();

      const configCall = mockConfigure.mock.calls[0] as [{ onMessage: (msg: ServerMessage) => void; onStateChange: (state: ConnectionState) => void }];
      const onMessage = configCall[0].onMessage;

      const dummyMsg: ServerMessage = { type: 'error', error: 'test' };
      onMessage(dummyMsg);

      const callArgs = mockRouteServerMessage.mock.calls[0] as [unknown, {
        onPermissionRequest: (requestId: string, toolName: string, input: unknown, sessionId: string | null) => void;
        onPermissionCancelled: (requestId: string) => void;
      }, unknown];
      const callbacks = callArgs[1];

      callbacks.onPermissionCancelled('pr-1');
      expect(mockClearPermissionRequest).toHaveBeenCalled();
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
      // Should NOT call endStream -- keep partial content (tool calls, thinking) visible
      expect(mockEndStream).not.toHaveBeenCalled();
      // But should clear isStreaming so sidebar pulse dot stops
      expect(mockSetState).toHaveBeenCalledWith({ isStreaming: false });
    });
  });
});
