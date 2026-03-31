/**
 * Stream multiplexer -- pure function message router with callback injection.
 *
 * Routes parsed SDK messages to the correct store actions via callbacks.
 * Zero React imports. Zero store imports. Fully testable with mock callbacks.
 * Platform-agnostic: no DOM APIs, no import.meta.env, no window refs.
 */

import type {
  ServerMessage,
  ClaudeSDKData,
  ClientMessage,
} from '../types/websocket';
import type { ToolCallState } from '../types/stream';
import type { ResultTokens } from '../stores/stream';

// ---------------------------------------------------------------------------
// Callback interface -- injected by websocket-init.ts
// ---------------------------------------------------------------------------

export interface MultiplexerCallbacks {
  onContentToken: (text: string) => void;
  onThinkingBlock: (id: string, text: string, isComplete: boolean) => void;
  onToolUseStart: (toolCall: ToolCallState) => void;
  onToolResult: (
    toolCallId: string,
    output: string,
    isError: boolean,
  ) => void;
  onToolProgress: (
    toolUseId: string,
    toolName: string,
    elapsed: number,
  ) => void;
  onActivityText: (text: string) => void;
  onStreamStart: () => void;
  onStreamEnd: (sessionId: string, exitCode: number) => void;
  onError: (error: string, sessionId: string | null) => void;
  onSessionCreated: (sessionId: string) => void;
  onSessionAborted: (
    sessionId: string,
    provider: string,
    success: boolean,
  ) => void;
  onSessionStatus: (
    sessionId: string,
    provider: string,
    isProcessing: boolean,
  ) => void;
  onActiveSessions: (sessions: {
    claude: string[];
    codex: string[];
    gemini: string[];
  }) => void;
  onTokenBudget: (
    used: number,
    total: number,
    sessionId: string | null,
  ) => void;
  onPermissionRequest: (
    requestId: string,
    toolName: string,
    input: unknown,
    sessionId: string | null,
  ) => void;
  onPermissionCancelled: (requestId: string) => void;
  onResultData: (tokens: ResultTokens, cost: number, modelName?: string) => void;
  onProjectsUpdated: () => void;
  // Live session attach
  onLiveSessionData: (sessionId: string, entries: unknown[]) => void;
  onLiveSessionAttached: (sessionId: string) => void;
  onLiveSessionDetached: (sessionId: string) => void;
}

// ---------------------------------------------------------------------------
// Read-only tool set (auto-allowed silently)
// ---------------------------------------------------------------------------

const READ_ONLY_TOOLS = new Set([
  'Read',
  'Glob',
  'Grep',
  'WebSearch',
  'WebFetch',
  'TodoRead',
]);

// ---------------------------------------------------------------------------
// Tool activity text generation
// ---------------------------------------------------------------------------

/**
 * Strip ANSI escape codes from a string (terminal colors, cursor moves, etc.).
 */
function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
}

/**
 * Generate semantic activity text from a tool name and its input.
 * Input fields may be missing -- handles gracefully with fallback.
 */
export function getToolActivityText(
  toolName: string,
  input: Record<string, unknown>,
): string {
  const filePath =
    typeof input.file_path === 'string' ? input.file_path : undefined;
  const command =
    typeof input.command === 'string' ? stripAnsi(input.command) : undefined;
  const pattern =
    typeof input.pattern === 'string' ? input.pattern : undefined;
  const url = typeof input.url === 'string' ? input.url : undefined;

  switch (toolName) {
    case 'Read':
      return filePath ? `Reading ${filePath}...` : 'Reading...';
    case 'Write':
      return filePath ? `Writing ${filePath}...` : 'Writing...';
    case 'Edit':
      return filePath ? `Editing ${filePath}...` : 'Editing...';
    case 'Bash': {
      if (!command) return 'Running...';
      const truncated =
        command.length > 50 ? command.slice(0, 50) + '...' : command;
      return `Running ${truncated}...`;
    }
    case 'Glob':
      return 'Searching for files...';
    case 'Grep':
      return pattern ? `Searching for ${pattern}...` : 'Searching...';
    case 'WebFetch':
      return url ? `Fetching ${url}...` : 'Fetching...';
    default:
      return `Using ${toolName}...`;
  }
}

// ---------------------------------------------------------------------------
// Claude SDK response routing (data field inside claude-response)
// ---------------------------------------------------------------------------

/**
 * Route a Claude SDK data message to the correct callbacks.
 * Handles assistant (content blocks), result, system, tool_progress, and user.
 */
export function routeClaudeResponse(
  data: ClaudeSDKData,
  sessionId: string | null,
  callbacks: MultiplexerCallbacks,
): void {
  switch (data.type) {
    case 'assistant': {
      for (const block of data.message.content) {
        switch (block.type) {
          case 'text':
            callbacks.onContentToken(block.text);
            break;
          case 'tool_use':
            callbacks.onToolUseStart({
              id: block.id,
              toolName: block.name,
              status: 'invoked',
              input: block.input,
              output: null,
              isError: false,
              startedAt: new Date().toISOString(),
              completedAt: null,
            });
            callbacks.onActivityText(
              getToolActivityText(block.name, block.input),
            );
            break;
          case 'thinking':
            callbacks.onThinkingBlock(
              Math.random().toString(36).slice(2, 10),
              block.thinking,
              true,
            );
            break;
          default:
            console.warn(
              '[Multiplexer] Unknown content block type:',
              block,
            );
        }
      }
      break;
    }
    case 'result': {
      // Extract token usage from modelUsage (keyed by model name)
      const modelUsage = data.modelUsage ?? {};
      const modelKeys = Object.keys(modelUsage);
      const modelName = modelKeys[0]; // e.g. "claude-sonnet-4-6-20250514"
      let inputTokens = 0;
      let outputTokens = 0;
      let cacheReadTokens = 0;

      for (const key of modelKeys) {
        const usage = modelUsage[key] as Record<string, number> | undefined;
        if (usage && typeof usage === 'object') {
          inputTokens += usage.input_tokens ?? 0;
          outputTokens += usage.output_tokens ?? 0;
          cacheReadTokens += usage.cache_read_input_tokens ?? 0;
        }
      }

      const cost = typeof data.total_cost_usd === 'number' ? data.total_cost_usd : 0;
      const tokens: ResultTokens = { input: inputTokens, output: outputTokens };
      if (cacheReadTokens > 0) tokens.cacheRead = cacheReadTokens;

      if (inputTokens > 0 || outputTokens > 0 || cost > 0) {
        callbacks.onResultData(tokens, cost, modelName);
      }

      // Informational -- actual exit code comes from claude-complete
      callbacks.onStreamEnd(sessionId ?? '', 0);
      break;
    }
    case 'system':
      if (data.subtype === 'init') {
        callbacks.onActivityText('Initializing session...');
      }
      break;
    case 'tool_progress':
      callbacks.onToolProgress(
        data.tool_use_id,
        data.tool_name,
        data.elapsed_time_seconds,
      );
      callbacks.onActivityText(getToolActivityText(data.tool_name, {}));
      break;
    case 'user':
      // Replayed user messages -- not routed
      break;
    default:
      console.warn('[Multiplexer] Unknown SDK message type:', data);
  }
}

// ---------------------------------------------------------------------------
// Server message routing (top-level WebSocket message dispatch)
// ---------------------------------------------------------------------------

/**
 * Route a server message to the correct callbacks.
 * Handles all ServerMessage types from the discriminated union.
 */
export function routeServerMessage(
  msg: ServerMessage,
  callbacks: MultiplexerCallbacks,
  sendFn: (msg: ClientMessage) => boolean,
): void {
  switch (msg.type) {
    case 'claude-response':
      routeClaudeResponse(msg.data, msg.sessionId, callbacks);
      break;
    case 'claude-complete':
      callbacks.onStreamEnd(msg.sessionId, msg.exitCode);
      break;
    case 'claude-error':
      callbacks.onError(msg.error, msg.sessionId);
      break;
    case 'claude-permission-request':
      if (READ_ONLY_TOOLS.has(msg.toolName)) {
        // Auto-allow read-only tools silently
        sendFn({
          type: 'claude-permission-response',
          requestId: msg.requestId,
          allow: true,
        });
      } else {
        // Route write/execute tools to UI for user approval
        callbacks.onPermissionRequest(
          msg.requestId,
          msg.toolName,
          msg.input,
          msg.sessionId,
        );
      }
      break;
    case 'claude-permission-cancelled':
      callbacks.onPermissionCancelled(msg.requestId);
      break;
    case 'session-created':
      callbacks.onSessionCreated(msg.sessionId);
      break;
    case 'session-aborted':
      callbacks.onSessionAborted(
        msg.sessionId,
        msg.provider,
        msg.success,
      );
      break;
    case 'session-status':
      callbacks.onSessionStatus(
        msg.sessionId,
        msg.provider,
        msg.isProcessing,
      );
      break;
    case 'active-sessions':
      callbacks.onActiveSessions(msg.sessions);
      break;
    case 'token-budget':
      callbacks.onTokenBudget(
        msg.data.used,
        msg.data.total,
        msg.sessionId,
      );
      break;
    case 'projects_updated':
      callbacks.onProjectsUpdated();
      break;
    case 'loading_progress':
      // No-op in M1
      break;
    case 'error':
      callbacks.onError(msg.error, null);
      break;
    case 'codex-response':
    case 'codex-complete':
    case 'codex-error':
      console.log('[Multiplexer] Codex message (M4):', msg.type);
      break;
    case 'gemini-response':
    case 'gemini-complete':
    case 'gemini-error':
      console.log('[Multiplexer] Gemini message (M4):', msg.type);
      break;
    // Live session attach
    case 'live-session-data':
      callbacks.onLiveSessionData(msg.sessionId, msg.entries);
      break;
    case 'live-session-attached':
      callbacks.onLiveSessionAttached(msg.sessionId);
      break;
    case 'live-session-detached':
      callbacks.onLiveSessionDetached(msg.sessionId);
      break;
  }
}
