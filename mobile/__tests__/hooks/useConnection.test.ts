/**
 * Unit tests for useConnection hook.
 *
 * Tests connection state derivation from the Zustand connection store.
 * Manipulates store state directly and checks hook output.
 *
 * Per D-15: hooks and state logic only, no component rendering.
 */

import { renderHook, act } from '@testing-library/react-native';
import { useConnection } from '../../hooks/useConnection';
import { useConnectionStore } from '../../stores/index';

beforeEach(() => {
  // Reset store to default disconnected state
  act(() => {
    useConnectionStore.getState().reset();
  });
});

describe('useConnection', () => {
  it('returns isConnected=true when store status is connected', () => {
    act(() => {
      useConnectionStore.getState().updateProviderStatus('claude', 'connected');
    });

    const { result } = renderHook(() => useConnection());

    expect(result.current.isConnected).toBe(true);
    expect(result.current.isReconnecting).toBe(false);
    expect(result.current.status).toBe('connected');
  });

  it('returns isReconnecting=true when store status is reconnecting', () => {
    act(() => {
      useConnectionStore.getState().updateProviderStatus('claude', 'reconnecting');
    });

    const { result } = renderHook(() => useConnection());

    expect(result.current.isReconnecting).toBe(true);
    expect(result.current.isConnected).toBe(false);
    expect(result.current.status).toBe('reconnecting');
  });

  it('returns isConnected=false, isReconnecting=false when disconnected', () => {
    // Default state is disconnected
    const { result } = renderHook(() => useConnection());

    expect(result.current.isConnected).toBe(false);
    expect(result.current.isReconnecting).toBe(false);
    expect(result.current.status).toBe('disconnected');
  });

  it('returns error from store providers.claude.error', () => {
    act(() => {
      useConnectionStore.getState().setProviderError('claude', 'Test error message');
    });

    const { result } = renderHook(() => useConnection());

    expect(result.current.error).toBe('Test error message');
  });
});
