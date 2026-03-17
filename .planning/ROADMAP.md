# Roadmap: Loom V2

## Milestones

- ✅ **v1.0 "The Skeleton"** -- Phases 1-10 (shipped 2026-03-07)
- ✅ **v1.1 "The Chat"** -- Phases 11-19 (shipped 2026-03-09)
- ✅ **v1.2 "The Workspace"** -- Phases 20-27 (shipped 2026-03-12)
- ✅ **v1.3 "The Refinery"** -- Phases 28-37 (shipped 2026-03-17)
- 🚧 **v1.4 "The Navigator"** -- Phases 38-43 (in progress)
- 📋 **v1.5 "The Polish"** -- (planned)
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

### v1.4 "The Navigator" (In Progress)

**Milestone Goal:** Fix every broken feature, make sessions findable and manageable, and verify everything works end-to-end with real daily use.

- [x] **Phase 38: Broken Fixes & Persist Audit** - Fix @-mentions, search highlighting, dead code removal, and audit all Zustand persist layers (completed 2026-03-17)
- [x] **Phase 39: Backend Hardening** - Auth resilience, session title endpoint, systemd service, WebSocket heartbeat (completed 2026-03-17)
- [ ] **Phase 40: Session Titles & Rename** - Auto-generated titles from first real message, frontend rename persistence via backend endpoint
- [ ] **Phase 41: Session Organization** - Project-based sidebar grouping with date subgroups and junk session filtering
- [ ] **Phase 42: Session Discovery** - Sidebar search, session pinning, and bulk delete
- [ ] **Phase 43: E2E Verification** - End-to-end verification of all M1-M4 features with real backend

## Phase Details

### Phase 38: Broken Fixes & Persist Audit
**Goal**: Every known broken feature works correctly and all Zustand stores rehydrate without data corruption
**Depends on**: Nothing (independent fixes)
**Requirements**: FIX-01, FIX-02, FIX-03, FIX-04, PERS-01, PERS-02
**Success Criteria** (what must be TRUE):
  1. Typing @filename in the composer sends file content to the AI via WebSocket fileMentions field, and the AI response acknowledges the file content
  2. Searching for a term highlights matches inside assistant message markdown bodies (not just user messages and thinking blocks)
  3. rehypeToolMarkers plugin file and all imports are completely removed from the codebase
  4. Clearing localStorage and reloading does not produce NaN values or broken UI in any store's rehydrated state
**Plans**: 2 plans

Plans:
- [ ] 38-01-PLAN.md -- Fix @-mention file delivery, search highlighting, dead code removal
- [ ] 38-02-PLAN.md -- Persist layer audit and NaN fix verification

### Phase 39: Backend Hardening
**Goal**: Backend is resilient, self-recovering, and provides the infrastructure needed for session management features
**Depends on**: Nothing (independent infrastructure)
**Requirements**: BACK-01, BACK-02, BACK-03, BACK-04
**Success Criteria** (what must be TRUE):
  1. If the backend restarts or the auth DB is reset, the frontend automatically re-authenticates without requiring a manual page refresh
  2. PATCH /api/projects/:name/sessions/:id endpoint accepts a title field and persists it as a summary entry in the session JSONL file
  3. Backend runs as a systemd service (or pm2 process) that auto-starts on boot and auto-restarts on crash
  4. WebSocket connection sends periodic ping/pong keepalive frames, and the frontend detects silent disconnects within 30 seconds
**Plans**: 2 plans

Plans:
- [ ] 39-01-PLAN.md -- Auth auto-retry on 401 and WebSocket ping/pong heartbeat
- [ ] 39-02-PLAN.md -- Session title PATCH endpoint and systemd service

### Phase 40: Session Titles & Rename
**Goal**: Every session has a meaningful title that persists across browsers and cache clears
**Depends on**: Phase 39 (needs BACK-02 session title endpoint)
**Requirements**: SESS-01, SESS-02, SESS-03
**Success Criteria** (what must be TRUE):
  1. New sessions automatically display a title derived from the first real user message (not "New Session" or system prompt text)
  2. User can rename a session in the sidebar, and the new title persists after clearing browser cache and reloading
  3. Title extraction skips system prompts, XML wrapper tags, task-notification content, and objective blocks
**Plans**: TBD

Plans:
- [ ] 40-01: TBD
- [ ] 40-02: TBD

### Phase 41: Session Organization
**Goal**: Sidebar presents sessions in a structured, navigable hierarchy instead of a flat chronological list
**Depends on**: Phase 40 (needs session titles for meaningful grouping)
**Requirements**: SESS-04, SESS-05, SESS-06
**Success Criteria** (what must be TRUE):
  1. Sessions are grouped under collapsible project headings that show session count, and expanding/collapsing preserves scroll position
  2. Within each project group, sessions are organized into date subgroups (Today, Yesterday, This Week, This Month, Older)
  3. Notification-classifier sessions, system utility sessions, and blank "New Session" entries with no real messages are hidden from the sidebar
**Plans**: TBD

Plans:
- [ ] 41-01: TBD
- [ ] 41-02: TBD

### Phase 42: Session Discovery
**Goal**: Users can quickly find, prioritize, and clean up sessions across all projects
**Depends on**: Phase 41 (needs project grouping structure for pin placement and search context)
**Requirements**: SESS-07, SESS-08, SESS-09
**Success Criteria** (what must be TRUE):
  1. Typing in the sidebar search bar instantly filters sessions by title across all project groups, showing matching results with the search term highlighted
  2. User can pin a session and it appears at the top of its project group, persisting across page reloads
  3. User can select multiple sessions via checkboxes and delete them all in one action with a confirmation dialog
**Plans**: TBD

Plans:
- [ ] 42-01: TBD
- [ ] 42-02: TBD

### Phase 43: E2E Verification
**Goal**: Every feature shipped in M1 through M4 works correctly with a real backend in daily-driver conditions
**Depends on**: Phases 38-42 (all fixes and features must be in place before verification)
**Requirements**: E2E-01, E2E-02, E2E-03, E2E-04, E2E-05, E2E-06, E2E-07, E2E-08, E2E-09, E2E-10, E2E-11
**Success Criteria** (what must be TRUE):
  1. Permission banners appear with countdown timer and Y/N keyboard shortcuts accept/reject correctly
  2. Token usage and cost footers display accurate data on conversation turns
  3. Image paste/drag-drop into composer sends the image and it displays in the conversation
  4. Conversation export produces a valid downloadable file, message retry re-sends the last user message
  5. Git operations (push/pull/fetch, diff view, branch create/switch/delete) all complete successfully with status feedback
**Plans**: TBD

Plans:
- [ ] 43-01: TBD
- [ ] 43-02: TBD

### v1.5 "The Polish" (Planned)

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

**Execution Order:**
Phases execute in numeric order: 38 -> 39 -> 40 -> 41 -> 42 -> 43

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-10 | v1.0 | 21/21 | Complete | 2026-03-07 |
| 11-19 | v1.1 | 26/26 | Complete | 2026-03-09 |
| 20-27 | v1.2 | 20/20 | Complete | 2026-03-12 |
| 28-37 | v1.3 | 20/20 | Complete | 2026-03-17 |
| 38. Broken Fixes & Persist Audit | 2/2 | Complete    | 2026-03-17 | - |
| 39. Backend Hardening | 2/2 | Complete    | 2026-03-17 | - |
| 40. Session Titles & Rename | v1.4 | 0/? | Not started | - |
| 41. Session Organization | v1.4 | 0/? | Not started | - |
| 42. Session Discovery | v1.4 | 0/? | Not started | - |
| 43. E2E Verification | v1.4 | 0/? | Not started | - |

## Backlog (Future Milestones)

- **Subagent Monitoring Panel** -- When Claude spawns subagents (Agent tool), show active subagents in a panel/overlay. Click to view a subagent's real-time conversation stream. Requires backend multiplexing of child process output through parent WebSocket. Inspired by [claude-esp](https://github.com/phiat/claude-esp). (v2.0/v3.0 scope -- needs backend `claude-sdk.js` changes to expose child process streams.)

---
*Created: 2026-03-07*
*Last updated: 2026-03-17 after Phase 39 planning*
