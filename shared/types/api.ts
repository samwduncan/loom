/**
 * API response types -- shared contracts between hooks and API client.
 *
 * Constitution S5.4: API response types live in types/.
 */

import type { MessageRole } from './message';

/** Content block types from Claude SDK responses (used in backend entries) */
interface TextBlock {
  type: 'text';
  text: string;
}

interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

type ContentBlock = TextBlock | ToolUseBlock;

/** Per-model token usage data from backend result entries */
interface ModelUsageData {
  input_tokens?: number;
  output_tokens?: number;
  cache_read_input_tokens?: number;
  [key: string]: unknown;
}

/** Raw backend JSONL entry shape -- shared between web and native API clients. */
export interface BackendEntry {
  type: string;
  message?: {
    id?: string;
    role: MessageRole;
    content: string | ContentBlock[];
  };
  sessionId: string;
  timestamp?: string;
  uuid?: string;
  parentUuid?: string | null;
  toolUseResult?: { agentId?: string };
  subagentTools?: unknown[];
  /** Present on type='result' entries -- per-model token usage */
  modelUsage?: Record<string, ModelUsageData>;
  /** Present on type='result' entries -- total cost in USD */
  total_cost_usd?: number;
}

export interface PaginatedMessagesResponse {
  messages: BackendEntry[];
  total: number;
  hasMore: boolean;
  offset: number;
  limit: number;
}
