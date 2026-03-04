# Architecture Patterns: Loom V2 — Premium Multi-Provider AI Coding Interface

**Domain:** Greenfield React frontend consuming existing Node.js/WebSocket backend
**Researched:** 2026-03-04
**Confidence:** HIGH — based on direct backend API contract analysis, V1 codebase study,
  co-architect consensus (ARCHITECT_SYNC.md), and Gemini reference-app analyses of
  Claude.ai, ChatGPT Canvas, Open WebUI, LobeChat, Perplexity, and Linear.

---

## Recommended Architecture

Loom V2 uses the **Headless Backend Hybrid** pattern: the CloudCLI Node.js server is
preserved entirely, and the React frontend is a clean consumer of its WebSocket + REST
API. The frontend owns zero business logic — it is a rendering and interaction layer.

The overall structure is a **multi-zone CSS Grid shell** with **4 Zustand stores** for
state, **Active Message Isolation** for streaming performance, and a **tiered component
hierarchy** that separates layout shells, feature panels, data containers, and leaf
presentational components.

---

## Component Architecture

### The Three-Layer Model

Every component in Loom V2 belongs to exactly one of three layers:

```
Layer 1: Shell (Layout)
  AppShell, WorkspaceLayout, SidebarShell, ContentZone, ArtifactPane
  — Owns grid/flex structure. No data fetching. No store subscriptions.

Layer 2: Feature Panels (Orchestrators)
  ChatWorkspace, SidebarNav, SettingsModal, OmniBar, MCPManager,
  GitPanel, TerminalPanel, GSDDashboard
  — Owns feature state. Fetches data. Composes leaf components.
  — Each panel is independently error-bounded.

Layer 3: Leaf Components (Presentational + Specialized)
  TurnBlock, ToolActionCard, ThinkingDisclosure, ActiveMessage,
  ChatComposer, CodeBlock, DiffViewer, CompanionSprite,
  ScrollToBottomPill, ActivityStatusLine, ConnectionStatusDot, Toast
  — Pure render. Props only. Zero direct store subscriptions except
    where performance demands it (e.g., ActiveMessage reads stream store).
```

### Component Boundaries

| Component | Layer | Responsibility | Communicates With |
|-----------|-------|---------------|-------------------|
| `AppShell` | Shell | CSS Grid skeleton, 100dvh, body overflow:hidden | WorkspaceLayout |
| `WorkspaceLayout` | Shell | Multi-tab workspace grid, tab bar, panel orchestration | All Feature Panels |
| `SidebarShell` | Shell | Sidebar width + collapse behavior via CSS var | SidebarNav |
| `ContentZone` | Shell | Active panel area, handles tab routing | ChatWorkspace, GSDDashboard |
| `ChatWorkspace` | Feature | Per-tab chat session, owns turn array | ChatViewport, ChatComposer, ActivityStatusLine |
| `SidebarNav` | Feature | Session list, project list, chronological groups | REST API (projects/sessions) |
| `OmniBar` | Feature | Cmd+K command palette, global navigation | UI store (modal state), router |
| `SettingsModal` | Feature | Provider auth, credentials, MCP, appearance | REST API (settings/credentials/mcp) |
| `MCPManager` | Feature | MCP server list, enable/disable, configure | REST API (/api/mcp/*) |
| `GitPanel` | Feature | Branch, status, diff, commit, push/pull | REST API (/api/git/*) |
| `TerminalPanel` | Feature | PTY sessions, shell WebSocket | WS `/shell` |
| `GSDDashboard` | Feature | Phase pipeline, task status, agent assignment | REST API (/api/taskmaster/*) |
| `ChatViewport` | Feature | Scroll container, message list, streaming anchor | Timeline store, Stream store |
| `TurnBlock` | Leaf | One user+assistant turn pair, expandable | Props from ChatViewport |
| `ActiveMessage` | Leaf | Currently streaming response (isolated hot path) | Stream store (direct) |
| `ToolActionCard` | Leaf | Tool call state machine (invoked→resolving→done) | Props only |
| `ThinkingDisclosure` | Leaf | Thinking/reasoning block accordion | Props only |
| `ChatComposer` | Leaf | Auto-resizing textarea, attachments, send/stop | UI store (isStreaming), WebSocket store |
| `CodeBlock` | Leaf | Shiki-highlighted code, copy button | Props only |
| `ActivityStatusLine` | Leaf | Live "Thinking... / Writing file.js..." above input | Stream store (parseActivityText) |
| `ScrollToBottomPill` | Leaf | Floating "↓ new" pill when user scrolls up | Props (isUserScrolledUp, onClick) |
| `CompanionSprite` | Leaf | Animated pixel sprite reacting to system events | UI store (companionState) |
| `Toast` | Leaf | Transient notification (portal, fixed position) | ToastProvider context |

---

## State Management Architecture

### 4-Store Zustand Topology

```
Store 1: timeline
  ├── sessions: Record<tabId, Message[]>   — static past messages per tab
  ├── activeTabId: string
  ├── addMessage(tabId, message)           — only called on turn completion
  └── loadHistory(tabId, messages)         — batch load from REST

Store 2: stream
  ├── isStreaming: boolean
  ├── activeTabId: string
  ├── toolCallStates: Record<toolUseId, ToolState>   — state machine per tool
  ├── thinkingState: 'idle' | 'streaming' | 'collapsed'
  ├── activityText: string                            — "Writing server.js..."
  ├── sessionId: string | null
  ├── tokenRef: React.MutableRefObject<string>        — bypasses reconciler
  └── — does NOT store token text in Zustand state —  direct DOM mutation only

Store 3: ui
  ├── sidebarCollapsed: boolean
  ├── activePanel: 'chat' | 'git' | 'terminal' | 'gsd'
  ├── omniBarOpen: boolean
  ├── settingsOpen: boolean
  ├── artifactPaneWidth: number            — CSS var --artifact-width
  ├── companionState: CompanionAnimationState
  └── tabs: WorkspaceTab[]                 — per-tab provider + project

Store 4: connection
  ├── status: 'connecting' | 'connected' | 'reconnecting' | 'disconnected'
  ├── lastConnectedAt: Date | null
  ├── retryCount: number
  └── send(message): void                  — typed WebSocket send
```

### The Token Buffer: Why useRef, Not useState

The `ActiveMessage` component bypasses React's reconciler entirely during streaming.
At 100 tokens/sec, calling `setState` causes the VDOM diff engine to run 100 times/sec
across the entire tree. Instead:

```typescript
// In stream store setup:
const tokenRef = useRef('')

// In WebSocket handler:
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data)
  if (msg.type === 'claude-response' && msg.data.type === 'content_block_delta') {
    tokenRef.current += msg.data.delta.text
    // Signal ActiveMessage to pull from ref — no state update
    flushSync(() => activeMessageDOMRef.current?.textContent = tokenRef.current)
  }
}

// On stream completion (claude-complete):
useStore.getState().timeline.addMessage(tabId, {
  role: 'assistant',
  content: tokenRef.current,
  // ... tool calls, thinking blocks
})
tokenRef.current = ''
```

This pattern keeps the React tree completely still during streaming — only the
`ActiveMessage` DOM node mutates, via direct assignment.

---

## Data Flow

### Streaming Response Lifecycle

```
User types in ChatComposer → Enter key pressed
  ↓
connection.send({ type: 'claude-command', command, options })
  ↓
stream store: isStreaming = true, toolCallStates = {}, activityText = 'Thinking...'
  ↓
WebSocket messages arrive:
  ├── session-created → stream.sessionId = sessionId
  ├── content_block_delta → tokenRef.current += text (DOM direct, no React)
  ├── tool_use → stream.toolCallStates[id] = { state: 'invoked', name, input }
  ├── claude-permission-request → ui.permissionRequest = { requestId, toolName, input }
  ├── claude-status → stream.activityText = parseActivityText(data.message)
  ├── claude-complete → flush tokenRef to timeline store, isStreaming = false
  └── claude-error → toast({ tier: 'error', message: error })
  ↓
timeline.addMessage(activeTabId, completedMessage)
  ↓
ChatViewport re-renders past messages list (past messages are memoized, only new one added)
ActiveMessage unmounts (stream over) → TurnBlock mounts with completed message
```

### REST Data Flow

```
App load → GET /api/auth/status
  ├── needsSetup: true → render SetupWizard
  └── authenticated: true → render WorkspaceLayout

SidebarNav mounts → GET /api/projects (scans all 3 providers)
  → session list by chronological group (Today / Yesterday / Older)

User selects session → GET /api/projects/:name/sessions/:id/messages
  → timeline.loadHistory(tabId, messages)
  → ChatViewport renders past turns (all memoized, no re-render on stream)

Settings opens → parallel GET:
  /api/settings/api-keys
  /api/settings/credentials
  /api/mcp/cli/list
  /api/cli/claude/status + codex/status + gemini/status
```

### Multi-Tab Data Flow

```
WorkspaceTab {
  tabId: string        — uuid
  provider: 'claude' | 'codex' | 'gemini'
  projectPath: string
  sessionId: string | null
  label: string
}

Each tab has isolated:
  ├── timeline.sessions[tabId]          — own message history
  ├── stream state (only one tab active at a time, streams go to activeTabId)
  └── ChatViewport instance (React key = tabId, fully unmounts/remounts on tab switch)

Background tabs:
  ├── WebSocket sends go to whichever session is active on the backend
  ├── projects_updated broadcasts update SidebarNav for all tabs simultaneously
  └── If background tab was streaming (future feature), session-status isProcessing
      tracks continuation — pill indicator on tab shows "working"
```

---

## Build Order (Phase Dependencies)

The dependency chain is strict. Each phase unblocks the next. Violating this order
causes rework.

```
Phase 1: App Shell + Design System
  Produces: AppShell.tsx, CSS variable tokens (OKLCH), z-index dictionary,
            typography config, Error Boundary hierarchy (3 levels),
            Zustand store skeletons, Vitest setup, motion provider.
  Unblocks: Everything. Nothing else can be built without the grid shell and tokens.
  Gate:     Dark empty shell renders, body never scrolls, tokens propagate.

Phase 2: WebSocket Bridge + State Contract
  Produces: WebSocketProvider, 4 Zustand stores (populated), useRef token buffer,
            typed WebSocket message discriminated union, REST API client layer,
            InputStub (hardcoded prompt sender for downstream testing).
  Unblocks: Phase 3 (needs real stream data), Phase 6 (needs REST data).
  Gate:     console.log shows tokens streaming and turn completion message.

Phase 3: Streaming Engine + Scroll Physics
  Produces: ChatViewport, ActiveMessage (ref-based DOM mutation),
            useScrollAnchor (IntersectionObserver sentinel), ScrollToBottomPill,
            requestAnimationFrame token buffer with 50ms render throttle,
            content-visibility:auto on past messages.
  Unblocks: Phase 4 (needs scroll container), Phase 5 (input affects scroll math).
  Gate:     2000-token stream, scroll locks bottom, 1px scroll up detaches, no jank.

Phase 4: Message Rendering + Tool Cards
  Produces: TurnBlock, ToolActionCard (4-state machine), ThinkingDisclosure,
            react-markdown with streaming-safe plugins, Shiki lazy-loaded,
            CodeBlock (copy button, language header), DiffViewer.
  Unblocks: Phase 5 (full turn appearance needed for input UX review).
  Gate:     Tool calls render as cards (not raw JSON), code highlights, no CLS.

Phase 5: Input + Composer + Activity
  Produces: ChatComposer (shadow-div auto-resize), ActivityStatusLine,
            send/stop morph, file attachment chips, drag-and-drop zone,
            Shift+Enter vs Enter, focus trapping, permission request UI.
  Unblocks: Phase 6 (full E2E test loop now possible).
  Gate:     Full conversation loop works, input feels tactile, permissions fire.

Phase 6: Navigation + Session Management + Sidebar
  Produces: SidebarNav (chronological groups, project hierarchy),
            OmniBar (Cmd+K, fuzzy search), tab bar + WorkspaceTab management,
            session switching (zero-latency from timeline cache),
            SettingsModal (glassmorphic portal), multi-provider tab creation.
  Unblocks: Phase 7+ (advanced features on solid foundation).
  Gate:     App is fully usable E2E, keyboard-navigable, feels complete.
```

### Dependency Graph

```
AppShell (Ph1) ──────────────────────────────────────────────────┐
WebSocketProvider (Ph2) ─────────────────────────────────────┐   │
  │                                                           │   │
ChatViewport + ScrollAnchor (Ph3) ─────────────────────┐     │   │
  │                                                     │     │   │
TurnBlock + ToolActionCard (Ph4) ──────────────┐        │     │   │
  │                                            │        │     │   │
ChatComposer + ActivityStatus (Ph5) ─┐         │        │     │   │
  │                                  │         │        │     │   │
SidebarNav + OmniBar + Tabs (Ph6) ───┴─────────┴────────┴─────┴───┘
```

---

## Patterns to Follow

### Pattern 1: Active Message Isolation

The currently-streaming response lives in a separate `<ActiveMessage>` component
isolated from the `<TurnBlock>` list. Only `ActiveMessage` subscribes to the stream
store. Past messages are frozen behind `React.memo` with custom comparators.

```typescript
// ChatViewport.tsx
export function ChatViewport({ tabId }: { tabId: string }) {
  const messages = useTimeline(state => state.sessions[tabId] ?? [])
  const isStreaming = useStream(state => state.isStreaming)

  return (
    <div ref={scrollRef} className="chat-viewport">
      <div className="chat-history">
        {messages.map(msg => (
          <TurnBlock key={msg.id} turn={msg} />  // memoized, never re-renders
        ))}
        {isStreaming && <ActiveMessage />}         // sole subscriber to stream
      </div>
      <div ref={sentinelRef} className="scroll-sentinel" />
    </div>
  )
}
```

Why: React.memo with custom comparator on TurnBlock means zero re-renders to past
turns during a 100 token/sec stream. The entire chat tree stays still except ActiveMessage.

### Pattern 2: Tool Call State Machine

```typescript
type ToolState =
  | { phase: 'invoked';   name: string; input: unknown }
  | { phase: 'awaiting';  name: string; requestId: string }    // permission pending
  | { phase: 'resolving'; name: string; input: unknown }       // executing
  | { phase: 'resolved';  name: string; summary: string }      // success, collapsed
  | { phase: 'rejected';  name: string; error: string }        // failure, auto-expanded

// ToolActionCard renders each phase differently:
// invoked   → pulsing spinner + "Invoking tool_name..."
// awaiting  → permission dialog inline (allow/deny/remember)
// resolving → animated progress bar + streaming tool output in collapsed container
// resolved  → checkmark icon + one-line summary (collapsed by default)
// rejected  → red X + error message (expanded by default showing trace)
```

### Pattern 3: CSS Grid Shell with CSS Variable Width Control

```css
.app-shell {
  display: grid;
  grid-template-columns:
    var(--sidebar-width, 260px)
    1fr
    var(--artifact-width, 0px);
  grid-template-rows: auto 1fr;
  height: 100dvh;
  overflow: hidden;
}

/* Sidebar collapse: JS sets CSS var, CSS handles transition */
.app-shell[data-sidebar="collapsed"] {
  --sidebar-width: 56px;
}

/* Artifact pane: JS sets CSS var when artifact triggered */
.app-shell[data-artifact="open"] {
  --artifact-width: 48vw;
}
```

Width changes via CSS variables propagate instantly without React re-renders.

### Pattern 4: Content-Visibility for Past Messages

```css
/* Applied to past TurnBlock wrappers */
.turn-block-past {
  content-visibility: auto;
  contain-intrinsic-size: auto 200px; /* estimated height */
}
```

Browser skips layout and paint for off-screen turns. No virtual DOM windowing
needed until sessions exceed ~2000 messages (pivot point: `@tanstack/react-virtual`).

### Pattern 5: Tiered Motion

```typescript
// Tier 1: CSS only — hover, press, color transitions (zero JS)
// Use: cubic-bezier(0.34, 1.56, 0.64, 1) as spring approximation in CSS

// Tier 2: LazyMotion + domAnimation (~5KB) — structural enters/exits
import { LazyMotion, domAnimation, m } from 'framer-motion'
<m.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
  <TurnBlock /> // message entrance animation
</m.div>

// Tier 3: Full Framer Motion (lazy-loaded) — complex orchestrated sequences
// Use: only for multi-step tool card animations, artifact panel spring
const { motion } = await import('framer-motion')
```

### Pattern 6: Error Boundary Hierarchy

```
<AppErrorBoundary>          // Catches catastrophic — shows reload page
  <SidebarErrorBoundary>    // Sidebar crash doesn't kill chat
    <SidebarNav />
  </SidebarErrorBoundary>

  <ContentZone>
    <ChatErrorBoundary>     // Chat crash doesn't kill sidebar
      <ChatViewport>
        <TurnErrorBoundary> // One bad message renders placeholder
          <TurnBlock />     // 8 words of bad JSON don't crash the UI
        </TurnErrorBoundary>
      </ChatViewport>
    </ChatErrorBoundary>

    <ArtifactErrorBoundary>
      <ArtifactPane />
    </ArtifactErrorBoundary>
  </ContentZone>
</AppErrorBoundary>
```

### Pattern 7: Multi-Tab Provider Isolation

```typescript
interface WorkspaceTab {
  tabId: string
  provider: 'claude' | 'codex' | 'gemini'
  projectPath: string
  sessionId: string | null
  label: string
  isProcessing: boolean   // tracks background work
}

// Each tab gets its own React key — full unmount/remount on tab switch
// This gives clean isolation with zero shared component state between tabs
<ContentZone>
  {tabs.map(tab => (
    <ChatWorkspace
      key={tab.tabId}       // forces full remount on tab switch
      tab={tab}
      hidden={tab.tabId !== activeTabId}
    />
  ))}
</ContentZone>

// hidden tabs preserve their DOM (no remount) but set visibility:hidden
// This preserves scroll position and input state when switching back
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Global Message State in React Context

**What goes wrong:** Putting `messages` in a React Context causes every component
that consumes the context to re-render on every token. At 100 tokens/sec with 50
components consuming context, this is 5000 re-renders/sec.

**Consequences:** Input lag, sidebar flicker, animation jank, CPU spiral.

**Prevention:** Zustand timeline store with fine-grained selectors. Only components
that explicitly select `messages` re-render. The sidebar never re-renders during streaming.

### Anti-Pattern 2: setState for Streaming Tokens

**What goes wrong:** `setStreamText(prev => prev + token)` runs the React reconciler
on every token. The reconciler diffs the entire virtual DOM subtree of ActiveMessage.

**Consequences:** Jitter, frame drops, cursor lag, CPU pegging during long responses.

**Prevention:** `tokenRef.current += token` + direct DOM text mutation via `textContent`.
Flush to Zustand state only on stream completion. This is the same pattern used by
production AI interfaces including the original CloudCLI backend's own streaming tests.

### Anti-Pattern 3: Synchronous Markdown Parsing on Token Receipt

**What goes wrong:** Running `react-markdown` parser on every incoming token chunk
blocks the main thread. A 100-token burst causes 100 synchronous parse cycles before
the browser can paint.

**Consequences:** Input becomes unresponsive, scroll freezes during bursts.

**Prevention:** `useDeferredValue` on the markdown AST — raw text renders immediately
via direct DOM, parsed/highlighted version defers. Parse on `requestAnimationFrame`
or on newlines/spaces (50ms debounce minimum).

### Anti-Pattern 4: Virtualization Before content-visibility

**What goes wrong:** Implementing `@tanstack/react-virtual` too early destroys the
ability to do simple `scrollTop = scrollHeight` anchoring because DOM elements
cease to exist when scrolled out of view.

**Consequences:** Scroll math becomes extremely complex. IntersectionObserver-based
sentinel doesn't work when the sentinel DOM node may be removed from the virtual window.

**Prevention:** Start with `content-visibility: auto` + `contain-intrinsic-size`.
Browser handles off-screen rendering cost natively. Only add react-virtual if
integration tests show content-visibility is insufficient (threshold: >2000 messages
with measurable jank).

### Anti-Pattern 5: Per-Tab WebSocket Connections

**What goes wrong:** Opening a new WebSocket connection per workspace tab.

**Consequences:** The backend (`server/index.js`) has per-connection state for active
sessions. Multiple connections from the same browser create ambiguity in message routing
and waste server resources. The backend uses `get-active-sessions` to track which
sessions are live — multiple connections fragment this.

**Prevention:** Single WebSocket connection shared across all tabs via the connection
store. Tabs are distinguished by `sessionId`, not by connection. Send `check-session-status`
per tab to track background work.

### Anti-Pattern 6: Hardcoded Colors or z-index Outside Dictionary

**What goes wrong:** Any hex value or z-index number outside the token system.

**Consequences:** V1 accumulated 86 hardcoded references across 13 files that had to
be swept manually in a dedicated phase. The same debt accumulates faster in V2 with
more surfaces.

**Prevention:** ESLint rule banning raw hex values and raw z-index numbers in JSX/TSX.
All colors via CSS custom property reference. All z-index via the dictionary:
```
--z-base: 0        --z-messages: 10    --z-input: 20
--z-popover: 30    --z-omnibar-bg: 40  --z-modal: 50    --z-toast: 60
```

---

## Scalability Considerations

| Concern | At 100 messages | At 2000 messages | At 5000+ messages |
|---------|----------------|-----------------|-------------------|
| DOM node count | ~500 nodes | ~10K nodes | ~25K nodes |
| Rendering strategy | content-visibility:auto | content-visibility:auto | Pivot to @tanstack/react-virtual |
| Timeline store | In-memory array | In-memory array | Paginated (limit 500, load on scroll) |
| WebSocket throughput | Single connection | Single connection | Single connection (backend-limited) |
| Tab isolation | React key remount | React key remount | React key remount + session persistence |
| Token throughput | 100 tok/sec per tab | 100 tok/sec per tab | One active stream at a time (backend limit) |

---

## Key Architectural Decisions (from ARCHITECT_SYNC.md Consensus)

| Decision | Rationale | Phase |
|----------|-----------|-------|
| Zustand 4 stores (not Context) | Context causes full-tree re-renders; Zustand selectors scope updates | Phase 1 |
| useRef + DOM mutation for tokens | Bypass React reconciler at 100 tok/sec | Phase 2 |
| content-visibility before react-virtual | Preserves DOM for scroll math simplicity | Phase 3 |
| InputStub in Phase 2 | Can't test stream pipeline without a way to send prompts | Phase 2 |
| React.memo + custom comparator on TurnBlock | Past messages must never re-render during streaming | Phase 4 |
| CSS springs first, LazyMotion second, Full Framer lazy third | Bundle size: 0KB → 5KB → 32KB only where needed | Phase 1 |
| Three error boundary levels (app/panel/message) | One bad markdown string should not crash the chat | Phase 1 |
| ARIA roles on shell regions (log, complementary, textbox) | A11y from day 1; impossible to retrofit | Phase 1 |
| Instrument Serif (not Tiempos) for editorial serif | Free, high-quality, no $200 license | Phase 1 |
| Single WebSocket shared across tabs | Backend session model assumes per-connection identity | Phase 2 |
| React key = tabId for tab isolation | Clean unmount/remount gives zero shared state | Phase 6 |

---

## Sources

- `/home/swd/loom/.planning/BACKEND_API_CONTRACT.md` — Full WebSocket + REST protocol (HIGH confidence)
- `/home/swd/loom/.planning/ARCHITECT_SYNC.md` — Claude + Gemini consensus on all 10 architectural concerns (HIGH confidence)
- `/home/swd/loom/.planning/audit/UI_COMPONENT_ARCHITECTURE.md` — Gemini analysis of streaming render patterns (HIGH confidence)
- `/home/swd/loom/.planning/audit/EXHAUSTIVE_UX_KNOWLEDGE_BASE.md` — Reference app teardowns: Claude.ai, ChatGPT Canvas, Linear, Perplexity, Open WebUI (HIGH confidence)
- `/home/swd/loom/.planning/audit/UX_ARCHITECTURE_DEEP_DIVE.md` — Scroll physics, tool call display, input ergonomics (HIGH confidence)
- `/home/swd/loom/.planning/audit/V2_REWRITE_PLAYBOOK.md` — 6-phase GSD roadmap from initial planning (MEDIUM confidence — superseded by Claude architect review)
- `/home/swd/loom/.planning/audit/WEBSOCKET_SCHEMA.md` — Discriminated union of WS message types (HIGH confidence)
- Direct analysis of `/home/swd/loom/src/` V1 codebase — V1 component boundaries, performance patterns, accumulated debt lessons (HIGH confidence)
- `/home/swd/loom/.planning/PROJECT.md` — Project requirements, key decisions, constraints (HIGH confidence)

---

*Architecture research for: Loom V2 Premium AI Coding Interface (Greenfield Rewrite)*
*Researched: 2026-03-04*
