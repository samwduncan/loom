---
phase: 63-bundled-assets-device-validation
plan: 02
subsystem: connection, validation
tags: [capacitor, ios, websocket, connection-error, vpn, tailscale, device-testing]

# Dependency graph
requires:
  - phase: 63-bundled-assets-device-validation
    provides: Vite base path fix, white flash prevention, cap-build.sh
  - phase: 59-platform-foundation
    provides: IS_NATIVE, platform.ts URL abstraction
  - phase: 61-touch-layout-native-plugins
    provides: SplashScreen plugin, hideSplashWhenReady()
provides:
  - Auth bootstrap error handling (no unhandled rejection on unreachable server)
  - Native-aware connection error messaging (VPN-specific hints)
  - Comprehensive device validation checklist for v2.1 UAT
affects: [device-testing, ios-deployment]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "try/catch around bootstrapAuth() in websocket-init.ts for graceful auth failure"
    - "IS_NATIVE conditional messaging in ConnectionBanner for platform-aware UX"

key-files:
  created:
    - .planning/phases/63-bundled-assets-device-validation/DEVICE-VALIDATION-CHECKLIST.md
  modified:
    - src/src/lib/websocket-init.ts
    - src/src/lib/websocket-init.test.ts
    - src/src/components/shared/ConnectionBanner.tsx
    - src/src/components/shared/ConnectionBanner.test.tsx

key-decisions:
  - "Web-mode auth failure shows 'Unable to connect to server'; native-mode shows 'Server unreachable -- check Tailscale VPN connection'"
  - "Error handling in websocket-init.ts sets both providerError AND providerStatus to make ConnectionBanner visible"

patterns-established:
  - "Auth failure catch pattern: wrap bootstrapAuth+connect in try/catch, set connection store error state"
  - "IS_NATIVE conditional in UI components: import from platform.ts, not direct window.Capacitor check"

requirements-completed: [BUNDLE-03, BUNDLE-04]

# Metrics
duration: 4min
completed: 2026-03-28
---

# Phase 63 Plan 02: Connection Error Handling & Device Validation Summary

**Auth bootstrap error handling with native-aware VPN messaging and comprehensive 104-line device validation checklist**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-28T06:36:07Z
- **Completed:** 2026-03-28T06:40:04Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Auth bootstrap failures caught in websocket-init.ts -- no more unhandled rejections or blank screens when server unreachable
- ConnectionBanner shows VPN-specific guidance ("check Tailscale VPN") on native, generic message on web
- 8 new tests across two test files (5 in websocket-init, 3 in ConnectionBanner)
- Device validation checklist with 10 sections covering all v2.1 requirements (keyboard, touch, haptics, motion, bundled assets, full flow)

## Task Commits

Each task was committed atomically:

1. **Task 1: Auth error handling + native messaging** - `e9a8590` (feat) -- TDD: RED then GREEN
2. **Task 2: DEVICE-VALIDATION-CHECKLIST.md** - `64787d5` (docs)

## Files Created/Modified
- `src/src/lib/websocket-init.ts` -- Added IS_NATIVE import, try/catch around bootstrapAuth()+connect(), platform-aware error messages
- `src/src/lib/websocket-init.test.ts` -- Updated propagates-errors test, added 5 new auth-failure-handling tests, added platform mock
- `src/src/components/shared/ConnectionBanner.tsx` -- Added IS_NATIVE import, conditional VPN-specific message in disconnected-without-error branch
- `src/src/components/shared/ConnectionBanner.test.tsx` -- Added IS_NATIVE mock, haptics mock, 3 new native-messaging tests
- `.planning/phases/63-bundled-assets-device-validation/DEVICE-VALIDATION-CHECKLIST.md` -- 104-line comprehensive checklist for on-device UAT

## Decisions Made
- Web-mode auth failure message is "Unable to connect to server" (generic); native-mode is "Server unreachable -- check Tailscale VPN connection" (actionable)
- Updated existing 'propagates bootstrapAuth errors' test to match new caught behavior (was expecting rejection, now expects resolution with error state)
- Both setProviderError AND updateProviderStatus called in catch block to ensure ConnectionBanner renders the error banner

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None -- no external service configuration required.

## Known Stubs
None -- all code is complete and functional.

## Next Phase Readiness
- Phase 63 Plan 02 is the final plan of Phase 63 and the v2.1 milestone
- All code changes testable on Linux; on-device validation requires Mac + Xcode + iPhone
- DEVICE-VALIDATION-CHECKLIST.md ready for manual UAT testing
- 1485 tests passing across 141 test files

---
*Phase: 63-bundled-assets-device-validation*
*Completed: 2026-03-28*
