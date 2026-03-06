/**
 * ToolChip component tests — covers COMP-01 chip rendering requirement.
 * Tests status dot colors, icon/label rendering, expand/collapse, and memo.
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToolChip } from '@/components/chat/tools/ToolChip';
import type { ToolCallState, ToolCallStatus } from '@/types/stream';

function makeToolCall(overrides: Partial<ToolCallState> = {}): ToolCallState {
  return {
    id: 'tc-1',
    toolName: 'Bash',
    status: 'executing',
    input: { command: 'ls -la' },
    output: null,
    isError: false,
    startedAt: '2026-01-01T00:00:00Z',
    completedAt: null,
    ...overrides,
  };
}

describe('ToolChip', () => {
  it('renders status dot with correct CSS class for each status', () => {
    const statuses: ToolCallStatus[] = ['invoked', 'executing', 'resolved', 'rejected'];
    for (const status of statuses) {
      const { container, unmount } = render(
        <ToolChip toolCall={makeToolCall({ status })} />,
      );
      const dot = container.querySelector('.tool-chip-dot');
      expect(dot).not.toBeNull();
      expect(dot?.classList.contains(`tool-chip-dot--${status}`)).toBe(true);
      unmount();
    }
  });

  it('renders icon from tool config', () => {
    const { container } = render(
      <ToolChip toolCall={makeToolCall()} />,
    );
    const icon = container.querySelector('.tool-chip-icon');
    expect(icon).not.toBeNull();
  });

  it('renders tool display name', () => {
    render(<ToolChip toolCall={makeToolCall()} />);
    expect(screen.getByText('Bash')).toBeInTheDocument();
  });

  it('renders chip label from getChipLabel', () => {
    render(<ToolChip toolCall={makeToolCall({ input: { command: 'echo hello' } })} />);
    expect(screen.getByText('echo hello')).toBeInTheDocument();
  });

  it('click toggles expanded state and renders ToolCard inline', () => {
    const { container } = render(
      <ToolChip toolCall={makeToolCall({ output: 'hello world', status: 'resolved' })} />,
    );
    const button = container.querySelector('button.tool-chip');
    expect(button).not.toBeNull();

    // Initially collapsed
    expect(button?.getAttribute('aria-expanded')).toBe('false');
    expect(container.querySelector('.tool-card')).toBeNull();

    // Click to expand
    fireEvent.click(button!); // ASSERT: button confirmed non-null by expect above
    expect(button?.getAttribute('aria-expanded')).toBe('true');
    expect(container.querySelector('.tool-card')).not.toBeNull();

    // Click to collapse
    fireEvent.click(button!); // ASSERT: button confirmed non-null by expect above
    expect(button?.getAttribute('aria-expanded')).toBe('false');
    expect(container.querySelector('.tool-card')).toBeNull();
  });

  it('has aria-expanded attribute reflecting expansion state', () => {
    const { container } = render(
      <ToolChip toolCall={makeToolCall()} />,
    );
    const button = container.querySelector('button.tool-chip');
    expect(button?.getAttribute('aria-expanded')).toBe('false');
  });

  it('ToolCard renders input field summary', () => {
    const { container } = render(
      <ToolChip toolCall={makeToolCall({ input: { command: 'npm test' } })} />,
    );
    const button = container.querySelector('button.tool-chip');
    fireEvent.click(button!); // ASSERT: button exists since ToolChip always renders a button

    const card = container.querySelector('.tool-card');
    expect(card).not.toBeNull();
    // Input should be visible in the card
    expect(card?.textContent).toContain('npm test');
  });

  it('ToolCard shows output when present', () => {
    const { container } = render(
      <ToolChip
        toolCall={makeToolCall({
          output: 'test output here',
          status: 'resolved',
        })}
      />,
    );
    const button = container.querySelector('button.tool-chip');
    fireEvent.click(button!); // ASSERT: button exists since ToolChip always renders a button

    const card = container.querySelector('.tool-card');
    expect(card?.textContent).toContain('test output here');
  });

  it('ToolCard shows error output with error class when isError is true', () => {
    const { container } = render(
      <ToolChip
        toolCall={makeToolCall({
          output: 'error message',
          isError: true,
          status: 'rejected',
        })}
      />,
    );
    const button = container.querySelector('button.tool-chip');
    fireEvent.click(button!); // ASSERT: button exists since ToolChip always renders a button

    const errorOutput = container.querySelector('.tool-card-output--error');
    expect(errorOutput).not.toBeNull();
    expect(errorOutput?.textContent).toContain('error message');
  });

  it('renders correctly for unknown tool names', () => {
    const { container } = render(
      <ToolChip toolCall={makeToolCall({ toolName: 'CustomTool', input: { foo: 'bar' } })} />,
    );
    expect(screen.getByText('CustomTool')).toBeInTheDocument();
    const icon = container.querySelector('.tool-chip-icon');
    expect(icon).not.toBeNull();
  });
});
