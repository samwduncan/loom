# Zustand Store Architecture

Loom V2 uses exactly **4 Zustand stores** (Constitution 4.1). No additional stores without Constitution amendment.

## Store Overview

| Store | File | Responsibility | Middleware |
|-------|------|---------------|------------|
| `useTimelineStore` | `timeline.ts` | Session history, message CRUD, active session/provider tracking | Immer + Persist |
| `useStreamStore` | `stream.ts` | Active streaming state: tool calls, thinking, activity text | None (vanilla) |
| `useUIStore` | `ui.ts` | Layout state, modals, command palette, theme config | Persist |
| `useConnectionStore` | `connection.ts` | WebSocket/provider connection status for claude, codex, gemini | Persist |

## Persistence Strategy

Each store declares what persists to `localStorage` and what is ephemeral (lost on page reload). Only metadata and user preferences persist -- never message content or live connection status.

| Store | Storage Key | What Persists | What's Ephemeral | Version |
|-------|-------------|---------------|------------------|---------|
| timeline | `loom-timeline` | Session metadata (id, title, providerId, createdAt, updatedAt, metadata), activeSessionId, activeProviderId | Messages (always fetched from backend), message content | 1 |
| ui | `loom-ui` | theme (fontSize, density), sidebarCollapsed | sidebarOpen, sidebarState, activeTab, modalState, commandPaletteOpen, companionState | 1 |
| connection | `loom-connection` | Provider modelId selections | Live connection status, error, reconnectAttempts, lastConnected | 1 |
| stream | (none) | (nothing) | Everything: isStreaming, activeToolCalls, thinkingState, activityText | N/A |

### Why messages are never persisted

Messages are always fetched from the backend on demand (`GET /api/projects/:projectName/sessions/:sessionId/messages`). This avoids stale data, reduces localStorage size, and keeps the single-source-of-truth on the server. When a persisted session is rehydrated, its `messages` array is set to `[]`.

## Selector-Only Access (Constitution 4.2)

All store hook usage **MUST** use a selector. The `no-whole-store-subscription` ESLint rule enforces this at error level.

```tsx
// CORRECT: selector extracts only what the component needs
const messages = useTimelineStore(state => state.messages);
const isStreaming = useStreamStore(state => state.isStreaming);

// CORRECT: multiple fields with useShallow
import { useShallow } from 'zustand/react/shallow';

const { isStreaming, activityText } = useStreamStore(
  useShallow(state => ({
    isStreaming: state.isStreaming,
    activityText: state.activityText,
  }))
);

// BANNED: whole-store subscription (ESLint error)
const store = useTimelineStore(); // <-- triggers ESLint error
```

### When to use useShallow

Use `useShallow` (from `zustand/react/shallow`) when selecting **multiple fields** in a single selector. Without `useShallow`, the selector returns a new object reference on every render, defeating React.memo.

```tsx
// Without useShallow: re-renders on EVERY store update (new object reference)
const { a, b } = useStore(state => ({ a: state.a, b: state.b }));

// With useShallow: re-renders only when a or b actually change
const { a, b } = useStore(useShallow(state => ({ a: state.a, b: state.b })));
```

## Store Reset Convention

Every store exports a `reset()` action that restores the initial state.

**Testing:** All test files call `beforeEach(() => store.getState().reset())` to prevent state leakage between tests.

**Production:** `reset()` is used for:
- HMR (Hot Module Replacement) cleanup during development
- Session cleanup when switching projects
- Logout/disconnect flows

```tsx
// In tests
beforeEach(() => {
  useTimelineStore.getState().reset();
  useStreamStore.getState().reset();
});
```

## Migration Strategy

All persisted stores start at **version 1**. When the schema changes:

1. Bump the `version` number in the persist config
2. Add a `migrate(persistedState, version)` function that transforms old state shape to new
3. **Never** wipe-and-rebuild -- always provide a migration path

```tsx
// Example future migration
persist(
  (set) => ({ /* ... */ }),
  {
    name: 'loom-timeline',
    version: 2, // bumped from 1
    migrate: (persistedState, version) => {
      if (version === 1) {
        // Transform v1 -> v2
        return { ...persistedState, newField: 'default' };
      }
      return persistedState;
    },
  },
);
```

## Immer Usage

Only the **timeline store** uses Immer middleware. It needs Immer because session/message mutations are deeply nested (Session > Messages > Metadata/ToolCalls). All other stores use vanilla `set()`.

### Immer rules

- Immer is the **innermost** middleware: `persist(immer(...))`
- Inside an Immer `set()`, mutate the draft directly -- **never** return a new object
- Outside Immer (other stores), always return new objects from `set()`

```tsx
// CORRECT (timeline, with Immer): mutate draft
set((state) => {
  const session = state.sessions.find(s => s.id === id);
  if (session) {
    session.title = newTitle; // direct mutation of draft
  }
});

// CORRECT (stream/ui/connection, without Immer): return new object
set((state) => ({
  activeToolCalls: [...state.activeToolCalls, newToolCall],
}));
```

## Cross-Store Import Ban

Store files **must not** import from other store files. This is enforced by ESLint `no-restricted-imports` rule scoped to `src/stores/*.ts`. If an action needs to update multiple stores, the orchestrating code (a hook or event handler) imports both stores independently.

```tsx
// BANNED: inside timeline.ts
import { useStreamStore } from './stream'; // ESLint error

// CORRECT: in a hook or component
import { useTimelineStore } from '@/stores/timeline';
import { useStreamStore } from '@/stores/stream';

function handleStreamComplete(text: string) {
  useStreamStore.getState().endStream();
  useTimelineStore.getState().addMessage(sessionId, finalMessage);
}
```
