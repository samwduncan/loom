/**
 * useSwipeToDelete -- tests for horizontal swipe gesture hook.
 *
 * Tests verify:
 * - Left swipe past 80px sets revealed=true, offset=-80
 * - Right swipe is cancelled (offset stays 0)
 * - Release below threshold snaps back
 * - reset() clears all state
 * - active reflects gesture in-progress state
 * - Haptic fires on threshold crossing
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSwipeToDelete } from './useSwipeToDelete';

// Mock @use-gesture/react
const mockUseDrag = vi.fn();
vi.mock('@use-gesture/react', () => ({
  useDrag: (handler: unknown, config: unknown) => {
    mockUseDrag(handler, config);
    return () => ({ style: { touchAction: 'pan-y' } });
  },
}));

// Mock haptics
vi.mock('@/lib/haptics', () => ({
  hapticEvent: vi.fn(),
}));

describe('useSwipeToDelete', () => {
  let gestureHandler: (state: Record<string, unknown>) => void;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseDrag.mockImplementation((handler) => {
      gestureHandler = handler;
      return () => ({ style: { touchAction: 'pan-y' } });
    });
  });

  it('initializes with offset=0, revealed=false, active=false', () => {
    const { result } = renderHook(() => useSwipeToDelete());
    expect(result.current.offset).toBe(0);
    expect(result.current.revealed).toBe(false);
    expect(result.current.active).toBe(false);
  });

  it('returns a bind function', () => {
    const { result } = renderHook(() => useSwipeToDelete());
    expect(typeof result.current.bind).toBe('function');
  });

  it('returns a reset function', () => {
    const { result } = renderHook(() => useSwipeToDelete());
    expect(typeof result.current.reset).toBe('function');
  });

  it('configures useDrag with axis:x, filterTaps:true, threshold:[10, Infinity]', () => {
    renderHook(() => useSwipeToDelete());
    expect(mockUseDrag).toHaveBeenCalled();
    const config = mockUseDrag.mock.calls[0]?.[1];
    expect(config?.axis).toBe('x');
    expect(config?.filterTaps).toBe(true);
    expect(config?.threshold).toEqual([10, Infinity]);
  });

  it('configures useDrag with pointer.touch:true', () => {
    renderHook(() => useSwipeToDelete());
    const config = mockUseDrag.mock.calls[0]?.[1];
    expect(config?.pointer).toEqual({ touch: true });
  });

  it('left swipe past 80px on release sets revealed=true and offset=-80', () => {
    const { result } = renderHook(() => useSwipeToDelete());

    // Simulate active drag past threshold
    act(() => {
      gestureHandler({
        movement: [-90, 0],
        velocity: [0.3, 0],
        direction: [-1, 0],
        cancel: vi.fn(),
        active: true,
      });
    });

    // Release
    act(() => {
      gestureHandler({
        movement: [-90, 0],
        velocity: [0.3, 0],
        direction: [-1, 0],
        cancel: vi.fn(),
        active: false,
      });
    });

    expect(result.current.revealed).toBe(true);
    expect(result.current.offset).toBe(-80);
  });

  it('right swipe is cancelled -- offset stays 0', () => {
    renderHook(() => useSwipeToDelete());
    const cancelFn = vi.fn();

    act(() => {
      gestureHandler({
        movement: [50, 0],
        velocity: [0.3, 0],
        direction: [1, 0],
        cancel: cancelFn,
        active: true,
      });
    });

    expect(cancelFn).toHaveBeenCalled();
  });

  it('release below threshold snaps back to offset=0', () => {
    const { result } = renderHook(() => useSwipeToDelete());

    // Drag below threshold
    act(() => {
      gestureHandler({
        movement: [-30, 0],
        velocity: [0.2, 0],
        direction: [-1, 0],
        cancel: vi.fn(),
        active: true,
      });
    });

    // Release
    act(() => {
      gestureHandler({
        movement: [-30, 0],
        velocity: [0.2, 0],
        direction: [-1, 0],
        cancel: vi.fn(),
        active: false,
      });
    });

    expect(result.current.offset).toBe(0);
    expect(result.current.revealed).toBe(false);
  });

  it('high velocity left swipe auto-reveals even below displacement threshold', () => {
    const { result } = renderHook(() => useSwipeToDelete());

    // Release with high velocity but low displacement
    act(() => {
      gestureHandler({
        movement: [-40, 0],
        velocity: [0.8, 0],
        direction: [-1, 0],
        cancel: vi.fn(),
        active: false,
      });
    });

    expect(result.current.revealed).toBe(true);
    expect(result.current.offset).toBe(-80);
  });

  it('reset() clears offset, revealed, and active', () => {
    const { result } = renderHook(() => useSwipeToDelete());

    // Swipe to reveal
    act(() => {
      gestureHandler({
        movement: [-90, 0],
        velocity: [0.3, 0],
        direction: [-1, 0],
        cancel: vi.fn(),
        active: false,
      });
    });

    expect(result.current.revealed).toBe(true);

    // Reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.offset).toBe(0);
    expect(result.current.revealed).toBe(false);
    expect(result.current.active).toBe(false);
  });

  it('active reflects gesture in-progress state', () => {
    const { result } = renderHook(() => useSwipeToDelete());

    // Start drag
    act(() => {
      gestureHandler({
        movement: [-20, 0],
        velocity: [0.1, 0],
        direction: [-1, 0],
        cancel: vi.fn(),
        active: true,
      });
    });

    expect(result.current.active).toBe(true);

    // End drag
    act(() => {
      gestureHandler({
        movement: [-20, 0],
        velocity: [0.1, 0],
        direction: [-1, 0],
        cancel: vi.fn(),
        active: false,
      });
    });

    expect(result.current.active).toBe(false);
  });

  it('clamps offset to max -120px during active drag', () => {
    const { result } = renderHook(() => useSwipeToDelete());

    act(() => {
      gestureHandler({
        movement: [-200, 0],
        velocity: [0.1, 0],
        direction: [-1, 0],
        cancel: vi.fn(),
        active: true,
      });
    });

    expect(result.current.offset).toBe(-120);
  });

  it('fires hapticEvent on threshold crossing', async () => {
    const { hapticEvent } = await import('@/lib/haptics');
    renderHook(() => useSwipeToDelete());

    act(() => {
      gestureHandler({
        movement: [-85, 0],
        velocity: [0.1, 0],
        direction: [-1, 0],
        cancel: vi.fn(),
        active: true,
      });
    });

    expect(hapticEvent).toHaveBeenCalledWith('swipeReveal');
  });

  it('has from function in useDrag config', () => {
    renderHook(() => useSwipeToDelete());
    const config = mockUseDrag.mock.calls[0]?.[1];
    expect(typeof config?.from).toBe('function');
  });
});
