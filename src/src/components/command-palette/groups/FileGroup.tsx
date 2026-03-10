/**
 * FileGroup -- Fuzzy-searched file list for the command palette.
 *
 * Renders files filtered by useCommandSearch. Selecting a file switches
 * to the Files tab. Full file opening deferred to Phase 23 (file store).
 *
 * Constitution: Named export (2.2), token-based colors (3.1).
 */

import { Command } from 'cmdk';
import { FileText } from 'lucide-react';
import { useCallback } from 'react';
import { CommandPaletteItem } from '../CommandPaletteItem';
import { useUIStore } from '@/stores/ui';
import type { FileEntry } from '../hooks/useCommandSearch';

export interface FileGroupProps {
  files: FileEntry[];
  onClose: () => void;
}

export const FileGroup = function FileGroup({ files, onClose }: FileGroupProps) {
  const setActiveTab = useUIStore((s) => s.setActiveTab);

  const handleSelect = useCallback((_file: FileEntry) => {
    setActiveTab('files');
    onClose();
  }, [setActiveTab, onClose]);

  if (files.length === 0) return null;

  return (
    <Command.Group heading="Files">
      {files.map((file) => (
        <CommandPaletteItem
          key={file.path}
          icon={<FileText size={16} />}
          label={file.name}
          keywords={file.path}
          onSelect={() => handleSelect(file)}
        />
      ))}
    </Command.Group>
  );
};
