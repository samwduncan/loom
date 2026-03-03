// DEPRECATED: Replaced by PreTokenIndicator (aurora shimmer skeleton) in Phase 7.
// Kept for potential future use. See ThinkingShimmer for the new thinking indicator.
import { useState, useEffect, useRef } from 'react';
import type { SessionProvider } from '../../../../types/app';
import SessionProviderLogo from '../../../llm-logo-provider/SessionProviderLogo';

const PHRASES = [
  'Thinking...',
  'Reading files...',
  'Analyzing code...',
  'Working on it...',
  'Processing...',
  'Searching...',
  'Considering options...',
  'Crafting response...',
  'Reviewing context...',
  'Almost there...',
  'Reasoning...',
  'Evaluating...',
] as const;

const ROTATION_INTERVAL = 3000;

interface ActivityIndicatorProps {
  provider: SessionProvider;
}

export function ActivityIndicator({ provider }: ActivityIndicatorProps) {
  // Start at a random index to avoid all indicators showing the same phrase
  const startIndex = useRef(Math.floor(Math.random() * PHRASES.length));
  const [phraseIndex, setPhraseIndex] = useState(startIndex.current);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % PHRASES.length);
    }, ROTATION_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 p-1 bg-transparent">
        <SessionProviderLogo provider={provider} className="w-full h-full" />
      </div>
      <span
        className="text-amber-500 font-mono text-sm"
        style={{
          animation: 'activity-blink 1s step-start infinite',
        }}
      >
        {PHRASES[phraseIndex]}
      </span>
      <style>{`
        @keyframes activity-blink {
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
