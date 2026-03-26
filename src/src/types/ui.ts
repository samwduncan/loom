/**
 * UI types — layout state, modal state, companion, and theme configuration.
 *
 * All types defined here are consumed by the UIStore and UI components.
 */

import type { SettingsTabId } from './settings';

export type TabId = 'chat' | 'files' | 'shell' | 'git';

export type PermissionMode = 'default' | 'plan' | 'bypassPermissions';

export type ModalState =
  | { type: 'settings'; initialTab?: SettingsTabId };

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
  codeFontFamily: string;
}
