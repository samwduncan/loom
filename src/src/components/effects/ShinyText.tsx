/**
 * ShinyText -- CSS-only shimmer text wrapper.
 *
 * Cherry-picked from React Bits ShinyText (CSS variant, NOT Framer Motion).
 * Uses background-clip: text with animated linear-gradient for the shimmer
 * sweep effect. When disabled, renders children as plain text.
 *
 * Constitution: Named export (2.2), cn() for classes (3.6), no Framer Motion (banned).
 */

import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import './ShinyText.css';

interface ShinyTextProps {
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function ShinyText({ children, disabled, className }: ShinyTextProps) {
  if (disabled) {
    return <span className={className}>{children}</span>;
  }

  return (
    <span className={cn('shiny-text', className)}>
      {children}
    </span>
  );
}
