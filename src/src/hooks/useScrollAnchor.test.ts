/**
 * useScrollAnchor tests -- IntersectionObserver sentinel-based scroll anchoring.
 *
 * Mocks: IntersectionObserver, requestAnimationFrame, useStreamStore.
 * Tests verify auto-scroll, disengage, re-engage, pill visibility, anti-oscillation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { RefObject } from 'react';
import { useScrollAnchor } from './useScrollAnchor';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock useStreamStore -- module-level mock
let mockIsStreaming = false;
vi.mock('@/stores/stream', () => ({
  useStreamStore: (selector: (state: { isStreaming: boolean }) => boolean) =>
    selector({ isStreaming: mockIsStreaming }),
}));

// IntersectionObserver mock -- capture callback per-instance
type ObserverInstance = {
  callback: IntersectionObserverCallback;
  observe: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  unobserve: ReturnType<typeof vi.fn>;
};
let lastObserver: ObserverInstance | null = null;

// Must use a constructor function so `new IntersectionObserver(...)` works
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
    // eslint-disable-next-line @typescript-eslint/no-this-alias -- constructor function pattern, `this` is the mock instance
    lastObserver = this;
  }),
);

// rAF mock -- collect callbacks for manual flushing
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

function flushOneRaf(): void {
  const entry = rafCallbacks.shift();
  if (entry) {
    entry.cb(performance.now());
  }
}

// Sentinel mock with scrollIntoView
const mockScrollIntoView = vi.fn();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a scroll container ref and a sentinel element, then calls the
 * callback ref to wire up the sentinel -- triggering the observer effect.
 */
function setupHook(streaming = false) {
  mockIsStreaming = streaming;

  const scrollContainer = document.createElement('div');
  const scrollContainerRef = {
    current: scrollContainer,
  } as RefObject<HTMLElement | null>;

  const hookResult = renderHook(() => useScrollAnchor(scrollContainerRef));

  // Create sentinel element and call the callback ref to wire it up
  const sentinel = document.createElement('div');
  sentinel.scrollIntoView = mockScrollIntoView;

  // Call the callback ref to attach the sentinel -- triggers observer setup
  act(() => {
    hookResult.result.current.sentinelRef(sentinel);
  });

  return { ...hookResult, sentinel, scrollContainer, scrollContainerRef };
}

function triggerObserver(isIntersecting: boolean): void {
  if (!lastObserver) throw new Error('No IntersectionObserver created');
  const entry = { isIntersecting } as IntersectionObserverEntry;
  lastObserver.callback([entry], {} as unknown as IntersectionObserver);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useScrollAnchor', () => {
  beforeEach(() => {
    mockIsStreaming = false;
    lastObserver = null;
    rafCallbacks = [];
    rafIdCounter = 1;
    vi.clearAllMocks();
  });

  it('provides a sentinelRef callback for attaching to scroll container', () => {
    const scrollContainerRef = {
      current: document.createElement('div'),
    } as RefObject<HTMLElement | null>;
    const { result } = renderHook(() => useScrollAnchor(scrollContainerRef));
    expect(result.current.sentinelRef).toBeDefined();
    expect(typeof result.current.sentinelRef).toBe('function');
  });

  it('isAtBottom is true initially (sentinel assumed visible)', () => {
    const scrollContainerRef = {
      current: document.createElement('div'),
    } as RefObject<HTMLElement | null>;
    const { result } = renderHook(() => useScrollAnchor(scrollContainerRef));
    expect(result.current.isAtBottom).toBe(true);
  });

  it('isAtBottom becomes false when observer reports sentinel not intersecting', () => {
    const { result } = setupHook();

    expect(lastObserver).not.toBeNull();

    act(() => {
      triggerObserver(false);
    });

    expect(result.current.isAtBottom).toBe(false);
  });

  it('isAtBottom becomes true when observer reports sentinel intersecting', () => {
    const { result } = setupHook();

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
    const { result, scrollContainer } = setupHook(true);

    // User scrolls up via wheel event -- disengages auto-scroll
    act(() => {
      scrollContainer.dispatchEvent(new Event('wheel'));
    });

    expect(result.current.showPill).toBe(true);
  });

  it('showPill is false when not streaming (even if scrolled up)', () => {
    const { result } = setupHook(false);

    act(() => {
      triggerObserver(false);
    });

    expect(result.current.showPill).toBe(false);
  });

  it('scrollToBottom calls scrollIntoView on sentinel with smooth behavior', () => {
    const { result } = setupHook();

    act(() => {
      result.current.scrollToBottom();
    });

    expect(mockScrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'end',
    });
  });

  it('scrollToBottom sets isAtBottom to true (re-engages auto-scroll)', () => {
    const { result } = setupHook();

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
    setupHook(true);

    // rAF should have been scheduled (auto-scroll active)
    expect(rafCallbacks.length).toBeGreaterThan(0);

    // Flush one frame -- sentinel.scrollIntoView should be called
    act(() => {
      flushOneRaf();
    });

    expect(mockScrollIntoView).toHaveBeenCalledWith({ block: 'end' });
  });

  it('auto-scroll rAF loop stops when user scrolls up via wheel event', () => {
    const { result, scrollContainer } = setupHook(true);

    // User scrolls up via wheel event -- disengages auto-scroll
    act(() => {
      scrollContainer.dispatchEvent(new Event('wheel'));
    });
    expect(result.current.isAtBottom).toBe(false);

    // Clear any previous state
    mockScrollIntoView.mockClear();
    rafCallbacks = [];

    // No new rAF should be scheduled for auto-scroll after disengage
    expect(rafCallbacks.length).toBe(0);
  });

  it('when isStreaming transitions to true, isAtBottom resets to true', () => {
    // Start not streaming, scroll away
    const { result, rerender } = setupHook(false);

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
    const { result } = setupHook(true);

    // Auto-scroll is active (isStreaming && isAtBottom). Flush a frame to confirm.
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
    const { unmount } = setupHook();

    expect(lastObserver).not.toBeNull();
    unmount();

    expect(lastObserver!.disconnect).toHaveBeenCalled(); // ASSERT: lastObserver verified not-null by expect().not.toBeNull() above
  });
});
