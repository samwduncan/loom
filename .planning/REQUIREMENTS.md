# Requirements: Loom V2

**Defined:** 2026-03-04
**Core Value:** Make AI agent work visible, beautiful, and controllable

## v1 Requirements (Milestone 1: "The Skeleton")

### Design System

- [ ] **DS-01**: Create `src/styles/tokens.css` defining ALL color tokens as CSS custom properties using OKLCH color space. Minimum tokens: `--surface-base`, `--surface-raised`, `--surface-overlay`, `--text-primary`, `--text-secondary`, `--text-muted`, `--accent-primary` (dusty rose), `--accent-primary-hover`, `--accent-primary-muted`, `--status-success`, `--status-error`, `--status-warning`, `--status-info`, `--border-default`, `--border-subtle`. No hardcoded hex or HSL values anywhere in component code — verified by ESLint rule.

- [ ] **DS-02**: Define motion tokens in `src/styles/tokens.css`: `--ease-spring` (`cubic-bezier(0.34, 1.56, 0.64, 1)`), `--ease-out` (`cubic-bezier(0.16, 1, 0.3, 1)`), `--ease-in-out` (`cubic-bezier(0.65, 0, 0.35, 1)`), `--duration-fast` (100ms), `--duration-normal` (200ms), `--duration-slow` (400ms), `--duration-spring` (500ms). Also define spring physics configs as JS constants in `src/lib/motion.ts`: `SPRING_GENTLE` (stiffness: 120, damping: 14), `SPRING_SNAPPY` (stiffness: 300, damping: 20), `SPRING_BOUNCY` (stiffness: 180, damping: 12).

- [ ] **DS-03**: Define spacing scale in `src/styles/tokens.css` as CSS custom properties on the 4px grid: `--space-1` (4px) through `--space-16` (64px). Tailwind utilities (`p-1` through `p-16`) map to this scale. Arbitrary spacing values (`p-[13px]`, `mt-[7px]`) are banned by ESLint except with a `// SPACING: [reason]` exception comment.

- [ ] **DS-04**: Define z-index dictionary in `src/styles/tokens.css` with exactly 8 named tiers: `--z-base` (0), `--z-sticky` (10), `--z-dropdown` (20), `--z-scroll-pill` (30), `--z-overlay` (40), `--z-modal` (50), `--z-toast` (60), `--z-critical` (9999). All z-index usage in component code MUST reference these variables — verified by ESLint rule banning raw numeric z-index values.

- [x] **DS-05**: Configure three font families in `src/styles/base.css`: Inter Variable (UI text, loaded via `@font-face` with `font-display: swap`), Instrument Serif (editorial headings, loaded via `@font-face`), JetBrains Mono (code blocks, loaded via `@font-face`). Define CSS custom properties: `--font-ui`, `--font-serif`, `--font-mono`. Tailwind `font-sans`, `font-serif`, `font-mono` classes map to these. Monospace must NOT be the default body font (this was a V1 bug).

- [ ] **DS-06**: Implement surface hierarchy using lightness steps only (no `box-shadow` for elevation). `--surface-base` is the darkest (app background), `--surface-raised` is slightly lighter (cards, sidebar), `--surface-overlay` is lightest (modals, dropdowns). Borders between surfaces use `border-[var(--border-subtle)]` at 6-10% opacity. Verify: three visually distinct surface levels are perceptible on a calibrated monitor.

### Enforcement

- [ ] **ENF-01**: Install and configure ESLint with custom rules that enforce EVERY banned pattern from the V2 Constitution. Specific rules required:
  - Ban all Tailwind color utilities containing a color name + number (`bg-gray-800`, `text-red-500`, etc.) — regex pattern matching
  - Ban hardcoded hex values in className strings (`bg-[#1a1a1a]`)
  - Ban `z-[number]` patterns outside the z-index dictionary
  - Ban string concatenation for className (require `cn()` utility)
  - Ban whole-store Zustand subscriptions (no `const store = useXStore()` without selector)
  - Ban default exports (require named exports)
  - Ban `any` type in production code (allow in .test files with override)
  - Ban non-null assertions (`!`) without exception comment
  - Ban inline `style={{}}` for colors, fonts, spacing, borders (allow for dynamic dimensions/transforms)
  - All rules must produce ERROR level (not warning) — zero tolerance.

- [ ] **ENF-02**: Configure `tsconfig.json` with `"strict": true`, `"noUncheckedIndexedAccess": true`, `"noUnusedLocals": true`, `"noUnusedParameters": true`. Zero `any` types in production code. Verify: `tsc --noEmit` passes with zero errors on the entire codebase.

- [ ] **ENF-03**: Install Vitest 4.x and React Testing Library 16.x. Configure `vitest.config.ts` with jsdom environment, path aliases matching `tsconfig.json`, coverage reporter. Create at least one passing test per store file and one per component in M1 scope. Verify: `npm run test` passes, coverage report generates.

- [ ] **ENF-04**: Configure a pre-commit check (via `lint-staged` + `husky` or equivalent) that runs on every commit: (1) ESLint on staged `.ts`/`.tsx` files, (2) TypeScript type check (`tsc --noEmit`), (3) Vitest on affected test files. Commit MUST be blocked if any check fails. Verify: attempt to commit a file with `bg-gray-800` — commit is rejected.

### App Shell

- [ ] **SHELL-01**: Create `src/components/app-shell/AppShell.tsx` using CSS Grid: `grid-template-columns: var(--sidebar-width, 280px) 1fr var(--artifact-width, 0px)`. The third column exists at `0px` width for future artifact panel (M3+). Grid rows: `grid-template-rows: 1fr` (no header row in M1 — header can be added later without restructuring). The component must accept children for each grid area via named slots or composition.

- [ ] **SHELL-02**: Root HTML element has `height: 100dvh` and `overflow: hidden`. The body has `margin: 0`, `overflow: hidden`. No scrollbar appears on the root document under any circumstance. All scrolling happens inside the chat content area. Verify: resize browser to any viewport size — no body scroll appears.

- [ ] **SHELL-03**: Configure React Router (or equivalent) with route slots for: `/chat/:sessionId?` (main chat view), `/dashboard` (future GSD dashboard — renders placeholder), `/settings` (future settings — renders placeholder). Route structure must support future additions without restructuring. All routes render inside the AppShell's content grid area.

- [ ] **SHELL-04**: Create three error boundary components:
  - `AppErrorBoundary` (wraps entire app): catches catastrophic failures, renders full-screen "Something went wrong" with reload button
  - `PanelErrorBoundary` (wraps each grid area — sidebar, content, artifact): catches panel-specific crashes, renders inline error message, other panels continue working
  - `MessageErrorBoundary` (wraps individual messages): catches rendering errors in a single message, renders "Failed to render message" placeholder, other messages unaffected
  - Each boundary logs the error with component stack trace. Verify: throw an error inside a message component — only that message shows the error UI, sidebar and other messages are unaffected.

### State Architecture

- [ ] **STATE-01**: Create 4 Zustand stores in `src/stores/`:
  - `timeline.ts`: `TimelineStore` — sessions array, activeSessionId, message operations (addMessage, updateMessage, clearSession). Full TypeScript interface defined per MILESTONES.md cross-milestone schema.
  - `stream.ts`: `StreamStore` — isStreaming, activeToolCalls (ToolCallState[]), thinkingState, activityText, stream lifecycle actions (startStream, endStream, addToolCall, updateToolCall).
  - `ui.ts`: `UIStore` — sidebarOpen, sidebarCollapsed, activeTab (TabId), modalState, commandPaletteOpen, companionState (null initially), theme config.
  - `connection.ts`: `ConnectionStore` — providers record (keyed by ProviderId), connection lifecycle actions (connect, disconnect, updateStatus).
  - Every store has a corresponding `.test.ts` file testing all actions.

- [ ] **STATE-02**: `Message` type includes `metadata: MessageMetadata` (with fields: `timestamp`, `tokenCount`, `cost`, `duration`) and `providerContext: ProviderContext` (with fields: `providerId`, `modelId`, `agentName`). `Session` type includes `metadata: SessionMetadata` (with fields: `tokenBudget`, `contextWindowUsed`, `totalCost`). These fields exist from M1 even if populated with defaults/nulls.

- [ ] **STATE-03**: All provider-related types include `providerId: ProviderId` where `type ProviderId = 'claude' | 'codex' | 'gemini'`. In M1, all instances default to `'claude'`. The type union is ready for M4 multi-provider without any type changes.

- [ ] **STATE-04**: Create a custom ESLint rule OR a documented pattern test that detects whole-store subscriptions. Every store hook usage in component code MUST use a selector: `useTimelineStore(state => state.messages)` not `useTimelineStore()`. Multi-field selections use `useShallow`. Verify: grep the codebase for store hook usage without selectors — zero matches.

- [ ] **STATE-05**: Document persistence strategy in `src/stores/README.md`: which store slices persist to localStorage (timeline sessions list, ui theme preference, connection provider configs) vs which are ephemeral (stream state, ui modal state, connection live status). Implement persistence for the timeline store using Zustand's `persist` middleware with a documented storage key and version number.

### Streaming Infrastructure

- [ ] **STRM-01**: Create `src/lib/websocket-client.ts` that establishes a WebSocket connection to `ws://<host>:<port>/ws?token=<jwt>`. The client must:
  - Handle connection lifecycle (connecting, connected, disconnected, reconnecting)
  - Auto-reconnect with exponential backoff (1s, 2s, 4s, 8s, max 30s)
  - Parse incoming messages as the discriminated union from BACKEND_API_CONTRACT.md (types: `claude-response`, `claude-complete`, `claude-error`, `claude-permission-request`, `claude-permission-cancelled`, `session-created`, `session-aborted`, `session-status`, `active-sessions`, `token-budget`, `projects_updated`)
  - Send typed messages to server (`claude-command`, `abort-session`, `claude-permission-response`, `check-session-status`, `get-active-sessions`)
  - Update the `connection` Zustand store on every state change
  - Verify: connect to backend, send a hardcoded prompt, receive streaming response — all message types logged correctly.

- [ ] **STRM-02**: Implement Stream Multiplexer in the WebSocket client that routes incoming `claude-response` messages into separate channels:
  - Content channel: text tokens for the response body
  - Thinking channel: thinking/reasoning block content
  - Tool channel: tool use and tool result events
  - The multiplexer updates the `stream` Zustand store with tool call states and thinking state, while routing content tokens to a `useRef` buffer (not React state).
  - Verify: send a prompt that triggers thinking + tool calls + text response — all three channels populate independently and correctly.

- [ ] **STRM-03**: Create `src/hooks/useStreamBuffer.ts` implementing the `useRef` + `requestAnimationFrame` token accumulation pattern:
  - Incoming content tokens append to a `ref.current` string (NOT React state)
  - A `requestAnimationFrame` loop reads the ref and updates a DOM node's `textContent` directly (bypassing React reconciler)
  - When streaming completes (`claude-complete` message), flush the accumulated text to the `timeline` Zustand store as a finalized message
  - During streaming, React re-renders are ZERO for the active message text (only the rAF loop updates the DOM)
  - Verify: stream a 2000-token response while monitoring React DevTools Profiler — zero re-renders on the ActiveMessage component during streaming.

- [ ] **STRM-04**: Create a proof-of-life page that:
  - Connects to the backend WebSocket
  - Sends a hardcoded prompt (e.g., "Write a haiku about coding")
  - Renders the streaming response in real-time using the rAF buffer
  - Displays thinking blocks in a separate section (proving multiplexer works)
  - Shows connection status
  - This is the vertical slice proving the entire pipeline works end-to-end.

### Component Infrastructure

- [ ] **COMP-01**: Create `src/lib/tool-registry.ts` implementing a pluggable Tool-Call Component Registry:
  - `registerTool(toolName: string, config: ToolConfig)` — registers a tool display configuration
  - `getToolConfig(toolName: string): ToolConfig | DefaultToolConfig` — returns registered config or default fallback
  - `ToolConfig` includes: `displayName`, `icon` (React component), `renderCard` (React component for expanded view), `renderChip` (React component for collapsed view), `stateColors` (running/success/error color tokens)
  - Register at minimum: `Bash`, `Read`, `Edit`, `Write`, `Glob`, `Grep` with placeholder renderers
  - `DefaultToolConfig` handles any unregistered tool name gracefully
  - Verify: call `getToolConfig('Bash')` — returns registered config. Call `getToolConfig('UnknownTool')` — returns default config, no crash.

- [ ] **COMP-02**: Create `src/components/chat/ActiveMessage.tsx` — the component that displays the currently-streaming message:
  - Uses the `useStreamBuffer` hook (STRM-03) for token rendering
  - Wrapped in `React.memo` — but since it reads from a ref, not state, it should NOT re-render during streaming
  - Displays a blinking cursor indicator at the end of streamed text
  - Has a container div with `content-visibility: visible` (always rendered, never offscreened)
  - Verify: component renders streamed text, cursor blinks, React DevTools shows zero re-renders during streaming.

- [ ] **COMP-03**: Create `src/hooks/useScrollAnchor.ts` implementing basic scroll anchoring:
  - When `isStreaming` is true AND user has NOT scrolled up: auto-scroll to bottom on every rAF frame
  - When user scrolls up by any amount (even 1px of manual scroll): immediately disengage auto-scroll
  - Track disengage via `IntersectionObserver` on a sentinel element at the bottom of the scroll container
  - When disengaged, show a "Scroll to bottom" pill (positioned at `z-[var(--z-scroll-pill)]`)
  - Clicking the pill re-engages auto-scroll and scrolls to bottom
  - When streaming ends: do NOT auto-scroll if user has scrolled away
  - Verify: start streaming, scroll up — auto-scroll stops immediately. Click pill — scrolls to bottom. Start new stream — auto-scroll resumes.

### Navigation

- [ ] **NAV-01**: Create `src/components/sidebar/Sidebar.tsx` that:
  - Renders in the first column of the CSS Grid (width: `var(--sidebar-width, 280px)`)
  - Has `role="complementary"` and `aria-label="Chat sessions"`
  - Fetches session list from `GET /api/projects/:projectName/sessions` (or uses mock data if backend is unavailable)
  - Groups sessions by date: "Today", "Yesterday", "Previous 7 Days", "Older"
  - Each session item shows: title (truncated to 1 line), date, provider icon
  - Has a "New Chat" button at the top
  - Background color uses `--surface-raised` (visually distinct from main content area)
  - Verify: sidebar renders with grouped sessions, clicking a session updates the URL/route.

- [ ] **NAV-02**: Clicking a session in the sidebar:
  - Updates `activeSessionId` in the `timeline` Zustand store
  - Triggers `GET /api/projects/:projectName/sessions/:sessionId/messages` to load messages
  - Displays loaded messages in the chat content area
  - If messages are loading, shows a skeleton/loading state (not a blank screen)
  - Updates the URL to `/chat/:sessionId`
  - Verify: click a session — messages load and display, URL updates, loading state is visible during fetch.

## v2 Requirements (Milestones 2-5, tracked but not in current roadmap)

### M2: The Chat

- **CHAT-01**: All 7 message types render correctly: user (right-aligned or full-width with distinct styling), assistant (full-width document style), tool (compact action card), thinking (collapsible block with subtle background), error (red-tinted banner), system (centered, muted text), task_notification (compact notification style)
- **CHAT-02**: Tool cards implement a 4-state machine: `invoked` (pulsing accent indicator) → `executing` (progress animation) → `resolved` (auto-collapse to chip) → `rejected` (expand with error details). Transitions animate smoothly using motion tokens.
- **CHAT-03**: Thinking/reasoning blocks render with a subtle background tint, are collapsed by default after streaming completes, have a "Show thinking" toggle, and display a "Thinking..." label with pulsing animation during streaming.
- **CHAT-04**: Markdown rendered via `react-markdown` with custom plugins for: incomplete code block handling during streaming (no flash of unstyled text), syntax highlighting via Shiki (lazy-loaded per language grammar), table horizontal scroll, long string wrapping, link handling (open in new tab).
- **CHAT-05**: Composer is an auto-expanding textarea that: starts at 1 line height, expands to max `40vh`, sends on Enter (Shift+Enter for newline), has send button that morphs to stop button during streaming, immediately resets and refocuses after sending, supports image paste/upload.
- **CHAT-06**: Activity status line above composer parses streaming events to show semantic status: "Thinking...", "Reading auth.ts...", "Writing server.js...", "Running npm test...", "Searching for files...". Fades in/out with `--duration-fast` transition.
- **CHAT-07**: Session switching loads messages from backend, preserves scroll position per session, handles loading states, works with real backend data.

### M3: The Polish

- **POLISH-01**: Scroll physics perfected: zero jitter at 100 tokens/sec, smooth deceleration on manual scroll, scroll-to-bottom pill appears within 1 frame of user scrolling up, content-visibility on past messages (visible messages render, offscreen messages use `content-visibility: auto` with `contain-intrinsic-size`).
- **POLISH-02**: Aurora/ambient overlay renders behind streaming messages as a subtle animated gradient. Uses CSS only (no canvas). Activates when streaming starts, deactivates when streaming ends. Respects `prefers-reduced-motion` (static gradient instead of animated).
- **POLISH-03**: Messages enter with `translateY(8px)` + `opacity: 0` → `translateY(0)` + `opacity: 1` using `--ease-spring` over `--duration-spring`. Staggered if multiple messages appear at once.
- **POLISH-04**: When 3+ consecutive tool calls appear, auto-group into an accordion: "N tool calls" header with expand/collapse. Individual tool chips visible when collapsed. Full cards visible when expanded.
- **POLISH-05**: Sidebar collapses to icon-only rail (~48px wide) via a toggle button. Session items show only provider icon when collapsed. Tooltip on hover shows full session title.
- **POLISH-06**: Cmd+K (Mac) / Ctrl+K (other) opens command palette overlay. Searches: sessions by title, routes (settings, dashboard), commands. Fuzzy matching. Keyboard navigable (arrow keys + Enter). Closes on Escape or click outside.
- **POLISH-07**: Settings panel as modal overlay with extensible tab architecture. Initial tabs: Appearance (theme, font size, density), Agents (provider configs, model selection), API (key management). Tab system supports future additions (MCP tab in M4) without restructuring.
- **POLISH-08**: ARIA roles on all shell regions: `role="log" aria-live="polite"` on chat container, `role="complementary"` on sidebar, `role="textbox"` on composer, `role="dialog"` on modals. Keyboard navigation: Tab through major regions, Enter to activate, Escape to dismiss overlays. `prefers-reduced-motion` media query disables all spring animations, replaces with instant or fade-only transitions.

### M4: The Power

- **POWER-01**: Tab bar above the content area with one tab per active provider. Clicking a tab switches the chat view to that provider's conversation. Each tab shows: provider icon, active session title, streaming indicator if active.
- **POWER-02**: When a provider tab is in background, its WebSocket stream continues. A notification badge appears on the tab when new messages arrive. Switching to the tab shows all accumulated messages without loss.
- **POWER-03**: A "Share context" action sends the current Claude conversation summary to Gemini (or vice versa) so the other provider can continue or provide a second opinion with awareness of what's been discussed.
- **POWER-04**: MCP management UI: list all configured MCP servers (from `GET /api/mcp/config/read`), show status (connected/disconnected), enable/disable toggle, add new server form, remove server. Plugin/skill management: list installed, enable/disable.

### M5: The Vision

- **VISION-01**: GSD dashboard view at `/dashboard` route: shows current project phases from `.planning/ROADMAP.md`, progress per phase (pending/in-progress/complete), which agent is assigned to active tasks, gate report status. Visual pipeline representation (not just a table).
- **VISION-02**: Nextcloud integration via WebDAV API to local Nextcloud server at `http://localhost` (Docker container `nextcloud-app`, files at `/mnt/ncdata/data/swd/files/`). File picker modal to browse/select Nextcloud files. Upload screenshots from file picker into chat as image attachments. Files panel showing Nextcloud directory.
- **VISION-03**: Companion system: animated pixel-art character (tanuki, red panda, or Shiba Inu — pending sprite library sourcing) displayed as overlay in bottom-right corner. Animation states: idle (default), thinking (during AI processing), celebrating (on task success), alarmed (on error), sleeping (when inactive for 5+ minutes). Sprite sheet rendered via CSS `background-position` animation or Canvas 2D. CONDITIONAL on feasibility gate passing.
- **VISION-04**: CodeRabbit integration: trigger code review from within app on local git changes, display review comments inline or in a panel, manage suggestions (accept/reject/discuss). May require CodeRabbit CLI or API access.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mobile native app | Web-first; responsive handles mobile access |
| Multi-user / auth system | Single-user tool; backend already handles auth |
| AI model training | Loom consumes models, doesn't train them |
| Full IDE replacement | Complements VS Code/Cursor, doesn't replace |
| Light mode | Dark-only for M1-M3; potential M5 stretch goal |
| Arbitrary LLM providers | Claude, Gemini, Codex only (backend constraint) |
| Character-by-character typewriter | Anti-pattern per research; use batch rendering via rAF buffer |
| Conversation branching | High complexity, low value for single-user tool |
| Side-by-side model comparison | Not aligned with tabbed workspace model |
| Rainbow/gradient theming (ChatGPT style) | Conflicts with Charcoal + Dusty Rose identity |
| iframe plugin micro-apps | Security risk, performance overhead, over-engineering |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DS-01 | Phase 1: Design Token System | Pending |
| DS-02 | Phase 1: Design Token System | Pending |
| DS-03 | Phase 1: Design Token System | Pending |
| DS-04 | Phase 1: Design Token System | Pending |
| DS-05 | Phase 1: Design Token System | Complete |
| DS-06 | Phase 1: Design Token System | Pending |
| ENF-01 | Phase 2: Enforcement + Testing | Pending |
| ENF-02 | Phase 2: Enforcement + Testing | Pending |
| ENF-03 | Phase 2: Enforcement + Testing | Pending |
| ENF-04 | Phase 2: Enforcement + Testing | Pending |
| SHELL-01 | Phase 3: App Shell + Error Boundaries | Pending |
| SHELL-02 | Phase 3: App Shell + Error Boundaries | Pending |
| SHELL-03 | Phase 3: App Shell + Error Boundaries | Pending |
| SHELL-04 | Phase 3: App Shell + Error Boundaries | Pending |
| STATE-01 | Phase 4: State Architecture | Pending |
| STATE-02 | Phase 4: State Architecture | Pending |
| STATE-03 | Phase 4: State Architecture | Pending |
| STATE-04 | Phase 4: State Architecture | Pending |
| STATE-05 | Phase 4: State Architecture | Pending |
| STRM-01 | Phase 5: WebSocket Bridge + Multiplexer | Pending |
| STRM-02 | Phase 5: WebSocket Bridge + Multiplexer | Pending |
| STRM-03 | Phase 6: Streaming Engine + Scroll | Pending |
| COMP-02 | Phase 6: Streaming Engine + Scroll | Pending |
| COMP-03 | Phase 6: Streaming Engine + Scroll | Pending |
| COMP-01 | Phase 7: Tool Registry + Proof of Life | Pending |
| STRM-04 | Phase 7: Tool Registry + Proof of Life | Pending |
| NAV-01 | Phase 8: Navigation + Sessions | Pending |
| NAV-02 | Phase 8: Navigation + Sessions | Pending |

**Coverage:**
- v1 requirements: 28 total
- Mapped to phases: 28/28
- Unmapped: 0

---
*Requirements defined: 2026-03-04*
*Last updated: 2026-03-04 after roadmap phase assignment*
