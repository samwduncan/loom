/**
 * ToolChip component tests -- covers COMP-01 chip rendering requirement.
 * Tests status dot colors, icon/label rendering, expand/collapse via ToolCardShell,
 * elapsed time display, error force-expand, and adjust-state-during-rendering.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ToolChip } from '@/components/chat/tools/ToolChip';
import type { ToolCallState, ToolCallStatus } from '@/types/stream';

// Mock useElapsedTime to control elapsed display
vi.mock('@/hooks/useElapsedTime', () => ({
  useElapsedTime: vi.fn(() => ''),
}));

import { useElapsedTime } from '@/hooks/useElapsedTime';
const mockUseElapsedTime = vi.mocked(useElapsedTime);

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
  beforeEach(() => {
    mockUseElapsedTime.mockReturnValue('');
  });

  it('renders status dot with correct CSS class for each status', () => {
    const statuses: ToolCallStatus[] = ['invoked', 'executing', 'resolved', 'rejected'];
    for (const status of statuses) {
      const { container, unmount } = render(
        <ToolChip toolCall={makeToolCall({ status, isError: status === 'rejected' })} />,
      );
      const dot = container.querySelector('.tool-chip-dot');
      expect(dot).not.toBeNull();
      expect(dot?.classList.contains(`tool-chip-dot--${status}`)).toBe(true);
      unmount();
    }
  });

  it('renders Lucide icon from tool config', () => {
    const { container } = render(
      <ToolChip toolCall={makeToolCall()} />,
    );
    // Lucide icons render as SVG elements inside the chip button
    const svg = container.querySelector('button.tool-chip svg');
    expect(svg).not.toBeNull();
  });

  it('renders tool display name on chip button', () => {
    const { container } = render(<ToolChip toolCall={makeToolCall()} />);
    const chipName = container.querySelector('button.tool-chip .tool-chip-name');
    expect(chipName).not.toBeNull();
    expect(chipName?.textContent).toBe('Bash');
  });

  it('renders chip label from getChipLabel', () => {
    const { container } = render(
      <ToolChip toolCall={makeToolCall({ input: { command: 'echo hello' } })} />,
    );
    const label = container.querySelector('button.tool-chip .tool-chip-label');
    expect(label).not.toBeNull();
    expect(label?.textContent).toBe('echo hello');
  });

  it('click toggles ToolCardShell expanded state', () => {
    const { container } = render(
      <ToolChip toolCall={makeToolCall({ output: 'hello world', status: 'resolved' })} />,
    );
    const button = container.querySelector('button.tool-chip');
    expect(button).not.toBeNull();

    // Initially collapsed
    expect(button?.getAttribute('aria-expanded')).toBe('false');
    const shell = container.querySelector('[data-testid="tool-card-shell"]');
    expect(shell?.getAttribute('data-expanded')).toBe('false');

    // Click to expand
    fireEvent.click(button!); // ASSERT: button confirmed non-null by expect above
    expect(button?.getAttribute('aria-expanded')).toBe('true');
    expect(shell?.getAttribute('data-expanded')).toBe('true');

    // Click to collapse
    fireEvent.click(button!); // ASSERT: button confirmed non-null by expect above
    expect(button?.getAttribute('aria-expanded')).toBe('false');
    expect(shell?.getAttribute('data-expanded')).toBe('false');
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
    fireEvent.click(button!); // ASSERT: ToolChip always renders a button element

    const shell = container.querySelector('[data-testid="tool-card-shell"]');
    expect(shell).not.toBeNull();
    expect(shell?.textContent).toContain('npm test');
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
    fireEvent.click(button!); // ASSERT: ToolChip always renders a button element

    const shell = container.querySelector('[data-testid="tool-card-shell"]');
    expect(shell?.textContent).toContain('test output here');
  });

  it('ToolCard shows error output when isError is true', () => {
    const { container } = render(
      <ToolChip
        toolCall={makeToolCall({
          output: 'error message',
          isError: true,
          status: 'rejected',
        })}
      />,
    );
    // Error tools start expanded, so no need to click
    // BashToolCard applies status-error styling via Tailwind class
    const shell = container.querySelector('[data-testid="tool-card-shell"]');
    expect(shell).not.toBeNull();
    expect(shell?.textContent).toContain('error message');
  });

  it('renders correctly for unknown tool names', () => {
    const { container } = render(
      <ToolChip toolCall={makeToolCall({ toolName: 'CustomTool', input: { foo: 'bar' } })} />,
    );
    const chipName = container.querySelector('button.tool-chip .tool-chip-name');
    expect(chipName?.textContent).toBe('CustomTool');
    // Unknown tools get Wrench Lucide icon (SVG)
    const svg = container.querySelector('button.tool-chip svg');
    expect(svg).not.toBeNull();
  });

  // --- New tests for Plan 02 ---

  it('error tool call starts expanded', () => {
    const { container } = render(
      <ToolChip
        toolCall={makeToolCall({
          status: 'rejected',
          isError: true,
          output: 'failed',
        })}
      />,
    );
    const button = container.querySelector('button.tool-chip');
    expect(button?.getAttribute('aria-expanded')).toBe('true');
    const shell = container.querySelector('[data-testid="tool-card-shell"]');
    expect(shell?.getAttribute('data-expanded')).toBe('true');
  });

  it('auto-expands when tool transitions to rejected status', () => {
    const toolCall = makeToolCall({ status: 'executing' });
    const { container, rerender } = render(<ToolChip toolCall={toolCall} />);

    // Initially collapsed
    const button = container.querySelector('button.tool-chip');
    expect(button?.getAttribute('aria-expanded')).toBe('false');

    // Rerender with rejected status
    rerender(
      <ToolChip
        toolCall={makeToolCall({ status: 'rejected', isError: true, output: 'err' })}
      />,
    );
    expect(button?.getAttribute('aria-expanded')).toBe('true');
  });

  it('displays elapsed time with middle dot separator', () => {
    mockUseElapsedTime.mockReturnValue('2.3s');
    const { container } = render(
      <ToolChip toolCall={makeToolCall({ status: 'executing' })} />,
    );
    const separator = container.querySelector('.tool-chip-separator');
    expect(separator).not.toBeNull();
    expect(separator?.textContent).toBe('\u00B7');

    const elapsedEl = container.querySelector('.tool-chip-elapsed');
    expect(elapsedEl).not.toBeNull();
    expect(elapsedEl?.textContent).toBe('2.3s');
  });

  it('does not display elapsed time when hook returns empty string', () => {
    mockUseElapsedTime.mockReturnValue('');
    const { container } = render(
      <ToolChip toolCall={makeToolCall()} />,
    );
    const separator = container.querySelector('.tool-chip-separator');
    expect(separator).toBeNull();
    const elapsedEl = container.querySelector('.tool-chip-elapsed');
    expect(elapsedEl).toBeNull();
  });

  it('rejected chip has tool-chip--rejected class', () => {
    const { container } = render(
      <ToolChip
        toolCall={makeToolCall({ status: 'rejected', isError: true })}
      />,
    );
    const button = container.querySelector('button.tool-chip');
    expect(button?.classList.contains('tool-chip--rejected')).toBe(true);
  });

  it('ToolCardShell is always mounted (not conditionally rendered)', () => {
    const { container } = render(
      <ToolChip toolCall={makeToolCall()} />,
    );
    // Shell is always in DOM, even when collapsed
    const shell = container.querySelector('[data-testid="tool-card-shell"]');
    expect(shell).not.toBeNull();
    expect(shell?.getAttribute('data-expanded')).toBe('false');
  });
});
