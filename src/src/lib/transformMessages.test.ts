/**
 * Transform messages tests -- backend shapes to internal Message type.
 */

import { describe, it, expect } from 'vitest';
import { transformBackendMessages, transformBackendSession, type BackendEntry } from './transformMessages';

describe('transformBackendMessages', () => {
  it('handles string content (plain text messages)', () => {
    const entries = [
      {
        type: 'user',
        message: { role: 'user' as const, content: 'Hello, Claude' },
        sessionId: 'sess-1',
        timestamp: '2026-03-06T12:00:00Z',
        uuid: 'msg-1',
      },
    ];

    const messages = transformBackendMessages(entries);
    expect(messages).toHaveLength(1);
    expect(messages[0]?.content).toBe('Hello, Claude');
    expect(messages[0]?.role).toBe('user');
    expect(messages[0]?.id).toBe('msg-1');
    expect(messages[0]?.metadata.timestamp).toBe('2026-03-06T12:00:00Z');
    expect(messages[0]?.providerContext.providerId).toBe('claude');
  });

  it('handles array content blocks (text + tool_use extraction)', () => {
    const entries = [
      {
        type: 'assistant',
        message: {
          id: 'api-msg-1',
          role: 'assistant' as const,
          content: [
            { type: 'text' as const, text: 'Let me check that file.' },
            {
              type: 'tool_use' as const,
              id: 'tool-1',
              name: 'Read',
              input: { file_path: '/test.ts' },
            },
          ],
        },
        sessionId: 'sess-1',
        timestamp: '2026-03-06T12:01:00Z',
        uuid: 'msg-2',
      },
    ];

    const messages = transformBackendMessages(entries);
    expect(messages).toHaveLength(1);
    expect(messages[0]?.content).toBe('Let me check that file.');
    expect(messages[0]?.toolCalls).toHaveLength(1);
    expect(messages[0]?.toolCalls?.[0]?.toolName).toBe('Read');
    expect(messages[0]?.toolCalls?.[0]?.input).toEqual({ file_path: '/test.ts' });
    expect(messages[0]?.toolCalls?.[0]?.output).toBeNull();
    expect(messages[0]?.toolCalls?.[0]?.isError).toBe(false);
  });

  it('skips non-chat entry types (system, progress, queue-operation)', () => {
    const entries = [
      { type: 'system', sessionId: 'sess-1' },
      { type: 'progress', sessionId: 'sess-1' },
      {
        type: 'user',
        message: { role: 'user' as const, content: 'Valid message' },
        sessionId: 'sess-1',
        uuid: 'msg-3',
      },
    ];

    const messages = transformBackendMessages(entries);
    expect(messages).toHaveLength(1);
    expect(messages[0]?.content).toBe('Valid message');
  });

  it('uses Math.random() ID fallback when entry has no uuid', () => {
    const entries = [
      {
        type: 'user',
        message: { role: 'user' as const, content: 'No UUID' },
        sessionId: 'sess-1',
      },
    ];

    const messages = transformBackendMessages(entries);
    expect(messages).toHaveLength(1);
    expect(messages[0]?.id).toBeDefined();
    expect(messages[0]?.id.length).toBeGreaterThan(0);
  });

  it('handles empty entries array', () => {
    const messages = transformBackendMessages([]);
    expect(messages).toHaveLength(0);
  });

  it('merges consecutive assistant entries with same message.id into one turn', () => {
    const entries = [
      {
        type: 'assistant',
        message: {
          id: 'msg-turn-1',
          role: 'assistant' as const,
          content: [{ type: 'text' as const, text: 'Let me read that.' }],
        },
        sessionId: 'sess-1',
        uuid: 'uuid-a',
      },
      {
        type: 'assistant',
        message: {
          id: 'msg-turn-1',
          role: 'assistant' as const,
          content: [
            { type: 'tool_use' as const, id: 'tool-1', name: 'Read', input: { file_path: '/x' } },
          ],
        },
        sessionId: 'sess-1',
        uuid: 'uuid-b',
      },
    ];

    const messages = transformBackendMessages(entries);
    expect(messages).toHaveLength(1);
    expect(messages[0]?.content).toBe('Let me read that.');
    expect(messages[0]?.toolCalls).toHaveLength(1);
  });

  it('filters out pure tool_result entries (role: user but only tool_result blocks)', () => {
    // tool_result blocks don't match ContentBlock type — cast to exercise runtime filter
    const entries = [
      {
        type: 'user',
        message: {
          role: 'user' as const,
          content: [{ type: 'tool_result', tool_use_id: 'tool-1', content: 'file contents' }],
        },
        sessionId: 'sess-1',
        uuid: 'uuid-tr',
      },
      {
        type: 'assistant',
        message: {
          id: 'msg-resp',
          role: 'assistant' as const,
          content: [{ type: 'text' as const, text: 'Got it.' }],
        },
        sessionId: 'sess-1',
        uuid: 'uuid-resp',
      },
    ] as unknown as BackendEntry[];

    const messages = transformBackendMessages(entries);
    expect(messages).toHaveLength(1);
    expect(messages[0]?.role).toBe('assistant');
  });

  it('filters out blank user messages', () => {
    const entries = [
      {
        type: 'user',
        message: { role: 'user' as const, content: '' },
        sessionId: 'sess-1',
        uuid: 'uuid-blank',
      },
      {
        type: 'user',
        message: { role: 'user' as const, content: 'Real message' },
        sessionId: 'sess-1',
        uuid: 'uuid-real',
      },
    ];

    const messages = transformBackendMessages(entries);
    expect(messages).toHaveLength(1);
    expect(messages[0]?.content).toBe('Real message');
  });

  it('passes through error entries as error role messages', () => {
    const entries = [
      {
        type: 'error',
        message: { role: 'error' as const, content: 'Something went wrong' },
        sessionId: 'sess-1',
        uuid: 'err-1',
        timestamp: '2026-03-07T12:00:00Z',
      },
    ];

    const messages = transformBackendMessages(entries);
    expect(messages).toHaveLength(1);
    expect(messages[0]?.role).toBe('error');
    expect(messages[0]?.content).toBe('Something went wrong');
    expect(messages[0]?.id).toBe('err-1');
  });

  it('passes through system entries as system role messages', () => {
    const entries = [
      {
        type: 'system',
        message: { role: 'system' as const, content: 'Session started' },
        sessionId: 'sess-1',
        uuid: 'sys-1',
      },
    ];

    const messages = transformBackendMessages(entries);
    expect(messages).toHaveLength(1);
    expect(messages[0]?.role).toBe('system');
    expect(messages[0]?.content).toBe('Session started');
  });

  it('passes through task_notification entries', () => {
    const entries = [
      {
        type: 'task_notification',
        message: { role: 'task_notification' as const, content: 'Task completed' },
        sessionId: 'sess-1',
        uuid: 'task-1',
      },
    ];

    const messages = transformBackendMessages(entries);
    expect(messages).toHaveLength(1);
    expect(messages[0]?.role).toBe('task_notification');
    expect(messages[0]?.content).toBe('Task completed');
  });

  it('interleaves new message types with user/assistant messages', () => {
    const entries = [
      {
        type: 'system',
        message: { role: 'system' as const, content: 'Session started' },
        sessionId: 'sess-1',
        uuid: 'sys-1',
      },
      {
        type: 'user',
        message: { role: 'user' as const, content: 'Hello' },
        sessionId: 'sess-1',
        uuid: 'msg-1',
      },
      {
        type: 'error',
        message: { role: 'error' as const, content: 'API limit reached' },
        sessionId: 'sess-1',
        uuid: 'err-1',
      },
    ];

    const messages = transformBackendMessages(entries);
    expect(messages).toHaveLength(3);
    expect(messages[0]?.role).toBe('system');
    expect(messages[1]?.role).toBe('user');
    expect(messages[2]?.role).toBe('error');
  });

  it('omits toolCalls when no tool_use blocks exist', () => {
    const entries = [
      {
        type: 'assistant',
        message: {
          id: 'api-msg-2',
          role: 'assistant' as const,
          content: [{ type: 'text' as const, text: 'Just text.' }],
        },
        sessionId: 'sess-1',
        uuid: 'msg-4',
      },
    ];

    const messages = transformBackendMessages(entries);
    expect(messages[0]?.toolCalls).toBeUndefined();
  });
});

describe('transformBackendMessages result entry extraction', () => {
  it('attaches token data from result entry to preceding assistant message', () => {
    const entries: BackendEntry[] = [
      {
        type: 'user',
        message: { role: 'user' as const, content: 'Hello' },
        sessionId: 'sess-1',
        uuid: 'msg-u1',
      },
      {
        type: 'assistant',
        message: {
          id: 'api-1',
          role: 'assistant' as const,
          content: [{ type: 'text' as const, text: 'Hi there' }],
        },
        sessionId: 'sess-1',
        uuid: 'msg-a1',
      },
      {
        type: 'result',
        sessionId: 'sess-1',
        modelUsage: {
          'claude-sonnet-4-20250514': {
            inputTokens: 1000,
            outputTokens: 200,
            cacheReadInputTokens: 500,
            cacheCreationInputTokens: 50,
          },
        },
        total_cost_usd: 0.0123,
      },
    ];

    const messages = transformBackendMessages(entries);
    expect(messages).toHaveLength(2); // user + assistant, no result message
    const assistant = messages[1]!; // ASSERT: toHaveLength(2) guarantees index 1 exists
    expect(assistant.role).toBe('assistant');
    expect(assistant.metadata.inputTokens).toBe(1000);
    expect(assistant.metadata.outputTokens).toBe(200);
    expect(assistant.metadata.cacheReadTokens).toBe(500);
    expect(assistant.metadata.cost).toBe(0.0123);
  });

  it('attaches separate result data to multiple assistant messages', () => {
    const entries: BackendEntry[] = [
      {
        type: 'user',
        message: { role: 'user' as const, content: 'First question' },
        sessionId: 'sess-1',
        uuid: 'msg-u1',
      },
      {
        type: 'assistant',
        message: {
          id: 'api-1',
          role: 'assistant' as const,
          content: [{ type: 'text' as const, text: 'First answer' }],
        },
        sessionId: 'sess-1',
        uuid: 'msg-a1',
      },
      {
        type: 'result',
        sessionId: 'sess-1',
        modelUsage: {
          'claude-sonnet-4-20250514': {
            inputTokens: 500,
            outputTokens: 100,
            cacheReadInputTokens: 0,
          },
        },
        total_cost_usd: 0.005,
      },
      {
        type: 'user',
        message: { role: 'user' as const, content: 'Second question' },
        sessionId: 'sess-1',
        uuid: 'msg-u2',
      },
      {
        type: 'assistant',
        message: {
          id: 'api-2',
          role: 'assistant' as const,
          content: [{ type: 'text' as const, text: 'Second answer' }],
        },
        sessionId: 'sess-1',
        uuid: 'msg-a2',
      },
      {
        type: 'result',
        sessionId: 'sess-1',
        modelUsage: {
          'claude-sonnet-4-20250514': {
            inputTokens: 800,
            outputTokens: 300,
            cacheReadInputTokens: 200,
          },
        },
        total_cost_usd: 0.012,
      },
    ];

    const messages = transformBackendMessages(entries);
    expect(messages).toHaveLength(4); // ASSERT: 2 user + 2 assistant, indices 0-3 valid
    expect(messages[1]!.metadata.inputTokens).toBe(500); // ASSERT: length verified above
    expect(messages[1]!.metadata.cost).toBe(0.005); // ASSERT: length verified above
    expect(messages[3]!.metadata.inputTokens).toBe(800); // ASSERT: length verified above
    expect(messages[3]!.metadata.cost).toBe(0.012); // ASSERT: length verified above
  });

  it('keeps null metadata when no result entry exists for assistant message', () => {
    const entries: BackendEntry[] = [
      {
        type: 'assistant',
        message: {
          id: 'api-1',
          role: 'assistant' as const,
          content: [{ type: 'text' as const, text: 'No result entry' }],
        },
        sessionId: 'sess-1',
        uuid: 'msg-a1',
      },
    ];

    const messages = transformBackendMessages(entries);
    expect(messages).toHaveLength(1); // ASSERT: single message, index 0 valid
    expect(messages[0]!.metadata.inputTokens).toBeNull(); // ASSERT: length verified above
    expect(messages[0]!.metadata.outputTokens).toBeNull(); // ASSERT: length verified above
    expect(messages[0]!.metadata.cacheReadTokens).toBeNull(); // ASSERT: length verified above
    expect(messages[0]!.metadata.cost).toBeNull(); // ASSERT: length verified above
  });

  it('skips result entry with missing modelUsage', () => {
    const entries: BackendEntry[] = [
      {
        type: 'assistant',
        message: {
          id: 'api-1',
          role: 'assistant' as const,
          content: [{ type: 'text' as const, text: 'Answer' }],
        },
        sessionId: 'sess-1',
        uuid: 'msg-a1',
      },
      {
        type: 'result',
        sessionId: 'sess-1',
        total_cost_usd: 0.01,
        // no modelUsage
      },
    ];

    const messages = transformBackendMessages(entries);
    expect(messages).toHaveLength(1); // ASSERT: single message, index 0 valid
    // cost should still be attached even without modelUsage
    expect(messages[0]!.metadata.cost).toBe(0.01); // ASSERT: length verified above
    expect(messages[0]!.metadata.inputTokens).toBeNull(); // ASSERT: length verified above
  });

  it('uses cumulativeInputTokens as fallback for inputTokens', () => {
    const entries: BackendEntry[] = [
      {
        type: 'assistant',
        message: {
          id: 'api-1',
          role: 'assistant' as const,
          content: [{ type: 'text' as const, text: 'Answer' }],
        },
        sessionId: 'sess-1',
        uuid: 'msg-a1',
      },
      {
        type: 'result',
        sessionId: 'sess-1',
        modelUsage: {
          'claude-sonnet-4-20250514': {
            cumulativeInputTokens: 2000,
            outputTokens: 400,
          },
        },
        total_cost_usd: 0.02,
      },
    ];

    const messages = transformBackendMessages(entries);
    expect(messages[0]!.metadata.inputTokens).toBe(2000); // ASSERT: single result, index 0 valid
    expect(messages[0]!.metadata.outputTokens).toBe(400); // ASSERT: single result, index 0 valid
  });

  it('does not include result entries as messages in the output', () => {
    const entries: BackendEntry[] = [
      {
        type: 'result',
        sessionId: 'sess-1',
        modelUsage: {
          'claude-sonnet-4-20250514': {
            inputTokens: 100,
            outputTokens: 50,
          },
        },
        total_cost_usd: 0.001,
      },
    ];

    const messages = transformBackendMessages(entries);
    expect(messages).toHaveLength(0);
  });
});

describe('transformBackendSession', () => {
  it('maps backend session shape to frontend Session type', () => {
    const backend = {
      id: 'sess-abc',
      summary: 'Help with TypeScript',
      messageCount: 12,
      lastActivity: '2026-03-06T14:30:00Z',
      cwd: '/home/user/project',
    };

    const session = transformBackendSession(backend);
    expect(session.id).toBe('sess-abc');
    expect(session.title).toBe('Help with TypeScript');
    expect(session.updatedAt).toBe('2026-03-06T14:30:00Z');
    expect(session.providerId).toBe('claude');
    expect(session.messages).toEqual([]);
    expect(session.metadata.tokenBudget).toBeNull();
    expect(session.metadata.contextWindowUsed).toBeNull();
    expect(session.metadata.totalCost).toBeNull();
  });

  it('defaults title to "New Chat" when summary is empty', () => {
    const backend = {
      id: 'sess-xyz',
      summary: '',
      messageCount: 0,
      lastActivity: '2026-03-06T10:00:00Z',
      cwd: '/home/user',
    };

    const session = transformBackendSession(backend);
    expect(session.title).toBe('New Chat');
  });

  it('sets createdAt from lastActivity when no other field available', () => {
    const backend = {
      id: 'sess-123',
      summary: 'Test',
      messageCount: 1,
      lastActivity: '2026-03-06T09:00:00Z',
      cwd: '/home/user',
    };

    const session = transformBackendSession(backend);
    expect(session.createdAt).toBe('2026-03-06T09:00:00Z');
  });
});
