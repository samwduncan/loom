/**
 * In-app floating notification banner with glass surface.
 *
 * Uses module-scoped callback pattern (like toast.tsx) for global imperative access.
 * showNotificationBanner() can be called from anywhere.
 *
 * UI-SPEC:
 *   - Glass surface: BlurView intensity={40} tint="dark", rgba(0,0,0,0.35) overlay
 *   - Entrance: navigation spring, translateY -80 to 0
 *   - Auto-dismiss: 4s standard, 8s permission
 *   - Swipe-up dismiss gesture
 *   - Tap: micro spring scale(0.97) + haptic Impact.Light + navigate + dismiss
 *   - Tint variants per notification type
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createStyles } from '../../theme/createStyles';
import { theme } from '../../theme/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BannerData {
  title: string;
  body: string;
  type:
    | 'session_complete'
    | 'permission_request'
    | 'session_error'
    | 'batched';
  sessionId?: string;
  onPress?: () => void;
}

// ---------------------------------------------------------------------------
// Module-scoped callback (same pattern as toast.tsx)
// ---------------------------------------------------------------------------

let showBannerFn: ((data: BannerData) => void) | null = null;

/**
 * Show an in-app notification banner from anywhere.
 * The NotificationBanner component must be mounted in the root layout.
 */
export function showNotificationBanner(data: BannerData): void {
  showBannerFn?.(data);
}

// ---------------------------------------------------------------------------
// Tint color per notification type
// ---------------------------------------------------------------------------

function getTintColor(
  type: BannerData['type'],
): string | null {
  switch (type) {
    case 'permission_request':
      return theme.colors.accent;
    case 'session_error':
      return theme.colors.destructive;
    case 'session_complete':
    case 'batched':
    default:
      return null;
  }
}

function getAutoDismissMs(type: BannerData['type']): number {
  return type === 'permission_request' ? 8000 : 4000;
}

// ---------------------------------------------------------------------------
// BannerView (internal)
// ---------------------------------------------------------------------------

function BannerView({
  data,
  onDismiss,
}: {
  data: BannerData;
  onDismiss: () => void;
}) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-80);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDismissing = useRef(false);

  const tintColor = getTintColor(data.type);

  // -------------------------------------------------------------------------
  // Dismiss logic
  // -------------------------------------------------------------------------

  const dismiss = useCallback(() => {
    if (isDismissing.current) return;
    isDismissing.current = true;

    // Slide up + fade out with standard spring
    translateY.value = withSpring(-80, theme.springs.standard);
    opacity.value = withTiming(0, { duration: 200 });

    setTimeout(onDismiss, 350);
  }, [onDismiss, opacity, translateY]);

  // -------------------------------------------------------------------------
  // Entrance animation + auto-dismiss timer
  // -------------------------------------------------------------------------

  useEffect(() => {
    // Entrance: navigation spring, translateY -80 to 0
    translateY.value = withSpring(0, theme.springs.navigation);
    opacity.value = withTiming(1, { duration: 150 });

    // Schedule auto-dismiss
    dismissTimer.current = setTimeout(() => {
      runOnJS(dismiss)();
    }, getAutoDismissMs(data.type));

    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [data.type, dismiss, opacity, translateY]);

  // -------------------------------------------------------------------------
  // Animated styles
  // -------------------------------------------------------------------------

  const bannerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  // -------------------------------------------------------------------------
  // Swipe-up dismiss gesture
  // -------------------------------------------------------------------------

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Only track upward swipes
      if (event.translationY < 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.velocityY < -200 || event.translationY < -30) {
        // Swipe up dismiss
        translateY.value = withSpring(-80, theme.springs.standard);
        opacity.value = withTiming(0, { duration: 200 });
        runOnJS(onDismiss)();
      } else {
        // Snap back
        translateY.value = withSpring(0, theme.springs.navigation);
      }
    });

  // -------------------------------------------------------------------------
  // Tap handler
  // -------------------------------------------------------------------------

  const handlePress = useCallback(() => {
    // Micro spring scale (0.97) + haptic
    scale.value = withSpring(0.97, theme.springs.micro, () => {
      scale.value = withSpring(1, theme.springs.micro);
    });

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (data.onPress) {
      data.onPress();
    }

    // Dismiss after tap
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    dismiss();
  }, [data, dismiss, scale]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.container,
          { top: insets.top + theme.spacing.sm },
          bannerAnimatedStyle,
        ]}
      >
        <Pressable onPress={handlePress} style={styles.pressable}>
          <BlurView intensity={40} tint="dark" style={styles.blur}>
            <View style={styles.overlay}>
              {/* Tint layer per notification type */}
              {tintColor && (
                <View
                  style={[
                    styles.tintLayer,
                    { backgroundColor: tintColor },
                  ]}
                />
              )}

              {/* Content row: icon dot + text column */}
              <View style={styles.contentRow}>
                <View
                  style={[
                    styles.iconDot,
                    {
                      backgroundColor:
                        data.type === 'session_error'
                          ? theme.colors.destructive
                          : data.type === 'permission_request'
                            ? theme.colors.accent
                            : theme.colors.success,
                    },
                  ]}
                />
                <View style={styles.textColumn}>
                  <Text style={styles.title} numberOfLines={1}>
                    {data.title}
                  </Text>
                  <Text style={styles.body} numberOfLines={2}>
                    {data.body}
                  </Text>
                </View>
              </View>
            </View>
          </BlurView>
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
}

// ---------------------------------------------------------------------------
// NotificationBanner (mounted in root layout)
// ---------------------------------------------------------------------------

export function NotificationBanner() {
  const [activeBanner, setActiveBanner] = useState<BannerData | null>(null);

  useEffect(() => {
    showBannerFn = (data: BannerData) => {
      setActiveBanner(data);
    };
    return () => {
      showBannerFn = null;
    };
  }, []);

  const handleDismiss = useCallback(() => {
    setActiveBanner(null);
  }, []);

  if (!activeBanner) return null;

  return (
    <BannerView
      key={`${activeBanner.title}-${Date.now()}`}
      data={activeBanner}
      onDismiss={handleDismiss}
    />
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = createStyles((t) => ({
  container: {
    position: 'absolute',
    left: t.spacing.md,
    right: t.spacing.md,
    zIndex: 110, // Above ConnectionBanner (100)
    ...t.shadows.heavy,
  },
  pressable: {
    borderRadius: t.radii.xl, // 20px (2xl equivalent)
    overflow: 'hidden',
  },
  blur: {
    borderRadius: t.radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: t.colors.border.subtle,
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    minHeight: 56,
    paddingVertical: t.spacing.sm,
    paddingHorizontal: t.spacing.md,
    position: 'relative',
    overflow: 'hidden',
  },
  tintLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: t.spacing.sm,
  },
  textColumn: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
    fontFamily: 'Inter-SemiBold',
    color: t.colors.text.primary,
  },
  body: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    fontFamily: 'Inter-Regular',
    color: t.colors.text.secondary,
    marginTop: 2,
  },
}));
