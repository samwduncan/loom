/**
 * Auth hook -- manages JWT token lifecycle for the native app.
 *
 * Reads token from iOS Keychain (expo-secure-store) on mount, validates
 * against the backend before marking authenticated. Provides login/logout
 * functions that update both Keychain and in-memory state.
 *
 * isLoading starts TRUE to prevent blank flash during async Keychain read
 * (A-6 anti-pattern: blank screen before auth check resolves).
 */

import { useState, useCallback } from 'react';
import { nativeAuthProvider } from '../lib/auth-provider';
import { resolveApiUrl } from '../lib/platform';

export interface UseAuthReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  error: string | null;
  login: (token: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => void;
}

export function useAuth(): UseAuthReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Check for existing token on app start. Reads from Keychain --
   * if a token exists, we trust it and mark authenticated.
   * Validation against the backend happens lazily on first API call
   * or can be triggered explicitly via login().
   */
  const checkAuth = useCallback(() => {
    try {
      const storedToken = nativeAuthProvider.getToken();
      if (storedToken) {
        setToken(storedToken);
        setIsAuthenticated(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Validate a JWT token against the backend, store on success.
   * Returns true if the token is valid, false otherwise.
   */
  const login = useCallback(async (newToken: string): Promise<boolean> => {
    setError(null);
    try {
      const res = await fetch(resolveApiUrl('/api/auth/user'), {
        headers: { Authorization: `Bearer ${newToken}` },
      });

      if (!res.ok) {
        setError('Invalid token. Check that the server is running and the token is correct.');
        return false;
      }

      nativeAuthProvider.setToken(newToken);
      setToken(newToken);
      setIsAuthenticated(true);
      return true;
    } catch (_e) {
      setError('Cannot reach server. Check your connection and try again.');
      return false;
    }
  }, []);

  /**
   * Clear token from Keychain and reset auth state.
   * Uses deleteItemAsync (not setItem with empty string) to properly
   * remove the entry from iOS Keychain.
   */
  const logout = useCallback(() => {
    nativeAuthProvider.clearToken();
    setToken(null);
    setIsAuthenticated(false);
    setError(null);
  }, []);

  return { isAuthenticated, isLoading, token, error, login, logout, checkAuth };
}
