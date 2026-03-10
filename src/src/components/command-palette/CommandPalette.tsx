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
import { useRecentCommands } from './hooks/useRecentCommands';
import { RecentGroup } from './groups/RecentGroup';
import { NavigationGroup } from './groups/NavigationGroup';
import { SessionGroup } from './groups/SessionGroup';
import { FileGroup } from './groups/FileGroup';
import { ActionGroup } from './groups/ActionGroup';
import { CommandGroup } from './groups/CommandGroup';
import { ProjectGroup } from './groups/ProjectGroup';
import './command-palette.css';

export const CommandPalette = function CommandPalette() {
  const isOpen = useUIStore((state) => state.commandPaletteOpen);
  const toggleCommandPalette = useUIStore((state) => state.toggleCommandPalette);

  const [search, setSearch] = useState('');
  const { sessionResults, fileResults } = useCommandSearch(search, { enabled: isOpen });
  const { recents, addRecent } = useRecentCommands();

  useCommandPaletteShortcut();

  const onClose = useCallback(() => {
    toggleCommandPalette();
  }, [toggleCommandPalette]);

  // Reset search when dialog closes via onOpenChange callback
  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setSearch('');
      toggleCommandPalette();
    }
  }, [toggleCommandPalette]);

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
        {!search && <RecentGroup recents={recents} onClose={onClose} />}
        <NavigationGroup onClose={onClose} addRecent={addRecent} />
        {sessionResults.length > 0 && (
          <SessionGroup sessions={sessionResults} onClose={onClose} addRecent={addRecent} />
        )}
        {fileResults.length > 0 && (
          <FileGroup files={fileResults} onClose={onClose} addRecent={addRecent} />
        )}
        <ActionGroup onClose={onClose} addRecent={addRecent} />
        <CommandGroup search={search} onClose={onClose} addRecent={addRecent} />
        <ProjectGroup onClose={onClose} addRecent={addRecent} />
        <Command.Empty>No results found</Command.Empty>
      </Command.List>
    </Command.Dialog>
  );
};
