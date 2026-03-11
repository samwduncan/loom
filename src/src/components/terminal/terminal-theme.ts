/**
 * Terminal theme — maps OKLCH design system tokens to xterm.js ITheme.
 *
 * Reads CSS custom properties via getComputedStyle(document.documentElement).
 * Browser engines resolve oklch() to rgb() in computed styles, so xterm.js
 * receives rgb(...) strings which it accepts natively.
 *
 * Constitution: Named exports only (2.2), no default export.
 */

import type { ITheme } from '@xterm/xterm';

/**
 * Read a CSS custom property value from :root.
 * Returns empty string in non-browser environments (SSR, workers).
 */
function cssVar(name: string): string {
  if (typeof document === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * Build an xterm.js ITheme from the Loom design system CSS custom properties.
 *
 * Called once when the terminal mounts, and again when the theme changes.
 */
export function getTerminalTheme(): ITheme {
  return {
    background: cssVar('--surface-base'),
    foreground: cssVar('--text-primary'),
    cursor: cssVar('--accent-primary'),
    cursorAccent: cssVar('--surface-base'),
    selectionBackground: 'rgba(255,255,255,0.15)',

    // ANSI standard colors (0-7)
    black: cssVar('--surface-base'),
    red: cssVar('--status-error'),
    green: cssVar('--status-success'),
    yellow: cssVar('--status-warning'),
    blue: cssVar('--status-info'),
    magenta: cssVar('--accent-primary'),
    cyan: cssVar('--ansi-cyan'),
    white: cssVar('--text-primary'),

    // ANSI bright colors (8-15)
    brightBlack: cssVar('--text-muted'),
    brightRed: cssVar('--ansi-bright-red'),
    brightGreen: cssVar('--ansi-bright-green'),
    brightYellow: cssVar('--ansi-bright-yellow'),
    brightBlue: cssVar('--ansi-bright-blue'),
    brightMagenta: cssVar('--ansi-bright-magenta'),
    brightCyan: cssVar('--ansi-bright-cyan'),
    brightWhite: cssVar('--ansi-bright-white'),
  };
}
