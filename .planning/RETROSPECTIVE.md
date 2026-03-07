# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — The Skeleton

**Shipped:** 2026-03-07
**Phases:** 10 | **Plans:** 21

### What Was Built
- Complete OKLCH design token system with 9 custom ESLint enforcement rules
- 4 Zustand stores with full TypeScript interfaces designed for M1-M5
- WebSocket bridge with stream multiplexer (thinking/content/tool channels)
- 60fps streaming engine via useRef + rAF DOM mutation (zero React re-renders)
- Pluggable tool-call registry with 6 built-in tools
- Sidebar navigation with session switching, URL sync, and message loading
- Playwright E2E test suite verifying all integration points
- 14,423 LOC across 145 commits in 3 days

### What Worked
- **Strict dependency chain** — building tokens -> enforcement -> shell -> state -> WS -> streaming -> tools -> navigation prevented foundation rot that killed V1
- **Constitution enforcement from commit #1** — 9 ESLint rules caught issues immediately, zero violations accumulated
- **Milestone audit before integration phase** — audit at Phase 8 caught INT-01 (WebSocket not wired) and INT-02 (navigation broken), which Phase 9 fixed. Without the audit, we'd have shipped broken integration.
- **Pure function multiplexer** — zero store/React imports made it trivially testable
- **Wave-based parallelization** — independent plans executed in parallel within phases
- **YOLO mode** — eliminated confirmation overhead for a solo developer who knows the codebase

### What Was Inefficient
- **Phase 7 plan 02 took 49 minutes** — the proof-of-life page required debugging real WebSocket connections, `crypto.randomUUID()` HTTPS requirement, and SDK `--resume` behavior. Research phase didn't surface these.
- **Phase 9 plan 02 took 35 minutes** — Playwright E2E tests against real backend are inherently slow and flaky (model-dependent responses, WebSocket timing)
- **Summaries lack one_liner field** — summary extraction at milestone completion had to fall back to manual composition

### Patterns Established
- **Callback injection for infrastructure** — WebSocket client uses `configure()` with callbacks instead of importing stores directly
- **Ref callback + useState for observer targets** — ensures IntersectionObserver setup fires on DOM attachment
- **Module-level singletons for shared data** — project name resolution avoids redundant API fetches
- **Adjust-during-render pattern** — React 19 ESLint rule for set-state-in-effect requires state updates during render instead of useEffect
- **EMPTY_MESSAGES constant** — Zustand v5 selectors need stable references to prevent infinite re-renders
- **Predicate-based WebSocket detection in Playwright** — distinguish app WS from Vite HMR WS

### Key Lessons
1. **useLayoutEffect for scroll-to-bottom** — useEffect + setTimeout creates visible flicker; useLayoutEffect fires synchronously after DOM commit with accurate scrollHeight
2. **Backend JSONL format is not what you expect** — entries have `type: user/assistant` (not `message`), multiple assistant entries share the same message.id per API turn, and pure `tool_result` entries have `role: user` but aren't real user messages
3. **Zustand persist rehydrates without messages** — sessions come back with empty arrays; useSessionSwitch must create stub sessions before fetching
4. **Integration gaps hide behind passing unit tests** — unit tests for WebSocket client, multiplexer, and ChatView all passed individually, but initializeWebSocket() was never called from the production route. Milestone audit caught this.
5. **React 19 ESLint rules change common patterns** — ref callbacks in render bodies, set-state-in-effect, and exhaustive deps enforcement require different approaches than React 18

### Cost Observations
- Model mix: ~80% Opus, ~15% Sonnet (subagents), ~5% Haiku (subagents)
- Total execution time: ~2.4 hours across 21 plans
- Notable: Fine granularity (3-5 tasks per plan) kept individual plan execution fast (avg 7 min), with outliers only on integration/E2E plans

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 | 10 | 21 | Strict dependency chain + automated enforcement from commit #1 |

### Cumulative Quality

| Milestone | Tests | LOC | Commits |
|-----------|-------|-----|---------|
| v1.0 | 359+ | 14,423 | 145 |

### Top Lessons (Verified Across Milestones)

1. Automated enforcement prevents quality rot — 9 ESLint rules caught every banned pattern before accumulation
2. Integration audits catch what unit tests miss — mandatory milestone audit before archival
