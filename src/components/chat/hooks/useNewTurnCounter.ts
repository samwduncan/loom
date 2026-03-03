import { useEffect, useRef, useState } from 'react';

/**
 * useNewTurnCounter — tracks the number of new assistant turns that have
 * arrived since the user scrolled away from the bottom of the message list.
 *
 * Used by the floating scroll pill to show "N new turns" during streaming.
 *
 * @param turnCount   Total number of assistant turns in the current session.
 * @param isUserScrolledUp  Whether the user has intentionally scrolled up.
 * @returns `{ newTurnCount }` — the delta since the user scrolled away.
 */
export function useNewTurnCounter(
  turnCount: number,
  isUserScrolledUp: boolean,
) {
  // Stores the turnCount at the moment the user first scrolled up.
  // `null` means "not scrolled up" — distinguishes from "scrolled up at turn 0".
  const snapshotRef = useRef<number | null>(null);
  const [newTurnCount, setNewTurnCount] = useState(0);

  useEffect(() => {
    if (isUserScrolledUp) {
      // Take a snapshot the first time the user scrolls up.
      if (snapshotRef.current === null) {
        snapshotRef.current = turnCount;
      }
      // Update the delta while scrolled up.
      setNewTurnCount(
        Math.max(0, turnCount - (snapshotRef.current ?? turnCount)),
      );
    } else {
      // User scrolled back to bottom — reset.
      snapshotRef.current = null;
      setNewTurnCount(0);
    }
  }, [isUserScrolledUp, turnCount]);

  return { newTurnCount };
}
