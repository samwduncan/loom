/**
 * CommandPalette -- Main cmdk Command.Dialog wrapper with all command groups.
 *
 * Reads commandPaletteOpen from UIStore, renders a centered overlay dialog
 * with search input, groups in priority order, and empty state.
 *
 * Uses shouldFilter={false} because search orchestration is handled by
 * useCommandSearch with Fuse.js.
 *
 * Constitution: Named export (2.2), selector-only store access (4.2),
 * token-based styling via command-palette.css (3.1).
 */

import { Command } from 'cmdk';
import { useState, useCallback } from 'react';
import { useUIStore } from '@/stores/ui';
import { useCommandPaletteShortcut } from './hooks/useCommandPaletteShortcut';
import { useCommandSearch } from './hooks/useCommandSearch';
import { NavigationGroup } from './groups/NavigationGroup';
import { SessionGroup } from './groups/SessionGroup';
import { ActionGroup } from './groups/ActionGroup';
import { CommandGroup } from './groups/CommandGroup';
import { ProjectGroup } from './groups/ProjectGroup';
import './command-palette.css';

export const CommandPalette = function CommandPalette() {
  const isOpen = useUIStore((state) => state.commandPaletteOpen);
  const toggleCommandPalette = useUIStore((state) => state.toggleCommandPalette);

  const [search, setSearch] = useState('');
  const { sessionResults } = useCommandSearch(search, { enabled: isOpen });

  useCommandPaletteShortcut();

  const onClose = useCallback(() => {
    setSearch('');
    toggleCommandPalette();
  }, [toggleCommandPalette]);

  // cmdk fires onOpenChange(false) on Escape/backdrop click.
  // Delegate to onClose to avoid double-toggle when groups also call onClose.
  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      onClose();
    }
  }, [onClose]);

  return (
    <Command.Dialog
      open={isOpen}
      onOpenChange={handleOpenChange}
      shouldFilter={false}
      label="Command Palette"
    >
      <Command.Input
        placeholder="Type a command or search..."
        value={search}
        onValueChange={setSearch}
      />
      <Command.List>
        <NavigationGroup onClose={onClose} />
        {sessionResults.length > 0 && (
          <SessionGroup sessions={sessionResults} onClose={onClose} />
        )}
        <ActionGroup onClose={onClose} />
        <CommandGroup search={search} onClose={onClose} />
        <ProjectGroup onClose={onClose} />
        <Command.Empty>No results found</Command.Empty>
      </Command.List>
    </Command.Dialog>
  );
};
