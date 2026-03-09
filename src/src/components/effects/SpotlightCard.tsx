/**
 * SpotlightCard -- mouse-tracking radial gradient hover wrapper.
 *
 * Cherry-picked from React Bits SpotlightCard, adapted to OKLCH design tokens.
 * Tracks mouse position via onMouseMove, sets --mouse-x/--mouse-y CSS custom
 * properties. A ::before pseudo-element renders the radial gradient spotlight.
 *
 * Constitution: Named export (2.2), cn() for classes (3.6), design tokens only (7.14).
 */

import { useRef, type MouseEvent, type ReactNode } from 'react';
import { cn } from '@/utils/cn';
import './SpotlightCard.css';

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
}

export function SpotlightCard({ children, className }: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    ref.current.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    ref.current.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  };

  return (
    <div ref={ref} onMouseMove={handleMouseMove} className={cn('spotlight-card', className)}>
      {children}
    </div>
  );
}
