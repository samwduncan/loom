/**
 * LiveSessionBanner -- shows "Watching live session" indicator with Detach button.
 *
 * Rendered in ChatView when the current session is live-attached (CLI running
 * externally). Uses green success tones via --live-banner-* tokens.
 * Self-manages visibility: returns null when session is not attached.
 *
 * Constitution: Named exports (2.2), selector-only store access (4.2), tokens only (3.1).
 */

import { Radio } from 'lucide-react';
import { wsClient } from '@/lib/websocket-client';
import { useStreamStore } from '@/stores/stream';
import { cn } from '@/utils/cn';

export interface LiveSessionBannerProps {
  sessionId: string;
}

export function LiveSessionBanner({ sessionId }: LiveSessionBannerProps) {
  const isAttached = useStreamStore((s) => s.liveAttachedSessions.has(sessionId));
  const detachLiveSession = useStreamStore((s) => s.detachLiveSession);

  if (!isAttached) return null;

  const handleDetach = () => {
    wsClient.send({ type: 'detach-session', sessionId });
    // Optimistic: also update store immediately (server confirmation will follow)
    detachLiveSession(sessionId);
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-4 py-2',
        'bg-[var(--live-banner-bg)] border-b border-[var(--live-banner-border)]',
        'text-[var(--live-banner-text)] text-sm',
      )}
      role="status"
      aria-live="polite"
    >
      <Radio size={14} className="text-[var(--status-success)] animate-pulse" />
      <span className="flex-1">Watching live session</span>
      <button
        onClick={handleDetach}
        className={cn(
          'px-2 py-0.5 rounded text-xs',
          'min-h-[44px] md:min-h-0 flex items-center',
          'bg-[var(--live-banner-btn-bg)] hover:bg-[var(--live-banner-btn-bg-hover)]',
          'text-[var(--live-banner-btn-text)] hover:text-[var(--live-banner-btn-text-hover)]',
          'transition-colors duration-[var(--duration-fast)]',
          'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
        )}
      >
        Detach
      </button>
    </div>
  );
}
