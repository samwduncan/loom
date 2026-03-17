/**
 * WCAG AA Contrast Ratio Audit for Loom V2 Design Tokens
 *
 * Verifies all text-on-surface color pairs meet WCAG AA minimum contrast:
 * - 4.5:1 for normal text (<18px or <14px bold)
 * - 3:1 for large text (>=18px or >=14px bold) and interactive borders
 *
 * Uses OKLCH-to-sRGB conversion via OKLab intermediary.
 * Reference: https://bottosson.github.io/posts/oklab/
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ── OKLCH-to-sRGB Conversion ─────────────────────────────────────────

/** Convert OKLCH to OKLab */
function oklchToOklab(
  L: number,
  C: number,
  H: number,
): [number, number, number] {
  const hRad = (H * Math.PI) / 180;
  return [L, C * Math.cos(hRad), C * Math.sin(hRad)];
}

/** Convert OKLab to linear sRGB via LMS intermediary */
function oklabToLinearRGB(
  L: number,
  a: number,
  b: number,
): [number, number, number] {
  // OKLab to LMS (cube root space)
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  // Cube to get LMS
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  // LMS to linear sRGB
  const r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  return [r, g, bl];
}

/** Apply sRGB gamma correction (linear -> sRGB) */
function linearToSrgb(c: number): number {
  const clamped = Math.max(0, Math.min(1, c));
  return clamped <= 0.0031308
    ? 12.92 * clamped
    : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
}

/** Compute relative luminance per WCAG 2.x from sRGB [0,1] values */
function srgbRelativeLuminance(r: number, g: number, b: number): number {
  // Convert sRGB to linear
  const toLinear = (c: number) =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** Compute WCAG contrast ratio between two luminance values */
function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Convert OKLCH color to relative luminance */
function oklchToLuminance(L: number, C: number, H: number): number {
  const [labL, labA, labB] = oklchToOklab(L, C, H);
  const [linR, linG, linB] = oklabToLinearRGB(labL, labA, labB);
  const r = linearToSrgb(linR);
  const g = linearToSrgb(linG);
  const b = linearToSrgb(linB);
  return srgbRelativeLuminance(r, g, b);
}

/**
 * Composite a semi-transparent color over an opaque background.
 * Both fg and bg are OKLCH; alpha is the fg opacity.
 * Returns the luminance of the composited result.
 */
function compositeLuminance(
  fgL: number,
  fgC: number,
  fgH: number,
  alpha: number,
  bgL: number,
  bgC: number,
  bgH: number,
): number {
  const [fLabL, fLabA, fLabB] = oklchToOklab(fgL, fgC, fgH);
  const [fLinR, fLinG, fLinB] = oklabToLinearRGB(fLabL, fLabA, fLabB);
  const fR = linearToSrgb(fLinR);
  const fG = linearToSrgb(fLinG);
  const fB = linearToSrgb(fLinB);

  const [bLabL, bLabA, bLabB] = oklchToOklab(bgL, bgC, bgH);
  const [bLinR, bLinG, bLinB] = oklabToLinearRGB(bLabL, bLabA, bLabB);
  const bR = linearToSrgb(bLinR);
  const bG = linearToSrgb(bLinG);
  const bB = linearToSrgb(bLinB);

  // Alpha compositing in sRGB space
  const cR = fR * alpha + bR * (1 - alpha);
  const cG = fG * alpha + bG * (1 - alpha);
  const cB = fB * alpha + bB * (1 - alpha);

  return srgbRelativeLuminance(cR, cG, cB);
}

// ── Token Parsing ────────────────────────────────────────────────────

interface OklchColor {
  L: number;
  C: number;
  H: number;
  alpha: number;
}

function parseTokens(css: string): Map<string, OklchColor> {
  const tokens = new Map<string, OklchColor>();
  // Match: --name: oklch(L C H) or oklch(L C H / alpha)
  const regex =
    /--([\w-]+):\s*oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)/g;
  let match;
  while ((match = regex.exec(css)) !== null) {
    const name = match[1]!; // ASSERT: group 1 always captured when regex matches
    const lVal = match[2]!; // ASSERT: group 2 always captured when regex matches
    const cVal = match[3]!; // ASSERT: group 3 always captured when regex matches
    const hVal = match[4]!; // ASSERT: group 4 always captured when regex matches
    tokens.set(name, {
      L: parseFloat(lVal),
      C: parseFloat(cVal),
      H: parseFloat(hVal),
      alpha: match[5] != null ? parseFloat(match[5]) : 1,
    });
  }
  return tokens;
}

// ── Test Suite ───────────────────────────────────────────────────────

describe('WCAG AA contrast ratio audit', () => {
  let tokens: Map<string, OklchColor>;

  beforeAll(() => {
    const cssPath = resolve(__dirname, '../styles/tokens.css');
    const css = readFileSync(cssPath, 'utf-8');
    tokens = parseTokens(css);
  });

  function getLuminance(name: string): number {
    const t = tokens.get(name);
    if (!t) throw new Error(`Token --${name} not found in tokens.css`);
    if (t.alpha < 1) {
      // Composite against surface-base
      const bg = tokens.get('surface-base');
      if (!bg)
        throw new Error('Token --surface-base not found for compositing');
      return compositeLuminance(t.L, t.C, t.H, t.alpha, bg.L, bg.C, bg.H);
    }
    return oklchToLuminance(t.L, t.C, t.H);
  }

  function assertContrast(
    fgName: string,
    bgName: string,
    minRatio: number,
  ): void {
    const fgLum = getLuminance(fgName);
    const bgLum = getLuminance(bgName);
    const ratio = contrastRatio(fgLum, bgLum);
    expect(
      ratio,
      `--${fgName} on --${bgName}: ${ratio.toFixed(2)}:1 (need ${minRatio}:1)`,
    ).toBeGreaterThanOrEqual(minRatio);
  }

  // Normal text requires 4.5:1
  describe('text on surfaces (4.5:1 normal text)', () => {
    it('text-primary on surface-base', () => {
      assertContrast('text-primary', 'surface-base', 4.5);
    });

    it('text-primary on surface-sunken', () => {
      assertContrast('text-primary', 'surface-sunken', 4.5);
    });

    it('text-primary on surface-raised', () => {
      assertContrast('text-primary', 'surface-raised', 4.5);
    });

    it('text-secondary on surface-base', () => {
      assertContrast('text-secondary', 'surface-base', 4.5);
    });

    it('text-muted on surface-base', () => {
      assertContrast('text-muted', 'surface-base', 4.5);
    });

    it('text-muted on surface-sunken', () => {
      assertContrast('text-muted', 'surface-sunken', 4.5);
    });
  });

  describe('accent and status colors on surfaces (4.5:1)', () => {
    it('accent-primary on surface-base', () => {
      assertContrast('accent-primary', 'surface-base', 4.5);
    });

    it('accent-primary-fg on accent-primary (button text)', () => {
      assertContrast('accent-primary-fg', 'accent-primary', 4.5);
    });

    it('status-success on surface-base', () => {
      assertContrast('status-success', 'surface-base', 4.5);
    });

    it('status-error on surface-base', () => {
      assertContrast('status-error', 'surface-base', 4.5);
    });

    it('status-warning on surface-base', () => {
      assertContrast('status-warning', 'surface-base', 4.5);
    });

    it('status-info on surface-base', () => {
      assertContrast('status-info', 'surface-base', 4.5);
    });
  });

  describe('interactive borders (3:1)', () => {
    it('border-interactive on surface-base', () => {
      assertContrast('border-interactive', 'surface-base', 3);
    });
  });
});
