/**
 * File Store Tests -- verifies all store actions produce correct state transitions.
 *
 * Uses factory pattern with createFileStore().
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createFileStore } from '../stores/file';

describe('createFileStore', () => {
  let store: ReturnType<typeof createFileStore>;

  beforeEach(() => {
    store = createFileStore();
  });

  describe('toggleDir', () => {
    it('adds path to expandedDirs when not present', () => {
      store.getState().toggleDir('/src');
      expect(store.getState().expandedDirs.has('/src')).toBe(true);
    });

    it('removes path from expandedDirs when already present', () => {
      store.getState().toggleDir('/src');
      store.getState().toggleDir('/src');
      expect(store.getState().expandedDirs.size).toBe(0);
    });

    it('handles multiple directories independently', () => {
      store.getState().toggleDir('/src');
      store.getState().toggleDir('/lib');
      expect(store.getState().expandedDirs.has('/src')).toBe(true);
      expect(store.getState().expandedDirs.has('/lib')).toBe(true);

      store.getState().toggleDir('/src');
      expect(store.getState().expandedDirs.has('/lib')).toBe(true);
      expect(store.getState().expandedDirs.has('/src')).toBe(false);
    });
  });

  describe('selectPath', () => {
    it('sets selectedPath to given path', () => {
      store.getState().selectPath('/src/index.ts');
      expect(store.getState().selectedPath).toBe('/src/index.ts');
    });

    it('sets selectedPath to null', () => {
      store.getState().selectPath('/src/index.ts');
      store.getState().selectPath(null);
      expect(store.getState().selectedPath).toBeNull();
    });
  });

  describe('openFile', () => {
    it('sets activeFilePath and adds tab', () => {
      store.getState().openFile('/src/index.ts');
      const state = store.getState();
      expect(state.activeFilePath).toBe('/src/index.ts');
      expect(state.selectedPath).toBe('/src/index.ts');
      expect(state.openTabs).toEqual([{ filePath: '/src/index.ts', isDirty: false }]);
    });

    it('does not duplicate existing tab', () => {
      store.getState().openFile('/src/index.ts');
      store.getState().openFile('/src/index.ts');
      expect(store.getState().openTabs).toHaveLength(1);
    });

    it('switches to existing tab without duplicating', () => {
      store.getState().openFile('/src/a.ts');
      store.getState().openFile('/src/b.ts');
      store.getState().openFile('/src/a.ts');
      expect(store.getState().openTabs).toHaveLength(2);
      expect(store.getState().activeFilePath).toBe('/src/a.ts');
    });
  });

  describe('closeFile', () => {
    it('removes tab from openTabs', () => {
      store.getState().openFile('/src/a.ts');
      store.getState().openFile('/src/b.ts');
      store.getState().closeFile('/src/a.ts');
      expect(store.getState().openTabs).toHaveLength(1);
      expect(store.getState().openTabs[0]?.filePath).toBe('/src/b.ts');
    });

    it('switches activeFilePath to last remaining tab when closing active file', () => {
      store.getState().openFile('/src/a.ts');
      store.getState().openFile('/src/b.ts');
      store.getState().openFile('/src/c.ts');
      store.getState().closeFile('/src/c.ts');
      expect(store.getState().activeFilePath).toBe('/src/b.ts');
    });

    it('sets activeFilePath to null when closing the last tab', () => {
      store.getState().openFile('/src/a.ts');
      store.getState().closeFile('/src/a.ts');
      expect(store.getState().activeFilePath).toBeNull();
      expect(store.getState().openTabs).toHaveLength(0);
    });

    it('does not change activeFilePath when closing non-active tab', () => {
      store.getState().openFile('/src/a.ts');
      store.getState().openFile('/src/b.ts');
      store.getState().closeFile('/src/a.ts');
      expect(store.getState().activeFilePath).toBe('/src/b.ts');
    });
  });

  describe('setDirty', () => {
    it('updates isDirty on matching tab', () => {
      store.getState().openFile('/src/a.ts');
      store.getState().setDirty('/src/a.ts', true);
      expect(store.getState().openTabs[0]?.isDirty).toBe(true);
    });

    it('sets isDirty back to false', () => {
      store.getState().openFile('/src/a.ts');
      store.getState().setDirty('/src/a.ts', true);
      store.getState().setDirty('/src/a.ts', false);
      expect(store.getState().openTabs[0]?.isDirty).toBe(false);
    });

    it('does not affect other tabs', () => {
      store.getState().openFile('/src/a.ts');
      store.getState().openFile('/src/b.ts');
      store.getState().setDirty('/src/a.ts', true);
      expect(store.getState().openTabs[1]?.isDirty).toBe(false);
    });
  });

  describe('setActiveFile', () => {
    it('sets activeFilePath', () => {
      store.getState().setActiveFile('/src/a.ts');
      expect(store.getState().activeFilePath).toBe('/src/a.ts');
    });

    it('sets activeFilePath to null', () => {
      store.getState().setActiveFile('/src/a.ts');
      store.getState().setActiveFile(null);
      expect(store.getState().activeFilePath).toBeNull();
    });
  });

  describe('reset', () => {
    it('restores all state to initial values', () => {
      store.getState().openFile('/src/a.ts');
      store.getState().toggleDir('/src');
      store.getState().setDirty('/src/a.ts', true);

      store.getState().reset();

      const state = store.getState();
      expect(state.expandedDirs.size).toBe(0);
      expect(state.selectedPath).toBeNull();
      expect(state.openTabs).toEqual([]);
      expect(state.activeFilePath).toBeNull();
    });
  });
});
