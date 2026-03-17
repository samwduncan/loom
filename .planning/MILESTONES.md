# Loom V2: Milestone Master Plan

## v1.3 The Refinery (Shipped: 2026-03-17)

**Status:** SHIPPED
**Shipped:** 2026-03-17
**Phases:** 10 (28-37) | **Plans:** 20 | **Commits:** 103
**LOC:** 46,501 TypeScript + CSS (+18,372 / -421 from v1.2)
**Timeline:** 6 days (2026-03-12 to 2026-03-17)
**Archive:** `milestones/v1.3-ROADMAP.md`, `milestones/v1.3-REQUIREMENTS.md`

**Delivered:** Daily-driver refinement making Loom production-ready with error/connection resilience (crash banners, reconnect overlay, status indicator), session hardening (paginated history, streaming indicators, temp ID lifecycle), composer intelligence (@-mention file picker, slash commands with keyboard nav), conversation UX (auto-collapsing turns, token usage footers, quick settings), full accessibility audit (ARIA, keyboard nav, focus management, screen reader, WCAG AA contrast), and performance optimization (vendor chunk splitting, content-visibility, memory profiling, bundle analysis).

**Key Accomplishments:**
1. Error & connection resilience — crash detection banner, reconnect overlay with exponential backoff, connection status indicator, navigate-away guard
2. Session hardening — paginated message history for long conversations, streaming pulse indicator, stub-to-real session ID lifecycle
3. Composer intelligence — @-mention file picker with fuzzy search + inline chips, slash command menu with keyboard navigation, context attachments
4. Conversation UX — auto-collapsing old turns via IntersectionObserver, per-turn token usage/cost footers, quick settings panel with live toggles
5. Full accessibility audit — ARIA roles/labels across all surfaces, keyboard navigation for all panels, focus trapping/restoration, screen reader live regions, reduced-motion override, WCAG AA contrast compliance
6. Performance optimization — 5 vendor chunk groups, Shiki LRU cache, shared IntersectionObserver, content-visibility on message list, bundle analysis with actionable recommendations

**Known Tech Debt (from audit):**
- PERF-01: Code-path verified for 55+ FPS but live benchmark with 200+ messages not measured (requires active backend with long session)
- Phase 31: Minimap/terminal features need human verification (jsdom limitations)
- Phase 32: fileMentions WS field sent but backend ignores it (pending backend support)
- Phase 37: Some perf measurements are code-path verified only (jsdom doesn't support real rendering metrics)

**Gate Criteria:**
- [x] Error banner appears on backend crash within 3 seconds
- [x] WebSocket reconnects automatically with exponential backoff
- [x] Paginated history loads on scroll-up in long conversations
- [x] @-mention picker opens on @ with fuzzy file search
- [x] Slash commands work with keyboard navigation
- [x] Auto-collapse hides old turns, expand on click/scroll
- [x] Quick settings apply immediately without reload
- [x] All interactive elements have ARIA roles and labels
- [x] Full keyboard navigation across all panels
- [x] Screen reader announcements for streaming/tool/error events
- [x] prefers-reduced-motion disables all animations
- [x] WCAG AA contrast compliance across all surfaces
- [x] content-visibility applied and stress-tested on message list
- [x] Bundle analysis with vendor chunk splitting complete
- [x] 37/37 requirements satisfied (all checked off)
- [x] All M1 + M2 + M3 + M4 tests pass (1,023+ tests)

---

## v1.2 The Workspace (Shipped: 2026-03-12)

**Status:** SHIPPED
**Shipped:** 2026-03-12
**Phases:** 8 (20-27) | **Plans:** 20 | **Tasks:** 43 | **Commits:** 145
**LOC:** 39,363 TypeScript + CSS (+40,039 / -46,179 from v1.1)
**Timeline:** 3 days (2026-03-09 to 2026-03-12)
**Archive:** `milestones/v1.2-ROADMAP.md`, `milestones/v1.2-REQUIREMENTS.md`

**Delivered:** Full workspace making Loom a usable daily-driver with CSS show/hide tab system (Chat/Files/Shell/Git), 5-tab settings modal with shadcn primitives, Cmd+K command palette with fuzzy search across 7 command groups, hierarchical file tree with context menus, CodeMirror 6 code editor with OKLCH theme and diff view, xterm.js terminal with separate /shell WebSocket, git panel with staging/commit/branch ops/push-pull-fetch, and cross-phase integration wiring.

**Key Accomplishments:**
1. Content layout with CSS show/hide tab system — all panels mount once and preserve state across switches
2. Full settings panel — 5-tab modal (Agents, API Keys, Appearance, Git, MCP) with live preview, 14 shadcn primitives installed
3. Command palette — Cmd+K with fuzzy search (fuse.js + cmdk) across sessions, files, and 7 command groups
4. File tree + code editor — hierarchical browser with type icons, CodeMirror 6 with OKLCH theme, multi-tab editing, diff view via @codemirror/merge
5. Integrated terminal — xterm.js with separate /shell WebSocket, OKLCH colors, connection state, copy/paste
6. Git panel — Changes/History views, client-side staging, commit with AI message generation, branch selector, push/pull/fetch with loading states

**Known Gaps (accepted as tech debt):**
- CMD-14: Recent/frequent commands on empty search (deferred — needs command registry for re-execution)
- SET-07: API key add form has name field only (backend limitation — no key/provider columns)
- GIT-04: Client-side staging Set<string> instead of immediate API call (intentional deviation — no /api/git/stage endpoint)

**Gate Criteria:**
- [x] Can switch between Chat/Files/Shell/Git tabs without losing state
- [x] Settings modal opens from sidebar gear icon and Cmd+K
- [x] Command palette fuzzy-searches sessions, files, and commands
- [x] File tree browses project structure with context menus
- [x] CodeMirror editor opens files with syntax highlighting and saves with Cmd+S
- [x] Terminal runs shell commands with ANSI color support
- [x] Git panel shows changes, commits, and handles branch operations
- [x] Cross-phase integration: diff view from git panel, Open in Terminal from file tree, keyboard escape guards
- [x] 120/121 requirements satisfied (1 formally deferred)
- [x] All M1 + M2 + M3 tests pass (1,023 tests across 104 files)

---

## M2: "The Chat" — Complete Conversation Loop — SHIPPED 2026-03-09

**Status:** SHIPPED
**Shipped:** 2026-03-09
**Phases:** 9 (11-19) | **Plans:** 26 | **Commits:** 158
**LOC:** 24,786 TypeScript + CSS (+18,570 / -2,863 from v1.0)
**Timeline:** 3 days (2026-03-07 to 2026-03-09)
**Archive:** `milestones/v1.1-ROADMAP.md`, `milestones/v1.1-REQUIREMENTS.md`

**Delivered:** Complete conversation experience with rich markdown rendering (react-markdown + Shiki), streaming two-phase renderer with DOMPurify, auto-resize composer with image attachments, 6 purpose-built tool cards with state machine animations, tool grouping accordion, permission banners with countdown, activity status line, scroll preservation, message entrance animations, CSS visual effects (SpotlightCard, ShinyText, ElectricBorder), message search, and conversation export.

**Key Accomplishments:**
1. Full markdown rendering with Shiki syntax highlighting, OKLCH theme, streaming two-phase converter with XSS protection
2. Rich composer with auto-resize, 5-state FSM, image paste/drag-drop, draft persistence across sessions
3. Complete message type system — 5 roles, thinking disclosures, provider logos, image lightbox
4. Tool card ecosystem — 6 purpose-built cards (Bash/Read/Edit/Write/Glob/Grep) with state machine, elapsed time, ANSI colors, diff viewer
5. Tool grouping accordion + permission banners with 55s countdown ring and Y/N keyboard shortcuts
6. Polish layer — activity status, scroll preservation with ResizeObserver bottom lock, message animations, streaming cursor, token/cost display, SpotlightCard/ShinyText/ElectricBorder effects, message search + conversation export

**Gate Criteria:**
- [x] Can send a message and receive a full streamed response
- [x] Tool calls display correctly with state transitions
- [x] Thinking blocks expand/collapse with global toggle
- [x] Code blocks have Shiki syntax highlighting
- [x] Composer auto-resizes and send/stop morphs
- [x] Session switching works
- [x] All M1 + M2 tests pass (regression)
- [x] 97/97 requirements verified in milestone audit

---

This document captures the full development vision across all milestones. It persists across sessions and is the authoritative reference for what each milestone builds and what architectural groundwork it lays for future milestones.

**Every new GSD milestone session MUST read this file first.**

---

## Architectural Principles (Apply to ALL Milestones)

1. **Interface-First Schemas**: Full Zustand store TypeScript interfaces defined in M1 for the ENTIRE V2 vision. Data shapes are immutable from day one. Implementation fills in stubs as milestones progress.
2. **Stream Multiplexer**: WebSocket bridge supports multiple concurrent streams from M1 (thinking + content in M1, multi-provider in M4).
3. **Tool-Call Component Registry**: Pluggable registry pattern — never a switch statement. New tool types register themselves. Essential for MCP extensibility in M4.
4. **Motion Tokens**: Spring configs (stiffness, damping, duration) defined alongside color tokens. All milestones share the same motion language.
5. **Constitution Enforcement**: ESLint rules enforce banned patterns from commit #1. No milestone is exempt.
6. **Regression Gates**: Every milestone gate runs ALL previous milestone tests. No regression allowed.

---

## M1: "The Skeleton" — Architecture + Vertical Proof — SHIPPED 2026-03-07

**Status:** SHIPPED
**Shipped:** 2026-03-07
**Phases:** 10 | **Plans:** 21 | **Commits:** 145
**LOC:** 14,423 TypeScript + CSS
**Timeline:** 3 days (2026-03-04 to 2026-03-07)
**Archive:** `milestones/v1.0-ROADMAP.md`, `milestones/v1.0-REQUIREMENTS.md`

**Delivered:** Complete architectural skeleton with OKLCH design tokens, 9 ESLint Constitution rules, 4 Zustand stores with M1-M5 interfaces, WebSocket streaming at 60fps via rAF DOM mutation, pluggable tool registry, sidebar navigation with session switching, and Playwright E2E verification.

**Key Accomplishments:**
1. OKLCH design token system with 29 colors, motion springs, and surface hierarchy — enforced by 9 custom ESLint rules
2. Four Zustand stores with full M1-M5 TypeScript interfaces, selector-only access, and persistence
3. WebSocket bridge with stream multiplexer routing thinking/content/tool channels independently
4. 60fps streaming engine using useRef + rAF DOM mutation (zero React re-renders during streaming)
5. Pluggable tool-call registry with 6 built-in tools and ToolChip/ToolCard components
6. Production-wired chat with sidebar navigation, session switching, and Playwright E2E verification

**Goal**: Build the architectural skeleton for the entire V2 vision and prove it works with a real vertical slice (streamed message with thinking blocks renders in the browser).

**Phases**: 10 (fine granularity)

**Deliverables**:
- Design token system: OKLCH colors, motion tokens (spring configs), spacing scale, z-index dictionary, typography
- Full Zustand store **interfaces** for entire V2 vision (all 5 milestones):
  - `timeline` store: past messages with `metadata` and `providerContext` fields
  - `stream` store: active streaming state, tool call states, thinking state
  - `ui` store: sidebar state, active tab, modal state, theme, companion state (stub)
  - `connection` store: WebSocket status per provider, reconnection state
- App shell: CSS Grid (sidebar | content | artifact), 3-column with third at `0px`
- Sidebar: Functional session list (may use mock data initially)
- ESLint Constitution enforcement: All banned patterns have lint rules
- Test infrastructure: Vitest + React Testing Library, configured and passing
- Stream Multiplexer: Routes thinking + content streams into single message state
- Tool-Call Component Registry: Pluggable pattern established
- WebSocket bridge: Connected to backend, streaming tokens
- Basic scroll anchoring: Locks to bottom during stream, detaches on user scroll
- Error boundary hierarchy: App → Panel → Message level
- Persistence strategy: Defined and documented (localStorage vs IndexedDB decision)
- Routing structure: Slots for all future views (chat, GSD dashboard, settings, etc.)

**Gate Criteria**:
- [x] Real streamed message with thinking block renders correctly in browser
- [x] Stream Multiplexer routes thinking + content simultaneously
- [x] All ESLint Constitution rules pass with zero warnings
- [x] TypeScript strict mode, zero `any` types
- [x] All tests pass
- [x] Sidebar shows session list (real data from backend)
- [x] Playwright E2E tests verify all integration points

---

## v1.4: "The Polish" — 10/10 Visual Quality

**Goal**: Transform the functional daily-driver into a visually stunning, award-winning interface. Every interaction should feel satisfying.

**Status:** Planned (next milestone)

**Deliverables**:
- Spring physics animations on all interactions
- Aurora/ambient WebGL overlay during streaming (GPU feasibility gated)
- Glass surface effects for modals and overlays
- Sidebar slim collapse mode (icon-only rail)
- DecryptedText reveals for session titles and model names
- StarBorder accents on focused/active elements
- Motion refinement across all surfaces

**Reference:** `.planning/M3-POLISH-DEFERRED-CONTEXT.md` — all visual polish research, gap analysis, deferred ideas

**Gate Criteria**:
- [ ] Streaming at 100 tokens/sec with zero visible jitter
- [ ] All animations use defined motion tokens
- [ ] FPS stays above 55 during heavy streaming
- [ ] All M1-M4 tests pass (regression)
- [ ] User spot check: "Would a harsh, experienced developer rate this 10/10?"

---

## v2.0: "The Power" — Multi-Agent + Management

**Goal**: Enable simultaneous work with multiple AI providers and manage the tooling ecosystem from within the app.

**Phases**: ~3-5

**Deliverables**:
- Multi-provider tabbed workspaces (Claude, Gemini, Codex)
- Background task execution with tab notifications
- Shared context between provider tabs (Gemini can see Claude's conversation)
- MCP server management UI (enable, disable, configure)
- Plugin/skill management UI
- Approval flow for write-heavy MCP actions

**Gate Criteria**:
- [ ] Can work with Claude in one tab and Gemini in another simultaneously
- [ ] Background tab notifications work
- [ ] Gemini tab can access Claude conversation context
- [ ] MCP servers can be enabled/disabled from UI
- [ ] All M1-M4 tests pass (regression)
- [ ] User spot check: "Can I effectively work with multiple agents?"

---

## v3.0: "The Vision" — Integrations + Extras

**Goal**: Add the unique features that make Loom a one-of-a-kind tool — visual build pipeline, file integration, companions.

**Phases**: ~4-6

**Deliverables**:
- GSD visual dashboard (phase pipeline, progress, agent assignments, task status)
- Nextcloud integration (file picker, screenshot upload, file browser)
- Companion system (animated pixel-art characters — CONDITIONAL on feasibility gate)
- CodeRabbit integration (PR review, local code review)
- Final polish pass across entire app

**Gate Criteria**:
- [ ] GSD dashboard shows real phase/task data
- [ ] Can attach Nextcloud files to chat messages
- [ ] Companion responds to system events (if feasibility passes)
- [ ] All M1-M5 tests pass (regression)
- [ ] User spot check: "Is this the complete dream app?"

**Feasibility Gates**:
- Companion system: Sprite library sourced (itch.io), licenses verified, animation states mapped, performance tested on Radeon 780M iGPU
- Nextcloud: Architecture decision (direct WebDAV vs backend proxy)
- GSD dashboard: Backend endpoint availability verified

---

## Cross-Milestone Store Schema

These TypeScript interfaces are defined in M1 and persist unchanged through all milestones. New fields may be ADDED but existing fields are NEVER removed or renamed.

```typescript
// Defined in M1, populated incrementally across milestones
interface TimelineStore {
  sessions: Session[]
  activeSessionId: string | null
  // M4: multi-provider
  activeProviderId: ProviderId  // hardcoded 'claude' until M4
}

interface StreamStore {
  isStreaming: boolean
  activeToolCalls: ToolCallState[]
  thinkingState: ThinkingState | null
  activityText: string
  // Token text lives in useRef, NOT in store
}

interface UIStore {
  sidebarOpen: boolean
  sidebarCollapsed: boolean  // M3: slim mode
  activeTab: TabId           // M4: multi-provider tabs
  modalState: ModalState | null
  commandPaletteOpen: boolean  // M3: Cmd+K
  companionState: CompanionState | null  // M5: companions
  theme: ThemeConfig
}

interface ConnectionStore {
  providers: Record<ProviderId, ProviderConnection>
  // M1: only 'claude' populated
  // M4: gemini + codex added
}

interface Message {
  id: string
  role: MessageRole
  content: string
  toolCalls?: ToolCall[]
  thinkingBlocks?: ThinkingBlock[]
  metadata: MessageMetadata  // timestamps, token count, cost
  providerContext: ProviderContext  // which agent, model, provider
}

interface Session {
  id: string
  title: string
  messages: Message[]
  providerId: ProviderId
  createdAt: string
  updatedAt: string
  metadata: SessionMetadata  // token budget, context window state
}
```

---

## Document Maintenance

- **After each milestone**: Update gate criteria outcomes, note any schema changes, capture lessons learned
- **Before each `/gsd:new-milestone`**: Read this file, verify the next milestone's scope still makes sense given what was learned
- **Schema changes**: Any change to the store interfaces requires updating this document AND the Constitution

---
*Created: 2026-03-04*
*Last updated: 2026-03-17 after v1.3 milestone completion*
