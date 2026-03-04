# Feature Landscape: Loom V2 — Premium AI Coding Agent Interface

**Domain:** Premium web interface for AI coding agents (Claude Code, Gemini, Codex)
**Researched:** 2026-03-04
**Overall confidence:** HIGH (cross-verified from 6 reference product analyses, 106-requirement standards doc, PROJECT.md, and domain expertise)

---

## Context

Loom V2 is a **greenfield frontend rewrite** targeting 10/10 quality. The existing CloudCLI backend stays unchanged. The question is: what should the frontend build, and in what priority order?

This document covers the full feature landscape across all domains: streaming UX, tool call display, multi-agent orchestration, file management, terminal integration, command palettes, theming, accessibility, companion system, Nextcloud integration, and the GSD visual dashboard. It supersedes the v1.1 visual redesign feature research.

**Reference products analyzed:** Claude.ai, ChatGPT, Perplexity, Open WebUI, LobeChat, LibreChat, Cursor, Windsurf (from existing analysis docs)

**Loom's unique positioning:** Unlike general-purpose chat UIs, Loom is purpose-built for AI coding agent work. Every tool call, every file write, every MCP interaction should be a *satisfying visual experience* that makes the agent's work visible and beautiful.

---

## Table Stakes

Features users expect in any premium AI interface. Missing any of these causes abandonment or "feels unfinished" perception.

### Core Chat Experience

| Feature | Why Expected | Complexity | Reference Products | Notes |
|---------|--------------|------------|-------------------|-------|
| **Smooth streaming text** | Any stutter or jank signals poor engineering; users have been trained by ChatGPT and Claude.ai | LOW | All 6 products | Batch rendering in 2-5 word chunks with CSS opacity fade-in. NEVER character-by-character typewriter. Tokens in React Refs, visible State at 30-60ms intervals. |
| **Send/Stop button morphing** | Must be able to abort generation; if stop is missing or slow, trust collapses | LOW | All 6 products | Instant visual swap. Square icon. Same position. Stop must work even during heavy rendering — this is a Critical requirement. |
| **Collapsible thinking/reasoning blocks** | Extended thinking clutters the UI; auto-collapsed is universal expectation | MEDIUM | Claude.ai, ChatGPT, LibreChat | Pulsing border while active. Auto-collapsed when output begins. Expand/collapse with smooth height animation via grid-template-rows trick. |
| **Syntax-highlighted code blocks** | Developers compare code blocks to their IDE; generic is unacceptable | LOW | All 6 products | Shiki (already in stack). Hover-reveal copy button. Language label. Max height with scroll. Never flicker between plain text and highlighted states during streaming. |
| **Copy button on code blocks** | Industry-wide expectation; feels broken without it | LOW | All 6 products | On hover only (not persistent). Show "Copied!" feedback with icon swap. |
| **Markdown rendering** | AI responses use markdown; raw markdown is illegible | LOW | All 6 products | Headers, bold/italic, lists, tables, blockquotes, inline code. Tables scroll horizontally in container. |
| **Auto-growing textarea** | Fixed-height inputs feel wrong; textarea that grows with content is universal | LOW | All 6 products | Grow up to max height (~200px), then scroll internally. |
| **Sticky auto-scroll with manual override** | Without smart scroll lock, reading while streaming is impossible | MEDIUM | All 6 products | Auto-scroll when at bottom. Stop scrolling if user scrolls up 10+ pixels. "Jump to bottom" pill with new-content indicator. |
| **Session management (create, switch, browse)** | Multi-session work is the default; no session management = no daily use | MEDIUM | All 6 products | Create new, switch, rename, delete. Sidebar with time-grouped history (Today, Yesterday, Last 7 Days). |
| **Error states with recovery** | Silent failures feel broken; aggressive alerts feel hostile | LOW | All 6 products | Inline retry for failed messages. Toast notifications for connection events. Partial responses preserved on failure. |
| **Dark mode as first-class citizen** | Expected in developer tools; an afterthought dark mode signals poor craft | LOW | All 6 products | Applied before first paint (no flash of light theme). Every element themed including scrollbars, inputs, third-party embeds. |
| **Asymmetric message styling** | Instant user/assistant distinction is table stakes | LOW | All 6 products | User: right-aligned or bubbled. Assistant: full-width, no heavy bubble, reads like a document. |
| **Hover-revealed message actions** | Permanent action buttons on every message create overwhelming noise | LOW | All 6 products | Copy, Retry, Edit — opacity:0 by default, opacity:1 on parent hover. Zero layout shift. |
| **Professional font choices** | Raw system defaults signal "prototype"; premium font = premium product | LOW | Claude (Serif), ChatGPT (Söhne), LobeChat (HarmonyOS Sans) | Inter (UI), Instrument Serif (editorial accents), JetBrains Mono (code). Already decided in PROJECT.md. |
| **Settings panel** | Must control appearance, model, API config | MEDIUM | All 6 products | Appearance, agents, API keys, MCP config. Modal or slide-over panel. |
| **3-tier surface elevation** | Flat UI with no depth feels like prototype; layered surfaces = spatial hierarchy | LOW | All 6 products | Background → Cards → Overlays. Use background lightness steps (OKLCH), NOT drop shadows. |
| **Semantic border opacity** | Hard borders feel like wireframes; invisible borders feel floating | LOW | Claude, ChatGPT, Perplexity | `border-color: hsl(var(--border) / 0.08-0.12)`. Single biggest "premium" signal. |

### Connection & State

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Connection status indicator** | WebSocket drop is silent without it; users think app is broken | LOW | Subtle but visible "reconnecting..." state. Auto-reconnect. |
| **Optimistic UI** | User message must appear instantly before server confirm | LOW | Standard pattern; feels wrong without it. |
| **No duplicate submissions** | Phantom submits destroy trust | MEDIUM | Idempotency required; Enter never fires twice. |
| **Draft preservation** | Losing unsent text on refresh = frustration | LOW | localStorage draft per session. |

---

## Differentiators

Features that set Loom apart from generic chat UIs. These are where the "make agent work visible and beautiful" thesis manifests.

### Streaming UX Differentiators

| Feature | Value Proposition | Complexity | Reference Inspiration | Notes |
|---------|-------------------|------------|----------------------|-------|
| **Semantic streaming states** | "Reading auth.ts..." vs "Writing server.ts..." vs "Running tests..." — users know exactly what the agent is doing | MEDIUM | Cursor (checklist view), Open WebUI (real-time stats) | Parse CloudCLI backend WebSocket tool events. ActivityStatusLine component above the input composer: compact text line that appears during streaming, collapses when done. |
| **Aurora ambient overlay during generation** | Loom-original: streaming creates beautiful ambient glow effect — makes waiting feel premium and alive | MEDIUM | Loom v1 has this; V2 should preserve and polish it | CSS-only aurora shimmer. Must be GPU-layer-capped (max 8-10 compositor layers on AMD Radeon 780M). `.is-streaming` guard class to enable/disable. |
| **Tool call state machine animations** | Tool calls are Loom's core differentiator vs generic chat — they should be satisfying to watch | HIGH | ChatGPT (action pills), Claude (analysis blocks), Cursor (vertical timeline) | State machine: pending → running (pulsing rose indicator) → success (collapsed chip) → error (expanded muted red). Spring physics on state transitions. |
| **Streaming cursor identity** | The blinking cursor during generation is a micro-brand moment | LOW | Claude (pulsing bar), ChatGPT (sliding bar) | Rose-colored pulsing vertical bar. Brand moment. CSS custom property so it updates with theme. |
| **Performance that doesn't degrade** | Long coding sessions with 200+ tool calls must stay smooth | HIGH | — | useRef + DOM mutation for streaming tokens (bypass React reconciler). React.memo + custom comparators on TurnBlock. content-visibility: auto on off-screen messages. |

### Tool Call Display Differentiators

| Feature | Value Proposition | Complexity | Reference Inspiration | Notes |
|---------|-------------------|------------|----------------------|-------|
| **Execution chain grouping** | When agent runs grep → read → write → test (7 calls), flat list is overwhelming; grouped "chains" preserve signal | MEDIUM | ChatGPT (aggressive: 5 calls = 1 accordion), Cursor (vertical timeline) | Group by semantic intent: file reading group, file writing group, terminal group. Show count badge. Expand to see individual calls. Error calls always expanded (never collapsed). |
| **Expandable request/response JSON** | Developers want to see exactly what was sent and what came back | MEDIUM | Claude (expandable JSON), LibreChat (debug mode toggle) | Default: collapsed. Click to expand. Syntax highlighted. Copyable. |
| **MCP server source labeling** | "From: Filesystem MCP" — which server provided this tool matters for debugging | LOW | LibreChat | Show source server name on tool cards. MCP connection status indicator. |
| **Approval flow for write-heavy actions** | Optional "Approve/Decline" for destructive MCP actions builds trust | MEDIUM | LibreChat, Claude.ai (permission pill) | Configurable. Off by default. When enabled: inline approve/decline buttons before executing write/delete/exec tools. |
| **Tool result inline rendering** | File contents, diffs, search results should render formatted, not raw | HIGH | Claude (code blocks in tool results), LibreChat (collapsible) | File reads → syntax highlighted code block. Diffs → react-diff-viewer. Search results → formatted list. Terminal output → monospace. |
| **Token/cost display per response** | Self-hosters managing usage want visibility; builds trust and awareness | MEDIUM | Cursor (usage dashboard), Open WebUI (t/s stats) | Compact footer below each assistant message: "450 in / 120 out / $0.008". Session total in sidebar footer. |

### Multi-Agent / Tabbed Workspaces Differentiators

| Feature | Value Proposition | Complexity | Reference Inspiration | Notes |
|---------|-------------------|------------|----------------------|-------|
| **Tabbed multi-provider workspaces** | Work with Claude in one tab, Gemini in another, simultaneously — no context switching | HIGH | Loom-original concept | Tab bar: Claude | Gemini | Codex. Each tab = independent WebSocket connection. Background tasks continue when tab inactive. |
| **Background task notifications** | Tab completes while not focused — notification appears | MEDIUM | Open WebUI (tab title updates), browser notifications | Tab title update with indicator. Optional browser notification on completion. Toast when switching back to a completed tab. |
| **Cross-tab context sharing** | Gemini tab can see Claude conversation context for parallel exploration | HIGH | Loom-original concept | Opt-in: "Share context with Gemini" button. Passes conversation transcript to other tab's context. Complex — defer until core tabbing works. |
| **Real-time agent activity per tab** | See what each agent is doing from a glance at the tab bar | MEDIUM | Loom-original | Subtle animated indicator in tab when agent is running. No activity = static. Running = pulsing rose dot. |

### GSD Visual Dashboard Differentiators

| Feature | Value Proposition | Complexity | Reference Inspiration | Notes |
|---------|-------------------|------------|----------------------|-------|
| **Visual build pipeline** | GSD phases, progress, task status — the roadmap made visible in real time | HIGH | Loom-original | Phase cards showing phase number, name, status (pending/active/complete/failed). Collapsible task list per phase. Progress bar. |
| **Agent assignment visibility** | Which AI owns which phase/task — no black box | MEDIUM | Loom-original | Claude icon on Claude phases. Gemini icon on Gemini phases. Phase handoff UI. |
| **Native GSD orchestration** | Start phases, run gate checks, view GATE-REPORT — from the UI, not CLI | HIGH | Loom-original | Run `/gsd:execute-phase N` from UI. View gate report inline. Stop/retry phases. |
| **Phase handoff UI** | Smooth handoff between Claude and Gemini based on task type | HIGH | Loom-original | When Gemini phase starts, Gemini tab activates. Progress tracked. |

### File Management & Nextcloud Integration Differentiators

| Feature | Value Proposition | Complexity | Reference Inspiration | Notes |
|---------|-------------------|------------|----------------------|-------|
| **File attachment to chat** | Attach Nextcloud files to messages — give agent context | MEDIUM | Open WebUI (Google Drive, OneDrive), Claude.ai (paperclip) | File picker opens Nextcloud browser. Files appear as chips above input. |
| **Screenshot upload from phone** | Photo → Nextcloud → Loom chat pipeline for visual debugging | MEDIUM | Loom-original | Watch Nextcloud folder. New image → auto-attach offer. Or manual "browse Nextcloud" picker. |
| **Nextcloud file browser** | Browse project files without leaving the UI | HIGH | LibreChat (file search), Open WebUI (knowledge bases) | Sidebar panel or modal. Navigate folders. Preview text files. |
| **Agent file operation visibility** | When agent writes a file, show what changed | MEDIUM | Cursor (live diffs), LibreChat (artifact panel) | Tool results for file writes show before/after diff via react-diff-viewer. |

### MCP & Plugin Management Differentiators

| Feature | Value Proposition | Complexity | Reference Inspiration | Notes |
|---------|-------------------|------------|----------------------|-------|
| **MCP server management UI** | Enable, disable, configure MCP servers without editing config files | MEDIUM | LibreChat (MCP marketplace admin), LobeChat (plugin marketplace) | List of installed servers. Toggle enable/disable. Status indicators: green (active), amber (auth needed), orange (connection failed). |
| **Active MCP connections panel** | See which tools are available right now | LOW | LibreChat (wrench icon dropdown), Open WebUI (tool toggles) | Indicator in composer area. Click to see active servers and their tools. |
| **Plugin/skill management** | UI for Claude Code plugins and skills | MEDIUM | Loom-original (CloudCLI has plugin system) | List installed plugins. Enable/disable per session. |

### Design System & Visual Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **OKLCH color space** | Perceptually uniform — colors look right; hue rotation doesn't shift perceived brightness | LOW | Token system uses OKLCH. No HSL. Same approach as Open WebUI v4. |
| **Spring physics animations** | Messages that slide in with physics-based easing feel weighted and real | MEDIUM | cubic-bezier(0.22, 1, 0.36, 1) for message entrance. LazyMotion for complex animations. Full Framer Motion never loaded on initial page. |
| **Glassmorphic overlays** | Modals, toasts, command palette feel like they float above the content | MEDIUM | Apply ONLY to floating elements. Never on scrolling message content (GPU cost). backdrop-filter: blur(12px) + hsl(var(--background) / 0.85). |
| **Context window gauge** | Prevents "context full" surprises; visual progress bar | MEDIUM | Thin bar (2px) above input. Green → amber → red as context fills. Tooltip shows exact count. |
| **Custom text selection color** | Brand identity at the deepest interaction level | LOW | ::selection { background-color: hsl(var(--accent) / 0.25); } |
| **Empty state is inviting** | Blank void = no confidence; warm welcome = psychological safety | LOW | Animated companion character + suggested prompts grid + "What are you building today?" |

### Companion System Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Animated pixel-art companions** | Emotional warmth; makes the tool feel like a workspace partner, not a CLI | HIGH | 8 companion species, 14 animation states. Pre-sourced from itch.io (NOT AI-generated). Sprite sheet: 512x896px, 64x64 tiles. |
| **Reactive animation states** | Companion reacts to system events — thinking, success, error, idle | HIGH | States: idle, walk, float, sleep, read, binoculars, type, alarmed, celebrate, pet, stretch, play, enter, wake. Must map to chat events. |
| **Companion selection** | User picks their companion; creates personal attachment | LOW | Settings panel. 8 options (Spool/Shiba, Bobbin/Cat, Shuttle/RedPanda, etc.). Stored in preferences. |
| **Companion placement** | Corner widget, not intrusive | LOW | Fixed position, lower-right or lower-left. Configurable. Can be hidden. |

---

## Anti-Features

Features that seem appealing but create technical debt, UX friction, or scope creep for Loom V2.

| Anti-Feature | Why Tempting | Why Problematic | What to Do Instead |
|--------------|-------------|-----------------|-------------------|
| **Character-by-character typewriter** | Feels "alive" and "AI-like" | Eye strain on long responses; artificial latency; masks real streaming; Claude and ChatGPT both moved AWAY from this | Batch rendering in 50-100ms intervals with CSS opacity fade-in per chunk |
| **Conversation branching / tree view** | LibreChat signature feature; power users love it | Massive complexity; confusing mental model; most coding sessions are linear; breaks auto-scroll assumptions | "New chat" is the branch mechanism. Keep conversations linear. |
| **Light mode** | User expectation from generic apps | Requires a complete second design system; dilutes brand identity; Loom's identity IS the dark theme | Offer OLED mode (pure black), density toggle, font size scale instead. Single dark theme is the brand. |
| **Side-by-side model comparison** | Open WebUI signature feature | Loom is Claude + Gemini + Codex via tabs, not a comparison product; split-pane comparison is wrong mental model for coding agent work | Tabbed workspaces provide parallel work without the visual complexity of split-pane |
| **Plugin micro-apps (iframe rendering)** | LobeChat renders plugin UIs as embedded iframes | Massive security surface; iframe sandboxing complexity; CloudCLI MCP tools return JSON/text, not rendered UI | Display MCP results as formatted text/JSON/diffs in expandable tool cards |
| **Right-side artifact panel** | Claude.ai and LibreChat use this for live previews | Loom is a CODING AGENT tool, not a document generator; artifacts panel is for HTML/React generation, not file editing; conflicts with centered reading rail | All content inline in main chat stream. Diff viewer inline in tool cards. |
| **Custom Mermaid/LaTeX rendering** | LibreChat and Open WebUI support this | Niche for coding agent usage; each renderer adds significant bundle; Mermaid diagrams rarely appear in Claude Code output | Render as code blocks with syntax highlighting. Ship when demand evidence exists. |
| **Animated background mesh during streaming** | ChatGPT does "Sora-generated" background pulses during o3 reasoning | GPU-expensive at sustained 60fps; distracting during actual work; conflicts with "focus" identity of developer tool; very hard to make not-cheesy | Aurora overlay (Loom-original) is better: subtle, ambient, not distracting. |
| **Multi-user / team features** | Multi-user admin is a product expansion | PROJECT.md explicitly out of scope: single-user tool. RBAC, SCIM, LDAP add backend complexity without benefit for the solo developer. | Auth is already single-user JWT. Keep it that way. |
| **Mobile-native app (React Native/Expo)** | Mobile AI tools are a real market | PROJECT.md explicitly out of scope. Web-first, responsive design handles mobile access adequately for occasional use. | Responsive CSS for 375px+ viewports handles mobile. Not a native app. |
| **AI model training/fine-tuning UI** | Advanced ML users might want this | PROJECT.md explicitly out of scope. Loom consumes models, doesn't train them. Massive scope expansion. | Defer indefinitely. |
| **Full IDE replacement (Monaco editor)** | Cursor did it; could be table stakes | PROJECT.md explicitly out of scope. "Not trying to replace VS Code/Cursor, complementing them." Monaco adds 500KB+ to bundle. | JetBrains Mono in code blocks. CodeMirror 6 if inline editing ever needed (already in stack). |
| **Arbitrary LLM provider support** | Open WebUI is the model for this | CloudCLI backend supports Claude, Gemini, Codex only. Provider-agnostic architecture is a backend rewrite, not a frontend feature. | Three-provider tab bar is the right abstraction. |
| **Agent/companion avatars as personality chatbots** | LobeChat does "agent marketplace" with personas | Adds visual noise; personification conflicts with "developer tool" identity; confuses role of companion (ambient widget) with AI agent (the actual LLM) | Companions are ambient pixel-art widgets. They react to system events. They don't roleplay. |
| **Iridescent/rainbow gradients** | ChatGPT's GPT-5 gradient is iconic | Requires complex OKLCH gradient animation; conflicts with Loom's warm/muted palette; high GPU cost; very hard to execute well | Aurora overlay handles "alive during generation." Single-color pulsing rose glow for active states. |
| **Glassmorphism on scrolling content** | Trendy aesthetic | backdrop-filter: blur() on scrolling content causes major jank on integrated GPU; kills frame rate | Glassmorphism ONLY on floating/overlay elements: modals, toasts, command palette, dropdowns. |
| **Heavy drop shadows on messages** | Creates "depth" | In dark mode, dark shadows on dark backgrounds are invisible or create muddy halos; no premium product uses this | Background lightness steps (OKLCH tonal elevation) + subtle 1px borders at 8% opacity |

---

## Feature Dependencies

```
[Design System (OKLCH tokens, typography, animation system)]
    |-- required-by --> [Surface elevation hierarchy]
    |-- required-by --> [All component visual polish]
    |-- required-by --> [Theming system (OLED mode, density toggle)]

[Streaming infrastructure (WebSocket, Zustand stores, useRef rendering)]
    |-- required-by --> [Smooth streaming UX]
    |-- required-by --> [Tool call state machine]
    |-- required-by --> [Semantic streaming states (ActivityStatusLine)]
    |-- required-by --> [Aurora overlay (knows when streaming is active)]
    |-- required-by --> [Auto-scroll with scroll lock]

[Tool call state machine]
    |-- required-by --> [Execution chain grouping]
    |-- required-by --> [Inline tool result rendering (diffs, code)]
    |-- required-by --> [Approval flow for write-heavy actions]
    |-- required-by --> [MCP server source labeling]

[Session management (Zustand session store)]
    |-- required-by --> [Tabbed workspaces]
    |-- required-by --> [Sidebar session history]
    |-- required-by --> [Background task notifications]

[Tabbed workspaces]
    |-- required-by --> [Multi-provider tab bar]
    |-- required-by --> [Background task notifications]
    |-- required-by --> [Cross-tab context sharing (Phase 2+ of this feature)]

[MCP management UI]
    |-- required-by --> [Active MCP connections panel]
    |-- required-by --> [Approval flow for write-heavy actions]

[Nextcloud integration]
    |-- required-by --> [File attachment to chat]
    |-- required-by --> [Screenshot upload pipeline]
    |-- required-by --> [Nextcloud file browser]
    |-- depends-on --> [Backend already has Nextcloud API config]

[Companion system]
    |-- requires --> [Sprite sheets from itch.io]
    |-- requires --> [Feasibility assessment (PROJECT.md flags this as pending)]
    |-- requires --> [Canvas rendering or CSS sprite animation]
    |-- enhances --> [Empty state experience]

[GSD Visual Dashboard]
    |-- requires --> [Backend GATE-REPORT parsing]
    |-- requires --> [Planning file reading API (or file system access)]
    |-- requires --> [Tabbed workspaces (agent assignment visibility)]
```

### Dependency Critical Path

The V2 foundation must be established in this strict order:

1. **Design system** (OKLCH tokens, typography, spring physics tokens) — prerequisite for all visual work
2. **Streaming infrastructure** (Zustand stores, WebSocket, useRef rendering) — prerequisite for all chat features
3. **Core chat experience** (message display, tool cards, thinking blocks, markdown) — prerequisite for differentiated features
4. **Session management + sidebar** — prerequisite for tabbed workspaces
5. **Everything else** (GSD dashboard, Nextcloud, companion, MCP management) — can be phased independently after core is solid

---

## MVP Recommendation

### Phase 1: Foundation (Weeks 1-2)
Establish the design system and infrastructure that everything else builds on.

**Must ship:**
1. OKLCH design token system (CSS custom properties)
2. Surface hierarchy (3-tier elevation via OKLCH lightness steps)
3. Typography system (Inter + Instrument Serif + JetBrains Mono)
4. Spring physics animation tokens (easing, duration, LazyMotion setup)
5. Zustand store architecture (4 stores: chat, session, ui, settings)
6. Vitest + ESLint + TypeScript strict configuration
7. ESLint custom rules enforcing design conventions (no hardcoded hex, no z-index outside dictionary)

### Phase 2: Core Chat (Weeks 3-5)
The chat experience that makes daily use possible.

**Must ship:**
8. Message display (user/assistant distinction, full-width assistant, markdown, code blocks)
9. Streaming infrastructure (useRef for tokens, Zustand state at 30-60ms intervals)
10. Tool call cards (state machine: pending → running → success → error, spring animations)
11. Thinking/reasoning disclosure (collapsible, pulsing border when active)
12. Send/Stop morphing with instant response
13. Sticky auto-scroll with scroll lock and "jump to bottom" pill
14. Session management (create, switch, rename, delete, sidebar history)
15. Settings panel (appearance, API config)
16. Error handling (3-tier error boundaries, toast notifications, reconnection)

### Phase 3: Streaming UX Polish (Weeks 6-7)
Make the streaming experience visually distinctive.

**Must ship:**
17. Semantic streaming states (ActivityStatusLine: "Reading auth.ts...", "Writing server.ts...")
18. Execution chain grouping (3+ sequential tool calls → accordion with count badge)
19. Aurora ambient overlay during generation
20. Message entrance spring animations (translateY + opacity, CSS spring cubic-bezier)
21. Tool result inline rendering (diffs for file writes, syntax highlight for reads)
22. Token/cost display per response
23. Context window gauge

### Phase 4: Multi-Provider Tabs (Weeks 8-9)
The multi-agent workspace.

**Must ship:**
24. Tabbed workspace UI (Claude | Gemini | Codex tab bar)
25. Independent WebSocket connections per tab
26. Background task continuation when tab not active
27. Background completion notifications (tab title + badge + toast on re-focus)
28. Per-tab agent activity indicator

**Defer within this phase:**
- Cross-tab context sharing (complex; validate tabbing first)

### Phase 5: Plugin & MCP Management (Weeks 10-11)
Make the agent's capabilities manageable.

**Must ship:**
29. MCP server management UI (list, enable/disable, connection status)
30. Active connections panel in composer area
31. Claude Code plugin/skill management
32. Approval flow for write-heavy MCP actions (configurable)

### Phase 6: GSD Visual Dashboard (Weeks 12-13)
Native GSD orchestration from the UI.

**Must ship:**
33. Phase pipeline visualization (phase cards, status, progress)
34. Agent assignment indicators (Claude vs Gemini per phase)
35. GATE-REPORT inline viewing
36. Basic phase execution from UI (run `/gsd:execute-phase N`)

**Defer:**
- Full phase handoff automation (manual trigger for V2)

### Phase 7: Nextcloud Integration (Weeks 14-15)
File management and mobile screenshot pipeline.

**Must ship:**
37. File picker for Nextcloud attachment to messages
38. Nextcloud file browser (navigate, preview text files)
39. Screenshot upload pipeline (watch folder, auto-attach offer)

### Phase 8: Companion System (Weeks 16+)
Subject to feasibility assessment passing.

**Must ship (if feasibility passes):**
40. Sprite sheet rendering (CSS animation from 512x896 sprite sheets)
41. Animation state machine (idle → type, celebrate → idle, etc.)
42. Event binding (tool success → celebrate, error → alarmed, etc.)
43. Companion selection in settings (8 companions)
44. Placement and hide toggle

**Defer if feasibility fails:**
- Use Lottie animation or CSS-only loader as fallback for "alive" empty state

---

## Competitive Pattern Matrix

How each reference product handles Loom's key differentiating dimensions.

### Streaming UX

| Product | Token Rendering | Thinking State | Streaming Indicator | Completion Signal |
|---------|----------------|---------------|---------------------|-------------------|
| Claude.ai | Smooth chunk reveal + pulsing bar | Pulsing border on thinking block, auto-collapses | Continuous reveal | Cursor disappears, actions fade in |
| ChatGPT | Words fade 200-250ms ("smooth bleed") | "Emotive Point" pulsing disc | Sliding 8px cursor | Point settles, action bar appears |
| Open WebUI | Shimmer gradient on text | 3-dot pulse + optional thought process | Fade-in streaming | t/s stats pill finalizes |
| LobeChat | Shiny text shimmer sweep | "Jelly dot" organic border-radius morphing | Sinusoidal breathing pulse | Dot dissolves, action bar appears |
| **Loom V2** | **Batch chunks, CSS opacity fade-in** | **Pulsing rose glow on thinking block** | **Rose cursor + ActivityStatusLine** | **Actions fade in (200ms), aurora fades** |

### Tool Call Display

| Product | Running State | Success State | Error State | Grouping |
|---------|--------------|---------------|-------------|----------|
| Claude.ai | Streaming monologue or progress | Collapsed chip with icon | Inline red text | Stacked chips |
| ChatGPT | Pulsing action pill with NL description | Hidden/badge only | Amber pill + "Show Details" | Aggressive — 5 calls = 1 accordion |
| Cursor | Terminal-style lines + spinner | Summary ("Read 4 files") | IDE "Problems" tab | Individual vertical timeline |
| LibreChat | Status badge → collapsible bar | Collapsed bar + chevron | Expanded red accent | Individual with collapse |
| **Loom V2** | **Pulsing rose dot + "Calling [tool]..."** | **Collapsed chip, 1 line, checkmark** | **Expanded, muted red bg** | **3+ calls = accordion with count badge** |

### Multi-Agent Approach

| Product | Pattern | Complexity |
|---------|---------|-----------|
| Open WebUI | Side-by-side model comparison with merge | HIGH — requires layout split |
| LobeChat | Agent Groups with shared context, switchable | HIGH — agent framework required |
| LibreChat | Mid-conversation provider switching | MEDIUM — context preserved across switch |
| **Loom V2** | **Tabbed workspaces (Claude/Gemini/Codex tabs)** | **MEDIUM — independent WebSockets per tab** |

### Session Sidebar

| Product | Organization | Active Indicator | Collapsed Mode |
|---------|-------------|-----------------|---------------|
| Claude.ai | Time groups, Projects | Subtle bg + left accent | Collapsible (not icon-only) |
| ChatGPT | Projects + time groups | Highlighted bg | Collapsible + Cmd+B |
| Open WebUI | Time groups + Channels + Folders | Background highlight | Icon-only "Slim" mode |
| LobeChat | Session list + 58px icon rail | Background + border | 58px icon rail always visible |
| **Loom V2** | **Time groups, provider badge per session** | **2px accent border + bg tint** | **Icon-only strip (Cmd+B)** |

---

## Phase-Specific Research Flags

| Phase | Topic | Research Needed | Priority |
|-------|-------|-----------------|----------|
| Phase 1 | OKLCH vs OKLCH-A, Tailwind v4 color system | Tailwind v4 (not v3) uses OKLCH natively — verify token format and CSS custom property behavior | HIGH |
| Phase 2 | WebSocket message format from CloudCLI | Exact WebSocket message shapes from backend for tool calls, thinking blocks, session events | HIGH |
| Phase 3 | ActivityStatusLine: which backend events to parse | Which WS event fields indicate "reading file X" vs "writing file Y" vs "running terminal command" | MEDIUM |
| Phase 4 | Tab persistence across refreshes | How to restore tab state on page reload without losing ongoing sessions | MEDIUM |
| Phase 7 | Nextcloud WebDAV API | CloudCLI's Nextcloud integration — does it go through backend or direct WebDAV from frontend? | HIGH |
| Phase 8 | Companion sprite feasibility | itch.io license compatibility, canvas vs CSS sprite approach, @napi-rs/canvas for Node | HIGH — must complete before committing to Phase 8 |

---

## Complexity Estimates

| Complexity | Features | Effort per Feature |
|-----------|----------|-------------------|
| **LOW** (CSS/config only) | Typography, surface elevation, semantic borders, selection color, streaming cursor, copy button, dark mode integrity | 1-2 days |
| **MEDIUM** (CSS + React component) | Thinking disclosure, tool card animations, auto-scroll, session sidebar, settings panel, streaming states, aurora overlay, toast system, tab bar, MCP status panel, companion selection | 3-7 days |
| **HIGH** (architecture + multiple components) | Streaming infrastructure (useRef/Zustand pattern), tool result inline rendering, execution chain grouping, tabbed workspaces (multi-WebSocket), GSD dashboard, Nextcloud file browser, companion animation state machine | 1-3 weeks |

---

## What Makes Loom Premium (Synthesis)

Loom's "premium" comes from a specific combination that no competitor offers:

1. **Claude.ai's restraint** — invisible borders, progressive disclosure, full-width assistant messages, generous whitespace
2. **ChatGPT's motion quality** — batch streaming with fade-in, action pill tool cards, aggressive grouping of tool calls
3. **Loom-original tool visibility** — execution chains, semantic streaming states, approval flows, MCP source labels
4. **Loom-original multi-agent** — tabbed workspaces, background tasks, cross-provider context sharing
5. **Loom-original character** — aurora ambient overlay, pixel-art companion, warm OKLCH palette (not clinical blue/white)

The design thesis is: **make AI agent work visible, beautiful, and controllable**. Every feature decision should be evaluated against this thesis. Features that obscure (heavy decorative animations during work), confuse (complex branching), or bloat (full IDE replacement) are rejected. Features that illuminate (tool chains, semantic states, agent dashboards), delight (aurora, companions, spring physics), and empower (approval flows, MCP management, tabbed workspaces) are prioritized.

---

## Sources

**HIGH confidence (direct product analysis):**
- `.planning/reference-app-analysis.md` — 6-product breakdown of Claude.ai, ChatGPT, Perplexity, Open WebUI, LobeChat, LibreChat (verified via Gemini research 2026-03-03)
- `.planning/chat-interface-standards.md` — 106 requirements across 16 categories, cross-verified across all 6 products
- `.planning/PROJECT.md` — V2 requirements, constraints, out-of-scope decisions, key architecture decisions
- `.planning/research/SUMMARY.md` — v1.1 research including tool call patterns, streaming UX, surface hierarchy
- `.planning/research/FEATURES.md` — v1.1 visual redesign feature landscape (superseded by this document for V2 scope)

**MEDIUM confidence (architecture decisions pending validation):**
- Companion system feasibility: `MEMORY.md` notes v1 AI-generated sprites failed; itch.io pre-made sprites are the plan; Phase 8 commitment depends on feasibility gate
- Cross-tab context sharing: Loom-original concept with no reference product to validate against; complexity likely higher than estimated
- GSD dashboard backend integration: Depends on CloudCLI's GATE-REPORT format and file system access model

**LOW confidence (needs phase-specific research):**
- Nextcloud integration architecture: Whether to go direct WebDAV from frontend or through CloudCLI backend proxy — needs verification during Nextcloud phase
- OKLCH in Tailwind v4: V2 uses Tailwind v4 (OKLCH native) vs v3 (HSL). Token format and CSS custom property behavior in v4 needs verification before Phase 1.

---

*Feature research for: Loom V2 — Premium AI Coding Agent Interface*
*Researched: 2026-03-04*
*Scope: Full V2 greenfield rewrite (not v1.1 patch)*
*Supersedes: Previous FEATURES.md (v1.1 visual redesign scope only)*
