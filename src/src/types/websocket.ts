/**
 * WebSocket message types — discriminated unions for all server/client messages.
 *
 * Covers the full CloudCLI backend WebSocket protocol (BACKEND_API_CONTRACT.md).
 * ServerMessage covers 17+ backend message types. ClientMessage covers 7 client
 * message types. ClaudeSDKData covers the data field inside claude-response.
 *
 * Constitution: Named exports only (2.2), no default export.
 */

// ---------------------------------------------------------------------------
// Content blocks inside Claude SDK assistant messages
// ---------------------------------------------------------------------------

export interface TextBlock {
  type: 'text';
  text: string;
}

export interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ThinkingBlock {
  type: 'thinking';
  thinking: string;
}

export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock;

// ---------------------------------------------------------------------------
// Claude SDK message subtypes (data field in claude-response)
// ---------------------------------------------------------------------------

export interface SDKAssistantMessage {
  type: 'assistant';
  message: {
    content: ContentBlock[];
    usage?: {
      input_tokens: number;
      output_tokens: number;
    };
  };
  parentToolUseId?: string | null;
  session_id: string;
}

export interface SDKResultMessage {
  type: 'result';
  subtype: string;
  modelUsage: Record<string, unknown>;
  total_cost_usd: number;
  session_id: string;
}

export interface SDKSystemMessage {
  type: 'system';
  subtype: string;
  tools?: string[];
  cwd?: string;
  session_id: string;
}

export interface SDKToolProgressMessage {
  type: 'tool_progress';
  tool_use_id: string;
  tool_name: string;
  elapsed_time_seconds: number;
  session_id: string;
}

export interface SDKUserMessage {
  type: 'user';
  message: unknown;
  session_id: string;
}

export type ClaudeSDKData =
  | SDKAssistantMessage
  | SDKResultMessage
  | SDKSystemMessage
  | SDKToolProgressMessage
  | SDKUserMessage;

// ---------------------------------------------------------------------------
// Codex SDK data types (M4 — typed from backend source)
// ---------------------------------------------------------------------------

export interface CodexItemMessage {
  type: 'item';
  itemType: 'agent_message' | 'reasoning' | 'command_execution' | 'file_change' | 'mcp_tool_call' | 'web_search' | 'todo_list' | 'error';
  message?: { role: string; content: string; isReasoning?: boolean };
  command?: string;
  output?: string;
  exitCode?: number;
  status?: string;
  changes?: unknown[];
  server?: string;
  tool?: string;
  arguments?: Record<string, unknown>;
  result?: unknown;
  error?: string;
  query?: string;
  items?: unknown[];
}

export interface CodexRawEvent {
  type: string;
  item?: unknown;
}

export type CodexSDKData = CodexItemMessage | CodexRawEvent;

// ---------------------------------------------------------------------------
// Gemini SDK data types (M4 — typed from backend source)
// ---------------------------------------------------------------------------

export interface GeminiMessageData {
  type: 'message';
  content: string;
  isPartial?: boolean;
}

export type GeminiSDKData = GeminiMessageData;

// ---------------------------------------------------------------------------
// Server -> Client messages (discriminated union)
// ---------------------------------------------------------------------------

export type ServerMessage =
  // Claude streaming
  | { type: 'claude-response'; data: ClaudeSDKData; sessionId: string | null }
  | { type: 'claude-complete'; sessionId: string; exitCode: number; isNewSession: boolean }
  | { type: 'claude-error'; error: string; sessionId: string | null }
  // Claude permissions
  | { type: 'claude-permission-request'; requestId: string; toolName: string; input: unknown; sessionId: string | null }
  | { type: 'claude-permission-cancelled'; requestId: string; reason: 'timeout' | 'cancelled'; sessionId: string | null }
  // Session lifecycle
  | { type: 'session-created'; sessionId: string }
  | { type: 'session-aborted'; sessionId: string; provider: string; success: boolean }
  | { type: 'session-status'; sessionId: string; provider: string; isProcessing: boolean }
  | { type: 'active-sessions'; sessions: { claude: string[]; codex: string[]; gemini: string[] } }
  // Token budget
  | { type: 'token-budget'; data: { used: number; total: number }; sessionId: string | null }
  // Project updates
  | { type: 'projects_updated'; projects: unknown[]; timestamp: string; changeType: string; changedFile: string; watchProvider: string }
  // Loading
  | { type: 'loading_progress'; [key: string]: unknown }
  // Generic error
  | { type: 'error'; error: string }
  // Codex (M4 — types locked from backend source)
  | { type: 'codex-response'; data: CodexSDKData; sessionId: string | null }
  | { type: 'codex-complete'; sessionId: string }
  | { type: 'codex-error'; error: string; sessionId: string | null }
  // Gemini (M4 — types locked from backend source)
  | { type: 'gemini-response'; data: GeminiSDKData; sessionId: string | null }
  | { type: 'gemini-complete'; sessionId: string }
  | { type: 'gemini-error'; error: string; sessionId: string | null };

// ---------------------------------------------------------------------------
// Client -> Server messages (discriminated union)
// ---------------------------------------------------------------------------

export interface ClaudeCommandOptions {
  projectPath?: string;
  sessionId?: string;
  cwd?: string;
  model?: string;
  permissionMode?: string;
  toolsSettings?: {
    allowedTools: string[];
    disallowedTools: string[];
    skipPermissions: boolean;
  };
  images?: Array<{ data: string }>;
}

export interface CodexCommandOptions {
  projectPath?: string;
  cwd?: string;
  sessionId?: string;
  model?: string;
}

export interface GeminiCommandOptions {
  projectPath?: string;
  cwd?: string;
  sessionId?: string;
  model?: string;
}

export type ClientMessage =
  | { type: 'claude-command'; command: string; options: ClaudeCommandOptions }
  | { type: 'codex-command'; command: string; options: CodexCommandOptions }
  | { type: 'gemini-command'; command: string; options: GeminiCommandOptions }
  | { type: 'abort-session'; sessionId: string; provider?: 'claude' | 'codex' | 'gemini' }
  | { type: 'claude-permission-response'; requestId: string; allow: boolean; updatedInput?: unknown; message?: string; rememberEntry?: string }
  | { type: 'check-session-status'; sessionId: string; provider?: 'claude' | 'codex' | 'gemini' }
  | { type: 'get-active-sessions' };

// ---------------------------------------------------------------------------
// Type guard
// ---------------------------------------------------------------------------

export function isServerMessage(msg: unknown): msg is ServerMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    typeof (msg as Record<string, unknown>).type === 'string'
  );
}
