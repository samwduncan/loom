/**
 * MessageList tests -- message rendering and scroll behavior.
 *
 * Tests verify:
 * - Messages render by role
 * - Scroll container exists
 * - Empty search state
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageList } from './MessageList';
import type { Message } from '@/types/message';

// Mock stream store
vi.mock('@/stores/stream', () => ({
  useStreamStore: vi.fn((selector: (state: { isStreaming: boolean }) => boolean) =>
    selector({ isStreaming: false }),
  ),
}));

// Mock child components to keep tests focused
vi.mock('@/components/chat/view/UserMessage', () => ({
  UserMessage: ({ message }: { message: Message }) => <div data-testid="user-msg">{message.content}</div>,
}));
vi.mock('@/components/chat/view/AssistantMessage', () => ({
  AssistantMessage: ({ message }: { message: Message }) => <div data-testid="assistant-msg">{message.content}</div>,
}));
vi.mock('@/components/chat/view/ErrorMessage', () => ({
  ErrorMessage: () => <div data-testid="error-msg" />,
}));
vi.mock('@/components/chat/view/SystemMessage', () => ({
  SystemMessage: () => <div data-testid="system-msg" />,
}));
vi.mock('@/components/chat/view/TaskNotificationMessage', () => ({
  TaskNotificationMessage: () => <div data-testid="task-msg" />,
}));
vi.mock('@/components/chat/view/ActiveMessage', () => ({
  ActiveMessage: () => <div data-testid="active-msg" />,
}));
vi.mock('@/components/chat/view/ScrollToBottomPill', () => ({
  ScrollToBottomPill: () => null,
}));
vi.mock('@/components/shared/ErrorBoundary', () => ({
  MessageErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function makeMessage(id: string, role: 'user' | 'assistant' = 'user'): Message {
  return {
    id,
    role,
    content: `Message ${id}`,
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
  };
}

describe('MessageList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders user messages', () => {
    render(
      <MessageList
        messages={[makeMessage('1', 'user')]}
        sessionId="session-1"
      />,
    );

    expect(screen.getByTestId('user-msg')).toBeInTheDocument();
  });

  it('renders assistant messages', () => {
    render(
      <MessageList
        messages={[makeMessage('1', 'assistant')]}
        sessionId="session-1"
      />,
    );

    expect(screen.getByTestId('assistant-msg')).toBeInTheDocument();
  });

  it('renders scroll container', () => {
    render(
      <MessageList
        messages={[makeMessage('1')]}
        sessionId="session-1"
      />,
    );

    expect(screen.getByTestId('message-list-scroll')).toBeInTheDocument();
  });

  it('shows search empty state when query matches nothing', () => {
    render(
      <MessageList
        messages={[]}
        sessionId="session-1"
        searchQuery="nonexistent"
      />,
    );

    expect(screen.getByTestId('search-empty-state')).toBeInTheDocument();
  });

  it('renders multiple messages', () => {
    render(
      <MessageList
        messages={[makeMessage('1', 'user'), makeMessage('2', 'assistant'), makeMessage('3', 'user')]}
        sessionId="session-1"
      />,
    );

    expect(screen.getAllByTestId('user-msg')).toHaveLength(2);
    expect(screen.getByTestId('assistant-msg')).toBeInTheDocument();
  });
});
