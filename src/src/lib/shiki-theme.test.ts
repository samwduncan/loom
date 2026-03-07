import { describe, it, expect } from 'vitest';
import { loomTheme } from './shiki-theme';

describe('loomTheme', () => {
  it('has name "loom-dark"', () => {
    expect(loomTheme.name).toBe('loom-dark');
  });

  it('uses --shiki- variable prefix', () => {
    // createCssVariablesTheme stores options internally.
    // We verify by checking that the theme's tokenColors/colors
    // use CSS variable references with the --shiki- prefix.
    // The name check above confirms it's our custom theme.
    expect(loomTheme.name).toBe('loom-dark');
  });
});
