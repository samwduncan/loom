/**
 * Mobile API client -- instantiated with native auth provider and Tailscale URL resolver.
 *
 * Uses the shared createApiClient factory for deduplication and auth injection.
 * Single instance exported for all hooks and components to use.
 */

import { createApiClient } from '@loom/shared/lib/api-client';
import { nativeAuthProvider } from './auth-provider';
import { resolveApiUrl } from './platform';

export const apiClient = createApiClient({
  auth: nativeAuthProvider,
  resolveUrl: resolveApiUrl,
});
