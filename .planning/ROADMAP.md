# Roadmap: Loom

## Milestones

- v1.0 Functional Foundation (Phases 1-9) -- shipped 2026-03-02
- v1.1 Design Overhaul (Phases 10-17) -- in progress

## Phases

<details>
<summary>v1.0 Functional Foundation (Phases 1-9) -- SHIPPED 2026-03-02</summary>

- [x] **Phase 3: Structural Cleanup** - Strip i18n, Cursor backend from codebase; build provider UX
- [x] **Phase 5: Chat Message Architecture** - Shiki, TurnBlock, tool call cards, thinking disclosures
- [x] **Phase 6: Chat Message Polish** - Diffs, user messages, permissions, usage, layout
- [x] **Phase 7: Streaming UX** - Aurora shimmer, scroll anchor, scroll pill, typing indicators, reconnect skeletons
- [x] **Phase 8: Error Handling and Status** - Phase context captured, folded into v1.1 scope

Phases 1, 2, 4, 9 were deferred visual phases -- superseded by v1.1 requirements.

</details>

### v1.1 Design Overhaul

**Milestone Goal:** Transform every surface with a charcoal + dusty rose palette, complete remaining functional features (streaming status, error handling), and achieve A+ craft quality across density, animations, typography, and spacing.

**Phase Numbering:**
- Integer phases (10, 11, 12...): Planned milestone work
- Decimal phases (12.1, 12.2): Urgent insertions (marked with INSERTED)

**Sequential foundation (strict order):**
- [x] **Phase 10: Design System Foundation** - Charcoal palette, surface elevation, rose accent tokens, borders, focus glow, scrollbars (completed 2026-03-03)
- [x] **Phase 11: Hardcoded Color Sweep** - Replace all 51+ hex refs and 371 gray/slate/zinc classes with semantic tokens (completed 2026-03-03)
- [x] **Phase 12: Specialty Surfaces** - Terminal Catppuccin Mocha, CodeMirror theme, Shiki remap, diff viewer, typography (completed 2026-03-03)

**Independent component work (after foundation):**
- [ ] **Phase 13: Message Experience** - Hidden-hover actions, full-width messages, spacing, entrance animations, streaming fade
- [x] **Phase 14: Toast & Overlay System** - Z-index scale, Sonner toasts, WebSocket status toasts, glassmorphic blur, portals (completed 2026-03-03)
- [x] **Phase 15: Tool Call Display** - Action pills, pulsing indicators, collapse states, error expansion, accordion grouping (completed 2026-03-03)
- [x] **Phase 16: Sidebar & Global Polish** - Sidebar restyle, settings, mobile nav, modals, session grouping, collapse mode (completed 2026-03-04)
- [ ] **Phase 17: Streaming & Status** - RAF buffer, smart auto-scroll, scroll pill, typing/thinking indicators, status line, stop button

## Phase Details

### Phase 10: Design System Foundation
**Goal**: The app renders with a charcoal base palette, dusty rose accent, and a complete CSS variable token system that all subsequent phases build on
**Depends on**: v1.0 complete
**Requirements**: DSGN-09, DSGN-10, DSGN-11, DSGN-12, DSGN-13, DSGN-14, DSGN-15
**Success Criteria** (what must be TRUE):
  1. Opening the app shows charcoal base (#1a1a1a) with 3-4 tier surface elevation (base, cards, elevated, overlays) -- not the previous warm brown palette
  2. Dusty rose accent appears sparingly on interactive elements (buttons, links, active states) and a lighter WCAG AA-compliant variant renders legibly as text on charcoal backgrounds
  3. All borders throughout the app are subtle white at 6-10% opacity -- no hard solid borders visible anywhere
  4. Input fields show a dusty rose focus glow ring on focus, text selection uses rose at 25% opacity, and scrollbars are thin/subtle matching the charcoal surfaces
  5. Tailwind transition utilities work correctly throughout the app -- the global `transition: none` reset is resolved
**Plans**: 3 plans

Plans:
- [ ] 10-01-PLAN.md -- Token palette swap + Tailwind config + transition fix
- [ ] 10-02-PLAN.md -- Focus glow, text selection, scrollbar restyle, ambient gradient, hardcoded color fixes
- [ ] 10-03-PLAN.md -- Visual verification checkpoint

### Phase 11: Hardcoded Color Sweep
**Goal**: Every color reference in the codebase uses semantic CSS variable aliases -- zero hardcoded hex values or generic Tailwind color utilities remain
**Depends on**: Phase 10
**Requirements**: COLR-01, COLR-02, COLR-03
**Success Criteria** (what must be TRUE):
  1. A grep for arbitrary hex values in Tailwind classes (`bg-[#`, `text-[#`, `border-[#`) returns zero matches across the entire codebase
  2. A grep for generic gray/slate/zinc/neutral Tailwind utilities returns zero matches -- all replaced with Loom semantic palette aliases
  3. Every visible surface -- chat, sidebar, file explorer, git panel, settings, terminal wrapper -- displays the charcoal + rose palette with no warm brown, blue, or gray artifacts
**Plans**: 5 plans

Plans:
- [ ] 11-01-PLAN.md -- Token additions (foreground-secondary, status-info, diff-added/removed) + Tailwind config
- [ ] 11-02-PLAN.md -- Hardcoded hex sweep + gray utilities in chat/ and shell/ components (~38 files)
- [ ] 11-03-PLAN.md -- Gray utilities in settings/, code-editor/, sidebar/, file-tree/ components (~21 files)
- [ ] 11-04-PLAN.md -- Gray + blue/red/green/amber sweep in TaskMaster JSX files (~16 files)
- [ ] 11-05-PLAN.md -- COLR-03 verification audit, straggler fixes, human visual verification

### Phase 12: Specialty Surfaces
**Goal**: Third-party embedded surfaces (terminal, code editor, syntax highlighting, diffs, markdown prose) all match the charcoal + rose palette -- no visual seams between app and embedded content
**Depends on**: Phase 11
**Requirements**: SURF-01, SURF-02, SURF-03, SURF-04, SURF-05, SURF-06
**Success Criteria** (what must be TRUE):
  1. The terminal background matches the app charcoal base -- the terminal appears integrated, not an embedded black box -- and uses Catppuccin Mocha ANSI colors for command output
  2. The terminal uses JetBrains Mono at 14px with a bar cursor and 1.2 line height
  3. The CodeMirror file viewer uses a charcoal + rose dark theme consistent with the app palette -- no default dark theme artifacts
  4. Syntax highlighting (Shiki) and diff viewer colors match the new palette -- no warm brown/amber color remnants from v1.0
  5. Markdown prose content uses rose accent for links and correct heading hierarchy colors on charcoal backgrounds
**Plans**: TBD

Plans:
- [ ] 12-01: TBD
- [ ] 12-02: TBD
- [ ] 12-03: TBD

### Phase 13: Message Experience
**Goal**: Chat messages feel crafted with intentional density, motion, and interaction patterns that match Claude.ai and ChatGPT quality
**Depends on**: Phase 10 (palette tokens), Phase 12 (all surfaces consistent)
**Requirements**: MESG-01, MESG-02, MESG-03, MESG-04, MESG-05, MESG-06
**Success Criteria** (what must be TRUE):
  1. Message action buttons (copy, etc.) are invisible by default and smoothly fade in on hover -- reducing visual clutter in the message list
  2. Assistant messages span full width with transparent background and a role label only -- no bubble wrapper or card container
  3. 32px spacing separates different turns while messages within the same turn are tightly grouped -- the visual rhythm matches Claude.ai density
  4. New messages animate in with a subtle slide-up + fade entrance that feels natural, not distracting -- and streaming tokens fade in during batch rendering
  5. Interactive elements (buttons, links, expandables) show dusty rose hover glow and subtle press feedback
**Plans**: TBD

Plans:
- [ ] 13-01: TBD
- [ ] 13-02: TBD
- [ ] 13-03: TBD

### Phase 14: Toast & Overlay System
**Goal**: The app has a formal layering system and non-disruptive notification infrastructure -- toasts for transient events, portals for overlays, glassmorphic blur for floating elements
**Depends on**: Phase 10 (palette tokens)
**Requirements**: TOST-01, TOST-02, TOST-03, TOST-04, TOST-05
**Success Criteria** (what must be TRUE):
  1. Toast notifications appear bottom-right with charcoal + rose theming, auto-dismiss after 2-4 seconds, and do not block the chat interface
  2. A formal z-index scale exists as CSS custom properties and all layered elements (sticky headers, dropdowns, modals, toasts) respect the scale without conflicts
  3. WebSocket disconnect shows a warning toast and reconnect shows a success toast -- connection state changes are always communicated
  4. Modals, toasts, and dropdowns use glassmorphic blur styling, while scrolling content does not -- floating vs. inline elements are visually distinct
  5. All overlay elements render via ReactDOM.createPortal to document.body -- no stacking context conflicts cause overlays to appear behind content
**Plans**: 3 plans

Plans:
- [x] 14-01-PLAN.md -- Z-index scale, Sonner & portal infrastructure (7-tier CSS variable scale, toast provider, OverlayPortal, 16-file migration)
- [x] 14-02-PLAN.md -- Modal portal migration (18 modals to OverlayPortal + formal z-index + backdrop standardization)
- [x] 14-03-PLAN.md -- WebSocket toasts & glassmorphic dropdowns (useWebSocketToasts hook, 7 dropdown glass treatments)

### Phase 15: Tool Call Display
**Goal**: Tool call invocations are compact, informative, and scannable -- running/complete/failed states are instantly distinguishable, and sequential calls group into manageable accordions
**Depends on**: Phase 10 (palette tokens), Phase 14 (z-index scale for any overlays)
**Requirements**: TOOL-01, TOOL-02, TOOL-03, TOOL-04, TOOL-05
**Success Criteria** (what must be TRUE):
  1. Tool calls display as compact action pills showing icon + tool name + semantic state color -- not as verbose text blocks
  2. Running tool calls show a pulsing dusty rose indicator that is visually distinct from completed and failed states
  3. Completed tool calls collapse to a minimal chip, failed tool calls expand with a muted red background showing the error message
  4. Three or more sequential tool calls group into an accordion with a count badge -- expandable to show individual pills, collapsed by default
**Plans**: 2 plans

Plans:
- [ ] 15-01-PLAN.md -- ToolActionCard pill shape, state-driven borders, pulse animation, auto-expand errors
- [ ] 15-02-PLAN.md -- ToolCallGroup pill header, count badges, state-aware auto-expand/collapse

### Phase 16: Sidebar & Global Polish
**Goal**: Every non-chat surface -- sidebar, settings, modals, mobile nav -- matches the charcoal + rose palette with density improvements and polished interactions
**Depends on**: Phase 10 (palette tokens), Phase 14 (z-index scale, glassmorphic blur pattern)
**Requirements**: SIDE-01, SIDE-02, SIDE-03, SIDE-04, SIDE-05, SIDE-06, SIDE-07
**Success Criteria** (what must be TRUE):
  1. The sidebar uses the charcoal palette with tighter spacing -- more sessions visible without scrolling than the pre-redesign baseline
  2. Sessions are grouped by time categories (Today, Yesterday, Last 7 Days, Older) and the active session shows a 2px dusty rose left border with subtle background tint
  3. The sidebar collapses to an icon-only strip that preserves session navigation
  4. Settings panel, all modals, and all dialogs use charcoal palette with glassmorphic blur -- no gray/blue/white artifacts remain
  5. Mobile navigation at 375px+ viewports matches the charcoal + rose theme with no layout or color inconsistencies
**Plans**: 3 plans

Plans:
- [x] 16-01-PLAN.md -- Time-grouped session list, compact density, rose active indicator (SIDE-01, SIDE-05, SIDE-06)
- [x] 16-02-PLAN.md -- Charcoal+rose settings panel, glassmorphic modal backdrops (SIDE-02, SIDE-04)
- [x] 16-03-PLAN.md -- Rose pill mobile nav, expanded collapsed sidebar strip (SIDE-03, SIDE-07)

### Phase 17: Streaming & Status
**Goal**: Streaming responses feel smooth and communicative -- token buffering prevents jank, scroll behavior respects user control, the current AI activity is always visible, and the user can stop generation at any time
**Depends on**: Phase 10 (palette tokens), Phase 13 (message animations established)
**Requirements**: STRM-01, STRM-02, STRM-03, STRM-04, STRM-05, STRM-06, STRM-08, STRM-09, STRM-10, STRM-11, STRM-12
**Success Criteria** (what must be TRUE):
  1. During a long AI response, scrolling up pauses auto-scroll immediately and the view stays wherever the user scrolled -- no snapping back
  2. When scrolled up during a response, a floating pill shows "N new messages" count -- clicking it scrolls to bottom smoothly
  3. A typing indicator (pulsing dots or similar) appears before the first token, a "Thinking..." indicator appears during extended thinking, and both transition seamlessly into content without layout jumps
  4. Skeleton shimmer bars appear during reconnect scrollback, fading to real content when parsed
  5. The global status line shows semantic activity text ("Reading auth.ts...", "Writing server.ts...") parsed from tool events, with a spinner on the active tool card
  6. The send button morphs to a stop button during streaming via CSS crossfade -- clicking stop aborts generation via WebSocket and the response ends cleanly
  7. Permanent errors (process crash, exit code) display as persistent inline banners with red accent -- visually distinct from toasts and regular messages
**Plans**: 4 plans

Plans:
- [ ] 17-01-PLAN.md -- Scroll rewrite (event-based), message-counting pill, rAF buffer tuning (STRM-01, STRM-02, STRM-03)
- [ ] 17-02-PLAN.md -- Atmospheric aurora indicators, thinking transitions, reconnect skeletons (STRM-04, STRM-05, STRM-06)
- [ ] 17-03-PLAN.md -- Status line below composer, activity hook, send/stop morph (STRM-09, STRM-10, STRM-11, STRM-12)
- [ ] 17-04-PLAN.md -- Error banners, active tool card border glow (STRM-08)

## Progress

**Execution Order:**
Phases 10-12 are strictly sequential (design system -> color sweep -> specialty surfaces).
Phases 13-17 are largely independent but Phase 14 (z-index scale) should precede overlay work in other phases.
Recommended order: 10 -> 11 -> 12 -> 14 -> 13 -> 15 -> 16 -> 17

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 10. Design System Foundation | 3/3 | Complete    | 2026-03-03 | - |
| 11. Hardcoded Color Sweep | 5/5 | Complete   | 2026-03-03 | - |
| 12. Specialty Surfaces | 4/4 | Complete    | 2026-03-03 | - |
| 13. Message Experience | v1.1 | 0/TBD | Not started | - |
| 14. Toast & Overlay System | v1.1 | 3/3 | Complete | 2026-03-03 |
| 15. Tool Call Display | 2/2 | Complete   | 2026-03-03 | - |
| 16. Sidebar & Global Polish | v1.1 | 3/3 | Complete | 2026-03-04 |
| 17. Streaming & Status | 3/4 | In Progress|  | - |
