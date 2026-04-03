/**
 * Message Segment Parser -- transforms raw message content + metadata into
 * a flat array of typed segments for the chat renderer.
 *
 * Architecture: Segment-Based Message Rendering (RESEARCH.md Pattern 1).
 * Each segment maps to exactly one React component. The discriminated union
 * type ensures exhaustive switch handling in renderers.
 *
 * Segment ordering: thinking -> text/code interleaved -> tool_use -> permission
 */

import type { ToolCallState } from '@loom/shared/types/stream';
import type { ThinkingBlock } from '@loom/shared/types/message';
import type { PermissionRequest } from '@loom/shared/stores/stream';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MessageSegment =
  | { type: 'text'; content: string; isStreaming: boolean }
  | { type: 'thinking'; block: ThinkingBlock; isActive: boolean }
  | { type: 'tool_use'; toolCall: ToolCallState }
  | { type: 'code_block'; code: string; language: string; isStreaming: boolean }
  | { type: 'permission'; request: PermissionRequest };

// ---------------------------------------------------------------------------
// Code block extraction (state machine parser)
// ---------------------------------------------------------------------------

interface ContentSegment {
  kind: 'text' | 'code';
  content: string;
  language: string; // only meaningful for 'code'
}

/**
 * Splits content on fenced code blocks (``` delimiters).
 * Returns interleaved text and code segments.
 */
function extractContentSegments(content: string): ContentSegment[] {
  const segments: ContentSegment[] = [];
  const lines = content.split('\n');

  let insideCodeBlock = false;
  let currentLanguage = '';
  let currentLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimStart();

    if (!insideCodeBlock && trimmed.startsWith('```')) {
      // Entering a code fence -- flush accumulated text
      if (currentLines.length > 0) {
        const text = currentLines.join('\n');
        if (text.trim().length > 0) {
          segments.push({ kind: 'text', content: text, language: '' });
        }
        currentLines = [];
      }

      // Capture language tag (text after ``` on same line, trimmed)
      currentLanguage = trimmed.slice(3).trim();
      insideCodeBlock = true;
      currentLines = [];
    } else if (insideCodeBlock && trimmed === '```') {
      // Closing fence -- emit code block
      segments.push({
        kind: 'code',
        content: currentLines.join('\n'),
        language: currentLanguage,
      });
      currentLines = [];
      currentLanguage = '';
      insideCodeBlock = false;
    } else {
      currentLines.push(line);
    }
  }

  // Handle remaining content
  if (currentLines.length > 0) {
    if (insideCodeBlock) {
      // Unclosed code fence (streaming) -- emit as code block
      segments.push({
        kind: 'code',
        content: currentLines.join('\n'),
        language: currentLanguage,
      });
    } else {
      const text = currentLines.join('\n');
      if (text.trim().length > 0) {
        segments.push({ kind: 'text', content: text, language: '' });
      }
    }
  }

  return segments;
}

// ---------------------------------------------------------------------------
// Main parser
// ---------------------------------------------------------------------------

/**
 * Parse message content + metadata into an ordered array of MessageSegments.
 *
 * Ordering: thinking -> text/code interleaved -> tool_use -> permission
 *
 * @param content - Raw message content string (may contain fenced code blocks)
 * @param toolCalls - Active tool call states from the stream store
 * @param thinkingBlocks - Thinking blocks (extended thinking)
 * @param permissionRequest - Active permission request (null if none)
 * @param isStreaming - Whether the message is currently being streamed
 */
export function parseMessageSegments(
  content: string,
  toolCalls: ToolCallState[],
  thinkingBlocks: ThinkingBlock[],
  permissionRequest: PermissionRequest | null,
  isStreaming: boolean,
): MessageSegment[] {
  const segments: MessageSegment[] = [];

  // 1. Thinking blocks appear first (before response text, per D-05)
  for (const block of thinkingBlocks) {
    segments.push({
      type: 'thinking',
      block,
      isActive: !block.isComplete,
    });
  }

  // 2. Content segments (text + code blocks interleaved)
  if (content.length > 0) {
    const contentSegments = extractContentSegments(content);
    const lastIdx = contentSegments.length - 1;

    for (let i = 0; i < contentSegments.length; i++) {
      const seg = contentSegments[i];
      const isLastSegment = i === lastIdx;

      if (seg.kind === 'code') {
        // For streaming: if this is the last segment and the code fence was
        // unclosed (detected by extractContentSegments leaving insideCodeBlock
        // true), mark as streaming. We detect this by checking if the original
        // content doesn't end with a closing fence after the last code block.
        const isStreamingCode = isStreaming && isLastSegment && isUnclosedCodeFence(content);
        segments.push({
          type: 'code_block',
          code: seg.content,
          language: seg.language,
          isStreaming: isStreamingCode,
        });
      } else {
        // Text segment -- only the trailing text segment during streaming gets isStreaming: true
        segments.push({
          type: 'text',
          content: seg.content,
          isStreaming: isStreaming && isLastSegment,
        });
      }
    }
  }

  // 3. Tool calls appear after all text+code segments
  // Sorted by startedAt for stable ordering
  const sortedTools = [...toolCalls].sort((a, b) =>
    a.startedAt.localeCompare(b.startedAt),
  );
  for (const toolCall of sortedTools) {
    segments.push({ type: 'tool_use', toolCall });
  }

  // 4. Permission segment appears last
  if (permissionRequest) {
    segments.push({ type: 'permission', request: permissionRequest });
  }

  return segments;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Check if the content has an unclosed code fence (odd number of ``` lines).
 * Used to determine if the trailing code_block segment is still streaming.
 */
function isUnclosedCodeFence(content: string): boolean {
  const lines = content.split('\n');
  let fenceCount = 0;
  for (const line of lines) {
    const trimmed = line.trimStart();
    if (trimmed.startsWith('```')) {
      fenceCount++;
    }
  }
  // Odd number of fences means the last one is unclosed
  return fenceCount % 2 !== 0;
}
