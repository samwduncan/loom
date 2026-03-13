/**
 * MessageList pagination tests -- sentinel rendering and loading spinner.
 *
 * Tests verify:
 * - Top sentinel renders when hasMore is true
 * - Sentinel hidden when hasMore is false
 * - Loading spinner shown when isFetchingMore is true
 * - Spinner hidden when isFetchingMore is false
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageList } from './MessageList';
import type { Message } from '@/types/message';

// Mock IntersectionObserver (not available in jsdom)
class MockIntersectionObserver {
  callback: IntersectionObserverCallback;
  options?: IntersectionObserverInit;
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.callback = callback;
    this.options = options;
  }
}
vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

// Mock stream store
vi.mock('@/stores/stream', () => ({
  useStreamStore: vi.fn((selector: (state: { isStreaming: boolean }) => boolean) =>
    selector({ isStreaming: false }),
  ),
}));

// Mock useScrollAnchor
vi.mock('@/hooks/useScrollAnchor', () => ({
  useScrollAnchor: () => ({
    sentinelRef: { current: null },
    showPill: false,
    scrollToBottom: vi.fn(),
    unreadCount: 0,
    saveScrollPosition: vi.fn(),
    restoreScrollPosition: vi.fn(() => false),
    incrementUnread: vi.fn(),
  }),
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

describe('MessageList pagination', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders top sentinel when hasMore is true', () => {
    render(
      <MessageList
        messages={[makeMessage('1')]}
        sessionId="session-1"
        hasMore={true}
        isFetchingMore={false}
        onLoadMore={vi.fn()}
      />,
    );

    const sentinel = screen.getByTestId('pagination-sentinel');
    expect(sentinel).toBeInTheDocument();
    expect(sentinel).toHaveAttribute('aria-hidden', 'true');
  });

  it('does not render sentinel when hasMore is false', () => {
    render(
      <MessageList
        messages={[makeMessage('1')]}
        sessionId="session-1"
        hasMore={false}
        isFetchingMore={false}
        onLoadMore={vi.fn()}
      />,
    );

    expect(screen.queryByTestId('pagination-sentinel')).not.toBeInTheDocument();
  });

  it('renders loading spinner when isFetchingMore is true', () => {
    render(
      <MessageList
        messages={[makeMessage('1')]}
        sessionId="session-1"
        hasMore={true}
        isFetchingMore={true}
        onLoadMore={vi.fn()}
      />,
    );

    const spinner = screen.getByTestId('pagination-spinner');
    expect(spinner).toBeInTheDocument();
  });

  it('does not render spinner when isFetchingMore is false', () => {
    render(
      <MessageList
        messages={[makeMessage('1')]}
        sessionId="session-1"
        hasMore={true}
        isFetchingMore={false}
        onLoadMore={vi.fn()}
      />,
    );

    expect(screen.queryByTestId('pagination-spinner')).not.toBeInTheDocument();
  });

  it('does not render sentinel or spinner when props are omitted', () => {
    render(
      <MessageList
        messages={[makeMessage('1')]}
        sessionId="session-1"
      />,
    );

    expect(screen.queryByTestId('pagination-sentinel')).not.toBeInTheDocument();
    expect(screen.queryByTestId('pagination-spinner')).not.toBeInTheDocument();
  });
});
