/**
 * useScrollToBottom -- scroll position tracking for chat message list.
 *
 * Tracks whether user is near the bottom of the list (within threshold).
 * Exposes showPill boolean for the scroll-to-bottom pill overlay.
 * Works with both FlashList and FlatList refs.
 */

import { useRef, useState, useCallback } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

/** Pixels from bottom to consider "at bottom" */
const BOTTOM_THRESHOLD = 100;

interface UseScrollToBottomReturn {
  isAtBottom: boolean;
  showPill: boolean;
  scrollToBottom: () => void;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  listRef: React.RefObject<any>;
}

export function useScrollToBottom(hasMessages: boolean): UseScrollToBottomReturn {
  const listRef = useRef<any>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset } = event.nativeEvent;
    // For inverted FlatList: offset 0 = bottom (newest), offset increases = scrolled up (older)
    const atBottom = contentOffset.y <= BOTTOM_THRESHOLD;
    setIsAtBottom(atBottom);
  }, []);

  const scrollToBottom = useCallback(() => {
    if (listRef.current) {
      // For inverted FlatList: offset 0 = newest messages (visual bottom)
      listRef.current.scrollToOffset({ offset: 0, animated: true });
      setIsAtBottom(true);
    }
  }, []);

  const showPill = hasMessages && !isAtBottom;

  return {
    isAtBottom,
    showPill,
    scrollToBottom,
    onScroll,
    listRef,
  };
}
