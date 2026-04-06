import { SPRING } from '../lib/springs';
import {
  SURFACE, ACCENT, ACCENT_BRIGHT, ACCENT_DIM, ACCENT_MUTED,
  DESTRUCTIVE, SUCCESS, WARNING, INFO,
  IDLE_BG, STREAMING_BG, ERROR_BG, CATEGORY, PROVIDER,
} from '../lib/colors';
import type { LoomTheme } from './types';

export const theme: LoomTheme = {
  colors: {
    // ── Surfaces (deeper warm charcoal for contrast) ──
    surface: {
      deep: SURFACE.deep,       // rgb(8,8,7)
      sunken: SURFACE.sunken,   // rgb(12,12,10)
      base: SURFACE.base,       // rgb(19,19,16)
      raised: SURFACE.raised,   // rgb(30,30,24)
      input: SURFACE.input,     // rgb(40,40,31)
      overlay: SURFACE.overlay,  // rgb(50,50,42)
    },

    // ── Brand accent: warm orange (the protagonist) ──
    accent: ACCENT,                  // rgb(235,143,54) — #eb8f36
    accentBright: ACCENT_BRIGHT,     // rgb(240,166,84) — hover
    accentDim: ACCENT_DIM,           // rgb(201,109,46) — press
    accentFg: 'rgb(20, 20, 16)',     // Dark text on orange
    accentMuted: ACCENT_MUTED,       // rgba(235,143,54, 0.15)

    // ── Semantic status (vivid signals) ──
    destructive: DESTRUCTIVE,   // #ef4444
    success: SUCCESS,           // #10b981
    info: INFO,                 // #3b82f6
    warning: WARNING,           // #f59e0b

    // ── Text (warm whites, bumped contrast per review) ──
    text: {
      primary: 'rgb(245, 244, 237)',    // #f5f4ed — 17:1 on sunken
      secondary: 'rgb(200, 198, 186)',  // #c8c6ba — 11:1 on sunken
      tertiary: 'rgb(156, 154, 144)',   // #9c9a90 — 6.5:1 on sunken (AA pass)
      muted: 'rgb(156, 154, 144)',      // Alias for tertiary
      inverse: 'rgb(20, 20, 16)',       // Dark text on light bg
      danger: DESTRUCTIVE,
      success: SUCCESS,
    },

    // ── Borders (warm off-white, bumped visibility per review) ──
    border: {
      subtle: 'rgba(222, 220, 209, 0.08)',   // Decorative, barely-there
      medium: 'rgba(222, 220, 209, 0.15)',    // List dividers, section separators
      strong: 'rgba(222, 220, 209, 0.25)',    // Card edges, input borders, composer
    },

    // ── Glass (warm raised at 75% opacity) ──
    glass: 'rgba(30, 30, 24, 0.75)',

    // ── Dynamic backgrounds ──
    background: {
      idle: IDLE_BG,
      streaming: STREAMING_BG,
      error: ERROR_BG,
    },

    // ── 4 category colors + 1 provider ──
    category: CATEGORY,

    // ── Provider brand colors ──
    provider: PROVIDER,
  },

  // ── Typography: 4-tier hierarchy (fix for #1 review finding) ──
  typography: {
    largeTitle: {
      fontSize: 28,
      fontWeight: '600',
      lineHeight: 31,
      letterSpacing: -0.5,
      fontFamily: 'Inter-SemiBold',
    },
    headline: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 26,          // 1.3x
      letterSpacing: -0.3,
      fontFamily: 'Inter-SemiBold',
    },
    body: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 22,          // 1.4x
      letterSpacing: 0,
      fontFamily: 'Inter-Regular',
    },
    label: {
      fontSize: 13,
      fontWeight: '500',
      lineHeight: 18,          // 1.4x
      letterSpacing: -0.1,
      fontFamily: 'Inter-Medium',
    },
    meta: {
      fontSize: 11,
      fontWeight: '400',
      lineHeight: 15,          // 1.4x
      letterSpacing: 0.3,
      fontFamily: 'Inter-Regular',
    },
    code: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 20,
      letterSpacing: 0,
      fontFamily: 'JetBrainsMono-Regular',
    },
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },

  springs: SPRING,

  shadows: {
    composer: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    },
    sheet: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
    },
  },

  radii: {
    xs: 4,
    sm: 6,
    md: 8,
    lg: 12,       // Bumped from 10 → 12 (iOS default)
    xl: 16,       // Bumped from 12 → 16
    '2xl': 16,
    input: 24,
    pill: 9999,
  },

  rimLight: {
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(222, 220, 209, 0.04)',
  },
};
