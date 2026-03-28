---
gsd_state_version: 1.0
milestone: v2.1
milestone_name: "The Mobile"
status: Phase complete — ready for verification
stopped_at: Completed 60-02-PLAN.md
last_updated: "2026-03-28T02:36:25.464Z"
progress:
  total_phases: 5
  completed_phases: 2
  total_plans: 5
  completed_plans: 5
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-27)

**Core value:** Make AI agent work visible, beautiful, and controllable
**Current focus:** Phase 60 — Keyboard & Composer

## Current Position

Phase: 60 (Keyboard & Composer) — EXECUTING
Plan: 2 of 2

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: --
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

*Updated after each plan completion*
| Phase 59 P01 | 3min | 2 tasks | 3 files |
| Phase 59 P03 | 3min | 2 tasks | 3 files |
| Phase 59 P02 | 3min | 2 tasks | 3 files |
| Phase 60 P01 | 3min | 2 tasks | 5 files |
| Phase 60 P02 | 4min | 2 tasks | 4 files |

## Accumulated Context

### Decisions

- [v2.0] Capacitor 7.6.1 over 8.x -- Xcode 16+ vs 26+ requirement
- [v2.0] API base URL abstraction is highest-value Capacitor prep
- [v2.0] Keyboard avoidance via visualViewport hack -- works but fragile, replace with Capacitor Keyboard plugin in v2.1
- [v2.0] CSS --keyboard-offset pattern is correct -- needs better signal source
- [v2.0] Three-tier proxy: Tailscale Serve :5443 -> nginx :5580 -> Express :5555
- [v2.1] platform.ts with IS_NATIVE/API_BASE/WS_BASE -- single source of truth for URL construction
- [v2.1] native-plugins.ts for dynamic plugin init before React mounts -- matches initializeWebSocket() pattern
- [v2.1] CSS-first motion strategy -- rAF capped at 60fps in WKWebView, but CSS transitions run at 120Hz
- [v2.1] Platform checks only in platform.ts and native-plugins.ts -- UI components remain platform-unaware
- [Phase 59]: Runtime detection via window.Capacitor global -- no @capacitor/core dependency
- [Phase 59]: Empty-string API_BASE in web mode -- zero behavioral change for existing fetch calls
- [Phase 59]: fetchAnon separate from apiFetch -- auth bootstrap has no token yet
- [Phase 59]: Function-based CORS origin with debug logging for rejected origins
- [Phase 59]: Both connect() and reconnect() in websocket-client.ts migrated to resolveWsUrl (Pitfall 1 addressed)
- [Phase 59]: No test modifications needed for fetch migration -- web mode resolveApiUrl returns paths unchanged
- [Phase 59]: apiFetch replaces manual getToken + header injection pattern in hooks -- simpler, auto-handles auth and JSON parsing
- [Phase 60]: @capacitor/keyboard as devDep with dynamic import behind IS_NATIVE guard -- zero web bundle impact
- [Phase 60]: data-native attribute on <html> for CSS-only native vs web branching
- [Phase 60]: useKeyboardOffset hook: useEffect with nativePluginsReady await + cancelled flag for async safety
- [Phase 60]: CSS max(env(safe-area-inset-bottom), var(--keyboard-offset)) prevents double-padding on notched devices

### Pending Todos

None.

### Blockers/Concerns

- Mac with Xcode required for on-device builds (Phase 63) -- swd has iPhone 16 Pro Max but Linux dev machine
- 120Hz ProMotion spring tuning needs real device to feel right (Phase 62)
- CapacitorHttp must be disabled -- patches global fetch and breaks WebSocket upgrade

## Session Continuity

Last session: 2026-03-28T02:36:25.462Z
Stopped at: Completed 60-02-PLAN.md
Resume: `/gsd:plan-phase 59`
