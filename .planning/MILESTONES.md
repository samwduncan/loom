# Loom V2: Milestone Master Plan

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

## M1: "The Skeleton" — Architecture + Vertical Proof

**Goal**: Build the architectural skeleton for the entire V2 vision and prove it works with a real vertical slice (streamed message with thinking blocks renders in the browser).

**Phases**: ~4-6 (fine granularity)

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
- [ ] Real streamed message with thinking block renders correctly in browser
- [ ] Stream Multiplexer routes thinking + content simultaneously
- [ ] All ESLint Constitution rules pass with zero warnings
- [ ] TypeScript strict mode, zero `any` types
- [ ] All tests pass
- [ ] Sidebar shows session list (mock or real data)
- [ ] User spot check: "Does this skeleton feel architecturally sound?"

---

## M2: "The Chat" — Complete Conversation Loop

**Goal**: Build the complete conversation experience. Every message type renders, tools display with animations, the composer works, and you can have a full conversation.

**Phases**: ~4-6

**Deliverables**:
- All 7 message types rendering (user, assistant, tool, thinking, error, system, task_notification)
- Tool cards with state machine animations (running → success → error)
- Thinking/reasoning blocks with expand/collapse
- Markdown rendering with syntax-highlighted code blocks (Shiki, lazy-loaded)
- Composer: Auto-resize textarea, send/stop morph, focus trapping
- Functional scroll (basic anchoring from M1, not perfected yet)
- Activity status line ("Reading auth.ts...", "Writing server.js...")
- Session switching (real data, connected to backend)

**Gate Criteria**:
- [ ] Can send a message and receive a full streamed response
- [ ] Tool calls display correctly with state transitions
- [ ] Thinking blocks expand/collapse
- [ ] Code blocks have syntax highlighting
- [ ] Composer auto-resizes and send/stop morphs
- [ ] Session switching works
- [ ] All M1 + M2 tests pass (regression)
- [ ] User spot check: "Is this a better chat experience than V1?"

---

## M3: "The Polish" — 10/10 Visual Quality

**Goal**: Transform the functional chat into a visually stunning, award-winning interface. Every interaction should feel satisfying.

**Phases**: ~4-6

**Deliverables**:
- Scroll physics perfected (scroll-to-bottom pill, smooth anchoring, zero jitter)
- Aurora/ambient overlay during streaming
- Message entrance animations (spring translateY + opacity)
- Execution chain grouping (consecutive tool calls → accordion)
- Sidebar slim collapse mode (icon-only rail)
- Cmd+K omnibar for project/session switching
- Settings panel (extensible architecture for future integration settings)
- Full accessibility pass (ARIA roles, keyboard nav, prefers-reduced-motion)
- Performance audit (FPS during streaming, memory profiling)

**Gate Criteria**:
- [ ] Streaming at 100 tokens/sec with zero visible jitter
- [ ] All animations use defined motion tokens
- [ ] Keyboard navigation works throughout
- [ ] prefers-reduced-motion respected
- [ ] FPS stays above 55 during heavy streaming
- [ ] All M1 + M2 + M3 tests pass (regression)
- [ ] User spot check: "Would a harsh, experienced developer rate this 10/10?"

---

## M4: "The Power" — Multi-Agent + Management

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

## M5: "The Vision" — Integrations + Extras

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
*Last updated: 2026-03-04 after architectural consensus (Claude + Gemini)*
