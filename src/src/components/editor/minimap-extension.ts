/**
 * Minimap extension -- shows a code overview in the right gutter.
 * Uses showMinimap.compute facet to conditionally display based on doc length.
 * Hidden for short files (< 50 lines) where a minimap adds no value.
 *
 * Extracted as a standalone module for testability -- the compute callback
 * is a pure function of editor state, testable without mocking CodeMirror.
 */

import { showMinimap } from '@replit/codemirror-minimap';

export const MINIMAP_LINE_THRESHOLD = 50;

/**
 * Compute minimap config from editor state.
 * Returns config object for files with enough lines, null otherwise.
 * Exported for direct unit testing.
 */
export function computeMinimapConfig(state: { doc: { lines: number } }) {
  if (state.doc.lines < MINIMAP_LINE_THRESHOLD) return null;
  return {
    create: () => ({ dom: document.createElement('div') }),
    displayText: 'blocks' as const,
    showOverlay: 'always' as const,
  };
}

export const minimapExtension = showMinimap.compute(['doc'], computeMinimapConfig);
