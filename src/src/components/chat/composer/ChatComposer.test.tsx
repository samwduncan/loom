/**
 * ChatComposer tests -- text input, send, stop, keyboard behavior.
 *
 * Tests verify:
 * - Renders textarea and send button
 * - Send disabled when input empty
 * - Enter key sends message via wsClient
 * - Input clears after send
 * - Stop button appears during streaming
 * - Stop button sends abort-session
 * - Escape clears input, then blurs
 * - Suggestion text populates input
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ChatComposer } from './ChatComposer';
import { useStreamStore } from '@/stores/stream';
import { useTimelineStore } from '@/stores/timeline';

// Mock wsClient
const mockWsSend = vi.fn().mockReturnValue(true);
vi.mock('@/lib/websocket-client', () => ({
  wsClient: { send: (...args: unknown[]) => mockWsSend(...args) },
}));

// Track navigate calls
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderComposer(props: { projectName: string; sessionId: string | null }) {
  return render(
    <MemoryRouter>
      <ChatComposer {...props} />
    </MemoryRouter>,
  );
}

describe('ChatComposer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useStreamStore.getState().reset();
    useTimelineStore.getState().reset();
  });

  it('renders textarea and send button', () => {
    renderComposer({ projectName: 'test-proj', sessionId: null });
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('disables send button when input is empty', () => {
    renderComposer({ projectName: 'test-proj', sessionId: null });
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
  });

  it('enables send button when input has text', async () => {
    const user = userEvent.setup();
    renderComposer({ projectName: 'test-proj', sessionId: null });

    await user.type(screen.getByRole('textbox'), 'hello');
    expect(screen.getByRole('button', { name: /send/i })).not.toBeDisabled();
  });

  it('sends claude-command via wsClient on send click', async () => {
    const user = userEvent.setup();
    renderComposer({ projectName: 'test-proj', sessionId: 'sess-1' });

    await user.type(screen.getByRole('textbox'), 'test message');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(mockWsSend).toHaveBeenCalledWith({
      type: 'claude-command',
      command: 'test message',
      options: {
        projectPath: 'test-proj',
        sessionId: 'sess-1',
      },
    });
  });

  it('clears input after send', async () => {
    const user = userEvent.setup();
    renderComposer({ projectName: 'test-proj', sessionId: 'sess-1' });

    const input = screen.getByRole('textbox');
    await user.type(input, 'test message');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(input).toHaveValue('');
  });

  it('sends on Enter key press', async () => {
    const user = userEvent.setup();
    renderComposer({ projectName: 'test-proj', sessionId: 'sess-1' });

    await user.type(screen.getByRole('textbox'), 'enter message');
    await user.keyboard('{Enter}');

    expect(mockWsSend).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'claude-command',
        command: 'enter message',
      }),
    );
  });

  it('omits sessionId from options when null (new chat)', async () => {
    const user = userEvent.setup();
    renderComposer({ projectName: 'test-proj', sessionId: null });

    await user.type(screen.getByRole('textbox'), 'new chat message');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(mockWsSend).toHaveBeenCalledWith({
      type: 'claude-command',
      command: 'new chat message',
      options: {
        projectPath: 'test-proj',
      },
    });
  });

  it('shows stop button during streaming', async () => {
    renderComposer({ projectName: 'test-proj', sessionId: 'sess-1' });

    // Simulate streaming starting (triggers useEffect in useComposerState)
    act(() => {
      useStreamStore.getState().startStream();
      useStreamStore.getState().setActiveSessionId('sess-1');
    });

    // Wait for FSM to transition via useEffect
    await waitFor(() => {
      const stopBtn = screen.getByRole('button', { name: /stop/i });
      expect(stopBtn).not.toBeDisabled();
    });
  });

  it('stop button sends abort-session', async () => {
    const user = userEvent.setup();
    renderComposer({ projectName: 'test-proj', sessionId: 'sess-1' });

    // Simulate streaming starting
    act(() => {
      useStreamStore.getState().startStream();
      useStreamStore.getState().setActiveSessionId('sess-1');
    });

    // Wait for FSM to reach 'active' state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /stop/i })).not.toBeDisabled();
    });

    await user.click(screen.getByRole('button', { name: /stop/i }));

    expect(mockWsSend).toHaveBeenCalledWith({
      type: 'abort-session',
      sessionId: 'sess-1',
      provider: 'claude',
    });
  });

  it('adds user message to timeline store optimistically', async () => {
    const user = userEvent.setup();

    // Create a session first
    useTimelineStore.getState().addSession({
      id: 'sess-1',
      title: 'Test',
      messages: [],
      providerId: 'claude',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null },
    });

    renderComposer({ projectName: 'test-proj', sessionId: 'sess-1' });

    await user.type(screen.getByRole('textbox'), 'hello world');
    await user.click(screen.getByRole('button', { name: /send/i }));

    const session = useTimelineStore.getState().sessions.find((s) => s.id === 'sess-1');
    expect(session).toBeDefined();
    expect(session?.messages).toHaveLength(1);
    expect(session?.messages[0]?.role).toBe('user');
    expect(session?.messages[0]?.content).toBe('hello world');
  });

  it('clears input on Escape, blurs on second Escape', async () => {
    const user = userEvent.setup();
    renderComposer({ projectName: 'test-proj', sessionId: null });

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'some text');
    expect(textarea).toHaveValue('some text');

    // First Escape clears input
    await user.keyboard('{Escape}');
    expect(textarea).toHaveValue('');

    // Second Escape blurs
    await user.keyboard('{Escape}');
    expect(textarea).not.toHaveFocus();
  });

  describe('new chat optimistic stub', () => {
    it('creates a stub session and navigates when sessionId is null', async () => {
      const user = userEvent.setup();
      renderComposer({ projectName: 'test-proj', sessionId: null });

      await user.type(screen.getByRole('textbox'), 'first message');
      await user.click(screen.getByRole('button', { name: /send/i }));

      // Stub session was created in timeline store
      const sessions = useTimelineStore.getState().sessions;
      expect(sessions).toHaveLength(1);
      expect(sessions[0]!.id).toMatch(/^stub-/); // ASSERT: length check above guarantees sessions[0] exists
      expect(sessions[0]!.title).toBe('first message'); // ASSERT: length check above guarantees sessions[0] exists
    });

    it('adds optimistic user message to the stub session', async () => {
      const user = userEvent.setup();
      renderComposer({ projectName: 'test-proj', sessionId: null });

      await user.type(screen.getByRole('textbox'), 'hello stub');
      await user.click(screen.getByRole('button', { name: /send/i }));

      const stubSession = useTimelineStore.getState().sessions.find((s) => s.id.startsWith('stub-'));
      expect(stubSession).toBeDefined();
      expect(stubSession?.messages).toHaveLength(1);
      expect(stubSession?.messages[0]?.role).toBe('user');
      expect(stubSession?.messages[0]?.content).toBe('hello stub');
    });

    it('navigates to /chat/stub-* when creating new chat', async () => {
      const user = userEvent.setup();
      renderComposer({ projectName: 'test-proj', sessionId: null });

      await user.type(screen.getByRole('textbox'), 'new chat');
      await user.click(screen.getByRole('button', { name: /send/i }));

      expect(mockNavigate).toHaveBeenCalledWith(expect.stringMatching(/^\/chat\/stub-/));
    });

    it('sends claude-command WITHOUT sessionId for new chat (no stub ID to backend)', async () => {
      const user = userEvent.setup();
      renderComposer({ projectName: 'test-proj', sessionId: null });

      await user.type(screen.getByRole('textbox'), 'new chat message');
      await user.click(screen.getByRole('button', { name: /send/i }));

      expect(mockWsSend).toHaveBeenCalledWith({
        type: 'claude-command',
        command: 'new chat message',
        options: {
          projectPath: 'test-proj',
        },
      });
    });
  });
});
