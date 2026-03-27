/**
 * FollowUpPills -- contextual follow-up suggestions after assistant messages.
 *
 * Derives 2-3 follow-up prompts based on the last assistant message content
 * using client-side heuristics (code blocks, errors, lists, default).
 *
 * Constitution: Named exports (2.2), design tokens only (3.1).
 */

import { useMemo } from 'react';
import { cn } from '@/utils/cn';
import type { Message } from '@/types/message';
import './follow-up-pills.css';

interface FollowUpPillsProps {
  lastMessage: Message | null;
  onSelect: (text: string) => void;
  isStreaming: boolean;
}

const CODE_SUGGESTIONS = [
  'Explain this code',
  'Refactor this',
  'Write tests for this',
] as const;

const ERROR_SUGGESTIONS = [
  'What caused this?',
  'How do I prevent this?',
  'Show me the fix',
] as const;

const LIST_SUGGESTIONS = [
  'Go deeper on step 1',
  'Are there alternatives?',
  'Summarize this',
] as const;

const DEFAULT_SUGGESTIONS = [
  'Tell me more',
  'Give me an example',
  'What should I do next?',
] as const;

function deriveSuggestions(content: string): string[] {
  // Check for code blocks (``` markers)
  if (/```[\s\S]*?```/.test(content)) {
    return CODE_SUGGESTIONS.slice(0, 3) as unknown as string[];
  }

  // Check for error-related content
  if (/\b(error|exception|bug|fix|issue|failed|failure|crash)\b/i.test(content)) {
    return ERROR_SUGGESTIONS.slice(0, 3) as unknown as string[];
  }

  // Check for numbered lists or step-by-step content
  if (/(?:^|\n)\s*(?:\d+[\.\)]\s|[-*]\s)/m.test(content)) {
    return LIST_SUGGESTIONS.slice(0, 3) as unknown as string[];
  }

  // Default fallback
  return DEFAULT_SUGGESTIONS.slice(0, 3) as unknown as string[];
}

export function FollowUpPills({ lastMessage, onSelect, isStreaming }: FollowUpPillsProps) {
  const suggestions = useMemo(() => {
    if (!lastMessage || lastMessage.role !== 'assistant' || isStreaming) {
      return null;
    }
    return deriveSuggestions(lastMessage.content);
  }, [lastMessage, isStreaming]);

  if (!suggestions) return null;

  return (
    <div className="follow-up-pills" data-testid="follow-up-pills">
      {suggestions.map((text) => (
        <button
          key={text}
          type="button"
          onClick={() => onSelect(text)}
          data-testid="follow-up-pill"
          className={cn(
            'shrink-0 rounded-lg bg-surface-raised px-3 py-1.5 text-sm text-secondary',
            'hover:bg-surface-overlay transition-colors',
            'border border-border/10',
          )}
        >
          {text}
        </button>
      ))}
    </div>
  );
}
