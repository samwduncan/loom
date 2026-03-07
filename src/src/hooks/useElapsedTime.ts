/**
 * useElapsedTime -- hook for live elapsed time display on tool cards/chips.
 *
 * When completedAt is set, returns a frozen formatted value (no interval).
 * When completedAt is null and startedAt is set, updates every 100ms.
 * Cleans up interval on unmount and when completedAt transitions to non-null.
 *
 * Uses "adjust state during rendering" pattern for completedAt transitions
 * (React docs: you-might-not-need-an-effect) to avoid setState-in-effect.
 *
 * Constitution: Named export only (2.2).
 */

import { useState, useEffect, useRef } from 'react';
import { formatElapsed } from '@/lib/format-elapsed';

function computeElapsed(startedAt: string, endTime: string | null): string {
  const start = new Date(startedAt).getTime();
  const end = endTime ? new Date(endTime).getTime() : Date.now();
  return formatElapsed(end - start);
}

export function useElapsedTime(
  startedAt: string | null,
  completedAt: string | null,
): string {
  const [elapsed, setElapsed] = useState(() => {
    if (!startedAt) return '';
    return computeElapsed(startedAt, completedAt);
  });

  // "Adjust state during rendering" pattern: when completedAt changes
  // from null to non-null, freeze the elapsed value immediately.
  const [prevCompletedAt, setPrevCompletedAt] = useState(completedAt);
  if (prevCompletedAt !== completedAt) {
    setPrevCompletedAt(completedAt);
    if (startedAt && completedAt) {
      setElapsed(computeElapsed(startedAt, completedAt));
    }
  }

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedAtRef = useRef(completedAt);

  // Sync completedAt ref via effect (Constitution: no ref writes during render)
  useEffect(() => {
    completedAtRef.current = completedAt;
  }, [completedAt]);

  useEffect(() => {
    if (!startedAt || completedAt) return;

    // Live -- update every 100ms
    const start = new Date(startedAt).getTime();

    const tick = () => {
      // Belt-and-suspenders: if completedAt was set between ticks, stop
      if (completedAtRef.current) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return;
      }
      setElapsed(formatElapsed(Date.now() - start));
    };

    intervalRef.current = setInterval(tick, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [startedAt, completedAt]);

  return elapsed;
}
