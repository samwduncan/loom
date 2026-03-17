/**
 * ToolCardShell component tests -- covers header rendering, expand/collapse,
 * error state treatment, and children rendering.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ToolCardShell } from '@/components/chat/tools/ToolCardShell';
import { useUIStore } from '@/stores/ui';
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
  beforeEach(() => {
    useUIStore.setState({ showRawParams: false });
  });

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

  it('does not render raw params section when showRawParams is false', () => {
    useUIStore.setState({ showRawParams: false });
    render(
      <ToolCardShell
        toolCall={makeToolCall({ input: { command: 'ls -la' } })}
        config={makeConfig()}
        isExpanded={true}
      >
        <div>content</div>
      </ToolCardShell>,
    );

    expect(screen.queryByTestId('raw-params')).toBeNull();
    expect(screen.queryByText('Raw Parameters')).toBeNull();
  });

  it('renders raw params section when showRawParams is true and card expanded', () => {
    useUIStore.setState({ showRawParams: true });
    render(
      <ToolCardShell
        toolCall={makeToolCall({ input: { command: 'ls -la' } })}
        config={makeConfig()}
        isExpanded={true}
      >
        <div>content</div>
      </ToolCardShell>,
    );

    expect(screen.getByText('Raw Parameters')).toBeInTheDocument();
    expect(screen.getByTestId('raw-params')).toBeInTheDocument();
  });

  it('raw params contains stringified toolCall.input', () => {
    useUIStore.setState({ showRawParams: true });
    const input = { command: 'ls -la', timeout: 5000 };
    render(
      <ToolCardShell
        toolCall={makeToolCall({ input })}
        config={makeConfig()}
        isExpanded={true}
      >
        <div>content</div>
      </ToolCardShell>,
    );

    const rawParams = screen.getByTestId('raw-params');
    expect(rawParams.textContent).toBe(JSON.stringify(input, null, 2));
  });

  it('raw params is inside a details/summary element', () => {
    useUIStore.setState({ showRawParams: true });
    render(
      <ToolCardShell
        toolCall={makeToolCall({ input: { command: 'echo hi' } })}
        config={makeConfig()}
        isExpanded={true}
      >
        <div>content</div>
      </ToolCardShell>,
    );

    const details = screen.getByTestId('raw-params').closest('details');
    expect(details).toBeInTheDocument();
    const summary = details?.querySelector('summary');
    expect(summary).toBeInTheDocument();
    expect(summary?.textContent).toBe('Raw Parameters');
  });
});
