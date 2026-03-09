/**
 * ThinkingDisclosure -- collapsible thinking block component.
 *
 * Dual-mode: streaming (pulsing "Thinking...") and historical
 * ("Thinking (N chars)"). Supports global toggle via globalExpanded
 * prop with per-instance user override.
 *
 * Uses CSS grid-template-rows for smooth collapse animation.
 * Uses "adjust state during rendering" pattern (React-supported)
 * for resetting userToggled when globalExpanded changes.
 *
 * Constitution: Named exports only (2.2), gridTemplateRows in ESLint allowlist (Phase 3).
 */

import { useState, type ReactNode } from 'react';
import { StreamingCursor } from '@/components/chat/view/StreamingCursor';
import { ShinyText } from '@/components/effects/ShinyText';
import { parseThinkingMarkdown } from '@/lib/thinking-markdown';
import type { ThinkingBlock } from '@/types/message';
import '../styles/thinking-disclosure.css';
import '../styles/streaming-cursor.css';

interface ThinkingDisclosureProps {
  blocks: ThinkingBlock[];
  isStreaming: boolean;
  globalExpanded?: boolean;
  /** Message-level duration in seconds (from metadata.duration) */
  duration?: number | null;
  /** Highlight function for search -- wraps matching text in <mark> elements */
  highlightText?: (text: string) => ReactNode;
}

export function ThinkingDisclosure({
  blocks,
  isStreaming,
  globalExpanded = true,
  duration,
  highlightText,
}: ThinkingDisclosureProps) {
  const [userToggled, setUserToggled] = useState<boolean | null>(null);
  const [prevGlobalExpanded, setPrevGlobalExpanded] = useState(globalExpanded);

  // "Adjust state during rendering" pattern (React docs: "you-might-not-need-an-effect"):
  // When globalExpanded prop changes, reset userToggled so all disclosures
  // follow the new global value. Guarded by condition to prevent infinite loops.
  if (prevGlobalExpanded !== globalExpanded) {
    setPrevGlobalExpanded(globalExpanded);
    setUserToggled(null);
  }

  // Derive expanded state:
  // - Streaming: always expanded (user sees live thinking), unless user manually toggled
  // - Historical: user override > globalExpanded
  const defaultExpanded = isStreaming ? true : globalExpanded;
  const isExpanded = userToggled !== null ? userToggled : defaultExpanded;

  // Render nothing if empty blocks
  if (blocks.length === 0) {
    return null;
  }

  const totalChars = blocks.reduce((sum, b) => sum + b.text.length, 0);

  return (
    <div className="thinking-disclosure" data-testid="thinking-disclosure">
      <button
        type="button"
        className="thinking-disclosure-trigger"
        onClick={() => setUserToggled((prev) => prev === null ? !defaultExpanded : !prev)}
      >
        {isStreaming ? (
          <ShinyText><span className="thinking-pulse">Thinking...</span></ShinyText>
        ) : (
          <span>
            {`Thinking (${totalChars.toLocaleString()} chars)`}
            {duration != null && ` · took ${duration.toFixed(1)}s`}
          </span>
        )}
        <span
          className="thinking-disclosure-arrow"
          data-expanded={isExpanded}
          aria-hidden="true"
        >
          {'\u25B8'}
        </span>
      </button>
      <div
        className="thinking-disclosure-content"
        style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
      >
        <div>
          {blocks.map((block) => (
            <p key={block.id} className="italic text-muted font-mono text-sm">
              {highlightText ? (
                <span>{highlightText(block.text)}</span>
              ) : (
                <span dangerouslySetInnerHTML={{ __html: parseThinkingMarkdown(block.text) }} />
              )}
              {isStreaming && !block.isComplete && <StreamingCursor variant="muted" />}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
