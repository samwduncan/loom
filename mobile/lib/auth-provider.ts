import * as SecureStore from 'expo-secure-store';
import type { AuthProvider } from '@loom/shared/lib/auth';

const TOKEN_KEY = 'loom-jwt';

export const nativeAuthProvider: AuthProvider = {
  getToken: () => SecureStore.getItem(TOKEN_KEY) || null,
  setToken: (token: string) => SecureStore.setItem(TOKEN_KEY, token),
  clearToken: () => { SecureStore.deleteItemAsync(TOKEN_KEY); },
};
