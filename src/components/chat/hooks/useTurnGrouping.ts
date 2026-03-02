import { useMemo } from 'react';
import type { ChatMessage, Turn } from '../types/types';

export type { Turn } from '../types/types';

function extractFirstProseContent(messages: ChatMessage[]): string {
  for (const msg of messages) {
    if (msg.type === 'assistant' && !msg.isToolUse && !msg.isThinking && msg.content) {
      const trimmed = msg.content.trim();
      if (trimmed.length === 0) continue;
      const firstLine = trimmed.split('\n')[0];
      if (firstLine.length > 80) {
        return firstLine.slice(0, 77) + '...';
      }
      return firstLine;
    }
  }

  // No prose found -- summarize tool usage
  const toolCount = messages.filter((m) => m.isToolUse).length;
  if (toolCount > 0) {
    return `Used ${toolCount} tool${toolCount !== 1 ? 's' : ''}`;
  }

  return 'AI response';
}

function parseTimestamp(ts: string | number | Date): Date {
  if (ts instanceof Date) return ts;
  return new Date(ts);
}

function buildTurn(messages: ChatMessage[]): Turn {
  if (messages.length === 0) {
    throw new Error('Cannot build turn from empty messages');
  }

  const startTime = parseTimestamp(messages[0].timestamp);
  const endTime = parseTimestamp(messages[messages.length - 1].timestamp);
  const isStreaming = messages.some((m) => m.isStreaming);
  const toolCallCount = messages.filter((m) => m.isToolUse).length;
  const failedToolCount = messages.filter(
    (m) => m.isToolUse && m.toolResult?.isError
  ).length;
  const firstProseContent = extractFirstProseContent(messages);

  const durationMs = isStreaming
    ? undefined
    : endTime.getTime() - startTime.getTime();

  // Extract usage data from the last assistant message that contains it
  let usage: Turn['usage'] | undefined;
  let model: string | undefined;
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.type === 'assistant' && !usage) {
      const msgUsage = (msg as Record<string, unknown>).usage as Record<string, unknown> | undefined;
      const msgTokenUsage = (msg as Record<string, unknown>).tokenUsage as Record<string, unknown> | undefined;
      const usageData = msgUsage || msgTokenUsage;
      if (usageData) {
        usage = {
          inputTokens: Number(usageData.inputTokens || usageData.input_tokens || 0),
          outputTokens: Number(usageData.outputTokens || usageData.output_tokens || 0),
          cacheReadTokens: Number(usageData.cacheReadTokens || usageData.cache_read_tokens || usageData.cacheReadInputTokens || 0),
          cacheCreationTokens: Number(usageData.cacheCreationTokens || usageData.cache_creation_tokens || usageData.cacheCreationInputTokens || 0),
        };
      }
    }
    if (msg.type === 'assistant' && !model) {
      const msgModel = (msg as Record<string, unknown>).model as string | undefined;
      if (msgModel) {
        model = msgModel;
      }
    }
    if (usage && model) break;
  }

  return {
    id: `turn-${startTime.getTime()}`,
    messages,
    startTime,
    endTime: isStreaming ? undefined : endTime,
    isStreaming,
    toolCallCount,
    failedToolCount,
    firstProseContent,
    durationMs,
    usage,
    model,
  };
}

export interface TurnGroupingResult {
  items: (ChatMessage | Turn)[];
  turnCount: number;
}

export function useTurnGrouping(messages: ChatMessage[]): TurnGroupingResult {
  return useMemo(() => {
    const items: (ChatMessage | Turn)[] = [];
    let currentTurnMessages: ChatMessage[] = [];
    let turnCount = 0;

    const flushTurn = () => {
      if (currentTurnMessages.length === 0) return;
      items.push(buildTurn(currentTurnMessages));
      turnCount += 1;
      currentTurnMessages = [];
    };

    for (const message of messages) {
      if (message.type === 'user') {
        // User messages are standalone -- flush any accumulated turn
        flushTurn();
        items.push(message);
      } else {
        // Assistant, tool, thinking, error messages accumulate into current turn
        currentTurnMessages.push(message);
      }
    }

    // Flush any remaining turn
    flushTurn();

    return { items, turnCount };
  }, [messages]);
}
