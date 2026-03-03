/**
 * Catppuccin Mocha color palette — warm-shifted for Loom's charcoal base.
 *
 * Base/surface/text colors are warm-shifted to match the app's charcoal (#1b1a19)
 * palette. Accent/token colors remain pure Catppuccin Mocha for recognizable
 * syntax highlighting across all specialty surfaces (terminal, Shiki, CodeMirror,
 * diff viewer, markdown prose).
 *
 * Single source of truth — imported by terminal, Shiki, CodeMirror, and diff viewer.
 */

// ── Warm-shifted Catppuccin Mocha palette ──────────────────────────────────────

export const catppuccinMocha = {
  // Base/surface colors — warm-shifted to match app charcoal
  base: '#1b1a19',       // App's --surface-base (Catppuccin original: #1e1e2e)
  mantle: '#191817',     // Slightly darker than base, for code block backgrounds
  crust: '#151413',      // Darkest level
  surface0: '#252423',   // App's --secondary
  surface1: '#2b2a29',   // App's --surface-elevated
  surface2: '#343332',   // Lighter surface

  // Text colors — warm-shifted
  text: '#e4dbd9',       // App's --foreground
  subtext1: '#bdb9b9',   // App's --foreground-secondary
  subtext0: '#989494',   // App's --muted-foreground
  overlay2: '#7a7676',
  overlay1: '#636060',
  overlay0: '#4d4a4a',

  // Accent/token colors — pure Catppuccin Mocha (no warm shift)
  rosewater: '#f5e0dc',
  flamingo: '#f2cdcd',
  pink: '#f5c2e7',
  mauve: '#cba6f7',
  red: '#f38ba8',
  maroon: '#eba0ac',
  peach: '#fab387',
  yellow: '#f9e2af',
  green: '#a6e3a1',
  teal: '#94e2d5',
  sky: '#89dceb',
  sapphire: '#74c7ec',
  blue: '#89b4fa',
  lavender: '#b4befe',
} as const;

// ── Semantic syntax color mapping ──────────────────────────────────────────────

export const syntaxColors = {
  keyword: catppuccinMocha.mauve,       // #cba6f7
  string: catppuccinMocha.green,        // #a6e3a1
  type: catppuccinMocha.yellow,         // #f9e2af
  function: catppuccinMocha.blue,       // #89b4fa
  variable: catppuccinMocha.text,       // #e4dbd9
  comment: catppuccinMocha.overlay1,    // #636060
  number: catppuccinMocha.peach,        // #fab387
  operator: catppuccinMocha.sky,        // #89dceb
  controlFlow: catppuccinMocha.mauve,   // #cba6f7
  constant: catppuccinMocha.peach,      // #fab387
  tag: catppuccinMocha.blue,            // #89b4fa
  attribute: catppuccinMocha.yellow,    // #f9e2af
  property: catppuccinMocha.lavender,   // #b4befe
  regex: catppuccinMocha.peach,         // #fab387
  punctuation: catppuccinMocha.overlay2, // #7a7676
} as const;

// ── Shiki base color replacements ──────────────────────────────────────────────
// Maps original Catppuccin Mocha base/surface/text hex values to warm-shifted
// equivalents. Used by Shiki's colorReplacements option to warm-shift only
// backgrounds and text — token/accent colors stay pure Catppuccin.

export const shikiBaseReplacements: Record<string, string> = {
  '#1e1e2e': catppuccinMocha.mantle,    // base -> code block bg (slightly darker)
  '#181825': catppuccinMocha.crust,     // mantle -> darker
  '#11111b': '#111010',                 // crust -> darkest
  '#313244': catppuccinMocha.surface0,  // surface0 -> app secondary
  '#45475a': catppuccinMocha.surface1,  // surface1 -> app elevated
  '#585b70': catppuccinMocha.surface2,  // surface2
  '#cdd6f4': catppuccinMocha.text,      // text -> app foreground
  '#bac2de': catppuccinMocha.subtext1,  // subtext1 -> app foreground-secondary
  '#a6adc8': catppuccinMocha.subtext0,  // subtext0 -> app muted-foreground
  '#9399b2': catppuccinMocha.overlay2,  // overlay2
  '#7f849c': catppuccinMocha.overlay1,  // overlay1
  '#6c7086': catppuccinMocha.overlay0,  // overlay0
} as const;
