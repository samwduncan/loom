# Reference App UI/UX Analysis

A granular breakdown of what makes each reference product an industry leader, covering design language, layout, message display, tool integration, streaming, conversation management, and the specific decisions that elevate them.

---

## 1. Claude.ai (Anthropic)

### Design Philosophy: "Ink on Paper"
Claude.ai's defining choice is treating AI conversation as **editorial content, not software output**. The entire interface mimics a high-quality publication rather than a tech product.

### Layout
- **Three-pane:** Sidebar (~260px) + Chat column (~768-800px max-width) + Artifacts panel (50-60% when active)
- Built on an **8px grid** with 4px sub-grid for tight components
- **Zen Mode** hides sidebar entirely for focused writing
- Sticky header: sidebar toggle, model selector (center), share/knowledge/artifacts toggles (right)

### Design Language
| Element | Light Mode | Dark Mode |
|---------|-----------|-----------|
| Background | `#FAF9F5` (warm cream "paper") | `#0D0D0D` (deep charcoal) |
| Sidebar | `#F5F5F0` | `#000000` (pure black) |
| Primary Accent | `#D97757` / `#C15F3C` (Terracotta) | Same |
| Text | `#1F1E1D` (dark brown-gray, NOT black) | `#ECECEC` |
| Borders | `#E8E6DC` (very subtle) | `#2F2F2F` |

**Brand colors:** Crail (terracotta), Cloudy (warm grey `#B1ADA1`), Pampas (cream `#F4F3EE`)

### Typography — The Killer Differentiator
- **AI responses: Serif font** (proprietary "Anthropic Serif" or Lora) — the ONLY major AI chat using serif for responses. Evokes academic rigor, literary depth.
- **UI chrome: Inter or Poppins** (sans-serif)
- **Code: Fira Code / JetBrains Mono**
- **Line-height:** ~1.6 for body text
- Text uses dark brown-gray (`#1F1E1D`) instead of pure black — deliberate warmth

### Message Display
- **User:** Right-aligned, subtle gray bubble, edit icon on hover
- **Assistant:** Left-aligned, **NO bubble** — text sits directly on the paper-colored background, creating a document-like reading experience
- Separated by thin horizontal lines + generous whitespace rather than enclosed bubbles
- Staggered fade-in: thinking block → text → action buttons (~100ms stagger between elements)

### Streaming & Thinking
- **Streaming:** Smooth continuous "reveal" motion, NOT word-by-word typewriter — text appears fluidly with a pulsing vertical bar cursor
- **Thinking block:** Collapsible accordion, collapsed by default. Background `#F4F3EE` (cream). Expands with organic `cubic-bezier(0.16, 1, 0.3, 1)` easing
- **Loading:** Hand-drawn "wobbly" spinner animations — artisan feel vs competitors' tech-polish

### Tool Calls & Artifacts
- **Tool calls:** Compact horizontal blocks with tool name + status icon, expandable to show request/response JSON
- **Permission pill:** Requires manual "Allow" before external actions
- **Artifacts panel:** Slides in from right with spring-curve animation. Live renders React, HTML/CSS, SVG, Mermaid. Version control slider to rewind. Direct edit mode. Download button.
- **Code blocks:** Deep charcoal background, 6-8px radius, Shiki syntax highlighting, copy button top-right, language label, max 300-500px height with overflow scroll

### Input Area
- Pill-shaped, auto-growing textarea
- Left: paperclip/attachment. Right: send arrow (terracotta when active, gray when disabled → morphs to stop square during generation)
- Model selector, web search toggle, "Use Style" menu (Professional, Code-only, Creative, Concise, Formal, Explanatory, custom)
- Files appear as chips above input, up to 5 files/30MB each

### Conversation Management
- Date grouping: Today, Yesterday, Previous 7/30 Days
- Starred conversations section
- **Projects** as primary organizational unit (folder + persistent system prompt + knowledge base)
- No nested folders for standalone chats
- Search bar in sidebar (Pro users)
- Share generates snapshot link with "Update Link" option

### QoL & Keyboard Shortcuts
- `Cmd+K` new chat, `Cmd+/` shortcuts, `Cmd+.` stop, `Cmd+Shift+L` toggle sidebar
- Conversation branching with version toggle (`< 2/2 >`) after editing
- Drag-and-drop file upload dims entire UI with dashed border overlay
- Clipboard paste shows instant thumbnail
- LaTeX (KaTeX), GFM tables, Mermaid in Artifacts

### What Makes It Best-in-Class
1. **Serif typography** — unique among all competitors, creates "thoughtful" feel
2. **Warm color palette** — terracotta accent + cream backgrounds avoid clinical tech aesthetic
3. **Document-like messages** — no bubbles, feels like reading a well-typeset page
4. **Artifacts pioneer** — first to do side-panel interactive rendering, competitors followed
5. **"Ink on paper" not "text on screen"** — brown-gray text on warm cream, not black on white
6. **Content density control** — heavy content moves to artifacts, keeping chat stream clean
7. **Organic animations** — wobbly spinners, spring curves, staggered fades create craft feel

### Tech Stack
Next.js (React), Tailwind CSS, Radix UI + shadcn/ui, Framer Motion (LazyMotion), React-Markdown, KaTeX, Shiki, Lucide React icons

---

## 2. ChatGPT (OpenAI)

### Design Philosophy: "Zero UI" + Living Gradient
Maximum whitespace, minimal chrome, content-first. The rainbow "Aura" gradient is a **functional state indicator**, not decoration.

### Layout
- **Three-column:** Sidebar (260px) + Chat column (768px / 48rem max-width, centered) + Canvas panel (60-70% when active)
- Near-black `#0d0d0d` base with layered depth through opacity, NOT borders
- "Intelligent-Collapse" sidebar: auto-hides on smaller viewports, persistent on large

### Design Language
| Element | Hex |
|---------|-----|
| Main background | `#0d0d0d` |
| Sidebar | `#171717` |
| Secondary surface | `#212121` |
| User bubble | `#2f2f2f` |
| Assistant message | No bubble (on `#0d0d0d`) |
| Primary text | `#ececec` |
| Muted text | `#b4b4b4` |
| Input composer | `#2f2f2f` |
| Code block | `#000000` |

~10 user-selectable accent colors for personalization.

### The Rainbow/Aura System
**NOT decorative — it's a functional affordance communicating AI state:**
- **Loading ring:** `conic-gradient` circular aura during initialization
- **Emotive Point:** Pulsing disc during reasoning (o1/o3 models), 500ms cycle with expanding/contracting `drop-shadow`
- **Background mesh:** Subtle animated `radial-gradient` during reasoning
- **Voice interface:** Central animated orb with gradient colors

**Aura palette:** Electric Cyan `#00F2FE` → Deep Periwinkle `#4FACFE` → Soft Orchid `#BAA5C3` → Sunset Peach `#FF9E7D` → Luminous Gold `#F6D365` → AI Mint `#5EE7DF`

### Typography
- **Primary:** **Söhne** (Klim Type Foundry) — weights: Buch (400), Kräftig (500), Halbfett (600-700)
- **Monospace:** **Söhne Mono** for code
- Bespoke **OpenAI Sans** in some contexts
- Fallback: `ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto`

### Message Display
- **User:** Right-aligned, `#2f2f2f` bubble, 12-16px radius
- **Assistant:** Left-aligned, NO bubble — sits on `#0d0d0d` surface (asymmetric design = instant distinction)
- **AI avatar:** Hexagonal "Blossom" logo, cross-fades into animated Emotive Point during generation
- **Actions below assistant message:** Copy, thumbs up/down, regenerate, read aloud
- Version indicator after editing (`v2 of 2`)

### Streaming & Thinking
- **Token appearance:** Words fade from `opacity:0→1` over 200-250ms ("smooth bleed" not mechanical typewriter)
- **Cursor:** Sliding 8px vertical bar with `cubic-bezier(0.23, 1, 0.32, 1)` transition, 800ms pulse when idle
- **Thinking (o1/o3):** "Thought for [X] seconds" in muted text, collapsible with chevron, left grey border on expanded reasoning block
- **Implementation:** Tokens accumulated in React Ref, visible State updated at 30-60ms intervals

### Tool Calls
- **Web browsing:** Glassmorphic pill: "Searching the web..." with progress animation, sources count
- **Citations:** Inline superscript `[1]`, `[2]` — hover shows popup card with favicon + title + snippet
- **Code interpreter:** Collapsible "Analysis" block, split into code + output, interactive charts
- **DALL-E:** Large images inline, click-to-expand lightbox, download + edit buttons
- **Shopping:** Horizontal carousel with prices and ratings

### Canvas
- Right-side split-pane, takes 60-70% when open
- **Code editor:** CodeMirror 6 (not Monaco — chosen for modularity + mobile support)
- **Text editor:** ProseMirror
- OpenAI sponsors both library creators (Marijn Haverbeke)
- Live HTML/React preview in sandboxed iframe

### Input Area (The Composer)
- **Shape:** Highly rounded pill (24px radius), `#2f2f2f` background
- **Left:** `+` attachment button (files appear as small cards inside input)
- **Center toggles:** Globe (web search), thought bubble (reasoning mode), document (Canvas)
- **Right:** Microphone for voice, send arrow (gray→white on content)
- **Model selector:** Top-center semi-transparent pill dropdown, models grouped: Reasoning / General / Legacy

### Conversation Management
- Date groups: Today, Yesterday, Previous 7/30 Days, then monthly
- **Projects:** Smart folders with name, emoji, theme color
- Custom GPTs surfaced prominently
- **Semantic search** — search by concept, not just keywords
- Three-dot menu: Share, Rename, Archive, Delete

### QoL Features
- `@` mentions for GPTs: opens floating picker, selected GPT appears as colored pill in input
- **Memory system:** Brain icon + "Memory updated" appears briefly, manage in settings
- **Temporary Chat** mode: shield/ghost badge, grayed sidebar
- Suggested follow-ups as semi-transparent pill chips below response
- `Cmd+K` command palette for universal search/action

### Empty State
- Dynamic personalized greeting: "How can I help you today, [Name]?"
- 2x2 or 3x2 grid of suggestion cards with icons + titles
- Significant whitespace, subtle charcoal radial blur background gradient

### Animations
| Element | Detail |
|---------|--------|
| Token entrance | 200-250ms fade per chunk |
| Streaming cursor | 8px sliding bar, 100ms cubic-bezier |
| Thinking indicator | Emotive Point, 500ms pulse cycle + glow |
| Sidebar transitions | 150-200ms physics-based curve with bounce |
| Copy feedback | Icon → checkmark with scale overshoot, ~800ms |
| Rainbow shimmer | `conic-gradient` ring + `radial-gradient` mesh |

### What Makes It Best-in-Class
1. **Semantic token design system** — `bg-token-main-surface-primary` classes mapped to CSS custom properties, not raw Tailwind
2. **Depth without borders** — opacity, elevation, background tint differences create hierarchy (no visible borders)
3. **The "alive" quality** — rainbow/aura gradient is functional, communicates AI state
4. **Zero-lag input** — tokens in Refs, state at 30-60ms intervals = buttery streaming
5. **Progressive disclosure** — simple chat for new users, Canvas/reasoning/Projects/memory for power users
6. **Contextual intelligence** — tools surface only when relevant
7. **Söhne typography** — bespoke, premium font that no competitor uses

### Tech Stack
Next.js (v14/15, App Router), Tailwind CSS + semantic token layer, Radix UI + shadcn/ui pattern, Zustand + TanStack Query, CodeMirror 6 + ProseMirror, Highlight.js, Framer Motion, Lucide icons, SSE streaming

---

## 3. Perplexity.ai

### Design Philosophy: "Search Engine Meets Research Publication"
Not chat-first — **search-first**. Every query produces a structured article with citations, not a conversation.

### Layout
- **Left sidebar** (70px collapsed / ~280px expanded, on hover): Navigation, branding, organization. `#1A1A1A` background.
- **Main content area:** Centered column (~800-850px max-width). `#0A0A0A` to `#0F0F0F` (near-black, DARKER than ChatGPT).
- **No persistent right sidebar.** Sources integrated inline.

### Design Language
| Element | Hex |
|---------|-----|
| Main background | `#0A0A0A` to `#0F0F0F` |
| Sidebar/cards | `#1A1A1A` |
| Search bar | `#262626` |
| Card hover | `#2A2A2A` |
| Borders | `#333333` to `#404040` |
| Primary text | `#FFFFFF` (pure white) |
| Secondary text | `#B3B3B3` |
| Tertiary text | `#8A8A8A` |
| Brand accent | `#20B8CD` / `#00C2CB` (Teal/Cyan) |

**Near-black backgrounds** (`#0A0A0A`) are darker than ChatGPT (`#212121`) or Claude (`#0D0D0D`) — more immersive, focused reading.

### Typography
- **Font:** Inter throughout
- **Body:** 16px, weight 400-500, **line-height 1.6** (publication-quality readability)
- **Branding:** "perplexity" always lowercase, 48-50px, weight 200, `letter-spacing: -0.02em`
- **No text-transform uppercase anywhere** — all natural case

### Answer Display — NOT Messages, Structured Articles
Answers are NOT chat messages. They're **structured research documents:**

1. **Query as page heading** (32px, weight 500)
2. **Tab navigation:** Answer | Images | Sources | Steps — active tab has 2px white bottom border
3. **Source cards carousel** (horizontal scroll, ABOVE the answer) — sources shown BEFORE answer
4. **Answer text** rendered as rich Markdown article
5. **Inline citation numbers** — superscript `[1]`, `[2]` like academic papers
6. **Action buttons:** Share, Export, Rewrite, thumbs up/down, Copy
7. **Related questions** section below

### Source Cards
**Compact (carousel):** 200px wide, `#1A1A1A` bg, 8px radius, 12px padding. Contains: 16x16 colored domain badge (letter initial, color-coded per domain) + domain name + title (2 lines max).

**Full (Sources tab):** Full width, 40x40 domain badge, title + URL + snippet (3 lines max).

**Domain-specific badge colors:** Wikipedia=black, LinkedIn=`#0077B5`, Instagram=`#E1306C`, etc.

### Streaming & Loading
**Critical trust-building sequence:**
1. Steps arrive first (processing indicators)
2. **Sources arrive second** (cards populate)
3. Images arrive third
4. **Answer tokens stream last**

Sources appear BEFORE the answer — user sees evidence before synthesis. This is the key UX decision.

**Shimmer:** Base `#262626`, highlight `#2A2A2A` — very subtle.

**Search→Results transition:** 600ms `easeInOutCubic`: branding fades out (first 30%), search bar scales 1.0→0.65 and slides up, results slide in from below.

### Tool Integration
- **Focus modes:** All, Academic, Writing, Wolfram|Alpha, YouTube, Reddit — selectable pills
- **Pro Search toggle:** Switch next to input, `#202222` unchecked, triggers multi-step deep research
- **Processing steps:** Each step has status icon + title + description, green checkmarks for completed

### Input Area
**Home state:** Centered Google-like search bar. Full width up to 600px, 20px 24px padding, `#1A1A1A` bg, 16px radius. Placeholder: "Ask anything..."

**Results state (follow-up):** Fixed to bottom, fully rounded (36px radius), "Ask follow-up" placeholder, Pro toggle + fork button inside.

**Quick action chips** below home search: Parenting, Compare, Health, Learn, Fact Check — outlined pills, 20px radius, `#1A1A1A` bg.

### Content Organization
- **Home:** Centered search bar (Google-like)
- **Discover:** Curated news feed with trending topics, category tabs (Tech, Finance, Arts, Sports, Entertainment)
- **Spaces:** User-organized topic collections
- **Library:** Search history and saved threads

### What Makes It Best-in-Class
1. **Search-first, not chat-first** — opens with Google-like bar, signals "find information" not "have conversation"
2. **Sources before answers** — evidence before synthesis = trust building
3. **Article-like output** — structured documents with sections/headers, not conversational messages
4. **Inline academic citations** — `[1]`, `[2]` footnotes with source cards, fundamentally different from competitors
5. **Tab separation of concerns** — Answer, Images, Sources, Steps are independent views
6. **Near-black immersive reading** — darker than any competitor, optimized for focus
7. **Discover feed** — bridges search and browsing, makes it a daily-use information tool
8. **Typography discipline** — consistent Inter at careful sizes, 1.6 line-height, publication feel

---

## 4. Open WebUI

### Design Philosophy: "ChatGPT Clone Done Right"
Deliberately mirrors ChatGPT's layout to eliminate learning curve, then adds power features (multi-model, arena, pipelines).

### Layout
- **Left sidebar** (resizable via Svelte store): Conversation history, folders, channels, pinned chats, user menu
- **Main chat area** (center): Model selector top, messages middle, input bottom. `max-w-5xl` normal, `max-w-full` widescreen mode
- **Right panel** (toggleable): Artifacts rendering, chat parameter controls

### Design Language
**Color system:** Neutral gray in **OKLCH color space** (modern, perceptually uniform):
```
gray-50:  oklch(0.98 0 0)  →  gray-950: oklch(0.16 0 0)
```
Completely achromatic (chroma=0). Custom `gray-850` step for finer dark mode control.

| Element | Value |
|---------|-------|
| Light body | `#fff` |
| Dark body | `#171717` |
| Dark code | `bg-black` |
| Dark scrollbar thumb | `rgba(67,67,67,0.6)` |

**Theme modes:** Light, Dark, OLED Dark (pure black), System default.

### Typography
5 custom fonts loaded:
1. **Inter** (Variable) — system-wide base
2. **Archivo** (Variable) — `.font-primary` (headings, prominent text)
3. **Mona Sans** — loaded but minor use
4. **InstrumentSerif** — `.font-secondary` (decorative/display)
5. **Vazirmatn** (Variable) — RTL/Arabic support

**UI Scale:** Global `--app-text-scale` CSS variable (slider in settings) scales entire document proportionally.

### Message Display
- **User:** 32px circle profile image left, content right. Configurable chat bubble mode.
- **Assistant:** Model avatar (rounded circle from API), model name above response
- **Multi-model comparison:** `MultiResponseMessages.svelte` — side-by-side columns OR tabs (configurable). Each model's response streamed independently. **Merge button** combines via Mixture of Agents (MoA).
- **Streaming shimmer:** `linear-gradient(90deg, #9a9b9e 25%, #2a2929 50%, #9a9b9e 75%)` with `background-clip: text`
- **Configurable:** `chatBubble`, `chatDirection` (LTR/RTL/auto), `chatFadeStreamingText`

### Tool & Status Display — Sophisticated Timeline
**StatusHistory:** Vertical timeline during streaming:
- Small `1.5px` dots connected by `0.5px` vertical line
- Status types: `web_search`, `knowledge_search`, `queries_generated`, `sources_retrieved`, generic
- Active statuses get shimmer animation
- Collapsible

**Web search results:** Collapsible container with favicon + title per result, linked to Google.

**Code executions:** **Pill-shaped buttons** with status icon in circle (Spinner=running, Check=success, XMark=error). Click opens CodeExecutionModal.

**Citations:** Clickable numbers, relevance percentage display, CitationModal.

### Input Area — Rich & Extensible
- **TipTap/ProseMirror** rich text editor with `prose dark:prose-invert` (legacy textarea fallback)
- **Attachment menu (`+`):** Upload files, camera, screen capture, knowledge bases, notes, previous chats, attach webpage URL, Google Drive, OneDrive
- Web search toggle, tool toggles, voice recording
- `/` for prompt templates, `#` for documents/URLs, `@` for model switching mid-conversation
- AI-powered autocomplete suggestions
- Message queue (messages queue while AI responds)

### Model Selector
- Top of chat (not inside input)
- Fuzzy search via Fuse.js, tag-based filtering, connection type filtering
- Drag-and-drop reordering, arrow key navigation, pin to sidebar

### Conversation Management
- **Sidebar:** Pinned models, Channels (Discord/Slack-style rooms, Beta), Folders (hierarchical, drag-and-drop), Pinned chats, Chat history (lazy-loaded pagination)
- **Chat items:** Custom-sized via text scale, drag-to-folders, context menu (pin, tag, clone, archive, share, delete)
- **Search:** `SearchModal.svelte` for full-text
- **Tags:** Auto-tagging, `tag:` query syntax
- **Export:** JSON, PDF, TXT per chat, bulk JSON for archives
- **Import:** Drag-and-drop JSON onto sidebar

### Unique Features
1. **Arena Mode:** Blind A/B model testing with ELO ranking, leaderboard, topic-based re-ranking
2. **Knowledge Bases:** 9 vector DB options, hybrid BM25 + CrossEncoder re-ranking, inline citations with relevance %
3. **Channels (Beta):** Discord/Slack-style rooms with typing indicators
4. **Voice/Video:** Whisper/OpenAI/Deepgram STT, OpenAI/ElevenLabs TTS, hands-free calls, video with vision models
5. **Notes:** Built-in TipTap-based note-taking system
6. **Pipelines:** Python plugin system via OpenAI-compatible API
7. **Admin:** RBAC, SCIM 2.0, LDAP, analytics dashboard, banners, model whitelisting

### What Makes It Best-in-Class (Self-Hosted)
1. **Familiar layout** — ChatGPT clone eliminates learning curve
2. **OKLCH color space** — cutting-edge perceptually uniform palette
3. **Multi-model comparison** with merge capability (unique)
4. **Arena mode** for blind model evaluation (unique)
5. **Extraordinary settings density** — 30+ interface toggles for every preference
6. **Modern stack** — SvelteKit, Tailwind v4, TipTap, Fuse.js
7. **Community marketplace** for models, prompts, tools

### Tech Stack
SvelteKit, Tailwind CSS v4 (OKLCH), TipTap/ProseMirror, Fuse.js, custom CSS animations

---

## 5. LobeChat

### Design Philosophy: "Apple-Like Premium for Open Source"
The most visually refined open-source chat UI. Systematic design tokens, glassmorphism, and 80+ purpose-built components create premium feel.

### Layout
- **Left: SideNav** — Fixed 58px ultra-narrow icon-only rail. Avatar top, actions middle, settings bottom. 1px `colorBorderSecondary` border.
- **Middle: Session/Conversation List** — Resizable via `DraggablePanel`
- **Main: Chat Area** — `Conversation` orchestrator with `ChatList`, `ChatItem`, `ChatInput`
- **Right: Portal System** — Contextual panels for Artifacts, Documents, FilePreview, Plugins, Threads, Notebook, MessageDetail

### Design Language — Extraordinary Depth

**Color System:** 12-step color scales (Radix-inspired) across **12 hues** (blue, cyan, geekblue, gold, green, lime, magenta, orange, purple, red, volcano, yellow) × **4 variants** (dark, darkA, light, lightA) × 13 steps each + **5 neutral tones** (mauve, olive, sage, sand, slate). Users customize both primary and neutral independently.

**Default primary:** Intentionally grayscale (`#222222` light / `#eeeeee` dark) — neutral canvas, accent colors pop in context.

**Border Radius Scale:** 4px (XS) / 6px (SM) / **8px (default)** / 12px (LG) — consistently soft, rounded aesthetic.

**Control Height:** 36px — generous touch targets.

**Shadows — Four-Layer Realism:**
```css
box-shadow:
  0 1px 0 -1px colorBorder,
  0 1px 2px -0.5px colorBorder,
  0 2px 2px -1px colorBorderSecondary,
  0 3px 6px -4px colorBorderSecondary;
```

**Glassmorphism:**
```css
blur: backdrop-filter: saturate(150%) blur(10px);
blurStrong: backdrop-filter: saturate(150%) blur(36px);
```

**Signature gradient:** `linear-gradient(-45deg, gold, magenta, geekblue, cyan)` — 5s animated, 400% background-size.

**Shiny text loading:** Shimmer sweep across text, 1.5s linear infinite.

**Component variants (CVA):** filled / outlined / borderless × standard / danger.

**Scrollbars:** Custom thin (`0.75em`), appear only on hover, 10px radius thumb.

### Typography
- **Primary:** HarmonyOS Sans — distinctive, high-quality Huawei typeface with excellent CJK support (NOT system defaults)
- **Code:** Hack — optimized readability monospace
- **Full stacks:** English → CJK → Emoji chains for global coverage

### Message Display
- **User (right):** No avatar shown, no title. Bubble variant with `paddingInlineStart: 36px`. DM indicator tag in group chat.
- **Assistant (left):** Square avatar, agent name above. Full width. 16px circular loading indicator at avatar bottom-left during generation.
- **Bubble styling:** 8px padding-block, 12px padding-inline, 1px border via `color-mix(in srgb, colorBorderSecondary 66%, transparent)` — semi-transparent borders.
- **Docs variant:** Alternative no-bubble raw content display.
- **Hover reveals:** Timestamps and action menus hidden by default (`opacity:0`), 200ms ease-out fade-in on hover. Stay visible when dropdown menus open.
- **Branching:** `activeBranchIndex` with count navigation.

### Tool & Plugin Display
- **Accordion component** with 8px gap — collapsible by default, expandable to show results
- **Debug mode** toggle for raw request/response
- **Custom renders** for built-in tools, generic renderer for others
- **MCP plugins:** MCPDetail, MCPInstallProgress, quality scoring system
- **Plugin marketplace:** 40+ plugins, cards with avatar + name + description + tags

### Input Area
- Desktop and Mobile implementations diverge
- TipTap editor, `line-height: 1.5`, 8px padding-block, 12px padding-inline
- Vertically resizable via `DraggablePanel`
- Action bar: left (overflow scroll, hidden scrollbar) + right sections
- `ChatSendButton` with `onSend` / `onStop` callbacks, left/right addon slots

### Conversation Management
- **AI-generated topic grouping** (`GenerationTopicList`)
- **Conversation MiniMap** — unique! 32px wide rail on right edge with indicators per message. Active indicator gets `colorPrimary` fill + scale + glow. Scroll navigation arrows on hover.
- **Branching:** Continuation mode (preserve context) and Standalone mode (fresh start)
- **Export/Import:** ShareModal, DataImporter

### Agent System
- **Agent Builder as Conversation** — describe what you need, auto-configuration
- **Agent Settings:** Meta, Prompt, Chat, Plugin, TTS (with live preview), Modal, Category, Opening message
- **Agent Market:** 505+ agents, full marketplace with search
- **Agent Groups:** Multi-agent collaboration with shared context

### What Makes It Best-in-Class
1. **Systematic 12-step color scales** — hundreds of precisely calibrated colors, far beyond any competitor
2. **Four-layer shadow system** — realistic depth most open-source projects never achieve
3. **`color-mix()` borders** — modern CSS for theme-adaptive semi-transparent borders
4. **HarmonyOS Sans** — distinctive font identity, not generic system defaults
5. **Portal architecture** — right-side panels for everything (artifacts, files, plugins, threads, notebooks) without interrupting chat
6. **Conversation MiniMap** — unique navigation innovation
7. **Glassmorphism + animated gradients** — premium visual signature
8. **80+ purpose-built components** in `@lobehub/ui`
9. **Progressive disclosure** — actions/timestamps hidden behind hover, clean reading surface
10. **73,000+ GitHub stars** — community validation of design quality

### Tech Stack
Next.js (App Router, Server Components), Ant Design foundation + antd-style, class-variance-authority (CVA), polished (color manipulation), Zustand, motion/react (Framer Motion via LazyMotion), CRDT for offline sync

---

## 6. LibreChat

### Design Philosophy: "The VLC of AI"
Plays every model, supports every tool, keeps a familiar interface. **Flexibility over aesthetics.** Provider-agnostic architecture.

### Layout
- **Sidebar (~260px):** Conversation history with date groups, custom folders, search. Collapsible via `Ctrl+Shift+S`.
- **Chat column:** Centered, `max-w-3xl` to `max-w-4xl` (768-896px) — wider than Claude (~800px), matches ChatGPT.
- **Header (sticky):** Current model/preset name, token/cost counter, model switcher dropdown.
- **Artifacts panel (right, optional):** 40-60% width for code previews, Mermaid, rendered HTML/React.

### Design Language
| Element | Hex |
|---------|-----|
| Main background | `#212121` |
| Sidebar/Header | `#171717` |
| User message | `#212121` (matches background) |
| AI message | `#2f2f2f` (subtle elevation) |
| Borders | `rgba(255,255,255,0.1)` |
| Primary text | `#f1f1f1` |

**Surface hierarchy:** Subtle borders (`border-white/10`) instead of shadows. Flat "Bento" aesthetic. Background lightness steps create hierarchy, NOT shadows.

### Typography
- System sans-serif (Inter, Segoe UI, San Francisco)
- Body: 16px. Sidebar: 14px.
- Code: Prism or Shiki syntax highlighting
- Model labels in small-caps next to provider icons

### Message Display
- **User:** Full-width or right-aligned, subtle hover. No heavy bubble wrapper.
- **Assistant:** Left-aligned, flat on canvas, `#2f2f2f` subtle bg elevation. **Provider logo as avatar** (OpenAI spiral, Anthropic A, Google Gemini star). Model name in small-caps.
- **Multi-model:** Brand-colored accents per provider, side-by-side or sequential with colored borders.
- **Thinking:** "Thinking" accordion, auto-collapsed, pulsing border during streaming.

### Tool Call Display
- **Status badge** → **collapsible narrow bar** (progress + elapsed time) → **collapsed bar + chevron**
- Running: spinner + "Calling [Tool Name]..." label
- Success: collapsed horizontal bar
- Error: expanded with red accent
- **MCP tools:** Show source server name ("From: Filesystem MCP"), wrench icon dropdown to toggle servers per conversation
- **Status indicators:** Green gear (active), amber key (auth required), orange plug (connection failed)
- **Approval flow:** Optional "Approve/Decline" for write-heavy MCP actions

### Input Area
- **Endpoint selector** with brand icons and brand-colored accents per provider
- Paperclip for files (upload as files or as text for context injection). Files appear as rectangular cards with type icons + blue progress bar.
- Auto-expanding textarea (~200px max), `Shift+Enter` newlines, `Enter` send
- **Settings cog:** Opens real-time Temperature, Top-P, Frequency Penalty sliders. "Save as Preset" button.
- Send/Stop morphing with pulsating animation

### Conversation Management — Power Feature: Branching
- **Date groups:** Today, Yesterday, Previous 7/30 Days
- **Custom folders** with drag-and-drop
- **Search:** `Ctrl+K` / `Cmd+K` for global cross-conversation search
- **Conversation forking (signature feature):** Pagination arrows (`< 2/3 >`) for branches. "Fork" icon splits conversation into new thread. **Tree View / Conversation Map** shows topological branch view.
- **Export:** Markdown, JSON, CSV, TXT, PNG. Anonymous sharing option.
- **Bookmarks + Presets** as "smart bookmarks"

### Unique Features
1. **Multi-provider switching mid-conversation** — swap GPT-4o to Claude to Gemini, context preserved
2. **Cross-model tool persistence** — tools persist across provider switches
3. **Presets system:** Saves Model + System Prompt + Temperature + all params. Searchable preset cards with model icon.
4. **`librechat.yaml` configuration:** Single source of truth for endpoints, parameters, MCP servers, RBAC
5. **Agents builder:** No-code agent creation with capabilities toggles (code interpreter, file search, artifacts, web search)
6. **MCP marketplace (admin):** Visual configurator, auto-probe for tools, RBAC drag-and-drop per user group

### What Makes It Best-in-Class
1. **Provider neutrality** — treats all models as equal, the ONLY product doing this well
2. **Configuration-driven architecture** — `librechat.yaml` dynamically updates UI without code changes
3. **Cross-model tool persistence** — unique among all competitors
4. **Conversation forking + tree view** — most sophisticated branching navigation
5. **Enterprise-ready** — OAuth2/LDAP/OpenID, RBAC, rate limiting, token budgets, admin GUI
6. **Power-user density** — dense sidebar with folders, search, forking for 100s of conversations

### Where It's Weaker (Loom Opportunity)
- Aesthetics are functional, not premium — standard Tailwind slate/zinc without memorable identity
- No distinctive visual signature (no gradient system, no special typography)
- Minimal animation — Framer Motion included but barely used
- Information density can overwhelm casual users

### Tech Stack
React (TypeScript) + Vite, Tailwind CSS (CSS variable theming), shadcn/ui + Radix UI, Redux Toolkit + useSWR, Framer Motion, Lucide React, `cn` = clsx + tailwind-merge

---

## Cross-Product Comparison Matrix

### Background Colors (Dark Mode)
| Product | Main BG | Sidebar BG | User Bubble | Assistant BG |
|---------|---------|-----------|-------------|-------------|
| Claude.ai | `#0D0D0D` | `#000000` | Subtle gray | None (on BG) |
| ChatGPT | `#0d0d0d` | `#171717` | `#2f2f2f` | None (on BG) |
| Perplexity | `#0A0A0A` | `#1A1A1A` | N/A (search) | N/A (article) |
| Open WebUI | `#171717` | Resizable | Configurable | Model avatar |
| LobeChat | Token-based | 58px rail | Bubble variant | Full-width |
| LibreChat | `#212121` | `#171717` | `#212121` | `#2f2f2f` |

### Typography
| Product | Body Font | Code Font | Distinctive? |
|---------|----------|----------|-------------|
| Claude.ai | Serif (Anthropic/Lora) | Fira Code/JetBrains | **Very** — only serif |
| ChatGPT | Söhne (bespoke) | Söhne Mono | **Yes** — premium bespoke |
| Perplexity | Inter | System mono | Moderate — clean discipline |
| Open WebUI | Inter + Archivo | System mono | Moderate — multi-font |
| LobeChat | HarmonyOS Sans | Hack | **Yes** — distinctive choice |
| LibreChat | System sans-serif | Prism/Shiki | No — generic |

### Chat Column Width
| Product | Max Width |
|---------|----------|
| Claude.ai | ~768-800px |
| ChatGPT | 768px (48rem) |
| Perplexity | ~800-850px |
| Open WebUI | `max-w-5xl` (~1024px) / full |
| LobeChat | Configurable |
| LibreChat | 768-896px |

### Message Style
| Product | User | Assistant | Distinction Method |
|---------|------|-----------|-------------------|
| Claude.ai | Right, subtle bubble | Left, NO bubble | Asymmetric + serif |
| ChatGPT | Right, `#2f2f2f` bubble | Left, NO bubble | Asymmetric + logo |
| Perplexity | N/A (search input) | Article format | Completely different paradigm |
| Open WebUI | Left, avatar+name | Left, avatar+name | Configurable bubble |
| LobeChat | Right, bubble, no avatar | Left, square avatar+name | Placement + avatar |
| LibreChat | Flat/right | Left, provider logo avatar | Provider branding |

### Streaming Animation
| Product | Style | Feel |
|---------|-------|------|
| Claude.ai | Smooth continuous reveal + pulsing bar | Fluid, literary |
| ChatGPT | Word chunks fade 200-250ms + sliding cursor | Smooth bleed |
| Perplexity | Token-by-token, sources arrive first | Trustworthy |
| Open WebUI | Shimmer gradient on text | Technical |
| LobeChat | Shiny text shimmer sweep | Premium loading |
| LibreChat | Standard token streaming | Functional |

### Tool Call Display
| Product | Pattern |
|---------|---------|
| Claude.ai | Compact blocks, permission pill, expandable JSON |
| ChatGPT | Glassmorphic pills, inline citations, interactive charts |
| Perplexity | Focus modes + Pro Search steps, tab-separated sources |
| Open WebUI | Vertical timeline dots, pill-shaped execution status, CodeExecutionModal |
| LobeChat | Accordion with debug mode, custom renders per tool type |
| LibreChat | Status badge → collapsible bar + chevron, MCP source labels |

### Unique Innovations
| Product | Signature Feature |
|---------|------------------|
| Claude.ai | Artifacts pioneer, serif typography, warm editorial design |
| ChatGPT | Rainbow Aura state system, semantic token design, Söhne font |
| Perplexity | Sources-before-answers, academic citation system, search-first paradigm |
| Open WebUI | Multi-model merge (MoA), Arena mode, OKLCH colors |
| LobeChat | Conversation MiniMap, 12-step color system, portal architecture |
| LibreChat | Provider-agnostic switching, conversation forking/tree view, YAML-driven config |

---

## Non-Negotiable Fundamentals (Across All Leaders)

These patterns appear in EVERY top product — they are table stakes:

1. **Centered content column** with max-width 768-850px
2. **Collapsible sidebar** with conversation history
3. **Dark mode as first-class citizen** (not an afterthought)
4. **No bubbles on assistant messages** (or minimal) — content reads like a document
5. **Asymmetric user/assistant styling** for instant distinction
6. **Copy button on every code block** with visual feedback
7. **Hover-revealed actions** that cause zero layout shift
8. **Auto-growing textarea** input with keyboard shortcuts
9. **Send↔Stop button morphing** during generation
10. **Collapsible thinking/reasoning sections**
11. **Smooth streaming** — never janky, never flickering
12. **Generous whitespace** — breathing room between all elements
13. **Consistent border-radius language** across all components
14. **Professional font choices** (Inter, Söhne, or custom — never raw system defaults alone)
15. **Semantic color tokens** — not hardcoded hex values scattered through CSS
