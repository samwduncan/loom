/**
 * Message transform utilities -- convert backend API shapes to internal types.
 *
 * The backend returns raw JSONL entries with different shapes than the frontend
 * Message and Session types. These pure functions handle the mapping.
 *
 * Constitution: Named exports only (2.2), no default export.
 */

import type { Message, ToolCall } from '@/types/message';
import type { Session } from '@/types/session';

/** Content block types from Claude SDK responses */
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

/** Raw JSONL entry shape from backend API */
export interface BackendEntry {
  type: string;
  message?: {
    role: 'user' | 'assistant';
    content: string | ContentBlock[];
  };
  sessionId: string;
  timestamp?: string;
  uuid?: string;
  parentUuid?: string | null;
  toolUseResult?: { agentId?: string };
  subagentTools?: unknown[];
}

/** Backend session shape from GET /api/projects/:name/sessions */
export interface BackendSessionData {
  id: string;
  summary: string;
  messageCount: number;
  lastActivity: string;
  cwd: string;
  lastUserMessage?: string;
  lastAssistantMessage?: string;
}

/**
 * Transform raw backend JSONL entries into internal Message types.
 * Handles both string content and content block arrays (text + tool_use).
 * Uses Math.random() for IDs (not crypto.randomUUID -- HTTP dev server safety).
 */
export function transformBackendMessages(entries: BackendEntry[]): Message[] {
  const messages: Message[] = [];

  for (const entry of entries) {
    if (!entry.message?.role) continue;

    let content = '';
    const toolCalls: ToolCall[] = [];

    if (typeof entry.message.content === 'string') {
      content = entry.message.content;
    } else if (Array.isArray(entry.message.content)) {
      for (const block of entry.message.content) {
        if (block.type === 'text') {
          content += block.text;
        } else if (block.type === 'tool_use') {
          toolCalls.push({
            id: block.id,
            toolName: block.name,
            input: block.input,
            output: null,
            isError: false,
            parentToolUseId: null,
          });
        }
      }
    }

    messages.push({
      id: entry.uuid ?? Math.random().toString(36).slice(2, 10),
      role: entry.message.role,
      content,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      metadata: {
        timestamp: entry.timestamp ?? new Date().toISOString(),
        tokenCount: null,
        cost: null,
        duration: null,
      },
      providerContext: {
        providerId: 'claude',
        modelId: '',
        agentName: null,
      },
    });
  }

  return messages;
}

/**
 * Transform a backend session shape into an internal Session type.
 * Maps summary -> title, lastActivity -> updatedAt, defaults providerId to 'claude'.
 */
export function transformBackendSession(backend: BackendSessionData): Session {
  return {
    id: backend.id,
    title: backend.summary || 'New Chat',
    messages: [],
    providerId: 'claude',
    createdAt: backend.lastActivity,
    updatedAt: backend.lastActivity,
    metadata: {
      tokenBudget: null,
      contextWindowUsed: null,
      totalCost: null,
    },
  };
}
