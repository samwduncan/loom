# Component Adoption Map

**Purpose:** Systematic mapping of every Loom surface to the best available pre-built component.
**Philosophy:** Don't reinvent the wheel. Use production-tested, accessible components and restyle them to our OKLCH tokens.
**Last updated:** 2026-03-09

---

## Current State

### Already Installed (shadcn/ui — 9 of 58 primitives)
badge, collapsible, dialog, dropdown-menu, kbd, scroll-area, separator, sonner, tooltip

### Already Adopted (React Bits — CSS-only, source-copied)
SpotlightCard, ShinyText, ElectricBorder (in `src/src/components/effects/`)

---

## Surface → Component Map

### 1. Settings Panel (NOT YET BUILT — M3 priority)

The settings panel is the single largest new UI surface in M3. V1 had a 5-tab modal.

| Surface | Component | Source | Notes |
|---------|-----------|--------|-------|
| Settings modal container | **Dialog** | shadcn (installed) | Already have it. Full-screen variant for settings. |
| Tab navigation | **Tabs** | shadcn (NEW) | Radix-based, keyboard nav, ARIA compliant. Restyle to OKLCH. |
| Agent auth forms | **Form + Field + Input + Label** | shadcn (NEW) | react-hook-form integration, validation, error states. |
| Toggle switches | **Switch** | shadcn (NEW) | Radix Switch. Auto-scroll, show thinking, send-by-enter toggles. |
| API key inputs | **Input + Input-group** | shadcn (NEW) | Input with prefix/suffix slots for show/hide password toggle. |
| MCP server list | **Accordion** | shadcn (NEW) | Per-server expandable config. Better than custom collapsible. |
| Permission mode selector | **Select** | shadcn (NEW) | Radix Select with 4 modes. |
| Appearance sliders | **Slider** | shadcn (NEW) | Font size, editor prefs. |
| Checkbox options | **Checkbox** | shadcn (NEW) | Radix Checkbox. Word wrap, minimap, line numbers. |
| Toast feedback | **Sonner** | shadcn (installed) | "Settings saved" confirmations. |
| Version info section | **Card** | shadcn (NEW) | Structured card for version/update info. |
| **Total new shadcn:** | **11 primitives** | | tabs, form, field, input, input-group, label, switch, accordion, select, slider, checkbox, card |

### 2. Command Palette / Cmd+K (NOT YET BUILT — M3)

| Surface | Component | Source | Notes |
|---------|-----------|--------|-------|
| Palette container | **Command** | shadcn (NEW) | cmdk-based. Exactly what Cmd+K is. Fuzzy search, grouping, keyboard nav. |
| Search input | Built into Command | shadcn | Command has its own search input. |
| Action items | Built into Command | shadcn | CommandItem, CommandGroup, CommandSeparator. |
| Keyboard shortcuts | **Kbd** | shadcn (installed) | Already have it for shortcut display. |
| **Total new shadcn:** | **1 primitive** | | command |

### 3. Sidebar — Slim Collapse Mode (PARTIALLY BUILT — needs M3 polish)

| Surface | Component | Source | Notes |
|---------|-----------|--------|-------|
| Collapsible sidebar | **Sidebar** | shadcn (NEW) | 16 block variants. `sidebar-07` = "collapses to icons" — exactly our need. |
| Sidebar resize handle | **Resizable** | shadcn (NEW) | Drag handle for sidebar width. |
| Tooltip on collapsed icons | **Tooltip** | shadcn (installed) | Already have it. |
| Session context menu | **Context-menu** | shadcn (NEW) | Right-click rename/delete. Better than our custom one. |
| **Total new shadcn:** | **3 primitives** | | sidebar, resizable, context-menu |

**Note:** Our sidebar is custom-built and works well. The shadcn Sidebar block is a _reference_ for the slim collapse pattern, not a wholesale replacement. Cherry-pick the collapse animation logic.

### 4. Chat Interface (BUILT — M3 polish only)

| Surface | Component | Source | Notes |
|---------|-----------|--------|-------|
| Message search | **SearchBar** (custom) | Keep | Our SearchBar is purpose-built for message filtering. |
| Image lightbox | **Dialog** | shadcn (installed) | Already using. |
| Scroll area | **Scroll-area** | shadcn (installed) | Already using. |
| Tool call accordion | **Collapsible** | shadcn (installed) | Already using for ToolCallGroup. |
| Message copy button | Keep custom | — | Simple, no component needed. |
| Empty state | **Empty** | shadcn (NEW) | Could replace ChatEmptyState with structured empty component. |
| Loading skeletons | **Skeleton** | shadcn (NEW) | Replace custom MessageListSkeleton + SessionListSkeleton. |
| Spinner during send | **Spinner** | shadcn (NEW) | Replace custom loading indicators. |
| **Total new shadcn:** | **3 primitives** | | empty, skeleton, spinner |

### 5. File Tree Panel (NOT YET BUILT — needs milestone assignment)

| Surface | Component | Source | Notes |
|---------|-----------|--------|-------|
| Tree structure | **sidebar-11** block | shadcn | "Sidebar with collapsible file tree" — reference pattern. |
| File/folder icons | lucide-react | Already dep | File, Folder, FolderOpen, ChevronRight. |
| File search/filter | **Command** | shadcn | Reuse command palette in filter mode. |
| File context menu | **Context-menu** | shadcn | Right-click open, copy path, etc. |
| Image preview | **Dialog** | shadcn (installed) | Lightbox for image files. |
| **Total new shadcn:** | **0** | | All covered by existing + settings primitives. |

### 6. Code Editor Panel (NOT YET BUILT — needs milestone assignment)

| Surface | Component | Source | Notes |
|---------|-----------|--------|-------|
| Editor surface | **CodeMirror** | @uiw/react-codemirror | Same as V1. No shadcn equivalent. |
| Editor tabs | **Tabs** | shadcn | Reuse from settings. |
| Editor toolbar | Keep custom | — | Toolbar buttons are simple. |
| Markdown preview | **react-markdown** | Already dep | Same renderer as chat. |
| **Total new shadcn:** | **0** | | Covered by editor tabs. |

### 7. Terminal Panel (NOT YET BUILT — needs milestone assignment)

| Surface | Component | Source | Notes |
|---------|-----------|--------|-------|
| Terminal emulator | **xterm.js** | @xterm/xterm | No alternative. Same as V1. |
| Connection overlay | Keep custom | — | Simple connection state display. |
| Terminal header | Keep custom | — | Title + controls. |
| **Total new shadcn:** | **0** | | xterm.js handles everything. |

### 8. Git Panel (NOT YET BUILT — needs milestone assignment)

| Surface | Component | Source | Notes |
|---------|-----------|--------|-------|
| Branch selector | **Select** | shadcn | Reuse from settings. |
| File change list | **Checkbox** + custom list | shadcn | Checkbox for staging, custom list for file diffs. |
| Commit message | **Textarea** | shadcn (NEW) | Auto-resize textarea for commit messages. |
| Diff viewer | Keep custom | — | Our diff viewer is purpose-built. |
| Commit history | **Table** | shadcn (NEW) | Structured commit log display. |
| Confirm dialogs | **Alert-dialog** | shadcn (NEW) | "Are you sure you want to force push?" |
| New branch modal | **Dialog + Input** | shadcn (installed + NEW) | Input for branch name. |
| **Total new shadcn:** | **3 primitives** | | textarea, table, alert-dialog |

### 9. Permission System (BUILT — works)

| Surface | Component | Source | Notes |
|---------|-----------|--------|-------|
| Permission banner | Keep custom | — | PermissionBanner + CountdownRing are purpose-built, working well. |
| **Total new shadcn:** | **0** | | No changes needed. |

### 10. Toast / Notification System (BUILT)

| Surface | Component | Source | Notes |
|---------|-----------|--------|-------|
| Toast notifications | **Sonner** | shadcn (installed) | Already using. |
| **Total new shadcn:** | **0** | | No changes needed. |

---

## Visual Effects Map

### Tier 1: Adopt for M3 (proven, low-risk)

| Effect | Source | Target Surface | Dep | Status |
|--------|--------|----------------|-----|--------|
| **Aurora** | React Bits | Chat background during streaming | ogl ~30KB lazy | Not yet adopted |
| **Grainient** | React Bits | Idle background ambient texture | ogl (shared) | Not yet adopted |
| **SpotlightCard** | React Bits | Sidebar items, tool cards, settings | CSS only | **ADOPTED** |
| **ShinyText** | React Bits | Status indicators, thinking label | CSS only | **ADOPTED** |
| **ElectricBorder** | React Bits | Composer border during streaming | CSS only | **ADOPTED** |
| **StarBorder** | React Bits | Active/focused elements | CSS only | Planned, not adopted |
| **DecryptedText** | React Bits | Session title reveals, model name | JS + CSS | Planned for M3 |

### Tier 2: Prototype in M3 (needs perf testing)

| Effect | Source | Target Surface | Dep | Risk |
|--------|--------|----------------|-----|------|
| **GlassSurface** | React Bits | Command palette, modals | SVG filters | Chrome-only full support |
| **Iridescence** | React Bits | Sidebar header accent | ogl (shared) | May be distracting |
| **LiquidChrome** | React Bits | Settings/about page accent | ogl (shared) | Too dramatic? |
| **AnimatedList** | React Bits | Message entrance animations | JS + CSS | May conflict with scroll |
| **GlareHover** | React Bits | Tool cards on hover | CSS + JS | Alternative to SpotlightCard |

### Tier 3: Explore (from additional libraries)

| Effect | Source | Target Surface | Dep | Notes |
|--------|--------|----------------|-----|-------|
| **Border Beam** | Magic UI | Active tool cards, streaming indicator | CSS | Animated beam traveling along border |
| **Shimmer Button** | Magic UI | CTA buttons, "New Chat" | CSS | Subtle shimmer sweep on hover |
| **Meteors** | Magic UI | Background ambient effect | CSS | Falling meteor particles — subtle version |
| **Dot Pattern** | Magic UI | Empty state backgrounds | CSS/SVG | Subtle grid pattern |
| **Grid Pattern** | Magic UI | Panel backgrounds | CSS/SVG | Alternative to solid dark |
| **Particles** | Magic UI | Connection success celebration | tsparticles | Micro-celebration on connect |
| **Spotlight** | Aceternity UI | Card hover effect | CSS | Alternative to SpotlightCard |
| **Background Beams** | Aceternity UI | Ambient streaming background | CSS | Lines/beams emanating from center |
| **Lamp Effect** | Aceternity UI | Empty state hero | CSS | Dramatic top-down light cone |
| **Text Generate** | Aceternity UI | First message welcome text | JS + CSS | Words appearing with blur-in |
| **Sparkles** | Aceternity UI | Success states, milestones | CSS + JS | Subtle sparkle particles |

### Tier REJECTED

| Effect | Source | Reason |
|--------|--------|--------|
| THREE.js anything | React Bits | 500KB+ bundle, overkill |
| Cursor followers | React Bits / Aceternity | Distracting during code work |
| Typewriter effects | Various | Constitution banned (batch rendering) |
| 3D card tilts | Various | Too playful for dev tool |
| Confetti | Various | Too playful |
| Parallax scroll | Various | Chat doesn't scroll that way |

---

## shadcn Adoption Summary

### Already Installed (9)
badge, collapsible, dialog, dropdown-menu, kbd, scroll-area, separator, sonner, tooltip

### Need for M3 Settings + Cmd+K (15 new)
accordion, alert-dialog, card, checkbox, command, empty, field, form, input, input-group, label, select, skeleton, slider, spinner, switch, tabs, textarea

### Need for Future Panels (3 new, if not covered above)
context-menu, resizable, table

### Total After M3: ~27 of 58 primitives (~47%)

### Not Needed (31)
aspect-ratio, avatar, breadcrumb, button (we use custom), button-group, calendar, carousel, chart, combobox, direction, drawer, hover-card, input-otp, item, menubar, native-select, navigation-menu, pagination, popover, progress, radio-group, sheet, sidebar (reference only), toggle, toggle-group

**Note:** Some "not needed" may become relevant in M4-M5 (chart for GSD dashboard, progress for task tracking, avatar for multi-user).

---

## Integration Rules

1. **All shadcn components get OKLCH restyling.** Override `--radius`, `--primary`, `--secondary`, etc. with our token system. No default shadcn colors in production.
2. **React Bits effects are source-copied, never npm installed.** Copy into `src/src/components/effects/`, restyle to use design tokens.
3. **WebGL effects (ogl) are lazy-loaded.** Dynamic import, only loaded when streaming activates Aurora/Grainient.
4. **Every effect respects `prefers-reduced-motion`.** No exceptions.
5. **OKLCH-to-hex bridge** required for shader components. See `visual-effects-audit.md` section 5.
6. **CSS containment** on all WebGL canvases. `contain: strict` prevents layout thrash.

---

## Adoption Phases (suggested GSD integration)

### Phase A: shadcn Foundation (early M3)
- Install remaining shadcn primitives needed for settings + Cmd+K
- Create OKLCH override layer (`src/src/styles/shadcn-overrides.css`)
- Verify all primitives render correctly with our tokens
- Replace custom skeletons/spinners with shadcn versions

### Phase B: Settings Panel (M3)
- Build settings with shadcn Tabs + Form + Input + Switch + etc.
- 5-tab layout matching V1 feature set
- MCP server management with Accordion

### Phase C: Command Palette (M3)
- shadcn Command for Cmd+K
- Session search, project switching, quick actions
- GlassSurface overlay (with CSS fallback)

### Phase D: Visual Effects Layer (M3)
- Aurora + Grainient WebGL backgrounds
- OKLCH-to-hex bridge utility
- StarBorder on active elements
- DecryptedText for session reveals
- Performance testing on AMD Radeon 780M

### Phase E: Panel Infrastructure (M3 or M4)
- File Tree, Terminal, Git Panel, Code Editor
- Use shadcn context-menu, table, textarea where applicable
- xterm.js + CodeMirror for specialized surfaces

---

## Decision: What NOT to Adopt

| Surface | Why Custom |
|---------|-----------|
| Chat message bubbles | Unique layout, streaming integration, segment architecture |
| Tool cards (ToolChip, ToolCardShell) | Purpose-built with state machine, elapsed time, ANSI |
| Permission banners | Custom countdown ring, keyboard shortcuts, session scoping |
| Streaming cursor | CSS-only, 3 lines of code |
| Status line | Tightly coupled to stream store |
| Diff viewer | Specialized for tool card output |
| Provider logos | SVG components, simple |
| Active message segments | Core architecture, non-replaceable |

These are Loom's differentiators — the surfaces where hand-crafting IS the right call.

---

*This document feeds into REQUIREMENTS.md during /gsd:new-milestone.*
*Review and update after each milestone.*
