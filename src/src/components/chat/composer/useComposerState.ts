/**
 * useComposerState -- 5-state FSM for composer send/stop lifecycle.
 *
 * States: idle -> sending -> active -> aborting -> idle
 * Prevents double-send and double-stop via strict state transitions.
 * Wires to stream store's isStreaming for automatic state progression.
 *
 * Constitution: Named exports only (2.2), selector-only store access (4.2).
 */

import { useReducer, useEffect, useRef, useCallback, useMemo } from 'react';
import { useStreamStore } from '@/stores/stream';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ComposerState = 'idle' | 'sending' | 'active' | 'aborting';

export type ComposerAction =
  | { type: 'SEND' }
  | { type: 'STREAM_STARTED' }
  | { type: 'STOP' }
  | { type: 'STREAM_ENDED' }
  | { type: 'ABORT_TIMEOUT' };

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function composerReducer(state: ComposerState, action: ComposerAction): ComposerState {
  switch (action.type) {
    case 'SEND':
      return state === 'idle' ? 'sending' : state;
    case 'STREAM_STARTED':
      // Allow idle -> active for cases where component mounts mid-stream
      return state === 'sending' || state === 'idle' ? 'active' : state;
    case 'STOP':
      return state === 'active' ? 'aborting' : state;
    case 'STREAM_ENDED':
      return state === 'active' || state === 'aborting' ? 'idle' : state;
    case 'ABORT_TIMEOUT':
      return state === 'aborting' ? 'idle' : state;
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useComposerState() {
  const [state, dispatch] = useReducer(composerReducer, 'idle');
  const isStreaming = useStreamStore((s) => s.isStreaming);
  const abortTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Wrap dispatch to also manage abort timeout
  const wrappedDispatch = useCallback((action: ComposerAction) => {
    dispatch(action);
  }, []);

  // Wire isStreaming to FSM transitions
  const prevStreamingRef = useRef(isStreaming);
  useEffect(() => {
    const wasStreaming = prevStreamingRef.current;
    prevStreamingRef.current = isStreaming;

    if (isStreaming && !wasStreaming) {
      // Stream started
      dispatch({ type: 'STREAM_STARTED' });
    } else if (!isStreaming && wasStreaming) {
      // Stream ended -- clear abort timeout if active
      if (abortTimerRef.current) {
        clearTimeout(abortTimerRef.current);
        abortTimerRef.current = null;
      }
      dispatch({ type: 'STREAM_ENDED' });
    }
  }, [isStreaming]);

  // 5-second abort timeout: when entering 'aborting', start timer
  useEffect(() => {
    if (state === 'aborting') {
      abortTimerRef.current = setTimeout(() => {
        dispatch({ type: 'ABORT_TIMEOUT' });
        abortTimerRef.current = null;
      }, 5000);
    }

    return () => {
      if (state === 'aborting' && abortTimerRef.current) {
        clearTimeout(abortTimerRef.current);
        abortTimerRef.current = null;
      }
    };
  }, [state]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortTimerRef.current) {
        clearTimeout(abortTimerRef.current);
      }
    };
  }, []);

  const canSend = state === 'idle';
  const canStop = state === 'active';

  return useMemo(
    () => ({ state, dispatch: wrappedDispatch, canSend, canStop }),
    [state, wrappedDispatch, canSend, canStop],
  );
}
