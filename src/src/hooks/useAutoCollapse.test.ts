/**
 * useAutoCollapse tests -- IntersectionObserver-based message collapse detection.
 *
 * Tests verify:
 * - observeRef creates IntersectionObserver per message
 * - Messages within collapseThreshold (last 10) are never collapsed
 * - isCollapsed returns correct state after IO fires
 * - toggleExpand pins a message open (not re-collapsed by IO)
 * - toggleExpand again unpins and allows re-collapse
 * - Cleanup disconnects all observers on unmount
 * - Collapse is debounced (300ms), expand is immediate
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

  it('observeRef creates an IntersectionObserver for eligible messages', () => {
    const scrollRef = makeScrollRef();
    const { result } = renderHook(() => useAutoCollapse(scrollRef, 20));

    // Message at index 0 (far from bottom, eligible: 0 < 20 - 10)
    const el = document.createElement('div');
    act(() => {
      const refCallback = result.current.observeRef('msg-0', 0);
      refCallback(el);
    });

    expect(ioInstances.length).toBe(1);
    expect(firstIO().observe).toHaveBeenCalledWith(el);
  });

  it('does NOT create observer for messages within collapseThreshold (last 10)', () => {
    const scrollRef = makeScrollRef();
    const { result } = renderHook(() => useAutoCollapse(scrollRef, 20));

    // Index 15 >= 20 - 10 = 10, so it IS protected
    const el = document.createElement('div');
    act(() => {
      const refCallback = result.current.observeRef('msg-15', 15);
      refCallback(el);
    });

    // No observer should be created for protected messages
    expect(ioInstances.length).toBe(0);
  });

  it('isCollapsed returns false by default', () => {
    const scrollRef = makeScrollRef();
    const { result } = renderHook(() => useAutoCollapse(scrollRef, 20));

    expect(result.current.isCollapsed('msg-0')).toBe(false);
  });

  it('marks a message as collapsed when IO fires !isIntersecting (after debounce)', () => {
    const scrollRef = makeScrollRef();
    const { result } = renderHook(() => useAutoCollapse(scrollRef, 20));

    const el = document.createElement('div');
    act(() => {
      result.current.observeRef('msg-0', 0)(el);
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
    const { result } = renderHook(() => useAutoCollapse(scrollRef, 20));

    const el = document.createElement('div');
    act(() => {
      result.current.observeRef('msg-0', 0)(el);
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
    const { result } = renderHook(() => useAutoCollapse(scrollRef, 20));

    const el = document.createElement('div');
    act(() => {
      result.current.observeRef('msg-0', 0)(el);
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

  it('toggleExpand again unpins and allows re-collapse', () => {
    const scrollRef = makeScrollRef();
    const { result } = renderHook(() => useAutoCollapse(scrollRef, 20));

    const el = document.createElement('div');
    act(() => {
      result.current.observeRef('msg-0', 0)(el);
    });

    // Collapse, pin, unpin
    act(() => {
      fireIO(firstIO(), false);
      vi.advanceTimersByTime(300);
    });
    act(() => {
      result.current.toggleExpand('msg-0'); // pin
    });
    act(() => {
      result.current.toggleExpand('msg-0'); // unpin
    });

    // IO fires !isIntersecting -- should collapse now (unpinned)
    act(() => {
      fireIO(firstIO(), false);
      vi.advanceTimersByTime(300);
    });
    expect(result.current.isCollapsed('msg-0')).toBe(true);
  });

  it('cleanup disconnects all observers on unmount', () => {
    const scrollRef = makeScrollRef();
    const { result, unmount } = renderHook(() => useAutoCollapse(scrollRef, 20));

    // Create two observers
    act(() => {
      result.current.observeRef('msg-0', 0)(document.createElement('div'));
      result.current.observeRef('msg-1', 1)(document.createElement('div'));
    });

    expect(ioInstances.length).toBe(2);

    unmount();

    for (const inst of ioInstances) {
      expect(inst.disconnect).toHaveBeenCalled();
    }
  });

  it('cancels pending collapse timeout on expand', () => {
    const scrollRef = makeScrollRef();
    const { result } = renderHook(() => useAutoCollapse(scrollRef, 20));

    const el = document.createElement('div');
    act(() => {
      result.current.observeRef('msg-0', 0)(el);
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

  it('uses custom collapseThreshold', () => {
    const scrollRef = makeScrollRef();
    const { result } = renderHook(() => useAutoCollapse(scrollRef, 20, 5));

    // Index 14 < 20 - 5 = 15, so NOT protected -- eligible
    const el1 = document.createElement('div');
    act(() => {
      result.current.observeRef('msg-14', 14)(el1);
    });
    expect(ioInstances.length).toBe(1);

    // Index 16 >= 15, so IS protected
    const el2 = document.createElement('div');
    act(() => {
      result.current.observeRef('msg-16', 16)(el2);
    });
    expect(ioInstances.length).toBe(1); // No new observer
  });

  it('cleans up observer when ref callback receives null', () => {
    const scrollRef = makeScrollRef();
    const { result } = renderHook(() => useAutoCollapse(scrollRef, 20));

    const el = document.createElement('div');
    let refCb: (el: HTMLElement | null) => void;
    act(() => {
      refCb = result.current.observeRef('msg-0', 0);
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
