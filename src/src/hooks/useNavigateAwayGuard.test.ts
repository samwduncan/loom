/**
 * Tests for useNavigateAwayGuard hook.
 *
 * Verifies beforeunload listener is registered only when streaming is active,
 * and properly cleaned up when streaming stops or component unmounts.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useNavigateAwayGuard } from './useNavigateAwayGuard';

// Mock the stream store
const mockIsStreaming = vi.fn(() => false);

vi.mock('@/stores/stream', () => ({
  useStreamStore: (selector: (state: { isStreaming: boolean }) => boolean) =>
    selector({ isStreaming: mockIsStreaming() }),
}));

describe('useNavigateAwayGuard', () => {
  let addSpy: ReturnType<typeof vi.spyOn>;
  let removeSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    addSpy = vi.spyOn(window, 'addEventListener');
    removeSpy = vi.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not add beforeunload listener when not streaming', () => {
    mockIsStreaming.mockReturnValue(false);
    renderHook(() => useNavigateAwayGuard());

    const beforeunloadCalls = addSpy.mock.calls.filter(
      ([evt]: [string, ...unknown[]]) => evt === 'beforeunload',
    );
    expect(beforeunloadCalls).toHaveLength(0);
  });

  it('adds beforeunload listener when streaming is active', () => {
    mockIsStreaming.mockReturnValue(true);
    renderHook(() => useNavigateAwayGuard());

    const beforeunloadCalls = addSpy.mock.calls.filter(
      ([evt]: [string, ...unknown[]]) => evt === 'beforeunload',
    );
    expect(beforeunloadCalls).toHaveLength(1);
  });

  it('sets event.returnValue when beforeunload fires during streaming', () => {
    mockIsStreaming.mockReturnValue(true);
    renderHook(() => useNavigateAwayGuard());

    const handler = addSpy.mock.calls.find(
      ([evt]: [string, ...unknown[]]) => evt === 'beforeunload',
    )?.[1] as EventListener;

    expect(handler).toBeDefined();

    // jsdom's Event doesn't have a writable returnValue by default,
    // so we create a plain object that mimics BeforeUnloadEvent.
    const event = { returnValue: '' } as BeforeUnloadEvent;
    handler(event as unknown as Event);

    expect(event.returnValue).toBe(
      'You have an active streaming session. Are you sure you want to leave?',
    );
  });

  it('removes beforeunload listener when streaming stops', () => {
    mockIsStreaming.mockReturnValue(true);
    const { rerender } = renderHook(() => useNavigateAwayGuard());

    // Verify it was added
    expect(
      addSpy.mock.calls.filter(([evt]: [string, ...unknown[]]) => evt === 'beforeunload'),
    ).toHaveLength(1);

    // Transition to not streaming
    mockIsStreaming.mockReturnValue(false);
    rerender();

    const removeCalls = removeSpy.mock.calls.filter(
      ([evt]: [string, ...unknown[]]) => evt === 'beforeunload',
    );
    expect(removeCalls).toHaveLength(1);
  });

  it('removes beforeunload listener on unmount', () => {
    mockIsStreaming.mockReturnValue(true);
    const { unmount } = renderHook(() => useNavigateAwayGuard());

    unmount();

    const removeCalls = removeSpy.mock.calls.filter(
      ([evt]: [string, ...unknown[]]) => evt === 'beforeunload',
    );
    expect(removeCalls).toHaveLength(1);
  });
});
