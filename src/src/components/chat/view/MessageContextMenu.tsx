/**
 * MessageContextMenu -- dual-path context menu for message bubbles.
 *
 * Mobile: useLongPress detects 500ms hold, opens Radix Popover with menu items.
 * Desktop: Radix ContextMenu triggers on right-click (browser contextmenu event).
 *
 * iOS WKWebView does NOT fire contextmenu on long-press, so Radix ContextMenu
 * is broken on mobile. The dual-path approach handles both platforms.
 *
 * CRITICAL: Does NOT add data-long-press-target to the wrapper div.
 * That attribute applies -webkit-user-select:none via CSS, which would prevent
 * text selection on messages. Text selection MUST be preserved on message content.
 *
 * Copy uses native clipboard on iOS, navigator.clipboard on web.
 * Share opens native share sheet on iOS, Web Share API on web, clipboard fallback.
 *
 * Constitution: Named exports (2.2), token-based styling (3.1), cn() for classes (3.6).
 */

import { useState, useCallback, type ReactNode } from 'react';
import { Copy, RotateCcw, Share } from 'lucide-react';
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
import { nativeShare } from '@/lib/native-share';
import { useLongPress } from '@/hooks/useLongPress';
import { useMobile } from '@/hooks/useMobile';
import { cn } from '@/utils/cn';

export interface MessageContextMenuProps {
  children: ReactNode;
  /** Plain text content of the message for copy/share */
  messageText: string;
  /** Whether to show the Retry action (assistant messages only) */
  showRetry?: boolean;
  /** Callback when user selects Retry */
  onRetry?: () => void;
}

export function MessageContextMenu({
  children,
  messageText,
  showRetry = false,
  onRetry,
}: MessageContextMenuProps) {
  const isMobile = useMobile();
  const [popoverOpen, setPopoverOpen] = useState(false);

  const handleOpen = useCallback(() => {
    hapticEvent('contextMenuOpen');
    setPopoverOpen(true);
  }, []);

  const longPressHandlers = useLongPress({
    onLongPress: handleOpen,
  });

  const closeAndRun = useCallback((fn: () => void) => {
    setPopoverOpen(false);
    fn();
  }, []);

  const handleCopy = useCallback(() => {
    void nativeClipboardWrite(messageText);
  }, [messageText]);

  const handleShare = useCallback(() => {
    hapticEvent('shareTriggered');
    void nativeShare({
      text: messageText,
      title: 'Message from Loom',
      dialogTitle: 'Share Message',
    });
  }, [messageText]);

  // Arrow key handler for keyboard navigation within popover menu items.
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

  // Mobile popover menu items (uses .popover-menu-item, NOT .context-menu-item)
  const menuItems = (
    <>
      <div
        role="menuitem"
        tabIndex={0}
        className={cn('popover-menu-item')}
        onClick={() => closeAndRun(handleCopy)}
        onKeyDown={(e) => {
          handleMenuKeyDown(e);
          if (e.key === 'Enter') closeAndRun(handleCopy);
        }}
      >
        <Copy size={14} /> Copy Text
      </div>
      {showRetry && onRetry && (
        <div
          role="menuitem"
          tabIndex={0}
          className={cn('popover-menu-item')}
          onClick={() => closeAndRun(onRetry)}
          onKeyDown={(e) => {
            handleMenuKeyDown(e);
            if (e.key === 'Enter') closeAndRun(onRetry);
          }}
        >
          <RotateCcw size={14} /> Retry
        </div>
      )}
      <div className="h-px bg-border my-1" role="separator" />
      <div
        role="menuitem"
        tabIndex={0}
        className={cn('popover-menu-item')}
        onClick={() => closeAndRun(handleShare)}
        onKeyDown={(e) => {
          handleMenuKeyDown(e);
          if (e.key === 'Enter') closeAndRun(handleShare);
        }}
      >
        <Share size={14} /> Share
      </div>
    </>
  );

  // --- Mobile: useLongPress + Popover ---
  // NOTE: No data-long-press-target attribute here. That would apply
  // -webkit-user-select:none via CSS, breaking text selection on messages.
  if (isMobile) {
    return (
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <div {...longPressHandlers}>
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
        <ContextMenuItem onSelect={handleCopy}>
          <Copy size={14} /> Copy Text
        </ContextMenuItem>
        {showRetry && onRetry && (
          <ContextMenuItem onSelect={onRetry}>
            <RotateCcw size={14} /> Retry
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={handleShare}>
          <Share size={14} /> Share
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
