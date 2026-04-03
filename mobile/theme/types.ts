import { type TextStyle, type ViewStyle } from 'react-native';
import { type WithSpringConfig } from 'react-native-reanimated';

export interface LoomTheme {
  colors: {
    surface: {
      sunken: string;  // rgb(28, 26, 24) - Tier 0
      base: string;    // rgb(44, 40, 38) - Tier 1
      raised: string;  // rgb(64, 60, 57) - Tier 2
      overlay: string; // rgb(82, 78, 74) - Tier 3
    };
    accent: string;      // rgb(196, 108, 88)
    accentFg: string;    // rgb(46, 42, 40)
    destructive: string; // rgb(210, 112, 88)
    success: string;     // rgb(82, 175, 108)
    text: {
      primary: string;   // rgb(230, 222, 216)
      secondary: string; // rgb(191, 186, 182)
      muted: string;     // rgb(148, 144, 141)
    };
    border: {
      subtle: string;      // rgba(255,255,255,0.07)
      interactive: string; // rgba(255,255,255,0.34)
    };
    background: {
      idle: string;      // rgb(46, 42, 40)
      streaming: string; // rgb(48, 43, 40)
      error: string;     // rgb(44, 42, 42)
    };
  };
  typography: {
    largeTitle: TextStyle; // 28px semibold
    heading: TextStyle;    // 17px semibold
    body: TextStyle;       // 15px regular
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
    full: number; // 9999
  };
}
