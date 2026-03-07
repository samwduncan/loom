/**
 * TaskNotificationMessage -- task notification with checklist icon.
 *
 * Renders task notification content with CheckSquare icon, text-sm label,
 * bg-surface-1 background, rounded-lg container.
 *
 * Constitution: Named export (2.2), token-based styling (3.1), cn() for classes (3.6).
 */

import { CheckSquare } from 'lucide-react';
import { MessageContainer } from '@/components/chat/view/MessageContainer';
import type { Message } from '@/types/message';

interface TaskNotificationMessageProps {
  message: Message;
}

export function TaskNotificationMessage({ message }: TaskNotificationMessageProps) {
  return (
    <MessageContainer role="task_notification">
      <div
        className="flex items-center gap-2 bg-surface-1 rounded-lg px-4 py-2"
        data-testid="task-notification-inner"
      >
        <CheckSquare className="size-4 text-muted shrink-0" />
        <span className="text-sm text-foreground">{message.content}</span>
      </div>
    </MessageContainer>
  );
}
