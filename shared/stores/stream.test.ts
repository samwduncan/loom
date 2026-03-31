/**
 * Stream Store tests -- exercises all actions for ephemeral streaming state.
 *
 * Uses factory pattern with createStreamStore().
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createStreamStore } from '../stores/stream';
import type { ToolCallState, ThinkingState } from '../types/stream';

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

describe('createStreamStore', () => {
  let store: ReturnType<typeof createStreamStore>;

  beforeEach(() => {
    store = createStreamStore();
  });

  // -- startStream --
  it('startStream sets isStreaming to true', () => {
    expect(store.getState().isStreaming).toBe(false);
    store.getState().startStream();
    expect(store.getState().isStreaming).toBe(true);
  });

  // -- endStream --
  it('endStream resets ephemeral fields but preserves resultTokens', () => {
    store.getState().startStream();
    store.getState().addToolCall(createTestToolCall());
    store.getState().setThinkingState(createTestThinkingState());
    store.getState().setActivityText('Running tests...');
    store.getState().setResultData({ input: 100, output: 50 }, 0.005);

    store.getState().endStream();

    const state = store.getState();
    expect(state.isStreaming).toBe(false);
    expect(state.activeToolCalls).toHaveLength(0);
    expect(state.thinkingState).toBeNull();
    expect(state.activityText).toBe('');
    // resultTokens/resultCost preserved for ActiveMessage handleFlush
    expect(state.resultTokens).toEqual({ input: 100, output: 50 });
    expect(state.resultCost).toBe(0.005);
  });

  // -- addToolCall --
  it('addToolCall appends to activeToolCalls', () => {
    const tc1 = createTestToolCall({ id: 'tc-1' });
    const tc2 = createTestToolCall({ id: 'tc-2' });

    store.getState().addToolCall(tc1);
    store.getState().addToolCall(tc2);

    const state = store.getState();
    expect(state.activeToolCalls).toHaveLength(2);
    expect(state.activeToolCalls[0]?.id).toBe('tc-1');
    expect(state.activeToolCalls[1]?.id).toBe('tc-2');
  });

  // -- updateToolCall --
  it('updateToolCall merges updates for matching id', () => {
    const tc = createTestToolCall({ id: 'tc-1', status: 'invoked' });
    store.getState().addToolCall(tc);

    store.getState().updateToolCall('tc-1', {
      status: 'resolved',
      output: 'file content here',
      completedAt: '2026-03-05T12:01:00Z',
    });

    const updated = store.getState().activeToolCalls[0];
    expect(updated?.status).toBe('resolved');
    expect(updated?.output).toBe('file content here');
    expect(updated?.completedAt).toBe('2026-03-05T12:01:00Z');
    expect(updated?.toolName).toBe('Read');
    expect(updated?.id).toBe('tc-1');
  });

  it('updateToolCall does not affect non-matching tool calls', () => {
    store.getState().addToolCall(createTestToolCall({ id: 'tc-1', toolName: 'Read' }));
    store.getState().addToolCall(createTestToolCall({ id: 'tc-2', toolName: 'Write' }));

    store.getState().updateToolCall('tc-1', { status: 'resolved' });

    expect(store.getState().activeToolCalls[1]?.status).toBe('invoked');
  });

  // -- setThinkingState --
  it('setThinkingState sets thinkingState', () => {
    const thinking = createTestThinkingState();
    store.getState().setThinkingState(thinking);
    expect(store.getState().thinkingState).toEqual(thinking);
  });

  it('setThinkingState accepts null to clear', () => {
    store.getState().setThinkingState(createTestThinkingState());
    store.getState().setThinkingState(null);
    expect(store.getState().thinkingState).toBeNull();
  });

  // -- setActivityText --
  it('setActivityText sets activityText', () => {
    store.getState().setActivityText('Reading file...');
    expect(store.getState().activityText).toBe('Reading file...');
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
    store.getState().setPermissionRequest(request);
    expect(store.getState().activePermissionRequest).toEqual(request);
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
    store.getState().setPermissionRequest(first);
    store.getState().setPermissionRequest(second);
    expect(store.getState().activePermissionRequest?.requestId).toBe('pr-2');
  });

  it('clearPermissionRequest nulls activePermissionRequest', () => {
    store.getState().setPermissionRequest({
      requestId: 'pr-1',
      toolName: 'Bash',
      input: {},
      sessionId: 's1',
      receivedAt: 1000,
    });
    store.getState().clearPermissionRequest();
    expect(store.getState().activePermissionRequest).toBeNull();
  });

  it('endStream clears activePermissionRequest', () => {
    store.getState().setPermissionRequest({
      requestId: 'pr-1',
      toolName: 'Bash',
      input: {},
      sessionId: 's1',
      receivedAt: 1000,
    });
    store.getState().endStream();
    expect(store.getState().activePermissionRequest).toBeNull();
  });

  // -- reset --
  it('reset() restores initial state', () => {
    store.getState().startStream();
    store.getState().addToolCall(createTestToolCall());
    store.getState().setActivityText('Busy');

    store.getState().reset();

    const state = store.getState();
    expect(state.isStreaming).toBe(false);
    expect(state.activeToolCalls).toHaveLength(0);
    expect(state.thinkingState).toBeNull();
    expect(state.activityText).toBe('');
  });
});
