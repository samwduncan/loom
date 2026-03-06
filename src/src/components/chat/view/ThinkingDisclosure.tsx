/**
 * ThinkingDisclosure -- collapsible thinking block component.
 *
 * Shows pulsing "Thinking..." during active thinking; auto-collapses to
 * "Thinking (N blocks)" when thinking completes. Click toggles expansion.
 * Uses CSS grid-template-rows for smooth collapse animation.
 *
 * Constitution: Named exports only (2.2), gridTemplateRows in ESLint allowlist (Phase 3).
 */

import { useState, useRef } from 'react';
import type { ThinkingState } from '@/types/stream';
import '../styles/thinking-disclosure.css';

interface ThinkingDisclosureProps {
  thinkingState: ThinkingState | null;
}

export function ThinkingDisclosure({ thinkingState }: ThinkingDisclosureProps) {
  const [userToggled, setUserToggled] = useState<boolean | null>(null);
  const prevIsThinkingRef = useRef<boolean | undefined>(undefined);

  const isThinking = thinkingState?.isThinking ?? false;

  // Detect transition: reset userToggled when isThinking changes
  if (prevIsThinkingRef.current !== isThinking) {
    prevIsThinkingRef.current = isThinking;
    // On transition, clear user override so default behavior takes effect
    if (userToggled !== null) {
      setUserToggled(null);
    }
  }

  // Derive expanded state: user override if set, otherwise follow isThinking
  const isExpanded = userToggled !== null ? userToggled : isThinking;

  // Render nothing if no thinking state or empty blocks
  if (!thinkingState || thinkingState.blocks.length === 0) {
    return null;
  }

  const blockCount = thinkingState.blocks.length;
  const blockWord = blockCount === 1 ? 'block' : 'blocks';

  return (
    <div className="thinking-disclosure" data-testid="thinking-disclosure">
      <button
        type="button"
        className="thinking-disclosure-trigger"
        onClick={() => setUserToggled((prev) => prev === null ? !isThinking : !prev)}
      >
        {thinkingState.isThinking ? (
          <span className="thinking-pulse">Thinking...</span>
        ) : (
          <span>{`Thinking (${blockCount} ${blockWord})`}</span>
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
          {thinkingState.blocks.map((block) => (
            <p key={block.id}>{block.text}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
