# Phase 13: Composer - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the M1 single-line `<input>` ChatComposer with a full-featured multiline composer: auto-resize `<textarea>`, image paste/drag-and-drop with thumbnail previews, send/stop state machine with morph animation, keyboard shortcuts, draft preservation across session switches and reloads, and message queuing during streaming.

</domain>

<decisions>
## Implementation Decisions

### Composer visual design
- Floating pill shape: `rounded-xl`, subtle shadow, `bg-surface-1` lift from chat area
- Centered with `max-w-3xl` (768px) — same column width as message list
- Message list also gets `max-w-3xl` centered column to match (unified reading column)
- Focus state: subtle primary-colored ring (1px, `ring-primary/30`)
- During streaming: border shifts to `border-primary/40` (rose tint) — placeholder for M3 ElectricBorder
- Send/Stop button inside the pill at bottom-right corner, anchored to bottom as textarea grows
- Placeholder text: "Send a message..."
- Keyboard shortcut hints in bottom-left of pill: `Enter to send` / `Shift+Enter for newline` (muted text, uses kbd component). Hints fade out after first message sent in session.
- Cmd+. / Ctrl+. kbd hint shown next to stop button during streaming

### Send/Stop state machine
- 5 states: `idle` -> `sending` (200ms disabled) -> `active` (streaming) -> `aborting` (stop pressed) -> `idle`
- idle: Send button (Lucide Send icon, primary bg)
- sending: Send button disabled, 200ms lockout
- active: Stop button (Lucide Square icon, red bg)
- aborting: Disabled button with CSS spinner replacing square icon, muted colors. 5-second timeout before force-reverting to idle if backend doesn't confirm abort.
- CSS crossfade (opacity transition, 100ms) between send/stop states — position-stable in same grid cell
- Send `abort-session` (existing pattern) for stop, `claude-abort` for Cmd+. shortcut

### Message queuing during streaming
- User CAN type in composer during streaming (not disabled like M1)
- Enter during streaming sends the message immediately to backend (backend queues it)
- Optimistic user message appears in timeline right away with a muted "Queued" badge
- Backend processes queued message after current response completes

### Image attachment UX
- Horizontal scroll row of 64x64px thumbnail cards inside the pill, above textarea
- Each thumbnail has X remove button on hover
- Counter badge in corner of row: "3/5" — turns warning color at 5/5
- Drag-and-drop overlay: dashed border replaces pill border, dimmed background (`primary/10`), centered "Drop image here" text with icon. Covers entire pill area.
- File size/type errors shown as Sonner toast notifications (auto-dismiss 3s)
- Max 5 images, max 5MB each. Client-side validation before base64 conversion.

### Image upload mechanism
- Direct WebSocket: convert images to base64 data URLs client-side via `FileReader.readAsDataURL`
- Send inline in `claude-command` message's `options.images` array: `[{data: "data:image/png;base64,...", name: "filename.png"}]`
- No REST upload round-trip — backend `handleImages()` in claude-sdk.js already accepts this format
- Client-side validation: check `file.size` before `FileReader.readAsDataURL` to prevent memory spike from base64 encoding large files

### Draft persistence
- Text drafts only (no image persistence — too large for localStorage, object URLs don't survive reload)
- `useRef<Map<string, string>>` for in-memory session drafts during session switches
- Persisted to `localStorage` keyed by session ID for reload survival
- Draft cleared on successful message send
- Subtle primary-colored dot indicator next to sessions in sidebar that have saved drafts

### Keyboard shortcuts
- Enter: send message (blocked during streaming unless queuing)
- Shift+Enter: insert newline
- Cmd+. (Mac) / Ctrl+. (Windows): stop active generation (global `useEffect` listener)
- Escape: two-step — first press clears input text (stays focused), second press (when empty) blurs textarea

### Empty state / welcome screen
- On no-session screen: composer pill vertically centered in chat area (not bottom-docked)
- Welcome content above composer: "Loom" in Instrument Serif + tagline
- 3-4 suggestion chips below tagline: clickable, populate composer with text (e.g., "Review my code", "Debug this", "Explain", "Write tests")
- Sending from empty state creates new session (existing stub session pattern)

### Auto-resize textarea
- Custom `useLayoutEffect` hook (no library, per CMP-01): `height = 0; height = scrollHeight`
- Grows from 1 line to max ~200px (~10-12 lines), then `overflow-y: auto` inner scroll
- CSS Grid integration: `grid-template-rows: 1fr auto` — scroll position stabilized when composer height changes

### Auto-focus
- Textarea auto-focuses on session switch and app load
- Focus returned to textarea after sending a message (via `requestAnimationFrame`)

### Claude's Discretion
- Exact shadow depth and transition timing for floating pill
- Suggestion chip content and styling
- Draft dot indicator exact positioning and animation
- Internal implementation of auto-resize hook
- CSS spinner design for aborting state

</decisions>

<specifics>
## Specific Ideas

- "Maybe we could look into a toned down liquid glass style background with a little bit of animation, almost as if the 'liquid glass' is subtly shifting around" — noted for M3 visual effects phase, not M2 scope
- "We should be able to queue messages like in the CLI" — Enter during streaming sends immediately, backend queues
- Welcome screen with suggestion chips — "Loom" in Instrument Serif for editorial warmth

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ChatComposer` (src/src/components/chat/composer/ChatComposer.tsx): M1 single-line input, has send/stop logic, `wsClient.send()` pattern, optimistic message add, stub session creation. Will be completely rewritten but logic patterns are reference.
- `useStreamStore` (src/src/stores/stream.ts): `isStreaming`, `activeSessionId`, `endStream` — already subscribed by ChatComposer via selectors
- `useTimelineStore` (src/src/stores/timeline.ts): `addMessage`, `addSession`, `updateSessionTitle` — existing optimistic patterns
- `wsClient` (src/src/lib/websocket-client.ts): `send()` for `claude-command` and `abort-session` messages
- `kbd` component (src/src/components/ui/kbd.tsx): shadcn kbd for keyboard shortcut hints
- `sonner` (src/src/components/ui/sonner.tsx): Toast notifications for image errors
- `ChatEmptyState` (src/src/components/chat/view/ChatEmptyState.tsx): Current empty state — will need welcome screen redesign
- `ChatView` (src/src/components/chat/view/ChatView.tsx): Renders ChatComposer — will need layout changes for centered pill and max-width column
- `MessageList` (src/src/components/chat/view/MessageList.tsx): Will need max-width container to match composer column

### Established Patterns
- Selector-only Zustand subscriptions (Constitution 4.2)
- `cn()` utility for conditional classes (Constitution 3.6)
- CSS Grid for layout (AppShell uses `grid-template-rows/columns`)
- Named exports only (Constitution 2.2)
- `requestAnimationFrame` for post-render focus/scroll operations
- Stub session pattern for optimistic new chat creation

### Integration Points
- `ChatView` renders `ChatComposer` — composer props interface will expand
- `MessageList` and `ChatComposer` both need `max-w-3xl mx-auto` container
- `SessionItem` in sidebar needs draft dot indicator
- `ChatEmptyState` needs redesign for centered composer + welcome content
- `useStreamStore.isStreaming` gates send vs stop behavior
- `wsClient.send()` for both `claude-command` (with images) and `abort-session`

</code_context>

<deferred>
## Deferred Ideas

- Liquid glass animated background on composer — M3 visual effects (Phase 19 or later)
- Model selector in composer — M4 multi-provider scope
- Slash commands / mentions in composer — not in any current milestone
- Rich text editing (TipTap) — explicitly out of scope per REQUIREMENTS.md

</deferred>

---

*Phase: 13-composer*
*Context gathered: 2026-03-07*
