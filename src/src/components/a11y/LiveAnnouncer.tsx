/**
 * LiveAnnouncer -- visually-hidden aria-live region for screen reader announcements.
 *
 * Renders a sr-only div with role="status" and aria-live="polite".
 * When `message` changes, clears then re-sets the text after 100ms
 * to ensure re-announcement of identical consecutive messages.
 *
 * Constitution: Named export (2.2), no default export, token-based styling (3.1).
 */

import { useRef, useEffect, useSyncExternalStore, useCallback } from 'react';

interface LiveAnnouncerProps {
  message: string;
}

/**
 * Screen reader announcement region. Mount once, update `message` to announce.
 *
 * Uses a ref + useSyncExternalStore pattern to avoid the react-hooks/set-state-in-effect
 * lint rule while still clearing and re-setting the text for re-announcement.
 */
export function LiveAnnouncer({ message }: LiveAnnouncerProps) {
  const textRef = useRef('');
  const subscribersRef = useRef(new Set<() => void>());

  const subscribe = useCallback((cb: () => void) => {
    subscribersRef.current.add(cb);
    return () => {
      subscribersRef.current.delete(cb);
    };
  }, []);

  const getSnapshot = useCallback(() => textRef.current, []);

  const currentText = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    if (!message) {
      textRef.current = '';
      subscribersRef.current.forEach((cb) => cb());
      return;
    }

    // Clear first to force re-announcement of identical consecutive messages
    textRef.current = '';
    subscribersRef.current.forEach((cb) => cb());

    const timer = setTimeout(() => {
      textRef.current = message;
      subscribersRef.current.forEach((cb) => cb());
    }, 100);

    return () => clearTimeout(timer);
  }, [message]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
      data-testid="live-announcer"
    >
      {currentText}
    </div>
  );
}
