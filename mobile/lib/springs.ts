/**
 * Soul doc spring configuration constants.
 *
 * Centralized spring configs from NATIVE-APP-SOUL.md. Every motion in the app
 * uses one of these 6 named springs or the pull-to-refresh spring.
 *
 * All springs use react-native-reanimated's WithSpringConfig type.
 * Usage: withSpring(toValue, SPRING.micro)
 */

import { type WithSpringConfig } from 'react-native-reanimated';

export const SPRING = {
  /** Button press, icon scale, toggle snap (~150ms settle) */
  micro:      { damping: 18, stiffness: 220, mass: 0.8 } satisfies WithSpringConfig,
  /** Card press, list item press, send button appear/disappear (~250ms settle) */
  standard:   { damping: 20, stiffness: 150, mass: 1.0 } satisfies WithSpringConfig,
  /** Screen push/pop, sheet presentation, modal appear (~300ms settle) */
  navigation: { damping: 22, stiffness: 130, mass: 1.0 } satisfies WithSpringConfig,
  /** Sidebar drawer open/close, panel slide (~350ms settle) */
  drawer:     { damping: 20, stiffness: 100, mass: 1.0 } satisfies WithSpringConfig,
  /** Tool card expand/collapse, thinking disclosure, accordion (~400ms settle) */
  expand:     { damping: 18, stiffness: 90,  mass: 1.0 } satisfies WithSpringConfig,
  /** Permission request appearance, error state, first message in session (~500ms settle) */
  dramatic:   { damping: 15, stiffness: 70,  mass: 1.2 } satisfies WithSpringConfig,
} as const;

/** Pull-to-refresh spring for custom refresh indicator. Triggers at 60pt overscroll. */
export const PULL_REFRESH_SPRING = { damping: 25, stiffness: 120, mass: 1.0 } satisfies WithSpringConfig;
