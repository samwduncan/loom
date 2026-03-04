import { useState, useEffect, useRef } from 'react';
import '../../styles/aurora-shimmer.css';

interface PreTokenIndicatorProps {
  isVisible: boolean;
}

/**
 * Pre-token atmospheric aurora indicator.
 *
 * Renders a diffused, layered aurora glow field beneath where AI content will
 * appear -- evoking aurora lights shining down. When isVisible transitions to
 * false, the field fades upward and dissolves (no grid collapse, no layout
 * jump). Uses compositor-thread animation via @property --aurora-angle.
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
      className={`aurora-atmosphere${exiting ? ' aurora-atmosphere-exit' : ''}`}
    />
  );
}
