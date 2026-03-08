/**
 * Stream Store tests — exercises all actions for ephemeral streaming state.
 *
 * Uses getState()/setState() directly (exempted from no-external-store-mutation ESLint rule).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useStreamStore } from './stream';
import type { ToolCallState } from '@/types/stream';
import type { ThinkingState } from '@/types/stream';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createTestToolCall(overrides?: Partial<ToolCallState>): ToolCallState {
  return {
    id: `tc-${Math.random().toString(36).slice(2, 8)}`,
    toolName: 'Read',
    status: 'invoked',
    input: { file_path: '/test.ts' },
    output: null,
    isError: false,
    startedAt: '2026-03-05T12:00:00Z',
    completedAt: null,
    ...overrides,
  };
}

function createTestThinkingState(overrides?: Partial<ThinkingState>): ThinkingState {
  return {
    isThinking: true,
    blocks: [{ id: 'tb-1', text: 'Analyzing...', isComplete: false }],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useStreamStore', () => {
  beforeEach(() => {
    useStreamStore.getState().reset();
  });

  // -- startStream --
  it('startStream sets isStreaming to true', () => {
    expect(useStreamStore.getState().isStreaming).toBe(false);
    useStreamStore.getState().startStream();
    expect(useStreamStore.getState().isStreaming).toBe(true);
  });

  // -- endStream --
  it('endStream resets all fields to initial state', () => {
    useStreamStore.getState().startStream();
    useStreamStore.getState().addToolCall(createTestToolCall());
    useStreamStore.getState().setThinkingState(createTestThinkingState());
    useStreamStore.getState().setActivityText('Running tests...');

    useStreamStore.getState().endStream();

    const state = useStreamStore.getState();
    expect(state.isStreaming).toBe(false);
    expect(state.activeToolCalls).toHaveLength(0);
    expect(state.thinkingState).toBeNull();
    expect(state.activityText).toBe('');
  });

  // -- addToolCall --
  it('addToolCall appends to activeToolCalls', () => {
    const tc1 = createTestToolCall({ id: 'tc-1' });
    const tc2 = createTestToolCall({ id: 'tc-2' });

    useStreamStore.getState().addToolCall(tc1);
    useStreamStore.getState().addToolCall(tc2);

    const state = useStreamStore.getState();
    expect(state.activeToolCalls).toHaveLength(2);
    expect(state.activeToolCalls[0]?.id).toBe('tc-1');
    expect(state.activeToolCalls[1]?.id).toBe('tc-2');
  });

  // -- updateToolCall --
  it('updateToolCall merges updates for matching id', () => {
    const tc = createTestToolCall({ id: 'tc-1', status: 'invoked' });
    useStreamStore.getState().addToolCall(tc);

    useStreamStore.getState().updateToolCall('tc-1', {
      status: 'resolved',
      output: 'file content here',
      completedAt: '2026-03-05T12:01:00Z',
    });

    const updated = useStreamStore.getState().activeToolCalls[0];
    expect(updated?.status).toBe('resolved');
    expect(updated?.output).toBe('file content here');
    expect(updated?.completedAt).toBe('2026-03-05T12:01:00Z');
    // Other fields unchanged
    expect(updated?.toolName).toBe('Read');
    expect(updated?.id).toBe('tc-1');
  });

  it('updateToolCall does not affect non-matching tool calls', () => {
    useStreamStore.getState().addToolCall(createTestToolCall({ id: 'tc-1', toolName: 'Read' }));
    useStreamStore.getState().addToolCall(createTestToolCall({ id: 'tc-2', toolName: 'Write' }));

    useStreamStore.getState().updateToolCall('tc-1', { status: 'resolved' });

    expect(useStreamStore.getState().activeToolCalls[1]?.status).toBe('invoked');
  });

  // -- setThinkingState --
  it('setThinkingState sets thinkingState', () => {
    const thinking = createTestThinkingState();
    useStreamStore.getState().setThinkingState(thinking);
    expect(useStreamStore.getState().thinkingState).toEqual(thinking);
  });

  it('setThinkingState accepts null to clear', () => {
    useStreamStore.getState().setThinkingState(createTestThinkingState());
    useStreamStore.getState().setThinkingState(null);
    expect(useStreamStore.getState().thinkingState).toBeNull();
  });

  // -- setActivityText --
  it('setActivityText sets activityText', () => {
    useStreamStore.getState().setActivityText('Reading file...');
    expect(useStreamStore.getState().activityText).toBe('Reading file...');
  });

  // -- setPermissionRequest / clearPermissionRequest --
  it('setPermissionRequest sets activePermissionRequest', () => {
    const request = {
      requestId: 'pr-1',
      toolName: 'Bash',
      input: { command: 'npm test' },
      sessionId: 's1',
      receivedAt: 1000,
    };
    useStreamStore.getState().setPermissionRequest(request);
    expect(useStreamStore.getState().activePermissionRequest).toEqual(request);
  });

  it('setPermissionRequest replaces existing request (only one at a time)', () => {
    const first = {
      requestId: 'pr-1',
      toolName: 'Bash',
      input: { command: 'npm test' },
      sessionId: 's1',
      receivedAt: 1000,
    };
    const second = {
      requestId: 'pr-2',
      toolName: 'Write',
      input: { file_path: '/tmp/foo' },
      sessionId: 's1',
      receivedAt: 2000,
    };
    useStreamStore.getState().setPermissionRequest(first);
    useStreamStore.getState().setPermissionRequest(second);
    expect(useStreamStore.getState().activePermissionRequest?.requestId).toBe('pr-2');
  });

  it('clearPermissionRequest nulls activePermissionRequest', () => {
    useStreamStore.getState().setPermissionRequest({
      requestId: 'pr-1',
      toolName: 'Bash',
      input: {},
      sessionId: 's1',
      receivedAt: 1000,
    });
    useStreamStore.getState().clearPermissionRequest();
    expect(useStreamStore.getState().activePermissionRequest).toBeNull();
  });

  it('endStream clears activePermissionRequest', () => {
    useStreamStore.getState().setPermissionRequest({
      requestId: 'pr-1',
      toolName: 'Bash',
      input: {},
      sessionId: 's1',
      receivedAt: 1000,
    });
    useStreamStore.getState().endStream();
    expect(useStreamStore.getState().activePermissionRequest).toBeNull();
  });

  // -- reset --
  it('reset() restores initial state', () => {
    useStreamStore.getState().startStream();
    useStreamStore.getState().addToolCall(createTestToolCall());
    useStreamStore.getState().setActivityText('Busy');

    useStreamStore.getState().reset();

    const state = useStreamStore.getState();
    expect(state.isStreaming).toBe(false);
    expect(state.activeToolCalls).toHaveLength(0);
    expect(state.thinkingState).toBeNull();
    expect(state.activityText).toBe('');
  });
});
