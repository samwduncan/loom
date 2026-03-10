# M3 Polish — Deferred Context

**Purpose:** Preserves all visual polish research, ideas, and gap analysis from the pre-M3 planning session (2026-03-09). This content was originally scoped for M3 but deferred to a later milestone when we restructured to build workspace panels first.

**IMPORTANT: Read this file when starting the polish milestone.**

---

## 1. Adversarial Review Findings (Gap Analysis)

### Critical Missing Panels (no milestone assignment in original plan)
1. **File Tree + Code Editor** — V1 had full file browsing, CodeMirror editor, image viewer. Zero plan in M3-M5.
2. **Terminal / Shell** — V1 had xterm.js terminal with WebSocket. Zero plan in M3-M5.
3. **Git Panel** — V1 had changes view, commit composer, file staging, history view. Zero plan in M3-M5.

### V1 Features Without M3-M5 Home (24 items)
- Quick Settings Panel (draggable side panel with toggles)
- File mentions (@) in composer with fuzzy search
- Slash commands (/) with menu
- Mobile navigation (bottom nav bar, glass morphism)
- PWA safe area support
- Session rename (double-click in sidebar)
- Session delete (context menu)
- Session protection (navigate-away warning)
- Paginated history loading (load earlier, load all)
- Multi-provider model selection UI
- Provider switching in header/composer
- TaskMaster integration panel
- Whisper/dictation (hidden in V1, potential feature)
- Preview tab (empty in V1, potential feature)
- Companion sprites (backend exists, no frontend)
- Turn auto-collapse (IntersectionObserver)
- Per-turn usage footer (token breakdown)
- Error banner system (crash/exit detection)
- Quick settings: auto-expand tools, show raw params, show thinking
- Cross-tab sync for preferences
- Version check + upgrade modal
- Processing indicators for active sessions
- Reconnect skeletons during WebSocket recovery
- Temporary session IDs (replaced after first response)

### M1-M2 Ideas & Insights Captured During Development
1. `useLayoutEffect` (not useEffect) for scroll-to-bottom — proven pattern
2. Segment array architecture for ActiveMessage — handles complex interleaved streams
3. Two-phase streaming renderer (rAF innerHTML → react-markdown) — proven at 60fps
4. DOMPurify for innerHTML XSS protection — zero incidents
5. CSS Grid 0fr/1fr for expand/collapse — used across thinking, tools, groups
6. 5-state composer FSM prevents double-send race conditions
7. Session-scoped permission banners prevent cross-session leakage
8. WebSocket callback injection keeps network layer decoupled from React
9. Multiplexer as pure functions — zero store imports, fully testable
10. `content-visibility: auto` for off-screen messages (not yet stress-tested)
11. PWA via Tailscale MagicDNS HTTPS — viable mobile access path
12. Happy Coder session scanner pattern (JSONL file watcher) — enables attach-to-existing
13. Happy Coder pricing calculator with cache token support

### Constitution Items Flagged [NEEDS REVIEW]
1. Section 3.5: Tailwind v4 @theme inline approach
2. Section 5.1: exactOptionalPropertyTypes compiler flag
3. Section 11.1: Whether LazyMotion Tier 3 is actually needed
4. Linting Appendix B: Additional lint rules TBD
5. React Bits npm install BANNED — source-copy only

---

## 2. Visual Effects Plan (from visual-effects-audit.md)

### Tier 1: High Priority (proven, adopt)
- **Aurora** — WebGL flowing gradient background during streaming (ogl ~30KB lazy)
- **Grainient** — WebGL gradient with film grain for idle ambient (ogl shared)
- **StarBorder** — CSS animated border for active/focused elements
- **DecryptedText** — "Hacker" text reveal for session titles, model names

### Tier 2: Prototype (needs perf testing)
- **GlassSurface** — SVG displacement glass effect for modals/Cmd+K (Chrome-only full support)
- **Iridescence** — WebGL holographic shimmer for sidebar header accent
- **LiquidChrome** — WebGL metallic liquid for settings/about page
- **AnimatedList** — Message entrance animations (may conflict with scroll)
- **GlareHover** — Alternative to SpotlightCard for tool cards

### Tier 3: Explore (from Magic UI / Aceternity / others)
- **Border Beam** (Magic UI) — animated beam traveling along border for active tools
- **Shimmer Button** (Magic UI) — subtle shimmer sweep on hover for CTAs
- **Dot Pattern / Grid Pattern** (Magic UI) — empty state / panel backgrounds
- **Meteors** (Magic UI) — falling particles as subtle ambient effect
- **Spotlight** (Aceternity) — card hover effect alternative
- **Background Beams** (Aceternity) — ambient streaming background lines
- **Lamp Effect** (Aceternity) — dramatic top-down light cone for empty state
- **Text Generate** (Aceternity) — words appearing with blur-in for welcome text
- **Sparkles** (Aceternity) — subtle sparkle particles for success states

### OKLCH-to-Hex Bridge (required for WebGL components)
```typescript
// src/src/lib/oklch-to-hex.ts
export function getTokenAsHex(tokenName: string): string {
  const computed = getComputedStyle(document.documentElement)
    .getPropertyValue(tokenName).trim();
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = computed;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}
```

### Performance-Gated Activation Pattern
```typescript
const shouldAnimate = useUiPreferences(s => s.reducedMotion === false);
const isStreaming = useStreamStore(s => s.isStreaming);
// Aurora: only during streaming, with CSS containment
{shouldAnimate && isStreaming && (
  <div style={{ contain: 'strict', position: 'absolute', inset: 0 }}>
    <Aurora colorStops={colorStops} speed={0.3} amplitude={0.6} blend={0.4} />
  </div>
)}
```

---

## 3. Component Adoption Map Summary

Full details in `.planning/COMPONENT_ADOPTION_MAP.md`.

### shadcn Primitives Needed
- **Settings + Cmd+K (M3):** tabs, form, field, input, input-group, label, switch, accordion, select, slider, checkbox, card, command, empty, skeleton, spinner
- **Future panels:** context-menu, resizable, table, textarea, alert-dialog
- **After polish milestone:** ~27 of 58 primitives (~47%)

### What to Keep Custom (our differentiators)
- Chat message bubbles (streaming integration, segment architecture)
- Tool cards (state machine, elapsed time, ANSI)
- Permission banners (countdown ring, keyboard shortcuts)
- Streaming cursor, status line, diff viewer
- Active message segments (core architecture)

---

## 4. Competitive Analysis Highlights (for polish milestone)

From `.planning/reference-app-analysis.md`:

### 15 Non-Negotiable Fundamentals (every top product has these)
1. Dark theme with warm undertones
2. Monospace code, variable-width prose
3. Max-width content column (640-768px)
4. Streaming with word-level granularity
5. Copy button on code blocks
6. Syntax highlighting
7. Auto-scroll during streaming
8. Stop/cancel button
9. Session history sidebar
10. Empty state with suggested prompts
11. Responsive mobile layout
12. Loading indicators during AI processing
13. Error display with retry
14. Keyboard shortcuts
15. Markdown rendering (tables, lists, headings)

### Standout Innovations to Consider
- Claude.ai: Artifacts panel (side-by-side code execution)
- ChatGPT: Canvas mode (inline editing)
- Perplexity: Source citations with hover previews
- LobeChat: Plugin marketplace UI

---

## 5. Project Soul Reminders (for visual consistency)

From `.planning/PROJECT_SOUL.md`:
- **North star:** "Construction Site for Software" — precise as surgical laser, warm as old library
- **Non-negotiable feel:** Mathematical precision, intentional negative space, tactile physics (springs > easing), deep charcoal & dusty rose
- **Typography:** Inter for UI clarity, Instrument Serif for editorial warmth, JetBrains Mono for code truth
- **Color:** OKLCH perceptually uniform, surface hierarchy via lightness steps

---

*This file is consumed during the polish milestone's `/gsd:new-milestone` research phase.*
*Cross-reference with: COMPONENT_ADOPTION_MAP.md, visual-effects-audit.md, chat-interface-standards.md, reference-app-analysis.md, PROJECT_SOUL.md*
