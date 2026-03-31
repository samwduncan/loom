/**
 * Stream types -- ephemeral streaming state for active tool calls and thinking.
 *
 * These types are consumed by the StreamStore. Stream state is never persisted;
 * it resets on page reload and when streaming ends.
 */

import type { ThinkingBlock } from './message';

export type ToolCallStatus = 'invoked' | 'executing' | 'resolved' | 'rejected';

export interface ToolCallState {
  id: string;
  toolName: string;
  status: ToolCallStatus;
  input: Record<string, unknown>;
  output: string | null;
  isError: boolean;
  startedAt: string;
  completedAt: string | null;
}

export interface ThinkingState {
  isThinking: boolean;
  blocks: ThinkingBlock[];
}
