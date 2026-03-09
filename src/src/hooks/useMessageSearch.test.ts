/**
 * useMessageSearch tests -- search filtering and highlight for chat messages.
 *
 * Tests verify: case-insensitive filtering, empty query passthrough,
 * thinking block search, highlight wrapping.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMessageSearch } from './useMessageSearch';
import type { Message } from '@/types/message';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMessage(overrides: Partial<Message> & { id: string; content: string }): Message {
  return {
    role: 'user',
    toolCalls: undefined,
    thinkingBlocks: undefined,
    attachments: undefined,
    metadata: {
      timestamp: '2026-03-09T00:00:00Z',
      tokenCount: null,
      inputTokens: null,
      outputTokens: null,
      cacheReadTokens: null,
      cost: null,
      duration: null,
    },
    providerContext: { providerId: 'claude', modelId: 'opus-4', agentName: null },
    ...overrides,
  };
}

const MSG_HELLO = makeMessage({ id: '1', content: 'Hello world' });
const MSG_FOO = makeMessage({ id: '2', content: 'Foo bar baz', role: 'assistant' });
const MSG_THINKING = makeMessage({
  id: '3',
  content: 'response text',
  role: 'assistant',
  thinkingBlocks: [{ id: 'tb1', text: 'deep thought about algorithms', isComplete: true }],
});
const MSG_TOOL = makeMessage({
  id: '4',
  content: 'Used tools',
  role: 'assistant',
  toolCalls: [{ id: 'tc1', toolName: 'Read', input: { file: 'secret.ts' }, output: 'file content', isError: false, parentToolUseId: null }],
});

describe('useMessageSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('filterMessages returns all messages when query is empty', () => {
    const { result } = renderHook(() => useMessageSearch());
    const all = [MSG_HELLO, MSG_FOO, MSG_THINKING];
    expect(result.current.filterMessages(all)).toEqual(all);
  });

  it('filterMessages filters by content match (case-insensitive)', () => {
    const { result } = renderHook(() => useMessageSearch());

    act(() => {
      result.current.setQuery('hello');
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    const filtered = result.current.filterMessages([MSG_HELLO, MSG_FOO, MSG_THINKING]);
    expect(filtered).toEqual([MSG_HELLO]);
  });

  it('filterMessages is case-insensitive', () => {
    const { result } = renderHook(() => useMessageSearch());

    act(() => {
      result.current.setQuery('HELLO');
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    const filtered = result.current.filterMessages([MSG_HELLO, MSG_FOO]);
    expect(filtered).toEqual([MSG_HELLO]);
  });

  it('filterMessages matches thinking block text', () => {
    const { result } = renderHook(() => useMessageSearch());

    act(() => {
      result.current.setQuery('algorithms');
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    const filtered = result.current.filterMessages([MSG_HELLO, MSG_THINKING]);
    expect(filtered).toEqual([MSG_THINKING]);
  });

  it('filterMessages does NOT match tool call input/output', () => {
    const { result } = renderHook(() => useMessageSearch());

    act(() => {
      result.current.setQuery('secret');
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    const filtered = result.current.filterMessages([MSG_TOOL]);
    expect(filtered).toEqual([]);
  });

  it('open/close/toggle control isOpen state', () => {
    const { result } = renderHook(() => useMessageSearch());
    expect(result.current.isOpen).toBe(false);

    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);

    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);

    act(() => result.current.toggle());
    expect(result.current.isOpen).toBe(true);
    act(() => result.current.toggle());
    expect(result.current.isOpen).toBe(false);
  });

  it('close resets query', () => {
    const { result } = renderHook(() => useMessageSearch());

    act(() => {
      result.current.setQuery('test');
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    act(() => result.current.close());
    expect(result.current.query).toBe('');
  });

  it('debounces filter query by 150ms', () => {
    const { result } = renderHook(() => useMessageSearch());

    act(() => {
      result.current.setQuery('hello');
    });

    expect(result.current.query).toBe('hello');
    const beforeDebounce = result.current.filterMessages([MSG_HELLO, MSG_FOO]);
    expect(beforeDebounce).toEqual([MSG_HELLO, MSG_FOO]);

    act(() => {
      vi.advanceTimersByTime(200);
    });
    const afterDebounce = result.current.filterMessages([MSG_HELLO, MSG_FOO]);
    expect(afterDebounce).toEqual([MSG_HELLO]);
  });
});
