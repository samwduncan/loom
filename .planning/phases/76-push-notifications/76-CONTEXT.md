# Phase 76: Push Notifications - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver actionable push notifications on iPhone when sessions complete or need permission, with deep links into the specific session and configurable notification granularity. Uses Expo Push Service + APNs. Builds on Phase 75's chat shell (deep link targets) and Phase 74's auth (JWT for token registration).

Requirements: PUSH-01, PUSH-02, PUSH-03, PUSH-04, PUSH-05, PUSH-06

</domain>

<decisions>
## Implementation Decisions

### Notification Trigger Logic
- **D-01:** Push notifications are gated on connection state. Only send push when: (a) WS is disconnected, OR (b) app has been backgrounded for >30 seconds. Never send push if the user is actively viewing the session in foreground.
- **D-02:** Trigger events: session completion (success or error), and permission.request from agent. Do NOT send push for progress milestones, partial completions, or streaming updates.
- **D-03:** Backend tracks per-client WS connection state and app foreground/background via AppState messages. When a trigger event fires, backend checks: is any client connected AND foregrounded? If yes, skip push (inline UI handles it). If no, send push.
- **D-04:** Notification batching: if multiple sessions complete within a 5-second window, batch into a single grouped notification ("3 sessions completed") rather than spamming individual pushes. Use APNs thread-id for grouping.

### Permission Approval from Notification (PUSH-03, PUSH-04)
- **D-05:** Use Expo notification categories with `UNNotificationAction` buttons: "Approve" and "Deny" for permission requests. Category ID: `permission_request`.
- **D-06:** When user taps an action button (app may be killed), store the response in MMKV immediately: `{ requestId, action: 'approve'|'deny', timestamp }`. On app foreground or WS reconnect, drain the MMKV pending-approvals queue and send responses via WebSocket.
- **D-07:** Cold-start race condition mitigation: agent timeout must be generous enough (configurable, default 120s) to account for app boot + auth + WS connect + queue drain. If approval arrives after timeout, backend returns "expired" status — app shows a toast "Permission request expired."
- **D-08:** Security: permission response includes the original requestId (opaque UUID) — backend validates the requestId exists and is still pending before accepting the response.

### Deep Link Routing (PUSH-02)
- **D-09:** Deep link scheme: `loom://chat/{sessionId}`. Expo Router handles this via `(drawer)/(stack)/chat/[id].tsx` file-based route.
- **D-10:** Warm launch (app backgrounded): Expo Router handles deep link automatically via notification `data.url` field.
- **D-11:** Cold launch (app killed): Use `Notifications.getLastNotificationResponseAsync()` in root layout (`_layout.tsx`) after auth completes. Parse notification data, call `router.push()` manually.
- **D-12:** Deep link validation: before navigating to a session, verify the session exists via API or local cache. If session doesn't exist (deleted, expired), navigate to session list with a toast "Session no longer available." Never silently fail.
- **D-13:** Anti-double-navigation: set a `hasHandledColdStartNotification` ref in root layout. Skip automatic deep-link handling if already navigated from cold-start notification.

### Settings & Granularity (PUSH-05)
- **D-14:** Notification preferences stored device-level in MMKV. Keys: `push_pref_mode` with values: `all` (default), `failures_and_permissions`, `permissions_only`, `none`.
- **D-15:** Settings UI: new "Notifications" section in app settings screen. Toggle-based options matching the 4 modes above. Changes take effect immediately (MMKV write + backend preference sync).
- **D-16:** Backend stores notification preference per push token in the `push_tokens` table (`notification_mode` column). Mobile app syncs preference to backend on change and on token registration. Backend filters before sending — never send a push the user has opted out of.

### Backend Architecture (PUSH-06)
- **D-17:** New `push_tokens` SQLite table: `id`, `token` (ExpoPushToken), `platform` ('ios'), `user_id` (from JWT), `notification_mode`, `created_at`, `updated_at`. Unique constraint on `token`.
- **D-18:** New REST endpoints: `POST /api/push/register` (register/update token + preferences), `DELETE /api/push/register` (unregister token), `PATCH /api/push/preferences` (update notification mode).
- **D-19:** Server-side: `expo-server-sdk` npm package. New `PushService` module that handles: token validation, notification formatting, batch sending, delivery receipt checking.
- **D-20:** Integration points: SessionWatcher emits `session:complete` event → PushService checks connection state → sends push if criteria met. Permission request handler fires `permission:request` event → same flow.
- **D-21:** Notification payload structure: `{ title, body, data: { type: 'session_complete'|'permission_request', sessionId, requestId?, url: 'loom://chat/{sessionId}' }, categoryId, sound, badge }`.

### Mobile Architecture
- **D-22:** New `expo-notifications` dependency. Register for push notifications on app launch (after auth). Store ExpoPushToken. Send to backend via `/api/push/register`.
- **D-23:** Notification handler setup in root layout: `Notifications.setNotificationHandler()` for foreground behavior (don't show banner if session is visible), `addNotificationResponseReceivedListener()` for tap handling.
- **D-24:** AppState foreground listener: on `active` state, drain MMKV pending-approvals queue → send via WS.
- **D-25:** New `useNotifications` hook: manages token registration, permission request, notification listeners, deep link handling, and preference syncing.

### Claude's Discretion
- Notification sound selection (default vs custom)
- Badge count management strategy (clear on app open vs per-session)
- Exact notification body text formatting (summary length, emoji usage)
- Retry logic for failed push delivery (expo-server-sdk handles this, but retry count/backoff configurable)
- Whether to show an in-app notification banner when app is foregrounded but user is in a different session

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Push Notification Architecture
- `.planning/research/agent-orchestration-architecture.md` §Push Notification Strategy — Expo Push Service pattern, server-side code example, push_tokens schema
- `.planning/research/ARCHITECTURE.md` §One Backend Addition for Push Notifications — POST /api/push/register endpoint, backend changes spec

### UI Patterns
- `.planning/research/UI-PATTERN-MAP.md` §6. Push Notifications — Reference apps (GitHub Mobile, Okta, n8n), action button patterns, granularity settings
- `.planning/research/UI-PATTERN-MAP.md` §7. Dynamic Island / Live Activities — Shares APNs infrastructure, relevant for future Phase 82

### Phase 75 Context (Foundation)
- `.planning/phases/75-chat-shell/75-CONTEXT.md` — Permission cards (D-20 to D-22), auth (D-31), chat screen routing, message list architecture. Push extends inline permission cards to background notifications.

### Phase 74 Context (Auth + Connection)
- `.planning/phases/74-shell-connection/74-CONTEXT.md` — JWT auth, WebSocket lifecycle, drawer navigation, theme system. Push uses same auth for token registration.

### Backend API
- `.planning/BACKEND_API_CONTRACT.md` — Existing endpoints, WebSocket protocol. New push endpoints extend this contract.

### Visual Contract
- `.planning/NATIVE-APP-SOUL.md` — Spring configs, surface hierarchy, haptics. Notification settings UI must comply.

### Strategic Direction
- `.planning/ROADMAP.md` — Phase 76 definition, success criteria, dependencies
- `.planning/REQUIREMENTS.md` — PUSH-01 through PUSH-06 acceptance criteria
- `.planning/PROJECT.md` — Core value, architecture overview

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **SessionWatcher** (`server/cache/session-watcher.js`): Already watches JSONL files and emits events on session changes. Can emit `session:complete` events for push trigger.
- **WebSocket infrastructure** (`server/index.js`, `shared/lib/websocket-client.ts`): Connection state tracking exists. Can be extended to report foreground/background state.
- **JWT auth** (`mobile/lib/auth-provider.ts`, `server/index.js`): Working auth flow. Push token registration uses same JWT header.
- **MMKV storage adapter** (`mobile/lib/storage-adapter.ts`): Already used for session data. Extends to push preferences and pending-approval queue.
- **Permission card system** (`mobile/components/chat/segments/PermissionCard.tsx`): Inline permission UI exists. Push notification mirrors this for backgrounded state.
- **Toast system** (`mobile/lib/toast.tsx`): Module-scoped callback pattern. Reusable for push notification feedback ("Session completed", "Permission expired").
- **Springs** (`mobile/lib/springs.ts`): 6 named spring configs. Settings UI animations.

### Established Patterns
- **createStyles(theme)**: StyleSheet factory for all components. Settings notification screen uses this.
- **Expo Router file-based routing**: `(drawer)/(stack)/chat/[id].tsx` already handles session navigation. Deep links route here.
- **`loom://` scheme**: Configured in app.json. Deep links work via Expo Router.
- **Hook pattern**: All mobile state management via custom hooks in `mobile/hooks/`. New `useNotifications` follows same pattern.

### Integration Points
- **Root layout** (`mobile/app/_layout.tsx`): Notification handler setup, cold-start deep link handling, push token registration after auth.
- **Backend index** (`server/index.js`): New PushService integration, session completion event wiring.
- **Backend database** (`server/database/db.js`): New `push_tokens` table migration.
- **Settings screen**: New "Notifications" section (needs to be created — no settings screen exists yet in mobile app).

</code_context>

<specifics>
## Specific Ideas

- **Permission approval from notification action buttons is the killer feature** — this is what makes the app a real "command center." User can approve agent permissions from lock screen without opening the app. Worth the cold-start complexity.
- **Don't duplicate notifications when app is open** — gate on connection state + foreground tracking. If the user is looking at the session, inline permission card is enough.
- **Batch session completions** — if 3 agents finish within 5 seconds, one notification ("3 sessions completed") not three. Prevents notification fatigue.
- **Validate deep links** — never silently navigate to nowhere. If session doesn't exist, show session list + toast.
- **MMKV queue for offline approvals** — the bridge between "user tapped Approve on lock screen" and "agent receives the approval via WebSocket." Drain queue on reconnect.

</specifics>

<quality_bar>
## Quality Bar (Bard Assessment)

**Good:**
- Notifications arrive reliably for session completions
- Deep links work 95% of the time (warm launch)
- Permission approve/deny buttons appear on notification
- Settings toggle works and persists

**Exceptional (what separates world-class):**
- Notifications are **batched** (3 completions = 1 grouped notification, not 3 spam pushes)
- **Smart throttling:** Don't notify if user is actively using the app and viewing the relevant session
- Pending-approval MMKV queue is **bulletproof**: survives app kill, device restart, WS disconnect. Agent never times out because approval was lost in transit.
- Deep link validation: session doesn't exist → graceful fallback (session list + toast), never silent failure
- **Cold-start permission approval** actually works reliably: app boots, auths, connects WS, drains queue, agent gets response — all within timeout window
- Notification settings are **immediately effective** — change from "all" to "permissions only" and the next completion notification doesn't fire
- Backend tracks delivery receipts from Expo Push Service and logs failures
- Test on real device (not simulator) — simulator lies about notification delivery timing

**The quality bar is:** Would a DevOps engineer with 5 phones say "this is better than GitHub Mobile notifications"? The notification should feel like a trusted signal, not spam.

</quality_bar>

<deferred>
## Deferred Ideas

- **Dynamic Island integration** — shares APNs infrastructure, Phase 82 scope
- **Critical alerts for permission requests** (bypass DND) — iOS critical alert API requires special Apple entitlement. Research in Phase 82.
- **Multi-device notification sync** — if user has iPad + iPhone, both get push. Current design handles this (multiple tokens per user), but multi-device testing deferred.
- **Notification analytics** — track delivery rate, action tap rate, deep-link success rate. Expose in Forgejo metrics. Future phase.
- **Session-type filtering** — "notify me only about code review sessions" (filter by session type, not just failure mode). Future settings enhancement.

### Reviewed Todos (not folded)
None — no matching todos found for Phase 76.

</deferred>

---

*Phase: 76-push-notifications*
*Context gathered: 2026-04-04*
