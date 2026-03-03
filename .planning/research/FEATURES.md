# Feature Landscape: Visual Redesign of AI Chat Interface

**Domain:** Premium dark-mode AI chat interface (visual redesign)
**Researched:** 2026-03-03
**Confidence:** HIGH (cross-verified across 6 reference products via Gemini research, official docs, direct analysis)

---

## Context

This research answers: "What visual and interaction patterns do the best AI chat interfaces use, and which should Loom adopt for its v1.1 design overhaul?"

Six reference products were analyzed: **Claude.ai**, **ChatGPT** (post-GPT5), **Perplexity**, **Open WebUI**, **LobeChat**, and **LibreChat**. The focus is on visual implementation patterns — not functional features (those are already built in Loom). The question is how to make existing features *look and feel* premium.

Loom's constraints: React 18 + Tailwind CSS + CSS Variables (HSL), single dark theme, charcoal base (#1a1a1a-#222222) with dusty rose accent, 720px max-width centered layout.

---

## Table Stakes

Features every premium AI chat interface ships. Missing any of these makes the product feel unfinished or amateur.

| Feature | Why Expected | Complexity | Reference Products | Notes |
|---------|--------------|------------|-------------------|-------|
| **Off-black base (not pure black)** | Pure #000000 causes OLED smearing and text halation; every premium product uses #0A0A0A to #121212 | LOW | Claude (#0D0D0D), ChatGPT (#0D0D0D), Perplexity (#050505), Open WebUI (#0B0B0B) | Loom's #1a1a1a is actually slightly lighter than industry standard — acceptable for "warm charcoal" identity but verify contrast ratios |
| **3-4 tier surface elevation** | Flat UIs feel like prototypes; layered surfaces create spatial hierarchy and depth | LOW | Claude (3 levels), ChatGPT (4 levels), Open WebUI (5 levels) | Each tier increases lightness by 2-5%. Base -> Sidebar/Cards -> Overlays -> Modals. Use background color steps, NOT drop shadows |
| **Subtle borders (white at 6-10% opacity)** | Heavy borders feel like wireframes; invisible borders lose hierarchy | LOW | Claude (`rgba(255,255,255,0.08)`), ChatGPT (1px solid low-opacity), Perplexity (10% white borders) | Single most impactful "premium" signal. Replace all hard borders with `border-color: hsl(var(--border) / 0.1)` |
| **Full-width assistant messages (no bubbles)** | Bubbles waste horizontal space and make long-form AI output feel like text messages; blocks feel like documents | LOW | Claude (full-width transparent), ChatGPT (full-width blocks), LibreChat (flat against canvas) | User messages CAN be in subtle bubbles for distinction. Assistant messages must be full-width or near-full-width |
| **Centered reading rail (720-896px max-width)** | Ultrawide text is unreadable; constrained width creates professional document feel | LOW | Claude (~800px), ChatGPT (768px), Perplexity (generous), LibreChat (768-896px) | Loom already has 720px — on the narrow end. Consider 768px to match industry standard |
| **Hidden-until-hover action buttons** | Visible Copy/Retry/Edit buttons on every message create overwhelming visual noise | LOW | Claude (opacity:0 -> opacity:1 on hover, 200ms), ChatGPT (hover reveal), LobeChat ("floating action bar" bottom-right on hover) | THE single biggest clutter reducer. Set message actions to opacity:0 by default, transition on parent hover |
| **Generous inter-turn spacing (32-48px)** | Cramped turns blur together; generous spacing lets the eye rest between conversation turns | LOW | Claude (2-3rem/32-48px between turns), ChatGPT (similar), Perplexity (32-48px between sections) | Current Loom "dense" spacing may need recalibration. Dense ≠ cramped. Tight line-heights within messages, generous spacing BETWEEN turns |
| **Collapsible thinking/reasoning blocks** | Extended thinking output clutters the UI; auto-collapsed with pulsing border when active | MEDIUM | Claude (pulsing border animation, auto-collapse when output begins), ChatGPT ("Thought" bubble), LibreChat ("Thinking" accordion) | Already built in Loom. Verify styling matches new palette — subtle pulsing glow on active, muted when collapsed |
| **Streaming text with batch rendering** | Character-by-character typewriter causes eye strain; batch rendering (2-5 word chunks) feels natural | LOW | Claude (token chunks), ChatGPT ("liquid streaming" with opacity fade-in), Perplexity (word-level fade-in) | Render tokens in 50-100ms batches. Add subtle CSS `opacity` fade-in on new content rather than hard appearance |
| **Stop generation button replacing send** | Users need to interrupt; dedicated visible stop control during streaming | LOW | Claude (square stop icon), ChatGPT (stop replaces send), Open WebUI (same pattern) | Already planned. Square icon, same position as send button, instant visual swap |
| **Sticky-bottom auto-scroll with manual break** | Without it, reading while streaming is impossible; any upward scroll (10px+) breaks lock | LOW | All 6 products use this pattern | Already planned. Add jump-to-bottom pill with "new content" badge |
| **Toast notifications for transient status** | Silent failures feel broken; aggressive alerts feel hostile | LOW | Claude (glassmorphic pill toasts, bottom-center, 2-3s fade), ChatGPT (similar), Open WebUI (toast system) | Glassmorphic style: `backdrop-filter: blur(8px); background: rgba(30,30,30,0.8)`. Bottom-center position. 2-3 second auto-dismiss |
| **Chronological sidebar grouping** | Flat session lists are unreadable; time-based groups (Today, Yesterday, Last 7 Days) provide orientation | LOW | Claude (uppercase tracked section headers), ChatGPT (time groups + Projects), LibreChat (folders + time groups) | Small uppercase tracked labels: `font-size: 0.75rem; letter-spacing: 0.05em; color: muted` |
| **Monospace code blocks with copy button** | Developers compare code blocks to their IDE; generic rendering feels wrong | LOW | All products. Open WebUI uses JetBrains Mono, Claude uses monospace with hover-reveal copy | Already built (Shiki). Ensure copy button appears on hover only, not persistently |
| **Error states with semantic color** | Users need to instantly distinguish info/warning/error | LOW | Claude (muted coral `#E57373` on 10% red background), ChatGPT (amber for self-correction, red for failures) | Three tiers: gray=info, amber/gold=warning, muted red=error. Never bright saturated red — use muted/warm tones |

---

## Differentiators

Features that separate "designed" from "generic." Not universally expected, but create meaningful competitive separation. These are where Loom should invest for its "designed, not generated" thesis.

| Feature | Value Proposition | Complexity | Reference Inspiration | Notes |
|---------|-------------------|------------|----------------------|-------|
| **Dusty rose accent identity** | Every major product uses blue or green accents. Dusty rose (#D4736C) is distinctive and memorable — no one else does this | LOW (design) | None — this IS the differentiator. Claude has terracotta (#D97757) but Loom's rose is softer and more distinctive | Apply to: focus rings, active states, primary buttons, selection highlight (`::selection`), accent borders. Use sparingly — 5% of surface area max |
| **Progressive disclosure via opacity layers** | Reveals complexity only when needed; creates visual calm by default | MEDIUM | Claude (message actions at opacity:0, tool calls collapsed, thinking auto-collapsed) | Apply to: message actions, tool call details, thinking block content, metadata (tokens, timestamps). Default state = minimal; hover/click = full detail |
| **Warm text hierarchy (cream, not white)** | Pure white (#FFFFFF) on dark backgrounds causes halation. Cream/warm off-white feels deliberate and premium | LOW | Claude (#E6E6E6 "soft linen"), LobeChat (#E0E0E0), Perplexity (#FFFFFF primary but with line-height compensation) | Use #F5E6D3 (warm cream) for primary, #C4A882 (muted gold) for secondary, #8B7355 for tertiary. Already in Loom's variables but needs consistent application |
| **Tool call "action cards" with semantic states** | Tool calls are core to Loom's coding workflow — they need to feel informative, not noisy | HIGH | ChatGPT (action pills with micro-status), Claude (collapsible analysis blocks), Cursor (terminal-style with live diffs), Open WebUI (neon-bordered collapsible blocks) | Adopt the ChatGPT "action pill" pattern: compact horizontal card showing icon + tool name + status. Success = collapsed chip. Error = expanded with red accent. Running = pulsing indicator. Group 3+ sequential calls into "N tool calls" accordion |
| **Execution chain grouping** | When AI runs grep -> read -> write, flat list overwhelms; grouped "chain" preserves signal | MEDIUM | ChatGPT (aggressive grouping, 5 calls -> single accordion), Claude (stacked chips), Cursor (vertical timeline) | Group by "intent": reading files = one group, writing files = another. Show count badge. Expand to see individual calls. Error calls always expanded |
| **Glassmorphic overlays (blur + transparency)** | Creates depth and "physical presence" for floating elements; the defining aesthetic of 2025-2026 premium UIs | MEDIUM | Claude (`backdrop-filter: blur(12px)` on artifact sidebar), ChatGPT (`blur(20px)` with iridescent borders), Perplexity (navigation blur), LobeChat ("Glassmorphism 2.0") | Apply to: modals, toasts, command palette, dropdown menus. Use `backdrop-filter: blur(12px); background: hsl(var(--background) / 0.8)`. NOT on main content areas — only floating/overlay elements |
| **Spring-physics message entrance** | Messages that slide in with physics-based easing feel weighted and real; hard-cut appearance feels like a loading bug | MEDIUM | LobeChat (spring physics: stiffness 100, damping 20), Claude (250ms organic entrance), ChatGPT (opacity + blur fade-in) | Use `cubic-bezier(0.22, 1, 0.36, 1)` for message entrance (CSS spring approximation). 200-300ms duration. Subtle translateY(8px) -> translateY(0) with opacity 0 -> 1 |
| **Semantic streaming states** | "Thinking..." vs "Reading files..." vs "Writing code..." — users want to know WHAT the AI is doing, not just that it's busy | MEDIUM | Cursor (checklist planning view), Open WebUI (real-time t/s stats), Claude (pulsing thinking block with streaming monologue) | Parse Claude Code backend JSON for human-readable status. Show as text below the assistant avatar area: "Reading auth.ts..." or "Running terminal command..." |
| **Dense sidebar with slim/icon-only collapse** | Maximizes chat area; power users want sidebar out of the way | LOW | Open WebUI (slim icon-only mode), Claude (collapsible, airy layout), ChatGPT (collapsible with Cmd+B) | Two states: expanded (session list with time groups) and collapsed (icon strip: new chat, search, settings). Toggle with keyboard shortcut |
| **Active session indicator with accent** | Current chat needs instant visual identification in sidebar | LOW | Claude (subtle background `rgba(255,255,255,0.1)` + left accent border sliver) | Left border: 2px dusty rose. Background: `hsl(var(--accent) / 0.08)`. Clean, not heavy |
| **Token/cost display per response** | Self-hosters actively manage usage; visible costs build trust and awareness | MEDIUM | Cursor (usage dashboard), Open WebUI (t/s display), Claude (CLI JSON logs only) | Compact footer below each assistant message: "450 in / 120 out / $0.008". Muted secondary text. Expandable for model details. Session total in sidebar footer |
| **Smooth expand/collapse with height animation** | Abrupt show/hide feels like rendering bugs; smooth height transitions feel intentional | MEDIUM | Claude (500ms with `cubic-bezier(0.22, 1, 0.36, 1)` for sidebar), LobeChat (spring physics for all accordions) | Use `grid-template-rows: 0fr -> 1fr` trick for smooth height animation (no fixed heights needed). 200-300ms with ease-out curve |
| **Context window gauge** | Prevents "context full" surprises; visual progress bar near input | MEDIUM | ChatGPT (usage gauge in sidebar), Open WebUI (model context display) | Thin bar (2px height) above or below input area. Color: green -> amber -> red as context fills. Tooltip shows exact token count |
| **Input field with focus glow** | Focused input should feel "activated" — draws the eye to where action happens | LOW | Claude (`box-shadow: 0 0 0 2px rgba(217,119,87,0.2)` on focus), ChatGPT (subtle border brightening) | Use dusty rose glow: `box-shadow: 0 0 0 2px hsl(var(--accent) / 0.15)` on focus. Transition from invisible to visible over 200ms |
| **Custom text selection color** | Ties brand identity into the deepest interaction level | LOW | Claude (`::selection { background-color: rgba(217,119,87,0.25) }`) | `::selection { background-color: hsl(var(--accent) / 0.25); color: inherit; }` — dusty rose selection throughout the app |

---

## Anti-Features

Features that seem appealing but create technical debt, UX friction, or scope creep. Explicitly do NOT build these.

| Anti-Feature | Why Tempting | Why Problematic | What to Do Instead |
|--------------|-------------|-----------------|-------------------|
| **Character-by-character typewriter effect** | Feels "alive" and "AI-like" | Eye strain on long responses; artificial latency; masks real streaming progress; ChatGPT and Claude have both moved AWAY from this toward batch rendering | Render in 2-5 word token chunks with subtle CSS opacity fade-in (50-100ms per batch) |
| **Pure black (#000000) background** | "True dark mode" | OLED smearing, text halation, inability to create depth via surface elevation. No premium product uses it as primary background | Off-black charcoal (#1a1a1a). Reserve pure black only for embedded terminal output |
| **Heavy drop shadows on messages** | Creates "depth" | In dark mode, dark shadows on dark backgrounds are invisible or create muddy halos. Every premium product has abandoned message shadows | Use 1px borders at 6-10% white opacity and background lightness steps for elevation |
| **Conversation branching / tree view** | Power feature from LibreChat | Massive implementation complexity; confusing mental model; most users never need it; breaks linear conversation flow | "New chat" is the branch mechanism. Keep conversations linear |
| **Light mode / theme switching** | User expectation from generic apps | Loom's identity IS the dark theme; a light mode requires a complete second design system and dilutes brand identity. Claude.ai, Perplexity, and ChatGPT all have strong dark-mode-first identities | Offer density customization and font customization instead. Single dark theme is the brand |
| **Agent/bot avatars with personality** | LobeChat does this with "agent marketplace" | Adds visual noise; personification conflicts with "tool" identity; implementation complexity for avatar rendering, marketplace, profiles | Use subtle role indicators (small icon or text label) not character avatars |
| **Glassmorphism on EVERYTHING** | The aesthetic is trendy | `backdrop-filter: blur()` is GPU-expensive; applying to scrolling content causes jank on low-end hardware; overuse makes hierarchy unclear | Glassmorphism ONLY on floating elements: modals, toasts, dropdown menus, command palette. Never on scrolling message content |
| **Iridescent / rainbow gradients** | ChatGPT does this for GPT-5 "thinking" state | Requires complex `oklch` gradient animation; conflicts with Loom's warm/muted palette; looks gimmicky if not perfectly executed; high GPU cost | Use single-color dusty rose pulsing glow for active states. Simpler, cheaper, more on-brand |
| **Side-by-side model comparison** | Open WebUI's signature feature | Loom is Claude Code + Gemini only; comparison mode adds massive layout complexity for a 2-model product | Provider switching dropdown is sufficient. No split-pane comparison needed |
| **Plugin/MCP micro-apps (iframe rendering)** | LobeChat renders plugin UIs as embedded components | Massive security surface (iframe sandboxing); high complexity; Loom's MCP tools return text/JSON, not rendered UI | Display MCP results as formatted text/JSON in collapsible action cards |
| **Custom-rendered Mermaid/LaTeX in chat** | LibreChat does this natively | High complexity; niche usage in coding chat context; each renderer adds bundle size | Render as code blocks with syntax highlighting. If demand emerges, add as opt-in later |
| **Animated background gradients during "thinking"** | ChatGPT uses "Sora-generated" background pulses | GPU-expensive; distracting during actual work; conflicts with "tool" identity; very difficult to make not-cheesy | Subtle pulsing border on the thinking block is sufficient. Keep the background static |
| **Right-side panel for artifacts/context** | Claude.ai and LibreChat use this | Requires responsive layout overhaul; conflicts with 720px centered reading rail; adds significant complexity for a feature Loom may not need (it's not generating artifacts) | Keep everything in the main chat stream. Tool outputs expand inline |

---

## Feature Dependencies

```
[Design System (CSS variables, palette, typography)]
    |-- required-by --> [Surface elevation tiers]
    |-- required-by --> [Warm text hierarchy]
    |-- required-by --> [Dusty rose accent application]
    |-- required-by --> [Border opacity standardization]
    |-- required-by --> [ALL other visual features]

[Surface elevation tiers]
    |-- required-by --> [Glassmorphic overlays]
    |-- required-by --> [Sidebar visual polish]

[Hidden-until-hover action buttons]
    |-- required-by --> [Progressive disclosure system]
    |-- enhances --> [Message visual cleanliness]

[Collapsible tool call cards]
    |-- required-by --> [Execution chain grouping]
    |-- required-by --> [Semantic tool states (running/success/error)]

[Streaming batch rendering]
    |-- required-by --> [Streaming text fade-in animation]
    |-- required-by --> [Semantic streaming states]
    |-- required-by --> [Auto-scroll logic]

[Spring-physics message entrance]
    |-- requires --> [Expand/collapse height animation]
    |-- enhances --> [Overall "premium feel"]

[Token/cost display]
    |-- enhances --> [Context window gauge]
    |-- enhances --> [Session usage summary]
```

### Dependency Notes

- **Design system is the hard prerequisite for everything.** CSS variables for the new palette must be in place before any visual work proceeds. This is Phase 1, day 1.
- **Hidden-until-hover actions are the highest-impact single change.** Every reference product does this. It can be applied globally with a single CSS rule on message containers.
- **Tool call display depends on existing tool call architecture.** Loom already renders tool action cards — the work is restyling, not rebuilding.
- **Animations can be added incrementally.** Start with `transition` properties on existing elements (200ms ease-out), then add entrance animations for new messages.

---

## MVP Recommendation

### Phase 1: Foundation (the palette sweep)

Prioritize the changes that affect EVERY surface:

1. **CSS variable palette swap** — charcoal base, cream text, dusty rose accent, 3-tier elevation
2. **Border opacity standardization** — replace all hard borders with `hsl(var(--border) / 0.08-0.12)`
3. **Warm text hierarchy** — primary cream, secondary muted gold, tertiary dim
4. **Text selection color** — `::selection` with dusty rose
5. **Input focus glow** — dusty rose ring on focus

### Phase 2: Message experience

6. **Hidden-until-hover action buttons** — single biggest visual cleanup
7. **Full-width assistant messages** — remove any bubble wrapper on assistant turns
8. **Inter-turn spacing increase** — 32-48px between turns, tight within turns
9. **Message entrance animation** — translateY(8px) + opacity fade, 250ms
10. **Streaming text batch fade-in** — subtle opacity transition on new content

### Phase 3: Tool calls and status

11. **Tool call action card restyle** — compact pills with icon + name + semantic color states
12. **Execution chain grouping** — group 3+ sequential calls
13. **Semantic streaming states** — "Reading files..." text status
14. **Toast notification system** — glassmorphic bottom-center toasts
15. **Error state semantic colors** — gray/amber/red tiers

### Phase 4: Sidebar and polish

16. **Sidebar restyle** — time-grouped sections, active indicator with rose accent
17. **Slim sidebar collapse** — icon-only mode
18. **Glassmorphic overlays** — modals, toasts, dropdowns
19. **Smooth expand/collapse animations** — grid-template-rows trick, 200-300ms
20. **Token/cost display** — per-message footer, session total

### Defer

- **Context window gauge** — after token display works
- **Density toggle** — after base density is right
- **Command palette** — significant scope, Phase 2+ milestone
- **Font customization** — low priority

---

## Competitive Pattern Matrix

How each reference product handles each dimension, with Loom's recommended approach.

### Dark Mode Palette

| Product | Base Background | Surface 1 | Surface 2 | Primary Text | Accent | Strategy |
|---------|----------------|-----------|-----------|-------------|--------|----------|
| Claude.ai | #0D0D0D | #171717 | #212121-#262626 | #E6E6E6 (soft linen) | #D97757 (terracotta) | Warm tonal layering, no shadows |
| ChatGPT | #0D0D0D | #1A1A1A-#212121 | #2A2A2A | #ECECEC | #6EA8FF (atmosphere blue) | Flat depth with 1px borders |
| Perplexity | #050505-#091717 | #121212-#1A1A1A | #252525 | #FFFFFF | #20808D (turquoise) | Glassmorphic navigation |
| Open WebUI | #0B0B0B | #171717 | #252525 | #ECECEC | #3B82F6 (blue) | Standard drop shadows |
| LobeChat | #121212 | +5% white overlay | +11% white overlay | #E0E0E0 | Desaturated blue/purple | Tonal elevation overlays |
| LibreChat | slate-950 | slate-800 | zinc-800 | #ECECEC | Green or blue | Tailwind slate scale |
| **Loom** | **#1A1A1A** | **#222222** | **#2A2A2A** | **#F5E6D3 (cream)** | **#D4736C (dusty rose)** | **Warm charcoal + tonal layering** |

### Chat Message Styling

| Product | User Messages | Assistant Messages | Spacing Between Turns | Max Width |
|---------|--------------|-------------------|----------------------|-----------|
| Claude.ai | Subtle bubble (bg #262626, radius 24px) | Full-width, transparent bg | 32-48px | ~800px |
| ChatGPT | No container or right-aligned block | Full-width, subtle bg wash #151515 | 24-32px | 768px |
| Perplexity | Full-width query block | Structured vertical sections | 32-48px | Generous |
| Open WebUI | Right-aligned or bg shift | Full-width, borderless | 24-32px | ~800px |
| LobeChat | Bubble (radius 18px, right-aligned) | Full-width structured block | 16-24px | Flexible |
| LibreChat | Subtle bg elevation | Flat against canvas | 24-32px | 768-896px |
| **Loom** | **Subtle warm bubble (bg card, radius 12px)** | **Full-width, transparent** | **32px** | **768px** |

### Tool Call Display

| Product | Pending State | Running State | Success State | Error State | Grouping |
|---------|--------------|---------------|---------------|-------------|----------|
| Claude.ai | "Analysis" block with tool icon | Streaming monologue or progress | Collapsed chip with icon | Inline red text | Stacked chips at message bottom |
| ChatGPT | "Action" pill (e.g., "Using Python...") | Pulsing status with NL description | Hidden/collapsed, badge only | Amber pill + "Show Details" | Aggressive — 5 calls = 1 accordion |
| Cursor | Terminal-style lines | Spinner + real-time diff | Summary ("Read 4 files") | IDE "Problems" tab integration | Individual vertical timeline |
| Open WebUI | Status bubble with icon | Pulsing + optional log stream | Checkmark, rendered result | Toast + expanded JSON | Horizontal chips row |
| LobeChat | "Inspector" block | Expanding animation | Collapsible with result | Red-tinted inspector | Individual with expand |
| LibreChat | Status badge | Collapsible narrow bar | Collapsed horizontal bar + chevron | Expanded with error detail | Individual with collapse |
| **Loom** | **Compact pill: icon + name** | **Pulsing rose indicator** | **Collapsed chip, 1 line** | **Expanded, muted red bg** | **3+ calls = accordion** |

### Streaming Indicators

| Product | Thinking State | Generating State | Completion Signal |
|---------|---------------|-----------------|-------------------|
| Claude.ai | Pulsing border on thinking block (2s infinite) | Solid rectangular blinking cursor | Cursor disappears, actions fade in |
| ChatGPT | "Emotive Point" — iridescent pulsing disc | "Liquid streaming" — opacity+blur fade-in per batch | Point settles, actions appear |
| Perplexity | Checklist of search steps (progressive disclosure) | Word-level fade-in ("comet pulse") | Sources grid + follow-ups appear |
| Open WebUI | 3-dot pulse + optional "Thought" process | Fade-in streaming + t/s stats pill | Stats pill finalizes |
| LobeChat | "Jelly dot" — organic border-radius morphing | Sinusoidal breathing pulse | Dot dissolves, action bar appears |
| **Loom** | **Pulsing rose glow on thinking block** | **Batch token rendering with opacity fade** | **Actions fade in (200ms)** |

### Sidebar Design

| Product | Organization | Active Indicator | Collapsed Mode | Density |
|---------|-------------|-----------------|---------------|---------|
| Claude.ai | Time groups (uppercase tracked headers) | bg rgba(255,255,255,0.1) + left accent border | Not icon-only | Airy (8px 12px padding) |
| ChatGPT | Projects + time groups | Highlighted background | Collapsible | Professional, tight |
| Perplexity | Slim vertical icon rail + expanded thread list | Turquoise accent | Icon-only rail default | Compact |
| Open WebUI | Time groups (Today, Yesterday, 30 Days) | Background highlight | Icon-only "Slim" mode | Dense, grouped |
| LobeChat | Session list + Agent Marketplace + right context panel | Background + border | Collapsible | Medium |
| LibreChat | Folders + search + time groups | Background highlight | Collapsible | Power-user dense |
| **Loom** | **Time groups with tracked labels** | **Left 2px rose border + bg tint** | **Icon-only strip** | **Dense but breathable** |

---

## What Makes Each Product Feel "Premium" (Synthesis)

### Claude.ai: Restraint
- Near-invisible borders (`rgba(255,255,255,0.06)`)
- Off-black base simulating "expensive dark matte paper"
- Serif + sans-serif typography pairing (editorial print design influence)
- Very soft, large drop shadows on floating elements only
- Progressive disclosure — nothing visible that doesn't need to be

### ChatGPT: Polish and Motion
- Custom typeface (OpenAI Sans) with ink traps — feels bespoke
- Physics-based micro-interactions (20ms button depress, inertia on elements)
- Glassmorphic overlays with iridescent borders
- Dense 4px/8px grid system
- Unified "emotive point" as interaction focus

### Perplexity: Information Density
- "Invisible UI" — almost no shadows, minimal borders, every line has a purpose
- No bot avatar — presents as "knowledge engine" not chatbot persona
- Citation-forward design (sources as first-class citizens)
- Turquoise accent used with extreme restraint
- "Scandinavian subway" aesthetic — utility first

### Open WebUI: Configurability
- OLED mode (pure black option)
- Model comparison side-by-side
- Real-time performance stats (tokens/second)
- Extensive theming via CSS variables
- "Workspace" approach rather than simple chat list

### LobeChat: Visual Flair
- Spring physics animations on everything (stiffness: 100, damping: 20)
- "Tactile maximalism" — squishy button depress (`scale(0.95)`)
- OLED-optimized dark mode (#121212)
- Tonal elevation (white overlay percentages instead of fixed colors)
- Agent marketplace as first-class UI concept

### LibreChat: Power Features
- Conversation branching / forking (killer feature for researchers)
- Multi-model side-by-side
- Artifacts sidebar (Claude-like)
- Folders + search for conversation management
- Mermaid + LaTeX rendering

---

## Loom's Premium Identity: The Recommendation

Based on analysis of all six products, Loom's "premium" should come from the **Claude.ai playbook** (restraint, typography, invisible borders, progressive disclosure) adapted with **Loom's distinctive warmth** (dusty rose accent, cream text, warm charcoal).

**Adopt from Claude.ai:**
- Invisible borders (6-10% opacity)
- Hidden-until-hover message actions
- Full-width assistant messages
- Generous inter-turn spacing with tight intra-turn spacing
- Progressive disclosure as the default pattern
- Soft focus glows on interactive elements

**Adopt from ChatGPT:**
- Dense grid system (4-8px increments)
- Action pills for tool calls (compact, semantic)
- Aggressive tool call grouping
- Batch streaming with opacity fade-in

**Adopt from Perplexity:**
- "Invisible UI" ethos — every element must justify its existence
- No chatbot personification (Loom is a developer tool, not a persona)
- Extreme restraint on accent color usage

**Adopt from Open WebUI:**
- Slim sidebar collapse to icon strip
- Real-time status display during operations
- Time-grouped session organization

**Skip (unique to others, wrong for Loom):**
- LobeChat's "tactile maximalism" — too playful for a developer tool
- ChatGPT's iridescent/rainbow gradients — conflicts with warm palette
- LibreChat's conversation branching — too complex, wrong mental model
- Open WebUI's model comparison — unnecessary for 2-model product

---

## Implementation Complexity Summary

| Complexity | Features | Estimated Effort |
|-----------|----------|-----------------|
| **LOW** (CSS-only) | Palette swap, border opacity, text hierarchy, selection color, focus glow, hidden-hover actions, inter-turn spacing, full-width assistant messages | 1-2 days each |
| **MEDIUM** (CSS + minor JS) | Message entrance animation, streaming fade-in, expand/collapse animation, glassmorphic overlays, toast system, sidebar restyle, active session indicator, tool card restyle | 2-4 days each |
| **HIGH** (significant JS/architecture) | Execution chain grouping, semantic streaming states, token/cost display, context window gauge, slim sidebar collapse | 3-7 days each |

---

## Sources

- Claude.ai interface — Gemini research analysis cross-referenced with direct product knowledge (HIGH confidence)
- ChatGPT post-GPT5 interface — Gemini research analysis of 2026 updates (MEDIUM confidence — some details may be speculative about unreleased features)
- Perplexity interface — Gemini research analysis (HIGH confidence)
- Open WebUI — Gemini research analysis of v0.5-0.8 (HIGH confidence)
- LobeChat — Gemini research analysis of Lobe UI system (MEDIUM-HIGH confidence)
- LibreChat — Gemini research analysis of current GitHub main (HIGH confidence)
- Cross-product comparison of surface layering, typography, animation timing (HIGH confidence — patterns verified across multiple sources)
- Tool call display patterns comparison (HIGH confidence — well-documented patterns)

---

*Feature research for: Loom v1.1 Visual Redesign*
*Researched: 2026-03-03*
