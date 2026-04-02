/**
 * Dynamic color constants and surface palette for Loom native app.
 *
 * Color shifts are driven by conversation state (idle, streaming, error).
 * The background warms during streaming (+3 hue) and cools during errors.
 * All transitions use withTiming at 500ms with Easing.out(Easing.cubic).
 *
 * See NATIVE-APP-SOUL.md: Dynamic Color section.
 */

import { Easing } from 'react-native-reanimated';

// Dynamic background states
export const IDLE_BG = 'rgb(46, 42, 40)';
export const STREAMING_BG = 'rgb(48, 43, 40)';  // +3 hue warmth
export const ERROR_BG = 'rgb(44, 42, 42)';      // cooler, desaturated

// Timing config for color transitions (not springs -- springs are for position/scale)
export const COLOR_TIMING = { duration: 500, easing: Easing.out(Easing.cubic) };

// 4-tier surface hierarchy — 16-20 RGB unit jumps for phone readability.
// Previous values (8-unit jumps) were imperceptible on device at arm's length.
export const SURFACE = {
  sunken:  'rgb(28, 26, 24)',  // Tier 0: drawer bg, inset areas — darkest
  base:    'rgb(44, 40, 38)',  // Tier 1: chat bg, default canvas
  raised:  'rgb(64, 60, 57)',  // Tier 2: cards, composer, user bubbles (+20 from base)
  overlay: 'rgb(82, 78, 74)',  // Tier 3: modals, popovers (+18 from raised)
} as const;

// Semantic colors
export const ACCENT = 'rgb(196, 108, 88)';
export const DESTRUCTIVE = 'rgb(210, 112, 88)';
export const SUCCESS = 'rgb(82, 175, 108)';
