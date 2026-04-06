/**
 * ConnectionBanner -- glass overlay that appears on WebSocket disconnect.
 *
 * D-12: Glass treatment (BlurView intensity 40, dark tint, rgba overlay).
 * D-13: Cold-start guard -- hasConnectedOnce ref prevents banner flash before
 *        the first successful WS connection is established.
 *
 * Behavior:
 *   - Hidden until first successful connection (cold-start guard)
 *   - Shows "Connection lost" on disconnect
 *   - Shows "Reconnecting..." with pulsing icon during backoff
 *   - Auto-dismisses with slide-up animation + success haptic on reconnect
 *   - Absolutely positioned -- does NOT push layout down
 */

import { useEffect, useRef } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useConnection } from '../../hooks/useConnection';
import { createStyles } from '../../theme/createStyles';
import { theme } from '../../theme/theme';

export function ConnectionBanner() {
  const insets = useSafeAreaInsets();
  const { isConnected, isReconnecting } = useConnection();
  const hasConnectedOnce = useRef(false);

  // Track first successful connection
  useEffect(() => {
    if (isConnected) hasConnectedOnce.current = true;
  }, [isConnected]);

  // Cold-start guard: only show after first connection established then lost
  const showBanner = hasConnectedOnce.current && !isConnected;

  // --- Slide animation (Navigation spring) ---
  const translateY = useSharedValue(-100);

  useEffect(() => {
    translateY.value = withSpring(
      showBanner ? 0 : -100,
      theme.springs.navigation,
    );
  }, [showBanner, translateY]);

  const bannerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: interpolate(translateY.value, [-100, 0], [0, 1]),
  }));

  // --- Pulse animation for reconnecting status icon ---
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    if (isReconnecting) {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 800 }),
          withTiming(1, { duration: 800 }),
        ),
        -1,
        true,
      );
    } else {
      pulseOpacity.value = withTiming(1, { duration: 200 });
    }
  }, [isReconnecting, pulseOpacity]);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  // --- Success haptic on reconnect ---
  const wasShowingBanner = useRef(false);

  useEffect(() => {
    if (wasShowingBanner.current && isConnected) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    wasShowingBanner.current = showBanner;
  }, [isConnected, showBanner]);

  // Don't render anything if banner shouldn't show (avoids unnecessary layout)
  if (!showBanner && translateY.value <= -99) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + theme.spacing.sm },
        bannerStyle,
      ]}
      pointerEvents="none"
      accessibilityRole="alert"
      accessibilityLabel={isReconnecting ? 'Reconnecting' : 'Connection lost'}
    >
      <BlurView intensity={40} tint="dark" style={styles.blur}>
        <View style={styles.overlay}>
          <Animated.View
            style={[
              styles.statusDot,
              {
                backgroundColor: isReconnecting
                  ? theme.colors.warning
                  : theme.colors.destructive,
              },
              dotStyle,
            ]}
          />
          <Text style={styles.text}>
            {isReconnecting ? 'Reconnecting...' : 'Connection lost'}
          </Text>
        </View>
      </BlurView>
    </Animated.View>
  );
}

const styles = createStyles((t) => ({
  container: {
    position: 'absolute',
    left: t.spacing.md,
    right: t.spacing.md,
    zIndex: 100,
    ...t.shadows.sheet,
  },
  blur: {
    borderRadius: t.radii.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: t.colors.border.subtle,
  },
  overlay: {
    backgroundColor: t.colors.glass,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingVertical: t.spacing.sm,
    paddingHorizontal: t.spacing.md,
  },
  statusDot: {
    width: 16,
    height: 16,
    borderRadius: t.radii.pill,
    marginRight: t.spacing.sm,
  },
  text: {
    ...t.typography.body,
    color: t.colors.text.primary,
    flex: 1,
  },
}));
