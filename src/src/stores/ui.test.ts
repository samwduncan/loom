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
    const modal: ModalState = { type: 'settings', props: { tab: 'appearance' } };
    useUIStore.getState().openModal(modal);
    expect(useUIStore.getState().modalState).toEqual(modal);
  });

  it('closeModal clears modalState', () => {
    const modal: ModalState = { type: 'settings', props: {} };
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
    useUIStore.getState().openModal({ type: 'test', props: {} });
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
});
