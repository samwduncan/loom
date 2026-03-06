/**
 * useStreamBuffer — Unit tests for rAF + useRef token accumulation hook.
 *
 * Strategy: Mock wsClient, requestAnimationFrame, and useStreamStore.
 * Use renderHook from @testing-library/react for hook lifecycle testing.
 */

import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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
const mockSubscribeContent = vi.fn<(listener: (token: string) => void) => () => void>().mockReturnValue(mockUnsubscribe);
const mockGetState = vi.fn().mockReturnValue('connected');
const mockGetIsStreamActive = vi.fn().mockReturnValue(true);

vi.mock('@/lib/websocket-client', () => ({
  wsClient: {
    subscribeContent: (...args: Parameters<typeof mockSubscribeContent>) => mockSubscribeContent(...args),
    getState: () => mockGetState(),
    getIsStreamActive: () => mockGetIsStreamActive(),
  },
}));

// Mock stream store with controllable isStreaming
let isStreamingValue = true;

vi.mock('@/stores/stream', () => ({
  useStreamStore: Object.assign(
    // The hook call itself — returns current isStreaming via selector
    (selector: (state: { isStreaming: boolean }) => boolean) => {
      return selector({ isStreaming: isStreamingValue });
    },
    {
      getState: () => ({ isStreaming: isStreamingValue }),
    },
  ),
}));

function flushRaf(): void {
  const cbs = [...rafCallbacks];
  rafCallbacks = [];
  for (const cb of cbs) {
    cb();
  }
}

/** Extract the token listener callback passed to subscribeContent */
function getTokenListener(): (token: string) => void {
  const call = mockSubscribeContent.mock.calls[0];
  if (!call || !call[0]) {
    throw new Error('subscribeContent was not called with a listener');
  }
  return call[0];
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('useStreamBuffer', () => {
  let useStreamBuffer: typeof import('@/hooks/useStreamBuffer').useStreamBuffer;

  beforeEach(async () => {
    vi.clearAllMocks();
    rafCallbacks = [];
    rafId = 0;
    isStreamingValue = true;
    mockSubscribeContent.mockReturnValue(mockUnsubscribe);
    mockGetState.mockReturnValue('connected');
    mockGetIsStreamActive.mockReturnValue(true);

    // Dynamic import to pick up fresh mocks
    const mod = await import('@/hooks/useStreamBuffer');
    useStreamBuffer = mod.useStreamBuffer;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('subscribes to wsClient.subscribeContent on mount', () => {
    const textNode = document.createElement('span');
    const textNodeRef = { current: textNode };
    const onFlush = vi.fn();

    renderHook(() => useStreamBuffer({ textNodeRef, onFlush }));

    expect(mockSubscribeContent).toHaveBeenCalledOnce();
    expect(mockSubscribeContent).toHaveBeenCalledWith(expect.any(Function));
  });

  it('tokens appended via onToken accumulate in internal buffer', () => {
    const textNode = document.createElement('span');
    const textNodeRef = { current: textNode };
    const onFlush = vi.fn();

    const { result } = renderHook(() => useStreamBuffer({ textNodeRef, onFlush }));

    const onToken = getTokenListener();
    onToken('Hello');
    onToken(' world');

    expect(result.current.getText()).toBe('Hello world');
  });

  it('rAF paint loop writes accumulated buffer to DOM node textContent', () => {
    const textNode = document.createElement('span');
    const textNodeRef = { current: textNode };
    const onFlush = vi.fn();

    renderHook(() => useStreamBuffer({ textNodeRef, onFlush }));

    const onToken = getTokenListener();
    onToken('Hello');
    onToken(' world');

    // Flush one rAF frame
    flushRaf();

    expect(textNode.textContent).toBe('Hello world');
  });

  it('multiple tokens between frames batch into a single textContent write', () => {
    const textNode = document.createElement('span');
    const textNodeRef = { current: textNode };
    const onFlush = vi.fn();

    renderHook(() => useStreamBuffer({ textNodeRef, onFlush }));

    const onToken = getTokenListener();
    onToken('A');
    onToken('B');
    onToken('C');
    onToken('D');

    // Only one rAF flush needed for all 4 tokens
    flushRaf();

    expect(textNode.textContent).toBe('ABCD');
  });

  it('onFlush callback fires with accumulated text when stream completes (isStreaming goes false)', () => {
    const textNode = document.createElement('span');
    const textNodeRef = { current: textNode };
    const onFlush = vi.fn();

    const { rerender } = renderHook(() => useStreamBuffer({ textNodeRef, onFlush }));

    const onToken = getTokenListener();
    onToken('Complete message');
    flushRaf();

    // Simulate stream completion by changing the mock value and re-rendering
    isStreamingValue = false;
    rerender();

    expect(onFlush).toHaveBeenCalledOnce();
    expect(onFlush).toHaveBeenCalledWith('Complete message');
  });

  it('cleanup cancels rAF and unsubscribes from wsClient on unmount', () => {
    const textNode = document.createElement('span');
    const textNodeRef = { current: textNode };
    const onFlush = vi.fn();

    const { unmount } = renderHook(() => useStreamBuffer({ textNodeRef, onFlush }));

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledOnce();
    expect(cancelAnimationFrame).toHaveBeenCalled();
  });

  it('backlog replay from wsClient.subscribeContent lands in buffer before first paint', () => {
    const textNode = document.createElement('span');
    const textNodeRef = { current: textNode };
    const onFlush = vi.fn();

    // Make subscribeContent replay backlog synchronously
    mockSubscribeContent.mockImplementation((listener: (token: string) => void) => {
      // Simulate backlog replay — these are synchronous
      listener('back');
      listener('log');
      listener(' data');
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useStreamBuffer({ textNodeRef, onFlush }));

    // Before any rAF fires, buffer should have all backlog
    expect(result.current.getText()).toBe('backlog data');

    // Single paint writes all backlog
    flushRaf();
    expect(textNode.textContent).toBe('backlog data');
  });

  it('rAF loop self-terminates when wsClient disconnects mid-stream', () => {
    const textNode = document.createElement('span');
    const textNodeRef = { current: textNode };
    const onFlush = vi.fn();

    renderHook(() => useStreamBuffer({ textNodeRef, onFlush }));

    const onToken = getTokenListener();
    onToken('partial');
    flushRaf();

    // After first paint, there should be a pending rAF callback
    expect(rafCallbacks.length).toBe(1);

    // Simulate disconnect
    mockGetState.mockReturnValue('disconnected');
    mockGetIsStreamActive.mockReturnValue(false);

    // Flush the pending frame -- it should detect disconnect and NOT reschedule
    flushRaf();

    // The loop should have stopped — no new callbacks scheduled
    expect(rafCallbacks.length).toBe(0);

    // Partial text should remain
    expect(textNode.textContent).toBe('partial');
  });

  it('onDisconnect callback fires when connection drops during active buffering', () => {
    const textNode = document.createElement('span');
    const textNodeRef = { current: textNode };
    const onFlush = vi.fn();
    const onDisconnect = vi.fn();

    renderHook(() => useStreamBuffer({ textNodeRef, onFlush, onDisconnect }));

    const onToken = getTokenListener();
    onToken('partial content');
    flushRaf();

    // Simulate disconnect
    mockGetState.mockReturnValue('disconnected');
    mockGetIsStreamActive.mockReturnValue(false);

    // Trigger the paint loop to detect disconnect
    flushRaf();

    expect(onDisconnect).toHaveBeenCalledOnce();
  });

  it('does not fire onFlush when isStreaming is initially false (no false-positive on mount)', () => {
    isStreamingValue = false;
    const textNode = document.createElement('span');
    const textNodeRef = { current: textNode };
    const onFlush = vi.fn();

    renderHook(() => useStreamBuffer({ textNodeRef, onFlush }));

    expect(onFlush).not.toHaveBeenCalled();
  });

  it('getText returns current buffer content', () => {
    const textNode = document.createElement('span');
    const textNodeRef = { current: textNode };
    const onFlush = vi.fn();

    const { result } = renderHook(() => useStreamBuffer({ textNodeRef, onFlush }));

    const onToken = getTokenListener();
    onToken('test');

    expect(result.current.getText()).toBe('test');
  });
});
