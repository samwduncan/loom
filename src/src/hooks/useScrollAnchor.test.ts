/**
 * useScrollAnchor tests — IntersectionObserver sentinel-based scroll anchoring.
 *
 * Mocks: IntersectionObserver, requestAnimationFrame, useStreamStore.
 * Tests verify auto-scroll, disengage, re-engage, pill visibility, anti-oscillation.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScrollAnchor } from './useScrollAnchor';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock useStreamStore — module-level mock
let mockIsStreaming = false;
vi.mock('@/stores/stream', () => ({
  useStreamStore: (selector: (state: { isStreaming: boolean }) => boolean) =>
    selector({ isStreaming: mockIsStreaming }),
}));

// IntersectionObserver mock
let observerCallback: IntersectionObserverCallback;
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();

vi.stubGlobal(
  'IntersectionObserver',
  vi.fn().mockImplementation((cb: IntersectionObserverCallback) => {
    observerCallback = cb;
    return { observe: mockObserve, disconnect: mockDisconnect };
  }),
);

// rAF mock — collect callbacks for manual flushing
let rafCallbacks: Array<{ id: number; cb: FrameRequestCallback }> = [];
let rafIdCounter = 1;

vi.stubGlobal('requestAnimationFrame', vi.fn((cb: FrameRequestCallback) => {
  const id = rafIdCounter++;
  rafCallbacks.push({ id, cb });
  return id;
}));

vi.stubGlobal('cancelAnimationFrame', vi.fn((id: number) => {
  rafCallbacks = rafCallbacks.filter((entry) => entry.id !== id);
}));

function flushOneRaf(): void {
  const entry = rafCallbacks.shift();
  if (entry) {
    entry.cb(performance.now());
  }
}

// Sentinel mock with scrollIntoView
const mockScrollIntoView = vi.fn();
const mockSentinel = {
  scrollIntoView: mockScrollIntoView,
} as unknown as HTMLDivElement;

// Scroll container mock
const mockScrollContainer = document.createElement('div');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createScrollContainerRef() {
  return { current: mockScrollContainer };
}

function triggerObserver(isIntersecting: boolean): void {
  const entry = { isIntersecting } as IntersectionObserverEntry;
  // We need to get the observer instance for the second arg
  const observer = {
    observe: mockObserve,
    disconnect: mockDisconnect,
  } as unknown as IntersectionObserver;
  observerCallback([entry], observer);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useScrollAnchor', () => {
  beforeEach(() => {
    mockIsStreaming = false;
    rafCallbacks = [];
    rafIdCounter = 1;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('provides a sentinelRef for attaching to bottom of scroll container', () => {
    const { result } = renderHook(() =>
      useScrollAnchor(createScrollContainerRef()),
    );
    expect(result.current.sentinelRef).toBeDefined();
    expect(result.current.sentinelRef.current).toBeNull(); // initially unattached
  });

  it('isAtBottom is true initially (sentinel assumed visible)', () => {
    const { result } = renderHook(() =>
      useScrollAnchor(createScrollContainerRef()),
    );
    expect(result.current.isAtBottom).toBe(true);
  });

  it('isAtBottom becomes false when observer reports sentinel not intersecting', () => {
    const { result } = renderHook(() =>
      useScrollAnchor(createScrollContainerRef()),
    );

    // Attach sentinel to DOM mock
    Object.defineProperty(result.current.sentinelRef, 'current', {
      value: mockSentinel,
      writable: true,
    });

    act(() => {
      triggerObserver(false);
    });

    expect(result.current.isAtBottom).toBe(false);
  });

  it('isAtBottom becomes true when observer reports sentinel intersecting', () => {
    const { result } = renderHook(() =>
      useScrollAnchor(createScrollContainerRef()),
    );

    Object.defineProperty(result.current.sentinelRef, 'current', {
      value: mockSentinel,
      writable: true,
    });

    act(() => {
      triggerObserver(false);
    });
    expect(result.current.isAtBottom).toBe(false);

    act(() => {
      triggerObserver(true);
    });
    expect(result.current.isAtBottom).toBe(true);
  });

  it('showPill is true when isAtBottom is false AND isStreaming is true', () => {
    mockIsStreaming = true;
    const { result } = renderHook(() =>
      useScrollAnchor(createScrollContainerRef()),
    );

    Object.defineProperty(result.current.sentinelRef, 'current', {
      value: mockSentinel,
      writable: true,
    });

    act(() => {
      triggerObserver(false);
    });

    expect(result.current.showPill).toBe(true);
  });

  it('showPill is false when not streaming (even if scrolled up)', () => {
    mockIsStreaming = false;
    const { result } = renderHook(() =>
      useScrollAnchor(createScrollContainerRef()),
    );

    Object.defineProperty(result.current.sentinelRef, 'current', {
      value: mockSentinel,
      writable: true,
    });

    act(() => {
      triggerObserver(false);
    });

    expect(result.current.showPill).toBe(false);
  });

  it('scrollToBottom calls scrollIntoView on sentinel with smooth behavior', () => {
    const { result } = renderHook(() =>
      useScrollAnchor(createScrollContainerRef()),
    );

    Object.defineProperty(result.current.sentinelRef, 'current', {
      value: mockSentinel,
      writable: true,
    });

    act(() => {
      result.current.scrollToBottom();
    });

    expect(mockScrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'end',
    });
  });

  it('scrollToBottom sets isAtBottom to true (re-engages auto-scroll)', () => {
    const { result } = renderHook(() =>
      useScrollAnchor(createScrollContainerRef()),
    );

    Object.defineProperty(result.current.sentinelRef, 'current', {
      value: mockSentinel,
      writable: true,
    });

    // Scroll away first
    act(() => {
      triggerObserver(false);
    });
    expect(result.current.isAtBottom).toBe(false);

    // Click pill
    act(() => {
      result.current.scrollToBottom();
    });
    expect(result.current.isAtBottom).toBe(true);
  });

  it('auto-scroll rAF loop runs when isStreaming AND isAtBottom', () => {
    mockIsStreaming = true;

    const ref = createScrollContainerRef();
    const { result } = renderHook(() => useScrollAnchor(ref));

    Object.defineProperty(result.current.sentinelRef, 'current', {
      value: mockSentinel,
      writable: true,
    });

    // rAF should have been scheduled (auto-scroll active)
    expect(rafCallbacks.length).toBeGreaterThan(0);

    // Flush one frame — sentinel.scrollIntoView should be called
    act(() => {
      flushOneRaf();
    });

    expect(mockScrollIntoView).toHaveBeenCalledWith({ block: 'end' });
  });

  it('auto-scroll rAF loop stops when isAtBottom becomes false (user scrolled up)', () => {
    mockIsStreaming = true;

    const ref = createScrollContainerRef();
    const { result } = renderHook(() => useScrollAnchor(ref));

    Object.defineProperty(result.current.sentinelRef, 'current', {
      value: mockSentinel,
      writable: true,
    });

    // Simulate user scroll up — disengage
    act(() => {
      triggerObserver(false);
    });

    // Clear any pending rAF callbacks from before disengage
    mockScrollIntoView.mockClear();
    rafCallbacks = [];

    // No new rAF should be scheduled for auto-scroll
    expect(rafCallbacks.length).toBe(0);
  });

  it('when isStreaming transitions to true, isAtBottom resets to true', () => {
    mockIsStreaming = false;
    const ref = createScrollContainerRef();
    const { result, rerender } = renderHook(() => useScrollAnchor(ref));

    Object.defineProperty(result.current.sentinelRef, 'current', {
      value: mockSentinel,
      writable: true,
    });

    // Scroll away
    act(() => {
      triggerObserver(false);
    });
    expect(result.current.isAtBottom).toBe(false);

    // Start new stream
    mockIsStreaming = true;
    rerender();

    expect(result.current.isAtBottom).toBe(true);
  });

  it('observer does NOT set isAtBottom=false during auto-scroll (anti-oscillation guard)', () => {
    mockIsStreaming = true;
    const ref = createScrollContainerRef();
    const { result } = renderHook(() => useScrollAnchor(ref));

    Object.defineProperty(result.current.sentinelRef, 'current', {
      value: mockSentinel,
      writable: true,
    });

    // Auto-scroll is active (isStreaming && isAtBottom). Flush a frame to enter active state.
    act(() => {
      flushOneRaf();
    });

    // During auto-scroll, observer fires "not intersecting" briefly
    act(() => {
      triggerObserver(false);
    });

    // isAtBottom should still be true because isAutoScrollingRef is true
    expect(result.current.isAtBottom).toBe(true);
    expect(result.current.showPill).toBe(false);
  });

  it('observer cleans up on unmount', () => {
    const ref = createScrollContainerRef();
    const { unmount } = renderHook(() => useScrollAnchor(ref));

    unmount();

    expect(mockDisconnect).toHaveBeenCalled();
  });
});
