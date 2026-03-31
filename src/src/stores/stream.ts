/**
 * Stream Store -- Web wrapper around shared factory.
 *
 * Ephemeral store (no persistence). Re-exports types consumed by
 * components and lib modules for backward compatibility.
 *
 * Constitution: Selector-only access (4.2), named actions (4.5), no default export (2.2).
 */

import { createStreamStore } from '@loom/shared/stores/stream';

export const useStreamStore = createStreamStore();

// Re-export types for backward compatibility (used by stream-multiplexer, PermissionBanner, etc.)
export type { PermissionRequest, ResultTokens, StreamState, StreamStore } from '@loom/shared/stores/stream';

// Expose store on window in dev mode for E2E testing (Playwright).
// Tree-shaken in production builds.
if (import.meta.env.DEV) {
  // ASSERT: dev-only window exposure for E2E testing; tree-shaken in production
  (window as unknown as Record<string, unknown>).__ZUSTAND_STREAM_STORE__ = useStreamStore;
}
