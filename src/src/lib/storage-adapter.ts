/**
 * Web localStorage adapter for Zustand persist middleware.
 * Single source of truth -- imported by all persisted store wrappers.
 */

import type { StateStorage } from 'zustand/middleware';

export const localStorageAdapter: StateStorage = {
  getItem: (name: string) => localStorage.getItem(name),
  setItem: (name: string, value: string) => localStorage.setItem(name, value),
  removeItem: (name: string) => localStorage.removeItem(name),
};
