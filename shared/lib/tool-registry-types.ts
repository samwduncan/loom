/**
 * Tool registry types -- platform-agnostic interfaces for tool configuration.
 *
 * Contains only type definitions and pure data (display names, categories).
 * NO React, NO Lucide, NO component imports.
 *
 * Web and native platforms provide their own component implementations
 * and register them against these interfaces.
 */

import type { ToolCallStatus } from '../types/stream';

/**
 * Props passed to tool card components.
 * Platform-specific renderers implement components matching this shape.
 */
export interface ToolCardProps {
  toolName: string;
  input: Record<string, unknown>;
  output: string | null;
  isError: boolean;
  status: ToolCallStatus;
}

/**
 * Configuration for a registered tool.
 * The `icon` and `renderCard` fields are typed as `unknown` here
 * since they are platform-specific (React.ComponentType on web,
 * different type on native). Each platform narrows these types.
 */
export interface ToolConfig {
  displayName: string;
  icon: unknown;
  getChipLabel: (input: Record<string, unknown>) => string;
  stateColors?: Partial<Record<ToolCallStatus, string>>;
  renderCard: unknown;
}

/**
 * Tool display name map -- human-readable names for known tools.
 */
export const TOOL_DISPLAY_NAMES: Record<string, string> = {
  Bash: 'Bash',
  Read: 'Read',
  Edit: 'Edit',
  Write: 'Write',
  Glob: 'Glob',
  Grep: 'Grep',
};

/**
 * Tool categories for grouping in UI.
 */
export const TOOL_CATEGORIES = {
  readOnly: ['Read', 'Glob', 'Grep', 'WebSearch', 'WebFetch', 'TodoRead'],
  writeExecute: ['Bash', 'Write', 'Edit'],
} as const;

// ---------------------------------------------------------------------------
// Chip label helper functions (platform-agnostic)
// ---------------------------------------------------------------------------

export function truncatePath(path: string, maxLen = 40): string {
  if (path.length <= maxLen) return path;
  return '...' + path.slice(-(maxLen - 3));
}

export function truncateCommand(cmd: string, maxLen = 40): string {
  if (cmd.length <= maxLen) return cmd;
  return cmd.slice(0, maxLen - 3) + '...';
}

export function defaultChipLabel(input: Record<string, unknown>): string {
  const json = JSON.stringify(input);
  if (json.length <= 40) return json;
  return json.slice(0, 37) + '...';
}

export function bashChipLabel(input: Record<string, unknown>): string {
  const cmd = typeof input.command === 'string' ? input.command : null;
  if (!cmd) return 'Bash';
  return truncateCommand(cmd);
}

export function filePathChipLabel(
  fallbackName: string,
  input: Record<string, unknown>,
): string {
  const fp = typeof input.file_path === 'string' ? input.file_path : null;
  if (!fp) return fallbackName;
  return truncatePath(fp);
}

export function patternChipLabel(
  fallbackName: string,
  input: Record<string, unknown>,
): string {
  const pat = typeof input.pattern === 'string' ? input.pattern : null;
  if (!pat) return fallbackName;
  return pat.length > 40 ? pat.slice(0, 37) + '...' : pat;
}
