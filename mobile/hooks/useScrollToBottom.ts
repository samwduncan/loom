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
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
    const atBottom = distanceFromBottom <= BOTTOM_THRESHOLD;
    setIsAtBottom(atBottom);
  }, []);

  const scrollToBottom = useCallback(() => {
    if (listRef.current) {
      // FlashList and FlatList both support scrollToEnd
      listRef.current.scrollToEnd({ animated: true });
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
