# Architecture Research

**Domain:** Brownfield React + Tailwind web app transformation (CloudCLI → Loom)
**Researched:** 2026-03-01
**Confidence:** HIGH (based on direct codebase analysis of 197 source files)

---

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser Client                            │
├──────────────────┬──────────────────┬───────────────────────────┤
│   Sidebar        │   Main Content   │   Panels                  │
│ ┌──────────────┐ │ ┌──────────────┐ │ ┌──────────┐ ┌─────────┐ │
│ │ ProjectList  │ │ │ChatInterface │ │ │FileTree  │ │GitPanel │ │
│ │ SessionList  │ │ │ChatMessages  │ │ │CodeEditor│ │Shell    │ │
│ │ Settings     │ │ │ChatComposer  │ │ └──────────┘ └─────────┘ │
│ └──────────────┘ │ └──────────────┘ │                           │
├──────────────────┴──────────────────┴───────────────────────────┤
│                     Context Layer (React Context API)            │
│  ThemeContext  AuthContext  WebSocketContext  TasksSettings       │
├─────────────────────────────────────────────────────────────────┤
│                   WebSocket (latestMessage)                       │
├─────────────────────────────────────────────────────────────────┤
│                     Express Backend                               │
│  ┌────────────┐  ┌───────────────┐  ┌─────────────────────┐    │
│  │ claude-sdk │  │  gemini-cli   │  │ sessionManager/DB   │    │
│  └────────────┘  └───────────────┘  └─────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|----------------|-------------------|
| `AppContent` | Top-level layout, route-to-session binding | Sidebar, MainContent, MobileNav |
| `ChatInterface` | Orchestrates all chat state via 4 custom hooks | ChatMessagesPane, ChatComposer |
| `ChatMessagesPane` | Renders scrollable message list | MessageComponent (per message) |
| `MessageComponent` | Renders one message (user/assistant/tool/thinking) | Markdown, ToolRenderer |
| `ToolRenderer` | Routes tool calls to display components | OneLineDisplay, CollapsibleDisplay, DiffViewer, SubagentContainer |
| `ChatComposer` | Input area, permission banners, scroll-to-bottom | ChatInterface (via props) |
| `useChatRealtimeHandlers` | Processes all WebSocket messages into state | setChatMessages (up to ChatInterface) |
| `WebSocketContext` | Single WS connection, broadcasts `latestMessage` | All consumers via `useWebSocket()` |
| `ThemeContext` | `isDarkMode` toggle, writes `.dark` class to `<html>` | All components via `useTheme()` |

---

## Existing Codebase Map

```
src/
├── index.css                    # HSL CSS variable definitions (:root + .dark)
├── App.tsx                      # Provider tree (I18n, Theme, Auth, WS, Tasks)
├── contexts/
│   ├── ThemeContext.jsx          # Dark mode toggle — writes .dark to <html>
│   ├── WebSocketContext.tsx      # Single WS, exposes latestMessage
│   ├── AuthContext.jsx           # JWT auth state
│   └── TasksSettingsContext.jsx  # TaskMaster feature flags
├── hooks/
│   ├── useProjectsState.ts      # Project/session selection, sidebar state
│   └── useSessionProtection.ts  # Active/processing session tracking
├── components/
│   ├── app/AppContent.tsx        # Layout root (sidebar + main)
│   ├── chat/
│   │   ├── view/
│   │   │   ├── ChatInterface.tsx          # Chat root — composes 4 hooks
│   │   │   └── subcomponents/
│   │   │       ├── ChatMessagesPane.tsx   # Scrollable message list
│   │   │       ├── MessageComponent.tsx   # Single message renderer
│   │   │       ├── ChatComposer.tsx       # Input + controls
│   │   │       └── AssistantThinkingIndicator.tsx
│   │   ├── hooks/
│   │   │   ├── useChatRealtimeHandlers.ts # WS message → state mutations
│   │   │   ├── useChatSessionState.ts     # Message list, scroll, session load
│   │   │   ├── useChatComposerState.ts    # Input, submit, abort, commands
│   │   │   └── useChatProviderState.ts    # Provider/model selection
│   │   └── tools/
│   │       ├── ToolRenderer.tsx           # Routes tool → display component
│   │       └── components/
│   │           ├── CollapsibleDisplay.tsx
│   │           ├── OneLineDisplay.tsx
│   │           ├── DiffViewer.tsx
│   │           ├── SubagentContainer.tsx
│   │           └── ContentRenderers/      # Markdown, FileList, TodoList etc.
│   ├── sidebar/                  # Session/project list
│   ├── shell/                    # xterm.js terminal
│   ├── git-panel/                # Git changes/history
│   ├── file-tree/                # File explorer
│   ├── code-editor/              # CodeMirror 6 viewer
│   └── ui/                      # CVA primitives (button, input, badge)
├── i18n/
│   └── locales/                  # 43 components use useTranslation — strip all
└── types/app.ts                  # Project, ProjectSession, SessionProvider types
```

---

## Architectural Patterns

### Pattern 1: CSS Variable Theming (Two-Layer System)

**What:** Tailwind color aliases (`bg-background`, `text-foreground`, `border-border`) point to CSS custom properties in `index.css`. The `:root` selector defines light theme values; `.dark` selector overrides them. React toggles the `dark` class on `<html>`.

**Current state:** 22 semantic variables defined (`--background`, `--foreground`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, `--card`, `--popover`, and their `-foreground` variants).

**Transformation approach:** Only change the HSL values inside `:root` and `.dark` in `index.css`. Variable names stay identical — Tailwind config and all component classnames that use semantic aliases require zero changes. This is the correct target for palette replacement.

**Example — current dark theme values to replace:**
```css
.dark {
  --background: 222.2 84% 4.9%;     /* replace: 15 10% 7%  (deep chocolate) */
  --foreground: 210 40% 98%;         /* replace: 30 60% 92% (cream) */
  --primary: 217.2 91.2% 59.8%;     /* replace: 32 70% 65% (amber/copper) */
  --muted: 217.2 32.6% 17.5%;       /* replace: 20 25% 18% (warm surface) */
  --accent: 217.2 32.6% 17.5%;      /* replace: 20 25% 18% (warm surface) */
  --border: 217.2 32.6% 17.5%;      /* replace: 20 20% 22% (warm border) */
}
```

**Trade-offs:**
- Pro: Zero component changes for semantic aliases
- Con: Does not catch the 86 files with hardcoded Tailwind colors (separate problem)

---

### Pattern 2: Hardcoded Color Audit + Replacement

**What:** 86 files contain hardcoded Tailwind color classes (`bg-blue-600`, `text-gray-500`, `bg-red-950`, etc.). These bypass the CSS variable system and will not respond to the palette swap.

**Audit approach:**
```bash
# Find all hardcoded colors sorted by frequency
grep -rh "bg-[a-z]*-[0-9]\|text-[a-z]*-[0-9]\|border-[a-z]*-[0-9]" \
  src --include="*.tsx" --include="*.jsx" | \
  grep -oE "(bg|text|border)-[a-z]+-[0-9]+" | sort | uniq -c | sort -rn
```

**Priority groups:**
1. **User message bubble** (`bg-blue-600` — 60 occurrences): Replace with `bg-primary` (or new amber token)
2. **Error states** (`bg-red-*`, `text-red-*`): Replace with `bg-destructive` / `text-destructive`
3. **Assistant/system text** (`text-gray-500`, `text-gray-700`, `dark:text-gray-300`): Replace with `text-muted-foreground`
4. **Status colors** (`bg-amber-*`, `bg-green-*`): Add named semantic tokens (`--status-warning`, `--status-success`) to CSS variables
5. **Thinking indicator** (`text-gray-900 dark:text-white`, `text-gray-500 dark:text-gray-400`): Replace with `text-foreground` / `text-muted-foreground`

**Tool assistance:** A scoped find-and-replace with verification is the right approach:
```bash
# Example: Replace user bubble color across all files
find src -name "*.tsx" -o -name "*.jsx" | \
  xargs sed -i 's/bg-blue-600 text-white/bg-primary text-primary-foreground/g'
```

**Trade-offs:**
- Pro: Once replaced, components automatically honor future palette changes
- Con: Some hardcoded colors are intentionally semantic (red for error, amber for warning) and need new CSS variable tokens rather than existing aliases

---

### Pattern 3: Streaming State Machine

**What:** The existing streaming architecture uses a `streamBufferRef` + 100ms `setTimeout` to batch tokens before calling `setChatMessages`. Messages have an `isStreaming` boolean. Two functions manage state: `appendStreamingChunk` (appends to last assistant message) and `finalizeStreamingMessage` (sets `isStreaming: false`).

**Current code pattern (in `useChatRealtimeHandlers`):**
```typescript
// Token arrives via WebSocket
streamBufferRef.current += decodedText;
if (!streamTimerRef.current) {
  streamTimerRef.current = window.setTimeout(() => {
    const chunk = streamBufferRef.current;
    streamBufferRef.current = '';
    streamTimerRef.current = null;
    appendStreamingChunk(setChatMessages, chunk, false);
  }, 100);  // 100ms debounce
}

// appendStreamingChunk clones last message to avoid mutation:
updated[lastIndex] = { ...last, content: nextContent };
```

**Strengths to preserve:**
- Object cloning (not mutation) ensures React detects state changes
- Debounce prevents excessive re-renders during fast token streams
- `isStreaming` flag enables UI differentiation (typing animation, no copy button during stream)

**Enhancement for new features:**
- Add `turnId` to `ChatMessage` to group messages by conversation turn
- Add `isCollapsed` boolean to enable turn-level collapse
- Tool call grouping: collect consecutive tool messages under a single `TurnBlock` component

```typescript
// Enhanced ChatMessage type additions:
interface ChatMessage {
  // ... existing fields ...
  turnId?: string;           // Groups messages into collapsible turns
  isCollapsed?: boolean;     // Turn-level collapse state
  toolGroupId?: string;      // Groups 3+ consecutive tool calls
}
```

---

### Pattern 4: Hook Decomposition for State Management

**What:** `ChatInterface` delegates state to 4 isolated hooks. This is the existing pattern and the correct architecture for adding new features without breaking existing ones.

```
ChatInterface
├── useChatProviderState    → provider, model selection
├── useChatSessionState     → message list, scroll, session loading
├── useChatComposerState    → input, submit, commands, file mentions
└── useChatRealtimeHandlers → WebSocket message processing
```

**Adding new state (collapsible turns, usage summaries):**
- Add `collapsedTurns: Set<string>` to `useChatSessionState` — owns the turn collapse state
- Add `toggleTurn(turnId: string)` action
- Do NOT add new Context — prop-drill down from `useChatSessionState` to `ChatMessagesPane` → `TurnBlock`

**Rationale for no new Context:** The collapse state is local to the chat view. Context would over-share scope and create unnecessary subscriptions in unrelated components.

---

### Pattern 5: i18n Removal (Simplification)

**What:** 43 components call `useTranslation()`. The i18n system adds ~200 lines of config and locale files across 4 languages.

**Safe removal approach:**
1. For each component: replace `t('key.path', { defaultValue: 'English text' })` with the `'English text'` string literal
2. For keys without defaultValue: look up the English locale JSON at `src/i18n/locales/en/`
3. Remove `useTranslation` import and hook call
4. Delete `src/i18n/` directory and `react-i18next` from `package.json`
5. Remove `I18nextProvider` from `App.tsx`

**Risk:** Low — pure text substitution with no logic change. The `defaultValue` pattern present in many calls makes this straightforward.

---

## Data Flow

### WebSocket Message Flow (Streaming)

```
Claude CLI (subprocess)
    ↓ stdout (JSON events)
Express server (server/claude-sdk.js)
    ↓ ws.send({ type: 'claude-response', data: ... })
WebSocketContext (browser)
    ↓ setLatestMessage(parsed) — triggers re-render
useChatRealtimeHandlers (effect fires on latestMessage)
    ↓ content_block_delta → streamBufferRef.current += text
    ↓ 100ms setTimeout fires → appendStreamingChunk(setChatMessages)
ChatInterface.chatMessages (React state)
    ↓ prop-drills to ChatMessagesPane
ChatMessagesPane → MessageComponent (renders per message)
    ↓
DOM (visible text update)
```

### Theme Toggle Flow

```
User clicks toggle
    ↓
ThemeContext.toggleDarkMode()
    ↓
document.documentElement.classList.toggle('dark')
    ↓
Tailwind dark: variants activate
    ↓ simultaneously
CSS variables in .dark {} take effect
    ↓
All bg-background / text-foreground / border-border update
```

### State Management: What Goes Where

| State | Location | Rationale |
|-------|----------|-----------|
| Dark mode | ThemeContext | Global, affects all components |
| Auth token | AuthContext | Global, affects all routes |
| WebSocket connection | WebSocketContext | Singleton, shared across views |
| Chat messages | useChatSessionState | Scoped to active chat session |
| Streaming buffer | useRef in ChatInterface | Not UI state, no re-render needed |
| Turn collapse | useChatSessionState (new) | Scoped to chat, owned by message list |
| Tool group expansion | local useState in TurnBlock (new) | Ephemeral per-group UI state |
| Provider/model | useChatProviderState | Scoped to chat session |
| Input text | useChatComposerState | Scoped to composer |

---

## Suggested Build Order

The following order minimizes risk by addressing pure-visual changes first, then additive features, then structural refactoring.

### Phase 1 — Theme Foundation (Zero Breakage Risk)

**What changes:** `src/index.css` (HSL variable values only), `tailwind.config.js` (add new semantic tokens)
**What doesn't change:** Any component file

1. Replace HSL values in `:root` and `.dark` blocks in `index.css`
2. Add missing semantic tokens to `tailwind.config.js` (e.g., `status-warning`, `status-success`)
3. Update `meta[name="theme-color"]` hardcoded hex in `ThemeContext.jsx` to match new dark background
4. Replace `ThemeContext.jsx` hardcoded color comment `#0c1117` with new dark base hex

**Verification:** Visual check in browser — all `bg-background`, `text-foreground`, etc. update globally.

### Phase 2 — Hardcoded Color Sweep (Low Risk)

**What changes:** 86 component files — find-and-replace color classes with semantic aliases

Priority:
1. User bubble: `bg-blue-600 text-white` → `bg-primary text-primary-foreground`
2. Error states: `bg-red-*` → `bg-destructive`, `text-red-*` → `text-destructive`
3. Muted text: `text-gray-500 dark:text-gray-400` → `text-muted-foreground`
4. Body text: `text-gray-700 dark:text-gray-300` → `text-foreground`
5. Intentional status colors (amber warning, green success): Add new CSS variables, keep Tailwind classes mapped to them

**Verification:** Grep for remaining `bg-blue-` / `text-gray-` after each batch.

### Phase 3 — Typography + Font (Low Risk)

**What changes:** `index.css` body font-family, heading sizes, `tailwind.config.js` for JetBrains Mono

1. Add JetBrains Mono Google Font or self-hosted `@font-face`
2. Update `font-family` in `body {}` in `index.css`
3. Add `fontFamily.mono` override in `tailwind.config.js`
4. Add compact `line-height` values to `tailwind.config.js` (e.g., `leading-snug` adjustments)

### Phase 4 — i18n Removal (Low Risk, Mechanical)

**What changes:** 43 components — replace `t('key')` with string literals, remove imports

1. Process by domain: chat (15 files), sidebar (8 files), settings (10 files), others
2. For each: extract English strings, replace `t(...)` calls, remove hook
3. Delete `src/i18n/` directory
4. Remove `I18nextProvider` wrapper from `App.tsx`
5. `npm uninstall react-i18next i18next`

### Phase 5 — Strip Unused Backends (Medium Risk)

**What changes:** `useChatProviderState`, `useChatRealtimeHandlers`, `ChatComposer`, server routes

1. Remove Cursor and Codex provider options from `useChatProviderState`
2. Delete `case 'cursor-*'` and `case 'codex-*'` handlers from `useChatRealtimeHandlers`
3. Remove Cursor/Codex model selectors from `ChatComposer` and `ChatMessagesPane`
4. Delete `server/cursor-cli.js`, `server/openai-codex.js`, `server/routes/cursor.js`
5. Remove Cursor/Codex imports and `LanguageSelector.jsx` if unused

**Risk:** Medium — tight coupling in switch statements. Use search to verify all references removed.

### Phase 6 — Chat Component Redesign (High Risk, Core Value)

**What changes:** `MessageComponent`, `ChatMessagesPane`, new `TurnBlock` component

**Dependencies:** Phases 1–3 must be complete (stable palette) before visual redesign.

Sequence within this phase:
1. Add `turnId` to `ChatMessage` type and assignment logic in `useChatRealtimeHandlers`
2. Build new `TurnBlock` component (wraps N messages for a single turn, handles collapse)
3. Refactor `ChatMessagesPane` to group messages by `turnId` before rendering
4. Replace `MessageComponent` internals — new user bubble, new assistant layout, remove old avatar circles
5. Redesign tool call cards (`CollapsibleDisplay`, `OneLineDisplay`) with new earthy styling
6. Add thinking block disclosure redesign (pulsing amber indicator while `isStreaming`)

**Isolation strategy:** New components alongside old until verified, then cut over.

### Phase 7 — Streaming UX Polish (Medium Risk)

**What changes:** `AssistantThinkingIndicator`, auto-scroll logic, scroll pill

1. Replace animated dots with skeleton shimmer or pulsing avatar
2. Add smart auto-scroll: detect `isUserScrolledUp` (already exists) → show "N new messages" pill
3. Build `ScrollToBottomPill` component with message count badge
4. Add skeleton loading state for initial session load

### Phase 8 — Sidebar + Global Polish (Low-Medium Risk)

**What changes:** Sidebar components, terminal theming, settings page cleanup

1. Apply Catppuccin Mocha theme to xterm.js (palette constants in `Shell.tsx`)
2. Sidebar density improvements (tighter spacing, session list redesign)
3. Global status line (bottom bar showing current Claude activity)
4. Toast system for transient errors (use existing pattern or add lightweight lib)

---

## Anti-Patterns

### Anti-Pattern 1: Changing CSS Variable Names

**What people do:** Rename `--primary` to `--amber` or add new variable names in `tailwind.config.js` without updating all component usages.

**Why it's wrong:** Tailwind config maps color aliases to variable names. A rename breaks every component using that alias. With 197 source files, finding all usages manually is error-prone.

**Do this instead:** Keep all variable names identical. Only change the HSL values inside `:root` and `.dark`. If new semantic categories are needed (e.g., `--status-warning`), add them as new variables — don't rename existing ones.

---

### Anti-Pattern 2: Global State for Turn Collapse

**What people do:** Add `collapsedTurns` to `WebSocketContext` or `ThemeContext` because "it's shared state."

**Why it's wrong:** Turn collapse is ephemeral UI state scoped entirely to the active chat session. Putting it in a global context causes unrelated components to re-render on every collapse toggle, and the state resets incorrectly when sessions change.

**Do this instead:** Add collapse state to `useChatSessionState` (already owns message list state). Reset on session change alongside `chatMessages`.

---

### Anti-Pattern 3: Re-rendering the Entire Message List on Each Token

**What people do:** Store streaming content in React state and append on every token, causing the full `ChatMessagesPane` to re-render at token velocity.

**Why it's wrong:** At 20-60 tokens/second, this creates significant jank. The existing 100ms debounce buffer is correct but not sufficient protection if `ChatMessagesPane` is not memoized.

**Do this instead:**
- Keep the 100ms debounce buffer (already in place)
- Ensure `MessageComponent` is memoized with `React.memo` (already done via `memo()` wrapper)
- Ensure `ChatMessagesPane` passes stable references: avoid creating new arrays or objects in render that break memo comparisons
- Use `React.memo` with custom comparison for `TurnBlock` — only re-render if the last message in the turn changed

```typescript
// Custom comparison for TurnBlock — only re-render if turn content changed
export const TurnBlock = React.memo(
  ({ turn, isCollapsed, onToggle }) => { ... },
  (prev, next) =>
    prev.isCollapsed === next.isCollapsed &&
    prev.turn.messages.length === next.turn.messages.length &&
    prev.turn.messages[prev.turn.messages.length - 1]?.content ===
      next.turn.messages[next.turn.messages.length - 1]?.content
);
```

---

### Anti-Pattern 4: Blocking Streaming with Heavy Markdown Parse

**What people do:** Run `react-markdown` on the full accumulated content string on each token append.

**Why it's wrong:** Markdown parsing is O(n) in content length. At 1000 tokens, each new token triggers a full re-parse of the entire message, creating O(n²) total work per message.

**Do this instead:**
- While `isStreaming: true`, render raw text with `whitespace-pre-wrap` — no Markdown parsing
- When `isStreaming` transitions to `false` (on `content_block_stop`), switch to `<Markdown>` rendering
- This is a single conditional in `MessageComponent` — already partially structured for this

```typescript
// In MessageComponent, assistant content branch:
{message.isStreaming ? (
  <div className="whitespace-pre-wrap text-foreground text-sm">
    {message.content}
  </div>
) : (
  <Markdown className="prose prose-sm max-w-none dark:prose-invert">
    {message.content}
  </Markdown>
)}
```

---

### Anti-Pattern 5: Scattering `dark:` Variants After Theming

**What people do:** After replacing CSS variables, continue adding `dark:text-gray-400` / `dark:bg-gray-800` for new components instead of using semantic aliases.

**Why it's wrong:** Defeats the purpose of CSS variable theming. The `dark:` variant approach requires knowing both light and dark values at authoring time, creating split-brain maintenance.

**Do this instead:** New components ONLY use semantic aliases (`text-muted-foreground`, `bg-card`, `border-border`). Never write `dark:` variants for colors — only for structural differences (layout, display, opacity changes that differ by mode).

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Claude CLI | `node-pty` subprocess in `server/claude-sdk.js`, stdout parsed to WS events | Keep untouched during UI work |
| Gemini CLI | `server/gemini-cli.js` + response handler | Keep — Loom supports Gemini |
| SQLite (better-sqlite3) | `server/database/db.js` — sync API | Sessions, settings persistence |
| xterm.js | `src/components/shell/` — DOM ref, requires `Shell.tsx` for theme config | Catppuccin Mocha palette in Phase 8 |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Server → Client | WebSocket JSON events | `latestMessage` is the single entry point |
| `ChatInterface` ↔ hooks | Props + destructured returns | No Context used within chat subsystem |
| `ChatMessagesPane` ↔ `MessageComponent` | Props per message | Memoized boundary — critical for performance |
| `ToolRenderer` ↔ display components | Props (toolName, toolInput, toolResult, mode) | Config-driven routing via `getToolConfig()` |
| Theme toggle → CSS | `document.documentElement.classList` + CSS custom properties | ThemeContext owns this boundary |

---

## Scaling Considerations

This is a self-hosted single-user app. Scaling in the traditional sense is not relevant. The relevant "scaling" concern is UI performance as session length grows.

| Session Length | Architecture Notes |
|----------------|-------------------|
| 0–50 messages | No issues — current architecture handles fine |
| 50–200 messages | Memoized TurnBlock with collapse becomes important — collapsed turns drastically reduce DOM nodes |
| 200–1000 messages | Windowing (react-window or similar) may become necessary; existing "load earlier messages" pagination helps |
| 1000+ messages | Virtual list strongly recommended; collapse to avoid rendering all turns |

The existing `visibleMessages` / `loadEarlierMessages` architecture in `useChatSessionState` already provides the pagination hook point for future virtualization.

---

## Sources

- Direct analysis of `/home/swd/loom/src/` (197 TypeScript/React source files)
- `src/index.css` — CSS variable definitions and hardcoded color audit
- `src/components/chat/hooks/useChatRealtimeHandlers.ts` — streaming architecture
- `src/components/chat/view/ChatInterface.tsx` — hook composition pattern
- `src/components/chat/view/subcomponents/MessageComponent.tsx` — render branches
- `tailwind.config.js` — semantic alias → CSS variable mapping
- `src/contexts/ThemeContext.jsx` — dark mode toggle mechanism
- `.planning/PROJECT.md` — transformation requirements and constraints

---

*Architecture research for: Loom (CloudCLI fork transformation)*
*Researched: 2026-03-01*
