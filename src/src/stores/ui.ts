/**
 * UI Store -- Web wrapper around shared factory.
 *
 * Provides localStorage-based persistence via StateStorage adapter.
 * Re-exports types for backward compatibility with existing imports.
 *
 * Constitution: Selector-only access (4.2), named actions (4.5), no default export (2.2).
 */

import { createUIStore } from '@loom/shared/stores/ui';
import type { StateStorage } from 'zustand/middleware';

const localStorageAdapter: StateStorage = {
  getItem: (name: string) => localStorage.getItem(name),
  setItem: (name: string, value: string) => localStorage.setItem(name, value),
  removeItem: (name: string) => localStorage.removeItem(name),
};

export const useUIStore = createUIStore(localStorageAdapter);

// Re-export types for backward compatibility
export type { UIState, UIStore } from '@loom/shared/stores/ui';
