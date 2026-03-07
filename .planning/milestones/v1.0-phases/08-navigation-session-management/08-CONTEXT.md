# Phase 8: Navigation + Session Management - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Sidebar with grouped session list, session switching with message loading, URL-driven routing, and a basic chat content area with composer. Users can browse sessions, click to switch, create new chats, and send messages using the existing WebSocket pipeline. This completes M1 as a usable (if minimal) application. No markdown rendering (M2 CHAT-04), no message entrance animations (M3), no command palette (M3), no multi-provider tabs (M4).

</domain>

<decisions>
## Implementation Decisions

### Session item design
- **Layout:** 2-line compact rows. Line 1: session title (truncated to 1 line). Line 2: relative timestamp ("2m ago", "1h ago") + small provider logo
- **Active session:** 3px left border in `--accent-primary` (dusty rose). No background tint on active -- the border is the only indicator
- **Hover state:** Subtle background shift via `color-mix(in oklch, var(--text-muted) 5%, var(--surface-raised))`. Transition: `background-color var(--duration-fast) var(--ease-out)`. Cursor: pointer
- **Provider icon:** Small inline SVG logos for each provider (Claude, Gemini, Codex). NO emoji/Unicode placeholders -- hardcoded SVG paths from the start (Architect mandate: emoji rots visual authority)
- **Context menu:** Right-click opens context menu with "Rename" and "Delete" options. Backend supports `DELETE /api/projects/:project/sessions/:id`
- **Title truncation:** Single line, CSS `text-overflow: ellipsis`

### Date grouping
- **Groups:** "Today", "Yesterday", "Previous 7 Days", "Older"
- **Group headers:** Small uppercase label in `--text-muted`, sticky to top of scroll area (like Slack date separators). Uses `position: sticky` + `z-[var(--z-sticky)]`
- **Empty groups:** Hidden entirely -- don't show group headers for time ranges with no sessions

### New Chat behavior
- **Flow:** Click "New Chat" -> `timeline.setActiveSession(null)` -> `navigate('/chat')` -> content area shows empty state with composer. No backend session creation until first message is sent
- **Button position:** Full-width ghost button just below the Loom header, above the session list. Always visible, never scrolls away
- **Button style:** No background, `--accent-primary` text color, `+` icon. On hover: subtle `--accent-primary-muted` background tint. On focus: accent ring
- **Post-send:** After first message, backend creates session via WebSocket. URL updates to `/chat/:newId`. New session appears at top of sidebar list

### Sidebar empty state
- **Zero sessions:** Centered "No conversations yet" text in `--text-muted` + prominent "New Chat" button below. Replaces the session list area (header + New Chat button above still visible)

### Chat content area
- **Full send capability in M1:** Basic composer (text input + send button) in the chat content area. Connects to existing WebSocket pipeline from proof-of-life
- **Empty state:** Centered "Loom" wordmark (Instrument Serif) + subtitle "What would you like to work on?" in `--text-muted`. Composer fixed at bottom
- **Composer:** Simple single-line text input + send button. Enter to send. Stop button during streaming. Not the full M2 auto-expanding composer (CHAT-05) -- this is the minimal M1 version
- **Streaming:** Uses ActiveMessage + useStreamBuffer + ToolChip from Phase 7. New messages append to conversation

### Message rendering
- **Historical messages:** Plain text with whitespace preserved (`white-space: pre-wrap`). No markdown parsing in M1 (that's CHAT-04 in M2)
- **Tool calls from history:** Rendered as collapsed ToolChip components using Phase 7 registry
- **User messages:** Right-aligned bubble with `--accent-primary-muted` background. Compact, chat-style
- **Assistant messages:** Left-aligned, full-width, no background bubble. Document-style reading
- **CRITICAL: Unified message container:** Historical `AssistantMessage` and streaming `ActiveMessage` MUST share the exact same CSS layout wrapper (padding, line-height, spacing tokens). Any pixel difference causes scroll jitter during the finalization handshake (COMP-03). Use a shared `MessageContainer` component or shared CSS class.
- **Loading state (message fetch):** 3-4 shimmer skeleton rectangles mimicking message shapes. Left-to-right gradient sweep animation. Uses `--surface-overlay` on `--surface-base`. Skeletons MUST use the same `--space-*` tokens as real messages to prevent CLS (Constitution 10.2)

### Session list fetching
- **Strategy:** Load all sessions for the current project on sidebar mount (`GET /api/projects/:proj/sessions?limit=999`). No pagination complexity in M1
- **Project context:** On app mount, `GET /api/projects` to list projects, use first/most-recent as default. Store `projectName` in ui store. No project picker UI in M1
- **Auto-refresh:** WebSocket-driven updates. `session-created` -> add to list. `projects_updated` -> refetch list. On delete -> remove from list. No polling
- **Sidebar loading state:** 3-4 skeleton rows with shimmer animation while sessions initially load. Header + New Chat button visible immediately

### Session switching (from Phase 4 context)
- **Abort-and-switch:** If streaming, send abort signal, reset stream store, then switch
- **Memory caching:** Messages kept in memory across session switches. Switching back is instant (no re-fetch). Memory cleared on page reload
- **Coordination:** `useSessionSwitch` hook coordinates `stream.reset()` + `timeline.setActiveSession()` + message loading. Stores stay independent
- **Race condition protection:** `useSessionSwitch` MUST use `AbortController` to cancel pending message fetches when switching sessions rapidly. Prevents "wrong session data" race condition where a slow fetch for session A resolves after session B is already active

### Claude's Discretion
- Shimmer skeleton CSS animation implementation details
- Context menu component structure (custom vs native right-click)
- Exact provider logo SVG paths or emoji placeholders
- Relative time formatting logic (exact thresholds for "just now" vs "Xm ago" vs "Xh ago")
- API error handling for session/message fetches (retry, error banner, etc.)
- Whether to add a `loadMessages` action to timeline store or keep it in the hook
- How to wire the composer to the existing WebSocket pipeline (reuse proof-of-life pattern or abstract further)
- Exact skeleton shimmer count, widths, and spacing

### Architect Mandates (non-negotiable)
- Sidebar MUST be split into subcomponents: `SessionList`, `SessionItem`, `DateGroupHeader` (Constitution 2.4 -- current Sidebar.tsx is 92 lines, adding all features would exceed 200-line limit)
- SVG provider logos, not emoji (quality bar)
- Unified CSS container for streaming + historical assistant messages (scroll jitter prevention)
- AbortController on session switch fetches (race condition protection)
- Skeleton spacing tokens must match real message tokens (CLS prevention)

</decisions>

<specifics>
## Specific Ideas

- Active session indicator is accent left border only (like VS Code tab indicator) -- subtle but unambiguous
- Sticky date group headers pin to top of sidebar scroll area -- you always know which time range you're looking at
- The empty chat state centers the Loom wordmark in Instrument Serif -- the same branding from the sidebar header, establishing identity
- User messages right-aligned in chat bubbles, assistant messages full-width left-aligned -- classic chat layout distinguishing who's speaking
- "New Chat" creates nothing on the backend until first message -- no orphaned empty sessions
- Session list refreshes via WebSocket events (already wired in Phase 5) -- no polling overhead

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Sidebar.tsx`: Already has branded header ("Loom" in Instrument Serif italic), collapse toggle, `role="complementary"`, `--surface-raised` bg. Phase 8 fills the empty body below the header
- `AppShell.tsx`: CSS Grid with sidebar column at `var(--sidebar-width, 280px)`, Outlet for content. No changes needed to the shell
- `App.tsx`: Route structure with `/chat/:sessionId?`. `ChatPlaceholder` needs replacing with real chat view component
- `timeline.ts`: Timeline store with sessions, activeSessionId, addSession, setActiveSession, addMessage, updateMessage, updateSessionTitle, removeSession. Persistence metadata-only
- `stream.ts`: Stream store with isStreaming, activeToolCalls, thinkingState. Has reset action
- `ui.ts`: UI store with sidebarOpen, toggleSidebar, sidebarState
- `connection.ts`: Connection store with provider status
- `ActiveMessage.tsx`: Multi-span streaming with tool chip interleaving -- reusable in chat content area
- `useStreamBuffer.ts`: rAF token buffer with checkpoint support -- reusable for new messages
- `useScrollAnchor.ts` + `ScrollToBottomPill`: Scroll anchor system ready for chat content area
- `ToolChip.tsx` + `ToolCard.tsx`: Tool display components from Phase 7
- `ThinkingDisclosure.tsx`: Collapsible thinking block display
- `tool-registry.ts`: Pluggable tool registry with 6 registered tools
- `websocket-client.ts` + `websocket-init.ts`: WebSocket singleton with multiplexer already wired to stores
- `auth.ts`: JWT auth module for API requests
- `ProofOfLife.tsx`: End-to-end streaming demo -- pattern reference for chat send flow

### Established Patterns
- Zustand stores with selector-only access (ESLint enforced)
- Named exports only (ESLint enforced)
- Test files colocated with source
- `cn()` utility for className composition
- Token-based styling enforced by Constitution ESLint rules
- WS client is a pure singleton -- components import `wsClient` directly
- Content stream uses Set-based listener pattern

### Integration Points
- Replace `ChatPlaceholder` in `App.tsx` with real ChatView component
- Expand `Sidebar.tsx` body with session list, new chat button, date groups
- `useTimelineStore` sessions + activeSessionId drive sidebar + content area
- `wsClient.send()` for new messages, `wsClient.subscribeContent()` for streaming
- `GET /api/projects` and `GET /api/projects/:proj/sessions` for data fetching
- WebSocket events `session-created` and `projects_updated` for auto-refresh

</code_context>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 08-navigation-session-management*
*Context gathered: 2026-03-06*
