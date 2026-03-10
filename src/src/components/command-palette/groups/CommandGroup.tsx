/**
 * CommandGroup -- Slash commands fetched from backend API.
 *
 * Fetches once on mount via POST /api/commands/list, caches in state.
 * Shows commands when search starts with '/' or when fuse matches.
 *
 * Constitution: Named export (2.2), typed API responses (5.4).
 */

import { Command } from 'cmdk';
import { Slash } from 'lucide-react';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Fuse from 'fuse.js';
import { toast } from 'sonner';
import { CommandPaletteItem } from '../CommandPaletteItem';
import { apiFetch } from '@/lib/api-client';

export interface SlashCommand {
  name: string;
  description: string;
  namespace: string;
}

interface CommandListResponse {
  builtIn: SlashCommand[];
  custom: SlashCommand[];
  count: number;
}

export interface CommandGroupProps {
  search: string;
  onClose: () => void;
}

export const CommandGroup = function CommandGroup({ search, onClose }: CommandGroupProps) {
  const [commands, setCommands] = useState<SlashCommand[]>([]);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    apiFetch<CommandListResponse>('/api/commands/list', { method: 'POST' })
      .then((data) => {
        setCommands([...data.builtIn, ...data.custom]);
      })
      .catch(() => {
        // Graceful degradation: slash commands stay empty on fetch failure
      });
  }, []);

  const fuse = useMemo(
    () => new Fuse(commands, { keys: ['name', 'description'], threshold: 0.4 }),
    [commands],
  );

  const handleSelect = useCallback((cmd: SlashCommand) => {
    toast.info(`Executed: ${cmd.name}`);
    onClose();
  }, [onClose]);

  // Show when search starts with '/' or when fuse matches
  const isSlashSearch = search.startsWith('/');
  const visibleCommands = isSlashSearch
    ? commands.filter((c) => c.name.toLowerCase().includes(search.slice(1).toLowerCase()))
    : search
      ? fuse.search(search, { limit: 10 }).map((r) => r.item)
      : [];

  if (visibleCommands.length === 0) return null;

  return (
    <Command.Group heading="Commands">
      {visibleCommands.map((cmd) => (
        <CommandPaletteItem
          key={cmd.namespace + '/' + cmd.name}
          icon={<Slash size={16} />}
          label={cmd.name}
          keywords={cmd.description}
          onSelect={() => handleSelect(cmd)}
        />
      ))}
    </Command.Group>
  );
};
