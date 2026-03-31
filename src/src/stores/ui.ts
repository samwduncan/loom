/**
 * UI Store -- Web wrapper around shared factory.
 *
 * Provides localStorage-based persistence via StateStorage adapter.
 * Re-exports types for backward compatibility with existing imports.
 *
 * Constitution: Selector-only access (4.2), named actions (4.5), no default export (2.2).
 */

import { createUIStore } from '@loom/shared/stores/ui';
import { localStorageAdapter } from '@/lib/storage-adapter';

export const useUIStore = createUIStore(localStorageAdapter);

// Re-export types for backward compatibility
export type { UIState, UIStore } from '@loom/shared/stores/ui';
