/**
 * useSwipeToDelete -- horizontal swipe gesture hook for session items.
 *
 * Uses @use-gesture/react useDrag with axis:'x' to detect left swipes.
 * Left swipe past 80px (or velocity > 0.5) reveals a delete zone.
 * Right swipes are cancelled. Release below threshold snaps back.
 *
 * filterTaps:true prevents interference with tap/long-press gestures.
 * from: () => [offset, 0] enables smooth resume from current position.
 *
 * Constitution: Named export (2.2), no default export.
 */

import { useState, useCallback, useRef } from 'react';
import { useDrag } from '@use-gesture/react';
import { hapticEvent } from '@/lib/haptics';

interface UseSwipeToDeleteReturn {
  bind: ReturnType<typeof useDrag>;
  offset: number;
  revealed: boolean;
  active: boolean;
  reset: () => void;
}

export function useSwipeToDelete(): UseSwipeToDeleteReturn {
  const [offset, setOffset] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [active, setActive] = useState(false);
  const hasPlayedRevealHaptic = useRef(false);

  const reset = useCallback(() => {
    setOffset(0);
    setRevealed(false);
    setActive(false);
    hasPlayedRevealHaptic.current = false;
  }, []);

  const bind = useDrag(
    ({ movement: [mx], velocity: [vx], direction: [dx], cancel, active: gestureActive }) => {
      // Only allow left swipe (negative direction)
      if (dx > 0 && mx > 0) {
        cancel();
        return;
      }

      setActive(gestureActive);

      if (gestureActive) {
        // Clamp: only allow leftward (negative), max -120px for over-drag
        const clamped = Math.max(-120, Math.min(0, mx));
        setOffset(clamped);

        // Haptic when passing threshold
        if (Math.abs(clamped) >= 80 && !hasPlayedRevealHaptic.current) {
          hasPlayedRevealHaptic.current = true;
          hapticEvent('swipeReveal');
        }
      } else {
        // Release: check threshold or velocity
        if (Math.abs(mx) > 80 || (vx > 0.5 && dx < 0)) {
          setRevealed(true);
          setOffset(-80); // Snap to reveal position
          if (!hasPlayedRevealHaptic.current) {
            hapticEvent('swipeReveal');
          }
        } else {
          setOffset(0); // Snap back
          setRevealed(false);
        }
        hasPlayedRevealHaptic.current = false;
      }
    },
    {
      axis: 'x',
      filterTaps: true,
      pointer: { touch: true },
      threshold: [10, Infinity], // 10px horizontal before activating
      from: () => [offset, 0], // Resume from current position for smooth repeated swipes
    },
  );

  return { bind, offset, revealed, active, reset };
}
