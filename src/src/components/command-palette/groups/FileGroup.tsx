/**
 * FileGroup -- Fuzzy-searched file list for the command palette.
 *
 * Renders files filtered by useCommandSearch. Selecting a file switches
 * to the Files tab and opens the file in the file store.
 *
 * Constitution: Named export (2.2), token-based colors (3.1), selector-only store (4.2).
 */

import { Command } from 'cmdk';
import { FileText } from 'lucide-react';
import { useCallback } from 'react';
import { CommandPaletteItem } from '../CommandPaletteItem';
import { useUIStore } from '@/stores/ui';
import { useFileStore } from '@/stores/file';
import type { FileEntry } from '@/types/file';

export interface FileGroupProps {
  files: FileEntry[];
  onClose: () => void;
}

export const FileGroup = function FileGroup({ files, onClose }: FileGroupProps) {
  const setActiveTab = useUIStore((s) => s.setActiveTab);
  const openFile = useFileStore((s) => s.openFile);

  const handleSelect = useCallback((file: FileEntry) => {
    setActiveTab('files');
    openFile(file.path);
    onClose();
  }, [setActiveTab, openFile, onClose]);

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
