/**
 * UI Store — Layout state, modals, theme, and companion configuration.
 *
 * Uses Persist middleware for theme, sidebar, and thinking preferences.
 * All modal, command palette, and companion state is ephemeral.
 *
 * Sidebar state: `sidebarOpen` is the single source of truth.
 * Consumers needing `SidebarState` strings should derive inline:
 *   `sidebarOpen ? 'expanded' : 'collapsed-hidden'`
 *
 * Constitution: Selector-only access (4.2), named actions (4.5), no default export (2.2).
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  CompanionState,
  ModalState,
  TabId,
  ThemeConfig,
} from '@/types/ui';

interface UIState {
  // Data
  sidebarOpen: boolean;
  activeTab: TabId;
  modalState: ModalState | null;
  commandPaletteOpen: boolean;
  companionState: CompanionState | null;
  theme: ThemeConfig;
  thinkingExpanded: boolean;

  // Actions
  toggleSidebar: () => void;
  setActiveTab: (tab: TabId) => void;
  openModal: (modal: ModalState) => void;
  closeModal: () => void;
  toggleCommandPalette: () => void;
  setTheme: (theme: Partial<ThemeConfig>) => void;
  toggleThinking: () => void;
  reset: () => void;
}

const INITIAL_UI_STATE: Pick<UIState, 'sidebarOpen' | 'activeTab' | 'modalState' | 'commandPaletteOpen' | 'companionState' | 'theme' | 'thinkingExpanded'> = {
  sidebarOpen: true,
  activeTab: 'chat',
  modalState: null,
  commandPaletteOpen: false,
  companionState: null,
  theme: { fontSize: 14, density: 'comfortable' },
  thinkingExpanded: true,
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      ...INITIAL_UI_STATE,

      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
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
      version: 4,
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        thinkingExpanded: state.thinkingExpanded,
      }),
      migrate: (persistedState: unknown, version: number) => {
        // ASSERT: persistedState is the partialize output from a previous version
        const state = persistedState as Record<string, unknown>;
        if (version < 2) {
          return { ...state, thinkingExpanded: true };
        }
        if (version < 4) {
          // v4: Replaced sidebarCollapsed + sidebarState with sidebarOpen as single source of truth.
          // sidebarCollapsed was persisted; invert it to get sidebarOpen.
          const wasCollapsed = state['sidebarCollapsed'] === true;
          delete state['sidebarCollapsed'];
          return { ...state, sidebarOpen: !wasCollapsed };
        }
        return state;
      },
    },
  ),
);
