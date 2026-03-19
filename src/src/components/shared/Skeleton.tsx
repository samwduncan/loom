/**
 * Skeleton -- reusable shimmer skeleton primitive for loading states.
 *
 * Uses the global `skeleton-shimmer` class from base.css for directional sweep animation.
 * Shape is controlled via className (e.g., rounded-full, rounded-md).
 *
 * Constitution: Named export (2.2), cn() for classes (3.6), design tokens only (3.1).
 */

import { cn } from '@/utils/cn';

export interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('skeleton-shimmer', className)}
      aria-hidden="true"
    />
  );
}
