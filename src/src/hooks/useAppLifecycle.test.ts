/**
 * Tests for useAppLifecycle hook -- foreground reconnect with debounce.
 *
 * Covers: web no-op, foreground triggers reconnect when disconnected,
 * no reconnect when already connected, debounce prevents rapid calls.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const { platformMock, mockInitAppLifecycle, mockWsClient, mockConnectionState } = vi.hoisted(() => ({
  platformMock: { IS_NATIVE: false },
  mockInitAppLifecycle: vi.fn(),
  mockWsClient: { tryReconnect: vi.fn() },
  mockConnectionState: {
    providers: {
      claude: { status: 'disconnected' as string },
      codex: { status: 'disconnected' },
      gemini: { status: 'disconnected' },
    },
  },
}));

vi.mock('@/lib/platform', () => platformMock);

vi.mock('@/lib/app-lifecycle', () => ({
  initAppLifecycle: mockInitAppLifecycle,
}));

vi.mock('@/lib/websocket-client', () => ({
  wsClient: mockWsClient,
}));

vi.mock('@/stores/connection', () => ({
  useConnectionStore: {
    getState: () => mockConnectionState,
  },
}));

import { useAppLifecycle } from '@/hooks/useAppLifecycle';

describe('useAppLifecycle', () => {
  let foregroundCallback: (() => void) | null = null;
  const mockCleanup = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    foregroundCallback = null;
    mockCleanup.mockClear();
    mockWsClient.tryReconnect.mockClear();
    mockConnectionState.providers.claude.status = 'disconnected';
    platformMock.IS_NATIVE = false;

    mockInitAppLifecycle.mockImplementation(async (cb: () => void) => {
      foregroundCallback = cb;
      return mockCleanup;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('is a no-op on web', () => {
    platformMock.IS_NATIVE = false;
    renderHook(() => useAppLifecycle());
    expect(mockInitAppLifecycle).not.toHaveBeenCalled();
  });

  it('calls initAppLifecycle on native', async () => {
    platformMock.IS_NATIVE = true;
    renderHook(() => useAppLifecycle());
    // Let the async initAppLifecycle resolve
    await vi.runAllTimersAsync();
    expect(mockInitAppLifecycle).toHaveBeenCalledTimes(1);
  });

  it('calls tryReconnect on foreground when disconnected', async () => {
    platformMock.IS_NATIVE = true;
    mockConnectionState.providers.claude.status = 'disconnected';
    renderHook(() => useAppLifecycle());
    await vi.runAllTimersAsync();

    // Simulate foreground event
    act(() => {
      foregroundCallback?.();
    });

    // Advance past debounce
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(mockWsClient.tryReconnect).toHaveBeenCalledTimes(1);
  });

  it('does NOT call tryReconnect when already connected', async () => {
    platformMock.IS_NATIVE = true;
    mockConnectionState.providers.claude.status = 'connected';
    renderHook(() => useAppLifecycle());
    await vi.runAllTimersAsync();

    // Simulate foreground event
    act(() => {
      foregroundCallback?.();
    });

    // Advance past debounce
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(mockWsClient.tryReconnect).not.toHaveBeenCalled();
  });

  it('debounces rapid foreground events (300ms)', async () => {
    platformMock.IS_NATIVE = true;
    mockConnectionState.providers.claude.status = 'disconnected';
    renderHook(() => useAppLifecycle());
    await vi.runAllTimersAsync();

    // Fire three rapid foreground events
    act(() => {
      foregroundCallback?.();
    });
    await act(async () => {
      vi.advanceTimersByTime(50);
    });
    act(() => {
      foregroundCallback?.();
    });
    await act(async () => {
      vi.advanceTimersByTime(50);
    });
    act(() => {
      foregroundCallback?.();
    });

    // Advance past debounce from last event
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    // Should only call once despite 3 rapid events
    expect(mockWsClient.tryReconnect).toHaveBeenCalledTimes(1);
  });

  it('cleans up listener on unmount', async () => {
    platformMock.IS_NATIVE = true;
    const { unmount } = renderHook(() => useAppLifecycle());
    await vi.runAllTimersAsync();

    unmount();

    expect(mockCleanup).toHaveBeenCalledTimes(1);
  });
});
