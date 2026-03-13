/**
 * API response types -- shared contracts between hooks and API client.
 *
 * Constitution §5.4: API response types live in types/.
 */

import type { BackendEntry } from '@/lib/transformMessages';

export interface PaginatedMessagesResponse {
  messages: BackendEntry[];
  total: number;
  hasMore: boolean;
  offset: number;
  limit: number;
}
