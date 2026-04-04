---
phase: 76-push-notifications
plan: 04
subsystem: integration
tags: [push-notifications, websocket, expo-notifications, deep-linking, app-state, cold-start, typescript]

# Dependency graph
requires:
  - phase: 76-push-notifications
    provides: "Plans 01-03: PushService singleton, push_tokens table, REST endpoints, WS push triggers, notification lib, useNotifications hook, NotificationBanner, settings screen"
provides:
  - End-to-end push notification wiring from server event to iPhone notification tray
  - AppState foreground/background reporting via WebSocket app-state messages
  - Per-session push gating via setCurrentViewingSessionId in chat screen
  - Cold-start notification listener integration in root layout
  - In-app notification banner for foreground events
  - ClientMessage type extended with app-state member
  - 120s permission approval timeout for cold-start flow
affects: [device-testing, future-agent-management]

# Tech tracking
tech-stack:
  added: []
  patterns: [app-state WS message for push gating, module-scoped viewing session tracker, AuthenticatedApp component pattern]

key-files:
  modified:
    - shared/types/websocket.ts
    - mobile/app/_layout.tsx
    - mobile/lib/websocket-init.ts
    - mobile/hooks/useNotifications.ts
    - mobile/components/notifications/NotificationBanner.tsx
    - mobile/app/(drawer)/(stack)/chat/[id].tsx
    - server/claude-sdk.js

key-decisions:
  - "wsClient.send() takes ClientMessage object (not JSON string) -- plan's JSON.stringify calls corrected to typed object usage"
  - "BannerData exported from NotificationBanner for type-safe import in useNotifications"
  - "app-state WS messages sent on both foreground and background transitions for server-side push gating"
  - "setCurrentViewingSessionId sends immediate WS update if connected, not just local state"
  - "120s permission timeout (up from 55s) per D-07 cold-start analysis: iOS boot + auth + WS + MMKV drain"

patterns-established:
  - "AuthenticatedApp component: isolates auth-dependent hooks (useNotifications) from conditional rendering"
  - "setCurrentViewingSessionId: per-screen session reporting for server-side push suppression"
  - "Foreground notification -> in-app banner pattern via addNotificationReceivedListener + showNotificationBanner"

requirements-completed: [PUSH-01, PUSH-02, PUSH-03, PUSH-04, PUSH-06]

# Metrics
duration: 7min
completed: 2026-04-04
---

# Phase 76 Plan 04: End-to-End Push Integration Summary

**Full push notification wiring: root layout cold-start listener, AppState WS reporting, per-session gating in chat screen, in-app banners, ClientMessage type extension, and 120s permission timeout**

## Performance

- **Duration:** 7 min
- **Started:** 2026-04-04T03:43:00Z
- **Completed:** 2026-04-04T03:50:26Z
- **Tasks:** 2 of 3 (Task 3 is human-verify checkpoint)
- **Files modified:** 7

## Accomplishments
- Wired all push notification components end-to-end: root layout imports cold-start listener as first import, calls useNotifications in authenticated branch, renders NotificationBanner above all content
- Added AppState foreground/background reporting to server via WS app-state messages for connection-aware push gating
- Implemented per-session push gating: chat screen reports viewed session on mount/unmount, server suppresses push for actively viewed sessions (D-01)
- Added foreground notification received listener that triggers in-app glass-surface banner instead of system notification
- Extended ClientMessage union type with app-state member for TypeScript safety (SS-2)
- Updated TOOL_APPROVAL_TIMEOUT_MS from 55s to 120s for cold-start permission approval flow (S-6, D-07)

## Task Commits

Each task was committed atomically:

1. **Task 1: ClientMessage type + root layout + AppState WS reporting + chat screen gating + in-app banner** - `e15e4fe` (feat)
2. **Task 2: Permission timeout update + integration verification** - `5b03217` (fix)
3. **Task 3: Device verification** - PENDING (checkpoint:human-verify)

## Files Modified
- `shared/types/websocket.ts` - Added app-state to ClientMessage union type [SS-2]
- `mobile/app/_layout.tsx` - First import of notifications.ts (cold-start), AuthenticatedApp with useNotifications + NotificationBanner
- `mobile/lib/websocket-init.ts` - AppState WS reporting, setCurrentViewingSessionId export, getCurrentViewingSessionId
- `mobile/hooks/useNotifications.ts` - Foreground notification received listener with in-app banner via showNotificationBanner
- `mobile/components/notifications/NotificationBanner.tsx` - Exported BannerData interface for type-safe import
- `mobile/app/(drawer)/(stack)/chat/[id].tsx` - Per-session push gating: setCurrentViewingSessionId on mount/unmount
- `server/claude-sdk.js` - TOOL_APPROVAL_TIMEOUT_MS default updated to 120000 (D-07)

## Decisions Made
- Used typed `wsClient.send({type: 'app-state', ...})` instead of plan's `wsClient.send(JSON.stringify({...}))` -- the WebSocketClient.send() method takes a ClientMessage object and stringifies internally. Double-stringifying would have caused a runtime error on the server.
- Exported `BannerData` interface from NotificationBanner.tsx so useNotifications.ts can import the type for the foreground notification listener. Previously it was a private interface.
- app-state WS messages are sent on BOTH foreground and background transitions (not just foreground) so the server knows immediately when the app backgrounds, enabling the 30-second push threshold logic.
- setCurrentViewingSessionId sends an immediate WS update if connected, providing real-time per-session gating to the server instead of waiting for the next AppState transition.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected wsClient.send() call signature**
- **Found during:** Task 1 (websocket-init.ts modifications)
- **Issue:** Plan specified `wsClient.send(JSON.stringify({type: 'app-state', ...}))` but WebSocketClient.send() accepts ClientMessage object, not string. It calls JSON.stringify internally.
- **Fix:** Used `wsClient.send({type: 'app-state', foreground, viewingSessionId})` as typed object
- **Files modified:** mobile/lib/websocket-init.ts
- **Verification:** TypeScript compiles without new errors
- **Committed in:** e15e4fe

**2. [Rule 3 - Blocking] Exported BannerData type for cross-module import**
- **Found during:** Task 1 (useNotifications foreground listener)
- **Issue:** BannerData interface was private in NotificationBanner.tsx, but useNotifications needs it for type-safe notification type handling
- **Fix:** Changed `interface BannerData` to `export interface BannerData`
- **Files modified:** mobile/components/notifications/NotificationBanner.tsx
- **Verification:** TypeScript import works, no new errors
- **Committed in:** e15e4fe

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered
- Push REST endpoints return 404 against running server because the production instance hasn't been restarted with Plan 01's changes. Code-level verification confirms routes are wired correctly (server/index.js line 424: `app.use('/api/push', authenticateToken, pushRoutes)`). Server restart needed before device testing.
- Pre-existing 46 TypeScript errors (NativeWind v4 / React 19 type mismatches) unchanged by our modifications. Known issue from Phase 68.

## Pending: Device Verification (Task 3)

Task 3 is a checkpoint:human-verify requiring physical iPhone testing. See checkpoint details below for the full test matrix.

**Pre-requisites before device testing:**
1. Restart the backend server to pick up Plan 01's push routes and push triggers
2. Build a development build: `cd mobile && eas build --profile development --platform ios`
3. Install on physical iPhone via TestFlight or direct install

## User Setup Required
Server restart required to activate push notification routes from Plan 01.

## Known Stubs
None -- all functionality is fully wired. In-app banner, WS reporting, per-session gating, and timeout update are all functional code.

## Next Phase Readiness
- All code for push notifications is committed and wired end-to-end
- Device testing (Task 3) is the only remaining verification step
- After device testing passes, Phase 76 push-notifications is complete

---
*Phase: 76-push-notifications*
*Completed: 2026-04-04 (code complete, device testing pending)*
