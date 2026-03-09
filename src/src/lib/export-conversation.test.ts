/**
 * export-conversation tests -- Markdown and JSON export for chat messages.
 *
 * Mocks the download mechanism (Blob + URL.createObjectURL + anchor click).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportAsMarkdown, exportAsJSON, slugify } from './export-conversation';
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

// ---------------------------------------------------------------------------
// Mocks: capture downloadFile behavior
// ---------------------------------------------------------------------------

let capturedContent: string = '';

beforeEach(() => {
  capturedContent = '';

  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: vi.fn(() => 'blob:mock-url'),
    revokeObjectURL: vi.fn(),
  });

  const mockAnchor = {
    href: '',
    download: '',
    click: vi.fn(),
  };
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'a') {
      return mockAnchor as unknown as HTMLAnchorElement;
    }
    return document.createElement(tag);
  });

  const OrigBlob = globalThis.Blob;
  vi.stubGlobal('Blob', class MockBlob extends OrigBlob {
    constructor(parts?: BlobPart[], options?: BlobPropertyBag) {
      super(parts, options);
      if (parts) {
        capturedContent = parts.map(p => String(p)).join('');
      }
    }
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// slugify
// ---------------------------------------------------------------------------

describe('slugify', () => {
  it('lowercases and replaces non-alphanumeric with hyphens', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('trims leading/trailing hyphens', () => {
    expect(slugify('  My Session  ')).toBe('my-session');
  });

  it('collapses consecutive hyphens', () => {
    expect(slugify('a & b --- c')).toBe('a-b-c');
  });
});

// ---------------------------------------------------------------------------
// exportAsMarkdown
// ---------------------------------------------------------------------------

describe('exportAsMarkdown', () => {
  it('includes title heading', () => {
    const messages = [makeMessage({ id: '1', content: 'Hi there' })];
    exportAsMarkdown(messages, 'Test Session');
    expect(capturedContent).toContain('# Test Session');
  });

  it('formats user messages with ## User heading', () => {
    const messages = [makeMessage({ id: '1', content: 'Hello' })];
    exportAsMarkdown(messages, 'Session');
    expect(capturedContent).toContain('## User\n\nHello');
  });

  it('formats assistant messages with ## Assistant heading', () => {
    const messages = [makeMessage({ id: '1', content: 'Response here', role: 'assistant' })];
    exportAsMarkdown(messages, 'Session');
    expect(capturedContent).toContain('## Assistant\n\nResponse here');
  });

  it('includes tool call summaries', () => {
    const messages = [makeMessage({
      id: '1',
      content: 'Done',
      role: 'assistant',
      toolCalls: [{
        id: 'tc1',
        toolName: 'Read',
        input: { file_path: 'src/index.ts' },
        output: 'file contents here',
        isError: false,
        parentToolUseId: null,
      }],
    })];
    exportAsMarkdown(messages, 'Session');
    expect(capturedContent).toContain('> **Read**:');
    expect(capturedContent).toContain('file_path');
  });

  it('includes token metadata when available', () => {
    const messages = [makeMessage({
      id: '1',
      content: 'Response',
      role: 'assistant',
      metadata: {
        timestamp: '2026-03-09T00:00:00Z',
        tokenCount: null,
        inputTokens: 100,
        outputTokens: 50,
        cacheReadTokens: null,
        cost: 0.0045,
        duration: null,
      },
    })];
    exportAsMarkdown(messages, 'Session');
    expect(capturedContent).toContain('100 in');
    expect(capturedContent).toContain('50 out');
    expect(capturedContent).toContain('$0.0045');
  });

  it('excludes thinking blocks', () => {
    const messages = [makeMessage({
      id: '1',
      content: 'Result',
      role: 'assistant',
      thinkingBlocks: [{ id: 'tb1', text: 'secret thinking', isComplete: true }],
    })];
    exportAsMarkdown(messages, 'Session');
    expect(capturedContent).not.toContain('secret thinking');
  });

  it('formats error messages', () => {
    const messages = [makeMessage({ id: '1', content: 'Something broke', role: 'error' })];
    exportAsMarkdown(messages, 'Session');
    expect(capturedContent).toContain('> **Error:** Something broke');
  });

  it('formats system messages', () => {
    const messages = [makeMessage({ id: '1', content: 'System info', role: 'system' })];
    exportAsMarkdown(messages, 'Session');
    expect(capturedContent).toContain('*System info*');
  });
});

// ---------------------------------------------------------------------------
// exportAsJSON
// ---------------------------------------------------------------------------

describe('exportAsJSON', () => {
  it('produces valid JSON with title and exportedAt', () => {
    const messages = [makeMessage({ id: '1', content: 'Hello' })];
    exportAsJSON(messages, 'Test Session');
    const parsed = JSON.parse(capturedContent);
    expect(parsed.title).toBe('Test Session');
    expect(parsed.exportedAt).toBeDefined();
    expect(parsed.messages).toHaveLength(1);
  });

  it('includes full message data with metadata', () => {
    const messages = [makeMessage({
      id: '1',
      content: 'Hello',
      metadata: {
        timestamp: '2026-03-09T00:00:00Z',
        tokenCount: 42,
        inputTokens: 100,
        outputTokens: 50,
        cacheReadTokens: 10,
        cost: 0.01,
        duration: 1500,
      },
    })];
    exportAsJSON(messages, 'Session');
    const parsed = JSON.parse(capturedContent);
    expect(parsed.messages[0].metadata.tokenCount).toBe(42);
    expect(parsed.messages[0].metadata.cost).toBe(0.01);
  });

  it('strips image binary data but keeps references', () => {
    const messages = [makeMessage({
      id: '1',
      content: 'With image',
      attachments: [{
        id: 'img1',
        url: 'data:image/png;base64,AAAA',
        name: 'screenshot.png',
        width: 800,
        height: 600,
      }],
    })];
    exportAsJSON(messages, 'Session');
    const parsed = JSON.parse(capturedContent);
    const att = parsed.messages[0].attachments[0];
    expect(att.name).toBe('screenshot.png');
    expect(att.url).not.toContain('AAAA');
  });

  it('includes tool calls with full data', () => {
    const messages = [makeMessage({
      id: '1',
      content: 'Done',
      role: 'assistant',
      toolCalls: [{
        id: 'tc1',
        toolName: 'Bash',
        input: { command: 'ls' },
        output: 'file1\nfile2',
        isError: false,
        parentToolUseId: null,
      }],
    })];
    exportAsJSON(messages, 'Session');
    const parsed = JSON.parse(capturedContent);
    expect(parsed.messages[0].toolCalls[0].toolName).toBe('Bash');
    expect(parsed.messages[0].toolCalls[0].output).toBe('file1\nfile2');
  });
});
