/**
 * Minimap extension tests -- verifies threshold logic directly.
 *
 * Tests the pure computeMinimapConfig function without mocking CodeMirror.
 * Canvas rendering is untestable in jsdom, but the conditional display
 * logic (50-line threshold) is the important contract to verify.
 */

import { describe, it, expect } from 'vitest';
import { computeMinimapConfig, MINIMAP_LINE_THRESHOLD } from './minimap-extension';

describe('computeMinimapConfig', () => {
  it('returns null for files shorter than threshold', () => {
    const state = { doc: { lines: 10 } };
    expect(computeMinimapConfig(state)).toBeNull();
  });

  it('returns null at exactly threshold - 1 lines', () => {
    const state = { doc: { lines: MINIMAP_LINE_THRESHOLD - 1 } };
    expect(computeMinimapConfig(state)).toBeNull();
  });

  it('returns config at exactly threshold lines', () => {
    const state = { doc: { lines: MINIMAP_LINE_THRESHOLD } };
    const config = computeMinimapConfig(state);
    expect(config).not.toBeNull();
    expect(config!.displayText).toBe('blocks'); // ASSERT: config is non-null (checked above)
    expect(config!.showOverlay).toBe('always'); // ASSERT: config is non-null (checked above)
  });

  it('returns config for files much longer than threshold', () => {
    const state = { doc: { lines: 500 } };
    const config = computeMinimapConfig(state);
    expect(config).not.toBeNull();
  });

  it('create() returns a DOM element', () => {
    const state = { doc: { lines: 100 } };
    const config = computeMinimapConfig(state)!; // ASSERT: 100 lines exceeds threshold so config is non-null
    const result = config.create();
    expect(result.dom).toBeInstanceOf(HTMLDivElement);
  });

  it('threshold constant is 50', () => {
    expect(MINIMAP_LINE_THRESHOLD).toBe(50);
  });
});
