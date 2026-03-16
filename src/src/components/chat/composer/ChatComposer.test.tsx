/**
 * ChatComposer tests -- text input, send, stop, keyboard behavior, file mentions.
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
 * - File mention chips display and removal
 * - Sending with mentions prepends file references to command
 * - Mentions clear after send
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ChatComposer } from './ChatComposer';
import { useStreamStore } from '@/stores/stream';
import { useTimelineStore } from '@/stores/timeline';
import type { FileMention } from '@/types/mention';

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

// Mock useFileMentions for controlled testing
const mockDetectAndOpen = vi.fn();
const mockClose = vi.fn();
const mockMoveUp = vi.fn();
const mockMoveDown = vi.fn();
const mockSelectCurrent = vi.fn<() => FileMention | null>().mockReturnValue(null);

let mockMentionState = {
  isOpen: false,
  query: '',
  results: [] as FileMention[],
  selectedIndex: 0,
  isLoading: false,
};

vi.mock('@/hooks/useFileMentions', () => ({
  useFileMentions: () => ({
    ...mockMentionState,
    detectAndOpen: mockDetectAndOpen,
    close: mockClose,
    moveUp: mockMoveUp,
    moveDown: mockMoveDown,
    selectCurrent: mockSelectCurrent,
  }),
}));

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
    mockMentionState = {
      isOpen: false,
      query: '',
      results: [],
      selectedIndex: 0,
      isLoading: false,
    };
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

  describe('file mentions', () => {
    it('calls detectAndOpen on input change', async () => {
      const user = userEvent.setup();
      renderComposer({ projectName: 'test-proj', sessionId: 'sess-1' });

      await user.type(screen.getByRole('textbox'), 'hello @App');

      // detectAndOpen should have been called for each keystroke
      expect(mockDetectAndOpen).toHaveBeenCalled();
      // Last call should include the full text
      const calls = mockDetectAndOpen.mock.calls;
      const lastCall = calls[calls.length - 1];
      expect(lastCall?.[0]).toBe('hello @App');
    });

    it('renders MentionPicker when picker is open with results', () => {
      mockMentionState = {
        isOpen: true,
        query: 'App',
        results: [{ path: 'src/App.tsx', name: 'App.tsx' }],
        selectedIndex: 0,
        isLoading: false,
      };

      renderComposer({ projectName: 'test-proj', sessionId: 'sess-1' });
      expect(screen.getByTestId('mention-picker')).toBeInTheDocument();
    });

    it('does not render MentionPicker when picker is closed', () => {
      mockMentionState = {
        isOpen: false,
        query: '',
        results: [],
        selectedIndex: 0,
        isLoading: false,
      };

      renderComposer({ projectName: 'test-proj', sessionId: 'sess-1' });
      expect(screen.queryByTestId('mention-picker')).not.toBeInTheDocument();
    });

    it('intercepts ArrowUp/ArrowDown when picker is open', async () => {
      const user = userEvent.setup();
      mockMentionState = {
        isOpen: true,
        query: 'App',
        results: [
          { path: 'src/App.tsx', name: 'App.tsx' },
          { path: 'src/App.test.tsx', name: 'App.test.tsx' },
        ],
        selectedIndex: 0,
        isLoading: false,
      };

      renderComposer({ projectName: 'test-proj', sessionId: 'sess-1' });
      screen.getByRole('textbox').focus();

      await user.keyboard('{ArrowDown}');
      expect(mockMoveDown).toHaveBeenCalledTimes(1);

      await user.keyboard('{ArrowUp}');
      expect(mockMoveUp).toHaveBeenCalledTimes(1);
    });

    it('selects mention on Enter when picker is open (does not send message)', async () => {
      const user = userEvent.setup();
      const selectedFile: FileMention = { path: 'src/App.tsx', name: 'App.tsx' };
      mockSelectCurrent.mockReturnValue(selectedFile);
      mockMentionState = {
        isOpen: true,
        query: 'App',
        results: [selectedFile],
        selectedIndex: 0,
        isLoading: false,
      };

      renderComposer({ projectName: 'test-proj', sessionId: 'sess-1' });
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'hello @App');

      // Press Enter to select mention (should NOT send message)
      await user.keyboard('{Enter}');

      // wsClient.send should NOT have been called (Enter was intercepted by picker)
      expect(mockWsSend).not.toHaveBeenCalled();
    });

    it('closes picker on Escape when picker is open', async () => {
      const user = userEvent.setup();
      mockMentionState = {
        isOpen: true,
        query: 'App',
        results: [{ path: 'src/App.tsx', name: 'App.tsx' }],
        selectedIndex: 0,
        isLoading: false,
      };

      renderComposer({ projectName: 'test-proj', sessionId: 'sess-1' });
      screen.getByRole('textbox').focus();

      await user.keyboard('{Escape}');

      // Close should have been called (either by picker's global listener or composer's keydown)
      expect(mockClose).toHaveBeenCalled();
    });

    it('sends with file references prefix when mentions are present', async () => {
      const user = userEvent.setup();
      mockMentionState = {
        isOpen: true,
        query: '',
        results: [{ path: 'src/utils/cn.ts', name: 'cn.ts' }],
        selectedIndex: 0,
        isLoading: false,
      };

      renderComposer({ projectName: 'test-proj', sessionId: 'sess-1' });

      // Click the picker item to add a mention
      const pickerItem = screen.getByRole('option');
      await user.click(pickerItem);

      // Verify chip appeared
      expect(screen.getByTestId('mention-chip')).toBeInTheDocument();
      expect(screen.getByTestId('mention-chip')).toHaveTextContent('cn.ts');

      // Close picker state, clear input, type a fresh message
      mockMentionState = { isOpen: false, query: '', results: [], selectedIndex: 0, isLoading: false };

      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);
      await user.type(textarea, 'check this file');
      await user.click(screen.getByRole('button', { name: /send/i }));

      expect(mockWsSend).toHaveBeenCalledWith({
        type: 'claude-command',
        command: '[Files referenced: src/utils/cn.ts]\n\ncheck this file',
        options: {
          projectPath: 'test-proj',
          sessionId: 'sess-1',
        },
      });
    });

    it('clears mentions after send', async () => {
      const user = userEvent.setup();
      mockMentionState = {
        isOpen: true,
        query: '',
        results: [{ path: 'src/App.tsx', name: 'App.tsx' }],
        selectedIndex: 0,
        isLoading: false,
      };

      renderComposer({ projectName: 'test-proj', sessionId: 'sess-1' });

      // Click picker item to add mention
      await user.click(screen.getByRole('option'));
      expect(screen.getByTestId('mention-chip')).toBeInTheDocument();

      // Close picker, clear input, type, send
      mockMentionState = { isOpen: false, query: '', results: [], selectedIndex: 0, isLoading: false };
      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);
      await user.type(textarea, 'message');
      await user.click(screen.getByRole('button', { name: /send/i }));

      // Mentions should be cleared (no chips)
      expect(screen.queryByTestId('mention-chip')).not.toBeInTheDocument();
    });

    it('removes a mention chip when X is clicked', async () => {
      const user = userEvent.setup();
      mockMentionState = {
        isOpen: true,
        query: '',
        results: [{ path: 'src/App.tsx', name: 'App.tsx' }],
        selectedIndex: 0,
        isLoading: false,
      };

      renderComposer({ projectName: 'test-proj', sessionId: 'sess-1' });

      // Add mention via picker click
      await user.click(screen.getByRole('option'));
      expect(screen.getByTestId('mention-chip')).toBeInTheDocument();

      // Remove it
      const removeBtn = screen.getByRole('button', { name: /remove app\.tsx/i });
      await user.click(removeBtn);

      expect(screen.queryByTestId('mention-chip')).not.toBeInTheDocument();
    });
  });
});
