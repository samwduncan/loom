/**
 * ToolCardShell component tests -- covers header rendering, expand/collapse,
 * error state treatment, and children rendering.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ToolCardShell } from '@/components/chat/tools/ToolCardShell';
import type { ToolCallState, ToolCallStatus } from '@/types/stream';
import type { ToolConfig } from '@/lib/tool-registry';

// Mock useElapsedTime for predictable test output
vi.mock('@/hooks/useElapsedTime', () => ({
  useElapsedTime: () => '1.2s',
}));

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

function TestIcon() {
  return <span data-testid="test-icon">IC</span>;
}

function makeConfig(overrides: Partial<ToolConfig> = {}): ToolConfig {
  return {
    displayName: 'Bash',
    icon: TestIcon,
    getChipLabel: () => 'ls -la',
    renderCard: () => <div>card</div>,
    ...overrides,
  };
}

describe('ToolCardShell', () => {
  it('renders header with tool name and status label', () => {
    render(
      <ToolCardShell
        toolCall={makeToolCall()}
        config={makeConfig()}
        isExpanded={false}
      >
        <div>content</div>
      </ToolCardShell>,
    );

    expect(screen.getByText('Bash')).toBeInTheDocument();
    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  it('renders elapsed time in header', () => {
    render(
      <ToolCardShell
        toolCall={makeToolCall()}
        config={makeConfig()}
        isExpanded={false}
      >
        <div>content</div>
      </ToolCardShell>,
    );

    // Middle dot + elapsed
    expect(screen.getByText('\u00B7 1.2s')).toBeInTheDocument();
  });

  it('renders correct status labels for each status', () => {
    const cases: [ToolCallStatus, string][] = [
      ['invoked', 'Starting'],
      ['executing', 'Running'],
      ['resolved', 'Done'],
      ['rejected', 'Failed'],
    ];

    for (const [status, label] of cases) {
      const { unmount } = render(
        <ToolCardShell
          toolCall={makeToolCall({ status })}
          config={makeConfig()}
          isExpanded={false}
        >
          <div>content</div>
        </ToolCardShell>,
      );
      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    }
  });

  it('body has data-expanded="true" when isExpanded=true', () => {
    const { container } = render(
      <ToolCardShell
        toolCall={makeToolCall()}
        config={makeConfig()}
        isExpanded={true}
      >
        <div>content</div>
      </ToolCardShell>,
    );

    const body = container.querySelector('.tool-card-shell-body');
    expect(body?.getAttribute('data-expanded')).toBe('true');
  });

  it('body has data-expanded="false" when isExpanded=false', () => {
    const { container } = render(
      <ToolCardShell
        toolCall={makeToolCall()}
        config={makeConfig()}
        isExpanded={false}
      >
        <div>content</div>
      </ToolCardShell>,
    );

    const body = container.querySelector('.tool-card-shell-body');
    expect(body?.getAttribute('data-expanded')).toBe('false');
  });

  it('error state renders AlertTriangle icon', () => {
    render(
      <ToolCardShell
        toolCall={makeToolCall({ status: 'rejected', isError: true })}
        config={makeConfig()}
        isExpanded={true}
      >
        <div>error content</div>
      </ToolCardShell>,
    );

    expect(screen.getByTestId('tool-card-shell-error-icon')).toBeInTheDocument();
  });

  it('no AlertTriangle icon for non-error states', () => {
    render(
      <ToolCardShell
        toolCall={makeToolCall({ status: 'resolved' })}
        config={makeConfig()}
        isExpanded={false}
      >
        <div>content</div>
      </ToolCardShell>,
    );

    expect(screen.queryByTestId('tool-card-shell-error-icon')).toBeNull();
  });

  it('error state has data-status="rejected" on root', () => {
    render(
      <ToolCardShell
        toolCall={makeToolCall({ status: 'rejected', isError: true })}
        config={makeConfig()}
        isExpanded={true}
      >
        <div>error content</div>
      </ToolCardShell>,
    );

    const root = screen.getByTestId('tool-card-shell');
    expect(root.getAttribute('data-status')).toBe('rejected');
  });

  it('children render inside body', () => {
    render(
      <ToolCardShell
        toolCall={makeToolCall()}
        config={makeConfig()}
        isExpanded={true}
      >
        <div data-testid="child-content">child here</div>
      </ToolCardShell>,
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('child here')).toBeInTheDocument();
  });

  it('renders tool icon from config', () => {
    render(
      <ToolCardShell
        toolCall={makeToolCall()}
        config={makeConfig()}
        isExpanded={false}
      >
        <div>content</div>
      </ToolCardShell>,
    );

    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });
});
