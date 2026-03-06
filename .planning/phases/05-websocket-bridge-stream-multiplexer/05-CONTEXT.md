# Phase 5: WebSocket Bridge + Stream Multiplexer - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning

<domain>
## Phase Boundary

The frontend establishes a typed WebSocket connection to the CloudCLI backend, parses every incoming message into a discriminated union, and routes content/thinking/tool streams into separate channels feeding the correct stores. Includes auth bootstrapping, reconnection with exponential backoff, and a multiplexer that splits content blocks by type. No streaming UI rendering (Phase 6), no tool card display (Phase 7), no sidebar session list (Phase 8) -- this is the data pipeline that everything else consumes.

</domain>

<decisions>
## Implementation Decisions

### Auth & connection bootstrap
- **Auth module:** Separate `src/lib/auth.ts` handles login, JWT storage (localStorage), token retrieval. WebSocket client and future HTTP API client both import from it.
- **Auth flow:** Claude's discretion -- balance M1 scope with security for a single-user dev tool. Backend supports login form and platform mode (auto-auth).
- **On connect:** Immediately send `get-active-sessions` to sync frontend with backend state. Update connection store accordingly.
- **WS topology:** Singleton -- one WebSocket connection for the entire app. All providers share `/ws`. Matches backend architecture. M4 tabs filter by provider, not by connection.

### Reconnection UX
- **Visual indicator:** Subtle status dot (green/yellow-pulse/red). No modal, no banner, no overlay. Non-intrusive.
- **Mid-stream disconnect:** Keep partial content tokens accumulated so far. Show an error message below the partial response: "Connection lost during response." Don't auto-retry the prompt.
- **Retry strategy:** Claude's discretion -- exponential backoff per STRM-01 spec (1s/2s/4s/8s/max 30s). Choose whether to stop after N attempts or retry indefinitely.
- **On reconnect:** Re-bootstrap -- send `get-active-sessions` again + `check-session-status` for any session that was streaming. Keeps frontend synced.

### Message parsing fidelity
- **Parse depth:** Full parse of all content block types (text, tool_use, tool_result, thinking). Map to existing types (Message, ToolCall, ThinkingBlock). All data available in stores for Phase 6-7 even if M1 UI doesn't render everything.
- **Type safety:** Full TypeScript discriminated union (`ServerMessage`) with exhaustive switch. Missing handler = compile error.
- **Multi-provider types:** Define types for codex-response, gemini-response etc. in the union now. Handler just logs them in M1. No type changes needed for M4.
- **Type location:** New `src/types/websocket.ts` file for all WS message types (ServerMessage union, ClientMessage union, SDK content block types).
- **Runtime validation:** Trust backend -- type assertion only (`JSON.parse(raw) as ServerMessage`). No Zod or runtime schema validation. This is an internal system.
- **Permission handling:** Parse `claude-permission-request`, auto-allow all tool permissions in M1 (no UI for approval dialogs yet). Types and store actions ready for M2's permission UI.
- **Token usage:** `token-budget` messages update the connection store (add tokenBudget field to ProviderConnection type). Token budget is per-provider resource consumption.

### Multiplexer architecture
- **Shape:** Pure functions in `src/lib/stream-multiplexer.ts`. No class, no hook. The WS client calls `routeMessage(msg, callbacks)` which dispatches to the right channel.
- **Coupling:** Callback injection -- multiplexer never imports stores. Receives `onContentToken`, `onThinking`, `onToolCall`, `onToolResult` callbacks. Testable with mocks.
- **Token buffer ref:** Passed in from consuming component (Phase 6's ActiveMessage creates the ref). The useWebSocket hook accepts an optional tokenBufferRef.
- **React wiring:** `WebSocketProvider` context at app root. `useWebSocket()` hook reads from context. Ensures one WS connection. Any component can call `send()`.
- **WS client:** Class-based (`WebSocketClient`). Encapsulates connection, reconnection state machine, timers. Callbacks for `onMessage` and `onStatusChange`.
- **Send behavior:** No queue -- `send()` returns false if disconnected. UI should prevent sending when not connected.

### Claude's Discretion
- Exact auth flow implementation (login form vs auto-login vs platform mode detection)
- Retry count before giving up (or infinite retry at 30s cap)
- Internal reconnection state machine details
- How to extract content blocks from Claude SDK's nested message structure (the exact parsing logic)
- Whether to add tokenBudget to ProviderConnection type inline or as a separate interface
- WebSocketProvider internal implementation details
- Test strategy (unit tests on multiplexer pure functions, integration tests on WS client)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/src/stores/connection.ts`: Full ConnectionStore with `updateProviderStatus`, `setProviderError`, `incrementReconnectAttempts`, `resetReconnectAttempts`, `connect`, `disconnect` actions. Ready to receive WS lifecycle updates.
- `src/src/stores/stream.ts`: Full StreamStore with `startStream`, `endStream`, `addToolCall`, `updateToolCall`, `setThinkingState`, `setActivityText` actions. Ready to receive multiplexer output.
- `src/src/types/provider.ts`: `ProviderId`, `ConnectionStatus` ('disconnected'|'connecting'|'connected'|'reconnecting'), `ProviderConnection` types.
- `src/src/types/stream.ts`: `ToolCallState`, `ToolCallStatus`, `ThinkingState` types.
- `src/src/types/message.ts`: `Message`, `ToolCall`, `ThinkingBlock`, `MessageMetadata`, `ProviderContext` types.

### Established Patterns
- Zustand stores with selector-only access (ESLint enforced)
- Named exports only (ESLint enforced)
- Test files colocated with source (*.test.ts)
- Constitution enforcement active on all new code
- `cn()` utility for className composition

### Integration Points
- Backend WebSocket at `ws://<host>:5555/ws?token=<jwt>` -- documented in BACKEND_API_CONTRACT.md
- Backend REST at `http://<host>:5555/api/auth/login` for JWT acquisition
- Claude SDK messages come wrapped in `{ type: 'claude-response', data: <SDKMessage>, sessionId }` -- server/claude-sdk.js transforms parent_tool_use_id to parentToolUseId
- Connection store needs new `tokenBudget` field on ProviderConnection (or separate connection action)
- App.tsx needs WebSocketProvider wrapping the app shell
- Phase 6 will create tokenBufferRef and pass it to useWebSocket

</code_context>

<specifics>
## Specific Ideas

- Multiplexer is a pure function pipeline: WS raw message -> JSON parse -> type assertion -> routeMessage(parsed, callbacks) -> callbacks dispatch to stores/refs
- Status dot pattern: green (connected), yellow pulsing (reconnecting), red (failed) -- matches prior phase convention of non-intrusive, warm-toned status indicators
- Permission auto-allow in M1 means Claude can use all tools without blocking -- essential for the proof-of-life in Phase 7
- Token budget in connection store lets the sidebar (Phase 8) or status bar show context window usage per provider
- The singleton WS + context provider pattern is consistent with how the Phase 3 app shell already wraps the app in providers

</specifics>

<deferred>
## Deferred Ideas

- **Permission approval UI**: Full Allow/Deny dialog with tool input preview -- M2 (CHAT phase)
- **Message send queue**: Buffer messages during disconnection and replay on reconnect -- consider if needed in M3
- **Per-provider WebSocket connections**: Not needed while backend multiplexes all providers on one /ws endpoint
- **Codex/Gemini message parsing**: Types defined but actual handling deferred to M4

</deferred>

---

*Phase: 05-websocket-bridge-stream-multiplexer*
*Context gathered: 2026-03-06*
