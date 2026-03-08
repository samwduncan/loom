/**
 * groupToolCalls -- unit tests for tool call partitioning algorithm.
 */

import { describe, it, expect } from 'vitest';
import { groupToolCalls } from './groupToolCalls';
import type { ToolCallState } from '@/types/stream';

function makeTool(overrides: Partial<ToolCallState> = {}): ToolCallState {
  return {
    id: Math.random().toString(36).slice(2, 10),
    toolName: 'Read',
    status: 'resolved',
    input: { file_path: '/test.ts' },
    output: 'ok',
    isError: false,
    startedAt: '2026-01-01T00:00:00Z',
    completedAt: '2026-01-01T00:00:01Z',
    ...overrides,
  };
}

describe('groupToolCalls', () => {
  it('returns empty array for empty input', () => {
    expect(groupToolCalls([])).toEqual([]);
  });

  it('returns single partition for 1 tool call', () => {
    const A = makeTool({ id: 'a' });
    const result = groupToolCalls([A]);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ type: 'single', tool: A });
  });

  it('returns group partition for 2+ tool calls', () => {
    const A = makeTool({ id: 'a' });
    const B = makeTool({ id: 'b', toolName: 'Edit' });
    const result = groupToolCalls([A, B]);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: 'group',
      tools: [A, B],
      errors: [],
    });
  });

  it('extracts error tool calls from group', () => {
    const A = makeTool({ id: 'a' });
    const B = makeTool({ id: 'b', isError: true, status: 'rejected' });
    const C = makeTool({ id: 'c' });
    const result = groupToolCalls([A, B, C]);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: 'group',
      tools: [A, C],
      errors: [B],
    });
  });

  it('demotes to singles when only 1 non-error after extraction', () => {
    const A = makeTool({ id: 'a' });
    const B = makeTool({ id: 'b', isError: true, status: 'rejected' });
    const result = groupToolCalls([A, B]);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ type: 'single', tool: A });
    expect(result[1]).toEqual({ type: 'single', tool: B });
  });

  it('handles all-error tool calls as singles', () => {
    const A = makeTool({ id: 'a', isError: true, status: 'rejected' });
    const B = makeTool({ id: 'b', isError: true, status: 'rejected' });
    const result = groupToolCalls([A, B]);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ type: 'single', tool: A });
    expect(result[1]).toEqual({ type: 'single', tool: B });
  });

  it('groups many tool calls with mixed types', () => {
    const tools = [
      makeTool({ id: 'a', toolName: 'Read' }),
      makeTool({ id: 'b', toolName: 'Read' }),
      makeTool({ id: 'c', toolName: 'Read' }),
      makeTool({ id: 'd', toolName: 'Edit' }),
      makeTool({ id: 'e', toolName: 'Bash' }),
    ];
    const result = groupToolCalls(tools);
    expect(result).toHaveLength(1);
    const first = result[0]!; // ASSERT: result has exactly 1 element per grouping algorithm
    expect(first.type).toBe('group');
    if (first.type === 'group') {
      expect(first.tools).toHaveLength(5);
      expect(first.errors).toHaveLength(0);
    }
  });
});
