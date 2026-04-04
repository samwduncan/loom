/**
 * Notification settings screen -- configures push notification preferences.
 *
 * Notification mode: radio-style selection (all, failures+permissions, permissions only, none).
 * Persists to MMKV (immediate) and syncs to backend (async).
 *
 * NOTE: No batching toggle. D-04 batching is entirely server-side (5-second window)
 * with no per-user preference. The PATCH /api/push/preferences endpoint only accepts
 * notificationMode, not a batch preference.
 *
 * [S-4] getPushToken and setPushToken are imported from push-preferences.ts
 * (created in Plan 02 Task 1). This plan does NOT modify push-preferences.ts.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { ChevronLeft, Check } from 'lucide-react-native';

import { SettingsSectionHeader } from '../../../../components/settings/SettingsSectionHeader';
import { SettingsRow } from '../../../../components/settings/SettingsRow';
import {
  getNotificationMode,
  setNotificationMode,
  getPushToken,
} from '../../../../lib/push-preferences';
import type { NotificationMode } from '../../../../lib/push-preferences';
import { apiClient } from '../../../../lib/api-client';
import { theme } from '../../../../theme/theme';
import { createStyles } from '../../../../theme/createStyles';

// ---------------------------------------------------------------------------
// Mode options
// ---------------------------------------------------------------------------

const modes: { value: NotificationMode; label: string }[] = [
  { value: 'all', label: 'All notifications' },
  { value: 'failures_and_permissions', label: 'Failures and permissions' },
  { value: 'permissions_only', label: 'Permissions only' },
  { value: 'none', label: 'None' },
];

// ---------------------------------------------------------------------------
// Backend sync (fire-and-forget)
// ---------------------------------------------------------------------------

async function syncPreferenceToBackend(newMode: NotificationMode) {
  try {
    const token = getPushToken(); // [S-4] imported from push-preferences.ts
    if (token) {
      await apiClient.apiFetch('/api/push/preferences', {
        method: 'PATCH',
        body: JSON.stringify({ token, notificationMode: newMode }),
      });
    }
  } catch (e) {
    console.warn('[Settings] Failed to sync notification preference:', e);
  }
}

// ---------------------------------------------------------------------------
// NotificationSettingsScreen
// ---------------------------------------------------------------------------

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<NotificationMode>(getNotificationMode());
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  // Check notification permission on mount
  useEffect(() => {
    Notifications.getPermissionsAsync().then((result) => {
      setPermissionGranted(result.granted);
    });
  }, []);

  const handleModeSelect = useCallback((newMode: NotificationMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMode(newMode);
    setNotificationMode(newMode); // MMKV write (immediate)
    syncPreferenceToBackend(newMode); // backend sync (async, fire-and-forget)
  }, []);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleOpenSettings = useCallback(() => {
    Linking.openSettings();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Custom header */}
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          style={styles.backButton}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={24} color={theme.colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        {/* Spacer to center title */}
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Permission denied banner */}
        {permissionGranted === false && (
          <View style={styles.permissionBanner}>
            <Text style={styles.permissionText}>
              Notifications are disabled in system settings.
            </Text>
            <Pressable onPress={handleOpenSettings} hitSlop={8}>
              <Text style={styles.permissionLink}>Open Settings</Text>
            </Pressable>
          </View>
        )}

        {/* NOTIFICATION MODE section */}
        <SettingsSectionHeader title="NOTIFICATION MODE" />

        {modes.map((item) => (
          <SettingsRow
            key={item.value}
            title={item.label}
            onPress={() => handleModeSelect(item.value)}
            accessibilityLabel={`${item.label}${mode === item.value ? ', selected' : ''}`}
            rightAccessory={
              mode === item.value ? (
                <Animated.View
                  entering={FadeIn.duration(150)}
                  exiting={FadeOut.duration(150)}
                >
                  <Check size={17} color={theme.colors.accent} strokeWidth={2.5} />
                </Animated.View>
              ) : null
            }
          />
        ))}

        {/* Footer text */}
        <Text style={styles.footerText}>
          Choose which events trigger push notifications.
        </Text>
      </ScrollView>
    </SafeAreaView>
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
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    height: 56,
    paddingHorizontal: t.spacing.md,
  },
  backButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  headerTitle: {
    ...t.typography.heading,
    color: t.colors.text.primary,
    flex: 1,
    textAlign: 'center' as const,
  },
  headerSpacer: {
    minWidth: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: t.spacing.xl,
  },
  // Permission denied banner
  permissionBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: t.colors.surface.raised,
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.md,
    marginHorizontal: t.spacing.md,
    marginTop: t.spacing.sm,
    borderRadius: t.radii.md,
  },
  permissionText: {
    ...t.typography.small,
    color: t.colors.text.secondary,
    flex: 1,
    marginRight: t.spacing.sm,
  },
  permissionLink: {
    ...t.typography.small,
    color: t.colors.accent,
    fontWeight: '600' as const,
  },
  // Footer text below mode section
  footerText: {
    ...t.typography.small,
    color: t.colors.text.muted,
    paddingHorizontal: t.spacing.md,
    paddingTop: t.spacing.sm,
  },
}));
