/**
 * FileGroup -- Fuzzy-searched file list for the command palette.
 *
 * Renders files filtered by useCommandSearch. Selecting a file switches
 * to the Files tab. Full file opening deferred to Phase 23 (file store stubs).
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
  addRecent: (entry: { id: string; label: string; group: string }) => void;
}

export const FileGroup = function FileGroup({ files, onClose, addRecent }: FileGroupProps) {
  const setActiveTab = useUIStore((s) => s.setActiveTab);

  const handleSelect = useCallback((file: FileEntry) => {
    setActiveTab('files');
    // File store openFile is a Phase 23 stub -- log for now, switch to Files tab only
    console.warn('TODO: openFile not implemented', file.path);
    addRecent({ id: 'file-' + file.path, label: file.name, group: 'Files' });
    onClose();
  }, [setActiveTab, onClose, addRecent]);

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
