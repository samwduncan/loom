# Phase 5: WebSocket Bridge + Stream Multiplexer - Research

**Researched:** 2026-03-06
**Domain:** WebSocket client, message parsing, stream routing, auth bootstrapping
**Confidence:** HIGH

## Summary

Phase 5 connects the V2 frontend to the existing CloudCLI backend via a typed WebSocket client at `ws://<host>:<port>/ws?token=<jwt>`. The backend already has a mature WebSocket protocol (documented in BACKEND_API_CONTRACT.md and verified in `server/index.js` + `server/claude-sdk.js`) -- the frontend needs to consume it, not invent it. The core deliverables are: (1) an auth module for JWT acquisition, (2) a class-based WebSocket client singleton with reconnection state machine, (3) a typed discriminated union for all server messages, and (4) a pure-function stream multiplexer that routes content/thinking/tool events to the correct Zustand stores via callback injection.

The backend sends Claude SDK messages wrapped in `{ type: 'claude-response', data: <SDKMessage>, sessionId }` where `SDKMessage` is a large union type including `assistant`, `result`, `system`, `stream_event`, `tool_progress`, `tool_use_summary`, and more. The critical subtask is parsing `SDKAssistantMessage.message.content` -- a `BetaMessage` whose `content` array contains `TextBlock`, `ToolUseBlock`, and `ThinkingBlock` entries. The multiplexer routes each content block type to the right channel.

**Primary recommendation:** Build the WS client as a class singleton (not a hook, not a Context provider) that lives in `src/lib/websocket-client.ts`. It updates Zustand stores via callbacks injected at construction time. The multiplexer is a separate pure-function file (`src/lib/stream-multiplexer.ts`) with zero imports from React or stores -- testable with simple mocks.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Auth module:** Separate `src/lib/auth.ts` handles JWT storage (localStorage), token retrieval. WebSocket client and future HTTP API client both import from it.
- **Auth flow:** Auto-auth / platform mode for M1. Detect backend mode on boot, acquire JWT automatically. No login screen in M1. Minimal login form only as fallback if auto-auth fails.
- **On connect:** Immediately send `get-active-sessions` to sync frontend with backend state.
- **WS topology:** Singleton -- one WebSocket connection for the entire app. All providers share `/ws`.
- **Visual indicator:** Subtle status dot (green/yellow-pulse/red). No modal, no banner, no overlay.
- **Mid-stream disconnect:** Keep partial content tokens. Show error message below partial response. Don't auto-retry the prompt.
- **Parse depth:** Full parse of all content block types (text, tool_use, tool_result, thinking). Map to existing types.
- **Type safety:** Full TypeScript discriminated union (`ServerMessage`) with exhaustive switch. Missing handler = compile error.
- **Multi-provider types:** Define types for codex-response, gemini-response etc. in the union now. Handler just logs them in M1.
- **Type location:** New `src/types/websocket.ts` file for all WS message types.
- **Runtime validation:** Trust backend with envelope check -- verify `typeof msg.type === 'string'` before casting. No Zod. Log and skip malformed messages.
- **Permission handling:** Parse `claude-permission-request` and auto-allow with logged warning for write/execute tools. Read-only tools auto-allow silently.
- **Token usage:** `token-budget` messages update the connection store.
- **Multiplexer shape:** Pure functions in `src/lib/stream-multiplexer.ts`. No class, no hook. Callback injection pattern.
- **Token buffer:** NOT a React ref passed into the WS client. The WS client singleton holds a subscribable content stream. Phase 6 subscribes via `useTokenStream` hook. Network layer has zero knowledge of React.
- **React wiring:** NO Context Provider (Constitution 4.4). WS client is a pure singleton. Components import `wsClient.send()` directly. Connection status lives in connection Zustand store.
- **WS client:** Class-based (`WebSocketClient`). Encapsulates connection, reconnection state machine, timers.
- **Send behavior:** No queue -- `send()` returns false if disconnected.

### Claude's Discretion
- Exact auto-auth implementation (platform mode detection, fallback login flow)
- Retry count before giving up (or infinite retry at 30s cap)
- Internal reconnection state machine details
- How to extract content blocks from Claude SDK's nested message structure
- Whether to add tokenBudget to ProviderConnection type inline or as separate interface
- Content stream subscription mechanism (EventTarget, custom EventEmitter, or callback registration)
- Test strategy (unit tests on multiplexer pure functions, integration tests on WS client)

### Deferred Ideas (OUT OF SCOPE)
- Permission approval UI (M2)
- Message send queue during disconnection (M3)
- Per-provider WebSocket connections
- Codex/Gemini actual message parsing (M4)
- Login screen
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| STRM-01 | WebSocket client with typed messages, auto-reconnect, connection store updates | Full backend protocol documented below, all server/client message types mapped, reconnection pattern defined |
| STRM-02 | Stream multiplexer routing content/thinking/tool channels to correct stores | SDK content block structure analyzed, routing logic to existing StreamStore/TimelineStore actions identified |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Native WebSocket | Browser API | WebSocket connection | No library needed -- browser WebSocket API is sufficient for a single connection |
| Zustand | ^5.0.11 | State management (already installed) | Phase 4 stores ready to receive WS updates |
| TypeScript | ~5.9.3 | Type safety (already installed) | Discriminated unions, exhaustive switch |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None required | - | - | No new dependencies for this phase |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native WebSocket | socket.io-client | Adds ~45KB for features we don't need (rooms, namespaces). Backend uses raw `ws`, not socket.io. |
| Native WebSocket | reconnecting-websocket | Small library (~2KB) with auto-reconnect. But the reconnection logic is simple enough to hand-roll and we need custom state machine integration with Zustand. |
| Manual parsing | Zod runtime validation | CONTEXT.md explicitly decided against Zod. Envelope check + type narrowing is sufficient. |

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  lib/
    auth.ts              # JWT storage, retrieval, auto-auth
    websocket-client.ts  # WebSocketClient class singleton
    stream-multiplexer.ts # Pure function message router
  types/
    websocket.ts         # ServerMessage, ClientMessage discriminated unions
  stores/
    connection.ts        # (exists) Updated with tokenBudget
    stream.ts            # (exists) Receives multiplexer output
    timeline.ts          # (exists) Receives finalized messages
```

### Pattern 1: Auth Module (`src/lib/auth.ts`)
**What:** Centralized JWT management consumed by both WS client and future HTTP API client.
**When to use:** Any authenticated request to backend.

```typescript
// src/lib/auth.ts

const TOKEN_KEY = 'loom-jwt';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Auto-auth flow:
 * 1. Check /api/auth/status -- if needsSetup, call /api/auth/register with defaults
 * 2. If setup done, call /api/auth/login
 * 3. Store JWT in localStorage
 *
 * Platform mode (VITE_IS_PLATFORM=true) bypasses JWT entirely.
 * The backend auto-authenticates the first user.
 */
export async function bootstrapAuth(): Promise<string> {
  // Check for existing valid token first
  const existing = getToken();
  if (existing) return existing;

  // Check backend mode
  const status = await fetch('/api/auth/status').then(r => r.json());

  if (status.needsSetup) {
    // Auto-register with defaults (single-user dev tool)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    });
    const data = await res.json();
    setToken(data.token);
    return data.token;
  }

  // Attempt login -- may need fallback UI if credentials unknown
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' }),
  });

  if (!res.ok) {
    throw new Error('Auto-auth failed -- manual login required');
  }

  const data = await res.json();
  setToken(data.token);
  return data.token;
}
```

### Pattern 2: WebSocket Client Singleton
**What:** Class-based WS client with reconnection state machine.
**When to use:** The single app-wide WebSocket connection.

```typescript
// src/lib/websocket-client.ts

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private state: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly maxReconnectDelay = 30_000;

  // Callback injection -- set once during app init
  private onMessage: ((msg: ServerMessage) => void) | null = null;
  private onStateChange: ((state: ConnectionState) => void) | null = null;

  // Content stream subscribers (Phase 6 hooks subscribe here)
  private contentListeners: Set<(token: string) => void> = new Set();

  connect(token: string): void { /* ... */ }
  disconnect(): void { /* ... */ }
  send(msg: ClientMessage): boolean { /* return false if not connected */ }

  // Content stream subscription for Phase 6
  subscribeContent(listener: (token: string) => void): () => void {
    this.contentListeners.add(listener);
    return () => this.contentListeners.delete(listener);
  }

  private scheduleReconnect(): void {
    const delay = Math.min(
      1000 * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );
    this.reconnectTimer = setTimeout(() => this.reconnect(), delay);
  }
}

export const wsClient = new WebSocketClient();
```

### Pattern 3: Stream Multiplexer (Pure Functions)
**What:** Routes parsed messages to appropriate store actions via callbacks.
**When to use:** Called by WebSocketClient.onMessage for every incoming `claude-response`.

```typescript
// src/lib/stream-multiplexer.ts

export interface MultiplexerCallbacks {
  onContentToken: (text: string) => void;
  onThinkingBlock: (id: string, text: string, isComplete: boolean) => void;
  onToolUseStart: (toolCall: ToolCallState) => void;
  onToolResult: (toolCallId: string, output: string, isError: boolean) => void;
  onActivityText: (text: string) => void;
  onStreamStart: () => void;
  onStreamEnd: (exitCode: number) => void;
}

export function routeClaudeResponse(
  data: SDKMessageData,
  sessionId: string | null,
  callbacks: MultiplexerCallbacks,
): void {
  // data.type === 'assistant' => parse content blocks
  // data.type === 'result' => stream complete
  // data.type === 'system' => init/status
  // etc.
}
```

### Pattern 4: Discriminated Union for Server Messages
**What:** TypeScript union type covering every message the backend sends over WS.
**When to use:** All incoming WS message handling.

```typescript
// src/types/websocket.ts

export type ServerMessage =
  | { type: 'claude-response'; data: ClaudeSDKData; sessionId: string | null }
  | { type: 'claude-complete'; sessionId: string; exitCode: number; isNewSession: boolean }
  | { type: 'claude-error'; error: string; sessionId: string | null }
  | { type: 'claude-permission-request'; requestId: string; toolName: string; input: unknown; sessionId: string | null }
  | { type: 'claude-permission-cancelled'; requestId: string; reason: 'timeout' | 'cancelled'; sessionId: string | null }
  | { type: 'session-created'; sessionId: string }
  | { type: 'session-aborted'; sessionId: string; provider: string; success: boolean }
  | { type: 'session-status'; sessionId: string; provider: string; isProcessing: boolean }
  | { type: 'active-sessions'; sessions: { claude: string[]; codex: string[]; gemini: string[] } }
  | { type: 'token-budget'; data: { used: number; total: number }; sessionId: string | null }
  | { type: 'projects_updated'; projects: unknown[]; timestamp: string; changeType: string; changedFile: string; watchProvider: string }
  | { type: 'loading_progress'; [key: string]: unknown }
  | { type: 'error'; error: string }
  // M4 provider stubs (log-only in M1)
  | { type: 'codex-response'; data: unknown; sessionId: string | null }
  | { type: 'codex-complete'; sessionId: string }
  | { type: 'codex-error'; error: string; sessionId: string | null }
  | { type: 'gemini-response'; data: unknown; sessionId: string | null }
  | { type: 'gemini-complete'; sessionId: string }
  | { type: 'gemini-error'; error: string; sessionId: string | null };
```

### Anti-Patterns to Avoid
- **React Context for WS state:** Constitution 4.4 bans Context for mutable state. The WS client is a plain singleton, not wrapped in a Provider.
- **useEffect for WS lifecycle:** Don't open/close WebSocket in a component's useEffect. The WS client is initialized at app startup, outside React.
- **State updates per token:** Never call `setState` on every incoming text token. Content tokens go to a subscribable event stream, not Zustand.
- **Importing stores inside multiplexer:** The multiplexer receives callbacks, never imports store modules. This keeps it testable.
- **Switch statement without exhaustive check:** Every `ServerMessage.type` branch must be covered. Use the `never` exhaustive check pattern.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT decode/verify | JWT validation logic | Trust backend -- just store/retrieve opaque token string | Frontend never validates JWT; backend does that in `verifyClient` |
| WebSocket protocol framing | Custom binary protocol | JSON.stringify/JSON.parse over native WebSocket | Backend already sends JSON via `WebSocketWriter.send()` |
| Content block type definitions | Guess at SDK shapes | Copy from `@anthropic-ai/claude-agent-sdk/sdk.d.ts` | Source of truth for `BetaMessage.content` block shapes |
| Reconnection backoff math | Complex jitter algorithms | Simple `min(1000 * 2^attempts, 30000)` | CONTEXT.md specifies 1s/2s/4s/8s/max 30s. No jitter needed for single-client. |

**Key insight:** The backend is the source of truth for message shapes. Don't invent client types from scratch -- derive them from what `server/claude-sdk.js` actually sends via `writer.send()`.

## Common Pitfalls

### Pitfall 1: Misunderstanding the SDK Message Nesting
**What goes wrong:** The `claude-response` message has `data` which is the SDK message. For `type: 'assistant'`, `data.message` is a `BetaMessage` whose `content` is an array of `ContentBlock`s. Three levels deep: `msg.data.message.content[i]`.
**Why it happens:** Easy to confuse `data` (SDK wrapper) with `data.message` (Anthropic API message) with `data.message.content` (the actual blocks).
**How to avoid:** Define explicit type aliases for each level. The multiplexer receives `ClaudeSDKData` (the `data` field), not the outer envelope.
**Warning signs:** Tool calls not being detected, thinking blocks missing.

### Pitfall 2: Missing `parent_tool_use_id` → `parentToolUseId` Transform
**What goes wrong:** The backend's `transformMessage()` maps `parent_tool_use_id` to `parentToolUseId` on the SDK message. But the content blocks inside `message.content` still use `tool_use_id` (the Anthropic API field name, not SDK).
**Why it happens:** Transform applies to the envelope, not recursively to nested content.
**How to avoid:** Be aware of both naming conventions. SDK messages use snake_case (`parent_tool_use_id`). The backend normalizes the top-level field to camelCase. Content block fields remain in their original Anthropic API format.
**Warning signs:** Subagent tool calls not grouped correctly.

### Pitfall 3: Reconnection Clobbering Active Streams
**What goes wrong:** If WebSocket drops mid-stream and reconnects, the new connection might receive a `claude-complete` for the old stream while also receiving events for a new one.
**Why it happens:** Backend tracks sessions by WS connection. A new WS connection is a new session scope.
**How to avoid:** On reconnect, send `get-active-sessions` to re-sync. Track the `sessionId` from each message. Don't assume continuity across reconnections.
**Warning signs:** Duplicated messages, ghost "streaming" indicators.

### Pitfall 4: Platform Mode Auth Bypass
**What goes wrong:** In platform mode (`VITE_IS_PLATFORM=true`), the backend auto-authenticates. Sending a JWT is unnecessary and could fail if no token exists.
**Why it happens:** The WS `verifyClient` has a platform mode branch that ignores the token entirely.
**How to avoid:** Check `/api/auth/status` first. If backend is in platform mode, connect without token query param (or with empty token -- backend ignores it). The `bootstrapAuth` function should handle both modes.
**Warning signs:** WS connection rejected in platform mode when no user registered.

### Pitfall 5: Content Blocks with type 'thinking' vs 'text'
**What goes wrong:** Claude SDK's `BetaMessage.content` array can contain blocks of type `'text'`, `'tool_use'`, and `'thinking'`. The `thinking` blocks have a different structure than text blocks.
**Why it happens:** Thinking blocks have `{ type: 'thinking', thinking: string }` whereas text blocks have `{ type: 'text', text: string }`.
**How to avoid:** Use the discriminated union on `block.type` within the content array. Handle all three block types explicitly.
**Warning signs:** Thinking content shows up as empty text, or text content treated as thinking.

### Pitfall 6: The `result` Message Contains ModelUsage, Not Content
**What goes wrong:** Treating `type: 'result'` SDK messages as content-bearing. They contain `modelUsage` and `total_cost_usd` but no displayable text.
**Why it happens:** The backend already extracts `tokenBudget` from result messages and sends a separate `token-budget` WS message. But the `claude-response` wrapping the `result` still arrives first.
**How to avoid:** In the multiplexer, check `data.type === 'result'` and route to completion/usage tracking, not content rendering.
**Warning signs:** Empty messages appended to chat, NaN token counts.

## Code Examples

### Backend Message Flow (Verified from server/claude-sdk.js)

```typescript
// What the backend actually sends (lines 600-605 of claude-sdk.js):
// For EVERY SDK message:
ws.send({
  type: 'claude-response',
  data: transformMessage(message), // SDK message with parentToolUseId normalized
  sessionId: capturedSessionId || sessionId || null,
});

// For 'result' type messages, ALSO sends (lines 608-618):
ws.send({
  type: 'token-budget',
  data: { used: totalTokens, total: contextWindow },
  sessionId: capturedSessionId || sessionId || null,
});

// On completion (lines 631-636):
ws.send({
  type: 'claude-complete',
  sessionId: capturedSessionId,
  exitCode: 0,
  isNewSession: !sessionId && !!command,
});

// On error (lines 651-655):
ws.send({
  type: 'claude-error',
  error: error.message,
  sessionId: capturedSessionId || sessionId || null,
});
```

### SDK Message Types in claude-response.data (Verified from sdk.d.ts)

```typescript
// The data field in claude-response can be any SDKMessage type.
// The ones we care about for M1:

// 1. Assistant message (contains content blocks)
type SDKAssistantMessage = {
  type: 'assistant';
  message: BetaMessage; // { content: ContentBlock[], usage: Usage, ... }
  parent_tool_use_id: string | null;
  parentToolUseId?: string; // Added by backend transform
  session_id: string;
};

// BetaMessage.content is an array of:
// - { type: 'text', text: string }
// - { type: 'tool_use', id: string, name: string, input: Record<string, unknown> }
// - { type: 'thinking', thinking: string }

// 2. Result message (stream complete)
type SDKResultMessage = {
  type: 'result';
  subtype: 'success' | 'error_during_execution' | 'error_max_turns' | ...;
  modelUsage: Record<string, ModelUsage>;
  total_cost_usd: number;
  session_id: string;
};

// 3. System init message (first message on new session)
type SDKSystemMessage = {
  type: 'system';
  subtype: 'init';
  tools: string[];
  cwd: string;
  session_id: string;
};

// 4. Tool progress (long-running tool updates)
type SDKToolProgressMessage = {
  type: 'tool_progress';
  tool_use_id: string;
  tool_name: string;
  elapsed_time_seconds: number;
  session_id: string;
};

// 5. User message replay (on session resume)
type SDKUserMessage = {
  type: 'user';
  message: MessageParam;
  session_id: string;
};
```

### Client-to-Server Messages (Verified from server/index.js handleChatConnection)

```typescript
// What the frontend sends:
export type ClientMessage =
  | { type: 'claude-command'; command: string; options: ClaudeCommandOptions }
  | { type: 'codex-command'; command: string; options: CodexCommandOptions }
  | { type: 'gemini-command'; command: string; options: GeminiCommandOptions }
  | { type: 'abort-session'; sessionId: string; provider?: ProviderId }
  | { type: 'claude-permission-response'; requestId: string; allow: boolean; updatedInput?: unknown; message?: string; rememberEntry?: string }
  | { type: 'check-session-status'; sessionId: string; provider?: ProviderId }
  | { type: 'get-active-sessions' };

interface ClaudeCommandOptions {
  projectPath?: string;
  sessionId?: string;
  cwd?: string;
  model?: string; // 'sonnet' | 'opus' | 'haiku' | 'opusplan' | 'sonnet[1m]'
  permissionMode?: string;
  toolsSettings?: {
    allowedTools: string[];
    disallowedTools: string[];
    skipPermissions: boolean;
  };
  images?: Array<{ data: string }>;
}
```

### Permission Auto-Allow Logic

```typescript
// Per CONTEXT.md decision:
// Read-only tools: auto-allow silently
// Write/execute tools: auto-allow with console.warn
const READ_ONLY_TOOLS = new Set(['Read', 'Glob', 'Grep', 'WebSearch', 'WebFetch']);

function handlePermissionRequest(msg: PermissionRequestMessage): void {
  const isReadOnly = READ_ONLY_TOOLS.has(msg.toolName);

  if (!isReadOnly) {
    console.warn(
      `[Loom] Auto-allowing write/execute tool: ${msg.toolName}`,
      msg.input
    );
  }

  wsClient.send({
    type: 'claude-permission-response',
    requestId: msg.requestId,
    allow: true,
  });
}
```

### Multiplexer Content Block Routing

```typescript
// Core routing logic for SDKAssistantMessage content blocks:
function routeAssistantMessage(
  data: { type: 'assistant'; message: { content: ContentBlock[] }; parentToolUseId?: string | null },
  callbacks: MultiplexerCallbacks,
): void {
  for (const block of data.message.content) {
    switch (block.type) {
      case 'text':
        callbacks.onContentToken(block.text);
        break;
      case 'tool_use':
        callbacks.onToolUseStart({
          id: block.id,
          toolName: block.name,
          status: 'invoked',
          input: block.input as Record<string, unknown>,
          output: null,
          isError: false,
          startedAt: new Date().toISOString(),
          completedAt: null,
        });
        // Generate activity text from tool name
        callbacks.onActivityText(getToolActivityText(block.name, block.input));
        break;
      case 'thinking':
        callbacks.onThinkingBlock(
          crypto.randomUUID(), // thinking blocks don't have stable IDs
          block.thinking,
          true, // complete when received in non-streaming mode
        );
        break;
      default: {
        // Exhaustive check
        const _exhaustive: never = block;
        console.warn('[Multiplexer] Unknown content block type:', _exhaustive);
      }
    }
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| SSE streaming | WebSocket streaming | Backend already migrated | Frontend must use WS, not SSE |
| Claude CLI child process | Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`) | Backend migration complete | SDK messages have typed structure, not raw CLI output |
| Single message type | SDKMessage union (18+ subtypes) | SDK v0.1.57+ | Must handle assistant, result, system, tool_progress, etc. |
| No thinking blocks | Thinking/extended thinking in content array | Claude model feature | Content blocks include `type: 'thinking'` alongside `type: 'text'` |

**Backend already handles:**
- WebSocket authentication (JWT query param or Authorization header)
- Platform mode bypass (auto-authenticates first user)
- SDK message transformation (parent_tool_use_id -> parentToolUseId)
- Token budget extraction from result messages
- Session lifecycle (created, aborted, status)
- Multi-provider routing (claude/codex/gemini commands)

## Open Questions

1. **BetaMessage content block types -- is 'thinking' the correct type string?**
   - What we know: The Anthropic API includes thinking blocks in the content array. The SDK type `BetaMessage` extends the API message type.
   - What's unclear: The exact string used for the `type` discriminant on thinking blocks. Could be `'thinking'` or `'server_tool_use'` depending on the model feature.
   - Recommendation: During implementation, send a test prompt with thinking enabled and log the raw `data.message.content` array to confirm the exact shape. The multiplexer should handle unknown block types gracefully (log + skip).

2. **Content stream subscription mechanism**
   - What we know: Phase 6 needs to subscribe to content tokens from the WS client singleton.
   - What's unclear: Whether to use EventTarget (native browser API), a custom Set-based listener pattern, or a third-party EventEmitter.
   - Recommendation: Use a simple `Set<(token: string) => void>` pattern (as shown in the WS client pattern above). It's the lightest option, requires no dependencies, and is trivially testable. If Phase 6 needs more sophistication (backpressure, buffering), upgrade then.

3. **Infinite retry vs max attempts**
   - What we know: CONTEXT.md says Claude's discretion.
   - Recommendation: Infinite retry with 30s max delay. For a single-user dev tool, the user knows when the server is down. A "reconnecting" status dot is sufficient -- no need to give up and force a page reload.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x + jsdom |
| Config file | `src/vite.config.ts` (test block) |
| Quick run command | `cd /home/swd/loom/src && npx vitest run --reporter=verbose` |
| Full suite command | `cd /home/swd/loom/src && npx vitest run --coverage` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| STRM-01 | WS client connects, reconnects, updates connection store | unit | `cd /home/swd/loom/src && npx vitest run src/lib/websocket-client.test.ts -x` | No -- Wave 0 |
| STRM-01 | ServerMessage discriminated union parses all types | unit | `cd /home/swd/loom/src && npx vitest run src/types/websocket.test.ts -x` | No -- Wave 0 |
| STRM-01 | Auth module acquires JWT | unit | `cd /home/swd/loom/src && npx vitest run src/lib/auth.test.ts -x` | No -- Wave 0 |
| STRM-02 | Multiplexer routes content/thinking/tool blocks | unit | `cd /home/swd/loom/src && npx vitest run src/lib/stream-multiplexer.test.ts -x` | No -- Wave 0 |
| STRM-02 | Multiplexer handles unknown block types gracefully | unit | (same file) | No -- Wave 0 |
| STRM-02 | Permission auto-allow sends correct response | unit | (multiplexer or ws-client test) | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `cd /home/swd/loom/src && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd /home/swd/loom/src && npx vitest run --coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/auth.test.ts` -- covers auth bootstrapping, token storage
- [ ] `src/lib/websocket-client.test.ts` -- covers connection state machine, reconnection, message dispatch
- [ ] `src/lib/stream-multiplexer.test.ts` -- covers content/thinking/tool routing, unknown types, edge cases
- [ ] `src/types/websocket.test.ts` -- covers type guard functions, exhaustive type coverage

## Sources

### Primary (HIGH confidence)
- `server/index.js` (lines 882-1038) -- WebSocket handler, message routing, `handleChatConnection()`
- `server/claude-sdk.js` (full file) -- SDK query, message transformation, token budget extraction
- `@anthropic-ai/claude-agent-sdk/sdk.d.ts` -- SDKMessage union type, SDKAssistantMessage, SDKResultMessage, ModelUsage types
- `src/src/stores/connection.ts` -- Existing ConnectionStore actions (ready for WS lifecycle)
- `src/src/stores/stream.ts` -- Existing StreamStore actions (ready for multiplexer output)
- `src/src/types/` -- Existing type definitions (provider.ts, stream.ts, message.ts, session.ts)
- `.planning/BACKEND_API_CONTRACT.md` -- Full WS protocol documentation
- `src/vite.config.ts` -- Proxy config confirms `/ws` and `/shell` proxy to `ws://localhost:5555`

### Secondary (MEDIUM confidence)
- `.planning/V2_CONSTITUTION.md` -- Coding conventions, banned patterns, architecture rules
- `.planning/MILESTONES.md` -- Cross-milestone store schemas, architectural principles

### Tertiary (LOW confidence)
- Exact `BetaMessage.content` block type discriminants for thinking -- needs runtime verification

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all existing infrastructure verified
- Architecture: HIGH -- CONTEXT.md locks all major decisions, backend protocol fully audited
- Pitfalls: HIGH -- derived from direct code audit of `server/claude-sdk.js` and SDK types
- SDK content block types: MEDIUM -- `BetaMessage` type imported from `@anthropic-ai/sdk` which is a transitive dependency; exact thinking block shape should be verified at runtime

**Research date:** 2026-03-06
**Valid until:** 2026-04-06 (stable -- backend protocol unlikely to change during M1)
