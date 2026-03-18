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
  /** Message count from backend -- used for junk session detection. */
  messageCount?: number | null;
}

/** Date bucket labels for session grouping within a project. */
export type SessionDateGroup = 'Pinned' | 'Today' | 'Yesterday' | 'This Week' | 'This Month' | 'Older';

export interface ProjectSessionGroup {
  label: SessionDateGroup;
  sessions: Session[];
}

export interface ProjectGroup {
  projectName: string;        // encoded name for API calls
  displayName: string;        // human-readable
  projectPath: string;        // filesystem path
  sessionCount: number;       // total sessions (including junk, for accurate count)
  visibleCount: number;       // sessions after junk filtering
  dateGroups: ProjectSessionGroup[];
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
