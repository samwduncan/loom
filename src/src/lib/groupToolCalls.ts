/**
 * groupToolCalls -- partition tool calls into groups and singles.
 *
 * Historical assistant messages append all tool calls consecutively
 * after text content. This function partitions them into:
 * - Groups (2+ non-error tools) with errors extracted
 * - Singles (standalone tools or demoted from groups)
 *
 * Constitution: Named exports only (2.2).
 */

import type { ToolCallState } from '@/types/stream';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface ToolGroup {
  type: 'group';
  tools: ToolCallState[];
  errors: ToolCallState[];
}

export interface ToolSingle {
  type: 'single';
  tool: ToolCallState;
}

export type ToolPartition = ToolGroup | ToolSingle;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Truncate a string to maxLen, appending ellipsis if truncated.
 * Exported for reuse in permission banner previews.
 */
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}

// ---------------------------------------------------------------------------
// Main algorithm
// ---------------------------------------------------------------------------

/**
 * Partition an array of tool calls into groups and singles.
 *
 * All tool calls from historical messages are consecutive (appended after
 * text content), so a single pass suffices. Error tools are extracted from
 * groups. If extraction leaves fewer than 2 non-error tools, the group
 * is demoted to individual singles.
 */
export function groupToolCalls(toolCalls: ToolCallState[]): ToolPartition[] {
  if (toolCalls.length === 0) return [];
  if (toolCalls.length === 1) {
    return [{ type: 'single', tool: toolCalls[0]! }]; // ASSERT: length === 1 guarantees index 0 exists
  }

  // 2+ tool calls: attempt to group
  const errors = toolCalls.filter((tc) => tc.isError);
  const nonErrors = toolCalls.filter((tc) => !tc.isError);

  if (nonErrors.length >= 2) {
    // Form a group with errors extracted
    return [{ type: 'group', tools: nonErrors, errors }];
  }

  // Not enough non-errors for a group -- demote all to singles
  return toolCalls.map((tc) => ({ type: 'single', tool: tc }));
}
