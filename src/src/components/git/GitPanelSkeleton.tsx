/**
 * GitPanelSkeleton -- Animated loading placeholder for the git panel.
 *
 * Renders shimmer-animated blocks simulating the git panel layout:
 * branch header, file list rows, commit message area.
 *
 * Constitution: Named export (2.2), token-based styling (3.1).
 */

export function GitPanelSkeleton() {
  return (
    <div className="space-y-4 p-3" role="status" aria-label="Loading git panel" data-testid="git-panel-skeleton">
      {/* Branch name area */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 skeleton-shimmer rounded" />
        <div className="h-4 w-24 skeleton-shimmer rounded" />
      </div>

      {/* File list skeleton rows */}
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 skeleton-shimmer rounded" />
        <div className="h-3 w-2/5 skeleton-shimmer rounded" />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 skeleton-shimmer rounded" />
        <div className="h-3 w-3/5 skeleton-shimmer rounded" />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 skeleton-shimmer rounded" />
        <div className="h-3 w-1/2 skeleton-shimmer rounded" />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 skeleton-shimmer rounded" />
        <div className="h-3 w-7/12 skeleton-shimmer rounded" />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 skeleton-shimmer rounded" />
        <div className="h-3 w-4/5 skeleton-shimmer rounded" />
      </div>

      {/* Commit message area */}
      <div className="space-y-2 pt-2">
        <div className="h-4 w-28 skeleton-shimmer rounded" />
        <div className="h-20 w-full skeleton-shimmer rounded-md" />
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <div className="h-8 w-20 skeleton-shimmer rounded-md" />
        <div className="h-8 w-16 skeleton-shimmer rounded-md" />
      </div>
    </div>
  );
}
