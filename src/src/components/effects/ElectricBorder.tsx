/**
 * ElectricBorder -- animated gradient border wrapper (StarBorder CSS pattern).
 *
 * Cherry-picked from React Bits StarBorder, adapted to OKLCH design tokens.
 * Uses two radial-gradient div elements that orbit along top/bottom edges.
 * CSS-only animation -- no Canvas, no JS animation loop.
 *
 * Constitution: Named export (2.2), cn() for classes (3.6), design tokens only (7.14).
 */

import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import './ElectricBorder.css';

interface ElectricBorderProps {
  children: ReactNode;
  active?: boolean;
  className?: string;
}

export function ElectricBorder({ children, active, className }: ElectricBorderProps) {
  return (
    <div className={cn('electric-border', className)} data-active={active ? 'true' : 'false'}>
      <div className="electric-border-gradient-top" aria-hidden="true" />
      <div className="electric-border-gradient-bottom" aria-hidden="true" />
      <div className="electric-border-content">
        {children}
      </div>
    </div>
  );
}
