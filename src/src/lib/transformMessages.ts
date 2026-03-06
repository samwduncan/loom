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

  // Only process actual chat entries (user/assistant with message content)
  const chatEntries = entries.filter((entry) => {
    if (entry.type !== 'user' && entry.type !== 'assistant') return false;
    if (!entry.message?.role) return false;
    if (isToolResultEntry(entry)) return false;
    return true;
  });

  for (let i = 0; i < chatEntries.length; i++) {
    const entry = chatEntries[i]!; // ASSERT: bounded by chatEntries.length loop guard
    const { text, toolCalls } = extractContent(entry);
    const role = entry.message!.role; // ASSERT: chatEntries filter guarantees message.role exists

    // For assistant messages, merge consecutive entries that share the same
    // message.id (Claude sends text + tool_use as separate JSONL lines
    // within one API response).
    const messageApiId = (entry.message as { id?: string })?.id;

    if (role === 'assistant' && messageApiId) {
      // Look ahead and merge all entries with the same message.id
      let mergedText = text;
      const mergedToolCalls = [...toolCalls];

      while (i + 1 < chatEntries.length) {
        const next = chatEntries[i + 1]!; // ASSERT: bounded by chatEntries.length loop guard
        const nextApiId = (next.message as { id?: string })?.id;
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
