/**
 * SystemMessage -- centered muted system text.
 *
 * Renders system content centered with text-muted text-xs styling.
 * No background, no bubble constraint.
 *
 * Constitution: Named export (2.2), token-based styling (3.1), cn() for classes (3.6).
 */

import { MessageContainer } from '@/components/chat/view/MessageContainer';
import type { Message } from '@/types/message';

interface SystemMessageProps {
  message: Message;
}

export function SystemMessage({ message }: SystemMessageProps) {
  return (
    <MessageContainer role="system">
      <span
        className="text-muted text-xs"
        data-testid="system-message-inner"
      >
        {message.content}
      </span>
    </MessageContainer>
  );
}
