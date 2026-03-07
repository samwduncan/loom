/**
 * Loom OKLCH theme for Shiki syntax highlighting.
 * Uses CSS variables so token colors are driven entirely by tokens.css.
 */
import { createCssVariablesTheme } from 'shiki/core';

export const loomTheme = createCssVariablesTheme({
  name: 'loom-dark',
  variablePrefix: '--shiki-',
  fontStyle: true,
});
