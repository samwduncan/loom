/**
 * CommandPaletteItem -- Reusable item component for the command palette.
 *
 * Renders a cmdk Command.Item with flex layout: icon + label + spacer + optional Kbd shortcut.
 *
 * Constitution: Named export (2.2), cn() for classes (3.6), token-based styling (3.1).
 */

import { Command } from 'cmdk';
import { Kbd } from '@/components/ui/kbd';
import { cn } from '@/utils/cn';
import type { ReactNode } from 'react';

export interface CommandPaletteItemProps {
  icon?: ReactNode;
  label: string;
  shortcut?: string;
  onSelect: () => void;
  keywords?: string;
  className?: string;
}

export const CommandPaletteItem = function CommandPaletteItem({
  icon,
  label,
  shortcut,
  onSelect,
  keywords,
  className,
}: CommandPaletteItemProps) {
  return (
    <Command.Item
      onSelect={onSelect}
      keywords={keywords ? [keywords] : undefined}
      className={cn('flex items-center gap-2', className)}
    >
      {icon && <span className="flex shrink-0 items-center text-muted">{icon}</span>}
      <span className="flex-1 truncate text-primary">{label}</span>
      {shortcut && <Kbd className="ml-auto shrink-0">{shortcut}</Kbd>}
    </Command.Item>
  );
};
