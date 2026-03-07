# Phase 8: Navigation + Session Management - Research

**Researched:** 2026-03-06
**Domain:** React Router navigation, session list UI, message loading, real-time sidebar updates, chat content area
**Confidence:** HIGH

## Summary

Phase 8 wraps the entire M1 vertical pipeline (design tokens -> stores -> WebSocket -> streaming -> tool registry) into a usable application. The work divides cleanly into two domains: (1) sidebar with session list, date grouping, new chat flow, and context menu, and (2) chat content area with message display, composer, session switching with AbortController-guarded fetches, and URL sync. All infrastructure exists -- the job is composing existing pieces into a cohesive UI.

The backend API contract is well-understood: `GET /api/projects` returns a project list, `GET /api/projects/:name/sessions?limit=999` returns `{ sessions, total, hasMore }` where each session has `{ id, summary, messageCount, lastActivity, cwd }`, and `GET /api/projects/:name/sessions/:id/messages` returns `{ messages }` where each message is a raw JSONL entry with `{ type, message, sessionId, timestamp, uuid, parentUuid }`. The frontend must transform these backend shapes into the internal `Session` and `Message` types defined in the type system. This transformation layer is the only non-trivial "new code" -- everything else composes existing components.

**Primary recommendation:** Split into two plans. Plan 1 builds the sidebar (SessionList, SessionItem, DateGroupHeader, NewChatButton, context menu, shimmer skeleton, API fetching, WebSocket-driven refresh). Plan 2 builds the ChatView (message display, composer, session switching hook with AbortController, message loading skeletons, URL sync via React Router). Both plans share a `MessageContainer` CSS wrapper to prevent scroll jitter at the streaming/historical message boundary.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Session item design:** 2-line compact rows. Line 1: session title (truncated). Line 2: relative timestamp + small provider logo. Active: 3px left border in `--accent-primary`. Hover: `color-mix(in oklch, var(--text-muted) 5%, var(--surface-raised))`. SVG provider logos only (no emoji). Right-click context menu with Rename/Delete
- **Date grouping:** "Today", "Yesterday", "Previous 7 Days", "Older". Sticky headers via `position: sticky` + `z-[var(--z-sticky)]`. Empty groups hidden
- **New Chat behavior:** Click -> `timeline.setActiveSession(null)` -> `navigate('/chat')` -> empty state with composer. No backend session creation until first message. Button: full-width ghost, accent text, `+` icon, always visible above scroll area
- **Sidebar empty state:** Centered "No conversations yet" + prominent New Chat button
- **Chat content area:** Basic composer (text input + send button), Enter to send, stop button during streaming, reuse ActiveMessage + useStreamBuffer + ToolChip from Phase 7
- **Message rendering:** Historical: plain text (`white-space: pre-wrap`), no markdown (M2). Tool calls from history: collapsed ToolChip. User messages: right-aligned bubble with `--accent-primary-muted`. Assistant: left-aligned, full-width, no bubble. CRITICAL: unified MessageContainer for streaming + historical (scroll jitter prevention). Loading: shimmer skeleton matching real message spacing tokens (CLS prevention)
- **Session list fetching:** Load all on mount (`?limit=999`). Auto-refresh via WebSocket events. Project: first/most-recent from `GET /api/projects`
- **Session switching:** Abort-and-switch pattern. Memory caching (no re-fetch on switch back). `useSessionSwitch` hook with AbortController for race condition protection
- **Architect mandates:** Split sidebar into SessionList/SessionItem/DateGroupHeader subcomponents. SVG provider logos. Unified CSS container. AbortController on fetches. Skeleton spacing tokens must match real message tokens

### Claude's Discretion
- Shimmer skeleton CSS animation details
- Context menu component (custom vs native right-click)
- Exact SVG paths for provider logos
- Relative time formatting thresholds
- API error handling strategy
- Whether `loadMessages` goes in timeline store or stays in hook
- Composer-to-WebSocket wiring approach
- Skeleton shimmer count/widths/spacing

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| NAV-01 | Sidebar with session list, date grouping, provider icons, New Chat button, `role="complementary"`, `aria-label="Chat sessions"`, `--surface-raised` background | Existing Sidebar.tsx provides the shell (header, ARIA, background). Backend API shape for sessions documented. Date grouping algorithm defined. Constitution 2.4 mandates subcomponent split |
| NAV-02 | Clicking session: updates activeSessionId, fetches messages, shows loading skeleton, displays messages, updates URL to `/chat/:sessionId` | React Router v7 useNavigate/useParams confirmed. Backend message API shape documented. useSessionSwitch hook pattern with AbortController defined. Shimmer skeleton tokens identified |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.x | UI framework | Already installed |
| react-router-dom | 7.13.1 | Client-side routing, useNavigate, useParams | Already installed, v6 API preserved |
| Zustand | 5.x (with immer) | State management (timeline, stream, ui, connection stores) | Already configured with 4 stores |
| Tailwind CSS | 4.x (via @tailwindcss/vite) | Utility-first styling | Already configured |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clsx + tailwind-merge (cn()) | Installed | Conditional className composition | All class composition in components |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom context menu | Browser native right-click | Custom gives styled consistency with design tokens; native is zero code. Recommend custom for visual quality bar |
| date-fns for relative time | Intl.RelativeTimeFormat | Intl is zero-dependency but more verbose. For "2m ago" formatting, a ~15-line utility function is sufficient -- no library needed |

**Installation:**
No new packages needed. Everything is already in the dependency tree.

## Architecture Patterns

### Recommended Component Structure
```
src/src/components/
  sidebar/
    Sidebar.tsx              # Shell (existing, expands to include session list)
    SessionList.tsx           # Scrollable session list with date groups
    SessionItem.tsx           # Individual session row (2-line compact)
    DateGroupHeader.tsx       # Sticky "Today" / "Yesterday" label
    NewChatButton.tsx         # Ghost button with + icon
    SessionContextMenu.tsx    # Right-click rename/delete menu
    SessionListSkeleton.tsx   # Shimmer loading state
    ProviderLogo.tsx          # SVG logos for claude/codex/gemini
    sidebar.css               # Sidebar-specific CSS (shimmer, context menu)
    Sidebar.test.tsx          # Updated tests
    SessionList.test.tsx      # New tests
    SessionItem.test.tsx      # New tests
  chat/
    view/
      ChatView.tsx            # Main chat content area (replaces ChatPlaceholder)
      MessageContainer.tsx    # Shared CSS wrapper for streaming + historical messages
      AssistantMessage.tsx    # Historical assistant message display
      UserMessage.tsx         # User message bubble (right-aligned)
      MessageList.tsx         # Renders message array with MessageContainer wrapping
      MessageListSkeleton.tsx # Shimmer skeleton for message loading
      ChatEmptyState.tsx      # "Loom" wordmark + subtitle
      ChatView.test.tsx       # New tests
    composer/
      ChatComposer.tsx        # Text input + send/stop button
      ChatComposer.test.tsx   # New tests
src/src/hooks/
    useSessionSwitch.ts       # Session switching coordinator with AbortController
    useSessionList.ts         # Session list fetching + WebSocket refresh
    useProjectContext.ts      # Project detection on mount
    useSessionSwitch.test.ts  # New tests
    useSessionList.test.ts    # New tests
src/src/lib/
    api-client.ts             # Thin fetch wrapper with auth headers
    formatTime.ts             # Relative time formatting utility
    transformMessages.ts      # Backend message shape -> internal Message type
    api-client.test.ts        # New tests
    formatTime.test.ts        # New tests
    transformMessages.test.ts # New tests
```

### Pattern 1: API Client with Auth Headers
**What:** Thin wrapper around fetch that injects JWT token and handles common error cases.
**When to use:** All REST API calls (sessions, messages, projects, delete, rename).
**Example:**
```typescript
// Source: Derived from existing auth.ts pattern
import { getToken } from '@/lib/auth';

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  signal?: AbortSignal,
): Promise<T> {
  const token = getToken();
  const res = await fetch(path, {
    ...options,
    signal,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}
```

### Pattern 2: Session Switch with AbortController
**What:** Coordinate stream abort, store reset, message fetch (with race protection), and URL update.
**When to use:** Every session click in the sidebar.
**Example:**
```typescript
// Source: CONTEXT.md session switching decision + AbortController mandate
export function useSessionSwitch() {
  const abortRef = useRef<AbortController | null>(null);
  const navigate = useNavigate();

  const switchSession = useCallback(async (
    projectName: string,
    sessionId: string,
  ) => {
    // 1. Cancel any pending fetch
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    // 2. If streaming, abort current stream
    const { isStreaming } = useStreamStore.getState();
    if (isStreaming) {
      const activeSessionId = useStreamStore.getState().activeSessionId;
      if (activeSessionId) {
        wsClient.send({ type: 'abort-session', sessionId: activeSessionId, provider: 'claude' });
      }
      useStreamStore.getState().reset();
    }

    // 3. Check memory cache
    const cached = useTimelineStore.getState().sessions.find(s => s.id === sessionId);
    if (cached && cached.messages.length > 0) {
      useTimelineStore.getState().setActiveSession(sessionId);
      navigate(`/chat/${sessionId}`);
      return;
    }

    // 4. Set active + navigate (shows loading skeleton)
    useTimelineStore.getState().setActiveSession(sessionId);
    navigate(`/chat/${sessionId}`);

    // 5. Fetch messages with abort signal
    try {
      const data = await apiFetch<{ messages: BackendMessage[] }>(
        `/api/projects/${projectName}/sessions/${sessionId}/messages`,
        {},
        abortRef.current.signal,
      );
      // Transform and store
      const messages = transformBackendMessages(data.messages);
      // ... add to timeline store
    } catch (err) {
      if ((err as Error).name === 'AbortError') return; // Expected on rapid switch
      // Handle real errors
    }
  }, [navigate]);

  return { switchSession };
}
```

### Pattern 3: Date Group Categorization
**What:** Pure function categorizing sessions into "Today", "Yesterday", "Previous 7 Days", "Older".
**When to use:** SessionList derives grouped data from flat sessions array.
**Example:**
```typescript
export type DateGroup = 'Today' | 'Yesterday' | 'Previous 7 Days' | 'Older';

export function groupSessionsByDate(
  sessions: Session[],
): Map<DateGroup, Session[]> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);
  const weekStart = new Date(todayStart.getTime() - 7 * 86400000);

  const groups = new Map<DateGroup, Session[]>([
    ['Today', []],
    ['Yesterday', []],
    ['Previous 7 Days', []],
    ['Older', []],
  ]);

  for (const session of sessions) {
    const date = new Date(session.updatedAt);
    if (date >= todayStart) groups.get('Today')!.push(session);
    else if (date >= yesterdayStart) groups.get('Yesterday')!.push(session);
    else if (date >= weekStart) groups.get('Previous 7 Days')!.push(session);
    else groups.get('Older')!.push(session);
  }

  return groups;
}
```

### Pattern 4: Backend Message Transformation
**What:** Transform raw JSONL entries from the backend into internal `Message` types.
**When to use:** After fetching messages from `GET /api/projects/:name/sessions/:id/messages`.
**Critical context:** The backend returns raw JSONL entries, NOT the frontend `Message` type. Each entry has `{ type, message: { role, content }, sessionId, timestamp, uuid, parentUuid, toolUseResult, ... }`. The content field may be a string or an array of content blocks `[{ type: 'text', text: '...' }, { type: 'tool_use', id, name, input }]`.
```typescript
interface BackendEntry {
  type: string;
  message?: {
    role: 'user' | 'assistant';
    content: string | ContentBlock[];
  };
  sessionId: string;
  timestamp?: string;
  uuid?: string;
  parentUuid?: string | null;
  toolUseResult?: { agentId?: string };
  subagentTools?: unknown[];
}

export function transformBackendMessages(entries: BackendEntry[]): Message[] {
  const messages: Message[] = [];
  for (const entry of entries) {
    if (!entry.message?.role) continue;
    // Extract text content
    let content = '';
    const toolCalls: ToolCall[] = [];
    if (typeof entry.message.content === 'string') {
      content = entry.message.content;
    } else if (Array.isArray(entry.message.content)) {
      for (const block of entry.message.content) {
        if (block.type === 'text') content += block.text;
        else if (block.type === 'tool_use') {
          toolCalls.push({
            id: block.id,
            toolName: block.name,
            input: block.input,
            output: null, // Resolved later from tool_result entries
            isError: false,
            parentToolUseId: null,
          });
        }
      }
    }
    messages.push({
      id: entry.uuid ?? crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 10),
      role: entry.message.role,
      content,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      metadata: {
        timestamp: entry.timestamp ?? new Date().toISOString(),
        tokenCount: null,
        cost: null,
        duration: null,
      },
      providerContext: {
        providerId: 'claude',
        modelId: '',
        agentName: null,
      },
    });
  }
  return messages;
}
```

### Pattern 5: WebSocket-Driven Sidebar Refresh
**What:** Listen for `session-created` and `projects_updated` WebSocket events to update the sidebar without polling.
**When to use:** In `websocket-init.ts` callbacks, wired to timeline store actions.
**Example:**
```typescript
// In websocket-init.ts callbacks:
onSessionCreated: (sid) => {
  streamStore().setActiveSessionId(sid);
  // Phase 8: also create or update session in timeline
  const sessions = useTimelineStore.getState().sessions;
  if (!sessions.some(s => s.id === sid)) {
    useTimelineStore.getState().addSession({
      id: sid,
      title: 'New Chat',
      messages: [],
      providerId: 'claude',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null },
    });
  }
},
```

### Anti-Patterns to Avoid
- **Subscribing to entire sessions array in SessionItem:** Each SessionItem should receive session data as props, not subscribe to the store. Only SessionList subscribes to `sessions`.
- **Polling for session list updates:** Use WebSocket events (`session-created`, `projects_updated`), not `setInterval`.
- **Fetching messages without AbortController:** Rapid session switching without abort causes the "wrong session data" race condition.
- **Different CSS for streaming vs historical messages:** The unified `MessageContainer` component prevents CLS jitter at the finalization boundary.
- **Creating backend session on "New Chat" click:** Per CONTEXT.md, no backend call until the user sends their first message.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Scroll anchoring | Custom scroll logic | Existing `useScrollAnchor.ts` hook | Already battle-tested in ProofOfLife |
| Token streaming | Custom WebSocket parsing | Existing `wsClient` + `useStreamBuffer` + `ActiveMessage` pipeline | Phase 5-7 built this entire stack |
| Tool display | Custom tool renderers | Existing `ToolChip` + `ToolCard` + `tool-registry.ts` | Phase 7 registry handles all tool types |
| Thinking blocks | Custom collapsible | Existing `ThinkingDisclosure` | Already styled with design tokens |
| Auth header injection | Manual token passing | Build thin `apiFetch` wrapper around existing `getToken()` from `auth.ts` | Centralizes auth logic, DRY |
| Date formatting | date-fns or moment | ~15-line `formatRelativeTime` utility using `Date` arithmetic | Only need "2m ago", "1h ago", "Yesterday" -- no library overhead |
| CSS class composition | String concatenation | Existing `cn()` utility | ESLint rule enforces this |

**Key insight:** This phase is primarily a composition exercise. Almost every subsystem already exists. The new code is glue: data fetching, transformation, and wiring existing components into a sidebar + chat layout.

## Common Pitfalls

### Pitfall 1: Backend Session Shape Mismatch
**What goes wrong:** The backend `getSessions()` returns `{ id, summary, messageCount, lastActivity, cwd, lastUserMessage, lastAssistantMessage }`, but the frontend `Session` type expects `{ id, title, messages, providerId, createdAt, updatedAt, metadata }`. Directly assigning causes type errors or silent data loss.
**Why it happens:** The backend reads JSONL files and builds its own session shape. The frontend has a different type system.
**How to avoid:** Create a `transformBackendSession()` function that maps `summary -> title`, `lastActivity -> updatedAt`, defaults `providerId` to `'claude'`, and sets `messages: []` (messages are loaded separately).
**Warning signs:** TypeScript errors on assignment, `undefined` session titles in sidebar.

### Pitfall 2: Backend Message Content Block Format
**What goes wrong:** Backend messages have `message.content` that can be a string OR an array of `{ type: 'text', text }` / `{ type: 'tool_use', id, name, input }` blocks. Treating it as always-string causes tool calls to be invisible; treating it as always-array causes crashes on simple text messages.
**Why it happens:** Claude SDK produces content block arrays, but the backend doesn't normalize them.
**How to avoid:** Check `typeof entry.message.content === 'string'` before processing. Handle both paths in `transformBackendMessages()`.
**Warning signs:** "object Object" in message display, missing tool call chips in history.

### Pitfall 3: Stale Fetch Results on Rapid Session Switching
**What goes wrong:** User clicks session A, then session B before A's fetch completes. When A's fetch resolves, it overwrites session B's messages.
**Why it happens:** Without AbortController, the fetch callback runs with stale context.
**How to avoid:** `useSessionSwitch` creates a new AbortController on each switch, aborting the previous one. Catch `AbortError` silently.
**Warning signs:** Messages from wrong session appearing, flickering content on rapid clicks.

### Pitfall 4: CLS (Cumulative Layout Shift) at Streaming/Historical Boundary
**What goes wrong:** When ActiveMessage finalizes and the historical AssistantMessage replaces it, different padding/margins cause a visible jump.
**Why it happens:** Different CSS on the streaming component vs the static component.
**How to avoid:** Both must use the same `MessageContainer` wrapper with identical `--space-*` tokens for padding, line-height, and margin. Test by streaming a message and watching the finalization transition.
**Warning signs:** Content "jumping" when streaming ends, scroll position changing unexpectedly.

### Pitfall 5: crypto.randomUUID() on HTTP
**What goes wrong:** `crypto.randomUUID()` throws on non-HTTPS origins in some browsers.
**Why it happens:** Dev server runs on HTTP (port 5184).
**How to avoid:** Use `Math.random().toString(36).slice(2, 10)` for all client-generated IDs (already established pattern in Phase 7).
**Warning signs:** Errors in dev console about "secure context required".

### Pitfall 6: Zustand Selector Reference Stability with Arrays
**What goes wrong:** `useTimelineStore(s => s.sessions.find(...))` returns a new object reference on every store update, causing infinite re-renders.
**Why it happens:** Zustand v5 uses `useSyncExternalStore` which compares by reference.
**How to avoid:** Use `EMPTY_MESSAGES` constant pattern from ProofOfLife. For session list, subscribe at the SessionList level and pass props down to SessionItem (don't subscribe per-item to the store).
**Warning signs:** React DevTools showing constant re-renders, browser freezing.

### Pitfall 7: Session List Default Limit
**What goes wrong:** `GET /api/projects/:name/sessions` defaults to `limit=5`. UI only shows 5 sessions.
**Why it happens:** Backend default is 5, not all.
**How to avoid:** Explicitly pass `?limit=999` (per CONTEXT.md decision for M1 -- load all, no pagination).
**Warning signs:** "I know I have more sessions but the sidebar only shows 5."

## Code Examples

### Relative Time Formatting
```typescript
// Source: Custom utility for M1 sidebar (Claude's discretion area)
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
```

### Provider Logo SVG Components
```typescript
// Source: Claude's discretion -- minimal recognizable SVG logos
// Claude: Rounded shape, Codex: Angular/square, Gemini: Sparkle
export function ClaudeLogo({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      {/* Simplified Claude icon -- the recognizable "C" or sunburst mark */}
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M8 12a4 4 0 0 1 8 0" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
```

### Shimmer Skeleton CSS
```css
/* Source: Claude's discretion -- shimmer animation for loading states */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    var(--surface-raised) 25%,
    var(--surface-overlay) 50%,
    var(--surface-raised) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--space-1);
}
```

### Custom Context Menu
```typescript
// Source: Claude's discretion -- custom for visual consistency
// Uses native right-click event, custom positioned overlay
export function SessionContextMenu({
  isOpen,
  position,
  onRename,
  onDelete,
  onClose,
}: SessionContextMenuProps) {
  if (!isOpen) return null;
  return (
    <div
      className={cn(
        'fixed bg-surface-overlay border border-border rounded-md py-1',
        'z-[var(--z-dropdown)] min-w-[140px]',
      )}
      style={{ top: position.y, left: position.x }}
    >
      <button onClick={onRename} className="context-menu-item">Rename</button>
      <button onClick={onDelete} className="context-menu-item text-status-error">Delete</button>
    </div>
  );
}
```

### Message Container (Shared Wrapper)
```typescript
// Source: CONTEXT.md critical mandate -- unified CSS for streaming + historical
export function MessageContainer({
  children,
  role,
}: {
  children: React.ReactNode;
  role: 'user' | 'assistant';
}) {
  return (
    <div
      className={cn(
        'px-4 py-3', // --space-4 horizontal, --space-3 vertical
        'leading-relaxed text-[var(--text-body)]',
        role === 'user' && 'flex justify-end',
      )}
    >
      {role === 'user' ? (
        <div className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2',
          'bg-accent-primary-muted text-foreground',
        )}>
          {children}
        </div>
      ) : (
        <div className="w-full">{children}</div>
      )}
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| React Router v5 class-based | React Router v7 (v6 API) with hooks | v7 stable 2025 | useNavigate/useParams/Outlet all available |
| Zustand v4 | Zustand v5 with useSyncExternalStore | 2025 | Selector reference stability critical (EMPTY_MESSAGES pattern) |
| Tailwind v3 config.js | Tailwind v4 @theme inline | 2025 | Design tokens in CSS, not JS config |

**Deprecated/outdated:**
- `useHistory()` from React Router v5: replaced by `useNavigate()` in v6+
- `crypto.randomUUID()` on HTTP: use Math.random() fallback on dev servers

## Open Questions

1. **Backend session `providerId` field**
   - What we know: Backend sessions don't have an explicit `providerId` field. The session comes from the Claude projects directory.
   - What's unclear: When Codex/Gemini sessions are shown (M4), how will provider be determined?
   - Recommendation: Default to `'claude'` for M1. The backend project structure implies provider (`.claude/projects/` vs `.codex/sessions/`).

2. **Tool call result pairing in historical messages**
   - What we know: Backend JSONL stores tool_use and tool_result as separate entries. The frontend `ToolCall` type expects `output` on the same object.
   - What's unclear: Whether the backend message transform should pair them or if we display tool_use entries only.
   - Recommendation: For M1, display tool calls as collapsed ToolChips with the tool name and input only. Full input/output pairing is M2 complexity (CHAT-02 tool card 4-state machine). Extract tool_use blocks from assistant message content, render as ToolChip with `status: 'resolved'`.

3. **Session title update from backend summary**
   - What we know: Backend builds `summary` from last user message or explicit summary entries. When streaming completes, `claude-complete` fires but no summary update is pushed.
   - What's unclear: Whether to re-fetch session list after each streaming completion to get updated titles.
   - Recommendation: On `claude-complete`, update the local session title to the first user message content (truncated). This matches what the backend does. Full re-fetch on `projects_updated` WebSocket event handles the rest.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x + React Testing Library 16.x |
| Config file | `src/vite.config.ts` (test section) |
| Quick run command | `cd /home/swd/loom/src && npx vitest run --reporter=verbose` |
| Full suite command | `cd /home/swd/loom/src && npm run test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NAV-01 | Sidebar renders sessions grouped by date | unit | `cd /home/swd/loom/src && npx vitest run src/components/sidebar/SessionList.test.tsx -x` | Wave 0 |
| NAV-01 | Session item shows title, time, provider icon | unit | `cd /home/swd/loom/src && npx vitest run src/components/sidebar/SessionItem.test.tsx -x` | Wave 0 |
| NAV-01 | New Chat button navigates to /chat | unit | `cd /home/swd/loom/src && npx vitest run src/components/sidebar/Sidebar.test.tsx -x` | Exists (needs update) |
| NAV-01 | Sidebar has role="complementary" aria-label="Chat sessions" | unit | `cd /home/swd/loom/src && npx vitest run src/components/sidebar/Sidebar.test.tsx -x` | Exists (needs update) |
| NAV-02 | Session switch fetches messages and updates URL | unit | `cd /home/swd/loom/src && npx vitest run src/hooks/useSessionSwitch.test.ts -x` | Wave 0 |
| NAV-02 | Message loading shows skeleton state | unit | `cd /home/swd/loom/src && npx vitest run src/components/chat/view/ChatView.test.tsx -x` | Wave 0 |
| NAV-02 | AbortController cancels pending fetch on rapid switch | unit | `cd /home/swd/loom/src && npx vitest run src/hooks/useSessionSwitch.test.ts -x` | Wave 0 |
| NAV-02 | Backend messages transformed to internal type | unit | `cd /home/swd/loom/src && npx vitest run src/lib/transformMessages.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd /home/swd/loom/src && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd /home/swd/loom/src && npm run test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/src/components/sidebar/SessionList.test.tsx` -- covers NAV-01 (date grouping, session rendering)
- [ ] `src/src/components/sidebar/SessionItem.test.tsx` -- covers NAV-01 (item display, click behavior)
- [ ] `src/src/hooks/useSessionSwitch.test.ts` -- covers NAV-02 (fetch, abort, URL update)
- [ ] `src/src/hooks/useSessionList.test.ts` -- covers NAV-01 (fetch, WebSocket refresh)
- [ ] `src/src/components/chat/view/ChatView.test.tsx` -- covers NAV-02 (message display, skeleton, composer)
- [ ] `src/src/lib/transformMessages.test.ts` -- covers NAV-02 (backend -> frontend type mapping)
- [ ] `src/src/lib/formatTime.test.ts` -- covers NAV-01 (relative time formatting)
- [ ] `src/src/lib/api-client.test.ts` -- covers both (auth header injection, error handling)

## Sources

### Primary (HIGH confidence)
- Project codebase: `src/src/stores/timeline.ts`, `src/src/stores/stream.ts`, `src/src/stores/ui.ts` -- current store interfaces and actions
- Project codebase: `src/src/lib/websocket-client.ts`, `src/src/lib/websocket-init.ts`, `src/src/lib/stream-multiplexer.ts` -- existing WebSocket pipeline
- Project codebase: `src/src/components/dev/ProofOfLife.tsx` -- proven end-to-end streaming pattern
- Project codebase: `src/src/components/chat/view/ActiveMessage.tsx` -- multi-span streaming component
- Project codebase: `src/src/hooks/useStreamBuffer.ts`, `src/src/hooks/useScrollAnchor.ts` -- reusable hooks
- Project codebase: `server/projects.js` lines 591-717, 930-1028 -- exact backend session/message response shapes
- Project codebase: `server/index.js` lines 486-544 -- session/message REST endpoints
- Project codebase: `.planning/BACKEND_API_CONTRACT.md` -- full API documentation
- Project codebase: `.planning/V2_CONSTITUTION.md` -- coding conventions and banned patterns
- Project codebase: `src/src/types/message.ts`, `src/src/types/session.ts`, `src/src/types/websocket.ts` -- TypeScript type contracts
- React Router v7 (npm `react-router-dom@7.13.1`) -- confirmed useNavigate, useParams, Outlet exports available
- Zustand v5 (already installed) -- confirmed useSyncExternalStore semantics require stable selector references

### Secondary (MEDIUM confidence)
- CONTEXT.md decisions: All implementation decisions verified against existing codebase patterns

### Tertiary (LOW confidence)
- None -- all findings verified against existing codebase source code

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all dependencies already installed and verified
- Architecture: HIGH -- patterns derived from existing codebase (ProofOfLife, ActiveMessage, stores)
- Backend API shapes: HIGH -- read directly from `server/projects.js` source code
- Pitfalls: HIGH -- derived from actual codebase patterns and Phase 7 lessons learned
- Message transformation: MEDIUM -- backend JSONL format has edge cases not fully enumerated (content block variants, tool_result pairing)

**Research date:** 2026-03-06
**Valid until:** 2026-04-06 (stable -- all dependencies locked, backend API stable)
