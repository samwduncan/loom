# Roadmap: Loom V2

## Milestones

- [x] **v1.0 "The Skeleton"** - Phases 1-10 (shipped 2026-03-07)
- [ ] **v1.1 "The Chat"** - Phases 11-19 (in progress)

## Phases

<details>
<summary>v1.0 "The Skeleton" (Phases 1-10) - SHIPPED 2026-03-07</summary>

- [x] Phase 1: Design Token System (3/3 plans) - completed 2026-03-05
- [x] Phase 2: Enforcement + Testing Infrastructure (3/3 plans) - completed 2026-03-05
- [x] Phase 3: App Shell + Error Boundaries (2/2 plans) - completed 2026-03-05
- [x] Phase 4: State Architecture (2/2 plans) - completed 2026-03-05
- [x] Phase 5: WebSocket Bridge + Stream Multiplexer (2/2 plans) - completed 2026-03-06
- [x] Phase 6: Streaming Engine + Scroll Anchor (2/2 plans) - completed 2026-03-06
- [x] Phase 7: Tool Registry + Proof of Life (2/2 plans) - completed 2026-03-06
- [x] Phase 8: Navigation + Session Management (2/2 plans) - completed 2026-03-06
- [x] Phase 9: E2E Integration Wiring + Playwright Verification (2/2 plans) - completed 2026-03-06
- [x] Phase 10: Pre-Archive Cleanup (1/1 plan) - completed 2026-03-07

</details>

### v1.1 "The Chat" (In Progress)

**Milestone Goal:** Build the complete conversation experience -- every message type renders, tools display with state machines, markdown is syntax-highlighted, the composer works, and you can have a full conversation.

**Phase Numbering:**
- Integer phases (11, 12, 13...): Planned milestone work
- Decimal phases (12.1, 12.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 11: Markdown + Code Blocks + UI Primitives** - Finalized message rendering with react-markdown, Shiki, code block UI, and shadcn/ui foundation (completed 2026-03-07)
- [x] **Phase 12: Streaming Markdown + Marker Interleaving** - Two-phase rendering, marker-based tool chip placement, Streamdown evaluation (completed 2026-03-07)
- [x] **Phase 13: Composer** - Auto-resize textarea, image paste/drop, send/stop morph, keyboard shortcuts, draft preservation (completed 2026-03-07)
- [ ] **Phase 14: Message Types** - All 7 message types rendering with correct styling and layout
- [ ] **Phase 15: Tool Card Shell + State Machine** - Tool state machine, ToolCardShell wrapper, elapsed time counter
- [ ] **Phase 16: Per-Tool Cards** - Rich card implementations for Bash, Read, Edit, Write, Glob, Grep with syntax highlighting and diff views
- [ ] **Phase 17: Tool Grouping + Permissions** - Consecutive tool call accordion and permission request banners with Allow/Deny
- [ ] **Phase 18: Activity, Scroll, Polish** - Activity status line, scroll preservation, message entrance animations, streaming cursor, content-visibility
- [ ] **Phase 19: Visual Effects + Enhancements** - Cherry-picked CSS effects, thinking markdown, error retry, message search, conversation export

## Phase Details

### Phase 11: Markdown + Code Blocks + UI Primitives
**Goal**: Finalized assistant messages render rich markdown with syntax-highlighted code blocks, shadcn/ui primitives available for all subsequent phases
**Depends on**: Nothing (first phase of M2 -- extends M1 AssistantMessage)
**Requirements**: DEP-01, DEP-02, DEP-03, DEP-04, DEP-05, MD-01, MD-02, MD-03, MD-04, MD-05, MD-06, CODE-01, CODE-02, CODE-03, CODE-04, CODE-05, CODE-06, CODE-07, CODE-08, CODE-09, UI-01, UI-02, UI-03
**Success Criteria** (what must be TRUE):
  1. A finalized assistant message with bold, italic, lists, links, headings, blockquotes, and GFM tables renders with full formatting -- not raw markdown text
  2. Fenced code blocks display with Shiki syntax highlighting, language label, copy button, and line numbers for blocks over 3 lines
  3. Code blocks with unknown languages render immediately as plain monospace text, then swap to highlighted when the grammar loads -- no layout shift, no blocking
  4. Long code blocks cap at 400px with inner scroll; long lines scroll horizontally without wrapping
  5. Inline code spans render with surface-1 background and monospace font, visually distinct from surrounding text
  6. shadcn/ui components (dialog, tooltip, scroll-area, collapsible, sonner, dropdown-menu, badge, kbd, separator) are installed and restyled to OKLCH tokens -- no default shadcn colors remain
**Plans**: 3 plans

Plans:
- [ ] 11-01-PLAN.md -- Dependencies + shadcn/ui init + OKLCH restyling
- [ ] 11-02-PLAN.md -- Shiki singleton + OKLCH theme + CodeBlock component
- [ ] 11-03-PLAN.md -- MarkdownRenderer + AssistantMessage integration

### Phase 12: Streaming Markdown + Marker Interleaving
**Goal**: Active streaming shows lightweight formatted text, finalized messages transition smoothly to full markdown with tool chips correctly placed inline via markers, and Streamdown is evaluated as an alternative
**Depends on**: Phase 11
**Requirements**: MD-10, MD-11, MD-12, MD-13, MD-14, MD-15, ENH-01
**Success Criteria** (what must be TRUE):
  1. During active streaming, text renders at 60fps with basic formatting (bold, italic, code spans) -- not raw markdown source
  2. Unclosed code fences during streaming render as a code block container that fills in as tokens arrive -- no broken layout
  3. The transition from streaming to finalized markdown is visually smooth with no flash or layout jump (200ms+ masked transition)
  4. Tool chips render at correct inline positions within finalized markdown content via marker-based interleaving -- not orphaned at bottom of message
  5. Streamdown evaluated as alternative streaming renderer -- decision documented with rationale (adopt or stick with two-phase)
**Plans**: 3 plans

Plans:
- [ ] 12-01-PLAN.md -- Streaming markdown converter + DOMPurify + useStreamBuffer innerHTML wiring
- [ ] 12-02-PLAN.md -- Crossfade transition + rehype tool markers + MarkdownRenderer integration
- [ ] 12-03-PLAN.md -- Streamdown evaluation prototype + comparison

### Phase 13: Composer
**Goal**: Users can compose multiline messages with image attachments and keyboard shortcuts
**Depends on**: Phase 11 (for testing with formatted responses)
**Requirements**: CMP-01, CMP-02, CMP-03, CMP-04, CMP-05, CMP-06, CMP-07, CMP-08, CMP-09, CMP-10, CMP-11, CMP-12, CMP-13, CMP-14
**Success Criteria** (what must be TRUE):
  1. Textarea auto-grows from 1 line to ~200px as user types, then scrolls internally -- CSS Grid layout remains stable
  2. Enter sends message, Shift+Enter inserts newline, Cmd+. stops active generation, Escape clears input
  3. Send button morphs to Stop button during streaming with no position jump, and the state machine prevents double-send and double-stop
  4. User can paste or drag-and-drop up to 5 images, see thumbnail previews, remove individual images, and images upload to backend on send
  5. Draft text survives session switches and page reloads
**Plans**: 3 plans

Plans:
- [ ] 13-01-PLAN.md -- Core composer: auto-resize textarea, 5-state FSM, keyboard shortcuts, floating pill layout
- [ ] 13-02-PLAN.md -- Image attachments: paste, drag-drop, thumbnails, base64 WebSocket send
- [ ] 13-03-PLAN.md -- Draft persistence + sidebar draft dot indicator

### Phase 14: Message Types
**Goal**: Every message type in a real conversation renders with correct styling and layout
**Depends on**: Phase 11 (assistant messages need MarkdownRenderer), Phase 12 (shadcn primitives for tooltips, collapsible)
**Requirements**: MSG-01, MSG-02, MSG-03, MSG-04, MSG-05, MSG-06, MSG-07, MSG-08, MSG-09, MSG-10, MSG-11
**Success Criteria** (what must be TRUE):
  1. User messages show with card background and hover timestamp; assistant messages show with provider logo and formatted markdown content
  2. Error messages display as inline banners with red accent; system messages display centered and muted; task notifications show with distinct icon
  3. Thinking blocks expand/collapse with CSS Grid animation, show character count when collapsed and duration when available, and respect the global thinking toggle
  4. Image blocks display as thumbnails that expand in a lightbox overlay on click
  5. Historical messages loaded from backend look identical to messages that were streamed in the current session
**Plans**: 3 plans

Plans:
- [ ] 14-01-PLAN.md -- MessageContainer expansion + Error/System/TaskNotification components + 5-way dispatch
- [ ] 14-02-PLAN.md -- ThinkingDisclosure refactor + provider logos + global thinking toggle + AssistantMessage wiring
- [ ] 14-03-PLAN.md -- UserMessage enhancements + ImageThumbnailGrid + ImageLightbox + MarkdownRenderer img override

### Phase 15: Tool Card Shell + State Machine
**Goal**: Tool calls display with state machine animations and consistent card wrapper
**Depends on**: Phase 11 (MarkdownRenderer for card content), Phase 12 (marker interleaving for inline placement), Phase 14 (MessageContainer for layout context)
**Requirements**: TOOL-01, TOOL-02, TOOL-03, TOOL-04, TOOL-05, TOOL-06
**Success Criteria** (what must be TRUE):
  1. Tool calls transition through invoked/executing/resolved/error states with visual CSS transitions -- pulsing dot during execution, static green/red on completion
  2. Executing tools show elapsed time counter that updates live ("1.2s", "5.4s") and cleans up on resolve/error
  3. Error tool cards force-expand with red accent and error message text -- never auto-collapsed
  4. ToolCardShell provides consistent header/footer/expand behavior; DefaultToolCard handles unregistered tools
**Plans**: 3 plans

Plans:
- [ ] 15-01: TBD
- [ ] 15-02: TBD

### Phase 16: Per-Tool Cards
**Goal**: Each tool type has a rich, purpose-built card showing its specific output format
**Depends on**: Phase 15 (ToolCardShell), Phase 11 (Shiki for ReadToolCard/WriteToolCard highlighting)
**Requirements**: TOOL-10, TOOL-11, TOOL-12, TOOL-13, TOOL-14, TOOL-15, ENH-02
**Success Criteria** (what must be TRUE):
  1. BashToolCard shows command with `$` prefix and terminal-styled output with ANSI color support, truncated at ~50 lines with "Show more"
  2. ReadToolCard shows file path with icon, syntax-highlighted content with line numbers, truncated at ~100 lines with "Show more"
  3. EditToolCard shows unified diff with green additions, red deletions, and dual line numbers
  4. WriteToolCard shows file path with icon and syntax-highlighted content preview (first ~20 lines)
  5. GlobToolCard shows pattern and bulleted file list with count; GrepToolCard shows pattern, match context with highlighted match terms
**Plans**: 3 plans

Plans:
- [ ] 16-01: TBD
- [ ] 16-02: TBD
- [ ] 16-03: TBD

### Phase 17: Tool Grouping + Permissions
**Goal**: Consecutive tool calls collapse into manageable groups, and permission requests render as actionable inline banners
**Depends on**: Phase 15 (ToolChip/ToolCard components), Phase 12 (shadcn collapsible)
**Requirements**: TOOL-20, TOOL-21, TOOL-22, TOOL-23, PERM-01, PERM-02, PERM-03, PERM-04, PERM-05
**Success Criteria** (what must be TRUE):
  1. Two or more consecutive tool calls collapse into an accordion showing "N tool calls" with tool type summary, expandable via CSS Grid animation
  2. Error tool calls within a group are always force-expanded and visible even when the group is collapsed
  3. Permission request banners appear inline above the composer with tool name, input preview, and Allow/Deny buttons
  4. Permission banners show countdown timer (55s default), auto-dismiss on timeout or backend cancellation, and only one banner displays at a time
**Plans**: 3 plans

Plans:
- [ ] 17-01: TBD
- [ ] 17-02: TBD

### Phase 18: Activity, Scroll, Polish
**Goal**: The chat experience feels complete and polished -- activity feedback, smooth scrolling, entrance animations, and streaming cursor
**Depends on**: Phase 14 (all message types built), Phase 16 (dynamic-height tool cards for scroll testing)
**Requirements**: ACT-01, ACT-02, ACT-03, ACT-04, ACT-05, NAV-01, NAV-02, NAV-03, NAV-04, DEP-06, POL-01, POL-02, POL-03, POL-04
**Success Criteria** (what must be TRUE):
  1. Activity status line shows current tool action ("Reading auth.ts...") below message list, fades in/out smoothly, and never causes scroll height changes
  2. Token/cost display appears below each finalized assistant message showing input/output tokens and cost
  3. Scroll position is preserved per session -- switching away and back restores exact scroll position via useLayoutEffect
  4. Scroll-to-bottom pill appears when scrolled up 200px+ with unread count badge; auto-scroll locks to bottom during streaming even when code blocks or tool cards expand
  5. New messages animate in with fade + slide-from-bottom (respecting prefers-reduced-motion); streaming cursor pulses at end of active text with primary accent color
**Plans**: 3 plans

Plans:
- [ ] 18-01: TBD
- [ ] 18-02: TBD
- [ ] 18-03: TBD

### Phase 19: Visual Effects + Enhancements
**Goal**: Cherry-picked visual effects elevate the interface and enhanced features round out the chat experience
**Depends on**: Phase 18 (all core chat features complete)
**Requirements**: UI-04, UI-05, ENH-03, ENH-04, ENH-05, ENH-06
**Success Criteria** (what must be TRUE):
  1. SpotlightCard hover effect works on tool cards and sidebar items; ShinyText effect on status indicators; ElectricBorder on composer during streaming -- all using design tokens only
  2. Thinking block content renders basic inline markdown (bold, italic, code spans) via lightweight parser
  3. Error messages include a "Retry" button that resends the last user message
  4. User can search within a session to filter/highlight messages matching search text
  5. User can export a conversation as Markdown or JSON file
**Plans**: 3 plans

Plans:
- [ ] 19-01: TBD
- [ ] 19-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 11 -> 11.1 -> 12 -> 12.1 -> 13 -> ... -> 19

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Design Token System | v1.0 | 3/3 | Complete | 2026-03-05 |
| 2. Enforcement + Testing | v1.0 | 3/3 | Complete | 2026-03-05 |
| 3. App Shell + Error Boundaries | v1.0 | 2/2 | Complete | 2026-03-05 |
| 4. State Architecture | v1.0 | 2/2 | Complete | 2026-03-05 |
| 5. WebSocket Bridge + Multiplexer | v1.0 | 2/2 | Complete | 2026-03-06 |
| 6. Streaming Engine + Scroll | v1.0 | 2/2 | Complete | 2026-03-06 |
| 7. Tool Registry + Proof of Life | v1.0 | 2/2 | Complete | 2026-03-06 |
| 8. Navigation + Sessions | v1.0 | 2/2 | Complete | 2026-03-06 |
| 9. E2E Integration + Playwright | v1.0 | 2/2 | Complete | 2026-03-06 |
| 10. Pre-Archive Cleanup | v1.0 | 1/1 | Complete | 2026-03-07 |
| 11. Markdown + Code Blocks | 3/3 | Complete    | 2026-03-07 | - |
| 12. Streaming Markdown + Marker Interleaving | 3/3 | Complete    | 2026-03-07 | - |
| 13. Composer | v1.1 | Complete    | 2026-03-07 | 2026-03-07 |
| 14. Message Types | 1/3 | In Progress|  | - |
| 15. Tool Card Shell + Interleaving | v1.1 | 0/? | Not started | - |
| 16. Per-Tool Cards | v1.1 | 0/? | Not started | - |
| 17. Tool Grouping + Permissions | v1.1 | 0/? | Not started | - |
| 18. Activity, Scroll, Polish | v1.1 | 0/? | Not started | - |
| 19. Visual Effects + Enhancements | v1.1 | 0/? | Not started | - |

---
*Created: 2026-03-07*
*Last updated: 2026-03-07*
