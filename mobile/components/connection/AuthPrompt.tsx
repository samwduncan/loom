/**
 * AuthPrompt -- first-launch JWT token input screen.
 *
 * Shows when no token exists in Keychain (or token was invalidated).
 * Full-screen overlay on surface-base background with:
 *   - "Loom" heading (28px bold -- Large Title per Soul doc)
 *   - JWT token TextInput
 *   - Server URL display (API_BASE from platform.ts)
 *   - Error message with spring entrance
 *   - Connect button (disabled when input empty or loading)
 *
 * Per D-09: No onboarding flow. Developer-tool UX.
 * Per D-07: Auto-connect with token prompt. Minimal friction.
 */

import { useState } from 'react';
import { View, TextInput, ActivityIndicator } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LoomText } from '../primitives/TextHierarchy';
import { Button } from '../primitives/Button';
import { API_BASE } from '../../lib/platform';
import { SURFACE, ACCENT } from '../../lib/colors';

interface AuthPromptProps {
  onLogin: (token: string) => Promise<boolean>;
}

export function AuthPrompt({ onLogin }: AuthPromptProps) {
  const insets = useSafeAreaInsets();
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    if (!token.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    const success = await onLogin(token.trim());
    if (!success) {
      setError('Invalid token. Check that the server is running and the token is correct.');
    }

    setIsLoading(false);
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: SURFACE.base,
        paddingTop: insets.top + 48,
        paddingHorizontal: 24,
      }}
    >
      {/* Loom heading -- 28px bold, Large Title per Soul doc */}
      <Animated.View entering={FadeIn.duration(300)}>
        <LoomText
          variant="heading"
          style={{ fontSize: 28, fontWeight: '700', marginBottom: 8, color: 'rgb(230, 222, 216)' }}
        >
          Loom
        </LoomText>

        <LoomText
          variant="body"
          style={{ fontSize: 15, marginBottom: 32, color: 'rgb(191, 186, 182)' }}
        >
          Enter your JWT token to connect
        </LoomText>
      </Animated.View>

      {/* Token input */}
      <TextInput
        value={token}
        onChangeText={setToken}
        placeholder="Paste JWT token"
        placeholderTextColor="rgba(191, 186, 182, 0.5)"
        autoCapitalize="none"
        autoCorrect={false}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        style={{
          backgroundColor: SURFACE.raised,
          borderWidth: 1,
          borderColor: 'rgba(191, 186, 182, 0.15)',
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 12,
          fontSize: 15,
          color: 'rgb(230, 222, 216)',
          minHeight: 80,
          marginBottom: 12,
        }}
      />

      {/* Server URL display */}
      <LoomText variant="caption" style={{ marginBottom: 8, color: 'rgb(191, 186, 182)' }}>
        Server: {API_BASE}
      </LoomText>

      {/* Error message with spring entrance */}
      {error && (
        <Animated.View entering={SlideInDown.springify().damping(20).stiffness(150)}>
          <LoomText
            variant="caption"
            style={{ color: 'rgb(210, 112, 88)', marginBottom: 8 }}
          >
            {error}
          </LoomText>
        </Animated.View>
      )}

      {/* Connect button */}
      <View style={{ marginTop: 16 }}>
        <Button
          title={isLoading ? 'Connecting...' : 'Connect'}
          variant="primary"
          disabled={!token.trim() || isLoading}
          onPress={handleConnect}
        />
      </View>

      {/* Loading indicator */}
      {isLoading && (
        <ActivityIndicator
          color={ACCENT}
          style={{ marginTop: 16 }}
        />
      )}

      {/* Configure server link (44px touch target per D-08) */}
      <View style={{ marginTop: 24, alignItems: 'center' }}>
        <LoomText
          variant="caption"
          style={{
            color: ACCENT,
            minHeight: 44,
            lineHeight: 44,
          }}
        >
          Configure server
        </LoomText>
      </View>
    </View>
  );
}
