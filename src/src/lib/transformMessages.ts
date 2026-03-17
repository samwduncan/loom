/**
 * Message transform utilities -- convert backend API shapes to internal types.
 *
 * The backend returns raw JSONL entries with different shapes than the frontend
 * Message and Session types. These pure functions handle the mapping.
 *
 * Constitution: Named exports only (2.2), no default export.
 */

import type { Message, MessageRole, ToolCall } from '@/types/message';
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

/** Entry types that map to displayable messages */
const CHAT_ENTRY_TYPES = new Set<string>([
  'user', 'assistant', 'error', 'system', 'task_notification',
]);

/** Model usage data from a result entry */
interface ModelUsageData {
  inputTokens?: number;
  outputTokens?: number;
  cacheReadInputTokens?: number;
  cacheCreationInputTokens?: number;
  cumulativeInputTokens?: number;
  cumulativeOutputTokens?: number;
}

/** Raw JSONL entry shape from backend API */
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
 * Extract text content and tool calls from a single backend entry.
 */
function extractContent(entry: BackendEntry): { text: string; toolCalls: ToolCall[] } {
  let text = '';
  const toolCalls: ToolCall[] = [];

  if (typeof entry.message?.content === 'string') {
    text = entry.message.content;
  } else if (Array.isArray(entry.message?.content)) {
    for (const block of entry.message!.content) { // ASSERT: guarded by Array.isArray check above
      if (block.type === 'text') {
        text += block.text;
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

  return { text, toolCalls };
}

/**
 * Check if an entry is a tool_result (Claude API sends these as role: 'user'
 * but they aren't real user messages — they're tool output blocks).
 */
function isToolResultEntry(entry: BackendEntry): boolean {
  if (entry.type !== 'user') return false;
  const content = entry.message?.content;
  if (!Array.isArray(content)) return false;
  // If every block is tool_result, this is purely a tool result entry
  return content.length > 0 && content.every(
    (block: ContentBlock | { type: string }) => block.type === 'tool_result',
  );
}

/**
 * Transform raw backend JSONL entries into internal Message types.
 *
 * Single-pass algorithm that:
 * - Filters out non-chat entry types (progress, queue-operation, etc.)
 * - Filters out pure tool_result entries (rendered as blank user bubbles otherwise)
 * - Merges consecutive entries from the same assistant turn (same message.id)
 * - Attaches token usage from result entries to the preceding assistant message
 *
 * Uses Math.random() for IDs (not crypto.randomUUID -- HTTP dev server safety).
 */
export function transformBackendMessages(entries: BackendEntry[]): Message[] {
  const messages: Message[] = [];
  // Track last assistant message index for result entry attribution
  let lastAssistantMsgIdx = -1;
  // Track merged apiIds to skip duplicate entries in the main loop
  const mergedApiIds = new Set<string>();

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]!; // ASSERT: bounded by entries.length loop guard

    // --- Result entries: attach token data to preceding assistant message ---
    if (entry.type === 'result' && lastAssistantMsgIdx >= 0) {
      const msg = messages[lastAssistantMsgIdx];
      if (msg) {
        if (entry.total_cost_usd != null) {
          msg.metadata.cost = entry.total_cost_usd;
        }
        if (entry.modelUsage) {
          const modelKeys = Object.keys(entry.modelUsage);
          if (modelKeys.length > 0) {
            const usage = entry.modelUsage[modelKeys[0]!]; // ASSERT: length check guarantees index 0
            if (usage) {
              msg.metadata.inputTokens = usage.inputTokens ?? usage.cumulativeInputTokens ?? null;
              msg.metadata.outputTokens = usage.outputTokens ?? usage.cumulativeOutputTokens ?? null;
              msg.metadata.cacheReadTokens = usage.cacheReadInputTokens ?? null;
            }
          }
        }
      }
      continue;
    }

    // --- Skip non-chat entries ---
    if (!CHAT_ENTRY_TYPES.has(entry.type)) continue;
    if (!entry.message?.role) continue;
    if (isToolResultEntry(entry)) continue;

    const role = entry.message.role;

    // --- Non-user/assistant types (error, system, task_notification) ---
    if (role !== 'user' && role !== 'assistant') {
      const content = typeof entry.message.content === 'string'
        ? entry.message.content
        : '';
      messages.push({
        id: entry.uuid ?? Math.random().toString(36).slice(2, 10),
        role,
        content,
        metadata: {
          timestamp: entry.timestamp ?? new Date().toISOString(),
          tokenCount: null,
          inputTokens: null,
          outputTokens: null,
          cacheReadTokens: null,
          cost: null,
          duration: null,
        },
        providerContext: {
          providerId: 'claude',
          modelId: '',
          agentName: null,
        },
      });
      continue;
    }

    const { text, toolCalls } = extractContent(entry);
    const messageApiId = entry.message?.id;

    if (role === 'assistant' && messageApiId) {
      // Skip if already merged into a previous message
      if (mergedApiIds.has(messageApiId)) continue;
      mergedApiIds.add(messageApiId);

      // Look ahead and merge all entries with the same message.id
      // (Claude sends text + tool_use as separate JSONL lines within one API response)
      let mergedText = text;
      const mergedToolCalls = [...toolCalls];

      for (let j = i + 1; j < entries.length; j++) {
        const next = entries[j]!; // ASSERT: bounded by entries.length loop guard
        // Skip non-chat entries between same-apiId assistant entries
        if (!CHAT_ENTRY_TYPES.has(next.type)) continue;
        if (next.message?.role !== 'assistant' || next.message?.id !== messageApiId) break;

        const nextContent = extractContent(next);
        if (nextContent.text) {
          mergedText += mergedText ? '\n' + nextContent.text : nextContent.text;
        }
        mergedToolCalls.push(...nextContent.toolCalls);
        mergedApiIds.add(messageApiId);
      }

      lastAssistantMsgIdx = messages.length;
      messages.push({
        id: entry.uuid ?? Math.random().toString(36).slice(2, 10),
        role: 'assistant',
        content: mergedText,
        toolCalls: mergedToolCalls.length > 0 ? mergedToolCalls : undefined,
        metadata: {
          timestamp: entry.timestamp ?? new Date().toISOString(),
          tokenCount: null,
          inputTokens: null,
          outputTokens: null,
          cacheReadTokens: null,
          cost: null,
          duration: null,
        },
        providerContext: {
          providerId: 'claude',
          modelId: '',
          agentName: null,
        },
      });
    } else {
      // User message or assistant without message.id — emit as-is
      // Skip user messages with empty content (system injections, reminders)
      if (role === 'user' && !text.trim()) continue;

      if (role === 'assistant') lastAssistantMsgIdx = messages.length;

      messages.push({
        id: entry.uuid ?? Math.random().toString(36).slice(2, 10),
        role,
        content: text,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        metadata: {
          timestamp: entry.timestamp ?? new Date().toISOString(),
          tokenCount: null,
          inputTokens: null,
          outputTokens: null,
          cacheReadTokens: null,
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
