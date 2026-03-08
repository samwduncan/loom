/**
 * ToolCallGroup -- component tests for collapsible tool call group.
 */

import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToolCallGroup } from './ToolCallGroup';
import type { ToolCallState } from '@/types/stream';

function makeTool(overrides: Partial<ToolCallState> = {}): ToolCallState {
  return {
    id: Math.random().toString(36).slice(2, 10),
    toolName: 'Read',
    status: 'resolved',
    input: { file_path: '/test.ts' },
    output: 'ok',
    isError: false,
    startedAt: '2026-01-01T00:00:00Z',
    completedAt: '2026-01-01T00:00:01Z',
    ...overrides,
  };
}

describe('ToolCallGroup', () => {
  it('renders collapsed header with correct tool count', () => {
    const tools = [
      makeTool({ id: 'a', toolName: 'Read' }),
      makeTool({ id: 'b', toolName: 'Edit' }),
      makeTool({ id: 'c', toolName: 'Bash' }),
    ];
    render(<ToolCallGroup tools={tools} errors={[]} />);

    const header = screen.getByTestId('tool-group-header');
    expect(header).toBeInTheDocument();
    expect(header.textContent).toContain('3 tool calls');
  });

  it('renders deduplicated type summary in collapsed header', () => {
    const tools = [
      makeTool({ id: 'a', toolName: 'Read' }),
      makeTool({ id: 'b', toolName: 'Read' }),
      makeTool({ id: 'c', toolName: 'Read' }),
      makeTool({ id: 'd', toolName: 'Edit' }),
      makeTool({ id: 'e', toolName: 'Bash' }),
    ];
    render(<ToolCallGroup tools={tools} errors={[]} />);

    const summary = screen.getByTestId('tool-group-summary');
    // Should contain deduplicated counts
    expect(summary.textContent).toMatch(/Read/);
    expect(summary.textContent).toMatch(/3/);
    expect(summary.textContent).toMatch(/Edit/);
    expect(summary.textContent).toMatch(/Bash/);
  });

  it('toggles aria-expanded when header is clicked', async () => {
    const user = userEvent.setup();
    const tools = [
      makeTool({ id: 'a', toolName: 'Read' }),
      makeTool({ id: 'b', toolName: 'Edit' }),
    ];
    render(<ToolCallGroup tools={tools} errors={[]} />);

    const header = screen.getByTestId('tool-group-header');

    // Initially collapsed
    expect(header).toHaveAttribute('aria-expanded', 'false');

    // ToolChips are in the DOM (for CSS animation) but hidden by overflow
    expect(screen.getAllByTestId('tool-chip')).toHaveLength(2);

    // Click header to expand
    await user.click(header);

    // Now expanded
    expect(header).toHaveAttribute('aria-expanded', 'true');
  });

  it('renders error tools outside the group container', () => {
    const tools = [
      makeTool({ id: 'a', toolName: 'Read' }),
      makeTool({ id: 'b', toolName: 'Edit' }),
    ];
    const errors = [
      makeTool({ id: 'c', toolName: 'Bash', isError: true, status: 'rejected' }),
    ];
    render(<ToolCallGroup tools={tools} errors={errors} />);

    // Error chip should be rendered outside the group
    const errorSection = screen.getByTestId('tool-group-errors');
    expect(errorSection).toBeInTheDocument();
    const errorChips = within(errorSection).getAllByTestId('tool-chip');
    expect(errorChips).toHaveLength(1);
  });
});
