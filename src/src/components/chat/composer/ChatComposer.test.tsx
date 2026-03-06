/**
 * ChatComposer tests -- text input, send, stop, keyboard behavior.
 *
 * Tests verify:
 * - Renders input and send button
 * - Send disabled when input empty
 * - Enter key sends message via wsClient
 * - Input clears after send
 * - Stop button appears during streaming
 * - Stop button sends abort-session
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatComposer } from './ChatComposer';
import { useStreamStore } from '@/stores/stream';
import { useTimelineStore } from '@/stores/timeline';

// Mock wsClient
const mockWsSend = vi.fn().mockReturnValue(true);
vi.mock('@/lib/websocket-client', () => ({
  wsClient: { send: (...args: unknown[]) => mockWsSend(...args) },
}));

describe('ChatComposer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useStreamStore.getState().reset();
    useTimelineStore.getState().reset();
  });

  it('renders input and send button', () => {
    render(<ChatComposer projectName="test-proj" sessionId={null} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('disables send button when input is empty', () => {
    render(<ChatComposer projectName="test-proj" sessionId={null} />);
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
  });

  it('enables send button when input has text', async () => {
    const user = userEvent.setup();
    render(<ChatComposer projectName="test-proj" sessionId={null} />);

    await user.type(screen.getByRole('textbox'), 'hello');
    expect(screen.getByRole('button', { name: /send/i })).not.toBeDisabled();
  });

  it('sends claude-command via wsClient on send click', async () => {
    const user = userEvent.setup();
    render(<ChatComposer projectName="test-proj" sessionId="sess-1" />);

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
    render(<ChatComposer projectName="test-proj" sessionId="sess-1" />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'test message');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(input).toHaveValue('');
  });

  it('sends on Enter key press', async () => {
    const user = userEvent.setup();
    render(<ChatComposer projectName="test-proj" sessionId="sess-1" />);

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
    render(<ChatComposer projectName="test-proj" sessionId={null} />);

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

  it('shows stop button during streaming', () => {
    useStreamStore.getState().startStream();
    useStreamStore.getState().setActiveSessionId('sess-1');

    render(<ChatComposer projectName="test-proj" sessionId="sess-1" />);
    expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument();
  });

  it('stop button sends abort-session', async () => {
    const user = userEvent.setup();
    useStreamStore.getState().startStream();
    useStreamStore.getState().setActiveSessionId('sess-1');

    render(<ChatComposer projectName="test-proj" sessionId="sess-1" />);
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

    render(<ChatComposer projectName="test-proj" sessionId="sess-1" />);

    await user.type(screen.getByRole('textbox'), 'hello world');
    await user.click(screen.getByRole('button', { name: /send/i }));

    const session = useTimelineStore.getState().sessions.find((s) => s.id === 'sess-1');
    expect(session).toBeDefined();
    expect(session?.messages).toHaveLength(1);
    expect(session?.messages[0]?.role).toBe('user');
    expect(session?.messages[0]?.content).toBe('hello world');
  });
});
