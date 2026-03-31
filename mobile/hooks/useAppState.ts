/**
 * AppState listener hook for iOS background/foreground lifecycle.
 *
 * Accepts onForeground and onBackground callbacks. Does NOT fire on
 * 'inactive' state -- per D-30, Control Center/Notification Center
 * triggers inactive, NOT background. Reacting to inactive causes
 * spurious disconnect/reconnect cycles.
 *
 * Returns the current AppState status.
 */

import { useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

interface UseAppStateOptions {
  onForeground: () => void;
  onBackground: () => void;
}

export function useAppState({ onForeground, onBackground }: UseAppStateOptions): AppStateStatus {
  const [currentState, setCurrentState] = useState<AppStateStatus>(AppState.currentState);
  const prevStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Store latest callbacks in refs to avoid re-subscribing on every render
  const onForegroundRef = useRef(onForeground);
  const onBackgroundRef = useRef(onBackground);
  onForegroundRef.current = onForeground;
  onBackgroundRef.current = onBackground;

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      const prevState = prevStateRef.current;

      // Only act on 'active' and 'background' -- ignore 'inactive'
      if (nextState === 'active' && prevState !== 'active') {
        onForegroundRef.current();
      } else if (nextState === 'background') {
        onBackgroundRef.current();
      }

      prevStateRef.current = nextState;
      setCurrentState(nextState);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return currentState;
}
