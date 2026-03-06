/**
 * ProofOfLife -- Smoke tests for the proof-of-life page.
 *
 * Tests basic rendering: page mounts, connection dot visible, input with
 * default value, send button enabled. Does NOT test actual WebSocket
 * connection (that's manual verification in the browser).
 *
 * Uses real Zustand stores for React 19 / Zustand v5 compatibility.
 */

import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useConnectionStore } from '@/stores/connection';
import { useStreamStore } from '@/stores/stream';
import { useTimelineStore } from '@/stores/timeline';

// ─── Mocks ─────────────────────────────────────────────────────────────────

// Track rAF callbacks (needed by useScrollAnchor and useStreamBuffer)
let rafCallbacks: Array<() => void> = [];
let rafId = 0;

vi.stubGlobal('requestAnimationFrame', (cb: () => void) => {
  rafCallbacks.push(cb);
  return ++rafId;
});
vi.stubGlobal('cancelAnimationFrame', vi.fn());

// Mock IntersectionObserver (needed by useScrollAnchor) -- must be a constructor function
type ObserverInstance = {
  callback: IntersectionObserverCallback;
  observe: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  unobserve: ReturnType<typeof vi.fn>;
};
vi.stubGlobal(
  'IntersectionObserver',
  vi.fn(function MockIntersectionObserver(
    this: ObserverInstance,
    cb: IntersectionObserverCallback,
  ) {
    this.callback = cb;
    this.observe = vi.fn();
    this.disconnect = vi.fn();
    this.unobserve = vi.fn();
  }),
);

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
  randomUUID: () => 'test-uuid-1234',
});

// Mock wsClient
const mockUnsubscribe = vi.fn();
const mockSubscribeContent = vi.fn().mockReturnValue(mockUnsubscribe);
const mockGetState = vi.fn().mockReturnValue('connected');
const mockGetIsStreamActive = vi.fn().mockReturnValue(false);
const mockSend = vi.fn().mockReturnValue(true);

vi.mock('@/lib/websocket-client', () => ({
  wsClient: {
    subscribeContent: (...args: unknown[]) => mockSubscribeContent(...args),
    getState: () => mockGetState(),
    getIsStreamActive: () => mockGetIsStreamActive(),
    send: (...args: unknown[]) => mockSend(...args),
    configure: vi.fn(),
    connect: vi.fn(),
    emitContent: vi.fn(),
    startContentStream: vi.fn(),
    endContentStream: vi.fn(),
  },
}));

// Mock websocket-init (don't actually connect)
vi.mock('@/lib/websocket-init', () => ({
  initializeWebSocket: vi.fn().mockResolvedValue(undefined),
}));

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('ProofOfLife', () => {
  let ProofOfLife: typeof import('@/components/dev/ProofOfLife').ProofOfLife;

  beforeEach(async () => {
    vi.clearAllMocks();
    rafCallbacks = [];
    rafId = 0;

    // Reset stores
    act(() => {
      useConnectionStore.setState({
        providers: {
          claude: { status: 'connected', lastConnected: null, reconnectAttempts: 0, error: null, modelId: null },
          codex: { status: 'disconnected', lastConnected: null, reconnectAttempts: 0, error: null, modelId: null },
          gemini: { status: 'disconnected', lastConnected: null, reconnectAttempts: 0, error: null, modelId: null },
        },
      });
      useStreamStore.setState({ isStreaming: false, activeToolCalls: [], thinkingState: null });
      useTimelineStore.setState({ sessions: [], activeSessionId: null });
    });

    const mod = await import('@/components/dev/ProofOfLife');
    ProofOfLife = mod.ProofOfLife;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    act(() => {
      useConnectionStore.getState().reset();
      useStreamStore.getState().reset();
      useTimelineStore.getState().reset();
    });
  });

  it('renders the page without crashing', () => {
    render(<ProofOfLife />);
    expect(screen.getByTestId('proof-of-life')).toBeInTheDocument();
  });

  it('shows the connection status dot', () => {
    render(<ProofOfLife />);
    const dot = screen.getByTestId('connection-status-dot');
    expect(dot).toBeInTheDocument();
    expect(dot.className).toContain('proof-of-life-status-dot--connected');
  });

  it('renders input field with default value', () => {
    render(<ProofOfLife />);
    const input = screen.getByTestId('message-input') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('Write a haiku about coding');
  });

  it('renders send button that is enabled', () => {
    render(<ProofOfLife />);
    const sendBtn = screen.getByTestId('send-button');
    expect(sendBtn).toBeInTheDocument();
    expect(sendBtn).not.toBeDisabled();
  });

  it('shows Proof of Life title in header', () => {
    render(<ProofOfLife />);
    expect(screen.getByText('Proof of Life')).toBeInTheDocument();
  });

  it('shows Connected status label when connected', () => {
    render(<ProofOfLife />);
    // The status label contains the hostname
    expect(screen.getByText(/Connected to/)).toBeInTheDocument();
  });

  it('shows disconnected status dot when status is disconnected', () => {
    act(() => {
      useConnectionStore.setState({
        providers: {
          claude: { status: 'disconnected', lastConnected: null, reconnectAttempts: 0, error: null, modelId: null },
          codex: { status: 'disconnected', lastConnected: null, reconnectAttempts: 0, error: null, modelId: null },
          gemini: { status: 'disconnected', lastConnected: null, reconnectAttempts: 0, error: null, modelId: null },
        },
      });
    });

    render(<ProofOfLife />);
    const dot = screen.getByTestId('connection-status-dot');
    expect(dot.className).toContain('proof-of-life-status-dot--disconnected');
  });

  it('creates a session in the timeline store on mount', () => {
    render(<ProofOfLife />);
    const sessions = useTimelineStore.getState().sessions;
    expect(sessions.length).toBe(1);
    expect(sessions[0]?.title).toBe('Proof of Life');
  });
});
