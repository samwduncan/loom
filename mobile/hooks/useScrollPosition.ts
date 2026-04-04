/**
 * useScrollPosition -- MMKV-backed scroll offset persistence per session.
 *
 * SEPARATE from useScrollToBottom (which handles bottom-detection and pill logic).
 * This hook handles saving/restoring scroll position for session switches (CHAT-07, D-32).
 *
 * Saves are debounced (200ms) to avoid MMKV thrashing during rapid scroll events.
 */

import { useCallback, useEffect, useRef } from 'react';
import { MMKV } from 'react-native-mmkv';

const mmkv = new MMKV();
const SCROLL_KEY_PREFIX = 'scroll-offset-';

interface UseScrollPositionReturn {
  saveOffset: (sessionId: string, offset: number) => void;
  getOffset: (sessionId: string) => number;
  clearOffset: (sessionId: string) => void;
}

export function useScrollPosition(): UseScrollPositionReturn {
  // Debounce saves to avoid MMKV thrashing during scroll
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveOffset = useCallback((sessionId: string, offset: number) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      mmkv.set(`${SCROLL_KEY_PREFIX}${sessionId}`, offset);
    }, 200);
  }, []);

  const getOffset = useCallback((sessionId: string): number => {
    return mmkv.getNumber(`${SCROLL_KEY_PREFIX}${sessionId}`) ?? 0;
  }, []);

  const clearOffset = useCallback((sessionId: string) => {
    mmkv.delete(`${SCROLL_KEY_PREFIX}${sessionId}`);
  }, []);

  // Clean up pending save timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  return { saveOffset, getOffset, clearOffset };
}
