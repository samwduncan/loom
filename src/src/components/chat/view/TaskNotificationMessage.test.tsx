/**
 * TaskNotificationMessage tests -- task notification with checklist icon.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TaskNotificationMessage } from './TaskNotificationMessage';
import type { Message } from '@/types/message';

function makeTaskMessage(content: string): Message {
  return {
    id: 'task-1',
    role: 'task_notification',
    content,
    metadata: {
      timestamp: '2026-03-07T12:00:00Z',
      tokenCount: null,
      inputTokens: null,
      outputTokens: null,
      cacheReadTokens: null,
      cost: null,
      duration: null,
    },
    providerContext: {
      providerId: 'claude',
      modelId: '',
      agentName: null,
    },
  };
}

describe('TaskNotificationMessage', () => {
  it('renders the task notification text content', () => {
    render(<TaskNotificationMessage message={makeTaskMessage('Task completed')} />);
    expect(screen.getByText('Task completed')).toBeInTheDocument();
  });

  it('has bg-surface-1 background and rounded-lg', () => {
    render(<TaskNotificationMessage message={makeTaskMessage('Task text')} />);
    const inner = screen.getByTestId('task-notification-inner');
    expect(inner.className).toContain('bg-surface-1');
    expect(inner.className).toContain('rounded-lg');
  });

  it('has px-4 py-2 padding', () => {
    render(<TaskNotificationMessage message={makeTaskMessage('Task text')} />);
    const inner = screen.getByTestId('task-notification-inner');
    expect(inner.className).toContain('px-4');
    expect(inner.className).toContain('py-2');
  });

  it('renders a CheckSquare icon (svg element)', () => {
    render(<TaskNotificationMessage message={makeTaskMessage('Task text')} />);
    const container = screen.getByTestId('task-notification-inner');
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('wraps in MessageContainer with role="task_notification"', () => {
    render(<TaskNotificationMessage message={makeTaskMessage('Task text')} />);
    const wrapper = screen.getByTestId('message-container');
    expect(wrapper.dataset.role).toBe('task_notification');
  });
});
