/**
 * Dynamic color constants and surface palette for Loom native app.
 *
 * Color shifts are driven by conversation state (idle, streaming, error).
 * The background warms during streaming (+1-2 RGB) and cools during errors.
 * All transitions use withTiming at 500ms with Easing.out(Easing.cubic).
 *
 * Palette calibrated against ChatGPT iOS + Claude iOS + better-chatbot.
 * Cool-neutral undertone (not warm brown). Near-black background.
 */

import { Easing } from 'react-native-reanimated';

// Dynamic background states
export const IDLE_BG = 'rgb(15, 15, 16)';       // Near-black main bg
export const STREAMING_BG = 'rgb(16, 16, 18)';  // +1-2 RGB warmth
export const ERROR_BG = 'rgb(14, 14, 15)';      // Slightly cooler

// Timing config for color transitions (not springs -- springs are for position/scale)
export const COLOR_TIMING = { duration: 500, easing: Easing.out(Easing.cubic) };

// 4-tier surface hierarchy — cool-neutral, wider gaps for contrast on phone screens.
export const SURFACE = {
  sunken:  'rgb(22, 22, 24)',   // Tier 0: drawer bg, inset areas — darkest
  base:    'rgb(33, 33, 36)',   // Tier 1: chat bg, default canvas
  raised:  'rgb(51, 51, 55)',   // Tier 2: cards, composer, user bubbles
  overlay: 'rgb(69, 69, 74)',   // Tier 3: modals, popovers
} as const;

// Semantic colors
export const ACCENT = 'rgb(217, 119, 87)';       // Claude warm gold
export const DESTRUCTIVE = 'rgb(239, 68, 68)';   // Vibrant red
export const SUCCESS = 'rgb(34, 197, 94)';        // Vibrant emerald
