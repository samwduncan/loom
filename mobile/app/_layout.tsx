/**
 * Root layout -- app entry point with providers, auth gate, and WebSocket init.
 *
 * CRITICAL (S-7): Uses <Slot /> NOT <Drawer>. The Drawer navigator lives
 * exclusively in (drawer)/_layout.tsx. Two nested Drawers = runtime crash.
 *
 * CRITICAL (A-6): 3-way render prevents blank flash during auth check:
 *   1. isLoading -> splash/loading state
 *   2. !isAuthenticated -> AuthPrompt
 *   3. authenticated -> main app (Slot + ConnectionBanner)
 *
 * Provider stack (outer to inner):
 *   GestureHandlerRootView -> KeyboardProvider -> auth gate -> Slot
 *
 * WebSocket lifecycle: initializeWebSocket() called once when isAuthenticated
 * becomes true. AppState lifecycle is managed inside websocket-init.ts.
 */

import '../global.css';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
// KeyboardProvider removed — using RN's built-in KeyboardAvoidingView per screen
import { Slot } from 'expo-router';
import { AuthPrompt } from '../components/connection/AuthPrompt';
import { ConnectionBanner } from '../components/connection/ConnectionBanner';
import { useAuth } from '../hooks/useAuth';
import { initializeWebSocket } from '../lib/websocket-init';
import { SURFACE } from '../lib/colors';

export default function RootLayout() {
  const { isAuthenticated, isLoading, checkAuth, login, logout } = useAuth();

  // Check for existing token on app start
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Initialize WebSocket when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      initializeWebSocket();
    }
  }, [isAuthenticated]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: SURFACE.base }}>
        {isLoading ? (
          // Splash state -- prevents blank flash while reading token from Keychain
          <View
            style={{
              flex: 1,
              backgroundColor: SURFACE.base,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <ActivityIndicator color={SURFACE.overlay} />
          </View>
        ) : !isAuthenticated ? (
          <AuthPrompt onLogin={login} />
        ) : (
          <View style={{ flex: 1 }}>
            <ConnectionBanner onLogout={logout} />
            <Slot />
          </View>
        )}
    </GestureHandlerRootView>
  );
}
