/**
 * useStreamAnnouncements -- derives screen reader announcement text from stream state.
 *
 * Subscribes to useStreamStore selectors for isStreaming and activeToolCalls.
 * Returns a message string that updates on:
 * 1. Streaming starts -> "Assistant is responding"
 * 2. Streaming ends -> "Response complete"
 * 3. Tool call completes -> "Tool {name} completed"
 *
 * Does NOT announce streaming text chunks (would flood screen reader).
 *
 * Uses useSyncExternalStore + useEffect to satisfy both:
 * - react-hooks/set-state-in-effect (no setState in effects)
 * - react-hooks/refs (no ref access during render)
 *
 * Constitution: Named export (2.2), selector-only store access (4.2).
 */

import { useEffect, useRef, useCallback, useSyncExternalStore } from 'react';
import { useStreamStore } from '@/stores/stream';
import type { ToolCallState } from '@/types/stream';

export function useStreamAnnouncements(): string {
  const isStreaming = useStreamStore((s) => s.isStreaming);
  const activeToolCalls = useStreamStore((s) => s.activeToolCalls);

  // External mutable state managed via useSyncExternalStore
  const messageRef = useRef('');
  const wasStreamingRef = useRef(false);
  const completedToolIdsRef = useRef<Set<string>>(new Set());
  const subscribersRef = useRef(new Set<() => void>());

  const subscribe = useCallback((cb: () => void) => {
    subscribersRef.current.add(cb);
    return () => {
      subscribersRef.current.delete(cb);
    };
  }, []);

  const getSnapshot = useCallback(() => messageRef.current, []);

  const message = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // Streaming start/stop announcements
  useEffect(() => {
    if (isStreaming && !wasStreamingRef.current) {
      wasStreamingRef.current = true;
      messageRef.current = 'Assistant is responding';
      subscribersRef.current.forEach((cb) => cb());
    } else if (!isStreaming && wasStreamingRef.current) {
      wasStreamingRef.current = false;
      messageRef.current = 'Response complete';
      completedToolIdsRef.current.clear();
      subscribersRef.current.forEach((cb) => cb());
    }
  }, [isStreaming]);

  // Tool completion announcements
  useEffect(() => {
    const newlyCompleted = activeToolCalls.filter(
      (tc: ToolCallState) =>
        (tc.status === 'resolved' || tc.status === 'rejected') &&
        !completedToolIdsRef.current.has(tc.id),
    );

    if (newlyCompleted.length > 0) {
      const latest = newlyCompleted[newlyCompleted.length - 1]; // ASSERT: array has at least one element from length check
      const name = latest!.toolName; // ASSERT: latest exists because newlyCompleted.length > 0
      const status = latest!.status === 'rejected' ? 'failed' : 'completed'; // ASSERT: latest exists from length guard above
      messageRef.current = `Tool ${name} ${status}`;

      for (const tc of newlyCompleted) {
        completedToolIdsRef.current.add(tc.id);
      }
      subscribersRef.current.forEach((cb) => cb());
    }
  }, [activeToolCalls]);

  return message;
}
