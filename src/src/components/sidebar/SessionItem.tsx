/**
 * SessionItem -- individual session row with 2-line layout.
 *
 * Line 1: title (truncated via text-overflow: ellipsis)
 * Line 2: relative timestamp + ProviderLogo
 * Active state: 3px left border in --accent-primary (no background tint)
 * Hover state: subtle background via sidebar.css class
 *
 * Receives data as props (NOT subscribing to store per-item).
 *
 * Constitution: Named export (2.2), token-based styling (3.1), cn() for classes (3.6).
 */

import type { MouseEvent } from 'react';
import { cn } from '@/utils/cn';
import { formatRelativeTime } from '@/lib/formatTime';
import { ProviderLogo } from './ProviderLogo';
import type { ProviderId } from '@/types/provider';
import './sidebar.css';

interface SessionItemProps {
  id: string;
  title: string;
  updatedAt: string;
  providerId: ProviderId;
  isActive: boolean;
  onClick: () => void;
  onContextMenu: (e: MouseEvent<HTMLDivElement>) => void;
}

export function SessionItem({
  title,
  updatedAt,
  providerId,
  isActive,
  onClick,
  onContextMenu,
}: SessionItemProps) {
  return (
    <div
      role="option"
      aria-selected={isActive}
      tabIndex={0}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
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
      {/* Line 1: title */}
      <div
        className={cn(
          'text-[length:var(--text-body)] text-foreground',
          'truncate',
        )}
      >
        {title}
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
