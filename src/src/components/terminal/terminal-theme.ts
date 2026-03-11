/**
 * Terminal theme — maps OKLCH design system tokens to xterm.js ITheme.
 *
 * Reads CSS custom properties via getComputedStyle(document.documentElement).
 * Browser engines resolve oklch() to rgb() in computed styles, so xterm.js
 * receives rgb(...) strings which it accepts natively.
 *
 * If a browser returns raw oklch() strings (unlikely but possible in future
 * engines), xterm.js would silently ignore them and fall back to defaults.
 * The bright variants are hardcoded hex as a safety net.
 *
 * Constitution: Named exports only (2.2), no default export.
 */

import type { ITheme } from '@xterm/xterm';

/**
 * Read a CSS custom property value from :root.
 */
function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * Build an xterm.js ITheme from the Loom design system CSS custom properties.
 *
 * Called once when the terminal mounts, and again if the theme changes.
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
    cyan: '#56d4dd',
    white: cssVar('--text-primary'),

    // ANSI bright colors (8-15) — hardcoded hex for safety
    brightBlack: cssVar('--text-muted'),
    brightRed: '#ff6b6b',
    brightGreen: '#69db7c',
    brightYellow: '#ffd43b',
    brightBlue: '#74c0fc',
    brightMagenta: '#da77f2',
    brightCyan: '#66d9e8',
    brightWhite: '#ffffff',
  };
}
