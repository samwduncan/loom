/**
 * SessionListSkeleton -- shimmer skeleton rows mimicking SessionItem dimensions.
 *
 * 4 rows with shimmer animation matching real SessionItem spacing tokens
 * to prevent CLS. Uses skeleton-shimmer class from sidebar.css.
 *
 * Constitution: Named export (2.2), token-based styling (3.1).
 */

import { cn } from '@/utils/cn';
import './sidebar.css';

export function SessionListSkeleton() {
  return (
    <div className="px-3 py-2" role="status" aria-label="Loading sessions">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="py-2">
          {/* Title skeleton */}
          <div
            className={cn(
              'skeleton-shimmer h-4 rounded',
              i % 2 === 0 ? 'w-3/4' : 'w-1/2',
            )}
          />
          {/* Timestamp + icon skeleton */}
          <div className="flex items-center gap-1.5 mt-1.5">
            <div className="skeleton-shimmer h-3 w-12 rounded" />
            <div className="skeleton-shimmer h-3 w-3 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
