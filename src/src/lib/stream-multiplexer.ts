/**
 * Stream multiplexer -- re-export from shared package.
 *
 * The stream multiplexer is platform-agnostic (callback-based, zero DOM deps).
 * This file re-exports everything from @loom/shared for backward compatibility.
 *
 * Constitution: Named exports only (2.2), no default export, no React deps.
 */

export {
  routeClaudeResponse,
  routeServerMessage,
  getToolActivityText,
} from '@loom/shared/lib/stream-multiplexer';

export type { MultiplexerCallbacks } from '@loom/shared/lib/stream-multiplexer';
