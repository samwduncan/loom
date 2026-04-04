/**
 * Root layout -- entry point for the Loom native app.
 *
 * Provider stack: GestureHandlerRootView > KeyboardProvider > SafeAreaProvider > auth gate > Slot
 *
 * 4-way render gate:
 *   1. !fontsLoaded || isLoading -> ActivityIndicator splash (no blank flash, no system font fallback)
 *   2. !isAuthenticated -> AuthScreen
 *   3. authenticated -> Slot (Expo Router renders child routes)
 *
 * CONN-03: WebSocket connects automatically when user authenticates.
 * CONN-07: Foreground resume verified in websocket-init.ts (uses .connect(token), NOT .tryReconnect()).
 */

import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Slot } from 'expo-router';
import { useFonts } from 'expo-font';
import { AuthScreen } from '../components/auth/AuthScreen';
import { ConnectionBanner } from '../components/connection/ConnectionBanner';
import { ToolDetailSheetProvider } from '../components/chat/segments/ToolDetailSheet';
import { ToastProvider } from '../lib/toast';
import { useAuth } from '../hooks/useAuth';
import { initializeWebSocket } from '../lib/websocket-init';
import { theme } from '../theme/theme';

export default function RootLayout() {
  const { isAuthenticated, isLoading, error, checkAuth, login } = useAuth();

  const [fontsLoaded] = useFonts({
    'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
    'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
    'JetBrainsMono-Regular': require('../assets/fonts/JetBrainsMono-Regular.ttf'),
  });

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      initializeWebSocket();
    }
  }, [isAuthenticated]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.colors.surface.base }}>
      <KeyboardProvider>
        <SafeAreaProvider>
          <ToolDetailSheetProvider>
            <ToastProvider>
              <StatusBar style="light" />
              {(!fontsLoaded || isLoading) ? (
                <View
                  style={{
                    flex: 1,
                    backgroundColor: theme.colors.surface.base,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <ActivityIndicator color={theme.colors.surface.overlay} />
                </View>
              ) : !isAuthenticated ? (
                <AuthScreen onLogin={login} error={error} />
              ) : (
                <View style={{ flex: 1 }}>
                  <ConnectionBanner />
                  <Slot />
                </View>
              )}
            </ToastProvider>
          </ToolDetailSheetProvider>
        </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
