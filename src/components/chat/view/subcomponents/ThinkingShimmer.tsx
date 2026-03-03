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
 * Renders nothing when isThinking is false to avoid wasted DOM nodes.
 */
export default function ThinkingShimmer({ isThinking }: ThinkingShimmerProps) {
  if (!isThinking) return null;

  return (
    <div className="flex items-center gap-3 py-2 px-4">
      <span className="aurora-thinking-text text-sm tracking-wide">
        Thinking...
      </span>
    </div>
  );
}
