/**
 * CollapsibleMessage tests -- collapsed summary and expanded content.
 *
 * Tests verify:
 * - Collapsed state renders summary with role label, truncated content, tool count
 * - Expanded state renders children normally
 * - Click on collapsed summary calls onToggle
 * - Tool count badge shown when toolCalls present
 * - Content truncated to 80 chars with ellipsis
 * - CSS grid wrapper has correct data-testid
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CollapsibleMessage } from './CollapsibleMessage';
import type { Message } from '@/types/message';

function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 'msg-1',
    role: 'assistant',
    content: 'This is a test message with some content that we want to see truncated when collapsed.',
    metadata: {
      timestamp: new Date().toISOString(),
      tokenCount: null,
      inputTokens: null,
      outputTokens: null,
      cacheReadTokens: null,
      cost: null,
      duration: null,
    },
    providerContext: { providerId: 'claude', modelId: '', agentName: null },
    ...overrides,
  };
}

describe('CollapsibleMessage', () => {
  it('renders children when expanded', () => {
    render(
      <CollapsibleMessage
        message={makeMessage()}
        isCollapsed={false}
        onToggle={vi.fn()}
      >
        <div data-testid="child-content">Full message content</div>
      </CollapsibleMessage>,
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.queryByTestId('collapsed-summary')).not.toBeInTheDocument();
  });

  it('renders collapsed summary when isCollapsed is true', () => {
    render(
      <CollapsibleMessage
        message={makeMessage()}
        isCollapsed={true}
        onToggle={vi.fn()}
      >
        <div data-testid="child-content">Full message content</div>
      </CollapsibleMessage>,
    );

    const summary = screen.getByTestId('collapsed-summary');
    expect(summary).toBeInTheDocument();
    // Children should be hidden (grid-template-rows: 0fr)
  });

  it('shows "You" label for user messages', () => {
    render(
      <CollapsibleMessage
        message={makeMessage({ role: 'user' })}
        isCollapsed={true}
        onToggle={vi.fn()}
      >
        <div>content</div>
      </CollapsibleMessage>,
    );

    expect(screen.getByTestId('collapsed-summary')).toHaveTextContent('You');
  });

  it('shows "Claude" label for assistant messages', () => {
    render(
      <CollapsibleMessage
        message={makeMessage({ role: 'assistant' })}
        isCollapsed={true}
        onToggle={vi.fn()}
      >
        <div>content</div>
      </CollapsibleMessage>,
    );

    expect(screen.getByTestId('collapsed-summary')).toHaveTextContent('Claude');
  });

  it('truncates content to 80 chars with ellipsis', () => {
    const longContent = 'A'.repeat(120);
    render(
      <CollapsibleMessage
        message={makeMessage({ content: longContent })}
        isCollapsed={true}
        onToggle={vi.fn()}
      >
        <div>content</div>
      </CollapsibleMessage>,
    );

    const summary = screen.getByTestId('collapsed-summary');
    // Should have first 80 chars + ellipsis
    expect(summary.textContent).toContain('A'.repeat(80));
    expect(summary.textContent).toContain('...');
    expect(summary.textContent).not.toContain('A'.repeat(81));
  });

  it('does not add ellipsis for short content', () => {
    render(
      <CollapsibleMessage
        message={makeMessage({ content: 'Short' })}
        isCollapsed={true}
        onToggle={vi.fn()}
      >
        <div>content</div>
      </CollapsibleMessage>,
    );

    const summary = screen.getByTestId('collapsed-summary');
    expect(summary.textContent).toContain('Short');
    // No ellipsis for short content
    expect(summary.textContent).not.toContain('...');
  });

  it('shows tool count badge when toolCalls present', () => {
    const message = makeMessage({
      toolCalls: [
        { id: 't1', toolName: 'Read', input: {}, output: null, isError: false, parentToolUseId: null },
        { id: 't2', toolName: 'Edit', input: {}, output: null, isError: false, parentToolUseId: null },
        { id: 't3', toolName: 'Bash', input: {}, output: null, isError: false, parentToolUseId: null },
      ],
    });

    render(
      <CollapsibleMessage
        message={message}
        isCollapsed={true}
        onToggle={vi.fn()}
      >
        <div>content</div>
      </CollapsibleMessage>,
    );

    expect(screen.getByTestId('collapsed-summary')).toHaveTextContent('3 tools');
  });

  it('calls onToggle when collapsed summary is clicked', () => {
    const onToggle = vi.fn();
    render(
      <CollapsibleMessage
        message={makeMessage()}
        isCollapsed={true}
        onToggle={onToggle}
      >
        <div>content</div>
      </CollapsibleMessage>,
    );

    fireEvent.click(screen.getByTestId('collapsed-summary'));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('has collapsible-wrapper data-testid on outer div', () => {
    render(
      <CollapsibleMessage
        message={makeMessage()}
        isCollapsed={false}
        onToggle={vi.fn()}
      >
        <div>content</div>
      </CollapsibleMessage>,
    );

    expect(screen.getByTestId('collapsible-wrapper')).toBeInTheDocument();
  });

  it('uses first line only (before newline) for summary', () => {
    render(
      <CollapsibleMessage
        message={makeMessage({ content: 'First line\nSecond line\nThird line' })}
        isCollapsed={true}
        onToggle={vi.fn()}
      >
        <div>content</div>
      </CollapsibleMessage>,
    );

    const summary = screen.getByTestId('collapsed-summary');
    expect(summary.textContent).toContain('First line');
    expect(summary.textContent).not.toContain('Second line');
  });
});
