/**
 * Lightweight toast notification system.
 *
 * Uses a module-scoped callback pattern to avoid React Context overhead.
 * ToastProvider registers the display callback; showToast() invokes it from anywhere.
 *
 * Used by:
 * - Plan 02: swipe-to-delete undo (5s duration, "Undo" action)
 * - Plan 03: code copy "Copied" feedback (default 3s duration)
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createStyles } from '../theme/createStyles';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ToastAction {
  label: string;
  onPress: () => void;
}

interface ToastConfig {
  message: string;
  action?: ToastAction;
  duration: number;
}

type ToastCallback = (config: ToastConfig) => void;

// ---------------------------------------------------------------------------
// Module-scoped callback (avoids Context overhead for a global utility)
// ---------------------------------------------------------------------------

let toastCallback: ToastCallback | null = null;

/**
 * Show a toast notification from anywhere in the app.
 *
 * @param message - Text to display
 * @param action - Optional action button (e.g., { label: 'Undo', onPress: () => {...} })
 * @param duration - Auto-dismiss duration in ms (default 3000)
 */
export function showToast(
  message: string,
  action?: ToastAction,
  duration: number = 3000,
): void {
  if (toastCallback) {
    toastCallback({ message, action, duration });
  }
}

// ---------------------------------------------------------------------------
// Toast Component (internal)
// ---------------------------------------------------------------------------

function ToastView({
  config,
  onDismiss,
}: {
  config: ToastConfig;
  onDismiss: () => void;
}) {
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const dismiss = useCallback(() => {
    // Animate out
    opacity.value = withTiming(0, { duration: 200 });
    translateY.value = withSpring(100, { damping: 20, stiffness: 150, mass: 1.0 });

    // Notify parent after animation settles
    setTimeout(onDismiss, 300);
  }, [onDismiss, opacity, translateY]);

  useEffect(() => {
    // Animate in with Standard spring
    translateY.value = withSpring(0, { damping: 20, stiffness: 150, mass: 1.0 });
    opacity.value = withDelay(50, withTiming(1, { duration: 200 }));

    // Schedule auto-dismiss
    dismissTimer.current = setTimeout(() => {
      runOnJS(dismiss)();
    }, config.duration);

    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [config.duration, dismiss, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.toast,
        { bottom: 20 + insets.bottom },
        animatedStyle,
      ]}
    >
      <Text style={styles.message} numberOfLines={2}>
        {config.message}
      </Text>
      {config.action && (
        <Pressable
          onPress={() => {
            config.action?.onPress();
            if (dismissTimer.current) clearTimeout(dismissTimer.current);
            dismiss();
          }}
          hitSlop={8}
        >
          <Text style={styles.actionLabel}>{config.action.label}</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// ToastProvider
// ---------------------------------------------------------------------------

/**
 * Wraps children and renders toast overlay. Mount once in root _layout.tsx.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [activeToast, setActiveToast] = useState<ToastConfig | null>(null);

  useEffect(() => {
    toastCallback = (config: ToastConfig) => {
      setActiveToast(config);
    };
    return () => {
      toastCallback = null;
    };
  }, []);

  const handleDismiss = useCallback(() => {
    setActiveToast(null);
  }, []);

  return (
    <View style={styles.provider}>
      {children}
      {activeToast && (
        <ToastView
          key={`${activeToast.message}-${Date.now()}`}
          config={activeToast}
          onDismiss={handleDismiss}
        />
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = createStyles((t) => ({
  provider: {
    flex: 1,
  },
  toast: {
    position: 'absolute',
    left: t.spacing.md,
    right: t.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: t.colors.surface.overlay,
    borderRadius: t.radii.lg,
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.sm + 4, // 12px vertical padding
    ...t.shadows.medium,
  },
  message: {
    flex: 1,
    color: t.colors.text.primary,
    fontSize: t.typography.body.fontSize,
    fontWeight: t.typography.body.fontWeight,
    lineHeight: t.typography.body.lineHeight,
    fontFamily: t.typography.body.fontFamily,
  },
  actionLabel: {
    color: t.colors.accent,
    fontSize: t.typography.body.fontSize,
    fontWeight: '600',
    lineHeight: t.typography.body.lineHeight,
    fontFamily: 'Inter-SemiBold',
    marginLeft: t.spacing.md,
  },
}));
