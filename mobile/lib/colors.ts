/**
 * Loom color system — warm surfaces, bold orange accent, 4 category colors.
 *
 * Design principles:
 * - Surfaces: warm charcoal (B channel always lowest, never equal RGB)
 * - Brand accent: warm orange — the visual protagonist, used boldly
 * - 4 category colors only (green, orange, blue, pink). File ops use text.secondary.
 * - Provider colors: each AI provider gets its brand color
 * - Every accent has vivid (text/icons) + muted (tinted backgrounds) variants
 *
 * Source of truth: .planning/VISUAL-SPEC.md
 */

import { Easing } from 'react-native-reanimated';

// ── Dynamic background states (warm undertone, B channel lowest) ──
export const IDLE_BG = 'rgb(12, 12, 10)';
export const STREAMING_BG = 'rgb(14, 14, 12)';
export const ERROR_BG = 'rgb(10, 10, 8)';

export const COLOR_TIMING = { duration: 500, easing: Easing.out(Easing.cubic) };

// ── Surface hierarchy (deeper warm charcoal for contrast) ──
export const SURFACE = {
  deep:    'rgb(8, 8, 7)',       // Tier -1: code blocks, terminal, deepest wells
  sunken:  'rgb(12, 12, 10)',    // Tier 0: app base, drawer bg
  base:    'rgb(19, 19, 16)',    // Tier 1: panel bg, sidebar
  raised:  'rgb(30, 30, 24)',    // Tier 2: cards, composer, user bubbles
  input:   'rgb(40, 40, 31)',    // Tier 2.5: input wells, code block headers
  overlay: 'rgb(50, 50, 42)',    // Tier 3: modals, popovers, sheets
} as const;

// ── Brand accent: warm orange (the visual protagonist) ──
export const ACCENT = 'rgb(235, 143, 54)';         // #eb8f36
export const ACCENT_BRIGHT = 'rgb(240, 166, 84)';  // #f0a654 — hover/highlight
export const ACCENT_DIM = 'rgb(201, 109, 46)';     // #c96d2e — press/active
export const ACCENT_MUTED = 'rgba(235, 143, 54, 0.15)';

// ── Semantic status (vivid signals — these MUST pop) ──
export const DESTRUCTIVE = 'rgb(239, 68, 68)';     // #ef4444
export const SUCCESS = 'rgb(16, 185, 129)';         // #10b981
export const WARNING = 'rgb(245, 158, 11)';         // #f59e0b
export const INFO = 'rgb(59, 130, 246)';            // #3b82f6

// ── 4 Category colors (reduced from 8 — when everything is a color, nothing pops) ──
export const CATEGORY = {
  green:   { vivid: 'rgb(52, 211, 153)',  muted: 'rgba(52, 211, 153, 0.12)' },    // Shell, terminal, monitoring
  orange:  { vivid: 'rgb(245, 158, 11)',  muted: 'rgba(245, 158, 11, 0.15)' },    // Edits, git, file mutations
  blue:    { vivid: 'rgb(59, 130, 246)',  muted: 'rgba(59, 130, 246, 0.15)' },    // Web, search, deploy, info
  pink:    { vivid: 'rgb(236, 72, 153)',  muted: 'rgba(236, 72, 153, 0.15)' },    // Agent delegation
  coral:   { vivid: 'rgb(198, 97, 63)',   muted: 'rgba(198, 97, 63, 0.15)' },     // Claude provider badge only
} as const;

// ── Provider brand colors ──
export const PROVIDER = {
  claude:  { vivid: 'rgb(198, 97, 63)',   muted: 'rgba(198, 97, 63, 0.15)' },
  codex:   { vivid: 'rgb(52, 211, 153)',  muted: 'rgba(52, 211, 153, 0.12)' },
  gemini:  { vivid: 'rgb(59, 130, 246)',  muted: 'rgba(59, 130, 246, 0.15)' },
} as const;

// ── Tool → color mapping ──
// File reads/writes use null (renders as text.secondary — default, no color needed)
// Only operations that need attention get a color
export const TOOL_COLORS = {
  read:    null,                 // Default — text.secondary
  write:   null,                 // Default — text.secondary
  edit:    CATEGORY.orange,      // Mutation = attention
  bash:    CATEGORY.green,       // Shell = green (universal)
  grep:    CATEGORY.blue,        // Search
  glob:    CATEGORY.blue,        // Search
  web:     CATEGORY.blue,        // Web operations
  think:   { vivid: ACCENT, muted: ACCENT_MUTED },  // Brand moment
  agent:   CATEGORY.pink,        // Orchestration
  git:     CATEGORY.orange,      // Mutation
  deploy:  CATEGORY.blue,        // Deployment
  mcp:     CATEGORY.green,       // Server/monitoring
} as const;
