/**
 * SessionItem -- individual session row with 2-line layout and inline rename.
 *
 * Line 1: title (truncated via text-overflow: ellipsis), or inline input when editing
 * Line 2: relative timestamp + ProviderLogo
 * Active state: 3px left border in --accent-primary (no background tint)
 * Hover state: subtle background via sidebar.css class
 *
 * Inline rename: double-click title (or isEditing prop) enters edit mode.
 * Enter confirms, Escape cancels, blur confirms. Empty/unchanged values are ignored.
 *
 * Receives data as props (NOT subscribing to store per-item).
 *
 * Constitution: Named export (2.2), token-based styling (3.1), cn() for classes (3.6).
 */

import { useState, useCallback, type MouseEvent, type KeyboardEvent } from 'react';
import { cn } from '@/utils/cn';
import { formatRelativeTime } from '@/lib/formatTime';
import { ProviderLogo } from './ProviderLogo';
import type { ProviderId } from '@/types/provider';
import './sidebar.css';

export interface SessionItemProps {
  id: string;
  title: string;
  updatedAt: string;
  providerId: ProviderId;
  isActive: boolean;
  hasDraft?: boolean;
  isEditing?: boolean;
  onClick: () => void;
  onContextMenu: (e: MouseEvent<HTMLDivElement>) => void;
  onRename: (id: string, newTitle: string) => void;
}

export function SessionItem({
  id,
  title,
  updatedAt,
  providerId,
  isActive,
  hasDraft,
  isEditing: isEditingProp,
  onClick,
  onContextMenu,
  onRename,
}: SessionItemProps) {
  const [isEditingLocal, setIsEditingLocal] = useState(false);
  const [editValue, setEditValue] = useState(title);

  const isEditing = isEditingProp || isEditingLocal;

  const startEditing = useCallback(() => {
    setEditValue(title);
    setIsEditingLocal(true);
  }, [title]);

  const confirmEdit = useCallback(() => {
    setIsEditingLocal(false);
    const trimmed = editValue.trim();
    if (trimmed !== '' && trimmed !== title) {
      onRename(id, trimmed);
    }
  }, [editValue, title, id, onRename]);

  const cancelEdit = useCallback(() => {
    setIsEditingLocal(false);
    setEditValue(title);
  }, [title]);

  const handleDoubleClick = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      startEditing();
    },
    [startEditing],
  );

  const handleInputKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        confirmEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEdit();
      }
    },
    [confirmEdit, cancelEdit],
  );

  // When isEditing prop changes to true externally, sync local state
  if (isEditingProp && !isEditingLocal) {
    setEditValue(title);
    setIsEditingLocal(true);
  }

  return (
    <div
      role="option"
      aria-selected={isActive}
      tabIndex={0}
      onClick={isEditing ? undefined : onClick}
      onContextMenu={onContextMenu}
      onKeyDown={(e) => {
        if (!isEditing && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        'px-3 py-2 cursor-pointer',
        'transition-[background-color] duration-[var(--duration-fast)]',
        'session-item-hover',
        isActive && 'session-item-active',
      )}
    >
      {/* Line 1: title + draft dot */}
      <div className="flex items-center gap-1.5">
        {isEditing ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleInputKeyDown}
            onBlur={confirmEdit}
            autoFocus
            className="session-rename-input"
          />
        ) : (
          <div
            className={cn(
              'text-[length:var(--text-body)] text-foreground',
              'truncate min-w-0 flex-1',
            )}
            onDoubleClick={handleDoubleClick}
          >
            {title}
          </div>
        )}
        {hasDraft && !isEditing && (
          <span
            className="w-1.5 h-1.5 rounded-full bg-primary opacity-60 shrink-0"
            aria-label="Has unsent draft"
          />
        )}
      </div>
      {/* Line 2: timestamp + provider logo */}
      <div className="flex items-center gap-1.5 mt-0.5">
        <span className="text-[length:0.75rem] text-muted">
          {formatRelativeTime(updatedAt)}
        </span>
        <span className="text-muted">
          <ProviderLogo providerId={providerId} size={12} />
        </span>
      </div>
    </div>
  );
}
