/**
 * useStreamBuffer — rAF + useRef token accumulation hook.
 *
 * Subscribes to wsClient.subscribeContent() for streaming tokens,
 * accumulates them in a useRef (zero React re-renders), and paints
 * to a DOM node's innerHTML via requestAnimationFrame using the
 * streaming markdown converter.
 *
 * When streaming completes (isStreaming transitions true -> false),
 * flushes accumulated text to the parent via onFlush callback.
 *
 * If the converter throws, streaming silently falls back to raw
 * textContent with no visible error (permanent for that session).
 *
 * Constitution: Named export only (2.2), selector-only store access (4.2).
 */

import { useEffect, useRef, useCallback } from 'react';
import { wsClient } from '@/lib/websocket-client';
import { useStreamStore } from '@/stores/stream';
import { convertStreamingMarkdown } from '@/lib/streaming-markdown';

export interface UseStreamBufferOptions {
  /** Ref to the DOM text node that receives token updates */
  textNodeRef: React.RefObject<HTMLElement | null>;
  /** Called when stream completes with accumulated text */
  onFlush: (text: string) => void;
  /** Called if connection drops mid-stream */
  onDisconnect?: () => void;
}

export interface UseStreamBufferReturn {
  /** Current accumulated text (read-only snapshot) */
  getText: () => string;
  /** Checkpoint the buffer offset — new text paints only characters after this point */
  checkpoint: () => void;
}

export function useStreamBuffer(options: UseStreamBufferOptions): UseStreamBufferReturn {
  const { textNodeRef, onFlush, onDisconnect } = options;

  const bufferRef = useRef('');
  const bufferOffsetRef = useRef(0);
  const isActiveRef = useRef(false);
  const rafIdRef = useRef<number>(0);
  const disconnectFiredRef = useRef(false);
  const converterFailedRef = useRef(false);

  // Stable callback refs — synced via effect to satisfy react-hooks/refs
  const onFlushRef = useRef(onFlush);
  const onDisconnectRef = useRef(onDisconnect);
  const textNodeRefRef = useRef(textNodeRef);

  useEffect(() => {
    onFlushRef.current = onFlush;
    onDisconnectRef.current = onDisconnect;
    textNodeRefRef.current = textNodeRef;
  });

  // Track isStreaming for flush detection (true -> false transition)
  const isStreaming = useStreamStore((state) => state.isStreaming);
  const prevIsStreamingRef = useRef(isStreaming);

  // Token listener: appends to ref, zero state updates
  const onToken = useCallback((token: string) => {
    bufferRef.current += token;
  }, []);

  // Subscribe to wsClient content stream and start rAF loop
  useEffect(() => {
    isActiveRef.current = true;
    disconnectFiredRef.current = false;
    converterFailedRef.current = false;

    const paint = (): void => {
      const node = textNodeRefRef.current.current;
      if (node && bufferRef.current.length > bufferOffsetRef.current) {
        const raw = bufferRef.current.slice(bufferOffsetRef.current);
        if (converterFailedRef.current) {
          node.textContent = raw;
        } else {
          try {
            node.innerHTML = convertStreamingMarkdown(raw);
          } catch {
            node.textContent = raw;
            converterFailedRef.current = true;
          }
        }
      }

      // Check for disconnect: wsClient no longer streaming and disconnected
      if (
        !wsClient.getIsStreamActive() &&
        wsClient.getState() === 'disconnected' &&
        bufferRef.current.length > 0
      ) {
        isActiveRef.current = false;
        if (!disconnectFiredRef.current) {
          disconnectFiredRef.current = true;
          onDisconnectRef.current?.();
        }
        return;
      }

      // Continue loop if active
      if (isActiveRef.current) {
        rafIdRef.current = requestAnimationFrame(paint);
      }
    };

    const unsub = wsClient.subscribeContent(onToken);
    rafIdRef.current = requestAnimationFrame(paint);

    return () => {
      isActiveRef.current = false;
      cancelAnimationFrame(rafIdRef.current);
      unsub();
    };
  }, [onToken]);

  // Detect isStreaming true -> false transition for flush
  useEffect(() => {
    const prev = prevIsStreamingRef.current;
    prevIsStreamingRef.current = isStreaming;

    if (prev && !isStreaming && bufferRef.current.length > 0) {
      onFlushRef.current(bufferRef.current);
    }
  }, [isStreaming]);

  const getText = useCallback(() => bufferRef.current, []);

  const checkpoint = useCallback(() => {
    bufferOffsetRef.current = bufferRef.current.length;
  }, []);

  return { getText, checkpoint };
}
