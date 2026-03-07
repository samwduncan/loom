# Phase 4: State Architecture - Research

**Researched:** 2026-03-05
**Domain:** Zustand v5 state management with TypeScript, persistence middleware, Immer middleware
**Confidence:** HIGH

## Summary

Phase 4 creates the complete data contract for Loom V2 across all five milestones. Four Zustand stores (timeline, stream, ui, connection) with full TypeScript interfaces will be defined, along with a dedicated type system in `src/src/types/`. The existing `useUIStore` stub from Phase 3 gets expanded to match the full schema. Immer middleware is needed for the timeline store's deeply nested message mutations. Persistence via Zustand's `persist` middleware applies to timeline (metadata-only), ui (theme + sidebar), and connection (provider configs). Every store access must use selectors, enforced by the existing ESLint rule.

The project runs Zustand 5.0.11 on React 19.2 with TypeScript strict mode. Immer is NOT currently installed -- it is an optional peer dependency of Zustand and must be added explicitly. The `useShallow` utility is available from `zustand/react/shallow`. The Zustand v5 `create` function supports both curried `create<T>()(...)` and non-curried `create<T>(...)` forms, but the curried form is required for proper TypeScript inference with middleware stacking.

**Primary recommendation:** Install `immer` as a dependency, build all four stores using the curried `create<T>()(...)` syntax, and define the complete M1-M5 type system before implementing any store logic.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Persistence scope**: Timeline store persists metadata only (session list, not messages). UI store persists theme + sidebar collapsed preference. Connection store persists provider configurations. Stream store fully ephemeral.
- **Persistence versioning**: All persisted stores start at version 1 with migrate function skeleton. Whitelist-only partialize approach. Storage keys: `loom-timeline`, `loom-ui`, `loom-connection`.
- **Immer middleware**: Timeline store uses Immer for deeply nested message mutations. Stream, UI, Connection stores stay vanilla.
- **Data shape**: Messages nested inside sessions (Session.messages: Message[]). NOT normalized/flat-map. Matches backend API response shape.
- **Type completeness**: Full TypeScript interfaces for ALL milestones (M1-M5) defined in Phase 4. Future features use `| null` defaults.
- **Type file organization**: Dedicated `src/src/types/` directory with semantic file splits (message.ts, session.ts, provider.ts, ui.ts, stream.ts). No barrel file per Constitution 1.3.
- **Session switch behavior**: M1 is abort-and-switch. Messages kept in memory across session switches. Cross-store coordination via external hooks, NOT store-to-store imports.
- **Zustand v5 syntax**: MUST use curried `create<T>()(...)` form. Existing ui.ts stub uses non-curried form and must be fixed.
- **Store reset and testing**: Every store exports a `reset()` action. Every store has a `.test.ts` file. `beforeEach` calls `reset()`. Test files exempted from `no-external-store-mutation` ESLint rule.
- **Selector enforcement**: Existing ESLint rule `no-whole-store-subscription` already covers all 4 store hooks. `useShallow` required for multi-field selections.

### Claude's Discretion
- Exact interface field types and default values (beyond what MILESTONES.md specifies)
- Action method signatures and internal implementation
- Test structure and assertion patterns
- README prose and documentation style
- Whether to add computed selectors or derived state helpers
- Exact `partialize` field lists for persist middleware

### Deferred Ideas (OUT OF SCOPE)
- Background streaming on session switch (M4 POWER-02)
- Per-provider stream state (M4 will key streams by ProviderId)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| STATE-01 | Create 4 Zustand stores with full TypeScript interfaces and test files | Zustand v5 curried create syntax verified, middleware stacking order confirmed (persist -> immer -> create, per official v5 TS guide), all 4 store hook names match existing ESLint rule, test patterns established from Phase 2-3 |
| STATE-02 | Message type includes metadata + providerContext; Session type includes metadata | Cross-milestone schema from MILESTONES.md provides the interface skeletons; BACKEND_API_CONTRACT.md provides token-usage response shape for MessageMetadata/SessionMetadata fields |
| STATE-03 | ProviderId union type ('claude' \| 'codex' \| 'gemini') used throughout, defaulting to 'claude' | Three providers confirmed in backend routes and WebSocket protocol; ProviderId used in ConnectionStore providers record, Session.providerId, Message.providerContext.providerId |
| STATE-04 | Selector enforcement -- no whole-store subscriptions | Existing ESLint rule `no-whole-store-subscription` already covers all 4 hook names with ERROR level; useShallow available from `zustand/react/shallow`; README documentation completes this requirement |
| STATE-05 | Document persistence strategy in README; implement timeline persistence via Zustand persist middleware | Zustand persist middleware API verified (partialize, version, migrate, storage key), localStorage is default storage, whitelist-only partialize approach locked |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zustand | 5.0.11 | State management (4 stores) | Already installed; selector-based subscriptions prevent unnecessary re-renders during streaming |
| immer | >=9.0.6 | Immutable state updates for timeline store | Optional peer dependency of Zustand; required for readable deeply nested mutations (Session > Message > Metadata) |
| react | 19.2.0 | UI framework | Already installed |
| typescript | strict mode | Type safety | Already configured with `noUncheckedIndexedAccess: true` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zustand/middleware (persist) | 5.0.11 (bundled) | localStorage persistence | Timeline, UI, Connection stores |
| zustand/middleware (immer) | 5.0.11 (bundled) | Immer integration | Timeline store only |
| zustand/react/shallow | 5.0.11 (bundled) | useShallow for multi-field selectors | Components selecting 2+ fields from a store |
| vitest | 4.0.18 | Unit testing | Store action tests |
| @testing-library/react | 16.3.2 | Component testing | Any tests rendering components that consume stores |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Immer for timeline | Spread-based updates | 4+ levels of nesting makes spread unreadable and error-prone; Immer is cleaner |
| localStorage (persist default) | IndexedDB | localStorage is sufficient for metadata-only persistence (<50KB); IndexedDB adds complexity |
| Nested messages (Session.messages[]) | Normalized flat map | Normalized requires join logic everywhere; nested matches backend API shape directly |

**Installation:**
```bash
cd /home/swd/loom/src && npm install immer
```

## Architecture Patterns

### Recommended Project Structure
```
src/src/
├── types/
│   ├── message.ts          # Message, MessageRole, MessageMetadata, ToolCall, ThinkingBlock
│   ├── session.ts          # Session, SessionMetadata
│   ├── provider.ts         # ProviderId, ProviderContext, ProviderConnection
│   ├── ui.ts               # TabId, ModalState, CompanionState, CompanionAnimation, ThemeConfig
│   └── stream.ts           # ToolCallState, ThinkingState
├── stores/
│   ├── timeline.ts         # TimelineStore (Immer + Persist middleware)
│   ├── timeline.test.ts    # Tests for all timeline actions
│   ├── stream.ts           # StreamStore (vanilla Zustand)
│   ├── stream.test.ts      # Tests for all stream actions
│   ├── ui.ts               # UIStore (Persist middleware) -- expand existing stub
│   ├── ui.test.ts           # Tests for all UI actions (new)
│   ├── connection.ts       # ConnectionStore (Persist middleware)
│   ├── connection.test.ts  # Tests for all connection actions
│   └── README.md           # Persistence strategy documentation
```

### Pattern 1: Zustand v5 Curried Create with Middleware
**What:** The TypeScript-correct way to create stores with middleware in Zustand v5.
**When to use:** All stores with middleware (timeline, ui, connection).

```typescript
// Source: Zustand v5 installed type definitions (node_modules/zustand/react.d.ts)

// Timeline store: Immer + Persist
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import type { Session } from '@/types/session';
import type { ProviderId } from '@/types/provider';

interface TimelineState {
  sessions: Session[];
  activeSessionId: string | null;
  activeProviderId: ProviderId;
  // ... actions
}

// INITIAL_TIMELINE_STATE constant for deterministic reset
const INITIAL_TIMELINE_STATE = {
  sessions: [],
  activeSessionId: null,
  activeProviderId: 'claude' as ProviderId,
};

export const useTimelineStore = create<TimelineState>()(
  persist(
    immer(
      (set, get) => ({
        ...INITIAL_TIMELINE_STATE,
        // actions use Immer draft syntax
        addMessage: (sessionId, message) =>
          set((state) => {
            const session = state.sessions.find((s) => s.id === sessionId);
            if (session) {
              session.messages.push(message);
            }
          }),
        reset: () => set(() => ({ ...INITIAL_TIMELINE_STATE })),
      }),
    ),
    {
      name: 'loom-timeline',
      version: 1,
      partialize: (state) => ({
        sessions: state.sessions.map((s) => ({
          id: s.id,
          title: s.title,
          providerId: s.providerId,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          metadata: s.metadata,
          // messages EXCLUDED -- never persisted
        })),
        activeSessionId: state.activeSessionId,
        activeProviderId: state.activeProviderId,
      }),
      migrate: (persistedState, version) => {
        // Version 1: initial schema, no migration needed
        return persistedState as TimelineState;
      },
    },
  ),
);
```

### Pattern 2: Vanilla Zustand Store (No Middleware)
**What:** Simple store without persistence or Immer.
**When to use:** Stream store (fully ephemeral, flat state).

```typescript
import { create } from 'zustand';
import type { ToolCallState, ThinkingState } from '@/types/stream';

interface StreamState {
  isStreaming: boolean;
  activeToolCalls: ToolCallState[];
  thinkingState: ThinkingState | null;
  activityText: string;
  // actions
  startStream: () => void;
  endStream: () => void;
  reset: () => void;
}

const INITIAL_STATE = {
  isStreaming: false,
  activeToolCalls: [],
  thinkingState: null,
  activityText: '',
};

export const useStreamStore = create<StreamState>()((set) => ({
  ...INITIAL_STATE,
  startStream: () => set({ isStreaming: true }),
  endStream: () => set(INITIAL_STATE),
  reset: () => set(INITIAL_STATE),
}));
```

### Pattern 3: Persist with Whitelist-Only Partialize
**What:** Persist middleware that explicitly whitelists fields to persist, preventing accidental leaks.
**When to use:** UI and Connection stores.

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // ... full state including ephemeral fields
    }),
    {
      name: 'loom-ui',
      version: 1,
      partialize: (state) => ({
        // WHITELIST: only these fields persist
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        // Everything else (modals, commandPalette, companion) is ephemeral
      }),
      migrate: (persistedState, version) => {
        return persistedState as Partial<UIState>;
      },
    },
  ),
);
```

### Pattern 4: useShallow for Multi-Field Selectors
**What:** Prevents re-renders when selecting multiple fields from a store.
**When to use:** Any component selecting 2+ fields.

```typescript
import { useShallow } from 'zustand/react/shallow';
import { useStreamStore } from '@/stores/stream';

// CORRECT: useShallow prevents re-renders when unselected fields change
const { isStreaming, activityText } = useStreamStore(
  useShallow((state) => ({
    isStreaming: state.isStreaming,
    activityText: state.activityText,
  })),
);
```

### Pattern 5: Store Testing Pattern
**What:** Test store actions in isolation using getState/setState.
**When to use:** Every store test file.

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useTimelineStore } from './timeline';

describe('TimelineStore', () => {
  beforeEach(() => {
    // Reset to initial state before each test
    useTimelineStore.getState().reset();
  });

  it('adds a message to the active session', () => {
    // Setup: create a session first
    useTimelineStore.setState({
      sessions: [{ id: 'test-session', messages: [], /* ... */ }],
      activeSessionId: 'test-session',
    });

    // Act
    useTimelineStore.getState().addMessage('test-session', {
      id: 'msg-1',
      role: 'user',
      content: 'Hello',
      // ... required fields
    });

    // Assert
    const state = useTimelineStore.getState();
    const session = state.sessions.find((s) => s.id === 'test-session');
    expect(session?.messages).toHaveLength(1);
    expect(session?.messages[0]?.content).toBe('Hello');
  });
});
```

### Anti-Patterns to Avoid
- **Store-to-store imports:** Never import one store inside another. Cross-store coordination uses external hooks (built in Phase 8). Stores must remain independent.
- **Non-curried create with middleware:** `create<T>(immer(...))` loses type inference in Zustand v5. Always use `create<T>()(immer(...))`.
- **Blacklist partialize:** Never use `omit(state, ['ephemeralField'])`. Always whitelist: `{ field1: state.field1, field2: state.field2 }`. New fields accidentally persisting is worse than forgetting to persist a new field.
- **Whole-store subscription:** `const store = useStreamStore()` -- banned by ESLint. Always use selector.
- **External setState:** `useTimelineStore.setState({ messages: [...] })` in production code -- banned by Constitution 4.5. Only allowed in test files (ESLint exemption exists).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Immutable nested updates | Manual spread at 4+ levels | `immer` middleware | `{ ...state, sessions: state.sessions.map(s => s.id === id ? { ...s, messages: [...s.messages, msg] } : s) }` is unreadable and error-prone |
| localStorage persistence | Manual JSON.stringify/parse with version tracking | Zustand `persist` middleware | Handles serialization, versioning, migration, rehydration, partial state automatically |
| Shallow equality for selectors | Custom shallow comparison | `useShallow` from zustand/react/shallow | Battle-tested, integrates with Zustand's subscription model |
| Store reset | Manual per-field reset | Initial state object + spread in reset() | Define `INITIAL_STATE` constant, use in both store creation and `reset()` action |

**Key insight:** Zustand v5 ships all necessary middleware (persist, immer, devtools, subscribeWithSelector) as optional imports. The only external dependency needed is `immer` itself as a peer dependency.

## Common Pitfalls

### Pitfall 1: Non-curried create form loses middleware type inference
**What goes wrong:** Using `create<T>(immer(...))` instead of `create<T>()(immer(...))` causes TypeScript to lose track of middleware mutations (e.g., `set()` won't accept Immer draft callbacks).
**Why it happens:** Zustand v5's `create` is overloaded -- the curried form defers generic binding, allowing middleware to properly augment the store type.
**How to avoid:** Always use the double-parentheses curried form: `create<Type>()(middleware(...))`.
**Warning signs:** TypeScript errors about `set` argument types not matching, or `state` not being mutable inside Immer callbacks.

### Pitfall 2: Persist middleware serializes functions
**What goes wrong:** If `partialize` isn't used, action methods (functions) get serialized to localStorage as `null`, causing crashes on rehydration.
**Why it happens:** `JSON.stringify` strips function values. On reload, the store tries to merge `{ addMessage: null }` over the initial state.
**How to avoid:** Always use `partialize` to select ONLY data fields for persistence. Never let action methods reach localStorage.
**Warning signs:** Store actions become `null` after page reload; "X is not a function" errors.

### Pitfall 3: Immer draft escaping
**What goes wrong:** Returning a draft object from an Immer-powered `set()` instead of mutating it in place causes subtle bugs.
**Why it happens:** Immer works by proxying the state. Returning a new object bypasses the proxy.
**How to avoid:** Inside Immer's `set()`, either mutate the draft directly (`state.count++`) OR return a completely new state object. Never mix both.
**Warning signs:** State changes not reflecting, or stale state appearing after mutations.

### Pitfall 4: persist + immer middleware stacking order
**What goes wrong:** Wrong middleware order causes type errors or persistence not working.
**Why it happens:** Zustand middleware is applied inside-out. The innermost middleware wraps the state creator first.
**How to avoid:** Correct order: `create<T>()(persist(immer(...)))`. Per the official Zustand v5 TypeScript guide, Immer is innermost (closest to state creator). Persist wraps immer. This ensures `set()` supports draft mutations natively.
**Warning signs:** Type errors about set() not accepting draft callbacks, or persisted state not having expected shape.

### Pitfall 5: Forgetting to handle persist rehydration
**What goes wrong:** Components render with initial state, then flash to persisted state when localStorage loads (synchronously, but after first render in some edge cases).
**Why it happens:** The persist middleware rehydrates from storage on store creation, but if the store is imported lazily, the initial render may show defaults.
**How to avoid:** For M1, this is minimal risk since persist uses synchronous localStorage by default. But be aware of the `onRehydrateStorage` callback for future async storage scenarios. The `persist.hasHydrated()` method can gate UI if needed.
**Warning signs:** Sidebar state flashing from expanded to collapsed on page load.

### Pitfall 6: Test state leaking between tests
**What goes wrong:** A test that modifies store state affects subsequent tests.
**Why it happens:** Zustand stores are module-level singletons. State persists across tests unless explicitly reset.
**How to avoid:** Every `beforeEach` must call `store.getState().reset()` for each store used in the test file.
**Warning signs:** Tests passing in isolation but failing when run together; test order affecting results.

## Code Examples

### Complete Type Definitions (Based on MILESTONES.md Cross-Milestone Schema)

```typescript
// src/src/types/provider.ts
// Source: MILESTONES.md cross-milestone schema + BACKEND_API_CONTRACT.md

export type ProviderId = 'claude' | 'codex' | 'gemini';

export interface ProviderContext {
  providerId: ProviderId;
  modelId: string;
  agentName: string | null;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export interface ProviderConnection {
  status: ConnectionStatus;
  lastConnected: string | null;
  reconnectAttempts: number;
  error: string | null;
  modelId: string | null;
}
```

```typescript
// src/src/types/message.ts
// Source: MILESTONES.md Message interface + BACKEND_API_CONTRACT.md

export type MessageRole = 'user' | 'assistant' | 'system' | 'error' | 'task_notification';

export interface MessageMetadata {
  timestamp: string;
  tokenCount: number | null;
  cost: number | null;
  duration: number | null;
}

export interface ThinkingBlock {
  id: string;
  text: string;
  isComplete: boolean;
}

export interface ToolCall {
  id: string;
  toolName: string;
  input: Record<string, unknown>;
  output: string | null;
  isError: boolean;
  parentToolUseId: string | null;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  toolCalls?: ToolCall[];
  thinkingBlocks?: ThinkingBlock[];
  metadata: MessageMetadata;
  providerContext: ProviderContext;
}
```

```typescript
// src/src/types/session.ts
// Source: MILESTONES.md Session interface

export interface SessionMetadata {
  tokenBudget: number | null;
  contextWindowUsed: number | null;
  totalCost: number | null;
}

export interface Session {
  id: string;
  title: string;
  messages: Message[];
  providerId: ProviderId;
  createdAt: string;
  updatedAt: string;
  metadata: SessionMetadata;
}
```

```typescript
// src/src/types/ui.ts
// Source: MILESTONES.md UIStore interface

export type TabId = 'chat' | 'dashboard' | 'settings';

export interface ModalState {
  type: string;
  props: Record<string, unknown>;
}

export interface CompanionAnimation {
  state: 'idle' | 'thinking' | 'celebrating' | 'alarmed' | 'sleeping';
  spriteIndex: number;
}

export interface CompanionState {
  isVisible: boolean;
  animation: CompanionAnimation;
}

export interface ThemeConfig {
  fontSize: number;
  density: 'compact' | 'comfortable' | 'spacious';
}
```

```typescript
// src/src/types/stream.ts
// Source: MILESTONES.md StreamStore interface

export type ToolCallStatus = 'invoked' | 'executing' | 'resolved' | 'rejected';

export interface ToolCallState {
  id: string;
  toolName: string;
  status: ToolCallStatus;
  input: Record<string, unknown>;
  output: string | null;
  isError: boolean;
  startedAt: string;
  completedAt: string | null;
}

export interface ThinkingState {
  isThinking: boolean;
  blocks: ThinkingBlock[];
}
```

### Middleware Stacking Order Verification

```typescript
// CORRECT stacking order for timeline store:
// Outermost to innermost: create -> persist -> immer -> state creator (per official v5 TS guide)
// The state creator function receives set/get that support Immer draft mutations
export const useTimelineStore = create<TimelineState>()(
  persist(          // Outermost: handles serialization/deserialization
    immer(          // Innermost: enables draft mutations in set()
      (set, get) => ({
        // State creator with actions
        // set() here accepts Immer draft callbacks thanks to immer middleware
      }),
    ),
    { name: 'loom-timeline', version: 1, partialize: ... },
  ),
);

// CORRECT stacking for UI/Connection (no immer):
export const useUIStore = create<UIState>()(
  persist(
    (set) => ({ ... }),
    { name: 'loom-ui', version: 1, partialize: ... },
  ),
);

// CORRECT for stream (no middleware):
export const useStreamStore = create<StreamState>()((set) => ({ ... }));
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `create<T>((set) => ...)` | `create<T>()(...)` (curried) | Zustand v4.4+ / v5 | Required for proper TS inference with middleware |
| `import shallow from 'zustand/shallow'` | `import { useShallow } from 'zustand/react/shallow'` | Zustand v5 | `shallow` still exists but `useShallow` is the hook-friendly API |
| Redux-style normalized state | Nested domain objects with Immer | Ongoing | Zustand + Immer enables readable nested mutations without normalization overhead |
| React Context for global state | Zustand stores with selectors | React 18+ | Context re-renders all consumers; Zustand only re-renders selectors that match changed state |

**Deprecated/outdated:**
- `zustand/middleware` default export: Use named imports (`import { persist } from 'zustand/middleware'`)
- `shallow` comparison function used directly as second arg to store hook: Zustand v5 recommends `useShallow` wrapper instead

## Open Questions

1. **Exact ThinkingBlock fields**
   - What we know: Backend sends thinking/reasoning content via the Claude SDK. The `claude-response` wraps raw SDK messages that include content blocks.
   - What's unclear: The exact ThinkingBlock structure from the Claude Agent SDK. The MILESTONES.md schema shows `{ id, text, isComplete }` which is reasonable.
   - Recommendation: Use the schema from MILESTONES.md. It will be refined when Phase 5 (WebSocket Bridge) maps the actual SDK payload.

2. **Timeline store partialize type accuracy**
   - What we know: The `partialize` function must return a subset of the state that excludes `messages` from sessions.
   - What's unclear: TypeScript's handling of the partialize return type when it differs significantly from the full state (sessions without messages vs sessions with messages).
   - Recommendation: Define a `PersistedTimelineState` type for the partialize return. Use the persist middleware's generic parameter: `persist<TimelineState, [], [], PersistedTimelineState>(...)`.

3. **Merge behavior on rehydration**
   - What we know: When localStorage has persisted session metadata and the store initializes with empty sessions, the merge must reconstruct sessions without messages.
   - What's unclear: Whether the default shallow merge is sufficient or if a custom `merge` function is needed.
   - Recommendation: Implement a custom `merge` function for the timeline store that ensures rehydrated sessions get empty `messages: []` arrays since messages are never persisted.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 |
| Config file | `src/vite.config.ts` (test block) |
| Quick run command | `cd /home/swd/loom/src && npx vitest run src/src/stores/` |
| Full suite command | `cd /home/swd/loom/src && npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| STATE-01 | Four stores exist with all actions | unit | `cd /home/swd/loom/src && npx vitest run src/src/stores/timeline.test.ts src/src/stores/stream.test.ts src/src/stores/ui.test.ts src/src/stores/connection.test.ts -x` | Wave 0 |
| STATE-02 | Message.metadata + Message.providerContext + Session.metadata fields exist | unit | `cd /home/swd/loom/src && npx vitest run src/src/stores/timeline.test.ts -x` | Wave 0 |
| STATE-03 | ProviderId union type used throughout, defaults to 'claude' | unit | `cd /home/swd/loom/src && npx vitest run src/src/stores/ -x` (type check via tsc --noEmit) | Wave 0 |
| STATE-04 | No whole-store subscriptions in codebase | lint | `cd /home/swd/loom/src && npx eslint src/src/stores/ src/src/components/` | Existing rule |
| STATE-05 | Timeline persistence to localStorage, README exists | unit | `cd /home/swd/loom/src && npx vitest run src/src/stores/timeline.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd /home/swd/loom/src && npx vitest run src/src/stores/ -x`
- **Per wave merge:** `cd /home/swd/loom/src && npx vitest run && npx tsc --noEmit`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/src/stores/timeline.test.ts` -- covers STATE-01, STATE-02, STATE-03, STATE-05
- [ ] `src/src/stores/stream.test.ts` -- covers STATE-01
- [ ] `src/src/stores/ui.test.ts` -- covers STATE-01 (existing stub has no test)
- [ ] `src/src/stores/connection.test.ts` -- covers STATE-01, STATE-03
- [ ] `immer` package installation -- required for timeline store Immer middleware

## Sources

### Primary (HIGH confidence)
- Zustand v5.0.11 installed type definitions (`node_modules/zustand/react.d.ts`) -- verified create API, middleware types
- Zustand v5.0.11 middleware type definitions (`node_modules/zustand/middleware/immer.d.ts`, `persist.d.ts`) -- verified middleware API
- `node_modules/zustand/react/shallow.d.ts` -- verified useShallow export
- `node_modules/zustand/package.json` -- verified immer is optional peer dep (>=9.0.6)
- Existing codebase files: `src/src/stores/ui.ts`, `src/eslint-rules/no-whole-store-subscription.js`, `src/vite.config.ts`, `src/tsconfig.app.json`
- `.planning/MILESTONES.md` -- cross-milestone store schema (authoritative)
- `.planning/BACKEND_API_CONTRACT.md` -- WebSocket message types, REST API shapes
- `.planning/V2_CONSTITUTION.md` -- Section 4 (State Management rules)

### Secondary (MEDIUM confidence)
- `.planning/ARCHITECT_SYNC.md` -- Claude + Gemini consensus on 4-store Zustand architecture
- `.planning/phases/04-state-architecture/04-CONTEXT.md` -- user-locked decisions on persistence, Immer, data shape

### Tertiary (LOW confidence)
- None -- all findings verified against installed packages and project source

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries verified from installed packages
- Architecture: HIGH - middleware stacking verified via type definitions, patterns confirmed from existing codebase
- Pitfalls: HIGH - all pitfalls derived from Zustand v5 type system analysis and documented middleware behavior

**Research date:** 2026-03-05
**Valid until:** 2026-04-05 (stable -- Zustand v5 API is settled)
