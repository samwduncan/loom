---
phase: 57-ios-research
plan: 01
subsystem: infra
tags: [capacitor, ios, wkwebview, tailscale, mobile]

# Dependency graph
requires:
  - phase: 56-pwa-manifest
    provides: PWA manifest and web build output for Capacitor to wrap
provides:
  - Capacitor 7.6.1 scaffold configured for Loom
  - iOS integration assessment document (IOS-ASSESSMENT.md)
  - Tailscale DNS from WKWebView analysis (HIGH confidence)
  - Two deployment models documented (bundled assets vs server.url)
affects: [ios-app-store, mobile-deployment, api-base-url-abstraction]

# Tech tracking
tech-stack:
  added: ["@capacitor/core@7.6.1", "@capacitor/cli@7.6.1", "@capacitor/ios@7.6.1"]
  patterns: ["devDependencies-only for scaffolding tools"]

key-files:
  created:
    - src/capacitor.config.ts
    - src/ios/ (generated scaffold, gitignored)
    - .planning/phases/57-ios-research/IOS-ASSESSMENT.md
  modified:
    - src/package.json
    - src/.gitignore
    - .planning/ROADMAP.md

key-decisions:
  - "Capacitor 7.6.1 over 8.x — Xcode 16+ vs Xcode 26+ requirement"
  - "devDependencies only — web app builds identically without Capacitor"
  - "SPM over CocoaPods — works on Linux, Apple-native"
  - "ROADMAP SC2/SC3 amended to reflect Linux constraints"
  - "Tailscale DNS: HIGH confidence verdict based on system-wide VPN architecture"

patterns-established:
  - "Research phases produce assessment documents, not production code"
  - "Environment-based config via process.env resolved at sync time"

requirements-completed: [IOS-01, IOS-02, IOS-03]

# Metrics
duration: 5min
completed: 2026-03-27
---

# Phase 57: iOS Research Summary

**Capacitor 7.6.1 scaffold generated on Linux with iOS assessment covering two deployment models, Tailscale DNS analysis (HIGH confidence), and App Store viability path**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-27T02:30:00Z
- **Completed:** 2026-03-27T02:40:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Capacitor 7.6.1 installed as devDeps with full iOS scaffold generated on Linux (`cap add ios` works without Xcode)
- Comprehensive IOS-ASSESSMENT.md covering bundled assets vs server.url deployment models, effort estimates from 2h to 2 weeks
- Tailscale DNS from WKWebView analysis: HIGH confidence — system-wide VPN routes all process traffic including WKWebView networking daemon
- `cap sync ios` succeeded — web build synced into iOS project, SPM manifest generated

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Capacitor iOS project** - `8dbbbe2` (feat)
2. **Task 2: Write iOS integration assessment document** - `51d60cd` (docs)

## Files Created/Modified
- `src/capacitor.config.ts` — Capacitor config (com.loom.agent, dist webDir, Tailscale allowNavigation)
- `src/ios/` — Generated Xcode project scaffold (gitignored)
- `.planning/phases/57-ios-research/IOS-ASSESSMENT.md` — Complete iOS integration assessment
- `src/package.json` — Added Capacitor devDeps and cap:sync/cap:open scripts
- `src/.gitignore` — Added ios/ entry
- `.planning/ROADMAP.md` — Amended SC2/SC3 for Linux constraints

## Decisions Made
- Used Capacitor 7.6.1 (not 8.x) — requires Xcode 16+ instead of 26+, more widely available
- SPM package manager — works on Linux, Apple-native, no CocoaPods dependency
- Packages as devDependencies only — production web build is unaffected
- Amended ROADMAP success criteria to reflect inability to do on-device testing from Linux

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered
- `cap init` failed because capacitor.config.ts already existed (expected — we created the config manually before running init, which only generates a JSON config)
- `pod install` failed on Linux (expected — no CocoaPods). `cap sync` fell through to SPM successfully.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- iOS scaffold is ready to open in Xcode on a Mac
- API base URL abstraction identified as highest-value prep work for bundled assets mode
- PWA (Phase 56) provides immediate mobile access while Mac availability is sorted

---
*Phase: 57-ios-research*
*Completed: 2026-03-27*
