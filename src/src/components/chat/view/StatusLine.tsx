/**
 * StatusLine -- Activity status line showing current agent action.
 *
 * Positioned between the message list and permission banner in the ChatView
 * grid. Shows what the agent is currently doing (e.g., "Reading file.ts").
 * Fades in/out via opacity transition using design tokens.
 *
 * Outside the scroll container so it never causes scroll height changes.
 *
 * Constitution: Named export (2.2), selector-only store access (4.2), React.memo (perf).
 */

import { memo } from 'react';
import { useStreamStore } from '@/stores/stream';
import { cn } from '@/utils/cn';
import { ShinyText } from '@/components/effects/ShinyText';
import '../styles/status-line.css';

export const StatusLine = memo(function StatusLine() {
  const activityText = useStreamStore((s) => s.activityText);
  const isStreaming = useStreamStore((s) => s.isStreaming);

  const visible = isStreaming && Boolean(activityText);

  return (
    <div
      className={cn(
        'status-line px-4 py-1 text-xs text-muted truncate',
        visible ? 'opacity-100' : 'opacity-0',
      )}
      data-testid="status-line"
    >
      <ShinyText>{activityText}</ShinyText>
    </div>
  );
});
