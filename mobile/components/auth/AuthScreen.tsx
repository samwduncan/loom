/**
 * AuthScreen -- Token input screen for first launch.
 *
 * Developer-tool UX (D-05): server URL display (read-only) and JWT token
 * field with secure entry. Spring-animated Connect button with haptic
 * feedback. Error messages from useAuth rendered verbatim.
 *
 * CONN-01: Login screen
 * CONN-02: Keychain persistence (via onLogin -> useAuth.login)
 */

import { useState, useCallback } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import * as Haptics from 'expo-haptics';
import { Cpu } from 'lucide-react-native';
import { createStyles } from '../../theme/createStyles';
import { theme } from '../../theme/theme';
import { API_BASE } from '../../lib/platform';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AuthScreenProps {
  onLogin: (token: string) => Promise<boolean>;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AuthScreen({ onLogin, error }: AuthScreenProps) {
  const insets = useSafeAreaInsets();
  const [tokenValue, setTokenValue] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  // -- Button press animation (Micro spring scale) --
  const isPressed = useSharedValue(0);
  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(isPressed.value ? 0.97 : 1, theme.springs.micro) }],
  }));

  // -- Error animation (Standard spring fade + translate) --
  const hasError = error !== null;
  const errorAnimStyle = useAnimatedStyle(() => ({
    opacity: withSpring(hasError ? 1 : 0, theme.springs.standard),
    transform: [{ translateY: withSpring(hasError ? 0 : 8, theme.springs.standard) }],
  }));

  // -- Connect handler --
  const handleConnect = useCallback(async () => {
    if (!tokenValue.trim() || isConnecting) return;
    setIsConnecting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const success = await onLogin(tokenValue.trim());
    setIsConnecting(false);

    if (!success) {
      // Error message is set in useAuth's state and passed via error prop.
      // We only trigger error haptics here.
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [tokenValue, isConnecting, onLogin]);

  const buttonDisabled = isConnecting || !tokenValue.trim();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <KeyboardAvoidingView behavior="padding" style={styles.keyboardView}>
        <View style={styles.content}>
          {/* Loom icon */}
          <View style={styles.iconContainer}>
            <Cpu
              size={64}
              color={theme.colors.text.primary}
              strokeWidth={1.5}
            />
          </View>

          {/* Heading */}
          <Text style={styles.heading}>Connect to Loom</Text>

          {/* Server URL field (display-only) */}
          <Text style={styles.label}>Server</Text>
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            value={API_BASE}
            editable={false}
            selectTextOnFocus={false}
          />

          {/* Token field */}
          <Text style={styles.label}>Token</Text>
          <TextInput
            style={styles.input}
            placeholder="JWT Token"
            placeholderTextColor={theme.colors.text.muted}
            value={tokenValue}
            onChangeText={setTokenValue}
            secureTextEntry={true}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="go"
            onSubmitEditing={handleConnect}
          />

          {/* Connect button */}
          <Animated.View style={[styles.buttonOuter, buttonAnimStyle]}>
            <Pressable
              style={[
                styles.button,
                buttonDisabled && styles.buttonDisabled,
              ]}
              disabled={buttonDisabled}
              onPressIn={() => { isPressed.value = 1; }}
              onPressOut={() => { isPressed.value = 0; }}
              onPress={handleConnect}
            >
              <Text style={styles.buttonText}>
                {isConnecting ? 'Connecting...' : 'Connect to Loom'}
              </Text>
            </Pressable>
          </Animated.View>

          {/* Error message */}
          <Animated.View style={[styles.errorContainer, errorAnimStyle]}>
            {hasError && <Text style={styles.errorText}>{error}</Text>}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = createStyles((t) => ({
  container: {
    flex: 1,
    backgroundColor: t.colors.surface.base,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: t.spacing.lg,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: t.spacing.lg,
  },
  heading: {
    ...t.typography.headline,
    color: t.colors.text.primary,
    textAlign: 'center',
    marginBottom: t.spacing.xl,
  },
  label: {
    ...t.typography.meta,
    color: t.colors.text.muted,
    marginBottom: t.spacing.xs,
    marginLeft: t.spacing.xs,
  },
  input: {
    ...t.typography.body,
    fontFamily: 'JetBrains Mono',
    color: t.colors.text.secondary,
    backgroundColor: t.colors.surface.input,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: t.colors.border.strong,
    borderRadius: t.radii.lg,
    minHeight: 44,
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.sm,
    marginBottom: t.spacing.md,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  buttonOuter: {
    marginTop: t.spacing.sm,
  },
  button: {
    backgroundColor: t.colors.accent,
    minHeight: 44,
    borderRadius: t.radii.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    ...t.typography.label,
    color: t.colors.accentFg,
    fontWeight: '600' as const,
    fontFamily: 'Inter-SemiBold',
  },
  errorContainer: {
    marginTop: t.spacing.sm,
    minHeight: 20,
  },
  errorText: {
    ...t.typography.meta,
    color: t.colors.destructive,
    textAlign: 'center',
  },
}));
