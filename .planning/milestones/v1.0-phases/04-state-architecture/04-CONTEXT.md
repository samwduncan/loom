# Phase 4: State Architecture - Context

**Gathered:** 2026-03-05
**Status:** Ready for planning
**Reviewed by:** Gemini Architect (review mode) -- corrections applied

<domain>
## Phase Boundary

Four Zustand stores (timeline, stream, ui, connection) define the complete data contract for the entire V2 vision -- with full TypeScript interfaces ready for M4 multi-provider without type changes -- and every store access uses selectors. The existing `useUIStore` stub from Phase 3 gets expanded to match the full schema. No WebSocket, no streaming logic, no UI components beyond what Phase 3 built -- this is the state layer that everything else plugs into.

</domain>

<decisions>
## Implementation Decisions

### Persistence scope
- **Timeline store**: Persist **metadata only** -- session list (id, title, dates, provider, message count) + activeSessionId. Messages are NEVER persisted; always fetched from backend on demand. localStorage stays tiny (<50KB even with hundreds of sessions).
- **UI store**: Persist **theme config + sidebar collapsed/expanded preference**. All modal state, command palette state, companion state are ephemeral (reset on reload).
- **Connection store**: Persist **provider configurations** (which providers are configured, last-used model selection). Live connection status (connected/disconnected/reconnecting) is always ephemeral.
- **Stream store**: Fully ephemeral. No persistence.

### Persistence versioning
- All persisted stores start at `version: 1` with a `migrate` function skeleton
- `partialize` function uses **whitelist-only** approach -- explicitly select which fields persist, never blacklist. If a developer adds a new field to Session and forgets to update partialize, it must NOT leak into localStorage.
- On schema changes: bump version + write migration function. Never wipe-and-rebuild.
- Storage keys: `loom-timeline`, `loom-ui`, `loom-connection`

### Immer middleware
- **Timeline store uses Immer middleware** for deeply nested message mutations. Session > Messages > Metadata/ProviderContext/ToolCalls -- spread-based updates at 4+ levels are unreadable and error-prone.
- **Stream, UI, Connection stores stay vanilla** (flat state, no nesting justifies the overhead)
- Immer is already included in Zustand as an optional middleware -- no additional dependency

### Data shape
- **Messages nested inside sessions** per MILESTONES.md cross-milestone schema: `Session.messages: Message[]`
- NOT normalized/flat-map. Immer makes nested updates workable.
- Matches backend API response shape (sessions contain their messages)

### Type completeness
- **Full TypeScript interfaces for ALL milestones** (M1-M5) defined in Phase 4
- Future features use `| null` defaults: `companionState: CompanionState | null`, `commandPaletteOpen: boolean` (false until M3)
- Complete interfaces for: `CompanionState`, `CompanionAnimation`, `ModalState`, `ThemeConfig`, `TabId`, `ToolCallState`, `ThinkingState`, `ThinkingBlock`, `ToolCall`, `MessageMetadata`, `SessionMetadata`, `ProviderContext`, `ProviderConnection`
- Goal: zero type-level changes needed when M3-M5 milestones begin

### Type file organization
- Dedicated `src/src/types/` directory with semantic file splits:
  - `message.ts` -- Message, MessageRole, MessageMetadata, ToolCall, ThinkingBlock
  - `session.ts` -- Session, SessionMetadata
  - `provider.ts` -- ProviderId, ProviderContext, ProviderConnection
  - `ui.ts` -- TabId, ModalState, CompanionState, CompanionAnimation, ThemeConfig
  - `stream.ts` -- ToolCallState, ThinkingState
- **No barrel file** (Constitution 1.3 bans barrel re-exports except components/shared/). Import directly: `import { Message } from '@/types/message'`
- Stores import from types/. Types are the contract, stores are the implementation.

### Session switch behavior
- **M1 behavior**: Abort-and-switch. If streaming, send abort signal to backend, reset stream store, then switch session. Clean cut.
- **M4 upgrade path**: Types are designed so stream state can become per-provider in M4 (background streaming). No type changes needed for the upgrade.
- **Messages kept in memory** across session switches. Switching back to a previously visited session is instant (no re-fetch). Memory cleared on page reload.
- **Cross-store coordination via external hooks**, NOT store-to-store imports. A `useSessionSwitch` hook (built in Phase 8) calls stream.reset() + timeline.setActiveSession() + timeline.loadMessages() in sequence. Stores stay independent.

### Zustand v5 syntax
- Project has Zustand 5.0.11 installed -- MUST use the **curried `create<T>()(...)` form**, not the old `create<T>((set) => ...)`
- The existing `ui.ts` stub uses the non-curried form -- Phase 4 fixes this when expanding the store
- Middleware stacking: `create<T>()(immer(persist(...)))` for timeline, `create<T>()(persist(...))` for ui/connection, `create<T>()(...)` for stream

### Store reset and testing
- Every store exports a `reset()` action that restores the **initial skeleton state** (not just empty arrays -- must restore default objects/values for HMR and test consistency)
- Every store has a corresponding `.test.ts` file testing all actions
- `beforeEach` in tests calls `reset()` to prevent state leakage between tests
- Test files exempted from `no-external-store-mutation` ESLint rule (already decided in Phase 3)

### Selector enforcement
- Existing ESLint rule `no-whole-store-subscription` already covers all 4 store hook names
- STATE-04 requirement satisfied by existing rule + documented selector pattern in README
- `useShallow` required for multi-field selections (documented in store README)

### Claude's Discretion
- Exact interface field types and default values (beyond what MILESTONES.md specifies)
- Action method signatures and internal implementation
- Test structure and assertion patterns
- README prose and documentation style
- Whether to add computed selectors or derived state helpers
- Exact `partialize` field lists for persist middleware

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/src/stores/ui.ts`: Existing UIStore stub with sidebarOpen, sidebarState, toggleSidebar. Needs expansion to full schema. Non-curried create syntax needs fixing.
- `src/eslint-rules/no-whole-store-subscription.js`: Already covers useTimelineStore, useStreamStore, useUIStore, useConnectionStore. STATE-04 partially satisfied.
- `src/src/types/` directory: Has `.gitkeep` placeholder and `vite-env.d.ts` -- ready for type files.
- `src/src/stores/` directory: Has `.gitkeep` + `ui.ts` stub -- ready for 3 new store files.

### Established Patterns
- Named exports only (ESLint enforced)
- Pre-commit hooks: lint + typecheck + tests (Phase 2)
- Test files colocated with source (*.test.ts beside *.ts)
- `cn()` utility for className composition
- Constitution enforcement active on all new code

### Integration Points
- Stores will be consumed by Phase 5 (WebSocket bridge updates connection + stream stores)
- Stores will be consumed by Phase 6 (streaming engine reads stream store, writes timeline on flush)
- Stores will be consumed by Phase 8 (sidebar reads timeline sessions, useSessionSwitch hook coordinates stores)
- Types will be imported by every component that touches state

</code_context>

<specifics>
## Specific Ideas

- Immer on timeline only is the sweet spot -- readable mutations where nesting is deep, zero overhead where it isn't
- Metadata-only persistence means localStorage is never a bottleneck, backend stays source of truth
- Full M1-M5 types now means future milestones can focus on implementation, not type design
- External hook coordination prevents the circular dependency trap that kills multi-store architectures
- Version + migrate from day one prevents the "poisoned localStorage" problem that bites after the first schema change

</specifics>

<deferred>
## Deferred Ideas

- **Background streaming on session switch**: Types support it, but behavior deferred to M4 multi-provider (POWER-02)
- **Per-provider stream state**: StreamStore designed for single-stream in M1. M4 will key streams by ProviderId.

</deferred>

---

*Phase: 04-state-architecture*
*Context gathered: 2026-03-05*
