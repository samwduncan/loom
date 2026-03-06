# Phase 5: WebSocket Bridge + Stream Multiplexer - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning
**Reviewed by:** Gemini Architect (review mode) -- corrections applied

<domain>
## Phase Boundary

The frontend establishes a typed WebSocket connection to the CloudCLI backend, parses every incoming message into a discriminated union, and routes content/thinking/tool streams into separate channels feeding the correct stores. Includes auth bootstrapping, reconnection with exponential backoff, and a multiplexer that splits content blocks by type. No streaming UI rendering (Phase 6), no tool card display (Phase 7), no sidebar session list (Phase 8) -- this is the data pipeline that everything else consumes.

</domain>

<decisions>
## Implementation Decisions

### Auth & connection bootstrap
- **Auth module:** Separate `src/lib/auth.ts` handles JWT storage (localStorage), token retrieval. WebSocket client and future HTTP API client both import from it.
- **Auth flow:** Auto-auth / platform mode for M1. Detect backend mode on boot, acquire JWT automatically. No login screen in M1 -- this is a single-user dev tool. Minimal login form only as fallback if auto-auth fails.
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
- **Runtime validation:** Trust backend with envelope check -- verify `typeof msg.type === 'string'` before casting to `ServerMessage`. No Zod, but don't blindly assert. Log and skip malformed messages.
- **Permission handling:** Parse `claude-permission-request` and auto-allow with a logged warning for write/execute tools (Bash, Write, Edit). Read-only tools (Read, Glob, Grep) auto-allow silently. Types and store actions ready for M2's permission UI.
- **Token usage:** `token-budget` messages update the connection store (add tokenBudget field to ProviderConnection type). Token budget is per-provider resource consumption.

### Multiplexer architecture
- **Shape:** Pure functions in `src/lib/stream-multiplexer.ts`. No class, no hook. The WS client calls `routeMessage(msg, callbacks)` which dispatches to the right channel.
- **Coupling:** Callback injection -- multiplexer never imports stores. Receives `onContentToken`, `onThinking`, `onToolCall`, `onToolResult` callbacks. Testable with mocks.
- **Token buffer:** NOT a React ref passed into the WS client. The WS client singleton holds a subscribable content stream (event emitter or similar). Phase 6 subscribes to content tokens via a `useTokenStream` hook. Network layer has zero knowledge of React.
- **React wiring:** NO Context Provider (Constitution 4.4 bans Context for mutable state). WS client is a pure singleton (`export const wsClient = new WebSocketClient()`). Components import `wsClient.send()` directly. Connection status lives in the connection Zustand store, updated by the WS client's lifecycle callbacks.
- **WS client:** Class-based (`WebSocketClient`). Encapsulates connection, reconnection state machine, timers. Updates connection store on state changes. Wires multiplexer callbacks to stores on construction.
- **Send behavior:** No queue -- `send()` returns false if disconnected. UI should prevent sending when not connected.

### Claude's Discretion
- Exact auto-auth implementation (platform mode detection, fallback login flow)
- Retry count before giving up (or infinite retry at 30s cap)
- Internal reconnection state machine details
- How to extract content blocks from Claude SDK's nested message structure (the exact parsing logic)
- Whether to add tokenBudget to ProviderConnection type inline or as a separate interface
- Content stream subscription mechanism (EventTarget, custom EventEmitter, or callback registration)
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
- No React Context for mutable state (Constitution 4.4)

### Integration Points
- Backend WebSocket at `ws://<host>:5555/ws?token=<jwt>` -- documented in BACKEND_API_CONTRACT.md
- Backend REST at `http://<host>:5555/api/auth/login` for JWT acquisition
- Claude SDK messages come wrapped in `{ type: 'claude-response', data: <SDKMessage>, sessionId }` -- server/claude-sdk.js transforms parent_tool_use_id to parentToolUseId
- Connection store needs new `tokenBudget` field on ProviderConnection (or separate connection action)
- WS client singleton initialized at app startup (not inside a React component)
- Phase 6 will subscribe to content tokens via event emitter on WS client singleton

</code_context>

<specifics>
## Specific Ideas

- Multiplexer is a pure function pipeline: WS raw message -> JSON parse -> envelope check -> routeMessage(parsed, callbacks) -> callbacks dispatch to stores
- Status dot pattern: green (connected), yellow pulsing (reconnecting), red (failed) -- matches prior phase convention of non-intrusive, warm-toned status indicators
- Permission auto-allow with logging means Claude can use tools for proof-of-life (Phase 7), while write/execute tools get a visible console warning so destructive operations are traceable
- Token budget in connection store lets the sidebar (Phase 8) or status bar show context window usage per provider
- Singleton WS client + Zustand stores = no React Context needed. Components read connection state via useConnectionStore selector, send messages via wsClient.send()

</specifics>

<deferred>
## Deferred Ideas

- **Permission approval UI**: Full Allow/Deny dialog with tool input preview -- M2 (CHAT phase)
- **Message send queue**: Buffer messages during disconnection and replay on reconnect -- consider if needed in M3
- **Per-provider WebSocket connections**: Not needed while backend multiplexes all providers on one /ws endpoint
- **Codex/Gemini message parsing**: Types defined but actual handling deferred to M4
- **Login screen**: Real auth UI with username/password form -- only if needed beyond M1's auto-auth

</deferred>

---

*Phase: 05-websocket-bridge-stream-multiplexer*
*Context gathered: 2026-03-06*
*Gemini architect review: Approved with corrections applied (killed Context Provider per Constitution 4.4, decoupled token buffer from React, added envelope validation, refined auth to auto-auth, restricted permission auto-allow)*
