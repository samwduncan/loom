/**
 * useChatScroll tests -- IntersectionObserver sentinel + ResizeObserver auto-follow.
 *
 * Mocks: IntersectionObserver, ResizeObserver, requestAnimationFrame, sessionStorage.
 * Tests verify IO sentinel, auto-scroll, pill debounce, session switch, unread tracking,
 * user gesture detection, stream re-engagement, scroll position save/restore, statusTap.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { RefObject } from 'react';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock platform.ts IS_NATIVE
let mockIsNative = false;
vi.mock('@/lib/platform', () => ({
  get IS_NATIVE() { return mockIsNative; },
}));

// Mock useStreamStore
let mockIsStreaming = false;
vi.mock('@/stores/stream', () => ({
  useStreamStore: (selector: (state: { isStreaming: boolean }) => boolean) =>
    selector({ isStreaming: mockIsStreaming }),
}));

// IntersectionObserver mock
type IOInstance = {
  callback: IntersectionObserverCallback;
  options: IntersectionObserverInit | undefined;
  observe: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  unobserve: ReturnType<typeof vi.fn>;
};
let ioInstances: IOInstance[] = [];

vi.stubGlobal(
  'IntersectionObserver',
  vi.fn(function MockIO(
    this: IOInstance,
    cb: IntersectionObserverCallback,
    options?: IntersectionObserverInit,
  ) {
    this.callback = cb;
    this.options = options;
    this.observe = vi.fn();
    this.disconnect = vi.fn();
    this.unobserve = vi.fn();
    ioInstances.push(this);
  }),
);

// ResizeObserver mock
type ROInstance = {
  callback: ResizeObserverCallback;
  observe: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  unobserve: ReturnType<typeof vi.fn>;
};
let roInstances: ROInstance[] = [];

vi.stubGlobal(
  'ResizeObserver',
  vi.fn(function MockRO(
    this: ROInstance,
    cb: ResizeObserverCallback,
  ) {
    this.callback = cb;
    this.observe = vi.fn();
    this.disconnect = vi.fn();
    this.unobserve = vi.fn();
    roInstances.push(this);
  }),
);

// rAF mock
let rafCallbacks: Array<{ id: number; cb: FrameRequestCallback }> = [];
let rafIdCounter = 1;

vi.stubGlobal(
  'requestAnimationFrame',
  vi.fn((cb: FrameRequestCallback) => {
    const id = rafIdCounter++;
    rafCallbacks.push({ id, cb });
    return id;
  }),
);

vi.stubGlobal(
  'cancelAnimationFrame',
  vi.fn((id: number) => {
    rafCallbacks = rafCallbacks.filter((entry) => entry.id !== id);
  }),
);

function flushAllRafs(): void {
  const callbacks = [...rafCallbacks];
  rafCallbacks = [];
  for (const entry of callbacks) {
    entry.cb(performance.now());
  }
}

// sessionStorage mock
const sessionStorageData: Record<string, string> = {};
const mockSessionStorage = {
  getItem: vi.fn((key: string) => sessionStorageData[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { sessionStorageData[key] = value; }),
  removeItem: vi.fn((key: string) => { delete sessionStorageData[key]; }),
  clear: vi.fn(() => { for (const key of Object.keys(sessionStorageData)) delete sessionStorageData[key]; }),
  get length() { return Object.keys(sessionStorageData).length; },
  key: vi.fn((index: number) => Object.keys(sessionStorageData)[index] ?? null),
};
vi.stubGlobal('sessionStorage', mockSessionStorage);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getLastIO(): IOInstance {
  const inst = ioInstances[ioInstances.length - 1];
  if (!inst) throw new Error('No IntersectionObserver created');
  return inst;
}

function getLastRO(): ROInstance {
  const inst = roInstances[roInstances.length - 1];
  if (!inst) throw new Error('No ResizeObserver created');
  return inst;
}

function triggerIO(inst: IOInstance, isIntersecting: boolean): void {
  const entry = { isIntersecting } as IntersectionObserverEntry;
  inst.callback([entry], {} as unknown as IntersectionObserver);
}

function triggerRO(inst: ROInstance): void {
  inst.callback([], {} as unknown as ResizeObserver);
}

function makeScrollContainer(): HTMLDivElement {
  const el = document.createElement('div');
  // Add a child as content wrapper
  const child = document.createElement('div');
  el.appendChild(child);
  Object.defineProperty(el, 'scrollHeight', { value: 1000, writable: true, configurable: true });
  Object.defineProperty(el, 'scrollTop', { value: 0, writable: true, configurable: true });
  Object.defineProperty(el, 'clientHeight', { value: 500, writable: true, configurable: true });
  el.scrollTo = vi.fn();
  return el;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useChatScroll', () => {
  let useChatScroll: typeof import('./useChatScroll').useChatScroll;

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });
    mockIsStreaming = false;
    mockIsNative = false;
    ioInstances = [];
    roInstances = [];
    rafCallbacks = [];
    rafIdCounter = 1;
    mockSessionStorage.clear();
    vi.clearAllMocks();

    const mod = await import('./useChatScroll');
    useChatScroll = mod.useChatScroll;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function setupHook(opts?: {
    streaming?: boolean;
    sessionId?: string;
    messageCount?: number;
    container?: HTMLDivElement;
  }) {
    const streaming = opts?.streaming ?? false;
    const sessionId = opts?.sessionId ?? 'session-1';
    const messageCount = opts?.messageCount ?? 0;
    mockIsStreaming = streaming;
    const container = opts?.container ?? makeScrollContainer();
    const scrollContainerRef = { current: container } as RefObject<HTMLDivElement | null>;

    const hookResult = renderHook(
      (props) => useChatScroll(props),
      {
        initialProps: {
          scrollContainerRef,
          sessionId,
          isStreaming: streaming,
          messageCount,
        },
      },
    );

    // Call sentinel callback ref to wire up
    const sentinel = document.createElement('div');
    act(() => {
      hookResult.result.current.sentinelRef(sentinel);
    });

    return { ...hookResult, sentinel, container, scrollContainerRef };
  }

  // ─── IO Sentinel Tests ────────────────────────────────────────────────

  it('IO sentinel entering viewport sets isAtBottomRef to true and hides pill after 200ms debounce', () => {
    const { result } = setupHook();

    // First scroll away
    const io = getLastIO();
    act(() => { triggerIO(io, false); });
    act(() => { vi.advanceTimersByTime(200); });
    expect(result.current.showPill).toBe(true);

    // Sentinel enters viewport
    act(() => { triggerIO(io, true); });
    act(() => { vi.advanceTimersByTime(200); });
    expect(result.current.showPill).toBe(false);
    expect(result.current.isAtBottomRef.current).toBe(true);
  });

  it('IO sentinel exiting viewport (not auto-scrolling) sets isAtBottomRef to false and shows pill after 200ms', () => {
    const { result } = setupHook();

    const io = getLastIO();
    act(() => { triggerIO(io, false); });
    act(() => { vi.advanceTimersByTime(200); });

    expect(result.current.showPill).toBe(true);
    expect(result.current.isAtBottomRef.current).toBe(false);
  });

  it('IO sentinel exiting viewport while isAutoScrollingRef is true does NOT change isAtBottomRef (anti-oscillation)', () => {
    // Start streaming + at bottom -> auto-scrolling active
    const { result } = setupHook({ streaming: true });

    // isAtBottomRef should be true, auto-scrolling should be active
    expect(result.current.isAtBottomRef.current).toBe(true);

    // IO says sentinel exited (during programmatic scroll)
    const io = getLastIO();
    act(() => { triggerIO(io, false); });
    act(() => { vi.advanceTimersByTime(200); });

    // Should NOT have changed because auto-scrolling is active
    expect(result.current.isAtBottomRef.current).toBe(true);
    expect(result.current.showPill).toBe(false);
  });

  // ─── ResizeObserver Auto-Follow Tests ─────────────────────────────────

  it('ResizeObserver callback when isAtBottom triggers rAF-throttled scrollTop assignment', () => {
    const { container } = setupHook({ streaming: true });

    // Trigger RO
    const ro = getLastRO();
    act(() => { triggerRO(ro); });

    // Should have scheduled a rAF
    expect(rafCallbacks.length).toBeGreaterThan(0);

    // Flush rAF
    act(() => { flushAllRafs(); });

    // container.scrollTop should have been assigned scrollHeight - clientHeight
    expect(container.scrollTop).toBe(500); // 1000 - 500
  });

  it('ResizeObserver callback when isAtBottom is false does NOT trigger scroll', () => {
    const { container } = setupHook();

    // Scroll away first
    const io = getLastIO();
    act(() => { triggerIO(io, false); });
    act(() => { vi.advanceTimersByTime(200); });

    // Trigger RO
    const ro = getLastRO();
    act(() => { triggerRO(ro); });

    // No new rAF should be scheduled for auto-scroll
    // (some rAFs may exist from other things, so check no scrollTop change)
    act(() => { flushAllRafs(); });
    expect(container.scrollTop).toBe(0); // unchanged
  });

  it('ResizeObserver callback skips if rAF frame already pending (throttle guard)', () => {
    setupHook({ streaming: true });

    const ro = getLastRO();
    // First trigger schedules rAF
    act(() => { triggerRO(ro); });
    const firstRafCount = rafCallbacks.length;

    // Second trigger while rAF pending -- should NOT schedule another
    act(() => { triggerRO(ro); });
    expect(rafCallbacks.length).toBe(firstRafCount);
  });

  // ─── Session Switch Tests ─────────────────────────────────────────────

  it('session change resets isAtBottomRef to true, unreadCount to 0, and pill state', () => {
    const { result, rerender } = setupHook({ messageCount: 5 });

    // Scroll away and add unread
    const io = getLastIO();
    act(() => { triggerIO(io, false); });
    act(() => { vi.advanceTimersByTime(200); });
    expect(result.current.showPill).toBe(true);

    // Rerender with new messages while scrolled up (generates unread)
    rerender({
      scrollContainerRef: { current: makeScrollContainer() } as RefObject<HTMLDivElement | null>,
      sessionId: 'session-1',
      isStreaming: false,
      messageCount: 8,
    });
    act(() => { vi.advanceTimersByTime(200); });
    expect(result.current.unreadCount).toBe(3);

    // Switch session
    const newContainer = makeScrollContainer();
    rerender({
      scrollContainerRef: { current: newContainer } as RefObject<HTMLDivElement | null>,
      sessionId: 'session-2',
      isStreaming: false,
      messageCount: 0,
    });
    act(() => { vi.advanceTimersByTime(200); });

    expect(result.current.isAtBottomRef.current).toBe(true);
    expect(result.current.unreadCount).toBe(0);
    expect(result.current.showPill).toBe(false);
  });

  // ─── scrollToBottom Tests ─────────────────────────────────────────────

  it('scrollToBottom() sets container.scrollTop, resets unread, and schedules pill hide', () => {
    const { result, container } = setupHook();

    // Scroll away first
    const io = getLastIO();
    act(() => { triggerIO(io, false); });
    act(() => { vi.advanceTimersByTime(200); });

    // Call scrollToBottom
    act(() => { result.current.scrollToBottom(); });
    act(() => { vi.advanceTimersByTime(200); });

    expect(container.scrollTo).toHaveBeenCalledWith(
      expect.objectContaining({ top: expect.any(Number), behavior: 'smooth' }),
    );
    expect(result.current.unreadCount).toBe(0);
    expect(result.current.showPill).toBe(false);
  });

  // ─── User Gesture Detection ───────────────────────────────────────────

  it('wheel event on container disengages auto-scroll', () => {
    const { result, container } = setupHook({ streaming: true });

    expect(result.current.isAtBottomRef.current).toBe(true);

    // Dispatch wheel event
    act(() => {
      container.dispatchEvent(new Event('wheel'));
    });

    expect(result.current.isAtBottomRef.current).toBe(false);
  });

  it('touchmove event on container disengages auto-scroll', () => {
    const { result, container } = setupHook({ streaming: true });

    act(() => {
      container.dispatchEvent(new Event('touchmove'));
    });

    expect(result.current.isAtBottomRef.current).toBe(false);
  });

  // ─── Stream Start Re-engagement ───────────────────────────────────────

  it('stream start (isStreaming false->true) re-engages auto-scroll', () => {
    const container = makeScrollContainer();
    const scrollContainerRef = { current: container } as RefObject<HTMLDivElement | null>;

    const { result, rerender } = renderHook(
      (props) => useChatScroll(props),
      {
        initialProps: {
          scrollContainerRef,
          sessionId: 'session-1',
          isStreaming: false,
          messageCount: 5,
        },
      },
    );

    // Wire sentinel
    act(() => {
      result.current.sentinelRef(document.createElement('div'));
    });

    // Scroll away
    const io = getLastIO();
    act(() => { triggerIO(io, false); });
    act(() => { vi.advanceTimersByTime(200); });
    expect(result.current.isAtBottomRef.current).toBe(false);

    // Stream starts
    mockIsStreaming = true;
    rerender({
      scrollContainerRef,
      sessionId: 'session-1',
      isStreaming: true,
      messageCount: 5,
    });

    expect(result.current.isAtBottomRef.current).toBe(true);
  });

  // ─── Unread Count Tracking ────────────────────────────────────────────

  it('unread count increments when messageCount increases while isAtBottom is false', () => {
    const container = makeScrollContainer();
    const scrollContainerRef = { current: container } as RefObject<HTMLDivElement | null>;

    const { result, rerender } = renderHook(
      (props) => useChatScroll(props),
      {
        initialProps: {
          scrollContainerRef,
          sessionId: 'session-1',
          isStreaming: false,
          messageCount: 5,
        },
      },
    );

    // Wire sentinel
    act(() => {
      result.current.sentinelRef(document.createElement('div'));
    });

    // Scroll away
    const io = getLastIO();
    act(() => { triggerIO(io, false); });
    act(() => { vi.advanceTimersByTime(200); });

    // New messages arrive
    rerender({
      scrollContainerRef,
      sessionId: 'session-1',
      isStreaming: false,
      messageCount: 8,
    });
    act(() => { vi.advanceTimersByTime(200); });

    expect(result.current.unreadCount).toBe(3);
  });

  // ─── statusTap (iOS) ─────────────────────────────────────────────────

  it('statusTap window event when IS_NATIVE triggers scrollTo top with smooth behavior', async () => {
    mockIsNative = true;

    // Re-import with IS_NATIVE = true
    vi.resetModules();
    const mod = await import('./useChatScroll');
    const useChatScrollNative = mod.useChatScroll;

    const container = makeScrollContainer();
    const scrollContainerRef = { current: container } as RefObject<HTMLDivElement | null>;

    const { result } = renderHook(() =>
      useChatScrollNative({
        scrollContainerRef,
        sessionId: 'session-1',
        isStreaming: false,
        messageCount: 0,
      }),
    );

    act(() => {
      result.current.sentinelRef(document.createElement('div'));
    });

    // Dispatch statusTap
    act(() => {
      window.dispatchEvent(new Event('statusTap'));
    });

    expect(container.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('statusTap does NOT trigger scrollTo when IS_NATIVE is false', () => {
    // Default mockIsNative is false
    const { container } = setupHook({});

    act(() => {
      window.dispatchEvent(new Event('statusTap'));
    });

    expect(container.scrollTo).not.toHaveBeenCalled();
  });

  // ─── Scroll Position Save/Restore ─────────────────────────────────────

  it('scroll triggers throttled sessionStorage save', () => {
    const { container } = setupHook({ sessionId: 'save-test' });

    // Simulate scroll (dispatch scroll event on container)
    Object.defineProperty(container, 'scrollTop', { value: 250, writable: true, configurable: true });
    act(() => {
      container.dispatchEvent(new Event('scroll'));
    });

    // Before debounce, nothing saved
    expect(mockSessionStorage.setItem).not.toHaveBeenCalledWith(
      expect.stringContaining('save-test'),
      expect.any(String),
    );

    // After 200ms trailing throttle
    act(() => { vi.advanceTimersByTime(200); });

    expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
      expect.stringContaining('save-test'),
      '250',
    );
  });

  it('session switch restores scroll position from sessionStorage', () => {
    const container = makeScrollContainer();
    const scrollContainerRef = { current: container } as RefObject<HTMLDivElement | null>;

    // Pre-populate sessionStorage for session-2
    sessionStorageData['loom-scroll-session-2'] = '300';

    const { rerender, result } = renderHook(
      (props) => useChatScroll(props),
      {
        initialProps: {
          scrollContainerRef,
          sessionId: 'session-1',
          isStreaming: false,
          messageCount: 5,
        },
      },
    );

    act(() => {
      result.current.sentinelRef(document.createElement('div'));
    });

    // Switch to session-2
    const newContainer = makeScrollContainer();
    const newRef = { current: newContainer } as RefObject<HTMLDivElement | null>;
    rerender({
      scrollContainerRef: newRef,
      sessionId: 'session-2',
      isStreaming: false,
      messageCount: 3,
    });

    // rAF should be scheduled for restore
    act(() => { flushAllRafs(); });

    expect(newContainer.scrollTop).toBe(300);
  });

  // ─── IO rootMargin ────────────────────────────────────────────────────

  it('IntersectionObserver uses rootMargin with -150px', () => {
    setupHook();
    const io = getLastIO();
    expect(io.options?.rootMargin).toContain('-150px');
  });

  // ─── Cleanup ──────────────────────────────────────────────────────────

  it('observers clean up on unmount', () => {
    const { unmount } = setupHook();
    const io = getLastIO();
    const ro = getLastRO();

    unmount();

    expect(io.disconnect).toHaveBeenCalled();
    expect(ro.disconnect).toHaveBeenCalled();
  });
});
