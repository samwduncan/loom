import type { ChatMessage } from '../types/types';

/**
 * Groups consecutive tool call messages for compact rendering.
 *
 * Takes a flat array of ChatMessages and returns a mixed array where runs of 3+
 * consecutive `isToolUse` messages (excluding subagent containers) are grouped
 * into sub-arrays. Single or paired tool calls pass through individually.
 *
 * Consumed by MessageComponent (flat rendering) and TurnBlock (turn-level rendering).
 */
export function groupConsecutiveToolCalls(
  messages: ChatMessage[]
): (ChatMessage | ChatMessage[])[] {
  const result: (ChatMessage | ChatMessage[])[] = [];
  let buffer: ChatMessage[] = [];

  const flushBuffer = () => {
    if (buffer.length >= 3) {
      result.push(buffer);
    } else {
      for (const msg of buffer) {
        result.push(msg);
      }
    }
    buffer = [];
  };

  for (const msg of messages) {
    if (msg.isToolUse && !msg.isSubagentContainer) {
      buffer.push(msg);
    } else {
      flushBuffer();
      result.push(msg);
    }
  }

  flushBuffer();

  return result;
}
