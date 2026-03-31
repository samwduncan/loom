/**
 * UI Store Factory -- Layout state, modals, theme, and companion configuration.
 *
 * Uses Persist middleware for theme, sidebar, and thinking preferences.
 * All modal, command palette, and companion state is ephemeral.
 *
 * Sidebar state: `sidebarOpen` is the single source of truth.
 * Consumers needing CSS attribute values derive inline:
 *   `sidebarOpen ? 'expanded' : 'collapsed-hidden'`
 *
 * Factory pattern: accepts StateStorage adapter for cross-platform persistence.
 */

import { create } from 'zustand';
import { persist, type StateStorage, createJSONStorage } from 'zustand/middleware';
import type {
  CompanionState,
  ModalState,
  PermissionMode,
  TabId,
  ThemeConfig,
} from '../types/ui';

export interface UIState {
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
  permissionMode: PermissionMode;

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
  setPermissionMode: (mode: PermissionMode) => void;
  reset: () => void;
}

const INITIAL_UI_STATE: Omit<UIState, 'toggleSidebar' | 'setActiveTab' | 'openModal' | 'closeModal' | 'toggleCommandPalette' | 'setTheme' | 'toggleThinking' | 'toggleAutoExpandTools' | 'toggleShowRawParams' | 'setPermissionMode' | 'reset'> = {
  sidebarOpen: true,
  activeTab: 'chat',
  modalState: null,
  commandPaletteOpen: false,
  companionState: null,
  theme: { fontSize: 14, density: 'comfortable', codeFontFamily: 'JetBrains Mono' },
  thinkingExpanded: true,
  autoExpandTools: false,
  showRawParams: false,
  permissionMode: 'default' as PermissionMode,
};

export function createUIStore(storage: StateStorage) {
  return create<UIState>()(
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

        setPermissionMode: (mode: PermissionMode) => {
          set({ permissionMode: mode });
        },

        reset: () => {
          set({ ...INITIAL_UI_STATE });
        },
      }),
      {
        name: 'loom-ui',
        version: 7,
        storage: createJSONStorage(() => storage),
        partialize: (state) => ({
          theme: state.theme,
          sidebarOpen: state.sidebarOpen,
          thinkingExpanded: state.thinkingExpanded,
          autoExpandTools: state.autoExpandTools,
          showRawParams: state.showRawParams,
          permissionMode: state.permissionMode,
        }),
        merge: (persistedState, currentState) => {
          const persisted = persistedState as Partial<{
            theme: Partial<typeof currentState.theme>;
            sidebarOpen: boolean;
            thinkingExpanded: boolean;
            autoExpandTools: boolean;
            showRawParams: boolean;
            permissionMode: PermissionMode;
          }>;
          return {
            ...currentState,
            sidebarOpen: persisted.sidebarOpen ?? currentState.sidebarOpen,
            thinkingExpanded: persisted.thinkingExpanded ?? currentState.thinkingExpanded,
            autoExpandTools: persisted.autoExpandTools ?? currentState.autoExpandTools,
            showRawParams: persisted.showRawParams ?? currentState.showRawParams,
            permissionMode: persisted.permissionMode ?? currentState.permissionMode,
            theme: {
              ...currentState.theme,
              ...(persisted.theme ?? {}),
            },
          };
        },
        migrate: (persistedState: unknown, version: number) => {
          // ASSERT: persistedState is the partialize output from a previous version
          // Migrations are chained sequentially -- no early returns -- so all applicable transforms run.
          let s = persistedState as Record<string, unknown>;
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
          if (version < 7) {
            // v7: Added permissionMode preference.
            s = { ...s, permissionMode: 'default' };
          }
          return s;
        },
      },
    ),
  );
}

export type UIStore = ReturnType<typeof createUIStore>;
