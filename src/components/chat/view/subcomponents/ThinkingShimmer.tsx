import { useState, useEffect, useRef } from 'react';
import '../../styles/aurora-shimmer.css';

interface ThinkingShimmerProps {
  isThinking: boolean;
}

/**
 * "Thinking..." text indicator with aurora rainbow shimmer effect.
 *
 * Displays "Thinking..." with a shifting rainbow gradient applied to the
 * letterforms via background-clip: text. The animation is pure CSS using
 * @property --aurora-angle, so it runs on the compositor thread and does
 * not compete with streaming rAF updates on the main thread.
 *
 * Positioned above (before in DOM order) the PreTokenIndicator aurora field
 * in the message flow — two separate elements but visually connected.
 *
 * Exit: fades out with a 250ms opacity transition when isThinking goes false,
 * then unmounts. Does not use the aurora-dissolve-up animation to avoid
 * competing with PreTokenIndicator's own fade-up exit.
 */
export default function ThinkingShimmer({ isThinking }: ThinkingShimmerProps) {
  const [shouldRender, setShouldRender] = useState(isThinking);
  const [exiting, setExiting] = useState(false);
  const prevThinking = useRef(isThinking);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const wasThinking = prevThinking.current;
    prevThinking.current = isThinking;

    if (wasThinking && !isThinking) {
      // Begin exit fade
      setExiting(true);
      exitTimer.current = setTimeout(() => {
        setShouldRender(false);
        setExiting(false);
      }, 250);
    } else if (!wasThinking && isThinking) {
      // Enter
      setShouldRender(true);
      setExiting(false);
    }

    return () => {
      if (exitTimer.current !== null) {
        clearTimeout(exitTimer.current);
      }
    };
  }, [isThinking]);

  if (!shouldRender) return null;

  return (
    <div
      className="flex items-center gap-3 py-2 px-4"
      style={{
        opacity: exiting ? 0 : 1,
        transition: 'opacity 250ms ease-out',
      }}
    >
      <span className="aurora-thinking-text text-sm tracking-wide">
        Thinking...
      </span>
    </div>
  );
}
