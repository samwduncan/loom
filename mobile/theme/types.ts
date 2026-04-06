import { type TextStyle, type ViewStyle } from 'react-native';
import { type WithSpringConfig } from 'react-native-reanimated';

/** Vivid + muted pair for category/provider colors */
export interface ColorPair {
  vivid: string;
  muted: string;
}

export interface LoomTheme {
  colors: {
    surface: {
      deep: string;    // Tier -1: code blocks, terminal, deepest wells
      sunken: string;  // Tier 0: app base, drawer bg
      base: string;    // Tier 1: panel bg, sidebar
      raised: string;  // Tier 2: cards, composer, user bubbles
      input: string;   // Tier 2.5: input wells, code block headers
      overlay: string; // Tier 3: modals, popovers, sheets
    };
    accent: string;
    accentBright: string;
    accentDim: string;
    accentFg: string;
    accentMuted: string;
    destructive: string;
    success: string;
    info: string;
    warning: string;
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
      muted: string;
      inverse: string;
      danger: string;
      success: string;
    };
    border: {
      subtle: string;
      medium: string;
      strong: string;
    };
    glass: string;  // Backdrop overlay for blur surfaces
    background: {
      idle: string;
      streaming: string;
      error: string;
    };
    /** Semantic category colors (4 core + 1 provider) */
    category: {
      green: ColorPair;    // Shell, terminal, monitoring
      orange: ColorPair;   // Edits, git, file mutations
      blue: ColorPair;     // Web, search, deploy, info
      pink: ColorPair;     // Agent delegation
      coral: ColorPair;    // Claude provider badge only
    };
    /** AI provider brand colors */
    provider: {
      claude: ColorPair;
      codex: ColorPair;
      gemini: ColorPair;
    };
  };
  typography: {
    largeTitle: TextStyle;  // 28px semibold — used sparingly
    headline: TextStyle;    // 20px semibold — screen titles, section headers
    body: TextStyle;        // 16px regular — messages, descriptions, primary content
    label: TextStyle;       // 13px medium — tool names, session titles, button text, nav
    meta: TextStyle;        // 11px regular — timestamps, badges, section sub-labels
    code: TextStyle;        // 14px mono — code blocks
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
    composer: ViewStyle;
    sheet: ViewStyle;
  };
  radii: {
    xs: number;    // 4
    sm: number;    // 6
    md: number;    // 8
    lg: number;    // 10
    xl: number;    // 12
    '2xl': number; // 16
    input: number; // 24
    pill: number;  // 9999
  };
  rimLight: ViewStyle;
}
