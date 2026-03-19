/**
 * Skeleton -- reusable shimmer skeleton primitive for loading states.
 *
 * Uses the global `skeleton-shimmer` class from base.css for directional sweep animation.
 * Three variants: line (default), circle, block.
 *
 * Constitution: Named export (2.2), cn() for classes (3.6), design tokens only (3.1).
 */

import { cn } from '@/utils/cn';

export interface SkeletonProps {
  className?: string;
  variant?: 'line' | 'circle' | 'block';
}

export function Skeleton({ className, variant = 'line' }: SkeletonProps) {
  return (
    <div
      className={cn(
        'skeleton-shimmer',
        variant === 'circle' && 'rounded-full',
        variant === 'block' && 'rounded-md',
        className,
      )}
      aria-hidden="true"
    />
  );
}
