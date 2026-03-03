import { useState, useEffect } from 'react';
import '../../styles/aurora-shimmer.css';

interface ReconnectSkeletonsProps {
  /** Number of skeleton message placeholders to render */
  count: number;
  /** True during reconnect load, false when messages arrive */
  isLoading: boolean;
}

/**
 * Skeleton message placeholders shown during WebSocket reconnection.
 *
 * Each placeholder renders 3 aurora-shimmer lines at varying widths
 * (100%, 90%, 75%) to mimic message-like content blocks. When isLoading
 * transitions to false, the skeletons fade out over 200ms before
 * unmounting -- distinct from PreTokenIndicator's 300ms collapse-upward.
 */
export default function ReconnectSkeletons({ count, isLoading }: ReconnectSkeletonsProps) {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!isLoading && visible) {
      setFading(true);
      const timer = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(timer);
    }
    if (isLoading) {
      setVisible(true);
      setFading(false);
    }
  }, [isLoading]); // eslint-disable-line react-hooks/exhaustive-deps -- visible is intentionally omitted to avoid re-triggering on own state change

  if (!visible) return null;

  return (
    <div style={{ opacity: fading ? 0 : 1, transition: 'opacity 200ms ease-out' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="py-3 px-4 space-y-2">
          <div className="aurora-skeleton-line" style={{ width: '100%' }} />
          <div className="aurora-skeleton-line" style={{ width: '90%' }} />
          <div className="aurora-skeleton-line" style={{ width: '75%' }} />
        </div>
      ))}
    </div>
  );
}
