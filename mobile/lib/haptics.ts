/**
 * Centralized haptic hierarchy utility.
 *
 * Maps semantic interaction types to specific haptic feedback per D-14.
 * All components should call these semantic functions instead of raw
 * expo-haptics imports. This ensures consistent haptic language across
 * the app -- musical haptics, not blanket buzzing.
 *
 * See NATIVE-APP-SOUL.md: Haptic Pairing table.
 */
import * as Haptics from 'expo-haptics';

export const haptic = {
  /** Button press feedback, selection, scroll-to-bottom tap */
  tap: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  /** Drawer open/close snap, state transitions (composer idle->typing), session switch */
  transition: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  /** Tool call complete, session complete */
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  /** Permission request appears */
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  /** Error state transition */
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  /** Swipe threshold crossed, list item long-press, selection change */
  selection: () => Haptics.selectionAsync(),
} as const;
