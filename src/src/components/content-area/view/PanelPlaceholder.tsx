/**
 * PanelPlaceholder -- Centered placeholder stub for panels not yet implemented.
 *
 * Used as temporary content for Files, Shell, and Git panels until their
 * real implementations are built in later phases.
 *
 * Constitution: Named export (2.2), cn() for classes (3.6), token-based styling (3.1).
 */

import { cn } from '@/utils/cn';

interface PanelPlaceholderProps {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function PanelPlaceholder({ name, icon: Icon }: PanelPlaceholderProps) {
  return (
    <div className={cn('flex h-full flex-col items-center justify-center gap-4')}>
      <Icon className={cn('h-16 w-16 text-muted opacity-30')} />
      <p className={cn('text-sm text-muted')}>{name} panel coming soon</p>
    </div>
  );
}
