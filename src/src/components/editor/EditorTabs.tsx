/**
 * EditorTabs -- horizontal tab bar for open editor files.
 *
 * Shows filename with full-path tooltip, dirty dot indicator, close button.
 * Closing a dirty tab triggers AlertDialog confirmation (Save/Discard/Cancel).
 *
 * Constitution: Named export (2.2), selector hooks (4.2/4.5),
 * design tokens only (3.1), cn() for classes (3.6).
 */

import { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useFileStore } from '@/stores/file';
import { evictFileCache } from '@/components/editor/content-cache';
import type { FileTab } from '@/types/file';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface EditorTabsProps {
  onSave: (filePath: string) => Promise<boolean>;
}

export function EditorTabs({ onSave }: EditorTabsProps) {
  const openTabs = useFileStore((s) => s.openTabs);
  const activeFilePath = useFileStore((s) => s.activeFilePath);
  const setActiveFile = useFileStore((s) => s.setActiveFile);
  const closeFile = useFileStore((s) => s.closeFile);

  const [dirtyCloseTarget, setDirtyCloseTarget] = useState<FileTab | null>(null);

  if (openTabs.length === 0) return null;

  function handleClose(e: React.SyntheticEvent, tab: FileTab) {
    e.stopPropagation();
    if (tab.isDirty) {
      setDirtyCloseTarget(tab);
    } else {
      evictFileCache(tab.filePath);
      closeFile(tab.filePath);
    }
  }

  async function handleSaveAndClose() {
    if (!dirtyCloseTarget) return;
    const success = await onSave(dirtyCloseTarget.filePath);
    if (success) {
      evictFileCache(dirtyCloseTarget.filePath);
      closeFile(dirtyCloseTarget.filePath);
    }
    setDirtyCloseTarget(null);
  }

  function handleDiscard() {
    if (!dirtyCloseTarget) return;
    evictFileCache(dirtyCloseTarget.filePath);
    closeFile(dirtyCloseTarget.filePath);
    setDirtyCloseTarget(null);
  }

  return (
    <>
      <div className="flex items-center gap-0 border-b border-border/8 bg-[var(--surface-base)] overflow-x-auto">
        {openTabs.map((tab) => {
          const filename = tab.filePath.slice(tab.filePath.lastIndexOf('/') + 1);
          const isActive = tab.filePath === activeFilePath;

          return (
            <button
              key={tab.filePath}
              type="button"
              className={cn(
                'px-3 py-1.5 text-xs font-[family-name:var(--font-mono)] flex items-center gap-1.5 cursor-pointer shrink-0 border-r border-border/8 transition-colors',
                isActive
                  ? 'bg-[var(--surface-raised)] text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              title={tab.filePath}
              onClick={() => setActiveFile(tab.filePath)}
            >
              {tab.isDirty && (
                <span
                  className="w-1 h-1 rounded-full bg-[var(--accent-primary)] shrink-0"
                  aria-label="Unsaved changes"
                />
              )}
              <span className="truncate max-w-[120px]">{filename}</span>
              <span
                role="button"
                tabIndex={0}
                className="ml-1 p-0.5 rounded-sm hover:bg-[var(--surface-overlay)] transition-colors"
                aria-label={`Close ${filename}`}
                onClick={(e) => handleClose(e, tab)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleClose(e, tab);
                  }
                }}
              >
                <X size={12} />
              </span>
            </button>
          );
        })}
      </div>

      {/* AlertDialog as sibling to avoid Radix focus trap conflicts */}
      <AlertDialog
        open={dirtyCloseTarget !== null}
        onOpenChange={(open) => !open && setDirtyCloseTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{dirtyCloseTarget?.filePath.slice(
                (dirtyCloseTarget?.filePath.lastIndexOf('/') ?? -1) + 1,
              )}&rdquo; has unsaved changes. What would you like to do?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDiscard}>
              Discard
            </AlertDialogAction>
            <AlertDialogAction onClick={handleSaveAndClose}>
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
