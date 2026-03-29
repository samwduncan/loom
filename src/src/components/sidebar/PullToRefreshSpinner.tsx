/**
 * PullToRefreshSpinner -- SVG circle spinner for pull-to-refresh indicator.
 *
 * Two states:
 * - Pulling: partial arc proportional to pull distance, opacity scales with progress
 * - Refreshing: full rotation animation with fixed height
 *
 * 24px diameter SVG circle. Uses var(--accent-primary) for stroke color.
 *
 * Constitution: Named export (2.2), design tokens (3.1), cn() for classes (3.6).
 */

import { cn } from '@/utils/cn';

interface PullToRefreshSpinnerProps {
  pullDistance: number;
  isRefreshing: boolean;
  threshold: number;
}

export function PullToRefreshSpinner({ pullDistance, isRefreshing, threshold }: PullToRefreshSpinnerProps) {
  if (pullDistance <= 0 && !isRefreshing) return null;

  const progress = Math.min(pullDistance / threshold, 1);
  const opacity = isRefreshing ? 1 : progress;
  const rotation = isRefreshing ? undefined : progress * 270; // partial arc

  return (
    <div
      className="flex items-center justify-center"
      style={{
        height: isRefreshing ? 40 : pullDistance * 0.6,
        opacity,
        transition: !isRefreshing ? 'none' : 'height var(--duration-normal) var(--ease-spring-snappy)',
      }}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        className={cn(isRefreshing && 'animate-spin')}
        style={{
          animationDuration: '800ms',
          ...(!isRefreshing && rotation !== undefined
            ? { transform: `rotate(${rotation}deg)` }
            : {}),
        }}
      >
        <circle
          cx="12" cy="12" r="10"
          stroke="var(--accent-primary)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={isRefreshing ? '45 18' : `${progress * 63} ${63 - progress * 63}`}
          fill="none"
        />
      </svg>
    </div>
  );
}
