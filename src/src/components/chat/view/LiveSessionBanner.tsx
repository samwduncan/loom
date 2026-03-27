/**
 * LiveSessionBanner -- shows "Watching live session" indicator with Detach button.
 *
 * Rendered in ChatView when the current session is live-attached (CLI running
 * externally). Uses green success tones consistent with the sidebar live dot.
 * Self-manages visibility: returns null when session is not attached.
 *
 * Constitution: Named exports (2.2), selector-only store access (4.2).
 */

import { Radio } from 'lucide-react';
import { wsClient } from '@/lib/websocket-client';
import { useStreamStore } from '@/stores/stream';
import { cn } from '@/utils/cn';

interface LiveSessionBannerProps {
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
        'bg-[oklch(0.25_0.02_145)] border-b border-[oklch(0.35_0.05_145)]',
        'text-[oklch(0.85_0.12_145)] text-sm',
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
          'bg-[oklch(0.3_0.02_145)] hover:bg-[oklch(0.35_0.02_145)]',
          'text-[oklch(0.75_0.08_145)] hover:text-[oklch(0.85_0.08_145)]',
          'transition-colors duration-[var(--duration-fast)]',
        )}
      >
        Detach
      </button>
    </div>
  );
}
