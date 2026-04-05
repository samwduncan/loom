import { type TextStyle, type ViewStyle } from 'react-native';
import { type WithSpringConfig } from 'react-native-reanimated';

export interface LoomTheme {
  colors: {
    surface: {
      sunken: string;  // rgb(22, 22, 24) - Tier 0
      base: string;    // rgb(33, 33, 36) - Tier 1
      raised: string;  // rgb(51, 51, 55) - Tier 2
      overlay: string; // rgb(69, 69, 74) - Tier 3
    };
    accent: string;      // rgb(217, 119, 87)
    accentFg: string;    // rgb(15, 15, 16)
    destructive: string; // rgb(239, 68, 68)
    success: string;     // rgb(34, 197, 94)
    text: {
      primary: string;   // rgb(245, 245, 246)
      secondary: string; // rgb(188, 188, 192)
      muted: string;     // rgb(138, 138, 142)
    };
    border: {
      subtle: string;      // rgba(255,255,255,0.10)
      interactive: string; // rgba(255,255,255,0.20)
    };
    background: {
      idle: string;      // rgb(15, 15, 16)
      streaming: string; // rgb(16, 16, 18)
      error: string;     // rgb(14, 14, 15)
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
