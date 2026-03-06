/**
 * ActiveMessage — Component tests for streaming message display.
 *
 * Tests the finalization lifecycle: streaming -> finalizing -> unmount,
 * timeline store flush, and mid-stream disconnect error display.
 *
 * Uses real Zustand stores (setState for setup, getState for assertions)
 * to avoid Zustand v5 useSyncExternalStore mock compatibility issues.
 */

import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useStreamStore } from '@/stores/stream';
import { useTimelineStore } from '@/stores/timeline';

// ─── Mocks ─────────────────────────────────────────────────────────────────

// Track rAF callbacks for deterministic testing
let rafCallbacks: Array<() => void> = [];
let rafId = 0;

vi.stubGlobal('requestAnimationFrame', (cb: () => void) => {
  rafCallbacks.push(cb);
  return ++rafId;
});
vi.stubGlobal('cancelAnimationFrame', vi.fn());

// Mock wsClient
const mockUnsubscribe = vi.fn();
let subscribeContentListener: ((token: string) => void) | null = null;
const mockSubscribeContent = vi.fn<(listener: (token: string) => void) => () => void>().mockImplementation((listener) => {
  subscribeContentListener = listener;
  return mockUnsubscribe;
});
const mockGetState = vi.fn().mockReturnValue('connected');
const mockGetIsStreamActive = vi.fn().mockReturnValue(true);

vi.mock('@/lib/websocket-client', () => ({
  wsClient: {
    subscribeContent: (...args: Parameters<typeof mockSubscribeContent>) => mockSubscribeContent(...args),
    getState: () => mockGetState(),
    getIsStreamActive: () => mockGetIsStreamActive(),
  },
}));

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
  randomUUID: () => 'test-uuid-1234',
});

function flushRaf(): void {
  const cbs = [...rafCallbacks];
  rafCallbacks = [];
  for (const cb of cbs) {
    cb();
  }
}

function sendToken(token: string): void {
  if (subscribeContentListener) {
    subscribeContentListener(token);
  }
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('ActiveMessage', () => {
  let ActiveMessage: typeof import('@/components/chat/view/ActiveMessage').ActiveMessage;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers({
      shouldAdvanceTime: false,
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'],
    });
    rafCallbacks = [];
    rafId = 0;
    subscribeContentListener = null;
    mockGetState.mockReturnValue('connected');
    mockGetIsStreamActive.mockReturnValue(true);

    // Reset stores to known state using real Zustand stores
    act(() => {
      useStreamStore.setState({ isStreaming: true });
      useTimelineStore.setState({
        sessions: [{
          id: 'test-session',
          title: 'Test',
          messages: [],
          providerId: 'claude',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
          metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null },
        }],
        activeSessionId: 'test-session',
      });
    });

    const mod = await import('@/components/chat/view/ActiveMessage');
    ActiveMessage = mod.ActiveMessage;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    act(() => {
      useStreamStore.getState().reset();
      useTimelineStore.getState().reset();
    });
  });

  it('renders a container with the active-message class (contain:content CSS)', () => {
    const onFinalizationComplete = vi.fn();
    render(<ActiveMessage sessionId="test-session" onFinalizationComplete={onFinalizationComplete} />);

    const container = screen.getByTestId('active-message');
    expect(container).toHaveClass('active-message');
    expect(container).toHaveAttribute('data-phase', 'streaming');
  });

  it('streaming text appears in the text span via useStreamBuffer', () => {
    const onFinalizationComplete = vi.fn();
    render(<ActiveMessage sessionId="test-session" onFinalizationComplete={onFinalizationComplete} />);

    sendToken('Hello');
    sendToken(' streaming');
    flushRaf();

    const container = screen.getByTestId('active-message');
    expect(container.textContent).toContain('Hello streaming');
  });

  it('cursor element is visible during streaming phase', () => {
    const onFinalizationComplete = vi.fn();
    render(<ActiveMessage sessionId="test-session" onFinalizationComplete={onFinalizationComplete} />);

    const cursor = screen.getByTestId('streaming-cursor');
    expect(cursor).toHaveClass('streaming-cursor');
    expect(cursor).toBeInTheDocument();
  });

  it('when isStreaming goes false, component enters finalizing phase', () => {
    const onFinalizationComplete = vi.fn();
    render(<ActiveMessage sessionId="test-session" onFinalizationComplete={onFinalizationComplete} />);

    sendToken('Some text');
    flushRaf();

    const container = screen.getByTestId('active-message');
    expect(container.textContent).toContain('Some text');

    // Transition to finalizing via real store
    act(() => {
      useStreamStore.getState().endStream();
    });

    expect(container).toHaveAttribute('data-phase', 'finalizing');
  });

  it('onFinalizationComplete callback fires after 200ms delay', () => {
    const onFinalizationComplete = vi.fn();
    render(<ActiveMessage sessionId="test-session" onFinalizationComplete={onFinalizationComplete} />);

    sendToken('Done text');
    flushRaf();

    act(() => {
      useStreamStore.getState().endStream();
    });

    // Not yet called
    expect(onFinalizationComplete).not.toHaveBeenCalled();

    // Advance by 200ms
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(onFinalizationComplete).toHaveBeenCalledOnce();
  });

  it('accumulated text is flushed to timeline store during finalization', () => {
    const onFinalizationComplete = vi.fn();
    render(<ActiveMessage sessionId="test-session" onFinalizationComplete={onFinalizationComplete} />);

    sendToken('Flushed text');
    flushRaf();

    act(() => {
      useStreamStore.getState().endStream();
    });

    // Check the real timeline store received the message
    const session = useTimelineStore.getState().sessions.find(
      (s) => s.id === 'test-session',
    );
    expect(session).toBeDefined();
    if (session) {
      expect(session.messages).toHaveLength(1);
      const msg = session.messages[0];
      if (msg) {
        expect(msg.content).toBe('Flushed text');
        expect(msg.role).toBe('assistant');
      }
    }
  });

  it('component remains mounted during entire finalization (does NOT unmount on isStreaming=false)', () => {
    const onFinalizationComplete = vi.fn();
    render(<ActiveMessage sessionId="test-session" onFinalizationComplete={onFinalizationComplete} />);

    sendToken('Still here');
    flushRaf();

    act(() => {
      useStreamStore.getState().endStream();
    });

    // Component is still in the DOM during finalization
    const container = screen.getByTestId('active-message');
    expect(container).toBeInTheDocument();
    expect(container.textContent).toContain('Still here');

    // Only after 200ms does onFinalizationComplete fire
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(onFinalizationComplete).toHaveBeenCalledOnce();
  });

  it('mid-disconnect shows error line with "Connection lost during response." text', () => {
    const onFinalizationComplete = vi.fn();
    render(<ActiveMessage sessionId="test-session" onFinalizationComplete={onFinalizationComplete} />);

    sendToken('Partial content');
    flushRaf();

    // Simulate disconnect
    mockGetState.mockReturnValue('disconnected');
    mockGetIsStreamActive.mockReturnValue(false);

    // Trigger the paint loop to detect disconnect
    flushRaf();

    const container = screen.getByTestId('active-message');
    expect(container.textContent).toContain('Connection lost during response.');
    expect(container).toHaveAttribute('data-phase', 'finalizing');

    // onFinalizationComplete should NOT be called for disconnect
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(onFinalizationComplete).not.toHaveBeenCalled();
  });
});
