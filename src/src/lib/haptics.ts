/**
 * Haptic feedback wrapper -- typed fire-and-forget functions for Capacitor Haptics.
 *
 * All functions are silent no-ops on web, when the module is null (init failed),
 * or when the user prefers reduced motion. No function throws or rejects --
 * errors from the native plugin are swallowed (fire-and-forget).
 *
 * The module reference is injected by native-plugins.ts via setHapticsModule()
 * after the dynamic import of @capacitor/haptics succeeds.
 *
 * hapticNotification() has a 200ms throttle to prevent haptic storms from
 * rapid batch tool completions (AR A-3). Impact and selection are unthrottled.
 *
 * Constitution: Named exports only (2.2), no default export.
 */

import { IS_NATIVE } from '@/lib/platform';
import { prefersReducedMotion } from '@/lib/motion';

/** The dynamically imported @capacitor/haptics module, or null on web / failure. */
type HapticsModule = typeof import('@capacitor/haptics') | null;

/** Cached reference to the dynamically imported @capacitor/haptics module. */
let hapticsModule: HapticsModule = null;

/** Timestamp of the last fired notification haptic (for throttle). */
let lastNotificationTime = 0;

/** Minimum gap in ms between notification haptics (AR A-3). */
const NOTIFICATION_THROTTLE_MS = 200;

/**
 * Inject the dynamically imported @capacitor/haptics module.
 *
 * Called by native-plugins.ts after a successful dynamic import.
 * Pass null to clear the module reference (e.g., on init failure or test reset).
 *
 * @param mod - The haptics module or null
 */
export function setHapticsModule(mod: HapticsModule): void {
  hapticsModule = mod;
}

/**
 * Fire impact haptic feedback.
 *
 * Silent no-op on web, when module is null, or when reduced motion is preferred.
 * Not throttled -- safe to call rapidly.
 *
 * @param style - Impact intensity: 'Heavy', 'Medium', or 'Light'
 */
export function hapticImpact(style: 'Heavy' | 'Medium' | 'Light'): void {
  if (!IS_NATIVE || !hapticsModule || prefersReducedMotion()) return;

  const { Haptics, ImpactStyle } = hapticsModule;
  const styleMap: Record<string, (typeof ImpactStyle)[keyof typeof ImpactStyle]> = {
    Heavy: ImpactStyle.Heavy,
    Medium: ImpactStyle.Medium,
    Light: ImpactStyle.Light,
  };

  const mappedStyle = styleMap[style];
  if (!mappedStyle) return;

  // Fire-and-forget -- no await, errors swallowed (D-06)
  void Haptics.impact({ style: mappedStyle });
}

/**
 * Fire notification haptic feedback.
 *
 * Silent no-op on web, when module is null, or when reduced motion is preferred.
 * Throttled: calls within 200ms of the previous call are silently dropped (AR A-3).
 *
 * @param type - Notification type: 'Success', 'Warning', or 'Error'
 */
export function hapticNotification(type: 'Success' | 'Warning' | 'Error'): void {
  if (!IS_NATIVE || !hapticsModule || prefersReducedMotion()) return;

  // Throttle -- prevent haptic storms from rapid batch tool completions (AR A-3)
  const now = Date.now();
  if (now - lastNotificationTime < NOTIFICATION_THROTTLE_MS) return;
  lastNotificationTime = now;

  const { Haptics, NotificationType } = hapticsModule;
  const typeMap: Record<string, (typeof NotificationType)[keyof typeof NotificationType]> = {
    Success: NotificationType.Success,
    Warning: NotificationType.Warning,
    Error: NotificationType.Error,
  };

  const mappedType = typeMap[type];
  if (!mappedType) return;

  // Fire-and-forget -- no await, errors swallowed (D-06)
  void Haptics.notification({ type: mappedType });
}

/**
 * Fire selection change haptic feedback.
 *
 * Silent no-op on web, when module is null, or when reduced motion is preferred.
 * Not throttled -- safe to call rapidly.
 */
export function hapticSelection(): void {
  if (!IS_NATIVE || !hapticsModule || prefersReducedMotion()) return;

  // Fire-and-forget -- no await, errors swallowed (D-06)
  void hapticsModule.Haptics.selectionChanged();
}

/** Haptic event names -- centralized grammar for gesture feedback (D-27). */
export type HapticEventName =
  | 'sessionSelect'
  | 'sidebarToggle'
  | 'swipeReveal'
  | 'deleteConfirm'
  | 'contextMenuOpen'
  | 'pullToRefreshComplete'
  | 'shareTriggered';

const HAPTIC_EVENT_MAP: Record<HapticEventName, () => void> = {
  sessionSelect: () => hapticSelection(),
  sidebarToggle: () => hapticImpact('Light'),
  swipeReveal: () => hapticImpact('Light'),
  deleteConfirm: () => hapticNotification('Warning'),
  contextMenuOpen: () => hapticImpact('Medium'),
  pullToRefreshComplete: () => hapticNotification('Success'),
  shareTriggered: () => hapticImpact('Light'),
};

/**
 * Fire a named haptic event. Silent no-op for unknown event names.
 *
 * All events respect IS_NATIVE, module availability, and reduced-motion gates
 * via the underlying hapticImpact/hapticNotification/hapticSelection functions.
 *
 * @param name - The haptic event name from the centralized grammar
 */
export function hapticEvent(name: HapticEventName): void {
  HAPTIC_EVENT_MAP[name]?.();
}

/**
 * Reset module state for testing.
 *
 * Clears the haptics module reference and resets the notification throttle
 * timestamp so each test starts fresh.
 */
export function _resetForTesting(): void {
  hapticsModule = null;
  lastNotificationTime = 0;
}
