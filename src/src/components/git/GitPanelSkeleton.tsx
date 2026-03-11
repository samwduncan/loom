/**
 * GitPanelSkeleton -- Animated loading placeholder for the git panel.
 *
 * Renders pulse-animated blocks simulating the git panel layout:
 * branch header, file list rows, commit message area.
 *
 * Constitution: Named export (2.2), token-based styling (3.1).
 */

export function GitPanelSkeleton() {
  return (
    <div className="space-y-4 p-3" data-testid="git-panel-skeleton">
      {/* Branch name area */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 animate-pulse rounded bg-surface-raised" />
        <div className="h-4 w-24 animate-pulse rounded bg-surface-raised" />
      </div>

      {/* File list skeleton rows */}
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="h-3 w-3 animate-pulse rounded bg-surface-raised" />
          <div
            className="h-3 animate-pulse rounded bg-surface-raised"
            style={{ width: `${40 + i * 8}%` }}
          />
        </div>
      ))}

      {/* Commit message area */}
      <div className="space-y-2 pt-2">
        <div className="h-4 w-28 animate-pulse rounded bg-surface-raised" />
        <div className="h-20 w-full animate-pulse rounded-md bg-surface-raised" />
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <div className="h-8 w-20 animate-pulse rounded-md bg-surface-raised" />
        <div className="h-8 w-16 animate-pulse rounded-md bg-surface-raised" />
      </div>
    </div>
  );
}
