import { type TextStyle, type ViewStyle } from 'react-native';
import { type WithSpringConfig } from 'react-native-reanimated';

export interface LoomTheme {
  colors: {
    surface: {
      sunken: string;  // Tier 0: drawer bg, inset areas
      base: string;    // Tier 1: chat bg, default canvas
      raised: string;  // Tier 2: cards, composer, user bubbles
      overlay: string; // Tier 3: modals, popovers
    };
    accent: string;
    accentFg: string;
    destructive: string;
    success: string;
    text: {
      primary: string;
      secondary: string;
      muted: string;
    };
    border: {
      subtle: string;
      interactive: string;
    };
    glass: string;  // Backdrop overlay for blur surfaces
    background: {
      idle: string;
      streaming: string;
      error: string;
    };
  };
  typography: {
    largeTitle: TextStyle; // 28px semibold
    heading: TextStyle;    // 17px semibold
    body: TextStyle;       // 16px regular
    small: TextStyle;      // 13px regular -- tool labels, timestamps, thinking summary, date headers
    caption: TextStyle;    // 12px regular
  };
  spacing: {
    xs: number;   // 4
    sm: number;   // 8
    md: number;   // 16
    lg: number;   // 24
    xl: number;   // 32
    '2xl': number; // 48
    '3xl': number; // 64
  };
  springs: {
    micro: WithSpringConfig;
    standard: WithSpringConfig;
    navigation: WithSpringConfig;
    drawer: WithSpringConfig;
    expand: WithSpringConfig;
    dramatic: WithSpringConfig;
  };
  shadows: {
    subtle: ViewStyle;
    medium: ViewStyle;
    heavy: ViewStyle;
    glow: (color: string) => ViewStyle;
  };
  radii: {
    sm: number;   // 8
    md: number;   // 12
    lg: number;   // 16
    xl: number;   // 20
    pill: number; // 32
    full: number; // 9999
  };
  rimLight: ViewStyle;
}
