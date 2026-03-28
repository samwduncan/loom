---
phase: 63-bundled-assets-device-validation
plan: 01
subsystem: infra
tags: [vite, capacitor, ios, build-pipeline, bundled-assets]

# Dependency graph
requires:
  - phase: 59-capacitor-platform-foundation
    provides: Capacitor config, platform.ts URL abstraction
provides:
  - Relative asset paths in Vite production build (base: './')
  - White flash prevention via inline background-color
  - cap-build.sh iOS build-validate-sync pipeline
affects: [63-02, ios-deployment, capacitor-bundled-mode]

# Tech tracking
tech-stack:
  added: []
  patterns: [vite-relative-base-for-capacitor, inline-bg-flash-prevention, ios-build-script]

key-files:
  created: [scripts/cap-build.sh]
  modified: [src/vite.config.ts, src/index.html]

key-decisions:
  - "base: './' affects only production build output, not dev server HMR"
  - "Inline #2b2521 on both html and body elements for complete flash coverage"
  - "cap-build.sh is separate from deploy.sh -- different output dirs, no service restart"
  - "MIN_ASSET_COUNT=20 for iOS (lower than deploy.sh's 50 since no public/ copy step)"

patterns-established:
  - "Vite relative base: base './' in config for file:// and capacitor:// scheme compatibility"
  - "iOS build pipeline: separate script from web deploy, targets src/dist/ not repo root dist/"

requirements-completed: [BUNDLE-01, BUNDLE-02, BUNDLE-04]

# Metrics
duration: 3min
completed: 2026-03-28
---

# Phase 63 Plan 01: Bundled Assets Build Config Summary

**Vite relative base path for Capacitor file:// loading, white flash prevention, and cap-build.sh iOS pipeline**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-28T06:35:59Z
- **Completed:** 2026-03-28T06:39:04Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Vite production build now outputs relative asset paths (./assets/) for Capacitor bundled mode
- Font URLs in built CSS use relative paths (../fonts/) instead of absolute (/fonts/)
- index.html inline dark background prevents white flash between splash screen and CSS paint
- cap-build.sh automates the full iOS build pipeline: install, typecheck, build, validate, cap sync

## Task Commits

Each task was committed atomically:

1. **Task 1: Set Vite base path and add inline background-color** - `a919b9e` (feat)
2. **Task 2: Create cap-build.sh iOS build pipeline script** - `e553310` (feat)

## Files Created/Modified
- `src/vite.config.ts` - Added `base: './'` for relative asset paths in production build
- `src/index.html` - Added inline `background-color:#2b2521` on html and body elements
- `scripts/cap-build.sh` - iOS build pipeline: npm ci, tsc, vite build, validate, cap sync ios

## Decisions Made
- `base: './'` only affects production build -- dev server HMR continues using absolute `/src/main.tsx` path
- Inline background on BOTH html and body tags for complete coverage during CSS loading gap
- cap-build.sh is completely independent from deploy.sh -- different output directory (src/dist/ vs repo root dist/), no service restart, no public/ asset copy
- Asset count threshold set to 20 for iOS builds (deploy.sh uses 50, but iOS doesn't include copied public/ assets)
- Added relative path validation step in cap-build.sh to catch misconfigured base path

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- 2 pre-existing test failures in `websocket-init.test.ts` from another parallel agent's changes -- not related to this plan's changes (base path and background color). Verified by running tests on clean main branch where they pass.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Vite build produces Capacitor-compatible relative paths
- cap-build.sh ready for use on macOS with Xcode
- Plan 02 (device validation) can verify the build output on-device

## Self-Check: PASSED

- All 3 files exist (vite.config.ts, index.html, cap-build.sh)
- Both commits verified (a919b9e, e553310)
- Content verification: base path, bg-color, executable all confirmed

---
*Phase: 63-bundled-assets-device-validation*
*Completed: 2026-03-28*
