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
 * Filters out non-chat entry types (progress, system, queue-operation, etc.).
 * Filters out pure tool_result entries (rendered as blank user bubbles otherwise).
 * Merges consecutive entries from the same assistant turn (same message.id)
 * into a single Message to prevent fragmented bubbles.
 *
 * Uses Math.random() for IDs (not crypto.randomUUID -- HTTP dev server safety).
 */
export function transformBackendMessages(entries: BackendEntry[]): Message[] {
  const messages: Message[] = [];

  // Only process displayable entry types (user/assistant/error/system/task_notification)
  const chatEntries = entries.filter((entry) => {
    if (!CHAT_ENTRY_TYPES.has(entry.type)) return false;
    if (!entry.message?.role) return false;
    if (isToolResultEntry(entry)) return false;
    return true;
  });

  for (let i = 0; i < chatEntries.length; i++) {
    const entry = chatEntries[i]!; // ASSERT: bounded by chatEntries.length loop guard
    const role = entry.message!.role; // ASSERT: chatEntries filter guarantees message.role exists

    // For non-chat message types (error, system, task_notification),
    // create simple Message objects with string content only
    if (role !== 'user' && role !== 'assistant') {
      const content = typeof entry.message!.content === 'string' // ASSERT: chatEntries filter guarantees message exists
        ? entry.message!.content // ASSERT: same guard as above
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

    // For assistant messages, merge consecutive entries that share the same
    // message.id (Claude sends text + tool_use as separate JSONL lines
    // within one API response).
    const messageApiId = entry.message?.id;

    if (role === 'assistant' && messageApiId) {
      // Look ahead and merge all entries with the same message.id
      let mergedText = text;
      const mergedToolCalls = [...toolCalls];

      while (i + 1 < chatEntries.length) {
        const next = chatEntries[i + 1]!; // ASSERT: bounded by chatEntries.length loop guard
        const nextApiId = next.message?.id;
        if (next.message?.role !== 'assistant' || nextApiId !== messageApiId) break;

        const nextContent = extractContent(next);
        if (nextContent.text) {
          mergedText += mergedText ? '\n' + nextContent.text : nextContent.text;
        }
        mergedToolCalls.push(...nextContent.toolCalls);
        i++; // Skip merged entry
      }

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

  // Second pass: extract token data from result entries and attach to preceding assistant messages.
  // Walk the original entries array, tracking which built message each chat entry maps to.
  // Merged assistant entries (same message.id) must be counted as one built message.
  let lastAssistantIdx = -1;
  let builtMessageIdx = -1;
  const seenAssistantApiIds = new Set<string>();

  for (const entry of entries) {
    // Track chat entries that produced messages
    if (CHAT_ENTRY_TYPES.has(entry.type) && entry.message?.role) {
      if (isToolResultEntry(entry)) continue;

      const role = entry.message.role;
      // Skip non-displayable entries (same logic as first pass)
      if (role === 'user' && !entry.message.content) continue;
      if (role === 'user' && typeof entry.message.content === 'string' && !entry.message.content.trim()) continue;

      // For assistant entries with same message.id, only count first occurrence
      const apiId = entry.message.id;
      if (role === 'assistant' && apiId && seenAssistantApiIds.has(apiId)) {
        continue; // Merged entry -- already counted
      }
      if (role === 'assistant' && apiId) {
        seenAssistantApiIds.add(apiId);
      }

      builtMessageIdx++;

      if (role === 'assistant') {
        lastAssistantIdx = builtMessageIdx;
      }
    } else if (entry.type === 'result' && lastAssistantIdx >= 0) {
      const msg = messages[lastAssistantIdx];
      if (!msg) continue;

      // Extract cost (always attach if present, even without modelUsage)
      if (entry.total_cost_usd != null) {
        msg.metadata.cost = entry.total_cost_usd;
      }

      // Extract token data from modelUsage (take first model's data)
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
