/**
 * ErrorMessage -- inline error banner with red accent.
 *
 * Renders error content with border-l-4 border-error accent, bg-error/10
 * background, and AlertCircle icon. No retry button (deferred to Phase 19).
 *
 * Constitution: Named export (2.2), token-based styling (3.1), cn() for classes (3.6).
 */

import { AlertCircle } from 'lucide-react';
import { MessageContainer } from '@/components/chat/view/MessageContainer';
import type { Message } from '@/types/message';

interface ErrorMessageProps {
  message: Message;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <MessageContainer role="error">
      <div
        className="flex items-start gap-2 border-l-4 border-error bg-error/10 rounded-r-lg px-3 py-2"
        data-testid="error-message-inner"
      >
        <AlertCircle className="size-4 text-error shrink-0 mt-0.5" />
        <span className="text-sm text-foreground">{message.content}</span>
      </div>
    </MessageContainer>
  );
}
