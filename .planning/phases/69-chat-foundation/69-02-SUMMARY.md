---
phase: 69-chat-foundation
plan: 02
subsystem: auth, connection, mobile
tags: [react-native, expo-secure-store, jwt, websocket, zustand, reanimated, spring-physics, glass-surface, keychain]

# Dependency graph
requires:
  - phase: 69-chat-foundation
    plan: 01
    provides: "Spring configs, dynamic color, WebSocket init with AppState lifecycle, MarkdownRenderer"
  - phase: 68-scaffolding-design
    provides: "Auth-provider, platform.ts, store factories, design primitives (Button, GlassSurface, TextHierarchy)"
provides:
  - "useAuth hook with login (JWT validation via /api/auth/user), logout (deleteItemAsync), checkAuth"
  - "useConnection hook reading state.providers.claude.status (not flat state.status)"
  - "AuthPrompt screen with JWT input, server URL display, error state, Connect button"
  - "ConnectionBanner with hasConnectedOnce guard (no cold-start flash), Navigation spring slide-down, glass surface"
  - "Root layout with Slot (not Drawer), 3-way auth gate, KeyboardProvider, WebSocket init trigger"
affects: [69-03, 69-04, 69-05, chat-screen, composer, session-list, settings]

# Tech tracking
tech-stack:
  added: []
  patterns: [useAuth-hook-for-keychain-auth, useConnection-hook-for-zustand-provider-state, auth-gate-3-way-render, hasConnectedOnce-ref-guard, slot-not-drawer-in-root-layout]

key-files:
  created:
    - mobile/hooks/useAuth.ts
    - mobile/hooks/useConnection.ts
    - mobile/components/connection/AuthPrompt.tsx
    - mobile/components/connection/ConnectionBanner.tsx
  modified:
    - mobile/lib/auth-provider.ts
    - mobile/app/_layout.tsx

key-decisions:
  - "clearToken uses deleteItemAsync (not setItem with empty string) to properly remove Keychain entry (SS-6 fix)"
  - "Root layout uses Slot from expo-router, not Drawer -- single Drawer lives in (drawer)/_layout.tsx only (S-7 fix)"
  - "3-way render in root layout: isLoading (splash) -> !isAuthenticated (AuthPrompt) -> Slot (A-6 fix)"
  - "ConnectionBanner uses hasConnectedOnce useRef guard to prevent flash on cold start (A-3 fix)"
  - "useConnection reads state.providers.claude.status/error, not flat state.status/error (A-2 fix)"
  - "AuthPrompt uses inline styles instead of NativeWind className to avoid pre-existing TS augmentation issue"

patterns-established:
  - "Auth gate pattern: useAuth() + 3-way render (isLoading/!isAuthenticated/authenticated) in root layout"
  - "Connection subscription: useConnection() reads state.providers.claude.status for single-provider state"
  - "Cold-start guard: hasConnectedOnce useRef(false) prevents UI flash before first WebSocket connection"
  - "Root provider order: GestureHandlerRootView > KeyboardProvider > auth gate > Slot"

requirements-completed: [CHAT-09, CHAT-10, CHAT-11]

# Metrics
duration: 16min
completed: 2026-03-31
---

# Phase 69 Plan 02: Auth Flow & Connection Resilience Summary

**JWT auth via iOS Keychain with deleteItemAsync fix, ConnectionBanner with glass slide-down and cold-start guard, root layout rewired with Slot/KeyboardProvider/3-way auth gate**

## Performance

- **Duration:** 16 min
- **Started:** 2026-03-31T22:29:58Z
- **Completed:** 2026-03-31T22:46:50Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Fixed SS-6 clearToken bug: deleteItemAsync properly removes Keychain entry instead of storing empty string
- Built complete auth flow: useAuth hook validates JWT against /api/auth/user, stores in Keychain, provides login/logout/checkAuth
- ConnectionBanner with Soul-doc glass surface, Navigation spring (22/130) slide-down, hasConnectedOnce ref guard preventing cold-start flash, destructive tint for errors, reconnecting pulse animation, auth failure re-enter token button
- Root layout rewritten: Slot (not Drawer) prevents dual nesting crash, 3-way render prevents blank flash, KeyboardProvider wraps everything, WebSocket init triggered on auth

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix auth-provider, build auth prompt, connection banner, and hooks** - `0655636` (feat)
2. **Task 2: Wire root layout with KeyboardProvider, auth gate, WebSocket init** - `fc63abc` (feat)

## Files Created/Modified
- `mobile/lib/auth-provider.ts` - Fixed clearToken: deleteItemAsync instead of setItem('')
- `mobile/hooks/useAuth.ts` - Auth state hook: checkAuth, login (validates JWT), logout, isAuthenticated, isLoading
- `mobile/hooks/useConnection.ts` - Connection state hook: reads state.providers.claude.status/error
- `mobile/components/connection/AuthPrompt.tsx` - JWT input screen: 28px Loom heading, TextInput, Connect button, server URL, error display
- `mobile/components/connection/ConnectionBanner.tsx` - Glass slide-down banner: Navigation spring, hasConnectedOnce guard, destructive tint, reconnecting pulse, auth failure re-enter button
- `mobile/app/_layout.tsx` - Root layout: Slot (not Drawer), 3-way auth gate, KeyboardProvider, WebSocket init, ConnectionBanner

## Decisions Made
- **deleteItemAsync for clearToken** -- Storing an empty string leaves a Keychain entry that getToken() would return as truthy empty string. deleteItemAsync properly removes the entry so getToken() returns null.
- **Slot in root layout** -- Expo Router's Drawer cannot nest inside another Drawer. Root uses Slot to render child route groups; the single Drawer navigator lives in (drawer)/_layout.tsx.
- **3-way render gate** -- isLoading starts true during async Keychain read. Without this, users see a blank frame before auth state resolves.
- **hasConnectedOnce ref guard** -- WebSocket status starts as 'disconnected' before first connect. Without the guard, ConnectionBanner would flash on every cold start.
- **Inline styles over NativeWind className** -- LoomText, GlassSurface, etc. have a pre-existing TS type augmentation issue where className is not recognized by TypeScript. Using inline styles in AuthPrompt avoids adding to that debt.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed className TypeScript errors in AuthPrompt**
- **Found during:** Task 2 (TypeScript verification)
- **Issue:** LoomText's `className` prop causes TS errors due to pre-existing NativeWind type augmentation issue from Phase 68. Our new AuthPrompt was passing `className="text-text-primary"` which triggered the same error.
- **Fix:** Replaced className with equivalent inline `style={{ color: '...' }}` props
- **Files modified:** mobile/components/connection/AuthPrompt.tsx
- **Verification:** `npx tsc --noEmit` shows zero errors in plan files
- **Committed in:** fc63abc (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential for TypeScript correctness. No scope creep.

## Issues Encountered
- Pre-existing test failures (151 files) from deleted shared/__tests__/ files. Same baseline as Plan 01. Not caused by plan changes.
- Pre-existing TypeScript errors (38 total) in Phase 68 design primitives (NativeWind className augmentation). Not caused by plan changes. Our new files compile clean.

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all components are fully functional with real data sources wired.

## Next Phase Readiness
- Auth flow complete: token prompt -> validation -> Keychain storage -> WebSocket init
- Connection resilience complete: banner on disconnect, auto-dismiss on reconnect, auth failure handling
- Root layout wired: providers, auth gate, WebSocket trigger, ConnectionBanner
- Ready for Plan 03 (session list and drawer content) and Plan 04 (chat screen and composer)
- useAuth and useConnection hooks available for all downstream components

## Self-Check: PASSED

All 6 files verified. Both task commits (0655636, fc63abc) confirmed in git log.

---
*Phase: 69-chat-foundation*
*Completed: 2026-03-31*
