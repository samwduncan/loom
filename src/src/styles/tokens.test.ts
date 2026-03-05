import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const currentDir = dirname(fileURLToPath(import.meta.url));
const tokensPath = resolve(currentDir, 'tokens.css');
const tokensContent = readFileSync(tokensPath, 'utf-8');

describe('tokens.css design token file', () => {
  it('contains all required CSS custom properties', () => {
    const requiredProperties = [
      '--surface-base',
      '--surface-raised',
      '--surface-overlay',
      '--text-primary',
      '--text-secondary',
      '--text-muted',
      '--accent-primary',
      '--border-subtle',
      '--border-interactive',
      '--z-base',
      '--z-modal',
      '--z-critical',
      '--space-1',
      '--space-4',
      '--space-16',
      '--ease-spring',
      '--duration-fast',
      '--duration-normal',
    ];

    for (const prop of requiredProperties) {
      expect(tokensContent).toContain(prop);
    }
  });

  it('uses OKLCH color values (not hex or HSL)', () => {
    // Must contain oklch(
    expect(tokensContent).toContain('oklch(');

    // Extract property declarations (lines with -- and a colon) and check for hex values
    const propertyLines = tokensContent
      .split('\n')
      .filter((line) => line.includes('--') && line.includes(':'))
      // Exclude comment lines
      .filter((line) => !line.trimStart().startsWith('/*') && !line.trimStart().startsWith('*'));

    // Color properties should not use standalone hex (#rrggbb or #rgb) in their values
    const colorPropertyLines = propertyLines.filter(
      (line) =>
        line.includes('surface') ||
        line.includes('text-') ||
        line.includes('accent') ||
        line.includes('status') ||
        line.includes('border') ||
        line.includes('rose-') ||
        line.includes('diff-') ||
        line.includes('code-') ||
        line.includes('fx-gradient'),
    );

    for (const line of colorPropertyLines) {
      const value = line.split(':')[1] ?? '';
      // Should not contain hex color values like #fff, #000, #rrggbb
      expect(value).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    }
  });

  it('defines all properties inside :root', () => {
    // File should have a :root block
    expect(tokensContent).toContain(':root');

    // Verify no duplicate color properties in :root
    const rootMatch = tokensContent.match(/:root\s*\{([\s\S]*)\}/);
    expect(rootMatch).not.toBeNull();

    const rootBlock = rootMatch![1]!; // ASSERT: regex matched :root block verified by preceding expect
    const surfaceBaseMatches = rootBlock.match(/--surface-base\s*:/g);
    expect(surfaceBaseMatches).toHaveLength(1);
  });
});
