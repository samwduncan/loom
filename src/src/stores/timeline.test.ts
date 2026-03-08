/**
 * Timeline Store tests — exercises all actions, persistence, and type contracts.
 *
 * Uses getState()/setState() directly (exempted from no-external-store-mutation ESLint rule).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useTimelineStore } from './timeline';
import type { Message, MessageMetadata } from '@/types/message';
import type { ProviderContext } from '@/types/provider';
import type { Session, SessionMetadata } from '@/types/session';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createTestMetadata(overrides?: Partial<MessageMetadata>): MessageMetadata {
  return {
    timestamp: '2026-03-05T12:00:00Z',
    tokenCount: null,
    inputTokens: null,
    outputTokens: null,
    cacheReadTokens: null,
    cost: null,
    duration: null,
    ...overrides,
  };
}

function createTestProviderContext(overrides?: Partial<ProviderContext>): ProviderContext {
  return {
    providerId: 'claude',
    modelId: 'claude-opus-4-20250514',
    agentName: null,
    ...overrides,
  };
}

function createTestMessage(overrides?: Partial<Message>): Message {
  return {
    id: `msg-${Math.random().toString(36).slice(2, 8)}`,
    role: 'user',
    content: 'Hello world',
    metadata: createTestMetadata(),
    providerContext: createTestProviderContext(),
    ...overrides,
  };
}

function createTestSessionMetadata(overrides?: Partial<SessionMetadata>): SessionMetadata {
  return {
    tokenBudget: null,
    contextWindowUsed: null,
    totalCost: null,
    ...overrides,
  };
}

function createTestSession(overrides?: Partial<Session>): Session {
  return {
    id: `session-${Math.random().toString(36).slice(2, 8)}`,
    title: 'Test Session',
    messages: [],
    providerId: 'claude',
    createdAt: '2026-03-05T12:00:00Z',
    updatedAt: '2026-03-05T12:00:00Z',
    metadata: createTestSessionMetadata(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useTimelineStore', () => {
  beforeEach(() => {
    useTimelineStore.getState().reset();
  });

  // -- addSession --
  it('addSession adds a session to the sessions array', () => {
    const session = createTestSession({ id: 'sess-1' });
    useTimelineStore.getState().addSession(session);

    const state = useTimelineStore.getState();
    expect(state.sessions).toHaveLength(1);
    expect(state.sessions[0]?.id).toBe('sess-1');
  });

  // -- removeSession --
  it('removeSession removes a session by id', () => {
    const s1 = createTestSession({ id: 'sess-1' });
    const s2 = createTestSession({ id: 'sess-2' });
    useTimelineStore.getState().addSession(s1);
    useTimelineStore.getState().addSession(s2);
    useTimelineStore.getState().removeSession('sess-1');

    const state = useTimelineStore.getState();
    expect(state.sessions).toHaveLength(1);
    expect(state.sessions[0]?.id).toBe('sess-2');
  });

  it('removeSession clears activeSessionId if it matches the removed session', () => {
    const session = createTestSession({ id: 'sess-1' });
    useTimelineStore.getState().addSession(session);
    useTimelineStore.getState().setActiveSession('sess-1');
    useTimelineStore.getState().removeSession('sess-1');

    expect(useTimelineStore.getState().activeSessionId).toBeNull();
  });

  // -- setActiveSession --
  it('setActiveSession sets the activeSessionId', () => {
    useTimelineStore.getState().setActiveSession('sess-42');
    expect(useTimelineStore.getState().activeSessionId).toBe('sess-42');
  });

  it('setActiveSession accepts null', () => {
    useTimelineStore.getState().setActiveSession('sess-42');
    useTimelineStore.getState().setActiveSession(null);
    expect(useTimelineStore.getState().activeSessionId).toBeNull();
  });

  // -- addMessage --
  it('addMessage adds a message to the correct session', () => {
    const session = createTestSession({ id: 'sess-1' });
    useTimelineStore.getState().addSession(session);

    const msg = createTestMessage({ id: 'msg-1', content: 'Test' });
    useTimelineStore.getState().addMessage('sess-1', msg);

    const state = useTimelineStore.getState();
    const found = state.sessions.find((s) => s.id === 'sess-1');
    expect(found?.messages).toHaveLength(1);
    expect(found?.messages[0]?.id).toBe('msg-1');
  });

  it('addMessage to non-existent session does not crash', () => {
    const msg = createTestMessage({ id: 'msg-1' });
    // Should not throw
    expect(() => {
      useTimelineStore.getState().addMessage('non-existent', msg);
    }).not.toThrow();

    // State unchanged — no sessions
    expect(useTimelineStore.getState().sessions).toHaveLength(0);
  });

  it('addMessage updates the session updatedAt timestamp', () => {
    const session = createTestSession({ id: 'sess-1', updatedAt: '2020-01-01T00:00:00Z' });
    useTimelineStore.getState().addSession(session);

    const msg = createTestMessage();
    useTimelineStore.getState().addMessage('sess-1', msg);

    const found = useTimelineStore.getState().sessions.find((s) => s.id === 'sess-1');
    expect(found?.updatedAt).not.toBe('2020-01-01T00:00:00Z');
  });

  // -- updateMessage --
  it('updateMessage updates specific message fields within a session', () => {
    const session = createTestSession({ id: 'sess-1' });
    useTimelineStore.getState().addSession(session);

    const msg = createTestMessage({ id: 'msg-1', content: 'Original' });
    useTimelineStore.getState().addMessage('sess-1', msg);
    useTimelineStore.getState().updateMessage('sess-1', 'msg-1', { content: 'Updated' });

    const found = useTimelineStore.getState().sessions.find((s) => s.id === 'sess-1');
    expect(found?.messages[0]?.content).toBe('Updated');
  });

  // -- clearSession --
  it('clearSession empties messages array for the specified session', () => {
    const session = createTestSession({ id: 'sess-1' });
    useTimelineStore.getState().addSession(session);

    const msg = createTestMessage();
    useTimelineStore.getState().addMessage('sess-1', msg);
    expect(useTimelineStore.getState().sessions[0]?.messages).toHaveLength(1);

    useTimelineStore.getState().clearSession('sess-1');
    expect(useTimelineStore.getState().sessions[0]?.messages).toHaveLength(0);
  });

  // -- updateSessionTitle --
  it('updateSessionTitle changes the session title', () => {
    const session = createTestSession({ id: 'sess-1', title: 'Old Title' });
    useTimelineStore.getState().addSession(session);
    useTimelineStore.getState().updateSessionTitle('sess-1', 'New Title');

    const found = useTimelineStore.getState().sessions.find((s) => s.id === 'sess-1');
    expect(found?.title).toBe('New Title');
  });

  // -- reset --
  it('reset() restores initial state', () => {
    const session = createTestSession({ id: 'sess-1' });
    useTimelineStore.getState().addSession(session);
    useTimelineStore.getState().setActiveSession('sess-1');

    useTimelineStore.getState().reset();

    const state = useTimelineStore.getState();
    expect(state.sessions).toHaveLength(0);
    expect(state.activeSessionId).toBeNull();
    expect(state.activeProviderId).toBe('claude');
  });

  // -- STATE-03: default activeProviderId --
  it('default activeProviderId is "claude" (STATE-03)', () => {
    expect(useTimelineStore.getState().activeProviderId).toBe('claude');
  });

  // -- STATE-02: Message metadata and providerContext fields --
  it('Message objects have metadata and providerContext fields (STATE-02)', () => {
    const session = createTestSession({ id: 'sess-1' });
    useTimelineStore.getState().addSession(session);

    const msg = createTestMessage({
      id: 'msg-1',
      metadata: createTestMetadata({ tokenCount: 42, cost: 0.001 }),
      providerContext: createTestProviderContext({ modelId: 'opus-4', agentName: 'test-agent' }),
    });
    useTimelineStore.getState().addMessage('sess-1', msg);

    const stored = useTimelineStore.getState().sessions[0]?.messages[0];
    expect(stored?.metadata).toBeDefined();
    expect(stored?.metadata.tokenCount).toBe(42);
    expect(stored?.metadata.cost).toBe(0.001);
    expect(stored?.providerContext).toBeDefined();
    expect(stored?.providerContext.modelId).toBe('opus-4');
    expect(stored?.providerContext.agentName).toBe('test-agent');
  });

  // -- STATE-05: Persistence partialize excludes messages --
  it('persistence partialize output contains session metadata but NOT messages', () => {
    const partialize = useTimelineStore.persist.getOptions().partialize;
    if (!partialize) {
      throw new Error('partialize function not found on timeline store');
    }

    // Build a fake state with sessions that have messages
    const fakeState = {
      sessions: [
        createTestSession({
          id: 'sess-1',
          title: 'Persisted Session',
          messages: [createTestMessage({ id: 'msg-1' }), createTestMessage({ id: 'msg-2' })],
        }),
      ],
      activeSessionId: 'sess-1',
      activeProviderId: 'claude' as const,
      // Actions (not used by partialize, but needed for type compatibility)
      addSession: () => {},
      removeSession: () => {},
      setActiveSession: () => {},
      addMessage: () => {},
      updateMessage: () => {},
      clearSession: () => {},
      updateSessionTitle: () => {},
      reset: () => {},
    };

    const persisted = partialize(fakeState);

    // Session metadata fields should be present
    expect(persisted.sessions).toHaveLength(1);
    expect(persisted.sessions[0]).toHaveProperty('id', 'sess-1');
    expect(persisted.sessions[0]).toHaveProperty('title', 'Persisted Session');
    expect(persisted.sessions[0]).toHaveProperty('providerId');
    expect(persisted.sessions[0]).toHaveProperty('createdAt');
    expect(persisted.sessions[0]).toHaveProperty('updatedAt');
    expect(persisted.sessions[0]).toHaveProperty('metadata');

    // Messages MUST NOT be present
    expect(persisted.sessions[0]).not.toHaveProperty('messages');
  });
});
