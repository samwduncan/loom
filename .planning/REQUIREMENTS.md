# Requirements: Loom

**Defined:** 2026-03-03
**Core Value:** The chat interface must feel designed, not generated — every interaction, animation, and pixel serves the developer experience.

## v1.1 Requirements

Requirements for the Design Overhaul milestone. Charcoal + dusty rose palette, A+ craft quality, complete experience.

### Design System (DSGN)

- [ ] **DSGN-09**: App uses charcoal base palette with 3-4 tier surface elevation — base (#1a1a1a), cards, elevated, overlays — using background lightness steps, not drop shadows
- [ ] **DSGN-10**: Dusty rose accent (~#D4736C range) applied sparingly (≤5% of surface area) with a lighter WCAG AA-compliant variant for text use on charcoal backgrounds
- [ ] **DSGN-11**: All hard borders replaced with subtle white at 6-10% opacity — invisible borders are the defining "premium vs generic" signal
- [ ] **DSGN-12**: Input fields show dusty rose focus glow ring (box-shadow with accent at 15% opacity)
- [ ] **DSGN-13**: Custom text selection color using dusty rose at 25% opacity
- [ ] **DSGN-14**: Scrollbars themed for charcoal palette — thin, subtle, matching dark surfaces
- [ ] **DSGN-15**: Global `transition: none` reset in index.css resolved so Tailwind transition utilities work correctly throughout app

### Color Migration (COLR)

- [ ] **COLR-01**: All 51+ hardcoded hex values in Tailwind arbitrary classes (bg-[#hex], text-[#hex]) replaced with semantic CSS variable references
- [ ] **COLR-02**: All 371+ generic gray/slate/zinc/neutral Tailwind utility classes replaced with Loom semantic palette aliases
- [ ] **COLR-03**: Grep audit for hardcoded color references returns zero matches across entire codebase — 100% palette consistency

### Specialty Surfaces (SURF)

- [ ] **SURF-01**: xterm.js terminal uses Catppuccin Mocha ANSI palette on charcoal base — terminal background matches app, not an embedded black box
- [ ] **SURF-02**: Terminal uses JetBrains Mono font, bar cursor, 14px font size, 1.2 line height
- [ ] **SURF-03**: CodeMirror file viewer uses charcoal + rose dark theme consistent with app palette
- [ ] **SURF-04**: Shiki syntax highlighting color replacement map updated for charcoal palette
- [ ] **SURF-05**: Diff viewer (react-diff-viewer-continued) theme updated with charcoal + rose colors
- [ ] **SURF-06**: Markdown prose content (Tailwind Typography) uses rose accent for links and correct heading colors on charcoal

### Message Experience (MESG)

- [ ] **MESG-01**: Message action buttons (copy, etc.) hidden by default, appear on hover with smooth opacity transition
- [ ] **MESG-02**: Full-width assistant messages with transparent background — no bubble wrapper, role label only
- [ ] **MESG-03**: 32px inter-turn spacing between messages, tight spacing within turns for visual grouping
- [ ] **MESG-04**: Messages animate in with subtle slide-up + fade entrance (translateY(8px) + opacity, ~250ms, CSS spring bezier)
- [ ] **MESG-05**: Interactive elements show dusty rose hover glow and subtle active:scale press feedback
- [ ] **MESG-06**: Streaming tokens fade in with opacity transition during batch rendering

### Toast & Overlay System (TOST)

- [ ] **TOST-01**: Toast notifications (Sonner) for transient events — consistently positioned bottom-right, auto-dismiss after 2-4s, charcoal + rose theme
- [ ] **TOST-02**: Formal z-index scale established via CSS custom properties — consistent layering from sticky elements through critical overlays
- [ ] **TOST-03**: WebSocket disconnect shown as warning toast, reconnect shown as success toast
- [ ] **TOST-04**: Floating elements (modals, toasts, dropdowns) use glassmorphic blur styling — NOT on scrolling content
- [ ] **TOST-05**: All overlay elements use ReactDOM.createPortal to document.body — no stacking context conflicts

### Tool Call Display (TOOL)

- [ ] **TOOL-01**: Tool call invocations display as compact action pills — icon + tool name + semantic state color
- [ ] **TOOL-02**: Running tool calls show pulsing dusty rose indicator
- [ ] **TOOL-03**: Completed tool calls collapse to minimal chip with success state
- [ ] **TOOL-04**: Failed tool calls expand with muted red background and error message visible
- [ ] **TOOL-05**: 3+ sequential tool calls group into accordion with count badge, expandable to show individual pills

### Sidebar & Global (SIDE)

- [ ] **SIDE-01**: Sidebar fully restyled with charcoal palette, density improvements, and tighter spacing
- [ ] **SIDE-02**: Settings panel fully matches charcoal + rose theme — no gray/blue/white artifacts
- [ ] **SIDE-03**: Mobile navigation matches charcoal + rose theme at 375px+ viewports
- [ ] **SIDE-04**: All modals and dialogs use charcoal palette with glassmorphic blur backgrounds
- [ ] **SIDE-05**: Session list grouped by time categories (Today, Yesterday, Last 7 Days, Older)
- [ ] **SIDE-06**: Active session shows 2px dusty rose left border with subtle bg-accent tinted background
- [ ] **SIDE-07**: Sidebar collapses to icon-only strip with session icons

### Streaming & Status (STRM)

- [ ] **STRM-01**: Token streaming uses requestAnimationFrame buffer (50-100ms batching) — no per-token setState freezing
- [ ] **STRM-02**: Smart auto-scroll — auto-scroll at bottom (10px threshold), stops when user scrolls up, CSS overflow-anchor for position preservation
- [ ] **STRM-03**: Floating scroll-to-bottom pill with "N new messages" count — appears when scrolled away, click scrolls to bottom
- [ ] **STRM-04**: Typing indicator (pulsing dots or similar) before first token, transitions seamlessly into streaming content
- [ ] **STRM-05**: Pulsing "Thinking..." indicator during extended thinking — transitions into collapsed thinking block when complete
- [ ] **STRM-06**: Skeleton shimmer placeholder bars during reconnect scrollback — fades to real content when parsed
- [ ] **STRM-08**: Inline banner for permanent errors (process crash, exit code) — persistent, red-accented, distinct from toast
- [ ] **STRM-09**: Global status line showing current activity — tool name + argument with spinner on active card
- [ ] **STRM-10**: Stop generation button replaces send button during streaming — sends abort via WebSocket
- [ ] **STRM-11**: Semantic activity text in status line — "Reading auth.ts...", "Writing server.ts..." parsed from tool events
- [ ] **STRM-12**: Send-to-stop button morph uses CSS crossfade transition — no layout jump when switching

## v1.0 Requirements (Validated)

Shipped in milestone v1.0 and confirmed working.

- ✓ **DSGN-01** through **DSGN-05**, **DSGN-07**, **DSGN-08** — CSS variable system, typography, density, scrollbars, status colors, borders (Phase 1)
- ✓ **CHAT-01** through **CHAT-16** — Full chat rendering: Shiki highlighting, collapsible turns, tool cards, thinking disclosures, diffs, user messages, permissions, usage, system status, layout (Phases 5, 6)
- ✓ **FORK-01** through **FORK-05** — i18n stripped, Cursor removed, Codex kept, upstream-sync, GPL-3.0 attribution (Phases 1, 3)

**Note:** v1.0 DSGN-06 (color sweep for warm earthy palette) superseded by v1.1 COLR-01/02/03 (charcoal palette). v1.0 TERM-01 through TERM-04 superseded by v1.1 SURF-01 through SURF-03. v1.0 SIDE-01 through SIDE-04 rewritten for v1.1 charcoal palette. v1.0 STRM-07 (transient error toasts) absorbed into TOST-01.

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Companion System

- **COMP-01**: Animated pixel art companion mascots (Spool the Shiba Inu and friends)
- **COMP-02**: Companion reacts to chat events (celebrations, errors, thinking)
- **COMP-03**: Multiple companion species selectable by user

### Advanced Features

- **ADV-01**: Keyboard shortcut system (Cmd+K palette, Cmd+Enter send, Cmd+/ toggle sidebar)
- **ADV-02**: Session search and filtering
- **ADV-03**: Split-pane view (terminal + chat side by side)
- **ADV-04**: Custom theme editor (user-configurable color palette)
- **ADV-05**: Plugin/extension system for custom chat renderers
- **ADV-06**: Context window gauge visualization
- **ADV-07**: UI density toggle (compact/comfortable/spacious)
- **ADV-08**: Command palette (Cmd+K)
- **ADV-09**: Font customization

## Out of Scope

| Feature | Reason |
|---------|--------|
| Light mode / theme switching | Single dark theme is the brand identity |
| Warm earthy palette | Superseded by charcoal + dusty rose in v1.1 |
| Additional AI providers beyond Claude/Codex/Gemini | Focused scope |
| Mobile-native app | Web PWA is sufficient |
| Video/voice features | Text-first tool |
| Self-hosted auth complexity (OAuth, SSO) | JWT is sufficient for self-hosted |
| Typewriter effect | Anti-pattern — jarring, slow, outdated |
| Modal permission dialogs | Anti-pattern — breaks flow; inline banners instead |
| Conversation branching / tree view | Wrong mental model for coding assistant |
| Right-side artifact panel | Conflicts with 720px centered rail layout |
| Model comparison side-by-side | Unnecessary for 2-model product |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| (Populated by roadmapper) | | |

**Coverage:**
- v1.1 requirements: 50 total
- Mapped to phases: 0
- Unmapped: 50

---
*Requirements defined: 2026-03-03*
*Last updated: 2026-03-03 after v1.1 milestone definition*
