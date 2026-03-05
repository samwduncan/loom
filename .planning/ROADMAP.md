# Roadmap: Loom V2 — Milestone 1: "The Skeleton"

## Overview

Milestone 1 builds the architectural skeleton for the entire Loom V2 frontend and proves it works with a real vertical slice: a streamed AI response with thinking blocks rendering in the browser. The build order follows a strict dependency chain — design tokens and enforcement first (preventing the foundation rot that killed V1), then state and streaming infrastructure, then the proof-of-life vertical slice, and finally navigation to make it usable. Every phase produces prerequisites for all subsequent phases. No phase can be parallelized without breaking the chain.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Design Token System** - OKLCH color tokens, motion tokens, spacing scale, z-index dictionary, typography, and surface hierarchy in CSS custom properties
- [ ] **Phase 2: Enforcement + Testing Infrastructure** - ESLint Constitution rules, TypeScript strict mode, Vitest setup, and pre-commit gates that block violations from commit #1
- [ ] **Phase 3: App Shell + Error Boundaries** - CSS Grid layout, 100dvh viewport lock, route structure, and 3-tier error boundary hierarchy
- [ ] **Phase 4: State Architecture** - Four Zustand stores (timeline, stream, ui, connection) with full TypeScript interfaces, selector-only enforcement, and persistence
- [ ] **Phase 5: WebSocket Bridge + Stream Multiplexer** - WebSocket client with reconnection, typed message discrimination, and channel routing for content/thinking/tool streams
- [ ] **Phase 6: Streaming Engine + Scroll Anchor** - useRef + rAF token buffer bypassing React reconciler, ActiveMessage component, and IntersectionObserver scroll anchoring
- [ ] **Phase 7: Tool Registry + Proof of Life** - Pluggable tool-call component registry and the vertical slice proving the entire pipeline end-to-end
- [ ] **Phase 8: Navigation + Session Management** - Sidebar with grouped session list, session switching with message loading, and URL-driven routing

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
**Plans**: TBD

Plans:
- [ ] 02-01: ESLint configuration with all Constitution enforcement rules
- [ ] 02-02: TypeScript strict config + Vitest setup with coverage
- [ ] 02-03: Pre-commit hooks (lint-staged + husky) blocking violations on commit

### Phase 3: App Shell + Error Boundaries
**Goal**: The application has a CSS Grid skeleton that provides the spatial structure for all future content — sidebar, main content, and a reserved artifact column — with error containment at every level
**Depends on**: Phase 2 (enforcement must be active before any component code)
**Requirements**: SHELL-01, SHELL-02, SHELL-03, SHELL-04
**Success Criteria** (what must be TRUE):
  1. The app renders a 3-column CSS Grid (`sidebar | content | artifact-at-0px`) that fills `100dvh` with no document-level scrollbar at any viewport size
  2. React Router serves `/chat/:sessionId?`, `/dashboard` (placeholder), and `/settings` (placeholder) — all rendering inside the content grid area
  3. Throwing an error inside a message-level component shows "Failed to render" for only that message — sidebar, other messages, and shell remain functional
  4. Each of the three error boundary tiers (App, Panel, Message) logs the error with a component stack trace
**Plans**: TBD

Plans:
- [ ] 03-01: AppShell CSS Grid layout + viewport lock + base routing
- [ ] 03-02: Three-tier error boundary hierarchy (App, Panel, Message)

### Phase 4: State Architecture
**Goal**: Four Zustand stores define the complete data contract for the entire V2 vision — with full TypeScript interfaces ready for M4 multi-provider without type changes — and every store access uses selectors
**Depends on**: Phase 3 (shell must exist to wire stores into components)
**Requirements**: STATE-01, STATE-02, STATE-03, STATE-04, STATE-05
**Success Criteria** (what must be TRUE):
  1. Four store files exist (`timeline.ts`, `stream.ts`, `ui.ts`, `connection.ts`) with full TypeScript interfaces matching the cross-milestone schema from MILESTONES.md, and each has a passing test file
  2. The `Message` type includes `metadata: MessageMetadata` and `providerContext: ProviderContext` fields; the `Session` type includes `metadata: SessionMetadata` — all with `ProviderId` union type defaulting to `'claude'`
  3. Grepping the codebase for store hook usage without selectors finds zero matches — either enforced by ESLint rule or documented pattern test
  4. The timeline store persists its sessions list to localStorage via Zustand `persist` middleware, and `src/stores/README.md` documents which slices persist vs which are ephemeral
**Plans**: TBD

Plans:
- [ ] 04-01: Four Zustand stores with full TypeScript interfaces and actions
- [ ] 04-02: Selector enforcement, persistence middleware, and store documentation

### Phase 5: WebSocket Bridge + Stream Multiplexer
**Goal**: The frontend establishes a typed WebSocket connection to the CloudCLI backend, parses every incoming message into a discriminated union, and routes content/thinking/tool streams into separate channels feeding the correct stores
**Depends on**: Phase 4 (stores must exist to receive routed messages)
**Requirements**: STRM-01, STRM-02
**Research flag**: NEEDS RESEARCH -- exact WebSocket message shapes from CloudCLI backend for all three providers must be audited from `server/index.js` before execution begins
**Success Criteria** (what must be TRUE):
  1. The WebSocket client connects to `ws://<host>:<port>/ws?token=<jwt>`, auto-reconnects with exponential backoff (1s/2s/4s/8s/max 30s), and updates the connection store on every state change
  2. Sending a hardcoded prompt via WebSocket produces a streaming response where all incoming message types (`claude-response`, `claude-complete`, `claude-error`, etc.) are parsed and logged correctly
  3. The stream multiplexer routes content tokens to a `useRef` buffer (not React state), thinking content to the stream store's `thinkingState`, and tool events to the stream store's `activeToolCalls`
**Plans**: TBD

Plans:
- [ ] 05-01: WebSocket client with typed message parsing, reconnection, and connection store integration
- [ ] 05-02: Stream multiplexer routing content/thinking/tool channels to stores and ref buffer

### Phase 6: Streaming Engine + Scroll Anchor
**Goal**: Streaming tokens render in the browser at 60fps via direct DOM mutation (bypassing React's reconciler), with scroll that locks to bottom during streaming and instantly disengages on any user scroll
**Depends on**: Phase 5 (WebSocket must deliver tokens for the stream buffer to consume)
**Requirements**: STRM-03, COMP-02, COMP-03
**Success Criteria** (what must be TRUE):
  1. During a 2000-token streaming response, React DevTools Profiler shows zero re-renders on the ActiveMessage component — all text updates happen via rAF DOM mutation on a ref
  2. The ActiveMessage component displays streamed text with a blinking cursor, and when streaming completes, the accumulated text flushes to the timeline store as a finalized message
  3. During streaming, scrolling up by any amount immediately disengages auto-scroll and shows a "Scroll to bottom" pill; clicking the pill re-engages auto-scroll; starting a new stream re-engages auto-scroll
**Plans**: TBD

Plans:
- [ ] 06-01: useStreamBuffer hook with useRef + rAF token accumulation and flush
- [ ] 06-02: ActiveMessage component with memo isolation and blinking cursor
- [ ] 06-03: useScrollAnchor hook with IntersectionObserver sentinel and scroll-to-bottom pill

### Phase 7: Tool Registry + Proof of Life
**Goal**: A pluggable tool registry handles any tool name gracefully, and a proof-of-life page demonstrates the entire pipeline working end-to-end — WebSocket connection, streaming tokens, thinking blocks, and connection status all visible in the browser
**Depends on**: Phase 6 (streaming engine must work for proof-of-life to render streamed content)
**Requirements**: COMP-01, STRM-04
**Success Criteria** (what must be TRUE):
  1. Calling `getToolConfig('Bash')` returns a registered config with display name, icon, and renderers; calling `getToolConfig('UnknownTool')` returns a graceful default config without crashing
  2. The proof-of-life page connects to the backend WebSocket, sends a hardcoded prompt, and renders the streaming response in real-time using the rAF buffer
  3. Thinking blocks display in a separate section from the main response (proving the multiplexer routes channels independently), and connection status is visible on the page
**Plans**: TBD

Plans:
- [ ] 07-01: Tool-call component registry with pluggable registration and default fallback
- [ ] 07-02: Proof-of-life vertical slice page proving end-to-end pipeline

### Phase 8: Navigation + Session Management
**Goal**: Users can browse their chat sessions in a sidebar, click to switch sessions with message loading, and navigate via URL — completing M1 as a usable (if minimal) application
**Depends on**: Phase 7 (proof-of-life validates the pipeline that navigation wraps)
**Requirements**: NAV-01, NAV-02
**Success Criteria** (what must be TRUE):
  1. The sidebar renders in the first grid column with `--surface-raised` background, showing sessions grouped by "Today" / "Yesterday" / "Previous 7 Days" / "Older", each with title, date, and provider icon
  2. Clicking a session updates the URL to `/chat/:sessionId`, triggers a message fetch, shows a loading skeleton during the fetch, and displays loaded messages in the content area
  3. The "New Chat" button creates a new session and navigates to it
  4. The sidebar has `role="complementary"` and `aria-label="Chat sessions"` for accessibility
**Plans**: TBD

Plans:
- [ ] 08-01: Sidebar component with session list, date grouping, and new chat button
- [ ] 08-02: Session switching with message loading, skeleton state, and URL sync

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Design Token System | 3/3 | Complete | 2026-03-05 |
| 2. Enforcement + Testing | 0/3 | Not started | - |
| 3. App Shell + Error Boundaries | 0/2 | Not started | - |
| 4. State Architecture | 0/2 | Not started | - |
| 5. WebSocket Bridge + Multiplexer | 0/2 | Not started | - |
| 6. Streaming Engine + Scroll | 0/3 | Not started | - |
| 7. Tool Registry + Proof of Life | 0/2 | Not started | - |
| 8. Navigation + Sessions | 0/2 | Not started | - |
