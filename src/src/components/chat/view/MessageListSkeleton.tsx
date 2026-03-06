/**
 * MessageListSkeleton -- loading skeleton for message fetch.
 *
 * Renders shimmer rectangles inside actual MessageContainer components
 * to guarantee zero CLS (pixel-identical padding/margins to real messages).
 * Alternates user (shorter, right-aligned) and assistant (wider, left-aligned).
 *
 * Reuses shimmer keyframe from sidebar.css.
 *
 * Constitution: Named exports (2.2), design tokens only (3.1).
 */

import { MessageContainer } from '@/components/chat/view/MessageContainer';

export function MessageListSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto py-4" data-testid="message-skeleton">
      {/* Assistant-like wide row */}
      <MessageContainer role="assistant">
        <div className="skeleton-shimmer h-4 w-3/4" />
        <div className="skeleton-shimmer mt-2 h-4 w-1/2" />
      </MessageContainer>

      {/* User-like narrow row */}
      <MessageContainer role="user">
        <div className="skeleton-shimmer h-4 w-32" />
      </MessageContainer>

      {/* Assistant-like wide row */}
      <MessageContainer role="assistant">
        <div className="skeleton-shimmer h-4 w-2/3" />
        <div className="skeleton-shimmer mt-2 h-4 w-5/6" />
        <div className="skeleton-shimmer mt-2 h-4 w-1/3" />
      </MessageContainer>

      {/* User-like narrow row */}
      <MessageContainer role="user">
        <div className="skeleton-shimmer h-4 w-24" />
      </MessageContainer>
    </div>
  );
}
