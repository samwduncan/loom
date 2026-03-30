/**
 * useLongPress -- tests for custom long-press detection hook.
 *
 * Tests 7 behaviors:
 * 1. Returns empty object when isMobile is false (desktop)
 * 2. Returns touch handlers when isMobile is true (mobile)
 * 3. Calls onLongPress after delay when touch held
 * 4. Does NOT call onLongPress if touch moves beyond threshold
 * 5. Does NOT call onLongPress if touchend fires before delay
 * 6. Calls onCancel when touch moves beyond threshold
 * 7. Cleans up timer on touchend (no stale timeout fires)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLongPress } from './useLongPress';
import type { UseLongPressHandlers } from './useLongPress';

// Mock useMobile
vi.mock('./useMobile', () => ({
  useMobile: vi.fn(() => false),
}));

import { useMobile } from './useMobile';

const mockUseMobile = vi.mocked(useMobile);

describe('useLongPress', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockUseMobile.mockReturnValue(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('returns empty object when isMobile is false (desktop)', () => {
    mockUseMobile.mockReturnValue(false);
    const onLongPress = vi.fn();
    const { result } = renderHook(() =>
      useLongPress({ onLongPress }),
    );

    expect(result.current).toEqual({});
    expect(result.current.onTouchStart).toBeUndefined();
    expect(result.current.onTouchMove).toBeUndefined();
    expect(result.current.onTouchEnd).toBeUndefined();
  });

  it('returns onTouchStart, onTouchMove, onTouchEnd when isMobile is true', () => {
    mockUseMobile.mockReturnValue(true);
    const onLongPress = vi.fn();
    const { result } = renderHook(() =>
      useLongPress({ onLongPress }),
    );

    expect(result.current.onTouchStart).toBeTypeOf('function');
    expect(result.current.onTouchMove).toBeTypeOf('function');
    expect(result.current.onTouchEnd).toBeTypeOf('function');
  });

  it('calls onLongPress after delay when touch held without movement', () => {
    mockUseMobile.mockReturnValue(true);
    const onLongPress = vi.fn();
    const { result } = renderHook(() =>
      useLongPress({ onLongPress }),
    );

    const handlers = result.current as Required<UseLongPressHandlers>;

    act(() => {
      handlers.onTouchStart({
        touches: [{ clientX: 100, clientY: 200 }],
      } as unknown as React.TouchEvent);
    });

    expect(onLongPress).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onLongPress).toHaveBeenCalledOnce();
  });

  it('does NOT call onLongPress if touch moves beyond moveThreshold before delay', () => {
    mockUseMobile.mockReturnValue(true);
    const onLongPress = vi.fn();
    const { result } = renderHook(() =>
      useLongPress({ onLongPress, moveThreshold: 10 }),
    );

    const handlers = result.current as Required<UseLongPressHandlers>;

    act(() => {
      handlers.onTouchStart({
        touches: [{ clientX: 100, clientY: 200 }],
      } as unknown as React.TouchEvent);
    });

    // Move beyond threshold (15px horizontal)
    act(() => {
      handlers.onTouchMove({
        touches: [{ clientX: 115, clientY: 200 }],
      } as unknown as React.TouchEvent);
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('does NOT call onLongPress if touchend fires before delay', () => {
    mockUseMobile.mockReturnValue(true);
    const onLongPress = vi.fn();
    const { result } = renderHook(() =>
      useLongPress({ onLongPress }),
    );

    const handlers = result.current as Required<UseLongPressHandlers>;

    act(() => {
      handlers.onTouchStart({
        touches: [{ clientX: 100, clientY: 200 }],
      } as unknown as React.TouchEvent);
    });

    // Lift finger at 300ms (before 500ms delay)
    act(() => {
      vi.advanceTimersByTime(300);
    });

    act(() => {
      handlers.onTouchEnd();
    });

    // Advance past the original timeout
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('calls onCancel when touch moves beyond threshold during active timer', () => {
    mockUseMobile.mockReturnValue(true);
    const onLongPress = vi.fn();
    const onCancel = vi.fn();
    const { result } = renderHook(() =>
      useLongPress({ onLongPress, onCancel, moveThreshold: 10 }),
    );

    const handlers = result.current as Required<UseLongPressHandlers>;

    act(() => {
      handlers.onTouchStart({
        touches: [{ clientX: 100, clientY: 200 }],
      } as unknown as React.TouchEvent);
    });

    // Move beyond threshold vertically
    act(() => {
      handlers.onTouchMove({
        touches: [{ clientX: 100, clientY: 215 }],
      } as unknown as React.TouchEvent);
    });

    expect(onCancel).toHaveBeenCalledOnce();
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('cleans up timer on touchend (no stale timeout fires)', () => {
    mockUseMobile.mockReturnValue(true);
    const onLongPress = vi.fn();
    const { result } = renderHook(() =>
      useLongPress({ onLongPress }),
    );

    const handlers = result.current as Required<UseLongPressHandlers>;

    // Start then immediately end touch
    act(() => {
      handlers.onTouchStart({
        touches: [{ clientX: 100, clientY: 200 }],
      } as unknown as React.TouchEvent);
    });

    act(() => {
      handlers.onTouchEnd();
    });

    // Even after advancing well past the delay, onLongPress should not fire
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(onLongPress).not.toHaveBeenCalled();

    // Second attempt: start, wait full delay -> should fire
    act(() => {
      handlers.onTouchStart({
        touches: [{ clientX: 50, clientY: 50 }],
      } as unknown as React.TouchEvent);
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onLongPress).toHaveBeenCalledOnce();
  });
});
