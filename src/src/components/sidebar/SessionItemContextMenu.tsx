/**
 * SessionItemContextMenu -- Radix context menu for session items.
 *
 * Wraps children in a Radix ContextMenu trigger. On mobile, long-press
 * opens the menu. On desktop, right-click opens the menu.
 *
 * Menu items: Copy ID, Rename, Select, Pin/Unpin, Export, Delete (destructive).
 * Fires hapticEvent('contextMenuOpen') when menu opens.
 *
 * Replaces the legacy SessionContextMenu.tsx custom portal pattern
 * with the Radix ContextMenu pattern used by FileTreeContextMenu.tsx.
 *
 * Constitution: Named export (2.2), design tokens (3.1), cn() for classes (3.6).
 */

import type { ReactNode } from 'react';
import { Copy, Pencil, Pin, PinOff, Download, CheckSquare, Trash2 } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { hapticEvent } from '@/lib/haptics';
import { nativeClipboardWrite } from '@/lib/native-clipboard';

export interface SessionItemContextMenuProps {
  children: ReactNode;
  sessionId: string;
  isPinned: boolean;
  onRename: () => void;
  onDelete: () => void;
  onPin: () => void;
  onExport?: () => void;
  onSelect?: () => void;
}

export function SessionItemContextMenu({
  children,
  sessionId,
  isPinned,
  onRename,
  onDelete,
  onPin,
  onExport,
  onSelect,
}: SessionItemContextMenuProps) {
  const handleOpenChange = (open: boolean) => {
    if (open) hapticEvent('contextMenuOpen');
  };

  return (
    <ContextMenu onOpenChange={handleOpenChange}>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={() => { void nativeClipboardWrite(sessionId); }}>
          <Copy size={14} />
          Copy ID
        </ContextMenuItem>
        <ContextMenuItem onSelect={onRename}>
          <Pencil size={14} />
          Rename
        </ContextMenuItem>
        {onSelect && (
          <ContextMenuItem onSelect={onSelect}>
            <CheckSquare size={14} />
            Select
          </ContextMenuItem>
        )}
        <ContextMenuItem onSelect={() => { onPin(); hapticEvent('sidebarToggle'); }}>
          {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
          {isPinned ? 'Unpin' : 'Pin to Top'}
        </ContextMenuItem>
        {onExport && (
          <ContextMenuItem onSelect={onExport}>
            <Download size={14} />
            Export
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive" onSelect={onDelete}>
          <Trash2 size={14} />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
