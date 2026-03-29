/**
 * usePullToRefresh -- vertical pull gesture hook for session list refresh.
 *
 * Uses @use-gesture/react useDrag with axis:'y' to detect downward pulls.
 * Only activates when the scroll container is at the top (scrollTop === 0).
 * Pull past threshold (default 60px) triggers the refresh callback.
 * Release below threshold snaps back without fetching.
 *
 * filterTaps:true prevents interference with tap gestures.
 * Capped at 120px to prevent over-pull.
 *
 * Constitution: Named export (2.2), no default export.
 */

import { useState, useCallback, useRef } from 'react';
import { useDrag } from '@use-gesture/react';
import { hapticEvent } from '@/lib/haptics';
import { toast } from 'sonner';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  scrollRef: React.RefObject<HTMLElement | null>;
  threshold?: number; // default 60
}

interface UsePullToRefreshReturn {
  bind: ReturnType<typeof useDrag>;
  pullDistance: number;
  isRefreshing: boolean;
}

export function usePullToRefresh({
  onRefresh,
  scrollRef,
  threshold = 60,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isActive = useRef(false);

  const doRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
      hapticEvent('pullToRefreshComplete');
    } catch {
      toast.error("Couldn't refresh sessions. Check your connection and try again.");
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
    }
  }, [onRefresh]);

  const bind = useDrag(
    ({ movement: [, my], active, cancel }) => {
      // Only activate at scroll top
      const scrollTop = scrollRef.current?.scrollTop ?? 0;
      if (scrollTop > 0) {
        cancel();
        return;
      }

      // Don't start new pull while refreshing
      if (isRefreshing) {
        cancel();
        return;
      }

      if (active) {
        // Only allow downward pull (positive Y)
        const clamped = Math.max(0, Math.min(my, 120)); // Cap at 120px
        setPullDistance(clamped);
        isActive.current = true;
      } else if (isActive.current) {
        isActive.current = false;
        if (my >= threshold) {
          void doRefresh();
        } else {
          setPullDistance(0); // Snap back
        }
      }
    },
    {
      axis: 'y',
      filterTaps: true,
      pointer: { touch: true },
      threshold: [Infinity, 10], // 10px vertical before activating
    },
  );

  return { bind, pullDistance, isRefreshing };
}
