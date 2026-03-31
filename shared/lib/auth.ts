/**
 * Auth provider interface -- platform-agnostic token storage abstraction.
 *
 * Web implements this with localStorage, native with Keychain (expo-secure-store).
 * The shared API client and WebSocket client consume this interface for auth.
 */

export interface AuthProvider {
  getToken(): string | null;
  setToken(token: string): void;
  clearToken(): void;
}
