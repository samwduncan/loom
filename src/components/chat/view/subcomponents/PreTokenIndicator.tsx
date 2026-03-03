import { useState, useEffect, useRef } from 'react';
import '../../styles/aurora-shimmer.css';

interface PreTokenIndicatorProps {
  isVisible: boolean;
}

/**
 * Pre-token skeleton indicator with aurora shimmer effect.
 *
 * Renders 4 uniform-width skeleton placeholder lines that shimmer with a
 * full rainbow aurora gradient while waiting for the first streamed token.
 * When isVisible transitions to false, the skeleton collapses upward using
 * a CSS Grid 1fr->0fr animation before unmounting.
 */
export default function PreTokenIndicator({ isVisible }: PreTokenIndicatorProps) {
  const [exiting, setExiting] = useState(false);
  const [shouldRender, setShouldRender] = useState(isVisible);
  const prevVisible = useRef(isVisible);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const wasVisible = prevVisible.current;
    prevVisible.current = isVisible;

    if (wasVisible && !isVisible) {
      // Transition from visible to hidden: trigger collapse animation
      setExiting(true);
      exitTimer.current = setTimeout(() => {
        setShouldRender(false);
        setExiting(false);
      }, 300);
    } else if (!wasVisible && isVisible) {
      // Transition from hidden to visible: mount immediately
      setShouldRender(true);
      setExiting(false);
    }

    return () => {
      if (exitTimer.current !== null) {
        clearTimeout(exitTimer.current);
      }
    };
  }, [isVisible]);

  if (!shouldRender) return null;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateRows: exiting ? '0fr' : '1fr',
        transition: 'grid-template-rows 300ms ease-out',
      }}
    >
      <div style={{ overflow: 'hidden' }}>
        <div className="py-3 px-4 space-y-2">
          <div className="aurora-skeleton-line" style={{ width: '100%' }} />
          <div className="aurora-skeleton-line" style={{ width: '100%' }} />
          <div className="aurora-skeleton-line" style={{ width: '100%' }} />
          <div className="aurora-skeleton-line" style={{ width: '85%' }} />
        </div>
      </div>
    </div>
  );
}
