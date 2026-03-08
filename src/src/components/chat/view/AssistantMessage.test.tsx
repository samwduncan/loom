/**
 * AssistantMessage tests — covers provider header, historical thinking
 * blocks, and markdown rendering for assistant messages.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AssistantMessage } from '@/components/chat/view/AssistantMessage';
import type { Message } from '@/types/message';

// Mock useUIStore to provide thinkingExpanded
vi.mock('@/stores/ui', () => ({
  useUIStore: (selector: (state: { thinkingExpanded: boolean }) => unknown) =>
    selector({ thinkingExpanded: true }),
}));

// Mock MarkdownRenderer to avoid heavy dependencies
vi.mock('@/components/chat/view/MarkdownRenderer', () => ({
  MarkdownRenderer: ({ content }: { content: string }) => (
    <div data-testid="markdown-renderer">{content}</div>
  ),
}));

function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 'msg-1',
    role: 'assistant',
    content: 'Hello, world!',
    metadata: {
      timestamp: '2026-03-07T00:00:00Z',
      tokenCount: null,
      inputTokens: null,
      outputTokens: null,
      cacheReadTokens: null,
      cost: null,
      duration: null,
    },
    providerContext: {
      providerId: 'claude',
      modelId: 'claude-sonnet-4-20250514',
      agentName: null,
    },
    ...overrides,
  };
}

describe('AssistantMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders ProviderHeader with provider name', () => {
    render(<AssistantMessage message={makeMessage()} />);
    expect(screen.getByTestId('provider-header')).toBeInTheDocument();
    expect(screen.getByText('Claude')).toBeInTheDocument();
  });

  it('renders ProviderHeader for gemini provider', () => {
    render(
      <AssistantMessage
        message={makeMessage({
          providerContext: { providerId: 'gemini', modelId: 'gemini-2.5-pro', agentName: null },
        })}
      />,
    );
    expect(screen.getByText('Gemini')).toBeInTheDocument();
  });

  it('renders ThinkingDisclosure when message has thinkingBlocks', () => {
    render(
      <AssistantMessage
        message={makeMessage({
          thinkingBlocks: [
            { id: 'tb-1', text: 'Let me think about this...', isComplete: true },
          ],
        })}
      />,
    );
    expect(screen.getByTestId('thinking-disclosure')).toBeInTheDocument();
  });

  it('does NOT render ThinkingDisclosure when thinkingBlocks is empty', () => {
    render(
      <AssistantMessage message={makeMessage({ thinkingBlocks: [] })} />,
    );
    expect(screen.queryByTestId('thinking-disclosure')).toBeNull();
  });

  it('does NOT render ThinkingDisclosure when thinkingBlocks is undefined', () => {
    render(<AssistantMessage message={makeMessage()} />);
    expect(screen.queryByTestId('thinking-disclosure')).toBeNull();
  });

  it('renders MarkdownRenderer with content', () => {
    render(<AssistantMessage message={makeMessage()} />);
    expect(screen.getByTestId('markdown-renderer')).toBeInTheDocument();
    expect(screen.getByText('Hello, world!')).toBeInTheDocument();
  });

  it('renders components in correct order: ProviderHeader > ThinkingDisclosure > content', () => {
    const { container } = render(
      <AssistantMessage
        message={makeMessage({
          thinkingBlocks: [
            { id: 'tb-1', text: 'Thinking hard...', isComplete: true },
          ],
        })}
      />,
    );

    const providerHeader = container.querySelector('[data-testid="provider-header"]');
    const thinking = container.querySelector('[data-testid="thinking-disclosure"]');
    const markdown = container.querySelector('[data-testid="markdown-renderer"]');

    expect(providerHeader).not.toBeNull();
    expect(thinking).not.toBeNull();
    expect(markdown).not.toBeNull();

    // Verify DOM order: provider-header before thinking-disclosure before markdown
    const allTestIds = Array.from(container.querySelectorAll('[data-testid]'))
      .map((el) => el.getAttribute('data-testid'));
    const headerIdx = allTestIds.indexOf('provider-header');
    const thinkingIdx = allTestIds.indexOf('thinking-disclosure');
    const markdownIdx = allTestIds.indexOf('markdown-renderer');

    expect(headerIdx).toBeLessThan(thinkingIdx);
    expect(thinkingIdx).toBeLessThan(markdownIdx);
  });
});
