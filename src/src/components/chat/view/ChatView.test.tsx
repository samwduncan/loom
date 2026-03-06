/**
 * ChatView tests -- rendering states and composer presence.
 *
 * Tests verify:
 * - Empty state when no session selected
 * - Message list when session has messages
 * - Loading skeleton during message fetch
 * - Composer always visible in all states
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ChatView } from './ChatView';
import { useTimelineStore } from '@/stores/timeline';
import { useStreamStore } from '@/stores/stream';

// Mock useProjectContext
vi.mock('@/hooks/useProjectContext', () => ({
  useProjectContext: () => ({ projectName: 'test-project', isLoading: false }),
}));

// Mock useSessionSwitch
const mockSwitchSession = vi.fn();
let mockIsLoadingMessages = false;
vi.mock('@/hooks/useSessionSwitch', () => ({
  useSessionSwitch: () => ({
    switchSession: mockSwitchSession,
    isLoadingMessages: mockIsLoadingMessages,
  }),
}));

// Mock wsClient
vi.mock('@/lib/websocket-client', () => ({
  wsClient: { send: vi.fn().mockReturnValue(true) },
}));

// Mock ActiveMessage to avoid streaming complexity
vi.mock('@/components/chat/view/ActiveMessage', () => ({
  ActiveMessage: () => <div data-testid="active-message-mock">Streaming...</div>,
}));

// Mock IntersectionObserver for scroll anchor tests
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();
vi.stubGlobal('IntersectionObserver', class {
  constructor() { /* noop */ }
  observe = mockObserve;
  disconnect = mockDisconnect;
  unobserve = vi.fn();
});

function renderChatView(route = '/chat') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/chat/:sessionId?" element={<ChatView />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ChatView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTimelineStore.getState().reset();
    useStreamStore.getState().reset();
    mockIsLoadingMessages = false;
  });

  afterEach(() => {
    cleanup();
  });

  it('renders empty state when no session selected', () => {
    renderChatView('/chat');

    expect(screen.getByTestId('chat-empty-state')).toBeInTheDocument();
    expect(screen.getByText('Loom')).toBeInTheDocument();
    expect(screen.getByText('What would you like to work on?')).toBeInTheDocument();
  });

  it('renders composer in empty state', () => {
    renderChatView('/chat');

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('renders message list when session has messages', () => {
    // Add session with messages to store
    useTimelineStore.getState().addSession({
      id: 'sess-1',
      title: 'Test Session',
      messages: [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Hello!',
          metadata: { timestamp: '2026-01-01', tokenCount: null, cost: null, duration: null },
          providerContext: { providerId: 'claude', modelId: '', agentName: null },
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'Hi there!',
          metadata: { timestamp: '2026-01-01', tokenCount: null, cost: null, duration: null },
          providerContext: { providerId: 'claude', modelId: '', agentName: null },
        },
      ],
      providerId: 'claude',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null },
    });
    useTimelineStore.getState().setActiveSession('sess-1');

    renderChatView('/chat/sess-1');

    expect(screen.getByText('Hello!')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  it('renders loading skeleton during message fetch', () => {
    mockIsLoadingMessages = true;

    // Set active session but no messages yet
    useTimelineStore.getState().addSession({
      id: 'loading-sess',
      title: 'Loading',
      messages: [],
      providerId: 'claude',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null },
    });
    useTimelineStore.getState().setActiveSession('loading-sess');

    renderChatView('/chat/loading-sess');

    expect(screen.getByTestId('message-skeleton')).toBeInTheDocument();
  });

  it('shows composer in empty state', () => {
    renderChatView('/chat');
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('shows composer with loading skeleton', () => {
    mockIsLoadingMessages = true;
    useTimelineStore.getState().addSession({
      id: 'loading-sess-2',
      title: 'Loading',
      messages: [],
      providerId: 'claude',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null },
    });
    useTimelineStore.getState().setActiveSession('loading-sess-2');

    renderChatView('/chat/loading-sess-2');
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByTestId('message-skeleton')).toBeInTheDocument();
  });
});
