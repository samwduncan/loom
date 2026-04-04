# Phase 76: Push Notifications - Research

**Researched:** 2026-04-04
**Domain:** Expo Push Notifications (iOS), APNs integration, server-side push service, deep linking, notification categories
**Confidence:** HIGH

## Summary

Push notifications for Loom require three coordinated systems: (1) the mobile app registering for push tokens and handling incoming notifications with deep links and action buttons, (2) the Express backend storing push tokens and sending notifications via Expo Push Service when sessions complete or request permissions, and (3) a foreground/background intelligence layer that avoids duplicate notifications when the user is actively viewing the relevant session.

The Expo ecosystem provides a well-integrated path. `expo-notifications@~0.32.16` (SDK 54 compatible) handles client-side registration, permission prompting, notification categories with action buttons, and cold-start deep link handling. `expo-server-sdk@6.1.0` handles server-side push delivery with batching, chunking, and delivery receipt checking. The `loom://` deep link scheme is already configured in `app.json`. The existing WebSocket infrastructure tracks connected clients via `connectedClients` Set, and `claude-complete`/`claude-error` events already flow through the WS pipeline -- the push trigger hooks into these existing code paths.

The highest-risk area is cold-start notification handling (app killed, user taps notification, app boots, auths, connects WS, then navigates). The Expo docs explicitly recommend registering `NotificationResponseReceivedListener` at module top-level (not inside a React component) and checking `getLastNotificationResponseAsync()` as a fallback. The MMKV pending-approvals queue for permission responses that arrive while WS is disconnected is architecturally sound but needs careful sequencing: auth must complete before WS connects, WS must connect before queue drains, and the drain must happen within the agent's 120-second timeout.

**Primary recommendation:** Use `expo-notifications` + `expo-server-sdk` via Expo Push Service. Notification categories (`session_complete`, `permission_request`) with iOS action buttons. Server-side `PushService` module triggered by existing `claude-complete`/`claude-error` WS events and `claude-permission-request`. Backend tracks client foreground state via new WS message type.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Push notifications gated on connection state. Only send when WS disconnected OR app backgrounded >30s. Never send if user is actively viewing session in foreground.
- **D-02:** Trigger events: session completion (success or error) and permission.request. NO push for progress milestones, partial completions, or streaming updates.
- **D-03:** Backend tracks per-client WS connection state and app foreground/background via AppState messages. Check before sending push.
- **D-04:** Notification batching: multiple session completions within 5-second window batch into single grouped notification. Use APNs thread-id for grouping.
- **D-05:** Expo notification categories with `UNNotificationAction` buttons: "Approve" and "Deny" for permission requests. Category ID: `permission_request`.
- **D-06:** Store permission response in MMKV immediately when user taps action button. Drain pending-approvals queue on app foreground or WS reconnect.
- **D-07:** Cold-start race condition mitigation: agent timeout default 120s. If approval arrives after timeout, backend returns "expired" status, app shows toast.
- **D-08:** Security: permission response includes original requestId (UUID). Backend validates requestId exists and is pending.
- **D-09:** Deep link scheme: `loom://chat/{sessionId}`. Handled via `(drawer)/(stack)/chat/[id].tsx`.
- **D-10:** Warm launch: Expo Router handles deep link automatically via notification `data.url`.
- **D-11:** Cold launch: Use `Notifications.getLastNotificationResponseAsync()` in root layout after auth completes. Manual `router.push()`.
- **D-12:** Deep link validation: verify session exists before navigating. Fallback to session list + toast if not found.
- **D-13:** Anti-double-navigation: `hasHandledColdStartNotification` ref in root layout.
- **D-14:** Notification preferences in MMKV: `push_pref_mode` with values `all`, `failures_and_permissions`, `permissions_only`, `none`.
- **D-15:** Settings UI: new "Notifications" section in app settings screen.
- **D-16:** Backend stores notification preference per push token in `push_tokens` table. Mobile syncs on change and on registration.
- **D-17:** New `push_tokens` SQLite table: `id`, `token`, `platform`, `user_id`, `notification_mode`, `created_at`, `updated_at`. Unique on `token`.
- **D-18:** REST endpoints: `POST /api/push/register`, `DELETE /api/push/register`, `PATCH /api/push/preferences`.
- **D-19:** `expo-server-sdk` on server. New `PushService` module for token validation, notification formatting, batch sending, receipt checking.
- **D-20:** Integration: SessionWatcher emits `session:complete` -> PushService checks connection state -> sends if criteria met. Same for `permission:request`.
- **D-21:** Payload structure: `{ title, body, data: { type, sessionId, requestId?, url }, categoryId, sound, badge }`.
- **D-22:** `expo-notifications` dependency. Register on app launch after auth. Store ExpoPushToken. Send to backend.
- **D-23:** Notification handler in root layout: `setNotificationHandler()` for foreground, `addNotificationResponseReceivedListener()` for taps.
- **D-24:** AppState foreground listener: drain MMKV pending-approvals queue on `active`.
- **D-25:** New `useNotifications` hook: manages token registration, permission request, notification listeners, deep link handling, preference syncing.

### Claude's Discretion
- Notification sound selection (default vs custom)
- Badge count management strategy (clear on app open vs per-session)
- Exact notification body text formatting (summary length, emoji usage)
- Retry logic for failed push delivery (expo-server-sdk handles this, but retry count/backoff configurable)
- Whether to show an in-app notification banner when app is foregrounded but user is in a different session

### Deferred Ideas (OUT OF SCOPE)
- Dynamic Island integration (Phase 82)
- Critical alerts for permission requests (requires special Apple entitlement)
- Multi-device notification sync (architecture supports it but testing deferred)
- Notification analytics (delivery rate, action tap rate, deep-link success rate)
- Session-type filtering ("notify me only about code review sessions")
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PUSH-01 | User receives push notification when a session completes | `expo-notifications@~0.32.16` client-side + `expo-server-sdk@6.1.0` server-side. Backend hooks into existing `claude-complete`/`claude-error` WS events. PushService checks connection/foreground state before sending. |
| PUSH-02 | User can tap notification to deep-link into the specific session | `loom://` scheme already in app.json. `data.url` field in notification payload. Warm launch via Expo Router automatic handling. Cold launch via `getLastNotificationResponseAsync()` + manual `router.push()`. |
| PUSH-03 | User receives push notification when an agent needs permission | Backend hooks into existing `claude-permission-request` WS event flow. Notification uses `permission_request` category with "Approve"/"Deny" action buttons. |
| PUSH-04 | User can approve/deny permission directly from notification action buttons | `setNotificationCategoryAsync()` with `opensAppToForeground: false` for background actions. MMKV pending-approvals queue + drain on WS reconnect. Backend `resolveToolApproval()` already exists for processing responses. |
| PUSH-05 | User can configure notification granularity (all / failures only / permissions only) | New settings screen at `(drawer)/(stack)/settings/notifications.tsx`. MMKV storage for preferences. Backend `push_tokens.notification_mode` column for server-side filtering. |
| PUSH-06 | Server sends push via Expo Push Service on session events | New `PushService` module using `expo-server-sdk`. New `push_tokens` SQLite table. REST endpoints for token registration. Batching via 5-second window + `expo.chunkPushNotifications()`. Delivery receipt checking. |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo-notifications | ~0.32.16 | Client-side push notification registration, handling, categories, deep links | Expo's official notification library for SDK 54. Handles APNs token registration, notification categories with action buttons, foreground/background handling, cold-start response. Bundled native module version for SDK 54. |
| expo-server-sdk | 6.1.0 | Server-side push notification sending via Expo Push Service | Official Node.js SDK for Expo Push Service. Handles chunking, batch sending, delivery receipt checking. Published 2026-03-10. |
| expo-device | ~8.0.10 | Physical device detection (push requires real device) | Expo's device info library. `Device.isDevice` check before requesting push token. SDK 54 compatible version. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-native-mmkv | ^3.2.0 | MMKV storage for push preferences and pending-approvals queue | Already installed. Used for `push_pref_mode` storage and offline permission response queue. |
| expo-constants | ~18.0.13 | Access EAS projectId for push token registration | Already installed. `Constants.expoConfig.extra.eas.projectId` needed by `getExpoPushTokenAsync()`. |
| expo-linking | ~8.0.11 | Open iOS Settings when notification permission denied | Already installed. `Linking.openSettings()` for the "Notifications are disabled" fallback. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Expo Push Service | Direct APNs (HTTP/2) | Full control over APNs payloads including all fields, but requires managing APNs JWT signing, connection pooling, and error handling. Expo Push Service handles all of this. No benefit for our use case. |
| expo-server-sdk | node-apn / @parse/node-apn | Direct APNs access, but Expo tokens are Expo-specific format. Would require obtaining native device tokens instead of Expo push tokens, adding complexity. |
| MMKV for preferences | AsyncStorage | MMKV is synchronous and already installed. AsyncStorage would add async complexity for simple key-value reads in the notification handler. |

**Installation (mobile):**
```bash
cd mobile && npx expo install expo-notifications expo-device
```

**Installation (server):**
```bash
npm install expo-server-sdk@6.1.0
```

**Version verification:** All versions verified against npm registry on 2026-04-04.
- `expo-notifications@~0.32.16` — bundledNativeModules.json for expo@54.0.33
- `expo-server-sdk@6.1.0` — published 2026-03-10
- `expo-device@~8.0.10` — bundledNativeModules.json for expo@54.0.33

## Architecture Patterns

### Recommended Project Structure

```
mobile/
  hooks/
    useNotifications.ts          # NEW: token registration, listeners, deep links, preference sync
  lib/
    notifications.ts             # NEW: module-level listener registration (cold-start safe)
    push-preferences.ts          # NEW: MMKV read/write for notification mode + pending approvals
  components/
    notifications/
      NotificationBanner.tsx     # NEW: in-app floating banner (glass surface)
    settings/
      SettingsRow.tsx             # NEW: reusable settings list item
      SettingsToggleRow.tsx       # NEW: settings row with toggle
      SettingsSectionHeader.tsx   # NEW: section divider
  app/
    (drawer)/
      (stack)/
        settings/
          notifications.tsx      # NEW: notification preferences screen
    _layout.tsx                  # MODIFIED: add notification setup after auth

server/
  services/
    push-service.js              # NEW: PushService class (singleton)
  routes/
    push.js                      # NEW: push token registration endpoints
  database/
    db.js                        # MODIFIED: add push_tokens table migration
```

### Pattern 1: Module-Level Notification Listener (Cold-Start Safe)

**What:** Register `NotificationResponseReceivedListener` at module import time, not inside a React component. Store response in a module-scoped variable that the root layout checks after auth completes.

**When to use:** Always -- this is the official recommendation from Expo docs for reliable cold-start notification handling on iOS.

**Why:** On iOS, when the app is killed and launched by tapping a notification, the listener fires before React components mount. If you only register inside `useEffect`, you miss the event.

**Example:**
```typescript
// mobile/lib/notifications.ts -- imported at top of _layout.tsx
import * as Notifications from 'expo-notifications';

let coldStartResponse: Notifications.NotificationResponse | null = null;
let hasBeenConsumed = false;

// Register IMMEDIATELY at module load time -- before any React renders
const subscription = Notifications.addNotificationResponseReceivedListener(
  (response) => {
    coldStartResponse = response;
  }
);

export function consumeColdStartResponse(): Notifications.NotificationResponse | null {
  if (hasBeenConsumed) return null;
  hasBeenConsumed = true;
  return coldStartResponse;
}

// Also check getLastNotificationResponseAsync as a fallback
export async function getInitialNotificationResponse(): Promise<Notifications.NotificationResponse | null> {
  const consumed = consumeColdStartResponse();
  if (consumed) return consumed;
  return await Notifications.getLastNotificationResponseAsync();
}
```

### Pattern 2: PushService Singleton with Connection-Aware Gating

**What:** Server-side singleton that checks if any WS client is connected AND foregrounded for the target session before sending push. Uses a Map of client state (userId -> { ws, foreground, lastActiveSession }).

**When to use:** Every push trigger event (session complete, permission request).

**Example:**
```javascript
// server/services/push-service.js
import { Expo } from 'expo-server-sdk';
import { db } from '../database/db.js';

class PushService {
  constructor() {
    this.expo = new Expo();
    this.clientStates = new Map(); // userId -> [{ ws, foreground, viewingSessionId }]
  }

  updateClientState(userId, ws, foreground, viewingSessionId) {
    // Track which clients are connected and what they're viewing
  }

  isUserViewingSession(userId, sessionId) {
    const states = this.clientStates.get(userId);
    if (!states) return false;
    return states.some(s => s.foreground && s.viewingSessionId === sessionId);
  }

  async notifySessionComplete(userId, sessionId, sessionName, success, error) {
    if (this.isUserViewingSession(userId, sessionId)) return; // D-01: skip if viewing

    const tokens = this.getTokensForUser(userId);
    const preference = tokens[0]?.notification_mode || 'all';
    if (preference === 'none') return;
    if (preference === 'permissions_only') return;
    if (preference === 'failures_and_permissions' && success) return;

    // Send via Expo Push Service
  }
}
```

### Pattern 3: MMKV Pending-Approvals Queue

**What:** When user taps "Approve" or "Deny" on a notification action button (app may be killed), store the response immediately in MMKV. On app foreground + WS connect, drain the queue and send responses to backend.

**When to use:** For permission request approval/denial from notification action buttons.

**Example:**
```typescript
// mobile/lib/push-preferences.ts
import { MMKV } from 'react-native-mmkv';

const mmkv = new MMKV();
const PENDING_APPROVALS_KEY = 'pending_approvals';

interface PendingApproval {
  requestId: string;
  action: 'approve' | 'deny';
  timestamp: number;
}

export function queueApproval(requestId: string, action: 'approve' | 'deny') {
  const existing = getPendingApprovals();
  existing.push({ requestId, action, timestamp: Date.now() });
  mmkv.set(PENDING_APPROVALS_KEY, JSON.stringify(existing));
}

export function getPendingApprovals(): PendingApproval[] {
  const raw = mmkv.getString(PENDING_APPROVALS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function clearPendingApprovals() {
  mmkv.delete(PENDING_APPROVALS_KEY);
}
```

### Pattern 4: Notification Batching with Timer Window

**What:** Server-side batching of session completion notifications. When a completion fires, start a 5-second timer. If more completions arrive within the window, batch them into a single notification.

**When to use:** For session completion events only (not permission requests -- those are time-sensitive).

**Example:**
```javascript
// In PushService
class PushService {
  constructor() {
    this.batchTimers = new Map(); // userId -> { timer, sessions: [] }
  }

  queueSessionComplete(userId, sessionInfo) {
    let batch = this.batchTimers.get(userId);
    if (!batch) {
      batch = { timer: null, sessions: [] };
      this.batchTimers.set(userId, batch);
    }
    batch.sessions.push(sessionInfo);

    if (batch.timer) clearTimeout(batch.timer);
    batch.timer = setTimeout(() => {
      this.flushBatch(userId);
    }, 5000);
  }

  flushBatch(userId) {
    const batch = this.batchTimers.get(userId);
    if (!batch || batch.sessions.length === 0) return;

    if (batch.sessions.length === 1) {
      this.sendSingleCompletion(userId, batch.sessions[0]);
    } else {
      this.sendBatchedCompletion(userId, batch.sessions);
    }
    this.batchTimers.delete(userId);
  }
}
```

### Anti-Patterns to Avoid

- **Registering notification listeners inside useEffect:** On iOS cold start, the listener fires before React mounts. Register at module level.
- **Using `tryReconnect()` after background:** Already documented in websocket-init.ts -- `disconnect()` nulls the internal token, so `tryReconnect()` silently no-ops. Must use `connect(token)`.
- **Sending push while user is viewing the session:** D-01 explicitly forbids this. Always check connection state + foreground + viewing session.
- **Using `SecureStore.setItem('')` to clear token:** Empty string is truthy. Use `deleteItemAsync()` (already established in auth-provider.ts).
- **Navigating to deep link without validation:** D-12 requires checking session exists first. Never silently navigate to nothing.
- **Blocking on getLastNotificationResponseAsync:** This can return null if called too early. Use dual approach: module-level listener + async fallback.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Push notification delivery | HTTP/2 APNs client with JWT signing | `expo-server-sdk` | Handles chunking (max 100 per batch), retry logic, receipt polling, token validation. Edge cases: device token changes, APNs error codes, rate limiting. |
| Notification categories | Native module bridge for UNNotificationCategory | `Notifications.setNotificationCategoryAsync()` | expo-notifications wraps iOS UNUserNotificationCenter completely. Action buttons, destructive styling, authentication required -- all via JS API. |
| Push token management | Manual APNs device token + sandbox/production switching | `Notifications.getExpoPushTokenAsync()` | Expo Push Tokens abstract away the APNs sandbox/production distinction. Works with EAS builds automatically. |
| Notification grouping | Custom APNs thread-id management | Expo Push Service `_contentAvailable` + client-side category | Expo passes through iOS notification grouping. Use the payload's data to identify grouped notifications. |
| Badge count tracking | Server-side badge counter per device | `Notifications.setBadgeCountAsync(0)` on foreground | iOS handles badge increments from push payload `badge` field. Clear on app open is the standard pattern. |

**Key insight:** The Expo Push Service + expo-notifications combination handles 90% of the complexity (APNs connection, token types, sandbox vs production, delivery receipts). The remaining 10% is the business logic: when to send, what to send, and how to handle responses.

## Common Pitfalls

### Pitfall 1: Cold-Start Notification Response Lost
**What goes wrong:** User taps notification while app is killed. App launches but never navigates to the session because `addNotificationResponseReceivedListener` was registered too late (inside a React useEffect).
**Why it happens:** On iOS, the notification response event fires at native module init time, before React components mount. If you only register listeners in useEffect, you miss it entirely.
**How to avoid:** Register the listener at module import time in a separate file (`lib/notifications.ts`). Import this file at the top of `_layout.tsx`. Also check `getLastNotificationResponseAsync()` as a belt-and-suspenders fallback after auth completes.
**Warning signs:** Deep links work on warm launch (backgrounded) but fail on cold launch (killed).

### Pitfall 2: Double Navigation on Cold Start
**What goes wrong:** User taps notification, app cold-starts, and navigates to the session twice -- once from the module-level listener and once from `getLastNotificationResponseAsync()`.
**Why it happens:** Both mechanisms fire for the same notification tap. Without a guard, both trigger navigation.
**How to avoid:** D-13 specifies a `hasHandledColdStartNotification` ref. The `consumeColdStartResponse()` function sets a consumed flag. Only one code path should trigger navigation.
**Warning signs:** Screen flicker or double push animation when opening from notification.

### Pitfall 3: Permission Response Lost After Cold Start
**What goes wrong:** User taps "Approve" on a notification action button. App was killed. The MMKV queue stores the response, but the app boots, connects WS, and navigates without draining the queue. Or the queue drains before WS is connected, and the response is lost.
**Why it happens:** Race condition between WS connection establishment and queue drain. Also: if the drain fires before auth completes, the WS connection doesn't exist yet.
**How to avoid:** Sequence carefully: (1) boot, (2) auth check, (3) WS connect, (4) wait for `connected` state, (5) drain MMKV queue. Use the `useConnectionStore` state to gate the drain. Never drain until WS is `connected`.
**Warning signs:** Permission approvals from killed-app state silently fail. Agent times out despite user approving.

### Pitfall 4: Push Token Not Refreshing
**What goes wrong:** Push notifications stop working after a while. The Expo push token stored on the server becomes stale.
**Why it happens:** Expo push tokens can change (reinstall, token rotation). If the app only registers the token once and never re-registers, the server holds a stale token.
**How to avoid:** Re-register the push token on every app launch (after auth). The server endpoint should upsert (unique constraint on token column). This is idempotent and ensures freshness.
**Warning signs:** Push notifications work initially but stop after a few days or after app reinstall.

### Pitfall 5: Notification Categories Not Registered Before First Push
**What goes wrong:** User receives a permission request push notification but no "Approve"/"Deny" action buttons appear.
**Why it happens:** `setNotificationCategoryAsync()` was not called before the notification arrived. iOS needs the category registered on the device before it can render action buttons.
**How to avoid:** Register categories during app initialization (in `lib/notifications.ts` or early in `useNotifications` hook), before any push can arrive. Categories persist across app restarts once registered, but re-registering is idempotent and safe.
**Warning signs:** First push after install has no action buttons. Subsequent pushes work (because category was registered during that session).

### Pitfall 6: EAS Build Required -- Simulator Won't Work
**What goes wrong:** Push notifications seem to register but never arrive during development.
**Why it happens:** As of SDK 54, push notifications do NOT work in Expo Go or iOS Simulator. They require a development build (`eas build --profile development`).
**How to avoid:** Always test push on a real device with a development build. The `expo-device` `Device.isDevice` check should gate push registration.
**Warning signs:** Token registration succeeds but `getExpoPushTokenAsync` returns a token that the Expo Push Service rejects.

### Pitfall 7: Server-Side Foreground Check Race Condition
**What goes wrong:** User opens session, server thinks they're still backgrounded, sends push notification that appears as an in-app banner AND a system notification.
**Why it happens:** The foreground/background state message from the app hasn't reached the server yet (network latency, WS reconnection delay).
**How to avoid:** Client-side `setNotificationHandler` should also suppress foreground notifications for the session being viewed (belt-and-suspenders). The server check prevents unnecessary push sending, but the client-side handler is the final gate.
**Warning signs:** Duplicate notifications -- system banner + in-app banner for the same event.

## Code Examples

### Notification Category Registration
```typescript
// Source: Expo Notifications docs (https://docs.expo.dev/versions/latest/sdk/notifications/)
import * as Notifications from 'expo-notifications';

export async function registerNotificationCategories() {
  await Notifications.setNotificationCategoryAsync('session_complete', [
    {
      identifier: 'open_session',
      buttonTitle: 'Open Session',
      options: { opensAppToForeground: true },
    },
  ]);

  await Notifications.setNotificationCategoryAsync('permission_request', [
    {
      identifier: 'approve',
      buttonTitle: 'Approve',
      options: {
        opensAppToForeground: false,  // Handle in background
        isDestructive: false,
      },
    },
    {
      identifier: 'deny',
      buttonTitle: 'Deny',
      options: {
        opensAppToForeground: false,
        isDestructive: true,  // Red text on iOS
      },
    },
  ]);
}
```

### Push Token Registration
```typescript
// Source: Expo Push Notifications Setup (https://docs.expo.dev/push-notifications/push-notifications-setup/)
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('[Push] Not a physical device -- push not available');
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
    console.error('[Push] No EAS projectId found');
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
  return tokenData.data; // "ExponentPushToken[...]"
}
```

### Foreground Notification Handler
```typescript
// Source: Expo Notifications docs
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data;
    const type = data?.type;
    const sessionId = data?.sessionId;

    // Don't show system banner if user is viewing this session
    const isViewingSession = /* check against current route/session */;

    return {
      shouldShowBanner: !isViewingSession,
      shouldShowList: true,
      shouldPlaySound: !isViewingSession,
      shouldSetBadge: true,
    };
  },
});
```

### Server-Side Push Sending
```javascript
// Source: expo-server-sdk README (https://github.com/expo/expo-server-sdk-node)
import { Expo } from 'expo-server-sdk';

const expo = new Expo();

async function sendPush(tokens, notification) {
  const messages = tokens
    .filter(t => Expo.isExpoPushToken(t.token))
    .map(t => ({
      to: t.token,
      title: notification.title,
      body: notification.body,
      data: notification.data,
      categoryId: notification.categoryId,
      sound: 'default',
      badge: 1,
    }));

  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];

  for (const chunk of chunks) {
    const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
    tickets.push(...ticketChunk);
  }

  return tickets;
}
```

### Delivery Receipt Checking
```javascript
// Source: expo-server-sdk README
async function checkReceipts(tickets) {
  const receiptIds = tickets
    .filter(t => t.status === 'ok' && t.id)
    .map(t => t.id);

  if (receiptIds.length === 0) return;

  const chunks = expo.chunkPushNotificationReceiptIds(receiptIds);

  for (const chunk of chunks) {
    const receipts = await expo.getPushNotificationReceiptsAsync(chunk);
    for (const [id, receipt] of Object.entries(receipts)) {
      if (receipt.status === 'error') {
        console.error(`[Push] Delivery failed for ${id}:`, receipt.message);
        if (receipt.details?.error === 'DeviceNotRegistered') {
          // Token is invalid -- remove from database
        }
      }
    }
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Expo Go push testing | Development build required | SDK 54 (2026) | Push notifications no longer work in Expo Go. Must use `eas build --profile development`. |
| `shouldShowAlert`/`shouldPlaySound` | `shouldShowBanner`/`shouldShowList` | SDK 53+ | NotificationBehavior API renamed properties. Use new names. |
| `notification` field in app.json | `expo-notifications` plugin in app.json plugins array | SDK 55 (upcoming) | SDK 55 removes `notification` from app.json. For SDK 54, the plugin approach is already the recommended path. |
| Direct APNs p8 key management | Expo Push Service handles APNs | Ongoing | Expo Push Service proxies to APNs. No need to manage APNs keys manually for Expo push tokens. |

**Deprecated/outdated:**
- `Notifications.presentLocalNotificationAsync()` -- removed in SDK 54. Use `scheduleNotificationAsync()` instead.
- `shouldShowAlert` in NotificationBehavior -- renamed to `shouldShowBanner`.
- `Expo Go` for push testing -- no longer supported for push in SDK 54+.

## Open Questions

1. **Thread-ID for Notification Grouping (D-04)**
   - What we know: APNs supports `thread-id` for grouping notifications. The Expo Push Service message format does not have a top-level `threadId` field in the documented schema.
   - What's unclear: How to pass `thread-id` through Expo Push Service. The `data` field is arbitrary JSON passed to the app, not APNs headers. May need `_contentAvailable` or direct APNs headers.
   - Recommendation: Use `collapseId` from the Expo Push API (documented, supported) for notification replacement. For visual grouping, iOS automatically groups by app. The batching logic (D-04, 5-second window) handles the "3 sessions = 1 notification" requirement at the server level, making APNs thread-id less critical. If true APNs thread-id is needed later, it can be added via `mutableContent: true` + notification service extension, but that's overengineering for v4.0.

2. **Badge Count Increment Strategy**
   - What we know: The push payload supports a `badge` field. `setBadgeCountAsync(0)` clears the badge on foreground.
   - What's unclear: Whether to send an absolute badge number (requires server tracking) or always send `1` and let the accumulation happen naturally.
   - Recommendation: Send `badge: 1` on each push. Clear to 0 on app foreground via `setBadgeCountAsync(0)` in AppState listener. Simple, avoids server-side badge tracking. The badge won't perfectly reflect unread count, but it signals "something happened" which is sufficient for a single-user dev tool.

3. **In-App Banner for Non-Active Sessions**
   - What we know: D-01 says don't send push if user is viewing the session. Claude's Discretion includes "whether to show an in-app notification banner when app is foregrounded but user is in a different session."
   - Recommendation: Show the NotificationBanner (glass surface, per UI-SPEC) when the app is foregrounded but the user is viewing a DIFFERENT session. Tapping the banner navigates to the completed/requesting session. This provides discoverability without interrupting focus.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Server + expo-server-sdk | Yes | 25.2.1 (from eas.json) | -- |
| expo-notifications | Mobile push client | No (not yet installed) | ~0.32.16 (to install) | -- |
| expo-device | Physical device check | No (not yet installed) | ~8.0.10 (to install) | -- |
| expo-server-sdk | Server push sending | No (not yet installed) | 6.1.0 (to install) | -- |
| EAS Build | Development build for push testing | Yes (eas.json configured) | CLI >=18.0.0 | -- |
| Physical iOS device | Push notification testing | Yes (iPhone registered in EAS) | -- | -- |
| Apple Developer Account | APNs certificates | Yes (Individual, Team ID 8ZWR46MYS5) | -- | -- |

**Missing dependencies with no fallback:**
- `expo-notifications`, `expo-device`, `expo-server-sdk` -- all need to be installed. Standard `npx expo install` / `npm install` commands.

**Missing dependencies with fallback:**
- None. All required tools and services are available.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 29.7 + jest-expo ~54.0.17 (mobile), Vitest (server -- if applicable) |
| Config file | `mobile/package.json` jest config (jest-expo preset) |
| Quick run command | `cd mobile && npx jest --testPathPattern=notifications --passWithNoTests -x` |
| Full suite command | `cd mobile && npx jest --passWithNoTests` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PUSH-01 | Push sent on session complete | unit (PushService) | `npx jest tests/push-service.test.js -x` | Wave 0 |
| PUSH-02 | Deep link navigates to session | unit (notification handler) | `npx jest tests/useNotifications.test.ts -x` | Wave 0 |
| PUSH-03 | Push sent on permission request | unit (PushService) | `npx jest tests/push-service.test.js -x` | Wave 0 |
| PUSH-04 | Approve/deny from notification | unit (MMKV queue + drain) | `npx jest tests/push-preferences.test.ts -x` | Wave 0 |
| PUSH-05 | Settings screen persists mode | unit (preference storage) | `npx jest tests/push-preferences.test.ts -x` | Wave 0 |
| PUSH-06 | Server sends via Expo Push Service | unit (PushService mock) | `npx jest tests/push-service.test.js -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd mobile && npx jest --passWithNoTests -x`
- **Per wave merge:** Full suite
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `mobile/__tests__/push-preferences.test.ts` -- covers PUSH-04, PUSH-05 (MMKV queue, preference storage)
- [ ] `mobile/__tests__/useNotifications.test.ts` -- covers PUSH-02 (deep link handling, cold start)
- [ ] `server/__tests__/push-service.test.js` -- covers PUSH-01, PUSH-03, PUSH-06 (PushService logic, batching, gating)
- [ ] Mock for `expo-notifications` module -- standard jest mock pattern
- [ ] Mock for `expo-server-sdk` -- mock Expo class with sendPushNotificationsAsync

## Sources

### Primary (HIGH confidence)
- [Expo Notifications SDK Reference](https://docs.expo.dev/versions/latest/sdk/notifications/) -- API signatures, setNotificationCategoryAsync, setNotificationHandler, getLastNotificationResponseAsync, requestPermissionsAsync, setBadgeCountAsync
- [Expo Push Notifications Setup](https://docs.expo.dev/push-notifications/push-notifications-setup/) -- Registration flow, EAS configuration, token handling
- [Expo Push Service Message Format](https://docs.expo.dev/push-notifications/sending-notifications/) -- Full payload schema including categoryId, interruptionLevel, badge, sound, collapseId
- [expo-server-sdk-node GitHub](https://github.com/expo/expo-server-sdk-node) -- Server SDK API, chunking, receipt handling, error patterns
- npm registry -- verified `expo-notifications@~0.32.16`, `expo-server-sdk@6.1.0`, `expo-device@~8.0.10`
- `mobile/node_modules/expo/bundledNativeModules.json` -- SDK 54 version compatibility mapping

### Secondary (MEDIUM confidence)
- [Expo "What You Need to Know" Guide](https://docs.expo.dev/push-notifications/what-you-need-to-know/) -- Cold-start listener registration guidance, platform-specific behavior
- [GitHub Issue #36282](https://github.com/expo/expo/issues/36282) -- Notification action buttons in background/killed state (Android-specific issue, iOS works correctly)
- [Apple Developer Forums on thread-id](https://developer.apple.com/forums/thread/69520) -- APNs thread-id behavior and limitations

### Tertiary (LOW confidence)
- Thread-ID passthrough via Expo Push Service -- no definitive documentation found on mapping Expo payload fields to APNs `thread-id` header. The `collapseId` field is documented; `threadId` may not be directly exposed.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- expo-notifications and expo-server-sdk are the documented, official path for Expo apps. Versions verified against bundledNativeModules.json.
- Architecture: HIGH -- patterns derived from CONTEXT.md locked decisions, official Expo docs, and existing codebase patterns (MMKV, WS lifecycle, module-scoped singletons).
- Pitfalls: HIGH -- cold-start handling, double navigation, and push token refresh are well-documented issues in the Expo community with clear solutions.
- Notification grouping: MEDIUM -- APNs thread-id passthrough via Expo Push Service is not clearly documented. Server-side batching (D-04) handles the requirement without thread-id.

**Research date:** 2026-04-04
**Valid until:** 2026-05-04 (stable -- Expo SDK 54 is current, libraries are recently published)
