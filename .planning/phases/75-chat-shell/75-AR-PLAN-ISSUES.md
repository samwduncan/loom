# Adversarial Plan Review — Phase 75

**Tier:** max
**Date:** 2026-04-03
**Agents:** Guard (Sonnet), Hunter (Opus), Architect (Opus), Bard (Gemini)
**Findings:** 18 unique (5 S+, 8 A, 5 B/C)

## S+ Issues (Must Fix)

### [S] PermissionRequest.input type mismatch — compilation failure guaranteed
**Source:** Guard + Architect + Hunter (3/4 agents) | **Confidence:** HIGH
**Plans:** 01, 04
**Description:** Plans declare `PermissionRequest.input` as `Record<string, unknown>`, but actual type in `shared/stores/stream.ts:18` is `input: unknown`. Plan 04 Task 3 accesses `request.input.command`, `request.input.file_path` — TypeScript rejects property access on `unknown`.
**Fix:** Either (1) update `shared/stores/stream.ts` to type input as `Record<string, unknown>` (safe — backend always sends object), or (2) add type narrowing in Plan 04: `const input = request.input as Record<string, unknown>`.

### [S] Missing projectPath/projectName on drawer session navigation
**Source:** Architect + Hunter (2/4 agents) | **Confidence:** HIGH
**Plans:** 02, 06
**Description:** DrawerContent's `handleSessionPress` only passes `{ id: session.id }` as route params. Plan 06 reads `projectPath`/`projectName` from `useLocalSearchParams()` to pass to Composer. Existing sessions navigated from drawer will have undefined projectPath — Composer cannot send messages.
**Fix:** Plan 02 Task 3 must pass `projectName` and `projectPath` in router params: `router.push({ pathname: '/chat/[id]', params: { id: session.id, projectName: session.projectName, projectPath: session.projectPath } })`.

### [S] Composer FSM stale closure — 5s fallback fires mid-stream
**Source:** Architect + Hunter (2/4 agents) | **Confidence:** HIGH
**Plan:** 05
**Description:** `handleSend` captures `composerState` in a `useCallback` closure. The 5s setTimeout always sees the value at closure creation time. When streaming starts (state → 'active'), the timeout still fires and resets to 'idle' mid-stream, showing send button instead of stop.
**Fix:** Use ref for fallback check: `composerStateRef.current === 'sending'`. Or better: remove 5s fallback entirely — the `isStreaming` subscription handles the transition. If stream never starts, ConnectionBanner handles it.

### [S] Swipe-to-delete has two contradictory approaches
**Source:** Hunter (SS) + Guard (A) + Architect (A) + Bard (B) — all 4 agents | **Confidence:** HIGH
**Plan:** 02
**Description:** Plan describes both delayed-delete-with-timer AND optimistic-hide-with-ref-set, but never reconciles them into one coherent implementation. Executor gets conflicting instructions. Error handling on delete failure is missing.
**Fix:** Specify one concrete approach: (1) On swipe: add to `pendingDeletes` ref Set, filter from display. (2) Start 5s timer. (3) Undo: remove from Set, clear timer, re-render. (4) Timer fires: call `deleteSession()`, remove from Set. (5) On delete error: remove from Set + show error toast. (6) On unmount: flush all pending deletes.

### [S] Historical messages lack toolCalls/thinkingBlocks — CHAT-04/05 broken for history
**Source:** Hunter | **Confidence:** HIGH
**Plan:** 05
**Description:** `DisplayMessage` type has no `toolCalls` or `thinkingBlocks` fields. `toDisplayMessages()` discards them from API `Message`. Historical assistant messages render as plain text without tool chips or thinking blocks. Additionally, `endStream()` clears `activeToolCalls: []` and `thinkingState: null` from the store, causing a flash of missing data between stream end and re-fetch.
**Fix:** (1) Extend `DisplayMessage` with optional `toolCalls?: ToolCall[]` and `thinkingBlocks?: ThinkingBlock[]`. (2) Update `toDisplayMessages()` to carry these from API Message. (3) Plan 05 AssistantMessage should read tool/thinking data from the message object for historical, from stream store only for the active streaming message.

## A-Grade Issues (Should Fix)

### [A] ThinkingBlock duration estimation is fabricated
**Source:** Guard + Architect + Hunter (3/4 agents) | **Confidence:** HIGH
**Plan:** 03
**Description:** `Math.max(1, Math.round(block.text.length / 200))` seconds is arbitrary. Produces nonsensical values. Fix: track real elapsed time via `useRef(Date.now())` when `isActive` first becomes true.

### [A] Toast.ts cross-plan dependency breaks Wave 2 parallelism
**Source:** Guard | **Confidence:** HIGH
**Plans:** 02, 03
**Description:** Plan 02 Task 1 creates `mobile/lib/toast.ts`. Plan 03 Task 2 (CodeBlockSegment) imports `showToast` from it. Both are Wave 2. Fix: move toast.ts creation to Plan 01 (Wave 1).

### [A] useScrollToBottom hook already exists — Plan 06 reinvents it
**Source:** Guard | **Confidence:** HIGH
**Plan:** 06
**Description:** `mobile/hooks/useScrollToBottom.ts` already implements `isAtBottom`, `showPill`, `onScroll`, `scrollToBottom()`. Plan 06 re-implements this from scratch. Fix: use existing hook.

### [A] Tool call interleaving contradicts D-04
**Source:** Guard | **Confidence:** HIGH
**Plan:** 01
**Description:** Plan says "emit all tool calls as a group after the last text/code segment" but D-04 says "chips appear at insertion point in text flow." Acknowledged limitation (no position data), but should be explicitly noted as a known simplification.

### [A] FlatList message order ambiguity
**Source:** Hunter | **Confidence:** HIGH
**Plan:** 05
**Description:** `useMessageList` returns oldest-first. Inverted FlatList needs newest-first at index 0. Plan leaves this as "reverse if needed" — should explicitly state `data={[...messages].reverse()}`.

### [A] SessionItem isRunning uses wrong store field
**Source:** Guard | **Confidence:** MEDIUM
**Plan:** 02
**Description:** Uses `useStreamStore.activeSessionId` (tracks one session). Should use `liveAttachedSessions.has(item.id)` for multiple running sessions.

### [A] useMessageList streaming integration underspecified
**Source:** Architect | **Confidence:** HIGH
**Plan:** 05
**Description:** No mechanism to identify which message is the streaming message. Every MessageItem subscribes to stream store. Fix: extract stream reads to MessageList, pass as props only to streaming message.

### [A] Stub session ID replacement not verified
**Source:** Architect | **Confidence:** MEDIUM
**Plan:** 06
**Description:** CHAT-02 doesn't verify stub-to-real session ID swap. Add to Plan 06 Task 3 device verification checklist.

## Lower-Grade Notes (B/C)

- [B] Validation strategy TBD — skeleton not populated after plans created (Architect, Hunter)
- [B] enriched-markdown code block override question moot — segment parser handles this (Architect)
- [B] useScrollPosition uses new MMKV instance instead of shared one (Guard, Architect, Hunter)
- [B] ToolDetailSheetProvider not available until Plan 06 — Plans 04/05 crash in isolation (Guard)
- [C] ComposerShell.tsx not deleted after replacement (Architect)

## Verification: PASSED

All 10 S+/A issues confirmed fixed by Haiku verification pass. No remaining S+ findings.
