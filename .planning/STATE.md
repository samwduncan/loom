---
gsd_state_version: 1.0
milestone: v2.1
milestone_name: "The Mobile"
status: Defining requirements
stopped_at: Milestone started
last_updated: "2026-03-27"
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-27)

**Core value:** Make AI agent work visible, beautiful, and controllable
**Current focus:** Defining requirements for v2.1 "The Mobile"

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-03-27 — Milestone v2.1 started

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

## Accumulated Context

### Decisions

- [v2.0] SQLite cache is freely deletable -- JSONL remains source of truth, cache rebuilds from scratch
- [v2.0] No service worker -- manifest-only PWA to avoid stale content trap
- [v2.0] Zero new production deps -- better-sqlite3 already installed, fs.watch is built-in
- [v2.0] Singleton SessionWatcher with clientAttachments Map for multi-client subscriptions
- [v2.0] Client-side regex heuristics for follow-up suggestions
- [v2.0] Capacitor 7.6.1 over 8.x -- Xcode 16+ vs 26+ requirement
- [v2.0] API base URL abstraction is highest-value Capacitor prep
- [v2.0] Three-tier proxy: Tailscale Serve :5443 -> nginx :5580 -> Express :5555
- [v2.0] Deploy pipeline: dirty check -> pull -> npm ci -> tsc -> vite build -> validate -> restart
- [v2.0] Keyboard avoidance via visualViewport hack — works but fragile, replace with Capacitor Keyboard plugin in v2.1
- [v2.0] CSS --keyboard-offset pattern is correct — needs better signal source

### Pending Todos

None.

### Blockers/Concerns

- Mac with Xcode required for on-device builds — swd has iPhone 16 Pro Max but Linux dev machine
- Capacitor Keyboard plugin needs device testing for keyboard height accuracy
- 120Hz ProMotion spring tuning needs real device to feel right

## Session Continuity

Last session: 2026-03-27
Stopped at: Milestone v2.1 started — defining requirements
Resume: Continue with requirements definition
