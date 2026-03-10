/**
 * PanelPlaceholder -- Centered placeholder stub for panels not yet implemented.
 *
 * Used as temporary content for Files, Shell, and Git panels until their
 * real implementations are built in later phases.
 *
 * Constitution: Named export (2.2), token-based styling (3.1).
 */

interface PanelPlaceholderProps {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function PanelPlaceholder({ name, icon: Icon }: PanelPlaceholderProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <Icon className="h-16 w-16 text-muted opacity-30" />
      <p className="text-sm text-muted">{name} panel coming soon</p>
    </div>
  );
}
