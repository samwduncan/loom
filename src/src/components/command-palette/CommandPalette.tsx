/**
 * CommandPalette -- Main cmdk Command.Dialog wrapper.
 *
 * Reads commandPaletteOpen from UIStore, renders a centered overlay dialog
 * with search input and empty state. Command groups will be added in Plan 02.
 *
 * Uses shouldFilter={false} because search orchestration is handled by
 * useCommandSearch (Plan 02 integration).
 *
 * Constitution: Named export (2.2), selector-only store access (4.2),
 * token-based styling via command-palette.css (3.1).
 */

import { Command } from 'cmdk';
import { useUIStore } from '@/stores/ui';
import { useCommandPaletteShortcut } from './hooks/useCommandPaletteShortcut';
import './command-palette.css';

export const CommandPalette = function CommandPalette() {
  const isOpen = useUIStore((state) => state.commandPaletteOpen);
  const toggleCommandPalette = useUIStore((state) => state.toggleCommandPalette);

  useCommandPaletteShortcut();

  return (
    <Command.Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) toggleCommandPalette();
      }}
      shouldFilter={false}
      label="Command Palette"
    >
      <Command.Input placeholder="Type a command or search..." />
      <Command.List>
        <Command.Empty>No results found</Command.Empty>
        {/* Command groups will be added in Plan 02 */}
      </Command.List>
    </Command.Dialog>
  );
};
