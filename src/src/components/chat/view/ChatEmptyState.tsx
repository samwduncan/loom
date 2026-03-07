/**
 * ChatEmptyState -- welcome screen for new/blank chat.
 *
 * Centered "Loom" wordmark in Instrument Serif + subtitle + suggestion chips.
 * Chips populate the composer input text when clicked.
 *
 * Constitution: Named exports (2.2), design tokens only (3.1).
 */

import { cn } from '@/utils/cn';

interface ChatEmptyStateProps {
  onSuggestionClick?: (text: string) => void;
}

const SUGGESTIONS = [
  'Review my code',
  'Debug this error',
  'Explain this file',
  'Write tests',
] as const;

export function ChatEmptyState({ onSuggestionClick }: ChatEmptyStateProps) {
  return (
    <div
      className="flex flex-1 items-center justify-center"
      data-testid="chat-empty-state"
    >
      <div className="text-center">
        <h1 className="font-serif italic text-3xl text-foreground">Loom</h1>
        <p className="mt-2 text-sm text-muted">
          What would you like to work on?
        </p>
        {onSuggestionClick && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => onSuggestionClick(suggestion)}
                className={cn(
                  'rounded-lg bg-surface-raised px-3 py-1.5 text-sm text-secondary',
                  'hover:bg-surface-overlay transition-colors',
                  'border border-border',
                )}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
