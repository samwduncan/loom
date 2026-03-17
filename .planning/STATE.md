---
gsd_state_version: 1.0
milestone: v1.3
milestone_name: "The Refinery"
status: completed
stopped_at: Completed 34-02-PLAN.md
last_updated: "2026-03-17T01:31:57.522Z"
last_activity: 2026-03-17 -- Completed 34-02-PLAN.md (token usage footers + JSONL result extraction)
progress:
  total_phases: 10
  completed_phases: 7
  total_plans: 13
  completed_plans: 13
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-12)

**Core value:** Make AI agent work visible, beautiful, and controllable
**Current focus:** Phase 34 - Conversation UX

## Current Position

Phase: 34 of 37 (Conversation UX) -- COMPLETE
Plan: 2 of 2 (all plans complete)
Status: Phase 34 complete -- token usage footers with JSONL result extraction + expandable detail
Last activity: 2026-03-17 -- Completed 34-02-PLAN.md (token usage footers + JSONL result extraction)

Progress: [██████████] 100%

## Performance Metrics

**Velocity:**
- M1: 21 plans in 3 days (7 plans/day)
- M2: 26 plans in 3 days (8.7 plans/day)
- M3: 20 plans in 3 days (6.7 plans/day)
- Total: 67 plans in 8 days (8.4 plans/day)

## Accumulated Context

### Decisions

- Split original M4 "The Polish" into v1.3 "The Refinery" (daily-driver) + v1.4 "The Polish" (visual effects)
- Daily-driver work comes first to enable real usage feedback before visual polish decisions
- Foundational fixes (error, session) prioritized before feature additions (composer, UX)
- A11y and perf are cross-cutting -- scheduled last so they audit ALL new features
- Used tryReconnect() on WebSocketClient instead of re-bootstrapping auth for manual reconnect
- Connection banner uses fixed positioning with z-toast to overlay entire app shell

See PROJECT.md Key Decisions table for full history.
- [Phase 28]: Used tryReconnect() on WebSocketClient for manual reconnect button
- [Phase 28]: Defensive null-out of old WS handlers before reconnect to prevent ghost callbacks
- [Phase 28]: useNavigateAwayGuard uses beforeunload + Zustand isStreaming selector
- [Phase 29]: Streaming dot takes visual priority over draft dot when both active
- [Phase 29]: onActiveSessions clears stale streaming state on reconnect
- [Phase 29]: Draft key migration from stub to real ID is best-effort (silent failure)
- [Phase 29]: Consolidated pagination state into single useState object with trackedSessionId for render-time reset pattern
- [Phase 30]: Used data-status attribute + CSS for git status dot coloring (no inline styles)
- [Phase 30]: Directory aggregation uses numeric priority map for O(1) comparison
- [Phase 30]: Used data-status attribute + CSS for git status dot coloring
- [Phase 31]: Module-level minimap constant with showMinimap.compute facet for conditional display (50+ lines)
- [Phase 31]: Used useUIStore selector pattern (not getState()) for store actions in tool card components
- [Phase 31]: rAF delay + 500ms retry for sendToShell after tab switch to handle CSS show/hide panel mount timing
- [Phase 32]: Derived isLoading from fetchDone boolean to satisfy React 19 set-state-in-effect lint rule
- [Phase 32]: Guard scrollIntoView with typeof check for jsdom compatibility in tests
- [Phase 32]: Mock useFileMentions in ChatComposer tests for controlled integration testing
- [Phase 32]: Prepend file references as text prefix until backend fileMentions option is supported
- [Phase 33]: Corrected plan test: /cl filters to clear only (not compact) since includes matching on id is correct
- [Phase 33]: Slash picker keyboard handling runs BEFORE mention picker to take priority when open
- [Phase 33]: Both slash and mention detection run on every onChange -- mutually exclusive by design
- [Phase 34]: useEffect (not render-time) for ref updates to satisfy react-hooks/refs ESLint rule
- [Phase 34]: Capture refs inside useEffect cleanup to satisfy exhaustive-deps for ref cleanup patterns
- [Phase 34]: Second-pass result entry extraction over original entries array (not chatEntries) for token data
- [Phase 34]: seenAssistantApiIds Set to track merged assistant entries in second pass index mapping
- [Phase 34]: Nullish coalescing in JSX instead of non-null assertions (custom lint rule incompatible with JSX comments)

### Pending Todos

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-03-17T01:31:57.520Z
Stopped at: Completed 34-02-PLAN.md
Resume: Phase 34 complete. Phase 35 (Accessibility) next.
