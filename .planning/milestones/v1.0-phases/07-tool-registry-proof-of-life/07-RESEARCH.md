# Phase 7: Tool Registry + Proof of Life - Research

**Researched:** 2026-03-06
**Domain:** React component architecture, WebSocket integration, streaming UI composition
**Confidence:** HIGH

## Summary

Phase 7 builds two interconnected deliverables: (1) a pluggable tool-call registry that maps tool names to display configs, and (2) a proof-of-life page that wires the entire M1 streaming pipeline end-to-end -- WebSocket connection, rAF token buffer, thinking block display, tool chip rendering, scroll anchoring, and connection status. This phase is the vertical slice proving every subsystem from Phases 1-6 works together as a real application.

The tool registry is architecturally simple -- a plain Map with a fallback default config. The real complexity is in two areas: (a) refactoring ActiveMessage from a single-span design to support interleaved text spans and tool chips during live streaming, and (b) composing the proof-of-life page so it exercises every store, hook, and WebSocket pathway simultaneously.

**Primary recommendation:** Split into three plans: (1) Tool registry + ToolChip component, (2) ActiveMessage refactor for multi-span interleaving + ThinkingDisclosure, (3) Proof-of-life page wiring everything together.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Tool chip visuals:** Compact single-line pill -- `--surface-raised` bg, `--border-subtle` border, 6px radius, 4px 10px padding. Status dot (colored circle) using shared state colors: invoked (dusty rose, pulse), executing (amber, pulse), resolved (green, static), rejected (red, static). Content: dot + tool name + key input field (truncated) + status icon.
- **Chip content per tool:** Bash=truncated command (~40 chars), Read/Write/Edit=relative file path (left-truncated), Glob/Grep=pattern, Unknown=raw tool name.
- **Expand behavior:** Click to toggle inline expand (pushes content below, no popover). Expanded view: key input + truncated output. Shared layout for all tools in M1. Error output in `--status-error` color.
- **Placement:** Inline with streamed text at chronological position.
- **Interleaving strategy:** Sibling rendering with real-time text span splitting. ActiveMessage subscribes to `useStreamStore(s => s.activeToolCalls)`. New tool call "closes" current text span, renders ToolChip, creates new text span ref. rAF loop writes to latest text span.
- **Race condition mitigation:** rAF loop buffers tokens internally when target ref is null during React commit. Tokens flush on next frame when ref available. No `flushSync`.
- **Registry architecture:** File `src/src/lib/tool-registry.ts`. API: `registerTool(toolName, config)`, `getToolConfig(toolName)`. ToolConfig fields: `displayName`, `icon` (React.ComponentType), `getChipLabel(input)`, `stateColors` (optional override), `renderCard` (React component for expanded view).
- **Registered tools (M1):** Bash, Read, Edit, Write, Glob, Grep with smart `getChipLabel`. Default fallback: `⚙️` icon, raw tool name, raw JSON chip label.
- **Icons (M1):** Unicode/emoji only: `▶` Bash, `📄` Read, `✏️` Edit, `📝` Write, `🔍` Glob, `🔎` Grep, `⚙️` default.
- **Thinking block display:** Collapsible disclosure above response text. During active thinking: expanded with pulsing "Thinking..." label, text in `--text-muted`, reads from `useStreamStore(s => s.thinkingState)`. After thinking completes: auto-collapse, show "Thinking (N blocks)" with disclosure triangle.
- **Thinking surface:** `color-mix(in oklch, var(--text-muted) 5%, transparent)` bg, 8px radius. NOT dusty rose. Inter at 14px, `--text-muted` color.
- **Proof-of-life page:** Route `/dev/proof-of-life`, standalone dev route outside AppShell. Full viewport height. Connection status dot at top. Scrollable conversation area. Input field + Send/Stop at bottom.
- **Prompt input:** Editable text input with default "Write a haiku about coding". Enter submits.
- **Send/Stop:** Send disabled during streaming. Stop sends `abort-session`. Partial response preserved on abort.
- **Conversation history:** Previous responses stay visible, appending. Proves timeline store accumulation + scroll anchor.
- **User messages:** Distinct message bubbles in conversation flow.
- **Tool calls:** Rendered inline using real tool registry.
- **Connection status:** Single dot at top -- green (connected), yellow pulse (reconnecting), red (disconnected). Text label showing connection target.
- **Error display:** `claude-error` messages render inline with `--status-error` tint and `⚠` icon.

### Claude's Discretion
- Exact ToolChip and ToolCard component structure and props
- How useStreamBuffer is refactored to support multi-span text splitting (the ref-switching mechanism)
- Thinking disclosure implementation (details element, custom state, etc.)
- Proof-of-life page styling details and spacing
- User message bubble styling (right-aligned, color treatment)
- How `getChipLabel` truncates paths (exact character limits, ellipsis placement)
- Whether to use existing ActiveMessage or create a new StreamingConversation wrapper
- Test strategy for the registry and proof-of-life components
- CSS animation details for pulsing dots and thinking label

### Deferred Ideas (OUT OF SCOPE)
- Per-tool custom expanded cards (Bash terminal, Read line numbers, Edit diff viewer) -- M2 CHAT-02
- Tool call grouping/accordion (3+ consecutive) -- M3 POLISH-04
- SVG/Lucide icons replacing Unicode emoji -- M2/M3 polish
- Tool call state machine animations with spring physics -- M2 CHAT-02
- Per-tool custom state colors -- M3
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| COMP-01 | Pluggable Tool-Call Component Registry: `registerTool()`, `getToolConfig()`, default fallback, 6 registered tools with placeholder renderers | Registry is a pure TypeScript module (Map + default). `getToolActivityText()` in stream-multiplexer.ts provides reusable input extraction logic for `getChipLabel`. |
| STRM-04 | Proof-of-life page: WebSocket connection, hardcoded prompt, streaming render via rAF buffer, thinking blocks in separate section, connection status | All subsystems exist (wsClient, multiplexer, stores, useStreamBuffer, ActiveMessage, useScrollAnchor). Page composes them into a working chat demo. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.0 | Component rendering | Already installed, project standard |
| Zustand | 5.0.11 | State management (stream, connection, timeline stores) | Already installed, 4 stores in place |
| TypeScript | strict mode | Type safety | Already configured with strict + noUncheckedIndexedAccess |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clsx + tailwind-merge | 2.1.1 / 3.5.0 | `cn()` utility | All className composition |
| react-router-dom | 7.13.1 | Routing for `/dev/proof-of-life` | Route registration in App.tsx |

### No New Dependencies
Phase 7 requires zero new packages. Everything is built from existing infrastructure:
- Tool registry: plain TypeScript Map
- ToolChip: React component with CSS
- ThinkingDisclosure: HTML details/summary or custom state + CSS grid-template-rows animation
- Proof-of-life page: composes existing hooks and components

## Architecture Patterns

### Recommended Project Structure
```
src/src/
├── lib/
│   └── tool-registry.ts          # Registry module (COMP-01)
│   └── tool-registry.test.ts     # Registry tests
├── components/
│   └── chat/
│       ├── tools/
│       │   ├── ToolChip.tsx       # Compact inline chip
│       │   ├── ToolChip.test.tsx
│       │   ├── ToolCard.tsx       # Expanded inline view
│       │   ├── ToolCard.test.tsx
│       │   └── tool-chip.css      # Chip + status dot styles
│       ├── view/
│       │   ├── ActiveMessage.tsx   # Refactored for multi-span
│       │   ├── ThinkingDisclosure.tsx  # Collapsible thinking block
│       │   └── ThinkingDisclosure.test.tsx
│       └── styles/
│           └── thinking-disclosure.css
│   └── dev/
│       └── ProofOfLife.tsx        # Full proof-of-life page
└── hooks/
    └── useStreamBuffer.ts         # Extended for ref-switching
```

### Pattern 1: Tool Registry (Pure Module, No React)

**What:** A singleton Map-based registry that maps tool names to display configurations. Pure TypeScript -- no React, no stores.

**When to use:** Any component that needs to display a tool call reads from the registry.

```typescript
// src/src/lib/tool-registry.ts
import type { ComponentType } from 'react';

export interface ToolConfig {
  displayName: string;
  icon: ComponentType;
  getChipLabel: (input: Record<string, unknown>) => string;
  stateColors?: Partial<Record<ToolCallStatus, string>>;
  renderCard: ComponentType<ToolCardProps>;
}

const registry = new Map<string, ToolConfig>();

const DEFAULT_CONFIG: ToolConfig = {
  displayName: 'Unknown Tool',
  icon: () => <span>⚙️</span>,  // Default icon
  getChipLabel: (input) => JSON.stringify(input).slice(0, 40),
  renderCard: DefaultToolCard,
};

export function registerTool(toolName: string, config: ToolConfig): void {
  registry.set(toolName, config);
}

export function getToolConfig(toolName: string): ToolConfig {
  return registry.get(toolName) ?? {
    ...DEFAULT_CONFIG,
    displayName: toolName,
  };
}
```

**Key design decisions:**
- The icon field is `ComponentType` (functional component returning JSX). M1 uses inline spans with emoji. M2 swaps for SVG components. No API change needed.
- `getChipLabel` receives the raw `input` object (same shape as `ToolCallState.input`). It extracts the human-readable key field per tool.
- `stateColors` is optional -- defaults come from shared CSS variables. Per-tool overrides are typed but unused in M1.
- `renderCard` receives a `ToolCardProps` (toolCall state + expanded state). M1 uses a shared generic card for all tools.

### Pattern 2: Multi-Span Streaming (ActiveMessage Refactor)

**What:** ActiveMessage goes from a single `<span ref={textRef}>` to an array of segments -- text spans interleaved with ToolChip components. The rAF loop always writes to the latest text span.

**When to use:** During live streaming when tool calls arrive mid-response.

**Architecture:**

```
ActiveMessage
├── ThinkingDisclosure (reads thinkingState from store)
├── Segment[] (dynamically growing array)
│   ├── TextSpan (ref for rAF text painting)
│   ├── ToolChip (tool call #1)
│   ├── TextSpan (ref for rAF text painting)
│   ├── ToolChip (tool call #2)
│   └── TextSpan (current target for rAF)
└── StreamingCursor
```

**Ref-switching mechanism:**
1. ActiveMessage maintains a `segments` state array. Each segment is either `{ type: 'text', id: string }` or `{ type: 'tool', toolCall: ToolCallState }`.
2. A `currentTextRef` (useRef) always points to the latest text span DOM node.
3. When `activeToolCalls` length increases (new tool call detected), the component:
   - Sets `currentTextRef.current = null` (signal to buffer that target is switching)
   - Appends `{ type: 'tool', toolCall }` and `{ type: 'text', id: newId }` to segments
   - The new TextSpan's ref callback sets `currentTextRef.current` to the new DOM node
4. The rAF buffer continues accumulating tokens in its string ref. When `currentTextRef.current` is null, tokens buffer harmlessly. On next rAF frame when the ref is available, the accumulated text paints to the new span.

**Important: The rAF buffer change is minimal.** `useStreamBuffer` already writes to `textNodeRef.current`. The only change is that `textNodeRef` now points to a mutable ref that gets updated when segments change, rather than being a static ref to a single span.

### Pattern 3: Thinking Disclosure (CSS Grid Animation)

**What:** Collapsible section for thinking blocks, using CSS grid-template-rows for smooth expand/collapse.

**Implementation recommendation:** Custom state + CSS animation rather than HTML `<details>` element. Reason: `<details>` doesn't support CSS transitions on its content area natively. CSS grid-template-rows `0fr/1fr` transition (already established in Phase 3 AppShell) gives smooth animation.

```tsx
// ThinkingDisclosure.tsx
export function ThinkingDisclosure({ thinkingState }: Props) {
  const [isExpanded, setIsExpanded] = useState(thinkingState.isThinking);

  // Auto-collapse when thinking completes
  useEffect(() => {
    if (!thinkingState.isThinking) setIsExpanded(false);
  }, [thinkingState.isThinking]);

  return (
    <div className="thinking-disclosure">
      <button onClick={() => setIsExpanded(!isExpanded)}>
        {thinkingState.isThinking
          ? <span className="thinking-pulse">Thinking...</span>
          : `Thinking (${thinkingState.blocks.length} blocks)`}
        <span className="disclosure-triangle" data-expanded={isExpanded} />
      </button>
      <div className="thinking-content" style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}>
        <div className="overflow-hidden">
          {thinkingState.blocks.map(block => (
            <p key={block.id}>{block.text}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### Pattern 4: Proof-of-Life Page Composition

**What:** A standalone page at `/dev/proof-of-life` that composes all M1 subsystems into a working chat demo.

**Architecture:**

```
ProofOfLife (page component, fixed inset-0 like TokenPreview)
├── ConnectionStatus (reads connection store)
├── ConversationArea (scrollable, uses useScrollAnchor)
│   ├── UserMessage[] (from timeline store)
│   ├── AssistantMessage[] (finalized, from timeline store)
│   ├── ActiveMessage (when streaming, refactored version)
│   │   ├── ThinkingDisclosure
│   │   ├── TextSpan + ToolChip segments
│   │   └── StreamingCursor
│   ├── ErrorMessage[] (from stream errors)
│   ├── ScrollToBottomPill
│   └── Sentinel (for scroll anchor)
└── InputArea (fixed at bottom)
    ├── TextInput (default: "Write a haiku about coding")
    └── Send/Stop Button
```

**Data flow:**
1. User types prompt, clicks Send or presses Enter
2. Page creates a user Message, adds to timeline store via `addMessage`
3. Page sends `claude-command` via `wsClient.send()`
4. WebSocket init module (already configured) receives response, routes through multiplexer
5. Content tokens flow through `wsClient.emitContent()` to `useStreamBuffer`
6. Tool calls populate `useStreamStore.activeToolCalls`
7. Thinking blocks populate `useStreamStore.thinkingState`
8. ActiveMessage renders all of this in real-time
9. On `claude-complete`, `useStreamBuffer.onFlush` fires, adding finalized message to timeline
10. Conversation history grows -- previous messages stay visible

**Initialization concern:** The proof-of-life page needs `initializeWebSocket()` called. Currently this is NOT called anywhere automatically -- it needs to be called on page mount. The page should call it in a useEffect, guarding against double-init.

### Anti-Patterns to Avoid
- **React state for tool call insertion tracking:** Do NOT use `useState` for the segment array updates during streaming. Use `useRef` + manual DOM append for the text spans, and only use `useState` for the segment structure (which updates infrequently -- only on tool call boundaries).
- **flushSync for ref-switching:** The CONTEXT.md explicitly bans this. Let the rAF buffer handle the ~16ms gap naturally.
- **Direct DOM manipulation outside the rAF loop:** Only the rAF paint function touches textContent. Everything else goes through React.
- **Subscribing to entire activeToolCalls array:** Subscribe to `activeToolCalls.length` or use a derived selector to detect new insertions, not the full array.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tool input extraction | Custom parsing per tool | Reuse `getToolActivityText()` logic from stream-multiplexer.ts | Already handles all 6 tools + fallback. Share the switch-case. |
| Scroll anchoring | Custom scroll listener | `useScrollAnchor` hook (Phase 6) | Already handles sentinel, IntersectionObserver, anti-oscillation, rAF auto-scroll |
| Connection state | Custom WebSocket status tracking | `useConnectionStore` selectors | Already wired to wsClient state changes |
| Stream lifecycle | Custom stream start/end detection | `useStreamStore(s => s.isStreaming)` | Already set by websocket-init.ts |
| Auth bootstrapping | Manual token management | `initializeWebSocket()` from websocket-init.ts | Handles auth + WS connect + store wiring |
| Expand/collapse animation | JavaScript height animation | CSS `grid-template-rows: 0fr/1fr` transition | Already established pattern in Phase 3 AppShell |

**Key insight:** Phase 7's proof-of-life page is primarily a composition task -- wiring existing subsystems together. The only genuinely new code is the tool registry module, the ToolChip/ToolCard components, and the ActiveMessage multi-span refactor.

## Common Pitfalls

### Pitfall 1: Ref Null During Span Switch
**What goes wrong:** When a new tool call arrives and the segment array updates, React re-renders to add the new text span. During this re-render, `currentTextRef.current` is null for one frame. If the rAF buffer tries to paint during this window, it writes to null and tokens are lost.
**Why it happens:** React's commit phase is asynchronous relative to the rAF loop.
**How to avoid:** The rAF buffer already handles this -- it accumulates tokens in its string ref (`bufferRef.current += token`) regardless of whether the DOM node ref is available. The paint function only writes `node.textContent = bufferRef.current` when `node` is non-null. This is exactly the existing useStreamBuffer behavior -- tokens buffer until the ref is available, then the full accumulated text paints on the next frame.
**Warning signs:** Text visually "jumps" or appears to duplicate after a tool chip. This means the buffer isn't being shared across span switches -- each new span needs to start with only new tokens, not replay the full buffer.

**Critical detail:** The buffer ref must be reset when switching spans. The new text span should start empty, and only tokens received after the switch should paint to it. This means `useStreamBuffer` needs a way to "checkpoint" -- save the current position and only paint new content to the new span.

### Pitfall 2: Double-Initialization of WebSocket
**What goes wrong:** The proof-of-life page calls `initializeWebSocket()` on mount. If the user navigates away and back, or if React strict mode double-mounts, it could connect twice.
**Why it happens:** `initializeWebSocket()` bootstraps auth and calls `wsClient.connect()`. Multiple connect calls create multiple WebSocket instances.
**How to avoid:** Add a guard in `initializeWebSocket()` -- check `wsClient.getState() !== 'disconnected'` before connecting. Or add an `isInitialized` flag to the module scope.
**Warning signs:** Console shows multiple "WebSocket connected" messages, messages arrive twice.

### Pitfall 3: ActiveMessage Re-render Storm During Tool Insertion
**What goes wrong:** Subscribing to `useStreamStore(s => s.activeToolCalls)` causes a re-render every time any tool call's status updates (invoked -> executing -> resolved), not just when new tool calls are added.
**Why it happens:** Zustand's shallow comparison fails because the array reference changes on every `updateToolCall`.
**How to avoid:** Use a derived selector that only triggers on length changes: `useStreamStore(s => s.activeToolCalls.length)`. For rendering existing tool calls, subscribe separately or pass tool call data as props from the segment array.
**Warning signs:** React DevTools shows ActiveMessage re-rendering on every tool_progress event.

### Pitfall 4: Scroll Anchor Fighting with Tool Chip Insertion
**What goes wrong:** When a tool chip inserts mid-stream, the scroll container's height increases abruptly. The IntersectionObserver may briefly see the sentinel as "not intersecting" and disengage auto-scroll.
**Why it happens:** Tool chip insertion is a layout-changing DOM mutation that happens outside the rAF auto-scroll cycle.
**How to avoid:** The anti-oscillation guard (`isAutoScrollingRef`) already handles this -- it prevents the observer's "not intersecting" callback from disengaging during programmatic scroll. The tool chip insertion happens during a React render, which is followed by the next rAF frame's `scrollIntoView`. The guard bridges this gap.
**Warning signs:** Scroll jumps or stops auto-scrolling when tool calls appear during streaming.

### Pitfall 5: useStreamBuffer Buffer Split on Span Switch
**What goes wrong:** When switching to a new text span, the buffer contains all accumulated text from the start of the stream. If this full text is painted to the new span, it duplicates content.
**Why it happens:** `bufferRef.current` is append-only and never clears during a stream.
**How to avoid:** Two approaches:
  1. **Per-span buffers:** Each text span gets its own buffer ref. When the span switches, a new buffer starts accumulating from empty. The rAF paint function always paints the current span's buffer.
  2. **Offset tracking:** Keep a single buffer but track a "last painted offset" per span. The new span starts painting from the offset at switch time.

Approach 1 is simpler and more aligned with the existing useStreamBuffer design. The hook should accept a mutable ref that the parent can swap, rather than managing the span lifecycle internally. Or better: the parent (ActiveMessage) owns the buffer string and delegates painting to individual span refs.

**Recommendation:** Refactor so ActiveMessage owns a single growing content buffer (string ref), while each text span is responsible for painting its slice. The span's ref callback starts painting from the offset at creation time.

### Pitfall 6: Stream Store Cleared Before ActiveMessage Finalizes
**What goes wrong:** `endStream()` calls `set({ ...INITIAL_STREAM_STATE })` which clears `activeToolCalls` and `thinkingState`. If ActiveMessage reads these during finalization to build the final message, the data is gone.
**Why it happens:** `useStreamBuffer.onFlush` fires on the `isStreaming: true -> false` transition, but `endStream()` already cleared the store by that point.
**How to avoid:** The finalized message must capture tool calls and thinking blocks BEFORE `endStream()` clears them. Options:
  1. Have ActiveMessage snapshot tool calls and thinking state when they arrive (via refs), not on flush.
  2. Change the flush to happen before the store reset (sequence: flush callback -> then clear store).
  3. Accept that M1 proof-of-life doesn't persist tool calls/thinking in finalized messages (just the text). Tool calls are visible during streaming but lost on finalization. This is acceptable for M1 since the proof-of-life is a demo, and proper message persistence with tool calls comes in M2.

**Recommendation:** Option 3 for M1. The proof-of-life page is a demo that proves the pipeline works. Finalized messages in the timeline store contain text only. Tool calls and thinking blocks are visible in real-time during streaming. Full message persistence is M2 scope.

## Code Examples

### Tool Registry Module
```typescript
// src/src/lib/tool-registry.ts
import type { ToolCallStatus } from '@/types/stream';
import type { ComponentType } from 'react';

export interface ToolCardProps {
  toolName: string;
  input: Record<string, unknown>;
  output: string | null;
  isError: boolean;
  status: ToolCallStatus;
}

export interface ToolConfig {
  displayName: string;
  icon: ComponentType;
  getChipLabel: (input: Record<string, unknown>) => string;
  stateColors?: Partial<Record<ToolCallStatus, string>>;
  renderCard: ComponentType<ToolCardProps>;
}

const registry = new Map<string, ToolConfig>();

// Reuse extraction logic from stream-multiplexer.ts getToolActivityText
function truncatePath(path: string, maxLen = 40): string {
  if (path.length <= maxLen) return path;
  return '...' + path.slice(-(maxLen - 3));
}

function truncateCommand(cmd: string, maxLen = 40): string {
  if (cmd.length <= maxLen) return cmd;
  return cmd.slice(0, maxLen - 3) + '...';
}

// Default chip label: raw JSON snippet
function defaultChipLabel(input: Record<string, unknown>): string {
  const json = JSON.stringify(input);
  return json.length > 40 ? json.slice(0, 37) + '...' : json;
}

export function registerTool(toolName: string, config: ToolConfig): void {
  registry.set(toolName, config);
}

export function getToolConfig(toolName: string): ToolConfig {
  const config = registry.get(toolName);
  if (config) return config;

  // Default fallback -- never crashes
  return {
    displayName: toolName,
    icon: DefaultIcon,
    getChipLabel: defaultChipLabel,
    renderCard: DefaultToolCard,
  };
}

export function getRegisteredToolNames(): string[] {
  return [...registry.keys()];
}
```

### ToolChip Component (Inline Pill)
```typescript
// src/src/components/chat/tools/ToolChip.tsx
import { memo, useState } from 'react';
import { getToolConfig } from '@/lib/tool-registry';
import { cn } from '@/utils/cn';
import type { ToolCallState } from '@/types/stream';

export interface ToolChipProps {
  toolCall: ToolCallState;
}

export const ToolChip = memo(function ToolChip({ toolCall }: ToolChipProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = getToolConfig(toolCall.toolName);
  const chipLabel = config.getChipLabel(toolCall.input);
  const Icon = config.icon;

  return (
    <div className="tool-chip-container">
      <button
        type="button"
        className={cn('tool-chip', `tool-chip--${toolCall.status}`)}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <span className={cn('tool-chip-dot', `tool-chip-dot--${toolCall.status}`)} />
        <Icon />
        <span className="tool-chip-name">{config.displayName}</span>
        <span className="tool-chip-label">{chipLabel}</span>
      </button>
      {isExpanded && (
        <config.renderCard
          toolName={toolCall.toolName}
          input={toolCall.input}
          output={toolCall.output}
          isError={toolCall.isError}
          status={toolCall.status}
        />
      )}
    </div>
  );
});
```

### Connection Status Dot
```typescript
// Used in proof-of-life page header
const status = useConnectionStore(s => s.providers.claude.status);

// CSS classes:
// connected: bg-[var(--status-success)] (green, static)
// reconnecting: bg-[var(--status-warning)] (yellow, pulse animation)
// disconnected: bg-[var(--status-error)] (red, static)
// connecting: bg-[var(--status-warning)] (yellow, pulse animation)
```

### Sending a Prompt
```typescript
// Proof-of-life page send handler
function handleSend(prompt: string) {
  // 1. Add user message to timeline
  const userMessage: Message = {
    id: crypto.randomUUID(),
    role: 'user',
    content: prompt,
    metadata: { timestamp: new Date().toISOString(), tokenCount: null, cost: null, duration: null },
    providerContext: { providerId: 'claude', modelId: '', agentName: null },
  };
  addMessage(sessionId, userMessage);

  // 2. Send to backend via WebSocket
  wsClient.send({
    type: 'claude-command',
    command: prompt,
    options: {
      projectPath: '/home/swd/loom',
      sessionId: sessionId,
    },
  });
}
```

### Abort Handler
```typescript
function handleStop() {
  wsClient.send({
    type: 'abort-session',
    sessionId: sessionId,
    provider: 'claude',
  });
  // Partial response is preserved -- useStreamBuffer doesn't clear on abort
  // The session-aborted message will arrive via WebSocket
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single text span in ActiveMessage | Multi-span with tool chip interleaving | Phase 7 | ActiveMessage refactored from simple single-span to segment array |
| No tool display in streaming | Inline ToolChip rendering during stream | Phase 7 | New component category (chat/tools/) |
| No proof-of-life | Full end-to-end streaming demo | Phase 7 | Validates entire M1 pipeline |

**What exists vs what's new:**
- EXISTS: WebSocket client, multiplexer, all 4 stores, useStreamBuffer, ActiveMessage (single-span), useScrollAnchor, ScrollToBottomPill, auth, route structure, CSS tokens, error boundaries
- NEW: tool-registry.ts, ToolChip, ToolCard, ThinkingDisclosure, ActiveMessage refactor (multi-span), ProofOfLife page
- MODIFIED: ActiveMessage (multi-span), useStreamBuffer (ref-switching support), App.tsx (new route), websocket-init.ts (double-init guard)

## Open Questions

1. **useStreamBuffer refactor scope**
   - What we know: The hook needs to support a mutable text node ref that can switch mid-stream. The rAF buffer must handle null refs gracefully.
   - What's unclear: Whether to modify useStreamBuffer itself or create a new hook (useMultiSpanStreamBuffer) that wraps it. Modifying the existing hook risks breaking the existing tests.
   - Recommendation: Create a thin wrapper. The core buffer logic (token accumulation, rAF paint, flush detection) stays in useStreamBuffer. A new hook or ActiveMessage logic manages the ref-switching.

2. **Session ID for proof-of-life**
   - What we know: `wsClient.send({ type: 'claude-command', ... })` needs a `sessionId` in options. The backend creates a session on first command.
   - What's unclear: Whether to generate a UUID client-side and pass it, or let the backend assign one via `session-created` message.
   - Recommendation: Let the backend assign it. Listen for `session-created` in websocket-init.ts and use that session ID. For the timeline store, create a stub session with a temporary ID, then update when backend responds. Or simpler: use a fixed string like `'proof-of-life'` for M1 demo purposes.

3. **Tool result delivery timing**
   - What we know: Tool results come as separate `claude-response` messages with `type: 'assistant'` containing `tool_use` blocks. Tool results come via `onToolResult` callback.
   - What's unclear: The exact timing of when tool_result arrives relative to subsequent text tokens. Does text resume immediately after tool_result, or is there a gap?
   - Recommendation: The segment array approach handles this naturally -- a new text span is created after the tool chip, and whenever text tokens arrive, they paint to the latest span regardless of timing.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x + React Testing Library 16.x |
| Config file | `src/vite.config.ts` (vitest config inline) |
| Quick run command | `cd /home/swd/loom/src && npx vitest run --reporter=verbose` |
| Full suite command | `cd /home/swd/loom/src && npx vitest run --coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COMP-01 | `getToolConfig('Bash')` returns registered config | unit | `cd /home/swd/loom/src && npx vitest run src/lib/tool-registry.test.ts -x` | Wave 0 |
| COMP-01 | `getToolConfig('UnknownTool')` returns default, no crash | unit | `cd /home/swd/loom/src && npx vitest run src/lib/tool-registry.test.ts -x` | Wave 0 |
| COMP-01 | ToolChip renders with correct label and icon | unit | `cd /home/swd/loom/src && npx vitest run src/components/chat/tools/ToolChip.test.tsx -x` | Wave 0 |
| STRM-04 | ThinkingDisclosure renders and collapses | unit | `cd /home/swd/loom/src && npx vitest run src/components/chat/view/ThinkingDisclosure.test.tsx -x` | Wave 0 |
| STRM-04 | ProofOfLife page renders without crash | smoke | `cd /home/swd/loom/src && npx vitest run src/components/dev/ProofOfLife.test.tsx -x` | Wave 0 |
| STRM-04 | End-to-end streaming renders in browser | manual-only | Navigate to `/dev/proof-of-life`, send prompt, observe streaming | N/A |

### Sampling Rate
- **Per task commit:** `cd /home/swd/loom/src && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd /home/swd/loom/src && npx vitest run --coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/src/lib/tool-registry.test.ts` -- covers COMP-01 (registry API, all 6 tools, default fallback)
- [ ] `src/src/components/chat/tools/ToolChip.test.tsx` -- covers COMP-01 (chip rendering, status dot, expand)
- [ ] `src/src/components/chat/view/ThinkingDisclosure.test.tsx` -- covers STRM-04 (disclosure toggle, auto-collapse)
- [ ] `src/src/components/dev/ProofOfLife.test.tsx` -- covers STRM-04 (smoke: page renders, connection dot visible)

## Sources

### Primary (HIGH confidence)
- Existing codebase: All source files read directly from `/home/swd/loom/src/src/`
- CONTEXT.md: User decisions and locked architectural choices
- REQUIREMENTS.md: COMP-01 and STRM-04 requirement definitions
- V2_CONSTITUTION.md: Coding conventions, banned patterns, component structure

### Secondary (MEDIUM confidence)
- stream-multiplexer.ts `getToolActivityText()`: Verified input extraction logic reusable for chip labels
- websocket-init.ts: Verified all store wiring and stream lifecycle management
- ActiveMessage.tsx: Verified current single-span architecture that needs refactoring

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero new deps, all existing infrastructure
- Architecture: HIGH -- registry pattern is trivial, multi-span refactor is the only non-obvious piece, well-analyzed in CONTEXT.md
- Pitfalls: HIGH -- all identified from direct code reading of existing hooks/stores, especially the buffer split and store clearing issues
- Proof-of-life composition: HIGH -- all subsystems exist and are tested individually

**Research date:** 2026-03-06
**Valid until:** 2026-04-06 (stable -- no external dependency changes expected)
