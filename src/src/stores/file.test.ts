/**
 * File Store Tests -- verifies all 7 store actions produce correct state transitions.
 *
 * Uses direct store access (getState/setState) per Constitution 6.3.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useFileStore } from '@/stores/file';

describe('useFileStore', () => {
  beforeEach(() => {
    useFileStore.getState().reset();
  });

  describe('toggleDir', () => {
    it('adds path to expandedDirs when not present', () => {
      useFileStore.getState().toggleDir('/src');
      expect(useFileStore.getState().expandedDirs.has('/src')).toBe(true);
    });

    it('removes path from expandedDirs when already present', () => {
      useFileStore.getState().toggleDir('/src');
      useFileStore.getState().toggleDir('/src');
      expect(useFileStore.getState().expandedDirs.size).toBe(0);
    });

    it('handles multiple directories independently', () => {
      useFileStore.getState().toggleDir('/src');
      useFileStore.getState().toggleDir('/lib');
      expect(useFileStore.getState().expandedDirs.has('/src')).toBe(true);
      expect(useFileStore.getState().expandedDirs.has('/lib')).toBe(true);

      useFileStore.getState().toggleDir('/src');
      expect(useFileStore.getState().expandedDirs.has('/lib')).toBe(true);
      expect(useFileStore.getState().expandedDirs.has('/src')).toBe(false);
    });
  });

  describe('selectPath', () => {
    it('sets selectedPath to given path', () => {
      useFileStore.getState().selectPath('/src/index.ts');
      expect(useFileStore.getState().selectedPath).toBe('/src/index.ts');
    });

    it('sets selectedPath to null', () => {
      useFileStore.getState().selectPath('/src/index.ts');
      useFileStore.getState().selectPath(null);
      expect(useFileStore.getState().selectedPath).toBeNull();
    });
  });

  describe('openFile', () => {
    it('sets activeFilePath and adds tab', () => {
      useFileStore.getState().openFile('/src/index.ts');
      const state = useFileStore.getState();
      expect(state.activeFilePath).toBe('/src/index.ts');
      expect(state.selectedPath).toBe('/src/index.ts');
      expect(state.openTabs).toEqual([{ filePath: '/src/index.ts', isDirty: false }]);
    });

    it('does not duplicate existing tab', () => {
      useFileStore.getState().openFile('/src/index.ts');
      useFileStore.getState().openFile('/src/index.ts');
      expect(useFileStore.getState().openTabs).toHaveLength(1);
    });

    it('switches to existing tab without duplicating', () => {
      useFileStore.getState().openFile('/src/a.ts');
      useFileStore.getState().openFile('/src/b.ts');
      useFileStore.getState().openFile('/src/a.ts');
      expect(useFileStore.getState().openTabs).toHaveLength(2);
      expect(useFileStore.getState().activeFilePath).toBe('/src/a.ts');
    });
  });

  describe('closeFile', () => {
    it('removes tab from openTabs', () => {
      useFileStore.getState().openFile('/src/a.ts');
      useFileStore.getState().openFile('/src/b.ts');
      useFileStore.getState().closeFile('/src/a.ts');
      expect(useFileStore.getState().openTabs).toHaveLength(1);
      expect(useFileStore.getState().openTabs[0]?.filePath).toBe('/src/b.ts');
    });

    it('switches activeFilePath to last remaining tab when closing active file', () => {
      useFileStore.getState().openFile('/src/a.ts');
      useFileStore.getState().openFile('/src/b.ts');
      useFileStore.getState().openFile('/src/c.ts');
      // active is /src/c.ts
      useFileStore.getState().closeFile('/src/c.ts');
      expect(useFileStore.getState().activeFilePath).toBe('/src/b.ts');
    });

    it('sets activeFilePath to null when closing the last tab', () => {
      useFileStore.getState().openFile('/src/a.ts');
      useFileStore.getState().closeFile('/src/a.ts');
      expect(useFileStore.getState().activeFilePath).toBeNull();
      expect(useFileStore.getState().openTabs).toHaveLength(0);
    });

    it('does not change activeFilePath when closing non-active tab', () => {
      useFileStore.getState().openFile('/src/a.ts');
      useFileStore.getState().openFile('/src/b.ts');
      // active is /src/b.ts
      useFileStore.getState().closeFile('/src/a.ts');
      expect(useFileStore.getState().activeFilePath).toBe('/src/b.ts');
    });
  });

  describe('setDirty', () => {
    it('updates isDirty on matching tab', () => {
      useFileStore.getState().openFile('/src/a.ts');
      useFileStore.getState().setDirty('/src/a.ts', true);
      expect(useFileStore.getState().openTabs[0]?.isDirty).toBe(true);
    });

    it('sets isDirty back to false', () => {
      useFileStore.getState().openFile('/src/a.ts');
      useFileStore.getState().setDirty('/src/a.ts', true);
      useFileStore.getState().setDirty('/src/a.ts', false);
      expect(useFileStore.getState().openTabs[0]?.isDirty).toBe(false);
    });

    it('does not affect other tabs', () => {
      useFileStore.getState().openFile('/src/a.ts');
      useFileStore.getState().openFile('/src/b.ts');
      useFileStore.getState().setDirty('/src/a.ts', true);
      expect(useFileStore.getState().openTabs[1]?.isDirty).toBe(false);
    });
  });

  describe('setActiveFile', () => {
    it('sets activeFilePath', () => {
      useFileStore.getState().setActiveFile('/src/a.ts');
      expect(useFileStore.getState().activeFilePath).toBe('/src/a.ts');
    });

    it('sets activeFilePath to null', () => {
      useFileStore.getState().setActiveFile('/src/a.ts');
      useFileStore.getState().setActiveFile(null);
      expect(useFileStore.getState().activeFilePath).toBeNull();
    });
  });

  describe('reset', () => {
    it('restores all state to initial values', () => {
      useFileStore.getState().openFile('/src/a.ts');
      useFileStore.getState().toggleDir('/src');
      useFileStore.getState().setDirty('/src/a.ts', true);

      useFileStore.getState().reset();

      const state = useFileStore.getState();
      expect(state.expandedDirs.size).toBe(0);
      expect(state.selectedPath).toBeNull();
      expect(state.openTabs).toEqual([]);
      expect(state.activeFilePath).toBeNull();
    });
  });
});
