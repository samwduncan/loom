/**
 * ErrorMessage -- inline error banner with red accent and retry button.
 *
 * Renders error content with border-l-4 border-error accent, bg-error/10
 * background, and AlertCircle icon. Includes a Retry button that resends
 * the last user message via WebSocket.
 *
 * Retry button is hidden when no prior user message exists before the error,
 * and disabled when the WebSocket is disconnected.
 *
 * Constitution: Named export (2.2), token-based styling (3.1), cn() for classes (3.6).
 */

import { useCallback } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { MessageContainer } from '@/components/chat/view/MessageContainer';
import { useTimelineStore } from '@/stores/timeline';
import { useConnectionStore } from '@/stores/connection';
import { useProjectContext } from '@/hooks/useProjectContext';
import { wsClient } from '@/lib/websocket-client';
import { cn } from '@/utils/cn';
import type { Message } from '@/types/message';
import type { ClaudeCommandOptions } from '@/types/websocket';

interface ErrorMessageProps {
  message: Message;
  /** Session ID this error belongs to -- used for retry targeting */
  sessionId?: string;
}

export function ErrorMessage({ message, sessionId }: ErrorMessageProps) {
  const { projectName } = useProjectContext();
  const isConnected = useConnectionStore(
    (s) => s.providers.claude.status === 'connected',
  );

  // Use explicit sessionId prop (from MessageList) to avoid race when user switches sessions
  const fallbackSessionId = useTimelineStore((s) => s.activeSessionId);
  const effectiveSessionId = sessionId ?? fallbackSessionId;

  const lastUserMessage = useTimelineStore((s) => {
    if (!effectiveSessionId) return null;
    const session = s.sessions.find((sess) => sess.id === effectiveSessionId);
    if (!session) return null;
    const errorIndex = session.messages.findIndex((m) => m.id === message.id);
    if (errorIndex === -1) return null;
    return session.messages
      .slice(0, errorIndex)
      .reverse()
      .find((m) => m.role === 'user') ?? null;
  });

  const canRetry = lastUserMessage !== null && isConnected;

  const handleRetry = useCallback(() => {
    if (!lastUserMessage || !isConnected || !effectiveSessionId) return;

    const options: ClaudeCommandOptions = {
      projectPath: projectName,
      sessionId: effectiveSessionId,
    };

    wsClient.send({
      type: 'claude-command',
      command: lastUserMessage.content,
      options,
    });
  }, [lastUserMessage, isConnected, effectiveSessionId, projectName]);

  return (
    <MessageContainer role="error">
      <div
        className="flex items-start gap-2 border-l-4 border-error bg-error/10 rounded-r-lg px-3 py-2"
        data-testid="error-message-inner"
      >
        <AlertCircle className="size-4 text-error shrink-0 mt-0.5" />
        <span className="text-sm text-foreground flex-1">{message.content}</span>
        {lastUserMessage && (
          <button
            type="button"
            onClick={handleRetry}
            disabled={!canRetry}
            className={cn(
              'flex items-center gap-1 text-sm text-error shrink-0',
              canRetry
                ? 'hover:text-error/80 cursor-pointer'
                : 'opacity-50 cursor-not-allowed',
            )}
            data-testid="error-retry-button"
          >
            <RotateCcw className="size-3.5" />
            Retry
          </button>
        )}
      </div>
    </MessageContainer>
  );
}
