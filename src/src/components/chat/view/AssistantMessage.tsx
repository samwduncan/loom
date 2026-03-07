/**
 * AssistantMessage -- historical assistant message display.
 *
 * Renders content through MarkdownRenderer for rich formatted output
 * (bold, italic, code blocks, tables, links, etc.). Fenced code blocks
 * route to CodeBlock with Shiki syntax highlighting.
 *
 * If message has toolCalls, renders each as a collapsed ToolChip with
 * status 'resolved' using the tool registry.
 *
 * Wraps content in MessageContainer with role="assistant" for unified CSS
 * with streaming ActiveMessage (CLS prevention).
 *
 * Constitution: Named exports (2.2), cn() for classes (3.6).
 */

import { MessageContainer } from '@/components/chat/view/MessageContainer';
import { MarkdownRenderer } from '@/components/chat/view/MarkdownRenderer';
import { ToolChip } from '@/components/chat/tools/ToolChip';
import type { Message } from '@/types/message';
import type { ToolCallState } from '@/types/stream';

interface AssistantMessageProps {
  message: Message;
}

export function AssistantMessage({ message }: AssistantMessageProps) {
  return (
    <MessageContainer role="assistant">
      <MarkdownRenderer content={message.content} />
      {message.toolCalls && message.toolCalls.length > 0 && (
        <div className="mt-2 flex flex-col gap-1">
          {message.toolCalls.map((tc) => {
            const toolCallState: ToolCallState = {
              id: tc.id,
              toolName: tc.toolName,
              status: 'resolved',
              input: tc.input,
              output: tc.output,
              isError: tc.isError,
              startedAt: message.metadata.timestamp,
              completedAt: message.metadata.timestamp,
            };
            return <ToolChip key={tc.id} toolCall={toolCallState} />;
          })}
        </div>
      )}
    </MessageContainer>
  );
}
