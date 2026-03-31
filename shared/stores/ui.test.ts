/**
 * UI Store tests -- exercises all actions including sidebar toggle
 * and persist rehydration safety.
 *
 * Uses factory pattern with mock StateStorage.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createUIStore } from '../stores/ui';
import type { ModalState, PermissionMode } from '../types/ui';

// ---------------------------------------------------------------------------
// Mock Storage
// ---------------------------------------------------------------------------

const mockStorage = {
  getItem: (_name: string) => null,
  setItem: (_name: string, _value: string) => {},
  removeItem: (_name: string) => {},
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('createUIStore', () => {
  let store: ReturnType<typeof createUIStore>;

  beforeEach(() => {
    store = createUIStore(mockStorage);
  });

  // -- toggleSidebar --
  it('toggleSidebar flips sidebarOpen', () => {
    expect(store.getState().sidebarOpen).toBe(true);
    store.getState().toggleSidebar();
    expect(store.getState().sidebarOpen).toBe(false);
    store.getState().toggleSidebar();
    expect(store.getState().sidebarOpen).toBe(true);
  });

  it('sidebarOpen drives data-sidebar-state derivation (expanded when true, collapsed-hidden when false)', () => {
    expect(store.getState().sidebarOpen).toBe(true);
    store.getState().toggleSidebar();
    expect(store.getState().sidebarOpen).toBe(false);
    store.getState().toggleSidebar();
    expect(store.getState().sidebarOpen).toBe(true);
  });

  // -- setActiveTab --
  it('setActiveTab sets activeTab to files', () => {
    expect(store.getState().activeTab).toBe('chat');
    store.getState().setActiveTab('files');
    expect(store.getState().activeTab).toBe('files');
  });

  it('setActiveTab sets activeTab to shell', () => {
    store.getState().setActiveTab('shell');
    expect(store.getState().activeTab).toBe('shell');
  });

  it('setActiveTab sets activeTab to git', () => {
    store.getState().setActiveTab('git');
    expect(store.getState().activeTab).toBe('git');
  });

  it('setActiveTab accepts all four TabId values', () => {
    const tabIds = ['chat', 'files', 'shell', 'git'] as const;
    for (const tab of tabIds) {
      store.getState().setActiveTab(tab);
      expect(store.getState().activeTab).toBe(tab);
    }
  });

  // -- openModal / closeModal --
  it('openModal sets modalState', () => {
    const modal: ModalState = { type: 'settings', initialTab: 'appearance' };
    store.getState().openModal(modal);
    expect(store.getState().modalState).toEqual(modal);
  });

  it('closeModal clears modalState', () => {
    const modal: ModalState = { type: 'settings' };
    store.getState().openModal(modal);
    store.getState().closeModal();
    expect(store.getState().modalState).toBeNull();
  });

  // -- toggleCommandPalette --
  it('toggleCommandPalette flips commandPaletteOpen', () => {
    expect(store.getState().commandPaletteOpen).toBe(false);
    store.getState().toggleCommandPalette();
    expect(store.getState().commandPaletteOpen).toBe(true);
    store.getState().toggleCommandPalette();
    expect(store.getState().commandPaletteOpen).toBe(false);
  });

  // -- setTheme --
  it('setTheme merges partial theme updates', () => {
    store.getState().setTheme({ fontSize: 16 });
    expect(store.getState().theme).toEqual({ fontSize: 16, density: 'comfortable', codeFontFamily: 'JetBrains Mono' });

    store.getState().setTheme({ density: 'compact' });
    expect(store.getState().theme).toEqual({ fontSize: 16, density: 'compact', codeFontFamily: 'JetBrains Mono' });
  });

  // -- reset --
  it('reset() restores initial state', () => {
    store.getState().toggleSidebar();
    store.getState().setActiveTab('files');
    store.getState().openModal({ type: 'settings' });
    store.getState().setTheme({ fontSize: 20 });

    store.getState().reset();

    const state = store.getState();
    expect(state.sidebarOpen).toBe(true);
    expect(state.activeTab).toBe('chat');
    expect(state.modalState).toBeNull();
    expect(state.commandPaletteOpen).toBe(false);
    expect(state.companionState).toBeNull();
    expect(state.theme).toEqual({ fontSize: 14, density: 'comfortable', codeFontFamily: 'JetBrains Mono' });
  });

  // -- Default theme --
  it('default theme is { fontSize: 14, density: "comfortable" }', () => {
    expect(store.getState().theme).toEqual({ fontSize: 14, density: 'comfortable', codeFontFamily: 'JetBrains Mono' });
  });

  // -- Initial sidebarOpen --
  it('initial sidebarOpen is true', () => {
    expect(store.getState().sidebarOpen).toBe(true);
  });

  // -- autoExpandTools --
  it('autoExpandTools defaults to false', () => {
    expect(store.getState().autoExpandTools).toBe(false);
  });

  it('toggleAutoExpandTools flips autoExpandTools', () => {
    expect(store.getState().autoExpandTools).toBe(false);
    store.getState().toggleAutoExpandTools();
    expect(store.getState().autoExpandTools).toBe(true);
    store.getState().toggleAutoExpandTools();
    expect(store.getState().autoExpandTools).toBe(false);
  });

  // -- showRawParams --
  it('showRawParams defaults to false', () => {
    expect(store.getState().showRawParams).toBe(false);
  });

  it('toggleShowRawParams flips showRawParams', () => {
    expect(store.getState().showRawParams).toBe(false);
    store.getState().toggleShowRawParams();
    expect(store.getState().showRawParams).toBe(true);
    store.getState().toggleShowRawParams();
    expect(store.getState().showRawParams).toBe(false);
  });

  // -- reset includes new fields --
  it('reset() resets autoExpandTools and showRawParams to false', () => {
    store.getState().toggleAutoExpandTools();
    store.getState().toggleShowRawParams();
    expect(store.getState().autoExpandTools).toBe(true);
    expect(store.getState().showRawParams).toBe(true);

    store.getState().reset();
    expect(store.getState().autoExpandTools).toBe(false);
    expect(store.getState().showRawParams).toBe(false);
  });

  // -- Persist rehydration safety --
  describe('persist rehydration safety', () => {
    it('rehydration with stale localStorage (missing new fields) preserves current defaults', () => {
      const merge = store.persist.getOptions().merge;
      if (!merge) {
        throw new Error('merge function not found on ui store');
      }

      const stalePersistedState = {
        theme: { fontSize: 14, density: 'comfortable', codeFontFamily: 'JetBrains Mono' },
        sidebarOpen: false,
      };

      const currentState = store.getState();
      const merged = merge(stalePersistedState, currentState);

      expect(merged.autoExpandTools).toBe(false);
      expect(merged.showRawParams).toBe(false);
      expect(merged.thinkingExpanded).toBe(true);
      expect(merged.sidebarOpen).toBe(false);
    });

    it('rehydration with theme missing codeFontFamily preserves default font', () => {
      const merge = store.persist.getOptions().merge;
      if (!merge) {
        throw new Error('merge function not found on ui store');
      }

      const stalePersistedState = {
        theme: { fontSize: 16, density: 'compact' },
        sidebarOpen: true,
        thinkingExpanded: true,
        autoExpandTools: false,
        showRawParams: false,
      };

      const currentState = store.getState();
      const merged = merge(stalePersistedState, currentState);

      expect(merged.theme.codeFontFamily).toBe('JetBrains Mono');
      expect(merged.theme.fontSize).toBe(16);
      expect(merged.theme.density).toBe('compact');
    });

    it('partialize output contains only expected keys (no actions, no ephemeral state)', () => {
      const partialize = store.persist.getOptions().partialize;
      if (!partialize) {
        throw new Error('partialize function not found on ui store');
      }

      const output = partialize(store.getState());
      const keys = Object.keys(output).sort();

      expect(keys).toEqual([
        'autoExpandTools',
        'permissionMode',
        'showRawParams',
        'sidebarOpen',
        'theme',
        'thinkingExpanded',
      ]);

      expect(output).not.toHaveProperty('toggleSidebar');
      expect(output).not.toHaveProperty('modalState');
      expect(output).not.toHaveProperty('commandPaletteOpen');
      expect(output).not.toHaveProperty('activeTab');
      expect(output).not.toHaveProperty('companionState');
    });
  });
});
