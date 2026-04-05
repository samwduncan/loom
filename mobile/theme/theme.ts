import { SPRING } from '../lib/springs';
import { SURFACE, ACCENT, DESTRUCTIVE, SUCCESS, IDLE_BG, STREAMING_BG, ERROR_BG } from '../lib/colors';
import type { LoomTheme } from './types';

export const theme: LoomTheme = {
  colors: {
    surface: {
      sunken: SURFACE.sunken,
      base: SURFACE.base,
      raised: SURFACE.raised,
      overlay: SURFACE.overlay,
    },
    accent: ACCENT,
    accentFg: 'rgb(15, 15, 16)',
    destructive: DESTRUCTIVE,
    success: SUCCESS,
    text: {
      primary: 'rgb(245, 245, 246)',
      secondary: 'rgb(188, 188, 192)',
      muted: 'rgb(138, 138, 142)',
    },
    border: {
      subtle: 'rgba(255,255,255,0.10)',
      interactive: 'rgba(255,255,255,0.20)',
    },
    glass: 'rgba(0,0,0,0.60)',
    background: {
      idle: IDLE_BG,         // rgb(15, 15, 16)
      streaming: STREAMING_BG, // rgb(16, 16, 18)
      error: ERROR_BG,       // rgb(14, 14, 15)
    },
  },
  typography: {
    largeTitle: {
      fontSize: 28,
      fontWeight: '600',
      lineHeight: 34,
      fontFamily: 'Inter-SemiBold',
    },
    heading: {
      fontSize: 17,
      fontWeight: '600',
      lineHeight: 22,
      fontFamily: 'Inter-SemiBold',
    },
    body: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
      fontFamily: 'Inter-Regular',
    },
    small: {
      fontSize: 13,
      fontWeight: '400',
      lineHeight: 18,
      fontFamily: 'Inter-Regular',
    },
    caption: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 16,
      fontFamily: 'Inter-Regular',
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
      shadowOpacity: 0.08,
      shadowRadius: 8,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
    },
    heavy: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.20,
      shadowRadius: 32,
    },
    glow: (color: string) => ({
      shadowColor: color,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.20,
      shadowRadius: 16,
    }),
  },
  radii: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    pill: 32,
    full: 9999,
  },
  rimLight: {
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
};
