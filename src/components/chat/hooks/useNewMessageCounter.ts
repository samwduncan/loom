import { useEffect, useRef, useState } from 'react';

/**
 * useNewMessageCounter — tracks the number of new messages that have
 * arrived since the user scrolled away from the bottom of the message list.
 *
 * Used by the floating scroll pill to show "N new messages" during streaming.
 *
 * @param currentMessageCount  Total number of messages in the current view.
 * @param isUserScrolledUp     Whether the user has intentionally scrolled up.
 * @returns `{ newMessageCount }` — the delta since the user scrolled away.
 */
export function useNewMessageCounter(
  currentMessageCount: number,
  isUserScrolledUp: boolean,
) {
  // Stores the message count at the moment the user first scrolled up.
  // `null` means "not scrolled up" — distinguishes from "scrolled up at count 0".
  const snapshotRef = useRef<number | null>(null);
  const [newMessageCount, setNewMessageCount] = useState(0);

  useEffect(() => {
    if (isUserScrolledUp) {
      // Take a snapshot the first time the user scrolls up.
      if (snapshotRef.current === null) {
        snapshotRef.current = currentMessageCount;
      }
      // Update the delta while scrolled up.
      setNewMessageCount(
        Math.max(0, currentMessageCount - (snapshotRef.current ?? currentMessageCount)),
      );
    } else {
      // User scrolled back to bottom — reset.
      snapshotRef.current = null;
      setNewMessageCount(0);
    }
  }, [isUserScrolledUp, currentMessageCount]);

  return { newMessageCount };
}
