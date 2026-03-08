/**
 * Message types — the core data contract for chat messages across all milestones.
 *
 * Every message carries metadata (timestamps, costs) and providerContext
 * (which agent produced it). These fields exist from M1 even when populated
 * with defaults/nulls.
 */

import type { ProviderContext } from '@/types/provider';

export type MessageRole =
  | 'user'
  | 'assistant'
  | 'system'
  | 'error'
  | 'task_notification';

export interface MessageMetadata {
  timestamp: string;
  tokenCount: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  cacheReadTokens: number | null;
  cost: number | null;
  duration: number | null;
  /** True when message was sent during active streaming (queued for processing) */
  queued?: boolean;
}

export interface ThinkingBlock {
  id: string;
  text: string;
  isComplete: boolean;
}

export interface ToolCall {
  id: string;
  toolName: string;
  input: Record<string, unknown>;
  output: string | null;
  isError: boolean;
  parentToolUseId: string | null;
}

export interface ImageAttachment {
  id: string;
  url: string;
  name: string;
  width?: number;
  height?: number;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  toolCalls?: ToolCall[];
  thinkingBlocks?: ThinkingBlock[];
  attachments?: ImageAttachment[];
  metadata: MessageMetadata;
  providerContext: ProviderContext;
}
