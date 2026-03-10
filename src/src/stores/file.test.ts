/**
 * File Store tests — minimal skeleton verification.
 *
 * Uses getState()/setState() directly (exempted from no-external-store-mutation ESLint rule).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useFileStore } from './file';

describe('useFileStore', () => {
  beforeEach(() => {
    useFileStore.getState().reset();
  });

  it('is importable and returns a store with correct initial state', () => {
    const state = useFileStore.getState();
    expect(Array.isArray(state.openTabs)).toBe(true);
    expect(state.openTabs).toHaveLength(0);
    expect(state.activeFilePath).toBeNull();
    expect(Array.isArray(state.expandedDirs)).toBe(true);
    expect(state.expandedDirs).toHaveLength(0);
    expect(state.selectedPath).toBeNull();
  });

  it('reset() returns to initial state after mutation', () => {
    // Mutate state directly via setState
    useFileStore.setState({
      openTabs: [{ filePath: '/test/file.ts', isDirty: true }],
      activeFilePath: '/test/file.ts',
      expandedDirs: ['/test', '/test/sub'],
      selectedPath: '/test/file.ts',
    });

    // Verify mutation took effect
    expect(useFileStore.getState().openTabs).toHaveLength(1);
    expect(useFileStore.getState().activeFilePath).toBe('/test/file.ts');

    // Reset
    useFileStore.getState().reset();

    // Verify initial state restored
    const state = useFileStore.getState();
    expect(state.openTabs).toHaveLength(0);
    expect(state.activeFilePath).toBeNull();
    expect(state.expandedDirs).toHaveLength(0);
    expect(state.selectedPath).toBeNull();
  });
});
