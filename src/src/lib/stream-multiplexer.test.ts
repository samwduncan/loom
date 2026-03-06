/**
 * Stream multiplexer tests -- pure function message routing with mock callbacks.
 *
 * Tests routeClaudeResponse, routeServerMessage, and getToolActivityText
 * in isolation. No store imports, no React.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MultiplexerCallbacks } from '@/lib/stream-multiplexer';
import {
  routeClaudeResponse,
  routeServerMessage,
  getToolActivityText,
} from '@/lib/stream-multiplexer';
import type {
  ServerMessage,
  SDKAssistantMessage,
  SDKResultMessage,
  SDKSystemMessage,
  SDKToolProgressMessage,
  SDKUserMessage,
  ClientMessage,
} from '@/types/websocket';

function createMockCallbacks(): MultiplexerCallbacks {
  return {
    onContentToken: vi.fn(),
    onThinkingBlock: vi.fn(),
    onToolUseStart: vi.fn(),
    onToolResult: vi.fn(),
    onToolProgress: vi.fn(),
    onActivityText: vi.fn(),
    onStreamStart: vi.fn(),
    onStreamEnd: vi.fn(),
    onError: vi.fn(),
    onSessionCreated: vi.fn(),
    onSessionAborted: vi.fn(),
    onSessionStatus: vi.fn(),
    onActiveSessions: vi.fn(),
    onTokenBudget: vi.fn(),
    onPermissionRequest: vi.fn(),
    onProjectsUpdated: vi.fn(),
  };
}

describe('routeClaudeResponse', () => {
  let cbs: MultiplexerCallbacks;

  beforeEach(() => {
    cbs = createMockCallbacks();
  });

  it('routes assistant text block to onContentToken', () => {
    const data: SDKAssistantMessage = {
      type: 'assistant',
      message: { content: [{ type: 'text', text: 'Hello world' }] },
      session_id: 's1',
    };

    routeClaudeResponse(data, 's1', cbs);

    expect(cbs.onContentToken).toHaveBeenCalledWith('Hello world');
    expect(cbs.onToolUseStart).not.toHaveBeenCalled();
    expect(cbs.onThinkingBlock).not.toHaveBeenCalled();
  });

  it('routes assistant tool_use block to onToolUseStart', () => {
    const data: SDKAssistantMessage = {
      type: 'assistant',
      message: {
        content: [
          {
            type: 'tool_use',
            id: 'tu-1',
            name: 'Read',
            input: { file_path: 'auth.ts' },
          },
        ],
      },
      session_id: 's1',
    };

    routeClaudeResponse(data, 's1', cbs);

    expect(cbs.onToolUseStart).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'tu-1',
        toolName: 'Read',
        status: 'invoked',
        input: { file_path: 'auth.ts' },
        output: null,
        isError: false,
      }),
    );
    expect(cbs.onActivityText).toHaveBeenCalledWith('Reading auth.ts...');
  });

  it('routes assistant thinking block to onThinkingBlock', () => {
    const data: SDKAssistantMessage = {
      type: 'assistant',
      message: {
        content: [{ type: 'thinking', thinking: 'Let me consider...' }],
      },
      session_id: 's1',
    };

    routeClaudeResponse(data, 's1', cbs);

    expect(cbs.onThinkingBlock).toHaveBeenCalledWith(
      expect.any(String), // generated UUID
      'Let me consider...',
      true,
    );
  });

  it('routes mixed blocks (text + tool_use + thinking) to correct callbacks', () => {
    const data: SDKAssistantMessage = {
      type: 'assistant',
      message: {
        content: [
          { type: 'text', text: 'Here is my plan:' },
          {
            type: 'tool_use',
            id: 'tu-2',
            name: 'Bash',
            input: { command: 'npm test' },
          },
          { type: 'thinking', thinking: 'Analyzing results...' },
        ],
      },
      session_id: 's1',
    };

    routeClaudeResponse(data, 's1', cbs);

    expect(cbs.onContentToken).toHaveBeenCalledWith('Here is my plan:');
    expect(cbs.onToolUseStart).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'tu-2', toolName: 'Bash' }),
    );
    expect(cbs.onThinkingBlock).toHaveBeenCalledWith(
      expect.any(String),
      'Analyzing results...',
      true,
    );
  });

  it('routes result message to onStreamEnd (not content)', () => {
    const data: SDKResultMessage = {
      type: 'result',
      subtype: 'success',
      modelUsage: {},
      total_cost_usd: 0.05,
      session_id: 's1',
    };

    routeClaudeResponse(data, 's1', cbs);

    expect(cbs.onStreamEnd).toHaveBeenCalledWith('s1', 0);
    expect(cbs.onContentToken).not.toHaveBeenCalled();
  });

  it('routes system init message to onActivityText', () => {
    const data: SDKSystemMessage = {
      type: 'system',
      subtype: 'init',
      tools: ['Read', 'Write'],
      session_id: 's1',
    };

    routeClaudeResponse(data, 's1', cbs);

    expect(cbs.onActivityText).toHaveBeenCalledWith(
      'Initializing session...',
    );
  });

  it('routes tool_progress message to onToolProgress and onActivityText', () => {
    const data: SDKToolProgressMessage = {
      type: 'tool_progress',
      tool_use_id: 'tu-3',
      tool_name: 'Bash',
      elapsed_time_seconds: 5,
      session_id: 's1',
    };

    routeClaudeResponse(data, 's1', cbs);

    expect(cbs.onToolProgress).toHaveBeenCalledWith('tu-3', 'Bash', 5);
    // tool_progress messages don't carry input, so activity falls back to default
    expect(cbs.onActivityText).toHaveBeenCalledWith('Running...');
  });

  it('handles unknown SDK type without crashing', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const data = { type: 'unknown-sdk-type', session_id: 's1' } as unknown as SDKUserMessage;
    routeClaudeResponse(data, 's1', cbs);

    expect(warnSpy).toHaveBeenCalledWith(
      '[Multiplexer] Unknown SDK message type:',
      data,
    );
    expect(cbs.onContentToken).not.toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('handles user message type as no-op', () => {
    const data: SDKUserMessage = {
      type: 'user',
      message: { role: 'user', content: 'hello' },
      session_id: 's1',
    };

    routeClaudeResponse(data, 's1', cbs);

    expect(cbs.onContentToken).not.toHaveBeenCalled();
    expect(cbs.onStreamEnd).not.toHaveBeenCalled();
  });

  it('logs and skips unknown content block types', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const data: SDKAssistantMessage = {
      type: 'assistant',
      message: {
        content: [
          { type: 'text', text: 'before' },
          { type: 'unknown_block' as 'text', text: '' },
          { type: 'text', text: 'after' },
        ],
      },
      session_id: 's1',
    };

    routeClaudeResponse(data, 's1', cbs);

    expect(cbs.onContentToken).toHaveBeenCalledTimes(2);
    expect(cbs.onContentToken).toHaveBeenCalledWith('before');
    expect(cbs.onContentToken).toHaveBeenCalledWith('after');
    expect(warnSpy).toHaveBeenCalledWith(
      '[Multiplexer] Unknown content block type:',
      expect.objectContaining({ type: 'unknown_block' }),
    );

    warnSpy.mockRestore();
  });
});

describe('routeServerMessage', () => {
  let cbs: MultiplexerCallbacks;
  let sendFn: ReturnType<typeof vi.fn<(msg: ClientMessage) => boolean>>;

  beforeEach(() => {
    cbs = createMockCallbacks();
    sendFn = vi.fn().mockReturnValue(true);
  });

  it('routes claude-complete to onStreamEnd', () => {
    const msg: ServerMessage = {
      type: 'claude-complete',
      sessionId: 's1',
      exitCode: 0,
      isNewSession: false,
    };

    routeServerMessage(msg, cbs, sendFn);

    expect(cbs.onStreamEnd).toHaveBeenCalledWith('s1', 0);
  });

  it('routes claude-error to onError', () => {
    const msg: ServerMessage = {
      type: 'claude-error',
      error: 'Process crashed',
      sessionId: 's1',
    };

    routeServerMessage(msg, cbs, sendFn);

    expect(cbs.onError).toHaveBeenCalledWith('Process crashed', 's1');
  });

  it('auto-allows read-only permission requests silently', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const msg: ServerMessage = {
      type: 'claude-permission-request',
      requestId: 'pr-1',
      toolName: 'Read',
      input: { file_path: 'test.ts' },
      sessionId: 's1',
    };

    routeServerMessage(msg, cbs, sendFn);

    expect(sendFn).toHaveBeenCalledWith({
      type: 'claude-permission-response',
      requestId: 'pr-1',
      allow: true,
    });
    // Read is read-only -- no console.warn
    expect(warnSpy).not.toHaveBeenCalled();
    expect(cbs.onPermissionRequest).toHaveBeenCalledWith(
      'pr-1',
      'Read',
      { file_path: 'test.ts' },
      's1',
    );

    warnSpy.mockRestore();
  });

  it('auto-allows write/execute permission requests with console.warn', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const msg: ServerMessage = {
      type: 'claude-permission-request',
      requestId: 'pr-2',
      toolName: 'Bash',
      input: { command: 'rm -rf node_modules' },
      sessionId: 's1',
    };

    routeServerMessage(msg, cbs, sendFn);

    expect(sendFn).toHaveBeenCalledWith({
      type: 'claude-permission-response',
      requestId: 'pr-2',
      allow: true,
    });
    expect(warnSpy).toHaveBeenCalledWith(
      '[Loom] Auto-allowing write/execute tool:',
      'Bash',
    );
    expect(cbs.onPermissionRequest).toHaveBeenCalledWith(
      'pr-2',
      'Bash',
      { command: 'rm -rf node_modules' },
      's1',
    );

    warnSpy.mockRestore();
  });

  it('routes token-budget to onTokenBudget', () => {
    const msg: ServerMessage = {
      type: 'token-budget',
      data: { used: 5000, total: 200000 },
      sessionId: 's1',
    };

    routeServerMessage(msg, cbs, sendFn);

    expect(cbs.onTokenBudget).toHaveBeenCalledWith(5000, 200000, 's1');
  });

  it('routes session-created to onSessionCreated', () => {
    const msg: ServerMessage = {
      type: 'session-created',
      sessionId: 's1',
    };

    routeServerMessage(msg, cbs, sendFn);

    expect(cbs.onSessionCreated).toHaveBeenCalledWith('s1');
  });

  it('routes active-sessions to onActiveSessions', () => {
    const sessions = { claude: ['s1'], codex: [], gemini: [] };
    const msg: ServerMessage = {
      type: 'active-sessions',
      sessions,
    };

    routeServerMessage(msg, cbs, sendFn);

    expect(cbs.onActiveSessions).toHaveBeenCalledWith(sessions);
  });

  it('routes claude-response through to routeClaudeResponse', () => {
    const msg: ServerMessage = {
      type: 'claude-response',
      data: {
        type: 'assistant',
        message: { content: [{ type: 'text', text: 'streamed token' }] },
        session_id: 's1',
      },
      sessionId: 's1',
    };

    routeServerMessage(msg, cbs, sendFn);

    expect(cbs.onContentToken).toHaveBeenCalledWith('streamed token');
  });

  it('logs codex/gemini messages without routing them', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const codexMsg: ServerMessage = {
      type: 'codex-response',
      data: { type: 'item', itemType: 'agent_message', message: { role: 'assistant', content: 'test' } },
      sessionId: null,
    };
    routeServerMessage(codexMsg, cbs, sendFn);

    expect(logSpy).toHaveBeenCalledWith(
      '[Multiplexer] Codex message (M4):',
      'codex-response',
    );
    expect(cbs.onContentToken).not.toHaveBeenCalled();

    const geminiMsg: ServerMessage = {
      type: 'gemini-complete',
      sessionId: 'g1',
    };
    routeServerMessage(geminiMsg, cbs, sendFn);

    expect(logSpy).toHaveBeenCalledWith(
      '[Multiplexer] Gemini message (M4):',
      'gemini-complete',
    );

    logSpy.mockRestore();
  });

  it('routes generic error to onError with null sessionId', () => {
    const msg: ServerMessage = {
      type: 'error',
      error: 'Internal server error',
    };

    routeServerMessage(msg, cbs, sendFn);

    expect(cbs.onError).toHaveBeenCalledWith('Internal server error', null);
  });

  it('routes session-aborted to onSessionAborted', () => {
    const msg: ServerMessage = {
      type: 'session-aborted',
      sessionId: 's1',
      provider: 'claude',
      success: true,
    };

    routeServerMessage(msg, cbs, sendFn);

    expect(cbs.onSessionAborted).toHaveBeenCalledWith('s1', 'claude', true);
  });

  it('routes session-status to onSessionStatus', () => {
    const msg: ServerMessage = {
      type: 'session-status',
      sessionId: 's1',
      provider: 'claude',
      isProcessing: true,
    };

    routeServerMessage(msg, cbs, sendFn);

    expect(cbs.onSessionStatus).toHaveBeenCalledWith('s1', 'claude', true);
  });

  it('routes projects_updated to onProjectsUpdated callback', () => {
    const msg: ServerMessage = {
      type: 'projects_updated',
      projects: [],
      timestamp: '2026-01-01T00:00:00Z',
      changeType: 'update',
      changedFile: 'test.ts',
      watchProvider: 'fs',
    };

    routeServerMessage(msg, cbs, sendFn);

    expect(cbs.onProjectsUpdated).toHaveBeenCalledOnce();
  });
});

describe('getToolActivityText', () => {
  it('returns reading text for Read tool', () => {
    expect(getToolActivityText('Read', { file_path: 'auth.ts' })).toBe(
      'Reading auth.ts...',
    );
  });

  it('returns writing text for Write tool', () => {
    expect(getToolActivityText('Write', { file_path: 'server.js' })).toBe(
      'Writing server.js...',
    );
  });

  it('returns running text for Bash tool with truncation', () => {
    expect(getToolActivityText('Bash', { command: 'npm test' })).toBe(
      'Running npm test...',
    );
  });

  it('truncates long Bash commands at 50 chars', () => {
    const longCmd = 'a'.repeat(60);
    const result = getToolActivityText('Bash', { command: longCmd });
    expect(result).toBe(`Running ${'a'.repeat(50)}......`);
  });

  it('returns searching text for Grep tool', () => {
    expect(getToolActivityText('Grep', { pattern: 'TODO' })).toBe(
      'Searching for TODO...',
    );
  });

  it('returns default text for unknown tool', () => {
    expect(getToolActivityText('UnknownTool', {})).toBe(
      'Using UnknownTool...',
    );
  });

  it('returns editing text for Edit tool', () => {
    expect(getToolActivityText('Edit', { file_path: 'config.ts' })).toBe(
      'Editing config.ts...',
    );
  });

  it('returns searching for files text for Glob tool', () => {
    expect(getToolActivityText('Glob', { pattern: '*.ts' })).toBe(
      'Searching for files...',
    );
  });

  it('returns fetching text for WebFetch tool', () => {
    expect(
      getToolActivityText('WebFetch', { url: 'https://example.com' }),
    ).toBe('Fetching https://example.com...');
  });

  it('handles missing input fields gracefully', () => {
    expect(getToolActivityText('Read', {})).toBe('Reading...');
    expect(getToolActivityText('Bash', {})).toBe('Running...');
    expect(getToolActivityText('Grep', {})).toBe('Searching...');
  });

  it('strips ANSI escape codes from Bash commands', () => {
    expect(
      getToolActivityText('Bash', { command: '\x1b[32mnpm test\x1b[0m' }),
    ).toBe('Running npm test...');
  });
});
