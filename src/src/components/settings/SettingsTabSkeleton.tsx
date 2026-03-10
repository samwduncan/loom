/**
 * SettingsTabSkeleton -- Animated loading placeholder for settings tab content.
 *
 * Renders pulse-animated blocks simulating form fields (labels + inputs).
 * Used as fallback while actual tab content loads.
 *
 * Constitution: Named export (2.2), token-based styling (3.1), cn() for classes (3.6).
 */

import { cn } from '@/utils/cn';

export function SettingsTabSkeleton() {
  return (
    <div className="space-y-6 p-1" data-testid="settings-tab-skeleton">
      {/* Simulated section header */}
      <div className="space-y-3">
        <div className={cn('h-5 w-32 animate-pulse rounded-md bg-surface-raised')} />
        <div className={cn('h-10 w-full animate-pulse rounded-md bg-surface-raised')} />
      </div>

      {/* Simulated half-width field */}
      <div className="space-y-3">
        <div className={cn('h-5 w-24 animate-pulse rounded-md bg-surface-raised')} />
        <div className={cn('h-10 w-1/2 animate-pulse rounded-md bg-surface-raised')} />
      </div>

      {/* Simulated toggle row */}
      <div className="flex items-center justify-between">
        <div className={cn('h-5 w-40 animate-pulse rounded-md bg-surface-raised')} />
        <div className={cn('h-6 w-10 animate-pulse rounded-full bg-surface-raised')} />
      </div>

      {/* Simulated section header + field */}
      <div className="space-y-3">
        <div className={cn('h-5 w-28 animate-pulse rounded-md bg-surface-raised')} />
        <div className={cn('h-10 w-full animate-pulse rounded-md bg-surface-raised')} />
      </div>
    </div>
  );
}
