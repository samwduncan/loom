import { useState, useEffect, useRef } from 'react';
import '../../styles/aurora-shimmer.css';

interface ReconnectSkeletonsProps {
  /** Number of aurora atmosphere placeholders to render */
  count: number;
  /** True during reconnect load, false when messages arrive */
  isLoading: boolean;
}

/**
 * Aurora atmosphere placeholders shown during WebSocket reconnection.
 *
 * Each placeholder renders an atmospheric aurora glow field matching the
 * PreTokenIndicator's `.aurora-atmosphere` treatment for visual consistency
 * across all indicator components. Bars enter with a staggered delay
 * (each 80ms after the previous).
 *
 * When isLoading transitions to false, all bars exit with the same
 * `aurora-atmosphere-exit` fade-up dissolve used by PreTokenIndicator,
 * then unmount after the animation completes.
 */
export default function ReconnectSkeletons({ count, isLoading }: ReconnectSkeletonsProps) {
  const [shouldRender, setShouldRender] = useState(isLoading);
  const [exiting, setExiting] = useState(false);
  const prevLoading = useRef(isLoading);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const wasLoading = prevLoading.current;
    prevLoading.current = isLoading;

    if (wasLoading && !isLoading) {
      // Begin aurora dissolve-up exit
      setExiting(true);
      exitTimer.current = setTimeout(() => {
        setShouldRender(false);
        setExiting(false);
      }, 300); // matches aurora-dissolve-up duration
    } else if (!wasLoading && isLoading) {
      setShouldRender(true);
      setExiting(false);
    }

    return () => {
      if (exitTimer.current !== null) {
        clearTimeout(exitTimer.current);
      }
    };
  }, [isLoading]);

  if (!shouldRender) return null;

  return (
    <div className="space-y-2 py-2 px-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`aurora-atmosphere${exiting ? ' aurora-atmosphere-exit' : ''}`}
          style={{
            animationDelay: exiting ? undefined : `${i * 80}ms`,
            opacity: exiting ? undefined : 0,
            animation: exiting
              ? undefined
              : `aurora-stagger-in 300ms ease-out ${i * 80}ms forwards`,
          }}
        />
      ))}
    </div>
  );
}
