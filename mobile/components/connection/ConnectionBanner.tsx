/**
 * ConnectionBanner -- Soul-doc glass slide-down banner for disconnection state.
 *
 * Slides down from top with Navigation spring (22/130) when WebSocket disconnects.
 * Auto-dismisses on successful reconnect with Standard spring slide-up.
 *
 * CRITICAL (A-3): hasConnectedOnce ref guard prevents banner flash on cold start.
 * On app launch, status starts as 'disconnected' before WebSocket connects --
 * the banner must NOT show in this initial state.
 *
 * CRITICAL (A-4): Watches for auth failure error ("Authentication failed") set by
 * websocket-init.ts on close code 4001/4401. Shows "Re-enter token" button.
 *
 * Per D-29: Glass surface, destructive tint for errors, accent dot for reconnecting.
 */

import { useRef } from 'react';
import { View, Pressable } from 'react-native';
import Animated, {
  SlideInUp,
  SlideOutUp,
  withRepeat,
  withTiming,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassSurface } from '../primitives/GlassSurface';
import { LoomText } from '../primitives/TextHierarchy';
import { useConnection } from '../../hooks/useConnection';
import { DESTRUCTIVE, ACCENT } from '../../lib/colors';
import { useEffect } from 'react';

interface ConnectionBannerProps {
  onLogout?: () => void;
}

export function ConnectionBanner({ onLogout }: ConnectionBannerProps) {
  const insets = useSafeAreaInsets();
  const { status, error } = useConnection();
  const hasConnectedOnce = useRef(false);

  // Track first successful connection
  if (status === 'connected') {
    hasConnectedOnce.current = true;
  }

  // Only show after first connection (prevents cold-start flash)
  const shouldShow =
    hasConnectedOnce.current &&
    (status === 'disconnected' || status === 'reconnecting');

  // Reconnecting pulse animation (opacity 0.4 -> 1.0, 1.5s cycle)
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    if (status === 'reconnecting') {
      pulseOpacity.value = withRepeat(
        withTiming(0.4, { duration: 750 }),
        -1, // infinite
        true, // reverse
      );
    } else {
      pulseOpacity.value = 1;
    }
  }, [status, pulseOpacity]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  // Detect auth failure
  const isAuthFailure = error?.includes('Authentication failed') ||
    error?.includes('please re-enter token');

  if (!shouldShow) return null;

  // Determine connection dot color and message
  const isError = status === 'disconnected';
  const dotColor = isError ? DESTRUCTIVE : ACCENT;
  const message = isAuthFailure
    ? 'Authentication expired'
    : status === 'reconnecting'
      ? 'Connection lost. Reconnecting...'
      : error || 'Cannot reach server';

  return (
    <Animated.View
      entering={SlideInUp.springify().damping(22).stiffness(130)}
      exiting={SlideOutUp.springify().damping(20).stiffness(150)}
      style={{
        position: 'absolute',
        top: insets.top + 8,
        left: 16,
        right: 16,
        zIndex: 100,
      }}
    >
      <GlassSurface
        intensity={50}
        style={isError ? { backgroundColor: 'rgba(210, 112, 88, 0.1)' } : undefined}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
        >
          {/* Connection dot */}
          <Animated.View
            style={[
              {
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: dotColor,
                marginRight: 10,
              },
              status === 'reconnecting' ? pulseStyle : {},
            ]}
          />

          {/* Message text */}
          <View style={{ flex: 1 }}>
            <LoomText variant="body" style={{ fontSize: 15 }}>
              {message}
            </LoomText>
          </View>

          {/* Re-enter token button for auth failures */}
          {isAuthFailure && onLogout && (
            <Pressable
              onPress={onLogout}
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
                paddingHorizontal: 12,
                paddingVertical: 6,
                minHeight: 44,
                justifyContent: 'center',
              })}
            >
              <LoomText
                variant="body"
                style={{ fontSize: 13, color: ACCENT, fontWeight: '600' }}
              >
                Re-enter token
              </LoomText>
            </Pressable>
          )}
        </View>
      </GlassSurface>
    </Animated.View>
  );
}
