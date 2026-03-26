/**
 * UI Store tests — exercises all actions including sidebar toggle
 * and AppShell data-sidebar-state derivation.
 *
 * Uses getState()/setState() directly (exempted from no-external-store-mutation ESLint rule).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from './ui';
import type { ModalState } from '@/types/ui';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useUIStore', () => {
  beforeEach(() => {
    useUIStore.getState().reset();
  });

  // -- toggleSidebar --
  it('toggleSidebar flips sidebarOpen', () => {
    expect(useUIStore.getState().sidebarOpen).toBe(true);
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarOpen).toBe(false);
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarOpen).toBe(true);
  });

  it('sidebarOpen drives data-sidebar-state derivation (expanded when true, collapsed-hidden when false)', () => {
    // Consumers derive: sidebarOpen ? 'expanded' : 'collapsed-hidden'
    expect(useUIStore.getState().sidebarOpen).toBe(true); // -> 'expanded'
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarOpen).toBe(false); // -> 'collapsed-hidden'
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarOpen).toBe(true); // -> 'expanded'
  });

  // -- setActiveTab --
  it('setActiveTab sets activeTab to files', () => {
    expect(useUIStore.getState().activeTab).toBe('chat');
    useUIStore.getState().setActiveTab('files');
    expect(useUIStore.getState().activeTab).toBe('files');
  });

  it('setActiveTab sets activeTab to shell', () => {
    useUIStore.getState().setActiveTab('shell');
    expect(useUIStore.getState().activeTab).toBe('shell');
  });

  it('setActiveTab sets activeTab to git', () => {
    useUIStore.getState().setActiveTab('git');
    expect(useUIStore.getState().activeTab).toBe('git');
  });

  it('setActiveTab accepts all four TabId values', () => {
    const tabIds = ['chat', 'files', 'shell', 'git'] as const;
    for (const tab of tabIds) {
      useUIStore.getState().setActiveTab(tab);
      expect(useUIStore.getState().activeTab).toBe(tab);
    }
  });

  // -- openModal / closeModal --
  it('openModal sets modalState', () => {
    const modal: ModalState = { type: 'settings', initialTab: 'appearance' };
    useUIStore.getState().openModal(modal);
    expect(useUIStore.getState().modalState).toEqual(modal);
  });

  it('closeModal clears modalState', () => {
    const modal: ModalState = { type: 'settings' };
    useUIStore.getState().openModal(modal);
    useUIStore.getState().closeModal();
    expect(useUIStore.getState().modalState).toBeNull();
  });

  // -- toggleCommandPalette --
  it('toggleCommandPalette flips commandPaletteOpen', () => {
    expect(useUIStore.getState().commandPaletteOpen).toBe(false);
    useUIStore.getState().toggleCommandPalette();
    expect(useUIStore.getState().commandPaletteOpen).toBe(true);
    useUIStore.getState().toggleCommandPalette();
    expect(useUIStore.getState().commandPaletteOpen).toBe(false);
  });

  // -- setTheme --
  it('setTheme merges partial theme updates', () => {
    useUIStore.getState().setTheme({ fontSize: 16 });
    expect(useUIStore.getState().theme).toEqual({ fontSize: 16, density: 'comfortable', codeFontFamily: 'JetBrains Mono' });

    useUIStore.getState().setTheme({ density: 'compact' });
    expect(useUIStore.getState().theme).toEqual({ fontSize: 16, density: 'compact', codeFontFamily: 'JetBrains Mono' });
  });

  // -- reset --
  it('reset() restores initial state', () => {
    useUIStore.getState().toggleSidebar();
    useUIStore.getState().setActiveTab('files');
    useUIStore.getState().openModal({ type: 'settings' });
    useUIStore.getState().setTheme({ fontSize: 20 });

    useUIStore.getState().reset();

    const state = useUIStore.getState();
    expect(state.sidebarOpen).toBe(true);
    expect(state.activeTab).toBe('chat');
    expect(state.modalState).toBeNull();
    expect(state.commandPaletteOpen).toBe(false);
    expect(state.companionState).toBeNull();
    expect(state.theme).toEqual({ fontSize: 14, density: 'comfortable', codeFontFamily: 'JetBrains Mono' });
  });

  // -- Default theme --
  it('default theme is { fontSize: 14, density: "comfortable" }', () => {
    expect(useUIStore.getState().theme).toEqual({ fontSize: 14, density: 'comfortable', codeFontFamily: 'JetBrains Mono' });
  });

  // -- Initial sidebarOpen --
  it('initial sidebarOpen is true', () => {
    expect(useUIStore.getState().sidebarOpen).toBe(true);
  });

  // -- autoExpandTools --
  it('autoExpandTools defaults to false', () => {
    expect(useUIStore.getState().autoExpandTools).toBe(false);
  });

  it('toggleAutoExpandTools flips autoExpandTools', () => {
    expect(useUIStore.getState().autoExpandTools).toBe(false);
    useUIStore.getState().toggleAutoExpandTools();
    expect(useUIStore.getState().autoExpandTools).toBe(true);
    useUIStore.getState().toggleAutoExpandTools();
    expect(useUIStore.getState().autoExpandTools).toBe(false);
  });

  // -- showRawParams --
  it('showRawParams defaults to false', () => {
    expect(useUIStore.getState().showRawParams).toBe(false);
  });

  it('toggleShowRawParams flips showRawParams', () => {
    expect(useUIStore.getState().showRawParams).toBe(false);
    useUIStore.getState().toggleShowRawParams();
    expect(useUIStore.getState().showRawParams).toBe(true);
    useUIStore.getState().toggleShowRawParams();
    expect(useUIStore.getState().showRawParams).toBe(false);
  });

  // -- reset includes new fields --
  it('reset() resets autoExpandTools and showRawParams to false', () => {
    useUIStore.getState().toggleAutoExpandTools();
    useUIStore.getState().toggleShowRawParams();
    expect(useUIStore.getState().autoExpandTools).toBe(true);
    expect(useUIStore.getState().showRawParams).toBe(true);

    useUIStore.getState().reset();
    expect(useUIStore.getState().autoExpandTools).toBe(false);
    expect(useUIStore.getState().showRawParams).toBe(false);
  });

  // -- Persist rehydration safety --
  describe('persist rehydration safety', () => {
    it('rehydration with stale localStorage (missing new fields) preserves current defaults', () => {
      const merge = useUIStore.persist.getOptions().merge;
      if (!merge) {
        throw new Error('merge function not found on ui store — this is the bug');
      }

      // Simulate stale localStorage that only has theme + sidebarOpen (pre-v6 shape)
      const stalePersistedState = {
        theme: { fontSize: 14, density: 'comfortable', codeFontFamily: 'JetBrains Mono' },
        sidebarOpen: false,
      };

      const currentState = useUIStore.getState();
      const merged = merge(stalePersistedState, currentState);

      // New fields should fall back to currentState defaults, not become undefined
      expect(merged.autoExpandTools).toBe(false);
      expect(merged.showRawParams).toBe(false);
      expect(merged.thinkingExpanded).toBe(true);
      // Persisted field should be applied
      expect(merged.sidebarOpen).toBe(false);
    });

    it('rehydration with theme missing codeFontFamily preserves default font', () => {
      const merge = useUIStore.persist.getOptions().merge;
      if (!merge) {
        throw new Error('merge function not found on ui store — this is the bug');
      }

      // Simulate theme that was saved before codeFontFamily existed
      const stalePersistedState = {
        theme: { fontSize: 16, density: 'compact' },
        sidebarOpen: true,
        thinkingExpanded: true,
        autoExpandTools: false,
        showRawParams: false,
      };

      const currentState = useUIStore.getState();
      const merged = merge(stalePersistedState, currentState);

      // Deep merge should preserve codeFontFamily from currentState defaults
      expect(merged.theme.codeFontFamily).toBe('JetBrains Mono');
      // Persisted theme fields should be applied
      expect(merged.theme.fontSize).toBe(16);
      expect(merged.theme.density).toBe('compact');
    });

    it('partialize output contains only expected keys (no actions, no ephemeral state)', () => {
      const partialize = useUIStore.persist.getOptions().partialize;
      if (!partialize) {
        throw new Error('partialize function not found on ui store');
      }

      const output = partialize(useUIStore.getState());
      const keys = Object.keys(output).sort();

      expect(keys).toEqual([
        'autoExpandTools',
        'permissionMode',
        'showRawParams',
        'sidebarOpen',
        'theme',
        'thinkingExpanded',
      ]);

      // No actions or ephemeral state should leak through
      expect(output).not.toHaveProperty('toggleSidebar');
      expect(output).not.toHaveProperty('modalState');
      expect(output).not.toHaveProperty('commandPaletteOpen');
      expect(output).not.toHaveProperty('activeTab');
      expect(output).not.toHaveProperty('companionState');
    });
  });
});
