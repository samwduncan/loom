# Roadmap: Loom V2

## Milestones

- ✅ **v1.0 "The Skeleton"** -- Phases 1-10 (shipped 2026-03-07)
- ✅ **v1.1 "The Chat"** -- Phases 11-19 (shipped 2026-03-09)
- ✅ **v1.2 "The Workspace"** -- Phases 20-27 (shipped 2026-03-12)
- ✅ **v1.3 "The Refinery"** -- Phases 28-37 (shipped 2026-03-17)
- 📋 **v1.4 "The Polish"** -- (planned)
- 📋 **v2.0 "The Power"** -- (planned)
- 📋 **v3.0 "The Vision"** -- (planned)

## Phases

<details>
<summary>✅ v1.0 "The Skeleton" (Phases 1-10) -- SHIPPED 2026-03-07</summary>

- [x] Phase 1: Design Token System (3/3 plans) -- completed 2026-03-05
- [x] Phase 2: Enforcement + Testing Infrastructure (3/3 plans) -- completed 2026-03-05
- [x] Phase 3: App Shell + Error Boundaries (2/2 plans) -- completed 2026-03-05
- [x] Phase 4: State Architecture (2/2 plans) -- completed 2026-03-05
- [x] Phase 5: WebSocket Bridge + Stream Multiplexer (2/2 plans) -- completed 2026-03-06
- [x] Phase 6: Streaming Engine + Scroll Anchor (2/2 plans) -- completed 2026-03-06
- [x] Phase 7: Tool Registry + Proof of Life (2/2 plans) -- completed 2026-03-06
- [x] Phase 8: Navigation + Session Management (2/2 plans) -- completed 2026-03-06
- [x] Phase 9: E2E Integration Wiring + Playwright Verification (2/2 plans) -- completed 2026-03-06
- [x] Phase 10: Pre-Archive Cleanup (1/1 plan) -- completed 2026-03-07

</details>

<details>
<summary>✅ v1.1 "The Chat" (Phases 11-19) -- SHIPPED 2026-03-09</summary>

- [x] Phase 11: Markdown + Code Blocks + UI Primitives (3/3 plans) -- completed 2026-03-07
- [x] Phase 12: Streaming Markdown + Marker Interleaving (3/3 plans) -- completed 2026-03-07
- [x] Phase 13: Composer (3/3 plans) -- completed 2026-03-07
- [x] Phase 14: Message Types (3/3 plans) -- completed 2026-03-07
- [x] Phase 15: Tool Card Shell + State Machine (2/2 plans) -- completed 2026-03-07
- [x] Phase 16: Per-Tool Cards (3/3 plans) -- completed 2026-03-08
- [x] Phase 17: Tool Grouping + Permissions (3/3 plans) -- completed 2026-03-08
- [x] Phase 18: Activity, Scroll, Polish (3/3 plans) -- completed 2026-03-08
- [x] Phase 19: Visual Effects + Enhancements (3/3 plans) -- completed 2026-03-09

</details>

<details>
<summary>✅ v1.2 "The Workspace" (Phases 20-27) -- SHIPPED 2026-03-12</summary>

- [x] Phase 20: Content Layout + Tab System (2/2 plans) -- completed 2026-03-10
- [x] Phase 21: Settings Panel (3/3 plans) -- completed 2026-03-10
- [x] Phase 22: Command Palette (2/2 plans) -- completed 2026-03-10
- [x] Phase 23: File Tree + File Store (3/3 plans) -- completed 2026-03-10
- [x] Phase 24: Code Editor (3/3 plans) -- completed 2026-03-11
- [x] Phase 25: Terminal (2/2 plans) -- completed 2026-03-11
- [x] Phase 26: Git Panel + Navigation (4/4 plans) -- completed 2026-03-11
- [x] Phase 27: Cross-Phase Integration Wiring (1/1 plan) -- completed 2026-03-12

</details>

<details>
<summary>✅ v1.3 "The Refinery" (Phases 28-37) -- SHIPPED 2026-03-17</summary>

- [x] Phase 28: Error & Connection Resilience (2/2 plans) -- completed 2026-03-12
- [x] Phase 29: Session Hardening (2/2 plans) -- completed 2026-03-13
- [x] Phase 30: File Tree Git Integration (1/1 plan) -- completed 2026-03-13
- [x] Phase 31: Editor & Tool Enhancements (2/2 plans) -- completed 2026-03-16
- [x] Phase 32: File Mentions (2/2 plans) -- completed 2026-03-16
- [x] Phase 33: Slash Commands (2/2 plans) -- completed 2026-03-17
- [x] Phase 34: Conversation UX (2/2 plans) -- completed 2026-03-17
- [x] Phase 35: Quick Settings (2/2 plans) -- completed 2026-03-17
- [x] Phase 36: Accessibility (3/3 plans) -- completed 2026-03-17
- [x] Phase 37: Performance (2/2 plans) -- completed 2026-03-17

</details>

### v1.4 "The Polish" (Planned)

- [ ] Spring physics animations on all interactions
- [ ] Aurora/ambient WebGL overlay during streaming (GPU feasibility gated)
- [ ] Glass surface effects for modals and overlays
- [ ] Sidebar slim collapse mode (icon-only rail)
- [ ] DecryptedText reveals for session titles and model names
- [ ] StarBorder accents on focused/active elements
- [ ] Motion refinement across all surfaces

### v2.0 "The Power" (Planned)

- [ ] Multi-provider tabbed workspaces (Claude, Gemini, Codex)
- [ ] MCP server management UI
- [ ] Plugin/skill management UI

### v3.0 "The Vision" (Planned)

- [ ] GSD visual dashboard
- [ ] Nextcloud integration
- [ ] Companion system (conditional on feasibility)
- [ ] CodeRabbit integration

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-10 | v1.0 | 21/21 | Complete | 2026-03-07 |
| 11-19 | v1.1 | 26/26 | Complete | 2026-03-09 |
| 20-27 | v1.2 | 20/20 | Complete | 2026-03-12 |
| 28-37 | v1.3 | 20/20 | Complete | 2026-03-17 |

## Backlog (Future Milestones)

- **Subagent Monitoring Panel** -- When Claude spawns subagents (Agent tool), show active subagents in a panel/overlay. Click to view a subagent's real-time conversation stream. Requires backend multiplexing of child process output through parent WebSocket. Inspired by [claude-esp](https://github.com/phiat/claude-esp). (v2.0/v3.0 scope -- needs backend `claude-sdk.js` changes to expose child process streams.)

---
*Created: 2026-03-07*
*Last updated: 2026-03-17 after v1.3 milestone completion*
