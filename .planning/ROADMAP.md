# Roadmap: Loom V2 — Milestone 1: "The Skeleton"

## Overview

Milestone 1 builds the architectural skeleton for the entire Loom V2 frontend and proves it works with a real vertical slice: a streamed AI response with thinking blocks rendering in the browser. The build order follows a strict dependency chain — design tokens and enforcement first (preventing the foundation rot that killed V1), then state and streaming infrastructure, then the proof-of-life vertical slice, and finally navigation to make it usable. Every phase produces prerequisites for all subsequent phases. No phase can be parallelized without breaking the chain.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Design Token System** - OKLCH color tokens, motion tokens, spacing scale, z-index dictionary, typography, and surface hierarchy in CSS custom properties
- [x] **Phase 2: Enforcement + Testing Infrastructure** - ESLint Constitution rules, TypeScript strict mode, Vitest setup, and pre-commit gates that block violations from commit #1
- [ ] **Phase 3: App Shell + Error Boundaries** - CSS Grid layout, 100dvh viewport lock, route structure, and 3-tier error boundary hierarchy
- [ ] **Phase 4: State Architecture** - Four Zustand stores (timeline, stream, ui, connection) with full TypeScript interfaces, selector-only enforcement, and persistence
- [x] **Phase 5: WebSocket Bridge + Stream Multiplexer** - WebSocket client with reconnection, typed message discrimination, and channel routing for content/thinking/tool streams (completed 2026-03-06)
- [ ] **Phase 6: Streaming Engine + Scroll Anchor** - useRef + rAF token buffer bypassing React reconciler, ActiveMessage component, and IntersectionObserver scroll anchoring
- [x] **Phase 7: Tool Registry + Proof of Life** - Pluggable tool-call component registry and the vertical slice proving the entire pipeline end-to-end (completed 2026-03-06)
- [x] **Phase 8: Navigation + Session Management** - Sidebar with grouped session list, session switching with message loading, and URL-driven routing (completed 2026-03-06)
- [ ] **Phase 9: E2E Integration Wiring + Playwright Verification** - Wire WebSocket init into production route, fix sidebar navigation, Playwright E2E tests for all human-verification gaps
- [ ] **Phase 10: Pre-Archive Cleanup** - Remove orphaned exports, fix inline styles, correct stale traceability

## Phase Details

### Phase 1: Design Token System
**Goal**: Every visual value used anywhere in the application is defined as a CSS custom property — colors, motion, spacing, z-index, and typography — so no component ever needs a hardcoded value
**Depends on**: Nothing (first phase)
**Requirements**: DS-01, DS-02, DS-03, DS-04, DS-05, DS-06
**Success Criteria** (what must be TRUE):
  1. A single `tokens.css` file contains all OKLCH color tokens, motion tokens, spacing scale, z-index dictionary, and typography definitions as CSS custom properties on `:root`
  2. Three visually distinct surface levels (base, raised, overlay) are perceptible — surface hierarchy achieved through lightness steps only, with no `box-shadow` for elevation
  3. Inter Variable, Instrument Serif, and JetBrains Mono load via `@font-face` with `font-display: swap`, and Tailwind's `font-sans`/`font-serif`/`font-mono` classes map to them
  4. Spring physics configs exist as JS constants in `src/lib/motion.ts` (SPRING_GENTLE, SPRING_SNAPPY, SPRING_BOUNCY) alongside CSS easing tokens
  5. A test HTML page or Storybook-style preview renders all token values visually for verification
**Plans:** 3 plans

Plans:
- [x] 01-01-PLAN.md — V2 project scaffolding (Vite + React 18 + TS + Tailwind v4), font loading, CSS entry point
- [x] 01-02-PLAN.md — Complete token system (OKLCH colors, surfaces, motion, spacing, z-index, FX) + spring physics module
- [x] 01-03-PLAN.md — Comprehensive token preview page at /dev/tokens + visual verification checkpoint

### Phase 2: Enforcement + Testing Infrastructure
**Goal**: Automated guards block every banned pattern from the V2 Constitution at build time — no hardcoded colors, no whole-store subscriptions, no `any` types, no raw z-index — so violations cannot accumulate
**Depends on**: Phase 1 (tokens must exist for ESLint rules to enforce their usage)
**Requirements**: ENF-01, ENF-02, ENF-03, ENF-04
**Success Criteria** (what must be TRUE):
  1. Running `npx eslint src/` produces zero errors on the Phase 1 codebase, and adding `bg-gray-800` to any component file produces an ESLint error
  2. Running `tsc --noEmit` passes with zero errors under strict mode with `noUncheckedIndexedAccess` enabled
  3. Running `npm run test` executes Vitest with jsdom environment and produces a coverage report
  4. Attempting to `git commit` a file containing a banned pattern (hardcoded color, `any` type, raw z-index) is rejected by the pre-commit hook
**Plans:** 3/3 plans executed

Plans:
- [x] 02-01-PLAN.md — Local ESLint plugin with 9 custom Constitution enforcement rules
- [x] 02-02-PLAN.md — Vitest setup with coverage thresholds + Phase 1 test suite + TypeScript strict verification
- [x] 02-03-PLAN.md — Husky + lint-staged pre-commit hook blocking banned patterns on commit

### Phase 3: App Shell + Error Boundaries
**Goal**: The application has a CSS Grid skeleton that provides the spatial structure for all future content — sidebar, main content, and a reserved artifact column — with error containment at every level
**Depends on**: Phase 2 (enforcement must be active before any component code)
**Requirements**: SHELL-01, SHELL-02, SHELL-03, SHELL-04
**Success Criteria** (what must be TRUE):
  1. The app renders a 3-column CSS Grid (`sidebar | content | artifact-at-0px`) that fills `100dvh` with no document-level scrollbar at any viewport size
  2. React Router serves `/chat/:sessionId?`, `/dashboard` (placeholder), and `/settings` (placeholder) — all rendering inside the content grid area
  3. Throwing an error inside a message-level component shows "Failed to render" for only that message — sidebar, other messages, and shell remain functional
  4. Each of the three error boundary tiers (App, Panel, Message) logs the error with a component stack trace
**Plans:** 1/2 plans executed

Plans:
- [ ] 03-01-PLAN.md — AppShell CSS Grid layout + sidebar with collapse toggle + React Router route placeholders + minimal UI store stub
- [ ] 03-02-PLAN.md — Three-tier error boundary hierarchy (App, Panel, Message) with fallback UIs + wiring into AppShell

### Phase 4: State Architecture
**Goal**: Four Zustand stores define the complete data contract for the entire V2 vision — with full TypeScript interfaces ready for M4 multi-provider without type changes — and every store access uses selectors
**Depends on**: Phase 3 (shell must exist to wire stores into components)
**Requirements**: STATE-01, STATE-02, STATE-03, STATE-04, STATE-05
**Success Criteria** (what must be TRUE):
  1. Four store files exist (`timeline.ts`, `stream.ts`, `ui.ts`, `connection.ts`) with full TypeScript interfaces matching the cross-milestone schema from MILESTONES.md, and each has a passing test file
  2. The `Message` type includes `metadata: MessageMetadata` and `providerContext: ProviderContext` fields; the `Session` type includes `metadata: SessionMetadata` — all with `ProviderId` union type defaulting to `'claude'`
  3. Grepping the codebase for store hook usage without selectors finds zero matches — either enforced by ESLint rule or documented pattern test
  4. The timeline store persists its sessions list to localStorage via Zustand `persist` middleware, and `src/stores/README.md` documents which slices persist vs which are ephemeral
**Plans:** 2 plans

Plans:
- [x] 04-01-PLAN.md — Complete type system (5 type files) + all 4 Zustand stores with Immer/Persist middleware and full M1-M5 interfaces
- [ ] 04-02-PLAN.md — Comprehensive store test suites (4 test files) + persistence documentation + selector enforcement verification

### Phase 5: WebSocket Bridge + Stream Multiplexer
**Goal**: The frontend establishes a typed WebSocket connection to the CloudCLI backend, parses every incoming message into a discriminated union, and routes content/thinking/tool streams into separate channels feeding the correct stores
**Depends on**: Phase 4 (stores must exist to receive routed messages)
**Requirements**: STRM-01, STRM-02
**Research flag**: NEEDS RESEARCH -- exact WebSocket message shapes from CloudCLI backend for all three providers must be audited from `server/index.js` before execution begins
**Success Criteria** (what must be TRUE):
  1. The WebSocket client connects to `ws://<host>:<port>/ws?token=<jwt>`, auto-reconnects with exponential backoff (1s/2s/4s/8s/max 30s), and updates the connection store on every state change
  2. Sending a hardcoded prompt via WebSocket produces a streaming response where all incoming message types (`claude-response`, `claude-complete`, `claude-error`, etc.) are parsed and logged correctly
  3. The stream multiplexer routes content tokens to a `useRef` buffer (not React state), thinking content to the stream store's `thinkingState`, and tool events to the stream store's `activeToolCalls`
**Plans:** 2/2 plans complete

Plans:
- [x] 05-01-PLAN.md — WebSocket type system (ServerMessage/ClientMessage unions), auth module (JWT auto-auth), WebSocket client singleton with reconnection state machine
- [ ] 05-02-PLAN.md — Stream multiplexer pure functions + WS init wiring to Zustand stores

### Phase 6: Streaming Engine + Scroll Anchor
**Goal**: Streaming tokens render in the browser at 60fps via direct DOM mutation (bypassing React's reconciler), with scroll that locks to bottom during streaming and instantly disengages on any user scroll
**Depends on**: Phase 5 (WebSocket must deliver tokens for the stream buffer to consume)
**Requirements**: STRM-03, COMP-02, COMP-03
**Success Criteria** (what must be TRUE):
  1. During a 2000-token streaming response, React DevTools Profiler shows zero re-renders on the ActiveMessage component — all text updates happen via rAF DOM mutation on a ref
  2. The ActiveMessage component displays streamed text with a blinking cursor, and when streaming completes, the accumulated text flushes to the timeline store as a finalized message
  3. During streaming, scrolling up by any amount immediately disengages auto-scroll and shows a "Scroll to bottom" pill; clicking the pill re-engages auto-scroll; starting a new stream re-engages auto-scroll
**Plans:** 2 plans

Plans:
- [x] 06-01-PLAN.md — useStreamBuffer hook + ActiveMessage component with rAF token buffer, cursor, and finalization lifecycle
- [ ] 06-02-PLAN.md — useScrollAnchor hook with IntersectionObserver sentinel + ScrollToBottomPill component

### Phase 7: Tool Registry + Proof of Life
**Goal**: A pluggable tool registry handles any tool name gracefully, and a proof-of-life page demonstrates the entire pipeline working end-to-end — WebSocket connection, streaming tokens, thinking blocks, and connection status all visible in the browser
**Depends on**: Phase 6 (streaming engine must work for proof-of-life to render streamed content)
**Requirements**: COMP-01, STRM-04
**Success Criteria** (what must be TRUE):
  1. Calling `getToolConfig('Bash')` returns a registered config with display name, icon, and renderers; calling `getToolConfig('UnknownTool')` returns a graceful default config without crashing
  2. The proof-of-life page connects to the backend WebSocket, sends a hardcoded prompt, and renders the streaming response in real-time using the rAF buffer
  3. Thinking blocks display in a separate section from the main response (proving the multiplexer routes channels independently), and connection status is visible on the page
**Plans:** 2/2 plans complete

Plans:
- [x] 07-01-PLAN.md — Tool registry module + ToolChip/ToolCard components + ThinkingDisclosure with CSS styling
- [ ] 07-02-PLAN.md — ActiveMessage multi-span refactor + proof-of-life page wiring entire M1 pipeline end-to-end

### Phase 8: Navigation + Session Management
**Goal**: Users can browse their chat sessions in a sidebar, click to switch sessions with message loading, and navigate via URL — completing M1 as a usable (if minimal) application
**Depends on**: Phase 7 (proof-of-life validates the pipeline that navigation wraps)
**Requirements**: NAV-01, NAV-02
**Success Criteria** (what must be TRUE):
  1. The sidebar renders in the first grid column with `--surface-raised` background, showing sessions grouped by "Today" / "Yesterday" / "Previous 7 Days" / "Older", each with title, date, and provider icon
  2. Clicking a session updates the URL to `/chat/:sessionId`, triggers a message fetch, shows a loading skeleton during the fetch, and displays loaded messages in the content area
  3. The "New Chat" button creates a new session and navigates to it
  4. The sidebar has `role="complementary"` and `aria-label="Chat sessions"` for accessibility
**Plans:** 2/2 plans complete

Plans:
- [ ] 08-01-PLAN.md — Sidebar session list, date grouping, provider logos, shared infrastructure (API client, transforms, MessageContainer)
- [ ] 08-02-PLAN.md — ChatView with message display, composer, session switching with AbortController, URL sync

### Phase 9: E2E Integration Wiring + Playwright Verification
**Goal**: Wire the disconnected integration points so the production `/chat` route actually works end-to-end, then prove it with Playwright E2E tests covering every human-verification gap from earlier phases
**Depends on**: Phase 8 (all components must exist to wire together)
**Requirements**: STRM-01, STRM-02, STRM-03, NAV-01, NAV-02 (integration verification)
**Gap Closure**: Closes INT-01, INT-02 from v1.0 audit + 6 human verification items from Phase 7
**Success Criteria** (what must be TRUE):
  1. Navigating to `/chat` establishes a WebSocket connection (connection store shows `connected`) without visiting any dev page first
  2. Clicking a session in the sidebar updates the URL to `/chat/:sessionId`, triggers message fetch, and displays loaded messages
  3. Playwright E2E tests pass for: streaming on `/chat`, session switching, new chat, tool call display, thinking blocks, scroll anchor behavior
  4. Zero layout shift (CLS) during the streaming-to-finalized message handoff
  5. `projects_updated` WebSocket event triggers session list refetch
**Plans:** 2 plans

Plans:
- [ ] 09-01-PLAN.md — Integration fixes (WebSocket init, SessionList navigation, projects_updated wiring)
- [ ] 09-02-PLAN.md — Playwright E2E test suite (streaming, session switching, scroll, tool calls, CLS verification)

### Phase 10: Pre-Archive Cleanup
**Goal**: Remove orphaned code, fix stale traceability, and eliminate Constitution violations before archiving M1
**Depends on**: Phase 9 (integration must be verified before cleanup)
**Requirements**: ENF-01 (traceability fix)
**Gap Closure**: Closes tech debt items from v1.0 audit
**Success Criteria** (what must be TRUE):
  1. ToolCard.tsx is either removed or properly imported (no orphaned exports)
  2. tool-registry.ts has zero inline styles (uses CSS classes with design tokens)
  3. ENF-01 traceability table shows "Complete" (matching its checkbox status)
  4. No unused test-only exports in production code
**Plans:** TBD

Plans:
- [ ] 10-01-PLAN.md — Orphan removal, inline style cleanup, traceability fix

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Design Token System | 3/3 | Complete | 2026-03-05 |
| 2. Enforcement + Testing | 3/3 | Complete | 2026-03-05 |
| 3. App Shell + Error Boundaries | 2/2 | Complete | 2026-03-05 |
| 4. State Architecture | 2/2 | Complete | 2026-03-05 |
| 5. WebSocket Bridge + Multiplexer | 2/2 | Complete   | 2026-03-06 |
| 6. Streaming Engine + Scroll | 2/2 | Complete | 2026-03-06 |
| 7. Tool Registry + Proof of Life | 2/2 | Complete   | 2026-03-06 |
| 8. Navigation + Sessions | 2/2 | Complete   | 2026-03-06 |
| 9. E2E Integration + Playwright | 0/2 | Pending | - |
| 10. Pre-Archive Cleanup | 0/1 | Pending | - |
