/**
 * Push notification management hook.
 *
 * Manages: token registration, notification response handling, deep link
 * navigation, preference syncing to backend, and MMKV pending-approvals
 * queue drain on WS reconnect.
 *
 * Called once in root layout after auth is confirmed (inside AuthenticatedApp).
 *
 * [S-8] IMPORTANT: This hook runs AFTER AuthenticatedApp mounts, which means
 * auth is guaranteed ready. The module-level listener in notifications.ts only
 * STORES the cold-start response. This hook's useEffect 3 is the ONLY place
 * that acts on it (validates session, navigates). This separation ensures
 * apiClient calls have a valid JWT.
 */

import { useEffect, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { AppState, type AppStateStatus } from 'react-native';
import {
  registerForPushNotifications,
  registerNotificationCategories,
  getInitialNotificationResponse,
} from '../lib/notifications';
import {
  queueApproval,
  getPendingApprovals,
  clearPendingApprovals,
  getNotificationMode,
  setPushToken,
} from '../lib/push-preferences';
import { apiClient } from '../lib/api-client';
import { showToast } from '../lib/toast';
import { useConnectionStore } from '../stores/index';
import { getWsClient } from '../lib/websocket-init';

// ---------------------------------------------------------------------------
// Types for API responses
// ---------------------------------------------------------------------------

interface ProjectFromApi {
  name: string;
  sessions?: { id: string }[];
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useNotifications(): void {
  const hasHandledColdStartRef = useRef(false);
  const pushTokenRef = useRef<string | null>(null);
  const router = useRouter();
  const prevStatusRef = useRef<string | null>(null);

  // -------------------------------------------------------------------------
  // handleNotificationResponse (D-12 session validation, WARNING 5 fix)
  // -------------------------------------------------------------------------

  const handleNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as Record<
        string,
        unknown
      >;
      const actionId = response.actionIdentifier;

      // Permission action buttons (D-05, D-06)
      if (actionId === 'approve' || actionId === 'deny') {
        const requestId = data.requestId as string;
        if (requestId) {
          queueApproval(requestId, actionId as 'approve' | 'deny');
        }
        // Don't navigate for background actions
        return;
      }

      // Deep link navigation (D-09, D-10, D-11, D-12)
      const sessionId = data.sessionId as string;
      if (sessionId) {
        hasHandledColdStartRef.current = true;

        // [S-8] This function is ONLY called from useEffect 2 (warm) or useEffect 3 (cold).
        // Both run inside AuthenticatedApp, so apiClient has a valid JWT.
        // D-12: Validate session exists by fetching projects and searching for the sessionId.
        apiClient
          .apiFetch<ProjectFromApi[]>('/api/projects')
          .then((projects) => {
            // Search all projects' sessions for the target sessionId
            const sessionExists = projects.some((project) =>
              project.sessions?.some((s) => s.id === sessionId),
            );

            if (sessionExists) {
              router.push(`/(drawer)/(stack)/chat/${sessionId}`);
            } else {
              // Session not found in any project -- navigate to session list with toast
              router.replace('/(drawer)');
              showToast('Session no longer available', undefined, 3000);
            }
          })
          .catch(() => {
            // Server unreachable -- navigate optimistically, chat screen handles 404
            // Better to show stale data than block navigation entirely
            router.push(`/(drawer)/(stack)/chat/${sessionId}`);
          });
      }
    },
    [router],
  );

  // -------------------------------------------------------------------------
  // useEffect 1: Registration (runs once on mount)
  // -------------------------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function register() {
      // Per Pitfall 5: register categories before any push can arrive
      await registerNotificationCategories();

      const token = await registerForPushNotifications();
      if (cancelled || !token) return;

      pushTokenRef.current = token;

      // [S-5] Persist to MMKV so Plan 03's settings screen can read it
      setPushToken(token);

      // Register with backend
      try {
        await apiClient.apiFetch<void>('/api/push/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            notificationMode: getNotificationMode(),
          }),
        });
      } catch {
        // Registration failure is non-fatal -- will retry on next app launch
        console.warn('[Push] Backend registration failed');
      }
    }

    // Set up foreground notification handler (D-23)
    Notifications.setNotificationHandler({
      handleNotification: async () => {
        // Per D-01 + Pitfall 7: client-side gate as belt-and-suspenders
        // For now, always show (the server-side check is primary)
        return {
          shouldShowAlert: true,
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        };
      },
    });

    register();

    return () => {
      cancelled = true;
    };
  }, []);

  // -------------------------------------------------------------------------
  // useEffect 2: Notification response listener (warm launch)
  // -------------------------------------------------------------------------

  useEffect(() => {
    const subscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        handleNotificationResponse(response);
      });

    return () => {
      subscription.remove();
    };
  }, [handleNotificationResponse]);

  // -------------------------------------------------------------------------
  // useEffect 3: Cold-start deep link (runs once after mount)
  //
  // [S-8] This is the ONLY place that acts on the cold-start response.
  // By the time this useEffect runs, AuthenticatedApp has mounted, auth is
  // ready, apiClient has a valid JWT. The module-level listener only stored
  // the response -- this useEffect does the session validation and navigation.
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (hasHandledColdStartRef.current) return;

    async function handleColdStart() {
      const response = await getInitialNotificationResponse();
      if (response) {
        handleNotificationResponse(response);
      }
    }

    handleColdStart();
  }, [handleNotificationResponse]);

  // -------------------------------------------------------------------------
  // useEffect 4: AppState listener for badge clear
  // -------------------------------------------------------------------------

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (nextState === 'active') {
          // Clear badge on foreground
          Notifications.setBadgeCountAsync(0);
        }
      },
    );

    return () => {
      subscription.remove();
    };
  }, []);

  // -------------------------------------------------------------------------
  // useEffect 5: WS connection state -> queue drain (Pitfall 3)
  // -------------------------------------------------------------------------

  useEffect(() => {
    const unsubscribe = useConnectionStore.subscribe((state) => {
      const currentStatus = state.providers.claude.status;
      const prevStatus = prevStatusRef.current;
      prevStatusRef.current = currentStatus;

      // Only drain on transition TO 'connected' (not on initial state)
      if (currentStatus === 'connected' && prevStatus && prevStatus !== 'connected') {
        const pending = getPendingApprovals();
        if (pending.length === 0) return;

        const wsClient = getWsClient();
        if (!wsClient) return;

        for (const approval of pending) {
          try {
            wsClient.send({
              type: 'claude-permission-response',
              requestId: approval.requestId,
              allow: approval.action === 'approve',
            });
          } catch {
            // D-07: if response fails (backend returns "expired"), show toast
            showToast('Permission request expired', undefined, 3000);
          }
        }

        clearPendingApprovals();
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);
}
