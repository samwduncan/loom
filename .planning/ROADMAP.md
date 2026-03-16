# Roadmap: Loom V2

## Milestones

- ✅ **v1.0 "The Skeleton"** -- Phases 1-10 (shipped 2026-03-07)
- ✅ **v1.1 "The Chat"** -- Phases 11-19 (shipped 2026-03-09)
- ✅ **v1.2 "The Workspace"** -- Phases 20-27 (shipped 2026-03-12)
- 🚧 **v1.3 "The Refinery"** -- Phases 28-37 (in progress)
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

### v1.3 "The Refinery" (In Progress)

**Milestone Goal:** Make Loom a daily-driver by hardening error handling, filling UX gaps, adding composer intelligence, and auditing accessibility and performance.

**Phase Numbering:**
- Integer phases (28, 29, 30...): Planned milestone work
- Decimal phases (28.1, 28.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 28: Error & Connection Resilience** - Crash detection, reconnection overlay, connection status, and navigate-away protection (completed 2026-03-12)
- [x] **Phase 29: Session Hardening** - Paginated history, streaming indicators, and temporary ID lifecycle (completed 2026-03-13)
- [x] **Phase 30: File Tree Git Integration** - Git change indicators on file tree nodes with live updates (completed 2026-03-13)
- [x] **Phase 31: Editor & Tool Enhancements** - Editor minimap and "Run in Terminal" bridge from Bash tool cards (completed 2026-03-16)
- [x] **Phase 32: File Mentions** - @-mention file picker with fuzzy search, inline chips, and context attachments (completed 2026-03-16)
- [ ] **Phase 33: Slash Commands** - /-trigger command menu with keyboard navigation and built-in commands
- [ ] **Phase 34: Conversation UX** - Auto-collapsing old turns and per-turn usage footers
- [ ] **Phase 35: Quick Settings** - Quick settings panel with live-updating behavior toggles
- [ ] **Phase 36: Accessibility** - ARIA roles, keyboard navigation, focus management, screen reader support, and contrast audit
- [ ] **Phase 37: Performance** - FPS profiling, content-visibility stress test, memory leak audit, load time, and bundle analysis

## Phase Details

### Phase 28: Error & Connection Resilience
**Goal**: Users always know the health of their connection and are protected from data loss during failures
**Depends on**: Nothing (first phase of v1.3)
**Requirements**: ERR-01, ERR-02, ERR-03, ERR-04, ERR-05
**Success Criteria** (what must be TRUE):
  1. When the backend crashes or exits, an error banner appears within 3 seconds explaining what happened
  2. When WebSocket drops, a reconnection overlay appears and auto-reconnects with exponential backoff without user action
  3. A persistent connection status indicator shows connected/reconnecting/disconnected state at all times
  4. Attempting to close or navigate away during active streaming shows a browser confirmation dialog
  5. After successful reconnection, the user can continue working without refreshing the page
**Plans**: 2 plans

Plans:
- [ ] 28-01-PLAN.md -- Connection status indicator + error/reconnection banner UI
- [ ] 28-02-PLAN.md -- Navigate-away guard + WebSocket reconnect hardening

### Phase 29: Session Hardening
**Goal**: Users can work with long conversations reliably and see real-time session activity
**Depends on**: Phase 28
**Requirements**: SESS-01, SESS-02, SESS-03
**Success Criteria** (what must be TRUE):
  1. Opening a conversation with 500+ messages loads quickly, with earlier messages loading on demand as the user scrolls up
  2. Sessions with active streaming show a visible pulse/spinner indicator in the sidebar session list
  3. New conversations use a local temporary ID that seamlessly transitions to the backend-assigned ID after first response with no URL break or flash
**Plans**: 2 plans

Plans:
- [ ] 29-01-PLAN.md -- Streaming indicator + stub-to-real session ID hardening
- [ ] 29-02-PLAN.md -- Paginated message history with scroll-up loading

### Phase 30: File Tree Git Integration
**Goal**: Users can see file modification status at a glance without switching to the git panel
**Depends on**: Phase 28
**Requirements**: FTE-01, FTE-02
**Success Criteria** (what must be TRUE):
  1. File tree nodes display colored indicators (modified, added, untracked, deleted) matching standard git color conventions
  2. After committing, staging, or discarding changes in the git panel, file tree indicators update automatically
  3. Directories containing changed files show an aggregate change indicator
**Plans**: 1 plan

Plans:
- [ ] 30-01-PLAN.md -- Git status indicators on file tree nodes with directory aggregation

### Phase 31: Editor & Tool Enhancements
**Goal**: Users can navigate large files with a minimap and execute Bash tool outputs directly in the terminal
**Depends on**: Phase 30
**Requirements**: FTE-03, FTE-04, FTE-05
**Success Criteria** (what must be TRUE):
  1. Code editor shows a minimap in the right gutter for files longer than the viewport
  2. Bash tool cards in the chat display a "Run in Terminal" action button
  3. Clicking "Run in Terminal" switches to the terminal tab and executes the command, with output visible in the terminal
**Plans**: 2 plans

Plans:
- [ ] 31-01-PLAN.md -- CodeMirror minimap extension for large files
- [ ] 31-02-PLAN.md -- Run in Terminal button on Bash tool cards

### Phase 32: File Mentions
**Goal**: Users can reference project files in their messages for precise context
**Depends on**: Phase 29
**Requirements**: COMP-01, COMP-02, COMP-03
**Success Criteria** (what must be TRUE):
  1. Typing @ in the composer opens a file picker popup with fuzzy search across the project
  2. Selecting a file inserts an inline chip that is visually distinct from regular text
  3. Sending a message with file mentions includes those files as context attachments in the API request
  4. File picker is dismissable with Escape and navigable with arrow keys
**Plans**: 2 plans

Plans:
- [ ] 32-01-PLAN.md -- File mention picker popup + useFileMentions hook
- [ ] 32-02-PLAN.md -- Mention chips in composer + wire to send

### Phase 33: Slash Commands
**Goal**: Users can execute common actions quickly via keyboard-driven slash commands
**Depends on**: Phase 29
**Requirements**: COMP-04, COMP-05, COMP-06
**Success Criteria** (what must be TRUE):
  1. Typing / at the start of the composer input opens a command menu
  2. Menu includes at minimum: /clear, /help, /compact, /model
  3. Arrow keys navigate the menu, Enter selects, Escape dismisses
  4. Selected commands execute their action immediately (e.g., /clear clears the conversation)
**Plans**: 2 plans

Plans:
- [ ] 33-01: TBD

### Phase 34: Conversation UX
**Goal**: Long conversations remain readable and users can track AI usage per turn
**Depends on**: Phase 29
**Requirements**: UXR-01, UXR-02, UXR-03, UXR-04
**Success Criteria** (what must be TRUE):
  1. Conversation turns scrolled far above the viewport auto-collapse to a compact summary line
  2. Clicking a collapsed turn or scrolling back to it expands it to full content
  3. Each assistant turn displays token usage (input/output/cache) and estimated cost in a footer
  4. Usage footer is subtle by default and expandable for detail -- it does not dominate the message
**Plans**: 2 plans

Plans:
- [ ] 34-01: TBD
- [ ] 34-02: TBD

### Phase 35: Quick Settings
**Goal**: Users can tune display preferences without opening the full settings modal
**Depends on**: Phase 28
**Requirements**: UXR-05, UXR-06, UXR-07
**Success Criteria** (what must be TRUE):
  1. Quick settings panel is accessible from the sidebar and via keyboard shortcut
  2. Panel includes toggles for: auto-expand tools, show thinking, show raw params
  3. Toggling any setting applies immediately to the current view without page reload
**Plans**: 2 plans

Plans:
- [ ] 35-01: TBD

### Phase 36: Accessibility
**Goal**: Users with assistive technology can operate every feature of Loom
**Depends on**: Phases 28-35 (all feature work complete)
**Requirements**: A11Y-01, A11Y-02, A11Y-03, A11Y-04, A11Y-05, A11Y-06
**Success Criteria** (what must be TRUE):
  1. All interactive elements (buttons, links, inputs, tabs, menus) have correct ARIA roles and accessible labels
  2. A user can navigate between all panels (chat, files, terminal, git, settings) using only the keyboard
  3. Opening a modal traps focus within it; closing restores focus to the trigger element
  4. Screen readers announce streaming start/stop, tool completion events, and error banners via live regions
  5. With prefers-reduced-motion enabled, zero CSS/JS animations play
  6. All text and interactive elements pass WCAG AA contrast ratios (4.5:1 normal text, 3:1 large text)
**Plans**: 2 plans

Plans:
- [ ] 36-01: TBD
- [ ] 36-02: TBD
- [ ] 36-03: TBD

### Phase 37: Performance
**Goal**: Loom runs smoothly under real workload conditions with no regressions
**Depends on**: Phases 28-36 (all features and a11y complete)
**Requirements**: PERF-01, PERF-02, PERF-03, PERF-04, PERF-05
**Success Criteria** (what must be TRUE):
  1. Streaming with 200+ messages in a conversation maintains 55+ FPS measured via Chrome DevTools Performance tab
  2. content-visibility: auto is applied to message list items and verified to reduce off-screen rendering cost
  3. Switching between 10+ sessions in sequence shows no memory growth trend in heap snapshots
  4. Initial page load completes in under 2 seconds on the dev server
  5. Bundle analysis report exists with actionable recommendations for any chunk exceeding 50KB
**Plans**: 2 plans

Plans:
- [ ] 37-01: TBD
- [ ] 37-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 28 -> 29 -> 30 -> ... -> 37
Phases 30 and 35 can run in parallel with 29 (independent dependencies).

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-10 | v1.0 | 21/21 | Complete | 2026-03-07 |
| 11-19 | v1.1 | 26/26 | Complete | 2026-03-09 |
| 20-27 | v1.2 | 20/20 | Complete | 2026-03-12 |
| 28. Error & Connection Resilience | 2/2 | Complete    | 2026-03-12 | - |
| 29. Session Hardening | 2/2 | Complete    | 2026-03-13 | - |
| 30. File Tree Git Integration | 1/1 | Complete    | 2026-03-13 | - |
| 31. Editor & Tool Enhancements | 2/2 | Complete    | 2026-03-16 | - |
| 32. File Mentions | 2/2 | Complete   | 2026-03-16 | - |
| 33. Slash Commands | v1.3 | 0/? | Not started | - |
| 34. Conversation UX | v1.3 | 0/? | Not started | - |
| 35. Quick Settings | v1.3 | 0/? | Not started | - |
| 36. Accessibility | v1.3 | 0/? | Not started | - |
| 37. Performance | v1.3 | 0/? | Not started | - |

## Backlog (Future Milestones)

- **Subagent Monitoring Panel** -- When Claude spawns subagents (Agent tool), show active subagents in a panel/overlay. Click to view a subagent's real-time conversation stream. Requires backend multiplexing of child process output through parent WebSocket. Inspired by [claude-esp](https://github.com/phiat/claude-esp). (M5/M6 scope -- needs backend `claude-sdk.js` changes to expose child process streams.)

---
*Created: 2026-03-07*
*Last updated: 2026-03-16 after Phase 32 planning*
