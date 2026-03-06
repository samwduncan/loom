/**
 * UserMessage -- user message bubble (right-aligned).
 *
 * Renders content as plain text (no markdown in M1).
 * Wraps in MessageContainer with role="user" for right-aligned bubble styling.
 *
 * Constitution: Named exports (2.2).
 */

import { MessageContainer } from '@/components/chat/view/MessageContainer';
import type { Message } from '@/types/message';

interface UserMessageProps {
  message: Message;
}

export function UserMessage({ message }: UserMessageProps) {
  return (
    <MessageContainer role="user">
      <div className="whitespace-pre-wrap break-words">
        {message.content}
      </div>
    </MessageContainer>
  );
}
