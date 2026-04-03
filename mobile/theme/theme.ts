import { SPRING } from '../lib/springs';
import { SURFACE, ACCENT, DESTRUCTIVE, SUCCESS, IDLE_BG, STREAMING_BG, ERROR_BG } from '../lib/colors';
import type { LoomTheme } from './types';

export const theme: LoomTheme = {
  colors: {
    surface: {
      sunken: SURFACE.sunken,   // rgb(28, 26, 24)
      base: SURFACE.base,       // rgb(44, 40, 38)
      raised: SURFACE.raised,   // rgb(64, 60, 57)
      overlay: SURFACE.overlay, // rgb(82, 78, 74)
    },
    accent: ACCENT,             // rgb(196, 108, 88)
    accentFg: 'rgb(46, 42, 40)',
    destructive: DESTRUCTIVE,   // rgb(210, 112, 88)
    success: SUCCESS,           // rgb(82, 175, 108)
    text: {
      primary: 'rgb(230, 222, 216)',
      secondary: 'rgb(191, 186, 182)',
      muted: 'rgb(148, 144, 141)',
    },
    border: {
      subtle: 'rgba(255,255,255,0.07)',
      interactive: 'rgba(255,255,255,0.34)',
    },
    background: {
      idle: IDLE_BG,         // rgb(46, 42, 40)
      streaming: STREAMING_BG, // rgb(48, 43, 40)
      error: ERROR_BG,       // rgb(44, 42, 42)
    },
  },
  typography: {
    largeTitle: {
      fontSize: 28,
      fontWeight: '600',
      lineHeight: 34,
      fontFamily: 'Inter',
    },
    heading: {
      fontSize: 17,
      fontWeight: '600',
      lineHeight: 22,
      fontFamily: 'Inter',
    },
    body: {
      fontSize: 15,
      fontWeight: '400',
      lineHeight: 24,
      fontFamily: 'Inter',
    },
    caption: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 16,
      fontFamily: 'Inter',
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
    subtle: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
    },
    heavy: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.30,
      shadowRadius: 32,
    },
    glow: (color: string) => ({
      shadowColor: color,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
    }),
  },
  radii: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },
};
