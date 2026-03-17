import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Reduced motion accessibility', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('prefersReducedMotion()', () => {
    it('returns true when user prefers reduced motion', async () => {
      vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
      const { prefersReducedMotion } = await import('../lib/motion');
      expect(prefersReducedMotion()).toBe(true);
      expect(window.matchMedia).toHaveBeenCalledWith(
        '(prefers-reduced-motion: reduce)',
      );
    });

    it('returns false when user has no motion preference', async () => {
      vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
      const { prefersReducedMotion } = await import('../lib/motion');
      expect(prefersReducedMotion()).toBe(false);
    });
  });

  describe('base.css global override', () => {
    it('contains prefers-reduced-motion media query with 0.01ms duration', () => {
      const cssPath = resolve(__dirname, '../styles/base.css');
      const css = readFileSync(cssPath, 'utf-8');

      expect(css).toContain('@media (prefers-reduced-motion: reduce)');
      expect(css).toMatch(/animation-duration:\s*0\.01ms\s*!important/);
      expect(css).toMatch(/animation-iteration-count:\s*1\s*!important/);
      expect(css).toMatch(/transition-duration:\s*0\.01ms\s*!important/);
      expect(css).toMatch(/scroll-behavior:\s*auto\s*!important/);
    });

    it('uses universal selector to cover all elements', () => {
      const cssPath = resolve(__dirname, '../styles/base.css');
      const css = readFileSync(cssPath, 'utf-8');

      // The rule should target *, *::before, *::after
      expect(css).toContain('*::before');
      expect(css).toContain('*::after');
    });
  });
});
