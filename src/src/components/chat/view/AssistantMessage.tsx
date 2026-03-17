/**
 * AssistantMessage -- historical assistant message display.
 *
 * Renders content through MarkdownRenderer for rich formatted output
 * (bold, italic, code blocks, tables, links, etc.). Fenced code blocks
 * route to CodeBlock with Shiki syntax highlighting.
 *
 * Tool calls render AFTER markdown content as grouped or single components.
 * Consecutive tool calls (2+) collapse into a ToolCallGroup accordion.
 * Single tool calls render as standalone ToolChip components.
 * Error tool calls are extracted from groups and shown separately.
 *
 * Wraps content in MessageContainer with role="assistant" for unified CSS
 * with streaming ActiveMessage (CLS prevention).
 *
 * Constitution: Named exports (2.2), cn() for classes (3.6).
 */

import type { ReactNode } from 'react';
import { MessageContainer } from '@/components/chat/view/MessageContainer';
import { MarkdownRenderer } from '@/components/chat/view/MarkdownRenderer';
import { ProviderHeader } from '@/components/chat/provider-logos/ProviderHeader';
import { ThinkingDisclosure } from '@/components/chat/view/ThinkingDisclosure';
import { ToolChip } from '@/components/chat/tools/ToolChip';
import { ToolCallGroup } from '@/components/chat/tools/ToolCallGroup';
import { TokenUsage } from '@/components/chat/view/TokenUsage';
import { groupToolCalls } from '@/lib/groupToolCalls';
import { useUIStore } from '@/stores/ui';
import type { Message } from '@/types/message';
import type { ToolCallState } from '@/types/stream';

export interface AssistantMessageProps {
  message: Message;
  /** Highlight function for search -- threaded to ThinkingDisclosure */
  highlightText?: (text: string) => ReactNode;
}

/**
 * Convert message toolCalls to ToolCallState array.
 */
function toToolCallStates(
  toolCalls: NonNullable<Message['toolCalls']>,
  timestamp: string,
): ToolCallState[] {
  return toolCalls.map((tc) => ({
    id: tc.id,
    toolName: tc.toolName,
    status: 'resolved' as const,
    input: tc.input,
    output: tc.output,
    isError: tc.isError,
    startedAt: timestamp,
    completedAt: timestamp,
  }));
}

export function AssistantMessage({ message, highlightText }: AssistantMessageProps) {
  const thinkingExpanded = useUIStore((state) => state.thinkingExpanded);
  const autoExpandTools = useUIStore((state) => state.autoExpandTools);
  const hasToolCalls = message.toolCalls && message.toolCalls.length > 0;
  const hasThinking = message.thinkingBlocks && message.thinkingBlocks.length > 0;

  const toolCallStates = hasToolCalls
    ? toToolCallStates(message.toolCalls!, message.metadata.timestamp) // ASSERT: hasToolCalls guards truthiness of toolCalls
    : [];

  const partitions = hasToolCalls ? groupToolCalls(toolCallStates) : [];

  return (
    <MessageContainer role="assistant">
      <ProviderHeader providerId={message.providerContext.providerId} />
      {hasThinking && (
        <ThinkingDisclosure
          blocks={message.thinkingBlocks!} // ASSERT: hasThinking guards truthiness of thinkingBlocks
          isStreaming={false}
          globalExpanded={thinkingExpanded}
          duration={message.metadata.duration}
          highlightText={highlightText}
        />
      )}
      <MarkdownRenderer content={message.content} />
      {partitions.map((partition, i) =>
        partition.type === 'group' ? (
          <ToolCallGroup
            key={`group-${i}`}
            tools={partition.tools}
            errors={partition.errors}
            defaultExpanded={autoExpandTools}
          />
        ) : (
          <ToolChip key={partition.tool.id} toolCall={partition.tool} defaultExpanded={autoExpandTools || undefined} />
        ),
      )}
      <TokenUsage metadata={message.metadata} />
    </MessageContainer>
  );
}
