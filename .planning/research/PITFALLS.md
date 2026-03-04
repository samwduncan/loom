# Domain Pitfalls

**Domain:** Premium AI coding agent web interface — greenfield React 18 frontend with streaming chat, multi-provider WebSocket integration, design token system, and complex animation pipeline
**Project:** Loom V2 (greenfield rewrite)
**Researched:** 2026-03-04
**Confidence:** HIGH — grounded in V1 post-mortem evidence, V1 gate report failures, Gemini architecture audits, and Constitution design decisions

---

## Critical Pitfalls

Mistakes that cause rewrites, multi-week debugging sessions, or user-visible regressions across the entire app. V1 evidence indicates these are the failure modes that forced the greenfield rewrite.

---

### Pitfall 1: Dual Color System Proliferation

**What goes wrong:**
CSS token system exists in `:root` and Tailwind config, but components use hardcoded Tailwind arbitrary values (`bg-[#1c1210]`, `text-[#c4a882]`, `border-[#3d2e25]/40`) in parallel. V1 audit found 51 hardcoded hex instances in chat components alone, 144+ across the full codebase across 15 files. After 17 phases of V1 development, a dedicated Phase 11 was required exclusively for hardcoded color removal — a full phase of technical debt remediation.

**Why it happens:**
- AI-assisted development produces "quick fixes" using arbitrary values when the correct token name is unknown
- New components copied from older examples that used hardcoded values
- No automated enforcement — ESLint didn't block `bg-[#...]` patterns
- Each phase added new violations while previous ones were being cleaned up

**How to avoid:**
1. Wire ESLint `no-restricted-syntax` to ban `bg-\[#`, `text-\[#`, `border-\[#` patterns as build-time errors from Phase 1, day 1
2. Define token names before writing components — the token map must exist before any component work begins
3. Use semantic token names, not descriptive ones: `bg-card` not `bg-dark-surface`
4. Create a quick-reference cheat sheet of semantic token names to paste into every Claude Code session context

**Warning signs:**
- `grep -rn '\[#[0-9a-fA-F]' src/` returns any results
- A component works visually but shows wrong color after `:root` token change
- PR review shows `bg-[#` or `text-[#` in diff

**Phase to address:**
Phase 1 (design system foundation). ESLint rule must be enforced before any component is written. Zero tolerance from commit #1.

---

### Pitfall 2: React State for Streaming Tokens — Per-Token setState Jank

**What goes wrong:**
Streaming tokens arrive at 50-100/sec from WebSocket. Each token triggers a React setState call. At that frequency, React's reconciler batches some updates but cannot keep up — the main thread is saturated with VDOM diffs, causing visible stutter, frozen input, and dropped frames. V1 initially used a 100ms setTimeout buffer (better than nothing), then upgraded to requestAnimationFrame (correct approach) mid-development. A V2 rewrite that regresses to naive setState-per-token will fail immediately on any non-trivial response.

**Why it happens:**
- The naive implementation is obvious: `useEffect` + `setState` on each WebSocket message
- React 18's automatic batching helps but does not eliminate reconciler cost at 100/sec
- AI code assistants often suggest the naive pattern because it's the simplest

**How to avoid:**
1. The `stream` store accumulates tokens into a `useRef` buffer — NOT React state
2. A `requestAnimationFrame` loop reads the ref buffer and mutates the DOM directly via ref
3. State flush happens ONLY on stream completion (transitions from streaming to static)
4. The streaming component is the ONLY subscriber to the token buffer; all past messages are `React.memo` wrapped and receive no updates during streaming
5. Verify with React DevTools Profiler: zero re-renders on past messages during active streaming

**Warning signs:**
- Any `setState` call inside the WebSocket message handler for token data
- Past TurnBlock components re-rendering during streaming (visible in React DevTools)
- CPU usage spikes above 40% during streaming of a 1000-token response
- Input field becomes unresponsive while streaming

**Phase to address:**
Phase 2 (streaming foundation / WebSocket integration). Must be the correct architecture from the first streaming implementation. Retrofitting this later requires rewriting the entire message pipeline.

---

### Pitfall 3: Whole-Store Zustand Subscriptions Causing Streaming Re-Render Cascades

**What goes wrong:**
`const store = useStreamStore()` subscribes the component to EVERY change in the stream store. During streaming, the stream store updates 50-100 times/sec. Every component that subscribes to the whole store re-renders 50-100 times/sec — including the sidebar, the header, the settings button, and every past TurnBlock. The app becomes a visual blur and CPU/GPU max out.

**Why it happens:**
- Whole-store subscription is the default pattern many developers know
- The store works fine for low-frequency updates; the bug only manifests at streaming speeds
- AI-generated code often subscribes to the whole store for convenience

**How to avoid:**
- ESLint rule or code review gate: `const store = useXxxStore()` (no selector) is always banned in production code
- Always use `useStreamStore(state => state.specificField)` or `useShallow` for multiple fields
- Only the active streaming message component subscribes to streaming token data
- The `timeline` store (past messages) updates at most once per turn completion — keep streaming state entirely in the `stream` store to prevent cross-contamination

**Warning signs:**
- `useStore()` without a selector in any component
- React DevTools shows header/sidebar/past messages re-rendering during streaming
- Profiler "commit" time spike visible in waterfall during streaming phases

**Phase to address:**
Phase 1 (store architecture setup). The four-store architecture and selector-only pattern must be established before any feature components are written. Add the store subscription rule to ESLint and gate reports.

---

### Pitfall 4: Animation Jank During Streaming — GPU Layer Explosion

**What goes wrong:**
After adding micro-interactions (hover transitions, expand/collapse animations, message entry animations, aurora shimmer effects), the streaming experience degrades. Token arrival causes visible stutter in running animations. The aurora shimmer hitches. Scroll becomes janky. On the AMD Radeon 780M iGPU (the target server), GPU compositing layer budgets are tight.

Three forces collide:
1. Global `transition: all` on buttons fires layout-triggering transitions during streaming
2. Multiple simultaneous aurora gradient elements each claim a GPU compositing layer; exceeding ~8-10 layers triggers CPU fallback
3. Animating `height`, `width`, or `margin` during streaming triggers ancestor layout recalculation that competes with the rAF token buffer

V1 explicitly hit this in Phase 7 research (confirmed via aurora shimmer GPU layer analysis in the streaming UX research document).

**Why it happens:**
- Micro-interactions are added incrementally across phases; each phase adds 1-2 new animations that seem harmless in isolation
- `will-change: transform` is applied liberally without tracking GPU layer count
- `transition: all` is the lazy default; it catches layout-triggering properties

**How to avoid:**
1. Never use `transition: all` — always specify exact properties: `transition: background-color 150ms, color 150ms, opacity 150ms`
2. Banned in the Constitution: animating `height`, `width`, `top`, `left`, `margin` during streaming — use CSS Grid `grid-template-rows` trick for expand/collapse
3. Add `.is-streaming` class to chat container; use it to disable non-critical animations during active token delivery
4. Cap concurrent aurora gradient elements at 2-3; remove skeleton/aura overlays immediately when first token arrives
5. After each phase that adds animations, run Chrome DevTools Layers panel during streaming — if layer count > 10, reduce `will-change` usage
6. Use `contain: content` on the actively streaming message element to prevent layout recalculation cascade

**Warning signs:**
- Chrome DevTools Performance shows "Long Animation Frame" entries during streaming
- FPS drops below 30 during streaming (visible with FPS overlay)
- Aurora shimmer visibly pauses when tokens arrive
- GPU memory usage climbs > 200MB during streaming on the Radeon 780M

**Phase to address:**
Streaming foundation phase AND every subsequent phase that adds animations. The streaming performance gate must include an FPS measurement under streaming load.

---

### Pitfall 5: Scroll Behavior Regression from Animations

**What goes wrong:**
After adding message entry animations (fade-in, slide-up) or expand/collapse transitions on tool calls, the auto-scroll system breaks. The IntersectionObserver sentinel fires incorrectly because animated elements change height during transition, briefly pushing the sentinel in and out of the viewport. The scroll pill flickers. Auto-scroll fails to engage on new messages because the animated element starts at height:0, and the sentinel hasn't moved yet.

V1 confirmed this failure mode in Phase 7 RESEARCH.md with precise root cause analysis.

**Why it happens:**
- CSS transitions introduce intermediate height states that the scroll tracking system doesn't expect
- `useScrollAnchor` assumes content height changes are immediate (one frame); animations spread height change over 200-300ms
- Each animation-to-scroll interaction must be designed together, but feature phases often add animations without revisiting scroll behavior

**How to avoid:**
1. Entry animations use ONLY `opacity` and `transform: translateY` — never `height`, `max-height`, or anything that affects layout flow
2. During active streaming (`isStreaming === true`), entry animations are disabled — new messages appear instantly; animations are for completed history
3. Debounce scroll pill visibility by 150ms to absorb animation-induced IntersectionObserver noise
4. Tool call expand/collapse: use CSS Grid `grid-template-rows: 0fr / 1fr` — this is layout-triggering but predictable; compensate with a pre/post `scrollHeight` delta adjustment in rAF
5. Every phase that adds any animation must include scroll regression testing as a gate requirement

**Warning signs:**
- Scroll pill appears/disappears more than once per second
- Auto-scroll stops tracking after a tool call expands
- Scroll position jumps when an animated element completes its transition
- IntersectionObserver callback fires > 10 times per animation cycle

**Phase to address:**
Streaming foundation phase (build scroll tracking correctly) and every subsequent animation phase. Gate reports must include a scroll behavior regression check.

---

### Pitfall 6: Orphaned Components — Built but Never Wired

**What goes wrong:**
A component or utility is created in one plan task and intended to be consumed by a subsequent task, but the wiring never happens. V1 confirmed this exact failure in Phase 5 Wave 2: `ToolCallGroup.tsx` and `groupConsecutiveToolCalls.ts` were fully implemented but never imported or rendered anywhere in the codebase. The gate report classified them as BLOCKERS and required a Wave 3 remediation pass.

**Why it happens:**
- AI coding agents create files in isolation (one plan task = one set of files)
- The agent that implements a component doesn't always also wire it into the consuming component
- Multi-wave phases have natural handoff gaps between task boundaries
- No automated check verifies import graph completeness

**How to avoid:**
1. Gate reports must explicitly verify wiring: for every file created, check that it is imported and rendered somewhere
2. Plan tasks must include explicit wiring steps: "Import X into Y at line Z"
3. Wave N should begin by verifying all Wave N-1 artifacts are wired before building new ones
4. Never advance to the next wave with unresolved BLOCKER-level wiring gaps (enforce in process, not just documentation)

**Warning signs:**
- A new file exists but `grep -rn "ComponentName" src/` returns only the file's own export
- Feature behavior absent from the running app despite the implementing file passing all unit tests
- Gate report finds orphaned exports with zero import references

**Phase to address:**
Every phase with multi-task dependencies. This is a process pitfall — the gate report wiring check is the primary mitigation. It must be faithfully executed, not skipped.

---

### Pitfall 7: AI-Assisted Development Pattern Drift — Constitution Erosion

**What goes wrong:**
The V2 Constitution establishes enforceable conventions (no default exports, named props interfaces, selector-only Zustand, no hardcoded colors, etc.). Over multiple phases, each Claude Code session has partial context of the Constitution. The agent follows the rules it can see but misses ones it can't. By Phase 6, components start appearing with default exports. By Phase 10, inline style objects with hex colors appear. By Phase 14, whole-store Zustand subscriptions creep in. The Constitution erodes slowly, phase by phase, until fixing violations requires another dedicated cleanup phase.

This is the primary documented failure mode that forced the V2 rewrite — V1's "accumulated quality issues across phases" and "foundation rot."

**Why it happens:**
- Claude Code context windows reset between sessions
- The Constitution is a long document; not all rules fit in context simultaneously
- Agents optimize for making the current task work, not for long-term consistency
- Without automated enforcement, human review cannot catch all violations across many files

**How to avoid:**
1. Phase 1 must wire ALL ESLint rules from the Constitution before any feature work begins — automated enforcement beats human review
2. Every coding session MUST load the Constitution into context (via CLAUDE.md or session preamble)
3. Gate reports should include a Constitution compliance scan: `no-explicit-any`, no default exports, no hardcoded color utilities, no whole-store subscriptions
4. When a gate report finds a Constitution violation, it is a BLOCKER — not a warning — regardless of whether the feature works
5. Keep a "banned patterns quick reference" file that agents load alongside task plans

**Warning signs:**
- `export default function Component` in any non-route file
- Inline style objects with hex values in chat components
- `const state = useStore()` without selector
- `any` type appearing in production code files
- Hardcoded Tailwind color utilities (`bg-gray-800`, `text-amber-500`) in component files

**Phase to address:**
Phase 1 (linting setup) is where automated enforcement must be installed. Every subsequent phase gate report must include a Constitution compliance check. This is ongoing — not a one-time fix.

---

### Pitfall 8: Multi-Provider WebSocket Message Type Explosion

**What goes wrong:**
The backend emits fundamentally different message shapes for Claude (`content_block_start` / `content_block_delta` / `content_block_stop` protocol), Codex (item-based: `agent_message`, `reasoning`, `command_execution`, `file_change`), and Gemini (simple text response). V1's `useChatRealtimeHandlers.ts` grew to 1050 lines with extensive branching for all three providers. This single file became the most complex in the codebase and the most common source of bugs when adding new features.

**Why it happens:**
- Multi-provider support is added incrementally — one provider at a time
- Each provider's branching is added to the existing handler rather than being isolated
- The handler file becomes the "easy place to add things" and accumulates responsibility

**How to avoid:**
1. Design provider-specific message normalization at the WebSocket layer, not in the UI layer
2. The WebSocket client normalizes all three protocols into a single canonical discriminated union (`WSMessage`) before any React component or store sees the data
3. Provider-specific parsing lives in dedicated files: `parseClaudeMessage.ts`, `parseCodexMessage.ts`, `parseGeminiMessage.ts`
4. The store action that receives normalized messages has zero provider-specific branching
5. TypeScript exhaustive switch on the discriminated union catches missing cases at compile time

**Warning signs:**
- Any `if (provider === 'claude') ... else if (provider === 'codex')` branching in store actions or components
- WebSocket message handler file exceeds 300 lines
- Adding Gemini support requires touching files that have nothing to do with Gemini

**Phase to address:**
Phase 2 (API and state contract / WebSocket integration). The normalization layer must be designed before any provider-specific UI is built. Retrofitting normalization after three providers are working inline is extremely painful.

---

### Pitfall 9: Z-Index Wars — Unmanaged Stacking Contexts

**What goes wrong:**
By Phase 8, overlapping UI elements fight for z-index supremacy. V1 ended with z-index values ranging from `z-10` to `z-[9999]` across the codebase — modals at 9999, a toast system needing to go above 9999, dropdowns getting clipped by overflow containers, and toasts appearing behind Settings modals. Every new overlay required trial-and-error to find a working z-index, and adding new layers broke existing ones.

**Why it happens:**
- Each component picks an arbitrary z-index value that "works in isolation"
- No global z-index ledger exists until problems force one
- Stacking contexts created by `position: relative` + `z-index`, `transform`, `filter`, `will-change`, or `isolation: isolate` on ancestor elements trap descendant z-index values
- Modals rendered inline (not portalled to `document.body`) are subject to ancestor stacking context traps

**How to avoid:**
1. The z-index dictionary is defined in Phase 1 CSS tokens and enforced from commit #1 — V2 Constitution Section 3.3 has this: `--z-base` through `--z-critical`
2. Ban arbitrary z-index values via ESLint: `z-[999]`, `z-[100]`, `z-50` (raw utility without CSS variable) are all banned
3. ALL overlay content — toasts, modals, dropdowns, lightboxes — must use `ReactDOM.createPortal` to `document.body`, escaping ancestor stacking contexts
4. `will-change: transform` on animated elements creates a new stacking context — document this in comments where used

**Warning signs:**
- Any `z-index` value not referencing `var(--z-*)` token
- A modal or toast rendered at a DOM position inside a scroll container or relatively-positioned ancestor
- "My modal is invisible" or "dropdown gets clipped" bug reports

**Phase to address:**
Phase 1 (design system foundation). Z-index dictionary in CSS tokens, ESLint enforcement, portal requirement for all overlays. Must be established before any modal or overlay component is built.

---

### Pitfall 10: Session State Race Conditions During Provider Switch

**What goes wrong:**
When the user switches providers (Claude → Gemini) while a streaming response is active, or when switching sessions while loading is in progress, the UI enters inconsistent states. A Gemini response renders inside the Claude streaming component. A session switch loads new messages on top of an in-progress turn. A reconnect event fires while session loading is in progress, causing double-loading. V1 identified these as "Complex" in the session management complexity summary, with a `pendingViewSession` guard added specifically to handle the race condition.

**Why it happens:**
- Async operations (session load, stream start, reconnect) have race conditions when they overlap
- The streaming state and the session state are often managed in the same component or hook, creating implicit coupling
- Provider switching adds a dimension of state that the basic streaming pipeline wasn't designed for

**How to avoid:**
1. The `stream` store is completely cleared (reset to initial state) before any session switch is allowed to proceed
2. Session switching uses a "pending" guard: the UI shows a loading state until the previous session's async operations have settled
3. Provider identity (claude/codex/gemini) is stored on the session, not derived from ambient state — prevents cross-contamination
4. WebSocket reconnect events check current session ID before re-applying received data; stale data is discarded
5. Use `useTransition` to mark session switch as non-urgent, preventing the UI from blocking on history load

**Warning signs:**
- Messages from session A appearing in the view for session B after a switch
- A streaming response continues rendering after the user clicked a different session
- Reconnect causes messages to appear twice in the chat list

**Phase to address:**
Phase 2 (state contract) and Phase 3 (session management). The session guard architecture must be designed into the state stores from the beginning, not patched in later.

---

## Technical Debt Patterns

Shortcuts that seem reasonable at the time but create long-term problems specific to this domain.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Copy-paste component with hardcoded color | Fast to implement | Phase-long remediation sweep required | Never — use token reference instead |
| Inline WebSocket message handling in a UI component | Simple, no abstraction layer | 1050-line God file, impossible to test, brittle to provider changes | Never |
| `any` type for WebSocket message data | Avoids upfront type design | Runtime crashes from unexpected shapes, no autocomplete, security holes | Never (use `unknown` + runtime narrowing) |
| `transition: all` for micro-interactions | Easy to apply globally | Layout-triggering transitions compete with streaming rAF buffer | Never during streaming |
| `React.Context` for streaming state | Familiar API | All context consumers re-render 100x/sec during streaming | Never for mutable state; only for static config |
| Barrel file (`index.ts`) exports in component subdirectories | Cleaner import paths | Breaks tree-shaking, obscures import graph, causes circular dependency nightmares | Only for `components/shared/` design primitives |
| Snapshot tests for dynamic components | Easy to write | Brittle to any content change, no behavioral coverage | Only for static CSS files |
| Whole-store Zustand subscription | One line to add | Entire component tree re-renders on any store change | Never in production code |
| Default exports | Shorter component file | Inconsistent naming across codebase, breaks refactoring tools | Only for router lazy-load pages if required |

---

## Integration Gotchas

Common mistakes when connecting to this specific backend.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Claude WebSocket | Treat `content_block_delta` as a simple text event | Claude streams a multi-phase protocol: `content_block_start` → zero or more `content_block_delta` → `content_block_stop`. Thinking blocks, tool calls, and text are all different block types with different delta shapes |
| Claude WebSocket | Assume streaming ends when text stops | Claude sends `claude-complete` only after ALL blocks finish; `content_block_stop` ends a single block; a turn can have multiple blocks |
| Codex WebSocket | Use same message parser as Claude | Codex uses an item-based protocol (`agent_message`, `reasoning`, `command_execution`, `file_change`, `mcp_tool_call`) — completely different shape; requires separate parser |
| Gemini WebSocket | Assume tool result handling works like Claude | Gemini sends `gemini-tool-use` and `gemini-tool-result` as separate events (not nested inside response events) |
| JWT auth | Put token in `Authorization` header for WebSocket | WebSocket doesn't support custom headers in browser APIs; token goes in the URL query string or first message payload |
| Session loading | Load all messages at once | Backend supports pagination (`GET /api/sessions/:id/messages`); 2000-message sessions will time out or OOM without pagination |
| Reconnect | Reload all messages from history on reconnect | Re-request only the delta since last known message ID; don't reload the full history on every reconnect |
| File uploads | `fetch` with default content-type | Image uploads require `FormData` with specific endpoint (`POST /api/projects/:name/upload-images`); JSON bodies are rejected |

---

## Performance Traps

Patterns that work fine during development but fail under real streaming loads.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| `useEffect` + `setState` on every token | FPS drops to single digits during streaming, input freezes | rAF buffer + DOM mutation for streaming, state flush on completion | Any response > 200 tokens |
| Whole-store Zustand subscription | All components re-render 100x/sec during streaming, CPU maxes | Selector-only subscriptions | Any streaming response |
| Parsing markdown on every token | Main thread blocked 50-100ms per token during streaming, visible stutter | Debounce markdown parsing; parse on newlines/sentence-end or 50ms idle | Any response with markdown formatting |
| Shiki highlight during streaming | 200-500ms blocking call per code block during streaming | Defer Shiki until `isStreaming === false`; use raw monospace during streaming | First code block in streaming response |
| `content-visibility: auto` without `contain-intrinsic-size` | Scrollbar jumps as user scrolls (browser recalculates real sizes) | Always pair with a reasonable estimated height: `contain-intrinsic-size: 0 120px` | Long conversations (50+ messages) |
| CSS `transition: all` on streaming-adjacent elements | Streaming tokens cause layout-triggering transitions on neighboring elements | Specify exact transition properties; add `.is-streaming` class to suppress non-critical transitions | During any streaming response |
| Rendering all tool call histories inline | 200+ tool calls in one session saturate DOM, scroll becomes sluggish | Use `content-visibility: auto` on past tool cards; virtualize if > 500 tool calls | Sessions with > 100 tool calls |

---

## UX Pitfalls

Common UX mistakes in streaming chat / AI agent interfaces.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Auto-scroll re-engages after user scrolled up | User loses reading position; infuriating during long responses | Immediate pause on any upward scroll; auto re-engage ONLY when user scrolls back to bottom manually |
| Scroll pill shows message count, not turn count | "17 new messages" is meaningless when most messages are tool calls; turns are the semantic unit | Count AI turns (agent responses), not individual message objects |
| Scroll pill auto-dismisses when response ends | User is reading history while response finishes; pill disappears before they can click it | Pill persists until user explicitly scrolls to bottom or clicks the pill |
| All tool calls expanded by default | Dense walls of file content overwhelm the conversation; hard to find prose responses | Collapsed by default; auto-expand only on error; show compact summary (file name, exit code, line count) |
| "Thinking..." shown as loading spinner | Spinner is anxiety-inducing and provides no information about progress | Aurora shimmer with elapsed time counter gives sense of active progress |
| Toast inside scroll container | Toast changes scroll height, fighting IntersectionObserver sentinel; scroll pill flickers | Always portal toasts to `document.body` via `ReactDOM.createPortal` |
| Error message as styled markdown block | Error formatting is lost or misinterpreted as model output | Dedicated `ErrorBanner` component with distinct destructive styling, not inline markdown |
| Markdown rendered on every streaming token | Bold text "flashes" during streaming as partial syntax is opened/closed | Inline elements (bold, italic, code) can stream live; block elements (code fences, tables, headers) buffer until delimiter detected |
| "Stop" button separate from "Send" | Dual affordance in the same area causes confusion (V1 audit found this exact bug) | Send button morphs into Stop button during streaming — single button, single location |

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Phase 1: Design system & ESLint | Skipping ESLint setup to "get to real code faster" — causes Constitution erosion by Phase 4 | ESLint rules are non-negotiable Phase 1 deliverables; gate report must verify all rules are wired |
| Phase 1: CSS token architecture | Defining too few semantic tokens (missing secondary text, diff colors, FX tokens) — forces mid-phase additions that disrupt ongoing work | Reference the full Constitution Section 7 token map; define all tokens up front |
| Phase 2: WebSocket + store setup | Provider-specific parsing mixed into store actions — creates 1000+ line handler file | Normalize to discriminated union at WebSocket layer before store receives data |
| Phase 2: Store architecture | Using React Context for streaming state "temporarily" — never gets replaced | Zustand from the start; Context only for truly static values (theme config, feature flags) |
| Phase 3: Streaming message rendering | Building `TurnBlock` and streaming display in the same phase — the streaming display needs to be correct before TurnBlock wraps it | Implement streaming message display first, verify FPS under load, then add turn grouping on top |
| Phase 3: Scroll tracking | Using `onScroll` + `getBoundingClientRect` instead of IntersectionObserver | IntersectionObserver sentinel from the start; the rAF pattern in the existing phase 7 research is the verified correct implementation |
| Phase 4: Markdown + tool calls | Rendering Shiki during streaming | Streaming fallback (raw monospace in code block container) first; Shiki deferred to post-stream is mandatory |
| Phase 4: Tool call display | Building all tool-type-specific renderers before the base card | Base card with state machine (running/success/error) first; tool-specific variants are additive |
| Phase 5+: Multi-agent workspaces | Session/provider state interleaving during rapid tab switching | Provider identity must be stored on session objects; stream store clears on any session change |
| Any phase: Animation additions | Adding animations without re-verifying scroll behavior and streaming FPS | Every phase that adds animation must include streaming FPS test + scroll regression test in gate report |
| Any phase: Component splitting | Splitting components without verifying that memo comparators still prevent unnecessary re-renders | After split, run React DevTools Profiler during streaming to verify zero past-message re-renders |

---

## Sources

**Evidence base (HIGH confidence):**
- V1 Phase 5 Gate Report Wave 2: Confirmed orphaned components (`ToolCallGroup`, `groupConsecutiveToolCalls`) wired as BLOCKERS
- V1 Phase 5 CONTEXT.md + RESEARCH.md: 1050-line `useChatRealtimeHandlers.ts` documented as most complex file; multi-provider branching identified as architecture risk
- V1 Phase 7 RESEARCH.md: Confirmed aurora GPU layer explosion pitfall with AMD Radeon 780M context; Safari `overflow-anchor` gap verified via MDN; IntersectionObserver timing race documented
- V1 Phase 10 CONTEXT.md: 144+ hardcoded hex references across 15 files documented; Phase 11 required exclusively for remediation
- V1 Phase 11 Gate Report Wave 1: Confirmed token system was infrastructure-complete but required a dedicated phase for sweep
- V1 REPORT.md (Gemini audit): "Settings modal catastrophe" — blue buttons shattering palette; dual stop buttons creating confusion; documented as real user-facing failures
- V1 V1_FEATURE_INVENTORY.md: 51 hardcoded hex values in chat components alone; session management race conditions documented as "Complex"; `useChatComposerState.ts` documented at 500+ lines as God file risk
- V2 PROJECT.md: Explicitly names "hardcoded styles, inconsistent patterns, and foundation rot" as failure modes requiring the V2 greenfield rewrite
- V2 V2_CONSTITUTION.md: 12 sections of enforceable conventions — each rule exists because V1 violated it
- V2 V2_REWRITE_PLAYBOOK.md: Gemini architect's phase ordering rationale — emphasizes scroll physics and streaming correctness before chat UI
