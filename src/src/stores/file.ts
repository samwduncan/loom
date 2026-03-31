/**
 * File Store -- Web wrapper around shared factory.
 *
 * Ephemeral store (no persistence, file state is per-session).
 *
 * Constitution: Selector-only access (4.2), named actions (4.5), no default export (2.2).
 */

import { createFileStore } from '@loom/shared/stores/file';

export const useFileStore = createFileStore();
