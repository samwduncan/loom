/**
 * MessageContextMenu -- Radix ContextMenu wrapper for message bubbles.
 *
 * Provides Copy Text, Retry (optional, assistant messages only), and Share
 * actions via long-press on mobile or right-click on desktop.
 *
 * Copy uses native clipboard on iOS, navigator.clipboard on web.
 * Share opens native share sheet on iOS, Web Share API on web, clipboard fallback.
 * Retry re-sends the last user message via the existing WebSocket send mechanism.
 *
 * CRITICAL: Does NOT apply user-select:none. Text selection must work on messages.
 * Radix ContextMenu handles long-press detection via native contextmenu event.
 *
 * Constitution: Named exports (2.2), token-based styling (3.1).
 */

import type { ReactNode } from 'react';
import { Copy, RotateCcw, Share } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { hapticEvent } from '@/lib/haptics';
import { nativeClipboardWrite } from '@/lib/native-clipboard';
import { nativeShare } from '@/lib/native-share';

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
  const handleOpenChange = (open: boolean) => {
    if (open) hapticEvent('contextMenuOpen');
  };

  const handleCopy = () => {
    void nativeClipboardWrite(messageText);
  };

  const handleShare = () => {
    hapticEvent('shareTriggered');
    void nativeShare({
      text: messageText,
      title: 'Message from Loom',
      dialogTitle: 'Share Message',
    });
  };

  return (
    <ContextMenu onOpenChange={handleOpenChange}>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={handleCopy}>
          <Copy size={14} />
          Copy Text
        </ContextMenuItem>
        {showRetry && onRetry && (
          <ContextMenuItem onSelect={onRetry}>
            <RotateCcw size={14} />
            Retry
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={handleShare}>
          <Share size={14} />
          Share
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
