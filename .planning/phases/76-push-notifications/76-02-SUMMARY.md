---
phase: 76-push-notifications
plan: 02
subsystem: mobile
tags: [expo-notifications, expo-device, push-notifications, mmkv, deep-linking, cold-start, reanimated, gesture-handler]

# Dependency graph
requires:
  - phase: 75-chat-foundation
    provides: "Mobile app shell, stores, theme, API client, MMKV storage, WebSocket init"
provides:
  - "Module-level cold-start notification listener (store-only, no API calls)"
  - "MMKV push-preferences: notification mode, pending-approvals queue, push token persistence"
  - "useNotifications hook: token registration, deep linking, queue drain"
  - "NotificationBanner: glass-surface floating banner with spring animations"
affects: [76-push-notifications, settings-screen, notification-preferences]

# Tech tracking
tech-stack:
  added: [expo-notifications ~0.32.16, expo-device ~8.0.10]
  patterns: [module-level notification listener for cold-start, MMKV preference queue, module-scoped banner callback]

key-files:
  created:
    - mobile/lib/notifications.ts
    - mobile/lib/push-preferences.ts
    - mobile/hooks/useNotifications.ts
    - mobile/components/notifications/NotificationBanner.tsx
  modified:
    - mobile/package.json

key-decisions:
  - "Module-level listener ONLY stores response, never calls API or navigates [S-8]"
  - "apiClient.apiFetch used instead of .get/.post (actual API surface of shared api-client)"
  - "Session validation searches projects' sessions array, not just server reachability [D-12 WARNING 5 fix]"
  - "useConnectionStore.subscribe for WS status transitions instead of hook selector (side-effect hook)"

patterns-established:
  - "Cold-start notification: module import registers listener, useEffect in authenticated context consumes"
  - "MMKV queue pattern: queueApproval stores durably, drain on WS connected transition"
  - "NotificationBanner: module-scoped showBannerFn callback, same as toast.tsx"

requirements-completed: [PUSH-01, PUSH-02, PUSH-03, PUSH-04]

# Metrics
duration: 6min
completed: 2026-04-04
---

# Phase 76 Plan 02: Mobile Push Notification Infrastructure Summary

**Cold-start safe notification listener, MMKV push-preferences with token persistence, useNotifications hook, and glass-surface NotificationBanner**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-04T03:30:32Z
- **Completed:** 2026-04-04T03:36:57Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Module-level notification listener registered at import time catches cold-start responses before React mounts, strictly store-only per S-8
- MMKV push-preferences lib provides notification mode, pending-approvals queue, and push token persistence (S-4) for Plan 03 settings screen
- useNotifications hook orchestrates full push lifecycle: token registration with MMKV persist (S-5), notification categories (D-05), deep link navigation with session validation (D-12), and pending-approvals queue drain on WS reconnect (D-06/Pitfall 3)
- NotificationBanner with BlurView glass surface, tint variants per type, navigation spring entrance, swipe-up gesture dismiss, and micro spring tap feedback

## Task Commits

Each task was committed atomically:

1. **Task 1: Notification lib + push-preferences lib** - `d9ebfa3` (feat)
2. **Task 2: useNotifications hook + NotificationBanner component** - `5258971` (feat)

## Files Created/Modified
- `mobile/lib/notifications.ts` - Module-level cold-start listener, push token registration, notification categories
- `mobile/lib/push-preferences.ts` - MMKV notification mode, pending-approvals queue, push token persistence
- `mobile/hooks/useNotifications.ts` - Push lifecycle hook: registration, deep linking, queue drain
- `mobile/components/notifications/NotificationBanner.tsx` - Glass-surface floating banner with spring animations
- `mobile/package.json` - Added expo-notifications, expo-device dependencies

## Decisions Made
- Used `apiClient.apiFetch<T>()` instead of `.get()`/`.post()` referenced in plan -- the actual shared api-client only exposes `apiFetch`, not convenience methods. This is a deviation from plan pseudocode but matches the real codebase API.
- Session validation in handleNotificationResponse fetches full project list and searches sessions array, fixing WARNING 5 from plan review (original approach only checked server reachability, not session existence).
- Used `useConnectionStore.subscribe()` for WS status transition detection instead of a hook selector, since useNotifications is a void side-effect hook and needs store subscription outside render cycle.
- `showToast` called with 3 args `(message, action, duration)` matching actual toast.tsx signature instead of plan's `{ duration }` options object.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Adjusted apiClient method calls to match actual API**
- **Found during:** Task 2 (useNotifications hook)
- **Issue:** Plan referenced `apiClient.post()` and `apiClient.get()` but shared api-client only exposes `apiClient.apiFetch<T>(path, options)`
- **Fix:** Used `apiFetch` with `{ method: 'POST', headers, body }` for registration and `apiFetch<ProjectFromApi[]>('/api/projects')` for session validation
- **Files modified:** mobile/hooks/useNotifications.ts
- **Verification:** TypeScript compiles without errors
- **Committed in:** 5258971

**2. [Rule 1 - Bug] Fixed showToast call signature**
- **Found during:** Task 2 (useNotifications hook)
- **Issue:** Plan used `showToast('msg', { duration: 3000 })` but actual toast.tsx accepts `(message, action?, duration?)`
- **Fix:** Called `showToast('Session no longer available', undefined, 3000)`
- **Files modified:** mobile/hooks/useNotifications.ts
- **Verification:** TypeScript compiles without errors
- **Committed in:** 5258971

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes necessary for correct API usage. No scope creep.

## Issues Encountered
- Pre-existing TypeScript errors in mobile app (React 19/RN type mismatches, NativeWind issues) unrelated to new files -- documented in project memory as known issue from Phase 68
- Mobile worktree needed `npm install` before `expo install` could run (worktrees don't inherit node_modules)

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 4 files ready for integration: notifications.ts import goes at top of _layout.tsx, useNotifications called in AuthenticatedApp, NotificationBanner mounted in root layout
- Plan 03 (settings screen) can import getPushToken/setPushToken from push-preferences.ts [S-4]
- Plan 01 (backend) provides /api/push/register endpoint that useNotifications calls

---
*Phase: 76-push-notifications*
*Completed: 2026-04-04*
