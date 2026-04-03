/**
 * Unit tests for useAuth hook.
 *
 * Tests JWT lifecycle: checkAuth (stored/missing token), login (success/invalid/network error),
 * and logout (clearToken via deleteItemAsync, not setItem).
 *
 * Per D-15: hooks and state logic only, no component rendering.
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useAuth } from '../../hooks/useAuth';

const SecureStore = require('expo-secure-store');

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  jest.clearAllMocks();
  SecureStore.getItem.mockReturnValue(null);
  SecureStore.getItemAsync.mockResolvedValue(null);
});

describe('useAuth', () => {
  it('checkAuth with stored token sets isAuthenticated=true and isLoading=false', () => {
    SecureStore.getItem.mockReturnValue('stored-valid-token');

    const { result } = renderHook(() => useAuth());

    // Initially isLoading is true
    expect(result.current.isLoading).toBe(true);

    act(() => {
      result.current.checkAuth();
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.token).toBe('stored-valid-token');
  });

  it('checkAuth with no stored token sets isAuthenticated=false and isLoading=false', () => {
    SecureStore.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.checkAuth();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.token).toBeNull();
  });

  it('login with valid token (fetch 200) sets isAuthenticated=true and calls setToken', async () => {
    mockFetch.mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useAuth());

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.login('new-valid-token');
    });

    expect(success).toBe(true);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.token).toBe('new-valid-token');
    expect(SecureStore.setItem).toHaveBeenCalledWith('loom-jwt', 'new-valid-token');
    expect(result.current.error).toBeNull();
  });

  it('login with invalid token (fetch 401) sets error and does NOT set isAuthenticated', async () => {
    mockFetch.mockResolvedValue({ ok: false });

    const { result } = renderHook(() => useAuth());

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.login('bad-token');
    });

    expect(success).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toContain('Invalid token');
    expect(SecureStore.setItem).not.toHaveBeenCalled();
  });

  it('login with unreachable server (fetch throws) sets error string', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useAuth());

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.login('any-token');
    });

    expect(success).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toContain('Cannot reach server');
  });

  it('logout clears token via deleteItemAsync (not setItem) and sets isAuthenticated=false', async () => {
    // First authenticate
    mockFetch.mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('valid-token');
    });

    expect(result.current.isAuthenticated).toBe(true);

    // Now logout
    act(() => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.token).toBeNull();
    // clearToken calls deleteItemAsync, NOT setItem with empty string
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('loom-jwt');
  });
});
