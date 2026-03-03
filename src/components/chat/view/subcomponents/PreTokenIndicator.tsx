import { useState, useEffect, useRef } from 'react';
import '../../styles/aurora-shimmer.css';

interface PreTokenIndicatorProps {
  isVisible: boolean;
}

/**
 * Pre-token aurora aura indicator.
 *
 * Renders a soft, pulsing rainbow glow bar (Gemini-style) beneath where
 * AI content will appear. When isVisible transitions to false, the aura
 * collapses upward using a CSS Grid 1fr->0fr animation before unmounting.
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
      setExiting(true);
      exitTimer.current = setTimeout(() => {
        setShouldRender(false);
        setExiting(false);
      }, 300);
    } else if (!wasVisible && isVisible) {
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
        <div className="py-4 px-4">
          <div className="relative" style={{ height: '16px' }}>
            {/* Diffused glow layer */}
            <div
              className="aurora-aura absolute inset-x-0"
              style={{ top: '6px' }}
            />
            {/* Bright core line on top */}
            <div
              className="aurora-aura-core absolute inset-x-0"
              style={{ top: '7px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
