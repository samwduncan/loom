/**
 * UI types — layout state, modal state, companion, and theme configuration.
 *
 * SidebarState migrated from the Phase 3 ui store stub. All types defined
 * here are consumed by the UIStore and UI components.
 */

export type SidebarState = 'expanded' | 'collapsed-hidden';

export type TabId = 'chat' | 'dashboard' | 'settings';

export interface ModalState {
  type: string;
  props: Record<string, unknown>;
}

export interface CompanionAnimation {
  state: 'idle' | 'thinking' | 'celebrating' | 'alarmed' | 'sleeping';
  spriteIndex: number;
}

export interface CompanionState {
  isVisible: boolean;
  animation: CompanionAnimation;
}

export interface ThemeConfig {
  fontSize: number;
  density: 'compact' | 'comfortable' | 'spacious';
}
