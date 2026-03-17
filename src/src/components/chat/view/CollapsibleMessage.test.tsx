/**
 * CollapsibleMessage tests -- collapsed summary and expanded content.
 *
 * Tests verify:
 * - Collapsed state renders summary with role label, truncated content, tool count
 * - Expanded state renders children normally
 * - Click on collapsed summary calls onToggle
 * - Tool count badge shown when toolCallCount > 0
 * - Content truncated to 80 chars with ellipsis
 * - Children unmounted when collapsed (no hidden DOM trees)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CollapsibleMessage } from './CollapsibleMessage';

const defaultProps = {
  role: 'assistant',
  content: 'This is a test message with some content that we want to see truncated when collapsed.',
  toolCallCount: 0,
  isCollapsed: false,
  onToggle: vi.fn(),
};

describe('CollapsibleMessage', () => {
  it('renders children when expanded', () => {
    render(
      <CollapsibleMessage {...defaultProps} isCollapsed={false}>
        <div data-testid="child-content">Full message content</div>
      </CollapsibleMessage>,
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.queryByTestId('collapsed-summary')).not.toBeInTheDocument();
  });

  it('renders collapsed summary when isCollapsed is true', () => {
    render(
      <CollapsibleMessage {...defaultProps} isCollapsed={true}>
        <div data-testid="child-content">Full message content</div>
      </CollapsibleMessage>,
    );

    expect(screen.getByTestId('collapsed-summary')).toBeInTheDocument();
    // Children should NOT be in the DOM when collapsed
    expect(screen.queryByTestId('child-content')).not.toBeInTheDocument();
  });

  it('shows "You" label for user messages', () => {
    render(
      <CollapsibleMessage {...defaultProps} role="user" isCollapsed={true}>
        <div>content</div>
      </CollapsibleMessage>,
    );

    expect(screen.getByTestId('collapsed-summary')).toHaveTextContent('You');
  });

  it('shows "Claude" label for assistant messages', () => {
    render(
      <CollapsibleMessage {...defaultProps} role="assistant" isCollapsed={true}>
        <div>content</div>
      </CollapsibleMessage>,
    );

    expect(screen.getByTestId('collapsed-summary')).toHaveTextContent('Claude');
  });

  it('truncates content to 80 chars with ellipsis', () => {
    const longContent = 'A'.repeat(120);
    render(
      <CollapsibleMessage {...defaultProps} content={longContent} isCollapsed={true}>
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
      <CollapsibleMessage {...defaultProps} content="Short" isCollapsed={true}>
        <div>content</div>
      </CollapsibleMessage>,
    );

    const summary = screen.getByTestId('collapsed-summary');
    expect(summary.textContent).toContain('Short');
    expect(summary.textContent).not.toContain('...');
  });

  it('shows tool count badge when toolCallCount > 0', () => {
    render(
      <CollapsibleMessage {...defaultProps} toolCallCount={3} isCollapsed={true}>
        <div>content</div>
      </CollapsibleMessage>,
    );

    expect(screen.getByTestId('collapsed-summary')).toHaveTextContent('3 tools');
  });

  it('calls onToggle when collapsed summary is clicked', () => {
    const onToggle = vi.fn();
    render(
      <CollapsibleMessage {...defaultProps} isCollapsed={true} onToggle={onToggle}>
        <div>content</div>
      </CollapsibleMessage>,
    );

    fireEvent.click(screen.getByTestId('collapsed-summary'));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('has collapsible-wrapper data-testid on outer div', () => {
    render(
      <CollapsibleMessage {...defaultProps} isCollapsed={false}>
        <div>content</div>
      </CollapsibleMessage>,
    );

    expect(screen.getByTestId('collapsible-wrapper')).toBeInTheDocument();
  });

  it('uses first line only (before newline) for summary', () => {
    render(
      <CollapsibleMessage {...defaultProps} content={'First line\nSecond line\nThird line'} isCollapsed={true}>
        <div>content</div>
      </CollapsibleMessage>,
    );

    const summary = screen.getByTestId('collapsed-summary');
    expect(summary.textContent).toContain('First line');
    expect(summary.textContent).not.toContain('Second line');
  });
});
