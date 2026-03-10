/**
 * UI Store — Layout state, modals, theme, and companion configuration.
 *
 * Expanded from the Phase 3 stub to include full MILESTONES.md schema.
 * Preserves backward-compatible sidebarState and toggleSidebar behavior
 * for AppShell and Sidebar consumers.
 *
 * Uses Persist middleware for theme and sidebar preference only.
 * All modal, command palette, and companion state is ephemeral.
 *
 * Constitution: Selector-only access (4.2), named actions (4.5), no default export (2.2).
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  CompanionState,
  ModalState,
  SidebarState,
  TabId,
  ThemeConfig,
} from '@/types/ui';

interface UIState {
  // Data
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  sidebarState: SidebarState;
  activeTab: TabId;
  modalState: ModalState | null;
  commandPaletteOpen: boolean;
  companionState: CompanionState | null;
  theme: ThemeConfig;
  thinkingExpanded: boolean;

  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setActiveTab: (tab: TabId) => void;
  openModal: (modal: ModalState) => void;
  closeModal: () => void;
  toggleCommandPalette: () => void;
  setTheme: (theme: Partial<ThemeConfig>) => void;
  toggleThinking: () => void;
  reset: () => void;
}

const INITIAL_UI_STATE = {
  sidebarOpen: true,
  sidebarCollapsed: false,
  sidebarState: 'expanded' as SidebarState,
  activeTab: 'chat' as TabId,
  modalState: null as ModalState | null,
  commandPaletteOpen: false,
  companionState: null as CompanionState | null,
  theme: { fontSize: 14, density: 'comfortable' } as ThemeConfig,
  thinkingExpanded: true,
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      ...INITIAL_UI_STATE,

      toggleSidebar: () => {
        set((state) => ({
          sidebarOpen: !state.sidebarOpen,
          sidebarState: !state.sidebarOpen
            ? 'expanded'
            : ('collapsed-hidden' as SidebarState),
        }));
      },

      setSidebarCollapsed: (collapsed: boolean) => {
        set({ sidebarCollapsed: collapsed });
      },

      setActiveTab: (tab: TabId) => {
        set({ activeTab: tab });
      },

      openModal: (modal: ModalState) => {
        set({ modalState: modal });
      },

      closeModal: () => {
        set({ modalState: null });
      },

      toggleCommandPalette: () => {
        set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen }));
      },

      setTheme: (themeUpdate: Partial<ThemeConfig>) => {
        set((state) => ({
          theme: { ...state.theme, ...themeUpdate },
        }));
      },

      toggleThinking: () => {
        set((state) => ({ thinkingExpanded: !state.thinkingExpanded }));
      },

      reset: () => {
        set({ ...INITIAL_UI_STATE });
      },
    }),
    {
      name: 'loom-ui',
      version: 3,
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        thinkingExpanded: state.thinkingExpanded,
      }),
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as Record<string, unknown>;
        if (version < 2) {
          return { ...state, thinkingExpanded: true };
        }
        // v3: TabId changed from 'chat'|'dashboard'|'settings' to 'chat'|'files'|'shell'|'git' — no persisted fields affected
        return state;
      },
    },
  ),
);
