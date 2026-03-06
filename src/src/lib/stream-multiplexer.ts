/**
 * Stream multiplexer -- pure function message router with callback injection.
 *
 * Routes parsed SDK messages to the correct store actions via callbacks.
 * Zero React imports. Zero store imports. Fully testable with mock callbacks.
 *
 * Constitution: Named exports only (2.2), no default export, no React deps.
 */

import type {
  ServerMessage,
  ClaudeSDKData,
  ClientMessage,
} from '@/types/websocket';
import type { ToolCallState } from '@/types/stream';

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
    typeof input.command === 'string' ? input.command : undefined;
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
              crypto.randomUUID(),
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
    case 'result':
      // Informational -- actual exit code comes from claude-complete
      callbacks.onStreamEnd(sessionId ?? '', 0);
      break;
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
      // Auto-allow all permissions in M1
      if (!READ_ONLY_TOOLS.has(msg.toolName)) {
        console.warn(
          '[Loom] Auto-allowing write/execute tool:',
          msg.toolName,
        );
      }
      sendFn({
        type: 'claude-permission-response',
        requestId: msg.requestId,
        allow: true,
      });
      callbacks.onPermissionRequest(
        msg.requestId,
        msg.toolName,
        msg.input,
        msg.sessionId,
      );
      break;
    case 'claude-permission-cancelled':
      // No-op in M1
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
      // No-op in M1
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
  }
}
