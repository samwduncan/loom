/**
 * SettingsTabSkeleton -- Animated loading placeholder for settings tab content.
 *
 * Renders shimmer-animated blocks simulating form fields (labels + inputs).
 * Used as fallback while actual tab content loads.
 *
 * Constitution: Named export (2.2), token-based styling (3.1).
 */

export function SettingsTabSkeleton() {
  return (
    <div className="space-y-6 p-1" role="status" aria-label="Loading settings" data-testid="settings-tab-skeleton">
      {/* Simulated section header */}
      <div className="space-y-3">
        <div className="h-5 w-32 skeleton-shimmer rounded-md" />
        <div className="h-10 w-full skeleton-shimmer rounded-md" />
      </div>

      {/* Simulated half-width field */}
      <div className="space-y-3">
        <div className="h-5 w-24 skeleton-shimmer rounded-md" />
        <div className="h-10 w-1/2 skeleton-shimmer rounded-md" />
      </div>

      {/* Simulated toggle row */}
      <div className="flex items-center justify-between">
        <div className="h-5 w-40 skeleton-shimmer rounded-md" />
        <div className="h-6 w-10 skeleton-shimmer rounded-full" />
      </div>

      {/* Simulated section header + field */}
      <div className="space-y-3">
        <div className="h-5 w-28 skeleton-shimmer rounded-md" />
        <div className="h-10 w-full skeleton-shimmer rounded-md" />
      </div>
    </div>
  );
}
