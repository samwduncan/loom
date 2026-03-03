import { useState, useEffect } from 'react';
import '../../styles/aurora-shimmer.css';

interface ReconnectSkeletonsProps {
  /** Number of aurora aura placeholders to render */
  count: number;
  /** True during reconnect load, false when messages arrive */
  isLoading: boolean;
}

/**
 * Aurora aura placeholders shown during WebSocket reconnection.
 *
 * Each placeholder renders a soft pulsing rainbow glow bar where
 * new messages will appear. When isLoading transitions to false,
 * the placeholders fade out over 200ms before unmounting.
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
  }, [isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!visible) return null;

  return (
    <div style={{ opacity: fading ? 0 : 1, transition: 'opacity 200ms ease-out' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="py-3 px-4">
          <div className="relative" style={{ height: '16px' }}>
            <div
              className="aurora-aura absolute inset-x-0"
              style={{ top: '6px' }}
            />
            <div
              className="aurora-aura-core absolute inset-x-0"
              style={{ top: '7px' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
