/**
 * LiveAnnouncer and useStreamAnnouncements tests.
 *
 * Uses fake timers for the 100ms clear-then-set timeout in LiveAnnouncer.
 * Mocks useStreamStore for the announcements hook.
 *
 * Constitution: Named imports (2.2), vitest conventions.
 */

import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LiveAnnouncer } from '@/components/a11y/LiveAnnouncer';
import type { ToolCallState } from '@/types/stream';

// ---------------------------------------------------------------------------
// LiveAnnouncer component tests
// ---------------------------------------------------------------------------

describe('LiveAnnouncer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders sr-only region with message after timeout', () => {
    render(<LiveAnnouncer message="hello" />);
    const el = screen.getByTestId('live-announcer');
    expect(el).toHaveClass('sr-only');
    expect(el).toHaveAttribute('role', 'status');
    expect(el).toHaveAttribute('aria-live', 'polite');

    // Initially cleared, then set after 100ms
    expect(el).toHaveTextContent('');
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(el).toHaveTextContent('hello');
  });

  it('re-announces when message changes', () => {
    const { rerender } = render(<LiveAnnouncer message="first" />);
    const el = screen.getByTestId('live-announcer');

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(el).toHaveTextContent('first');

    rerender(<LiveAnnouncer message="second" />);
    // Clears immediately
    expect(el).toHaveTextContent('');
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(el).toHaveTextContent('second');
  });

  it('clears text when message becomes empty', () => {
    const { rerender } = render(<LiveAnnouncer message="active" />);
    act(() => {
      vi.advanceTimersByTime(100);
    });

    rerender(<LiveAnnouncer message="" />);
    expect(screen.getByTestId('live-announcer')).toHaveTextContent('');
  });
});

// ---------------------------------------------------------------------------
// useStreamAnnouncements hook tests
// ---------------------------------------------------------------------------

// Build a mock store state that we can mutate between renders
let mockIsStreaming = false;
let mockActiveToolCalls: ToolCallState[] = [];

vi.mock('@/stores/stream', () => ({
  useStreamStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      isStreaming: mockIsStreaming,
      activeToolCalls: mockActiveToolCalls,
    }),
}));

// Import after mock setup
const { useStreamAnnouncements } = await import(
  '@/components/a11y/useStreamAnnouncements'
);

/** Renders the hook and returns its current value via a ref. */
function AnnouncementHarness() {
  const message = useStreamAnnouncements();
  return <span data-testid="announcement">{message}</span>;
}

function createToolCall(overrides?: Partial<ToolCallState>): ToolCallState {
  return {
    id: `tc-${Math.random().toString(36).slice(2, 8)}`,
    toolName: 'Read',
    status: 'invoked',
    input: { file_path: '/test.ts' },
    output: null,
    isError: false,
    startedAt: '2026-03-17T00:00:00Z',
    completedAt: null,
    ...overrides,
  };
}

describe('useStreamAnnouncements', () => {
  beforeEach(() => {
    mockIsStreaming = false;
    mockActiveToolCalls = [];
  });

  it('announces streaming start', () => {
    const { rerender } = render(<AnnouncementHarness />);
    const el = screen.getByTestId('announcement');

    // Start streaming
    mockIsStreaming = true;
    rerender(<AnnouncementHarness />);

    expect(el).toHaveTextContent('Assistant is responding');
  });

  it('announces streaming end', () => {
    // Start streaming first
    mockIsStreaming = true;
    const { rerender } = render(<AnnouncementHarness />);
    const el = screen.getByTestId('announcement');

    expect(el).toHaveTextContent('Assistant is responding');

    // End streaming
    mockIsStreaming = false;
    mockActiveToolCalls = [];
    rerender(<AnnouncementHarness />);

    expect(el).toHaveTextContent('Response complete');
  });

  it('announces tool completion', () => {
    mockIsStreaming = true;
    const tc = createToolCall({ id: 'tc-1', toolName: 'Read', status: 'invoked' });
    mockActiveToolCalls = [tc];
    const { rerender } = render(<AnnouncementHarness />);
    const el = screen.getByTestId('announcement');

    // Tool completes
    mockActiveToolCalls = [
      { ...tc, status: 'resolved', completedAt: '2026-03-17T00:00:01Z' },
    ];
    rerender(<AnnouncementHarness />);

    expect(el).toHaveTextContent('Tool Read completed');
  });

  it('announces tool failure', () => {
    mockIsStreaming = true;
    const tc = createToolCall({ id: 'tc-2', toolName: 'Bash', status: 'executing' });
    mockActiveToolCalls = [tc];
    const { rerender } = render(<AnnouncementHarness />);

    mockActiveToolCalls = [
      { ...tc, status: 'rejected', isError: true, completedAt: '2026-03-17T00:00:01Z' },
    ];
    rerender(<AnnouncementHarness />);

    expect(screen.getByTestId('announcement')).toHaveTextContent('Tool Bash failed');
  });

  it('does not re-announce already completed tools', () => {
    mockIsStreaming = true;
    const tc = createToolCall({ id: 'tc-3', toolName: 'Write', status: 'resolved', completedAt: '2026-03-17T00:00:01Z' });
    mockActiveToolCalls = [tc];
    const { rerender } = render(<AnnouncementHarness />);
    const el = screen.getByTestId('announcement');

    expect(el).toHaveTextContent('Tool Write completed');

    // Trigger a new streaming message (no new tool completions)
    mockIsStreaming = true;
    rerender(<AnnouncementHarness />);

    // Should still show the tool message, not re-announce
    expect(el).toHaveTextContent('Tool Write completed');
  });
});
