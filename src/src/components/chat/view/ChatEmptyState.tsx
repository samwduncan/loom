/**
 * ChatEmptyState -- welcome screen for new/blank chat.
 *
 * Centered "Loom" wordmark in Instrument Serif + subtitle + categorized
 * template chips. Chips populate the composer input text when clicked.
 *
 * Constitution: Named exports (2.2), design tokens only (3.1).
 */

import { cn } from '@/utils/cn';

export interface ChatEmptyStateProps {
  onSuggestionClick?: (text: string) => void;
}

const TEMPLATE_CATEGORIES = [
  {
    label: 'Code',
    templates: ['Review my code', 'Debug this error', 'Explain this file', 'Write tests'],
  },
  {
    label: 'Create',
    templates: ['Generate a component', 'Write a script', 'Create an API endpoint', 'Build a CLI tool'],
  },
  {
    label: 'Learn',
    templates: ['Explain this concept', 'Compare approaches', 'Best practices for...', 'How does this work?'],
  },
] as const;

export function ChatEmptyState({ onSuggestionClick }: ChatEmptyStateProps) {
  return (
    <div
      className="flex flex-1 items-center justify-center"
      data-testid="chat-empty-state"
    >
      <div className="text-center max-w-lg px-4">
        <h1 className="font-serif italic text-3xl text-foreground">Loom</h1>
        <p className="mt-2 text-sm text-muted">
          What would you like to work on?
        </p>
        {onSuggestionClick && (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {TEMPLATE_CATEGORIES.map((category) => (
              <div key={category.label} data-testid="template-category">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">
                  {category.label}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {category.templates.map((template) => (
                    <button
                      key={template}
                      type="button"
                      onClick={() => onSuggestionClick(template)}
                      className={cn(
                        'rounded-lg bg-surface-raised px-3 py-1.5 text-sm text-secondary',
                        'min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 flex items-center justify-center',
                        'hover:bg-surface-overlay transition-colors',
                        'border border-border/10',
                        'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                      )}
                    >
                      {template}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
