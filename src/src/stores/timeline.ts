/**
 * Timeline Store -- Web wrapper around shared factory.
 *
 * Provides localStorage-based persistence via StateStorage adapter.
 * Re-exports types for backward compatibility with existing imports.
 *
 * Constitution: Selector-only access (4.2), named actions (4.5), no default export (2.2).
 */

import { createTimelineStore } from '@loom/shared/stores/timeline';
import { localStorageAdapter } from '@/lib/storage-adapter';

export const useTimelineStore = createTimelineStore(localStorageAdapter);

// Re-export types for backward compatibility
export type { TimelineState, TimelineStore } from '@loom/shared/stores/timeline';

// Expose store on window in dev mode for E2E testing (Playwright).
if (import.meta.env.DEV) {
  // ASSERT: dev-only window exposure for E2E testing; tree-shaken in production
  (window as unknown as Record<string, unknown>).__ZUSTAND_TIMELINE_STORE__ = useTimelineStore;
}
