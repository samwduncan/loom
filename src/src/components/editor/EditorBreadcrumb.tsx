/**
 * EditorBreadcrumb -- displays file path segments above the editor surface.
 *
 * Splits the path on "/" and renders each segment with separators.
 * Last segment is highlighted (text-foreground), others are muted.
 *
 * Constitution: Named export (2.2), design tokens only (7.14).
 */

interface EditorBreadcrumbProps {
  filePath: string;
}

export function EditorBreadcrumb({ filePath }: EditorBreadcrumbProps) {
  const segments = filePath.split('/').filter(Boolean);

  return (
    <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border/8 text-xs font-[family-name:var(--font-mono)] overflow-x-auto min-w-0">
      {segments.map((segment, i) => {
        const isLast = i === segments.length - 1;
        return (
          <span key={`${i}-${segment}`} className="flex items-center gap-1 shrink-0">
            {i > 0 && <span className="text-muted-foreground">/</span>}
            <span className={isLast ? 'text-foreground' : 'text-muted-foreground'}>
              {segment}
            </span>
          </span>
        );
      })}
    </div>
  );
}
