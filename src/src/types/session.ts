/**
 * Session types — conversation containers holding messages and metadata.
 *
 * Sessions are the top-level organizational unit. Messages are nested inside
 * sessions (not normalized) because Immer makes deeply nested mutations
 * readable. The backend API returns sessions with their messages.
 */

import type { Message } from '@/types/message';
import type { ProviderId } from '@/types/provider';

export interface SessionMetadata {
  tokenBudget: number | null;
  contextWindowUsed: number | null;
  totalCost: number | null;
}

export interface Session {
  id: string;
  title: string;
  messages: Message[];
  providerId: ProviderId;
  createdAt: string;
  updatedAt: string;
  metadata: SessionMetadata;
}
