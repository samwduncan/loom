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
 * Supports: search highlight, pin indicator, selection mode with checkbox.
 *
 * Receives data as props (NOT subscribing to store per-item).
 *
 * Constitution: Named export (2.2), token-based styling (3.1), cn() for classes (3.6).
 */

import { useState, useCallback, type KeyboardEvent, type ReactNode } from 'react';
import { Pin, Trash2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatRelativeTime } from '@/lib/formatTime';
import { Checkbox } from '@/components/ui/checkbox';
import { hapticEvent } from '@/lib/haptics';
import { useMobile } from '@/hooks/useMobile';
import { useSwipeToDelete } from '@/hooks/useSwipeToDelete';
import { ProviderLogo } from './ProviderLogo';
import type { ProviderId } from '@/types/provider';
import './sidebar.css';

export interface SessionItemProps {
  id: string;
  title: string;
  updatedAt: string;
  providerId: ProviderId;
  isActive: boolean;
  isStreaming?: boolean;
  isLiveAttached?: boolean;
  hasNewActivity?: boolean;
  hasDraft?: boolean;
  isEditing?: boolean;
  searchQuery?: string;
  isPinned?: boolean;
  isSelecting?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onClick: () => void;
  onDeleteRequest?: () => void;
  onRename: (id: string, newTitle: string) => void;
}

/** Highlight matching substring with <mark> tag. */
function highlightMatch(text: string, query: string): ReactNode {
  if (!query) return text;
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-primary/20 text-foreground rounded-sm px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export function SessionItem({
  id,
  title,
  updatedAt,
  providerId,
  isActive,
  isStreaming,
  isLiveAttached,
  hasNewActivity,
  hasDraft,
  isEditing: isEditingProp,
  searchQuery,
  isPinned,
  isSelecting,
  isSelected,
  onToggleSelect,
  onClick,
  onDeleteRequest,
  onRename,
}: SessionItemProps) {
  const [isEditingLocal, setIsEditingLocal] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const isMobile = useMobile();
  const { bind, offset, revealed, active, reset } = useSwipeToDelete();

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

  const handleClick = useCallback(() => {
    if (isEditing) return;
    if (isSelecting && onToggleSelect) {
      onToggleSelect();
    } else {
      hapticEvent('sessionSelect');
      onClick();
    }
  }, [isEditing, isSelecting, onToggleSelect, onClick]);

  const handleSwipeDelete = useCallback(() => {
    reset();
    onDeleteRequest?.();
  }, [reset, onDeleteRequest]);

  return (
    <div className="relative overflow-hidden">
      {/* Delete button behind (positioned absolute right) -- mobile only */}
      {isMobile && (offset < 0 || revealed) && (
        <div
          className="absolute right-0 top-0 bottom-0 w-[80px] flex items-center justify-center"
          style={{ background: 'var(--status-error)' }}
        >
          <button
            onClick={handleSwipeDelete}
            className="swipe-delete-btn"
            aria-label="Delete session"
            type="button"
          >
            <Trash2 size={18} />
            <span className="text-sm font-medium">Delete</span>
          </button>
        </div>
      )}
      {/* Session item content (translates via offset on mobile swipe) */}
      <div
        {...(isMobile ? bind() : {})}
        style={{
          transform: isMobile && offset !== 0 ? `translateX(${offset}px)` : undefined,
          transition: active ? 'none' : 'transform var(--duration-normal) var(--ease-out)',
          touchAction: isMobile ? 'pan-y' : 'auto',
        }}
      >
        <div
          role="option"
          aria-selected={isActive}
          aria-label={title}
          tabIndex={0}
          onClick={handleClick}
          onKeyDown={(e) => {
            if (!isEditing && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              handleClick();
            }
            if (!isEditing && (e.key === 'Delete' || e.key === 'Backspace')) {
              e.preventDefault();
              onDeleteRequest?.();
            }
          }}
          className={cn(
            'px-3 py-2 cursor-pointer',
            'min-h-[44px] md:min-h-0',
            'transition-[background-color] duration-[var(--duration-fast)]',
            'session-item-hover',
            isActive && !isSelecting && 'session-item-active',
            isSelected && 'bg-primary/10',
          )}
        >
          {/* Line 1: checkbox (selection mode) + title + pin/draft/streaming dots */}
          <div className="flex items-center gap-1.5">
            {isSelecting && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggleSelect?.()}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Select ${title}`}
                className="shrink-0"
              />
            )}
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
                {searchQuery ? highlightMatch(title, searchQuery) : title}
              </div>
            )}
            {isPinned && !isEditing && (
              <Pin size={12} className="text-muted shrink-0" aria-label="Pinned" />
            )}
            {hasNewActivity && !isStreaming && !isLiveAttached && !isEditing && (
              <span className="session-notified-dot" aria-label="New activity" />
            )}
            {isLiveAttached && !isEditing && (
              <span className="session-live-dot" aria-label="Live session attached" />
            )}
            {isStreaming && !isEditing && (
              <span className="session-streaming-dot" aria-label="Streaming" />
            )}
            {hasDraft && !isStreaming && !isEditing && (
              <span
                className="w-1.5 h-1.5 rounded-full bg-primary opacity-60 shrink-0"
                aria-label="Has unsent draft"
              />
            )}
          </div>
          {/* Line 2: timestamp + provider logo */}
          <div className={cn('flex items-center gap-1.5 mt-0.5', isSelecting && 'ml-[22px]')}>
            <span className="text-[length:0.75rem] text-muted">
              {formatRelativeTime(updatedAt)}
            </span>
            <span className="text-muted">
              <ProviderLogo providerId={providerId} size={12} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
