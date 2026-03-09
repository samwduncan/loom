# Roadmap: Loom V2

## Milestones

- ✅ **v1.0 "The Skeleton"** — Phases 1-10 (shipped 2026-03-07)
- ✅ **v1.1 "The Chat"** — Phases 11-19 (shipped 2026-03-09)
- 📋 **v1.2 "The Polish"** — Phases 20+ (planned)

## Phases

<details>
<summary>✅ v1.0 "The Skeleton" (Phases 1-10) — SHIPPED 2026-03-07</summary>

- [x] Phase 1: Design Token System (3/3 plans) — completed 2026-03-05
- [x] Phase 2: Enforcement + Testing Infrastructure (3/3 plans) — completed 2026-03-05
- [x] Phase 3: App Shell + Error Boundaries (2/2 plans) — completed 2026-03-05
- [x] Phase 4: State Architecture (2/2 plans) — completed 2026-03-05
- [x] Phase 5: WebSocket Bridge + Stream Multiplexer (2/2 plans) — completed 2026-03-06
- [x] Phase 6: Streaming Engine + Scroll Anchor (2/2 plans) — completed 2026-03-06
- [x] Phase 7: Tool Registry + Proof of Life (2/2 plans) — completed 2026-03-06
- [x] Phase 8: Navigation + Session Management (2/2 plans) — completed 2026-03-06
- [x] Phase 9: E2E Integration Wiring + Playwright Verification (2/2 plans) — completed 2026-03-06
- [x] Phase 10: Pre-Archive Cleanup (1/1 plan) — completed 2026-03-07

</details>

<details>
<summary>✅ v1.1 "The Chat" (Phases 11-19) — SHIPPED 2026-03-09</summary>

- [x] Phase 11: Markdown + Code Blocks + UI Primitives (3/3 plans) — completed 2026-03-07
- [x] Phase 12: Streaming Markdown + Marker Interleaving (3/3 plans) — completed 2026-03-07
- [x] Phase 13: Composer (3/3 plans) — completed 2026-03-07
- [x] Phase 14: Message Types (3/3 plans) — completed 2026-03-07
- [x] Phase 15: Tool Card Shell + State Machine (2/2 plans) — completed 2026-03-07
- [x] Phase 16: Per-Tool Cards (3/3 plans) — completed 2026-03-08
- [x] Phase 17: Tool Grouping + Permissions (3/3 plans) — completed 2026-03-08
- [x] Phase 18: Activity, Scroll, Polish (3/3 plans) — completed 2026-03-08
- [x] Phase 19: Visual Effects + Enhancements (3/3 plans) — completed 2026-03-09

</details>

## Progress

| Phase | Milestone | Plans | Status | Completed |
|-------|-----------|-------|--------|-----------|
| 1-10 | v1.0 | 21/21 | Complete | 2026-03-07 |
| 11-19 | v1.1 | 26/26 | Complete | 2026-03-09 |

## Backlog (Future Milestones)

- **Subagent Monitoring Panel** — When Claude spawns subagents (Agent tool), show active subagents in a panel/overlay. Click to view a subagent's real-time conversation stream. Requires backend multiplexing of child process output through parent WebSocket. Inspired by [claude-esp](https://github.com/phiat/claude-esp). (M4/M5 scope — needs backend `claude-sdk.js` changes to expose child process streams.)

---
*Created: 2026-03-07*
*Last updated: 2026-03-09 after v1.1 milestone completion*
