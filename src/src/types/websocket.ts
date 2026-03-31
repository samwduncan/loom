/**
 * WebSocket message types -- re-export from shared package.
 *
 * Re-exports WsThinkingBlock as ThinkingBlock for backward compatibility
 * with web code that uses the original name.
 */

export {
  type TextBlock,
  type ToolUseBlock,
  type WsThinkingBlock,
  type WsThinkingBlock as ThinkingBlock,
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
} from '@loom/shared/types/websocket';
