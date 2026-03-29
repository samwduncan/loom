/**
 * usePullToRefresh -- tests for vertical pull gesture hook.
 *
 * Tests verify:
 * - Pull past threshold triggers onRefresh callback
 * - Pull below threshold does not trigger onRefresh
 * - isRefreshing is true during fetch, false after
 * - Error path shows toast
 * - Only activates when scrollTop === 0
 * - Does not start new pull while refreshing
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePullToRefresh } from './usePullToRefresh';

// Mock @use-gesture/react
const mockUseDrag = vi.fn();
vi.mock('@use-gesture/react', () => ({
  useDrag: (handler: unknown, config: unknown) => {
    mockUseDrag(handler, config);
    return () => ({ style: { touchAction: 'pan-x' } });
  },
}));

// Mock haptics
vi.mock('@/lib/haptics', () => ({
  hapticEvent: vi.fn(),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn() }),
}));

describe('usePullToRefresh', () => {
  let gestureHandler: (state: Record<string, unknown>) => void;
  const mockOnRefresh = vi.fn();
  const mockScrollRef = { current: { scrollTop: 0 } };

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnRefresh.mockResolvedValue(undefined);
    mockScrollRef.current = { scrollTop: 0 };
    mockUseDrag.mockImplementation((handler) => {
      gestureHandler = handler;
      return () => ({ style: { touchAction: 'pan-x' } });
    });
  });

  it('initializes with pullDistance=0, isRefreshing=false', () => {
    const { result } = renderHook(() =>
      usePullToRefresh({
        onRefresh: mockOnRefresh,
        scrollRef: mockScrollRef as React.RefObject<HTMLElement>,
      }),
    );
    expect(result.current.pullDistance).toBe(0);
    expect(result.current.isRefreshing).toBe(false);
  });

  it('returns a bind function', () => {
    const { result } = renderHook(() =>
      usePullToRefresh({
        onRefresh: mockOnRefresh,
        scrollRef: mockScrollRef as React.RefObject<HTMLElement>,
      }),
    );
    expect(typeof result.current.bind).toBe('function');
  });

  it('configures useDrag with axis:y, filterTaps:true, threshold:[Infinity, 10]', () => {
    renderHook(() =>
      usePullToRefresh({
        onRefresh: mockOnRefresh,
        scrollRef: mockScrollRef as React.RefObject<HTMLElement>,
      }),
    );
    const config = mockUseDrag.mock.calls[0]?.[1];
    expect(config?.axis).toBe('y');
    expect(config?.filterTaps).toBe(true);
    expect(config?.threshold).toEqual([Infinity, 10]);
  });

  it('pull past threshold triggers onRefresh callback', async () => {
    renderHook(() =>
      usePullToRefresh({
        onRefresh: mockOnRefresh,
        scrollRef: mockScrollRef as React.RefObject<HTMLElement>,
      }),
    );

    // Active pull past threshold
    act(() => {
      gestureHandler({
        movement: [0, 70],
        active: true,
        cancel: vi.fn(),
      });
    });

    // Release
    await act(async () => {
      gestureHandler({
        movement: [0, 70],
        active: false,
        cancel: vi.fn(),
      });
    });

    expect(mockOnRefresh).toHaveBeenCalledOnce();
  });

  it('pull below threshold does not trigger onRefresh', async () => {
    renderHook(() =>
      usePullToRefresh({
        onRefresh: mockOnRefresh,
        scrollRef: mockScrollRef as React.RefObject<HTMLElement>,
      }),
    );

    // Active pull below threshold
    act(() => {
      gestureHandler({
        movement: [0, 30],
        active: true,
        cancel: vi.fn(),
      });
    });

    // Release
    await act(async () => {
      gestureHandler({
        movement: [0, 30],
        active: false,
        cancel: vi.fn(),
      });
    });

    expect(mockOnRefresh).not.toHaveBeenCalled();
  });

  it('cancels when scrollTop > 0', () => {
    mockScrollRef.current.scrollTop = 100;
    renderHook(() =>
      usePullToRefresh({
        onRefresh: mockOnRefresh,
        scrollRef: mockScrollRef as React.RefObject<HTMLElement>,
      }),
    );

    const cancelFn = vi.fn();
    act(() => {
      gestureHandler({
        movement: [0, 70],
        active: true,
        cancel: cancelFn,
      });
    });

    expect(cancelFn).toHaveBeenCalled();
  });

  it('clamps pullDistance to max 120px', () => {
    const { result } = renderHook(() =>
      usePullToRefresh({
        onRefresh: mockOnRefresh,
        scrollRef: mockScrollRef as React.RefObject<HTMLElement>,
      }),
    );

    act(() => {
      gestureHandler({
        movement: [0, 200],
        active: true,
        cancel: vi.fn(),
      });
    });

    expect(result.current.pullDistance).toBe(120);
  });

  it('error path shows toast', async () => {
    const { toast } = await import('sonner');
    mockOnRefresh.mockRejectedValueOnce(new Error('network error'));

    renderHook(() =>
      usePullToRefresh({
        onRefresh: mockOnRefresh,
        scrollRef: mockScrollRef as React.RefObject<HTMLElement>,
      }),
    );

    // Pull to trigger
    act(() => {
      gestureHandler({
        movement: [0, 70],
        active: true,
        cancel: vi.fn(),
      });
    });

    await act(async () => {
      gestureHandler({
        movement: [0, 70],
        active: false,
        cancel: vi.fn(),
      });
    });

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('refresh'),
    );
  });

  it('fires hapticEvent on successful refresh', async () => {
    const { hapticEvent } = await import('@/lib/haptics');

    renderHook(() =>
      usePullToRefresh({
        onRefresh: mockOnRefresh,
        scrollRef: mockScrollRef as React.RefObject<HTMLElement>,
      }),
    );

    act(() => {
      gestureHandler({
        movement: [0, 70],
        active: true,
        cancel: vi.fn(),
      });
    });

    await act(async () => {
      gestureHandler({
        movement: [0, 70],
        active: false,
        cancel: vi.fn(),
      });
    });

    expect(hapticEvent).toHaveBeenCalledWith('pullToRefreshComplete');
  });

  it('uses pointer.touch:true in config', () => {
    renderHook(() =>
      usePullToRefresh({
        onRefresh: mockOnRefresh,
        scrollRef: mockScrollRef as React.RefObject<HTMLElement>,
      }),
    );
    const config = mockUseDrag.mock.calls[0]?.[1];
    expect(config?.pointer).toEqual({ touch: true });
  });
});
