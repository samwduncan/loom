/**
 * Module-level notification registration -- cold-start safe.
 *
 * MUST be imported at the top of _layout.tsx BEFORE any React code.
 * On iOS cold start, the notification response event fires at native module
 * init time, before React components mount. This catches it.
 *
 * CRITICAL [S-8]: The module-level listener ONLY STORES the response.
 * It MUST NOT call apiClient, navigate, or do anything that requires
 * auth or React context. All "acting" on the response happens inside
 * useEffect 3 in useNotifications (after AuthenticatedApp renders).
 */
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// ---------------------------------------------------------------------------
// Module-scoped cold-start state
// ---------------------------------------------------------------------------

let coldStartResponse: Notifications.NotificationResponse | null = null;
let hasBeenConsumed = false;

// ---------------------------------------------------------------------------
// Module-level listener (executes on import)
// ---------------------------------------------------------------------------

// Register IMMEDIATELY at module load -- before any React renders.
// [S-8] This listener ONLY STORES the response. It does NOT call API,
// navigate, or access auth. Those actions happen in useNotifications useEffect 3
// which runs after AuthenticatedApp mounts (auth is guaranteed ready).
Notifications.addNotificationResponseReceivedListener((response) => {
  if (!hasBeenConsumed) {
    coldStartResponse = response;
  }
});

// ---------------------------------------------------------------------------
// Exported functions
// ---------------------------------------------------------------------------

/**
 * Consume the cold-start notification response (one-shot).
 * Returns null if already consumed. Prevents double navigation (D-13).
 */
export function consumeColdStartResponse(): Notifications.NotificationResponse | null {
  if (hasBeenConsumed) return null;
  hasBeenConsumed = true;
  return coldStartResponse;
}

/**
 * Get the initial notification response that launched the app.
 * Tries module-level cache first (Pitfall 1), then falls back to
 * Expo's getLastNotificationResponseAsync (Pitfall 2).
 */
export async function getInitialNotificationResponse(): Promise<Notifications.NotificationResponse | null> {
  const cached = consumeColdStartResponse();
  if (cached) return cached;
  return await Notifications.getLastNotificationResponseAsync();
}

/**
 * Register notification categories with action buttons (D-05).
 * Must be called before any push can arrive (Pitfall 5).
 */
export async function registerNotificationCategories(): Promise<void> {
  await Notifications.setNotificationCategoryAsync('session_complete', [
    {
      identifier: 'open_session',
      buttonTitle: 'Open Session',
      options: {
        opensAppToForeground: true,
      },
    },
  ]);

  await Notifications.setNotificationCategoryAsync('permission_request', [
    {
      identifier: 'approve',
      buttonTitle: 'Approve',
      options: {
        opensAppToForeground: false,
        isDestructive: false,
      },
    },
    {
      identifier: 'deny',
      buttonTitle: 'Deny',
      options: {
        opensAppToForeground: false,
        isDestructive: true,
      },
    },
  ]);
}

/**
 * Request push notification permissions and get Expo push token.
 * Returns the token string or null if unavailable/denied.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('[Push] Not a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    console.error('[Push] No EAS projectId');
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
  return tokenData.data;
}
