/**
 * useAutoCollapse tests -- IntersectionObserver-based message collapse detection.
 *
 * Tests verify:
 * - observeRef creates IntersectionObserver per message
 * - isCollapsed returns correct state after IO fires
 * - toggleExpand pins a message open (not re-collapsed by IO)
 * - toggleExpand again unpins and immediately collapses
 * - Cleanup disconnects all observers on unmount
 * - Collapse is debounced (300ms), expand is immediate
 * - Ref callbacks are stable across renders (no observer churn)
 * - Observer not created when scrollContainerRef is null
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutoCollapse } from './useAutoCollapse';

// --- Mock IntersectionObserver ---
type IOCallback = IntersectionObserverCallback;
type IOInstance = {
  callback: IOCallback;
  options?: IntersectionObserverInit;
  observe: ReturnType<typeof vi.fn>;
  unobserve: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
};

let ioInstances: IOInstance[] = [];

class MockIntersectionObserver {
  callback: IOCallback;
  options?: IntersectionObserverInit;
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  constructor(callback: IOCallback, options?: IntersectionObserverInit) {
    this.callback = callback;
    this.options = options;
    ioInstances.push(this as unknown as IOInstance);
  }
}

vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

function makeScrollRef() {
  return { current: document.createElement('div') };
}

/** Helper to get the first IO instance (test controls array population) */
function firstIO(): IOInstance {
  // ASSERT: test has created at least one IO instance via observeRef before calling this
  return ioInstances[0] as IOInstance;
}

/** Simulate IO firing for a specific instance */
function fireIO(instance: IOInstance, isIntersecting: boolean) {
  instance.callback(
    [{ isIntersecting, target: {} } as unknown as IntersectionObserverEntry],
    {} as IntersectionObserver,
  );
}

describe('useAutoCollapse', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    ioInstances = [];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('observeRef creates an IntersectionObserver for a message', () => {
    const scrollRef = makeScrollRef();
    const { result } = renderHook(() => useAutoCollapse(scrollRef));

    const el = document.createElement('div');
    act(() => {
      const refCallback = result.current.observeRef('msg-0');
      refCallback(el);
    });

    expect(ioInstances.length).toBe(1);
    expect(firstIO().observe).toHaveBeenCalledWith(el);
  });

  it('passes scrollContainerRef as IO root', () => {
    const scrollRef = makeScrollRef();
    const { result } = renderHook(() => useAutoCollapse(scrollRef));

    act(() => {
      result.current.observeRef('msg-0')(document.createElement('div'));
    });

    expect(firstIO().options?.root).toBe(scrollRef.current);
  });

  it('does NOT create observer when scrollContainerRef is null', () => {
    const scrollRef = { current: null };
    const { result } = renderHook(() => useAutoCollapse(scrollRef));

    act(() => {
      result.current.observeRef('msg-0')(document.createElement('div'));
    });

    expect(ioInstances.length).toBe(0);
  });

  it('isCollapsed returns false by default', () => {
    const scrollRef = makeScrollRef();
    const { result } = renderHook(() => useAutoCollapse(scrollRef));

    expect(result.current.isCollapsed('msg-0')).toBe(false);
  });

  it('marks a message as collapsed when IO fires !isIntersecting (after debounce)', () => {
    const scrollRef = makeScrollRef();
    const { result } = renderHook(() => useAutoCollapse(scrollRef));

    const el = document.createElement('div');
    act(() => {
      result.current.observeRef('msg-0')(el);
    });

    // Fire IO: message leaves viewport
    act(() => {
      fireIO(firstIO(), false);
    });

    // Before debounce: still not collapsed
    expect(result.current.isCollapsed('msg-0')).toBe(false);

    // After 300ms debounce
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.isCollapsed('msg-0')).toBe(true);
  });

  it('expands immediately when IO fires isIntersecting (no debounce)', () => {
    const scrollRef = makeScrollRef();
    const { result } = renderHook(() => useAutoCollapse(scrollRef));

    const el = document.createElement('div');
    act(() => {
      result.current.observeRef('msg-0')(el);
    });

    // Collapse first
    act(() => {
      fireIO(firstIO(), false);
      vi.advanceTimersByTime(300);
    });
    expect(result.current.isCollapsed('msg-0')).toBe(true);

    // Expand: should be immediate
    act(() => {
      fireIO(firstIO(), true);
    });
    expect(result.current.isCollapsed('msg-0')).toBe(false);
  });

  it('toggleExpand pins a message open (not re-collapsed by IO)', () => {
    const scrollRef = makeScrollRef();
    const { result } = renderHook(() => useAutoCollapse(scrollRef));

    const el = document.createElement('div');
    act(() => {
      result.current.observeRef('msg-0')(el);
    });

    // Collapse via IO
    act(() => {
      fireIO(firstIO(), false);
      vi.advanceTimersByTime(300);
    });
    expect(result.current.isCollapsed('msg-0')).toBe(true);

    // Pin open via toggleExpand
    act(() => {
      result.current.toggleExpand('msg-0');
    });
    expect(result.current.isCollapsed('msg-0')).toBe(false);

    // IO fires !isIntersecting again -- should NOT collapse (pinned)
    act(() => {
      fireIO(firstIO(), false);
      vi.advanceTimersByTime(300);
    });
    expect(result.current.isCollapsed('msg-0')).toBe(false);
  });

  it('toggleExpand again unpins and immediately collapses', () => {
    const scrollRef = makeScrollRef();
    const { result } = renderHook(() => useAutoCollapse(scrollRef));

    const el = document.createElement('div');
    act(() => {
      result.current.observeRef('msg-0')(el);
    });

    // Collapse, then pin
    act(() => {
      fireIO(firstIO(), false);
      vi.advanceTimersByTime(300);
    });
    act(() => {
      result.current.toggleExpand('msg-0'); // pin
    });
    expect(result.current.isCollapsed('msg-0')).toBe(false);

    // Unpin: should immediately collapse (not wait for IO)
    act(() => {
      result.current.toggleExpand('msg-0'); // unpin
    });
    expect(result.current.isCollapsed('msg-0')).toBe(true);
  });

  it('cleanup disconnects all observers on unmount', () => {
    const scrollRef = makeScrollRef();
    const { result, unmount } = renderHook(() => useAutoCollapse(scrollRef));

    // Create two observers
    act(() => {
      result.current.observeRef('msg-0')(document.createElement('div'));
      result.current.observeRef('msg-1')(document.createElement('div'));
    });

    expect(ioInstances.length).toBe(2);

    unmount();

    for (const inst of ioInstances) {
      expect(inst.disconnect).toHaveBeenCalled();
    }
  });

  it('cancels pending collapse timeout on expand', () => {
    const scrollRef = makeScrollRef();
    const { result } = renderHook(() => useAutoCollapse(scrollRef));

    const el = document.createElement('div');
    act(() => {
      result.current.observeRef('msg-0')(el);
    });

    // Start collapse (fires IO, starts 300ms debounce)
    act(() => {
      fireIO(firstIO(), false);
    });

    // Before debounce completes, IO fires expand
    act(() => {
      vi.advanceTimersByTime(100);
      fireIO(firstIO(), true);
    });

    // Advance past original debounce time
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Should NOT be collapsed (expand cancelled the pending collapse)
    expect(result.current.isCollapsed('msg-0')).toBe(false);
  });

  it('returns stable ref callbacks for the same messageId', () => {
    const scrollRef = makeScrollRef();
    const { result, rerender } = renderHook(() => useAutoCollapse(scrollRef));

    const cb1 = result.current.observeRef('msg-0');
    rerender();
    const cb2 = result.current.observeRef('msg-0');

    expect(cb1).toBe(cb2);
  });

  it('cleans up observer when ref callback receives null', () => {
    const scrollRef = makeScrollRef();
    const { result } = renderHook(() => useAutoCollapse(scrollRef));

    const el = document.createElement('div');
    let refCb: (el: HTMLElement | null) => void;
    act(() => {
      refCb = result.current.observeRef('msg-0');
      refCb(el);
    });

    expect(ioInstances.length).toBe(1);

    // React calls ref callback with null on unmount
    act(() => {
      refCb(null);
    });

    expect(firstIO().disconnect).toHaveBeenCalled();
  });
});
