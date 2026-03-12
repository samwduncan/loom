/**
 * useNavigateAwayGuard -- Prevents accidental tab close during active streaming.
 *
 * Registers a beforeunload handler when isStreaming is true, triggering
 * the browser's native confirmation dialog. Automatically cleans up
 * when streaming stops or the component unmounts.
 *
 * Constitution: Named export only (2.2), selector-only store access (4.2).
 */

import { useEffect } from 'react';
import { useStreamStore } from '@/stores/stream';

export function useNavigateAwayGuard(): void {
  const isStreaming = useStreamStore((s) => s.isStreaming);

  useEffect(() => {
    if (!isStreaming) return;

    function handleBeforeUnload(event: BeforeUnloadEvent): string {
      const message =
        'You have an active streaming session. Are you sure you want to leave?';
      event.returnValue = message;
      return message;
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isStreaming]);
}
