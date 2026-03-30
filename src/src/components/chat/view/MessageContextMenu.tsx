/**
 * MessageContextMenu -- context menu for message bubbles.
 *
 * Desktop: Radix ContextMenu triggers on right-click (browser contextmenu event).
 * Mobile: passthrough — long-press conflicts with WKWebView text selection.
 * Message actions on mobile will use visible copy buttons (ChatGPT/Claude iOS pattern).
 *
 * Constitution: Named exports (2.2), token-based styling (3.1), cn() for classes (3.6).
 */

import { useCallback, type ReactNode } from 'react';
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
import { useMobile } from '@/hooks/useMobile';

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

  // Mobile: passthrough — long-press conflicts with WKWebView text selection.
  // Message actions will use visible copy buttons (ChatGPT/Claude iOS pattern).
  if (isMobile) {
    return <>{children}</>;
  }

  // Desktop: Radix ContextMenu (right-click)
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
