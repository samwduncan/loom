/**
 * UI Store — Minimal stub for Phase 3.
 *
 * Manages sidebar open/closed state and derived sidebarState.
 * Phase 4 (STATE-01) will expand this store with the full UIStore schema.
 *
 * Constitution: Selector-only access (4.2), named actions (4.5), no default export (2.2).
 */

import { create } from 'zustand';

type SidebarState = 'expanded' | 'collapsed-hidden';

interface UIState {
  sidebarOpen: boolean;
  sidebarState: SidebarState;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  sidebarState: 'expanded',
  toggleSidebar: () =>
    set((state) => ({
      sidebarOpen: !state.sidebarOpen,
      sidebarState: !state.sidebarOpen ? 'expanded' : 'collapsed-hidden',
    })),
}));
