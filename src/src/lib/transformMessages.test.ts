/**
 * Transform messages tests -- backend shapes to internal Message type.
 */

import { describe, it, expect } from 'vitest';
import { transformBackendMessages, transformBackendSession } from './transformMessages';

describe('transformBackendMessages', () => {
  it('handles string content (plain text messages)', () => {
    const entries = [
      {
        type: 'message',
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
        type: 'message',
        message: {
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

  it('skips entries without message.role', () => {
    const entries = [
      { type: 'system', sessionId: 'sess-1' },
      {
        type: 'message',
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
        type: 'message',
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

  it('omits toolCalls when no tool_use blocks exist', () => {
    const entries = [
      {
        type: 'message',
        message: {
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
