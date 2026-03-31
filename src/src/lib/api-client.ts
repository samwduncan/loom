/**
 * API Client -- Web wrapper around shared factory.
 *
 * Injects web-specific dependencies: webAuthProvider, resolveApiUrl, refreshAuth.
 * Re-exports the same API surface so no consumer code needs changes.
 *
 * Constitution: Named exports only (2.2), no default export.
 */

import { createApiClient } from '@loom/shared/lib/api-client';
import { webAuthProvider, refreshAuth } from '@/lib/auth';
import { resolveApiUrl } from '@/lib/platform';

const client = createApiClient({
  auth: webAuthProvider,
  resolveUrl: resolveApiUrl,
  onAuthRefresh: refreshAuth,
});

export const { apiFetch, clearInflightRequests } = client;
