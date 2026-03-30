/**
 * SessionItemContextMenu -- dual-path context menu for session items.
 *
 * Mobile: useLongPress detects 500ms hold, opens Radix Popover with menu items.
 * Desktop: Radix ContextMenu triggers on right-click (browser contextmenu event).
 *
 * iOS WKWebView does NOT fire contextmenu on long-press, so Radix ContextMenu
 * is broken on mobile. The dual-path approach handles both platforms.
 *
 * Constitution: Named export (2.2), design tokens (3.1), cn() for classes (3.6).
 */

import { useState, useCallback, useRef, type ReactNode } from 'react';
import { Copy, Pencil, Pin, PinOff, Download, CheckSquare, Trash2 } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { hapticEvent } from '@/lib/haptics';
import { nativeClipboardWrite } from '@/lib/native-clipboard';
import { useLongPress } from '@/hooks/useLongPress';
import { useMobile } from '@/hooks/useMobile';
import { cn } from '@/utils/cn';

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
  const isMobile = useMobile();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleOpen = useCallback(() => {
    hapticEvent('contextMenuOpen');
    setPopoverOpen(true);
  }, []);

  const longPressHandlers = useLongPress({
    onLongPress: handleOpen,
  });

  // Close popover then run action
  const closeAndRun = useCallback((fn: () => void) => {
    setPopoverOpen(false);
    fn();
  }, []);

  // Arrow key handler for keyboard navigation within popover menu items.
  // Required because manual div[role="menuitem"] elements don't get native
  // arrow-key focus management like Radix ContextMenuItem does.
  const handleMenuKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const items = (e.currentTarget as HTMLElement)
        .closest('[role="menu"]')
        ?.querySelectorAll('[role="menuitem"]:not([disabled])');
      if (!items?.length) return;
      const current = document.activeElement;
      const idx = Array.from(items).indexOf(current as Element);
      const next = e.key === 'ArrowDown'
        ? items[(idx + 1) % items.length]
        : items[(idx - 1 + items.length) % items.length];
      (next as HTMLElement).focus();
    }
  }, []);

  // NOTE: Mobile menu items use .popover-menu-item class (NOT .context-menu-item).
  // sidebar.css already defines .context-menu-item with different properties.
  // Using .popover-menu-item in base.css avoids cascade conflicts.
  const menuItems = (
    <>
      <div
        role="menuitem"
        tabIndex={0}
        className={cn('popover-menu-item')}
        onClick={() => closeAndRun(() => { void nativeClipboardWrite(sessionId); })}
        onKeyDown={(e) => {
          handleMenuKeyDown(e);
          if (e.key === 'Enter') closeAndRun(() => { void nativeClipboardWrite(sessionId); });
        }}
      >
        <Copy size={14} /> Copy ID
      </div>
      <div
        role="menuitem"
        tabIndex={0}
        className={cn('popover-menu-item')}
        onClick={() => closeAndRun(onRename)}
        onKeyDown={(e) => {
          handleMenuKeyDown(e);
          if (e.key === 'Enter') closeAndRun(onRename);
        }}
      >
        <Pencil size={14} /> Rename
      </div>
      {onSelect && (
        <div
          role="menuitem"
          tabIndex={0}
          className={cn('popover-menu-item')}
          onClick={() => closeAndRun(onSelect)}
          onKeyDown={(e) => {
            handleMenuKeyDown(e);
            if (e.key === 'Enter') closeAndRun(onSelect);
          }}
        >
          <CheckSquare size={14} /> Select
        </div>
      )}
      <div
        role="menuitem"
        tabIndex={0}
        className={cn('popover-menu-item')}
        onClick={() => closeAndRun(() => { onPin(); hapticEvent('sidebarToggle'); })}
        onKeyDown={(e) => {
          handleMenuKeyDown(e);
          if (e.key === 'Enter') closeAndRun(() => { onPin(); hapticEvent('sidebarToggle'); });
        }}
      >
        {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
        {isPinned ? 'Unpin' : 'Pin to Top'}
      </div>
      {onExport && (
        <div
          role="menuitem"
          tabIndex={0}
          className={cn('popover-menu-item')}
          onClick={() => closeAndRun(onExport)}
          onKeyDown={(e) => {
            handleMenuKeyDown(e);
            if (e.key === 'Enter') closeAndRun(onExport);
          }}
        >
          <Download size={14} /> Export
        </div>
      )}
      <div className="h-px bg-border my-1" role="separator" />
      <div
        role="menuitem"
        tabIndex={0}
        className={cn('popover-menu-item', 'text-destructive')}
        onClick={() => closeAndRun(onDelete)}
        onKeyDown={(e) => {
          handleMenuKeyDown(e);
          if (e.key === 'Enter') closeAndRun(onDelete);
        }}
      >
        <Trash2 size={14} /> Delete
      </div>
    </>
  );

  // --- Mobile: useLongPress + Popover ---
  if (isMobile) {
    return (
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <div ref={triggerRef} {...longPressHandlers} data-long-press-target>
            {children}
          </div>
        </PopoverTrigger>
        <PopoverContent
          side="bottom"
          align="start"
          className={cn(
            'w-48 p-1 flex flex-col gap-0.5',
            'bg-surface-overlay border border-border rounded-lg shadow-lg',
          )}
          role="menu"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {menuItems}
        </PopoverContent>
      </Popover>
    );
  }

  // --- Desktop: Radix ContextMenu (right-click) ---
  return (
    <ContextMenu onOpenChange={(open) => { if (open) hapticEvent('contextMenuOpen'); }}>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={() => { void nativeClipboardWrite(sessionId); }}>
          <Copy size={14} /> Copy ID
        </ContextMenuItem>
        <ContextMenuItem onSelect={onRename}>
          <Pencil size={14} /> Rename
        </ContextMenuItem>
        {onSelect && (
          <ContextMenuItem onSelect={onSelect}>
            <CheckSquare size={14} /> Select
          </ContextMenuItem>
        )}
        <ContextMenuItem onSelect={() => { onPin(); hapticEvent('sidebarToggle'); }}>
          {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
          {isPinned ? 'Unpin' : 'Pin to Top'}
        </ContextMenuItem>
        {onExport && (
          <ContextMenuItem onSelect={onExport}>
            <Download size={14} /> Export
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive" onSelect={onDelete}>
          <Trash2 size={14} /> Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
