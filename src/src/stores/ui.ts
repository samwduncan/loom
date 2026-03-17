/**
 * UI Store — Layout state, modals, theme, and companion configuration.
 *
 * Uses Persist middleware for theme, sidebar, and thinking preferences.
 * All modal, command palette, and companion state is ephemeral.
 *
 * Sidebar state: `sidebarOpen` is the single source of truth.
 * Consumers needing CSS attribute values derive inline:
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
  autoExpandTools: boolean;
  showRawParams: boolean;

  // Actions
  toggleSidebar: () => void;
  setActiveTab: (tab: TabId) => void;
  openModal: (modal: ModalState) => void;
  closeModal: () => void;
  toggleCommandPalette: () => void;
  setTheme: (theme: Partial<ThemeConfig>) => void;
  toggleThinking: () => void;
  toggleAutoExpandTools: () => void;
  toggleShowRawParams: () => void;
  reset: () => void;
}

const INITIAL_UI_STATE: Omit<UIState, 'toggleSidebar' | 'setActiveTab' | 'openModal' | 'closeModal' | 'toggleCommandPalette' | 'setTheme' | 'toggleThinking' | 'toggleAutoExpandTools' | 'toggleShowRawParams' | 'reset'> = {
  sidebarOpen: true,
  activeTab: 'chat',
  modalState: null,
  commandPaletteOpen: false,
  companionState: null,
  theme: { fontSize: 14, density: 'comfortable', codeFontFamily: 'JetBrains Mono' },
  thinkingExpanded: true,
  autoExpandTools: false,
  showRawParams: false,
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

      toggleAutoExpandTools: () => {
        set((state) => ({ autoExpandTools: !state.autoExpandTools }));
      },

      toggleShowRawParams: () => {
        set((state) => ({ showRawParams: !state.showRawParams }));
      },

      reset: () => {
        set({ ...INITIAL_UI_STATE });
      },
    }),
    {
      name: 'loom-ui',
      version: 6,
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        thinkingExpanded: state.thinkingExpanded,
        autoExpandTools: state.autoExpandTools,
        showRawParams: state.showRawParams,
      }),
      migrate: (persistedState: unknown, version: number) => {
        // ASSERT: persistedState is the partialize output from a previous version
        // Migrations are chained sequentially — no early returns — so all applicable transforms run.
        let s = persistedState as Record<string, unknown>; // ASSERT: partialize output from localStorage
        if (version < 2) {
          s = { ...s, thinkingExpanded: true };
        }
        if (version < 4) {
          // v4: Replaced sidebarCollapsed + sidebarState with sidebarOpen as single source of truth.
          const wasCollapsed = s['sidebarCollapsed'] === true;
          delete s['sidebarCollapsed'];
          s = { ...s, sidebarOpen: !wasCollapsed };
        }
        if (version < 5) {
          // v5: Added codeFontFamily to ThemeConfig.
          const theme = (s['theme'] as Record<string, unknown>) ?? {};
          s = { ...s, theme: { ...theme, codeFontFamily: 'JetBrains Mono' } };
        }
        if (version < 6) {
          // v6: Added quick settings fields.
          s = { ...s, autoExpandTools: false, showRawParams: false };
        }
        return s;
      },
    },
  ),
);
