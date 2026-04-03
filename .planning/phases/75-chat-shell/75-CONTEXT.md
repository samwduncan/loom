# Phase 75: Chat Shell - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a fully functional native chat app on iPhone: session management (grouped list, search, swipe-delete), message sending with streamed AI responses, markdown rendering with syntax-highlighted code blocks, tool call chips with expandable detail, thinking blocks with streaming visibility, and inline permission approval — all wired to Loom backend via shared Zustand stores and WebSocket multiplexer. Builds on Phase 74's auth, drawer, connection, and theme foundation.

Requirements: CHAT-01, CHAT-02, CHAT-03, CHAT-04, CHAT-05, CHAT-06, CHAT-07, CHAT-08, CHAT-09, CHAT-10, CHAT-11, CHAT-12

</domain>

<decisions>
## Implementation Decisions

### Tool Card Design
- **D-01:** Tool calls render as collapsed inline chips within the assistant message flow. Chip shows: icon + tool name + status indicator (pending spinner, running pulse, done checkmark, error X).
- **D-02:** Tapping a chip opens a bottom sheet with full details: tool name, arguments, output/result, duration, error message if failed. Bottom sheet uses Soul doc surface-raised tier with spring entrance.
- **D-03:** 6 tool types supported: Bash, Read, Edit, Write, Glob, Grep. Each gets a distinct icon. Chip styling uses surface-sunken background, rounded-full, compact padding.
- **D-04:** During streaming, new chips appear at the insertion point in the text flow. Chip status updates in-place (pending -> running -> done/error). No reordering of content segments.

### Thinking Block Behavior
- **D-05:** Thinking blocks are **expanded during active streaming** — user sees thinking content arriving in real-time. When streaming completes (content phase begins), thinking block **auto-collapses** to a "Thought for Xs" summary line.
- **D-06:** Collapsed state shows: subtle divider line + "Thought for Xs" label in muted caption text. Tap anywhere on the summary to re-expand.
- **D-07:** Thinking text renders in slightly dimmed/muted color (text-muted from theme) to visually distinguish from main response content. No card or container — just a divider + label + dimmed text.
- **D-08:** Expand/collapse animation uses Standard spring (damping 20, stiffness 180). Content height animates smoothly via Reanimated layout animation.

### Session List & Grouping
- **D-09:** Sessions organized in date-grouped sections: Today / Yesterday / Last Week / Older (following Private Mind's `getRelativeDateSection` pattern from PATTERNS-PLAYBOOK.md).
- **D-10:** Running sessions stay in their date group (stable ordering). Running status indicated by pulsing accent dot on the session item. Sessions do NOT float to top based on status.
- **D-11:** Sticky search bar pinned at top of drawer with glass background (Soul doc glass surface). Filters sessions in real-time as user types. Clear button on non-empty input.
- **D-12:** Swipe-left-to-delete on session items. Red destructive action surface revealed with Standard spring animation. Confirmation not required (swipe completes the delete). Undo toast shown for 5 seconds.
- **D-13:** Staggered item appearance animation on drawer open: each session item springs in with 30ms delay (max 10 items animated, rest appear instantly). Standard spring.

### Code Blocks & Syntax Highlighting
- **D-14:** Full syntax highlighting ships in Phase 75. CHAT-06 met completely. Use react-native-syntax-highlighter (highlight.js-based) or equivalent library — researcher evaluates options.
- **D-15:** Code blocks render on surface-sunken background with language label in top-right corner (caption text, muted). Copy button in top-right, tapping copies to clipboard with haptic feedback + "Copied" toast.
- **D-16:** Long code blocks are scrollable horizontally (no line wrapping for code). Vertical scroll for blocks exceeding ~15 lines. JetBrains Mono font.

### Streaming Architecture
- **D-17:** Message list uses FlatList with `inverted={true}` + `maintainVisibleContentPosition`. Proven pattern (2/4 reference apps ship this). If performance issues arise on device, FlashList v2 as drop-in replacement.
- **D-18:** Streaming markdown uses swift-chat's ChunkedCodeView pattern: freeze completed blocks (memoized), only re-render the trailing active block. Prevents re-render storm on long responses.
- **D-19:** Markdown renderer: react-native-enriched-markdown for structure (handles CommonMark + GFM tables). Syntax highlighting handled separately for code blocks.

### Permission Approval (CHAT-12)
- **D-20:** Permission requests render as inline cards in the chat stream at the point they occur. Card shows: tool name, brief description of what's being requested, Approve (accent) and Deny (destructive) buttons side-by-side.
- **D-21:** After approval/denial, card transforms to a compact status line: "Approved: [tool description]" or "Denied: [tool description]" with appropriate color. Card transitions with Standard spring.
- **D-22:** Permission cards have a subtle glow/highlight to draw attention. If multiple permissions queue during streaming, they stack in message order.

### Message Layout (Carried from Phase 69, adapted)
- **D-23:** User messages: rounded bubble (surface-raised, rounded-2xl, p-4), right-aligned in layout, left-aligned text within.
- **D-24:** Assistant messages: free-flowing on surface-base, no container. 24px provider avatar at top-left (Claude icon). Tool chips and thinking blocks inline within the message.
- **D-25:** 24px turn spacing between different roles, 8px between same-role consecutive messages.
- **D-26:** Message entrance: user messages use Standard spring (opacity 0->1, translateY 20->0). Assistant first token fades in (150ms opacity).

### Composer (Phase 74 Shell -> Functional)
- **D-27:** ComposerShell becomes functional. Send button activates when text is non-empty. During streaming, send button transforms to stop button (accent -> destructive, 200ms color transition).
- **D-28:** 3-state composer FSM: idle (send enabled when text present) -> sending (stop visible) -> stopped (back to idle). Matches web app's proven pattern.
- **D-29:** Status bar below input: model name + connection dot. Token count added when available from stream store.
- **D-30:** Keyboard avoidance via react-native-keyboard-controller. Matches system curve exactly (NOT a spring).

### Connection & Auth (Inherited from Phase 74)
- **D-31:** CHAT-08 and CHAT-09 are largely satisfied by Phase 74's work. Phase 75 verifies they work end-to-end with actual message sending/receiving. WebSocket reconnect on network changes already built.
- **D-32:** Scroll position preservation (CHAT-07): store scroll offset per session ID in MMKV. On session switch, restore offset. FlatList's `initialScrollIndex` or `scrollToOffset` on mount.

### Empty States
- **D-33:** New session: provider avatar (24px) + model name + "How can I help?" in Body text on surface-base. Contextual, understated.
- **D-34:** Empty session list: centered "No sessions yet" (Body, text-muted) + "New Chat" button (accent, 44px). Spring entrance.

### Claude's Discretion
- Markdown renderer internal architecture (AST walker vs regex vs hybrid)
- FlatList cell recycling and memoization strategy
- WebSocket message buffering during reconnection
- Bottom sheet library choice for tool card expansion (react-native-bottom-sheet or equivalent)
- Streaming visual feedback details (pulsing line, accent indicator) — carry forward Phase 69's spec where possible
- Dynamic color during streaming (warmth shift) — implement if time allows, not blocking
- Haptic feedback on key interactions (send, approve/deny, tool chip tap, swipe-delete) — implement where natural

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Visual Contract (PRIMARY)
- `.planning/NATIVE-APP-SOUL.md` — Authoritative visual contract. Spring configs (Micro/Standard/Navigation/Drawer/Expand/Dramatic), 4-tier surface hierarchy, dynamic color, haptics, screen specs, anti-patterns. Every component must comply.

### Reference App Patterns (IMPLEMENTATION GUIDE)
- `mobile/.planning/research/PATTERNS-PLAYBOOK.md` — Copy-paste-ready patterns from 4 production apps. Drawer sessions, streaming markdown (ChunkedCodeView), FlatList inverted, Zeego context menus, composer, theme system. Primary implementation reference for Phase 75.

### Phase 74 Context (FOUNDATION)
- `.planning/phases/74-shell-connection/74-CONTEXT.md` — Auth flow, drawer navigation, connection resilience, theme system decisions. Phase 75 builds directly on this.

### Phase 69 Context (DESIGN REFERENCE)
- `.planning/phases/69-chat-foundation/69-CONTEXT.md` — Message layout, empty states, streaming indicators, dynamic color spec. Many decisions carry forward to Phase 75 (adapted for v4.0 scope).

### Research
- `mobile/.planning/research/SUMMARY.md` — Research summary: component libraries, streaming markdown, keyboard handling, message list strategies
- `mobile/.planning/research/CHAT-UI-RESEARCH.md` — Chat UI research findings
- `mobile/.planning/research/SWIFTCHAT-STREAMING-STUDY.md` — swift-chat streaming markdown analysis (ChunkedCodeView pattern)
- `mobile/.planning/research/PRIVATE-MIND-DEEP-STUDY.md` — Private Mind architecture deep dive

### API & Backend
- `.planning/BACKEND_API_CONTRACT.md` — 47+ endpoints, WebSocket protocol, session management API. Required for session CRUD, message sending, streaming.

### Strategic Direction
- `.planning/ROADMAP.md` — Phase 75 definition, success criteria, dependencies
- `.planning/REQUIREMENTS.md` — CHAT-01 through CHAT-12 acceptance criteria
- `.planning/PROJECT.md` — Core value, architecture, constraints

### Existing Shared Code
- `shared/lib/websocket-client.ts` — WebSocket client with reconnection state machine
- `shared/lib/stream-multiplexer.ts` — Callback-based message router (content, thinking, tool_use, tool_result channels)
- `shared/lib/api-client.ts` — API client with auth injection
- `shared/stores/` — 5 Zustand factory stores (connection, file, stream, timeline, ui)
- `shared/types/` — Type definitions (message, session, stream, websocket, tool types)

### Existing Mobile Code (Phase 74 Foundation)
- `mobile/components/auth/AuthScreen.tsx` — Token input screen
- `mobile/components/chat/ComposerShell.tsx` — Visual-only composer (Phase 75 makes functional)
- `mobile/components/chat/EmptyChat.tsx` — Placeholder empty state
- `mobile/components/connection/ConnectionBanner.tsx` — Glass connection banner
- `mobile/components/navigation/AnimatedScreen.tsx`, `ChatHeader.tsx`, `DrawerContent.tsx`
- `mobile/hooks/` — useAppState, useAuth, useConnection, useDynamicColor, useMessageList, useScrollToBottom, useSessions
- `mobile/lib/` — api-client, auth-provider, colors, platform, springs, storage-adapter, websocket-init

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **7 hooks** in `mobile/hooks/` — useAuth (auth state machine), useConnection (WS lifecycle), useSessions (session CRUD), useMessageList (message state), useAppState (foreground/background), useDynamicColor (color shifts), useScrollToBottom (scroll pill logic). All transfer. Some may need extension for Phase 75 features (e.g., useMessageList needs streaming integration).
- **7 lib files** in `mobile/lib/` — auth-provider (SecureStore), platform (Tailscale URLs), storage-adapter (MMKV), websocket-init (WS client setup), colors (color utils), springs (Soul doc spring configs), api-client. All styling-agnostic, transfer as-is.
- **5 Zustand stores** via shared/ factory pattern — connection, stream, timeline, ui, file stores all instantiated with MMKV adapter.
- **Stream multiplexer** in shared/ — already routes content tokens, thinking blocks, tool_use/tool_result to separate callback channels. Phase 75 wires these callbacks to React Native UI.
- **Phase 74 components** — DrawerContent (stub session list -> upgrade to full), ComposerShell (visual -> functional), ConnectionBanner (done), AuthScreen (done).

### Established Patterns
- **createStyles(theme)** — StyleSheet factory accepting typed Theme object. All Phase 74 components use this. Phase 75 continues.
- **Callback injection** — WebSocket client and multiplexer both use callback injection, not direct store imports. Wiring at app init.
- **Expo Router** — File-based routing: `(drawer)/index.tsx` = session list, `(drawer)/(stack)/chat/[id].tsx` = chat screen.
- **Spring configs** — 6 named springs in `mobile/lib/springs.ts` (Micro, Standard, Navigation, Drawer, Expand, Dramatic). All Soul doc values.

### Integration Points
- **Root layout** (`mobile/app/_layout.tsx`) — Already handles WebSocket init, store wiring, auth check, AppState listener.
- **DrawerContent** — Currently stub. Upgrade to date-grouped session list with search and swipe-delete.
- **Chat screen** (`[id].tsx`) — Currently shows EmptyChat + ComposerShell. Becomes full message list + functional composer.
- **Backend** (port 5555) — Unchanged. WebSocket + REST API. Tailscale IP: 100.86.4.57.

</code_context>

<specifics>
## Specific Ideas

- **Tool chips as inline collapsed elements** — not full cards. Icon + name + status. Tap opens bottom sheet. This was a deliberate choice to preserve mobile screen real estate during tool-heavy responses. The web app's expanding inline cards are too large for phone viewport.
- **Thinking blocks breathe during streaming** — expanded while thinking, auto-collapse when content starts. Creates a rhythm: thinking (expanded, dimmed) -> content (collapsed summary, main response flows). Tap to re-open.
- **Date-grouped sessions with status dots** — sessions don't jump around based on activity. Running indicator is a visual overlay, not a sort criterion. Stability over real-time reordering.
- **Full syntax highlighting ships** — not deferred. CHAT-06 met completely in Phase 75. The quality bar demands it.
- **Private Mind ~30% reuse** — drawer session list, composer patterns, theme system from PATTERNS-PLAYBOOK. 70% is Loom-specific (tool chips, thinking blocks, permission cards, streaming multiplexer integration).

</specifics>

<quality_bar>
## Quality Bar (Bard Assessment)

**Good:**
- Messages stream and render without jank (60 FPS maintained)
- Composer sends and clears reliably
- Session switcher works, preserves scroll position
- Tool chips appear showing status, expand on tap
- Thinking blocks render and collapse after streaming
- Permission cards prompt for approval

**Exceptional (what 99% of apps miss):**
- Every interaction has spring response — send button, permission card, tool chip expand, drawer items, swipe-delete reveal
- Tool chips visually update status in-place during streaming (pending -> running -> done) without layout shift
- Scroll-to-bottom pill appears with bouncy spring entrance, dismisses on tap
- Streaming indicator (pulsing accent line) shows and disappears on complete
- Thinking block expand/collapse is smooth via Reanimated layout animation — no content jank
- Session list stagger-animates on drawer open (each item springs in with 30ms delay)
- Composer glass effect (if perf allows) shows message list behind during typing
- Swipe-to-delete works with spring reveal + undo toast
- Code blocks have horizontal scroll, language label, copy button with haptic + "Copied" toast

**The quality bar is:** Would a designer at Apple or Linear see this and say "this is crafted"? The Soul doc specifies this level. Every motion, every color shift should be intentional.

</quality_bar>

<deferred>
## Deferred Ideas

- **Long-press context menu on messages** (Copy/Retry/Share) — gesture scope for a later phase
- **File attachment in composer** — future phase capability
- **Dynamic color breathing during streaming** (warmth shift) — Claude's discretion, implement if time allows
- **Multiple providers in composer** — v5.0 scope, Phase 75 is Claude-only backend routing

### Reviewed Todos (not folded)
None — no matching todos found for Phase 75.

</deferred>

---

*Phase: 75-chat-shell*
*Context gathered: 2026-04-03*
