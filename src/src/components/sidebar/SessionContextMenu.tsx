/**
 * SessionContextMenu -- custom context menu portaled to document.body.
 *
 * Positioned at right-click coordinates. Fixed overlay at z-dropdown.
 * Menu items: Pin/Unpin, Rename, Select, Delete (delete in status-error color).
 * Click outside or Escape closes.
 *
 * ARCHITECT MANDATE: MUST portal to document.body to avoid overflow:auto
 * clipping from the SessionList scroll container.
 *
 * Constitution: Named export (2.2), token-based styling (3.1), cn() for classes (3.6).
 */

import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Pin, PinOff } from 'lucide-react';
import { cn } from '@/utils/cn';
import './sidebar.css';

interface SessionContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onRename: () => void;
  onDelete: () => void;
  onClose: () => void;
  onPin?: () => void;
  isPinned?: boolean;
  onSelect?: () => void;
}

export function SessionContextMenu({
  isOpen,
  position,
  onRename,
  onDelete,
  onClose,
  onPin,
  isPinned,
  onSelect,
}: SessionContextMenuProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  const handleClickOutside = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    // Delay the click listener to prevent the right-click from immediately closing
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClickOutside);
      clearTimeout(timer);
    };
  }, [isOpen, handleKeyDown, handleClickOutside]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className={cn(
        'fixed bg-surface-overlay',
        'border border-border rounded-md py-1',
        'z-[var(--z-dropdown)] min-w-[140px]',
        'shadow-lg',
      )}
      style={{ top: position.y, left: position.x }}
      role="menu"
    >
      {onPin && (
        <button
          className="context-menu-item"
          onClick={(e) => {
            e.stopPropagation();
            onPin();
            onClose();
          }}
          role="menuitem"
          type="button"
        >
          <span className="flex items-center gap-2">
            {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
            {isPinned ? 'Unpin' : 'Pin to top'}
          </span>
        </button>
      )}
      <button
        className="context-menu-item"
        onClick={(e) => {
          e.stopPropagation();
          onRename();
        }}
        role="menuitem"
        type="button"
      >
        Rename
      </button>
      {onSelect && (
        <button
          className="context-menu-item"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
            onClose();
          }}
          role="menuitem"
          type="button"
        >
          Select
        </button>
      )}
      <button
        className="context-menu-item context-menu-item-danger"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        role="menuitem"
        type="button"
      >
        Delete
      </button>
    </div>,
    document.body,
  );
}
