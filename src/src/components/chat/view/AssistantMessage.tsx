/**
 * AssistantMessage -- historical assistant message display.
 *
 * Renders content through MarkdownRenderer for rich formatted output
 * (bold, italic, code blocks, tables, links, etc.). Fenced code blocks
 * route to CodeBlock with Shiki syntax highlighting.
 *
 * Tool calls are rendered inline within the markdown content via
 * \x00TOOL:id\x00 markers. The rehypeToolMarkers plugin in MarkdownRenderer
 * converts these to <tool-marker> elements, which render as ToolChip
 * components via the component override system.
 *
 * Wraps content in MessageContainer with role="assistant" for unified CSS
 * with streaming ActiveMessage (CLS prevention).
 *
 * Constitution: Named exports (2.2), cn() for classes (3.6).
 */

import { MessageContainer } from '@/components/chat/view/MessageContainer';
import { MarkdownRenderer } from '@/components/chat/view/MarkdownRenderer';
import { ProviderHeader } from '@/components/chat/provider-logos/ProviderHeader';
import { ThinkingDisclosure } from '@/components/chat/view/ThinkingDisclosure';
import { useUIStore } from '@/stores/ui';
import type { Message } from '@/types/message';
import type { ToolCallState } from '@/types/stream';

interface AssistantMessageProps {
  message: Message;
}

/**
 * Inject \x00TOOL:id\x00 markers into the content string for inline rendering.
 *
 * Strategy: Append markers at the end of content for each tool call.
 * Historical messages don't have position data, so markers go after the
 * main content separated by newlines. The markers render as inline ToolChip
 * components within the markdown flow.
 */
function injectToolMarkers(content: string, toolCalls: NonNullable<Message['toolCalls']>): string {
  if (toolCalls.length === 0) return content;

  // Insert markers after the content, each on its own line for block-level placement
  const markers = toolCalls.map((tc) => `\x00TOOL:${tc.id}\x00`).join('\n\n');
  const trimmed = content.trimEnd();
  return trimmed + '\n\n' + markers;
}

/**
 * Convert message toolCalls to ToolCallState array for MarkdownRenderer lookup.
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

export function AssistantMessage({ message }: AssistantMessageProps) {
  const thinkingExpanded = useUIStore((state) => state.thinkingExpanded);
  const hasToolCalls = message.toolCalls && message.toolCalls.length > 0;
  const hasThinking = message.thinkingBlocks && message.thinkingBlocks.length > 0;

  const content = hasToolCalls
    ? injectToolMarkers(message.content, message.toolCalls!) // ASSERT: hasToolCalls guards truthiness of toolCalls
    : message.content;

  const toolCallStates = hasToolCalls
    ? toToolCallStates(message.toolCalls!, message.metadata.timestamp) // ASSERT: hasToolCalls guards truthiness of toolCalls
    : undefined;

  return (
    <MessageContainer role="assistant">
      <ProviderHeader providerId={message.providerContext.providerId} />
      {hasThinking && (
        <ThinkingDisclosure
          blocks={message.thinkingBlocks!} // ASSERT: hasThinking guards truthiness of thinkingBlocks
          isStreaming={false}
          globalExpanded={thinkingExpanded}
        />
      )}
      <MarkdownRenderer content={content} toolCalls={toolCallStates} />
    </MessageContainer>
  );
}
