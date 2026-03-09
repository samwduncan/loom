/**
 * useMessageSearch -- session-scoped message search with debounced filtering.
 *
 * Provides search state management, case-insensitive message filtering
 * (content + thinking blocks), and match highlighting via <mark> elements.
 *
 * Uses 150ms debounce on filter query to avoid re-filtering on every keystroke.
 * The immediate `query` state drives the input display; `debouncedQuery` drives filtering.
 *
 * Constitution: Named exports (2.2), no inline styles (7.14).
 */

import { useState, useRef, useCallback, useEffect, type ReactNode } from 'react';
import { createElement } from 'react';
import type { Message } from '@/types/message';

interface UseMessageSearchReturn {
  /** Current query string (immediate, for input display) */
  query: string;
  /** Update query -- triggers 150ms debounce before filtering applies */
  setQuery: (q: string) => void;
  /** Whether search bar is open */
  isOpen: boolean;
  /** Open search bar */
  open: () => void;
  /** Close search bar and reset query */
  close: () => void;
  /** Toggle search bar open/close */
  toggle: () => void;
  /** Filter messages by debounced query. Returns all when query is empty. */
  filterMessages: (messages: Message[]) => Message[];
  /** Wrap matching substrings in <mark> elements. Returns original text when no query. */
  highlightText: (text: string) => ReactNode;
  /** The debounced query used for actual filtering */
  debouncedQuery: string;
}

export function useMessageSearch(): UseMessageSearchReturn {
  const [query, setQueryState] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setQuery = useCallback((q: string) => {
    setQueryState(q);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(q);
    }, 150);
  }, []);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setQueryState('');
    setDebouncedQuery('');
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      if (prev) {
        // Closing -- reset query
        setQueryState('');
        setDebouncedQuery('');
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
      }
      return !prev;
    });
  }, []);

  const filterMessages = useCallback(
    (messages: Message[]): Message[] => {
      if (!debouncedQuery) return messages;

      const lower = debouncedQuery.toLowerCase();

      return messages.filter((msg) => {
        // Search message content
        if (msg.content.toLowerCase().includes(lower)) return true;

        // Search thinking blocks
        if (msg.thinkingBlocks?.some((b) => b.text.toLowerCase().includes(lower))) return true;

        // Do NOT search tool call inputs/outputs
        return false;
      });
    },
    [debouncedQuery],
  );

  const highlightText = useCallback(
    (text: string): ReactNode => {
      if (!debouncedQuery) return text;

      const lower = debouncedQuery.toLowerCase();
      const textLower = text.toLowerCase();
      const idx = textLower.indexOf(lower);

      if (idx === -1) return text;

      // Split and highlight all occurrences
      const parts: ReactNode[] = [];
      let lastIdx = 0;
      let searchStart = 0;

      while (searchStart < text.length) {
        const matchIdx = textLower.indexOf(lower, searchStart);
        if (matchIdx === -1) break;

        if (matchIdx > lastIdx) {
          parts.push(text.slice(lastIdx, matchIdx));
        }

        parts.push(
          createElement(
            'mark',
            { key: `hl-${matchIdx}`, className: 'bg-primary/20 rounded-sm' },
            text.slice(matchIdx, matchIdx + debouncedQuery.length),
          ),
        );

        lastIdx = matchIdx + debouncedQuery.length;
        searchStart = lastIdx;
      }

      if (lastIdx < text.length) {
        parts.push(text.slice(lastIdx));
      }

      return parts.length > 0 ? parts : text;
    },
    [debouncedQuery],
  );

  return {
    query,
    setQuery,
    isOpen,
    open,
    close,
    toggle,
    filterMessages,
    highlightText,
    debouncedQuery,
  };
}
