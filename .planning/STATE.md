---
gsd_state_version: 1.0
milestone: v3.1
milestone_name: "The App (Rebuilt)"
status: Defining requirements
stopped_at: Milestone v3.1 started — defining requirements and roadmap
last_updated: "2026-04-03T17:00:00.000Z"
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-03)

**Core value:** Make AI agent work visible, beautiful, and controllable
**Current focus:** Defining requirements for v3.1

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-04-03 — Milestone v3.1 started

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: —
- Total execution time: —

## Accumulated Context

### Decisions

- [v3.0] Capacitor/WKWebView abandoned -- 5/7 critical iOS bugs architecturally unfixable
- [v3.0] React Native + Expo SDK 54 for iOS -- native gestures, keyboard, scroll
- [v3.0] Web app continues as desktop experience -- no changes to existing web codebase
- [v3.0] Design-first approach -- pixel-level ChatGPT/Claude iOS analysis before RN code
- [v3.0] Bard leads creative exploration, Claude curates and implements
- [v3.0] ~35% code transfers from web: Zustand stores, stream multiplexer, WebSocket client, types
- [v3.0] Phase 69 UI "foundationally flawed" -- built without studying reference implementations
- [v3.1] Council review (Codex + Bard): unanimous "build fresh, use Private Mind as reference"
- [v3.1] Private Mind = read-only reference for patterns (drawer, chat screen, stores, theme)
- [v3.1] Keep: shared/, mobile/lib/, mobile/hooks/, Expo scaffold. Rebuild: mobile/components/, mobile/app/
- [v3.1] 4 phases maximum for this milestone
- [v3.1] FlatList inverted (not legend-list) -- ChatterUI reverted after 8 days in production
- [v3.1] Key libs: react-native-keyboard-controller, zeego, @gorhom/bottom-sheet v5, reanimated 4.1

### Roadmap Evolution

- v2.2 "The Touch" CLOSED 2026-03-30 -- Pivoted to native after 67.1 device testing
- v3.0 "The App" CLOSING -- Phases 68-69 complete, 70-73 superseded by v3.1 rebuild
- v3.1 "The App (Rebuilt)" IN PROGRESS -- Build fresh from Private Mind reference
- v4.0/v5.0 deferred until native app is stable

### Research Flags

- mobile/.planning/research/ — 9 files, 152KB (BARD-PRIME-DEEP-DIVE.md, CLONE-CANDIDATES.md, PATTERNS-PLAYBOOK.md)
- .planning/NATIVE-APP-SOUL.md — Visual contract (springs, surfaces, colors, typography)

### Blockers/Concerns

- Apple Developer enrollment status unknown (submitted payment before Phase 68, may be active now)

## Session Continuity

Last session: 2026-04-03
Stopped at: Milestone v3.1 initialization
Resume: Complete requirements → roadmap → `/gsd:plan-phase [N]`
