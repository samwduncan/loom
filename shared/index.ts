// Types
export * from './types/api';
export * from './types/file';
export * from './types/git';
export * from './types/mention';
export * from './types/message';
export * from './types/provider';
export * from './types/session';
export * from './types/settings';
export * from './types/shell';
export * from './types/slash-command';
export * from './types/stream';
export * from './types/ui';
// websocket.ts has a ThinkingBlock name collision with message.ts --
// re-exported as WsThinkingBlock to disambiguate
export {
  type TextBlock,
  type ToolUseBlock,
  type WsThinkingBlock,
  type ContentBlock,
  type SDKAssistantMessage,
  type SDKResultMessage,
  type SDKSystemMessage,
  type SDKToolProgressMessage,
  type SDKUserMessage,
  type ClaudeSDKData,
  type CodexItemMessage,
  type CodexRawEvent,
  type CodexSDKData,
  type GeminiMessageData,
  type GeminiSDKData,
  type ServerMessage,
  type ClaudeCommandOptions,
  type CodexCommandOptions,
  type GeminiCommandOptions,
  type ClientMessage,
  isServerMessage,
} from './types/websocket';

// Store factories
export { createTimelineStore } from './stores/timeline';
export type { TimelineState, TimelineStore } from './stores/timeline';
export { createStreamStore } from './stores/stream';
export type { StreamState, StreamStore, PermissionRequest, ResultTokens } from './stores/stream';
export { createConnectionStore } from './stores/connection';
export type { ConnectionState, ConnectionStore } from './stores/connection';
export { createUIStore } from './stores/ui';
export type { UIState, UIStore } from './stores/ui';
export { createFileStore } from './stores/file';

// Lib -- Auth
export type { AuthProvider } from './lib/auth';

// Lib -- API client
export { createApiClient } from './lib/api-client';
export type { ApiClientOptions, ApiClient } from './lib/api-client';

// Lib -- WebSocket client
export { WebSocketClient } from './lib/websocket-client';
export type { WsConnectionState, WebSocketClientOptions } from './lib/websocket-client';

// Lib -- Stream multiplexer
export {
  routeClaudeResponse,
  routeServerMessage,
  getToolActivityText,
} from './lib/stream-multiplexer';
export type { MultiplexerCallbacks } from './lib/stream-multiplexer';

// Lib -- Tool registry types
export type { ToolCardProps, ToolConfig } from './lib/tool-registry-types';
export {
  TOOL_DISPLAY_NAMES,
  TOOL_CATEGORIES,
  truncatePath,
  truncateCommand,
  defaultChipLabel,
  bashChipLabel,
  filePathChipLabel,
  patternChipLabel,
} from './lib/tool-registry-types';
