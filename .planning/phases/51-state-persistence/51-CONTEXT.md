# Phase 51: State Persistence - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

Users return to exactly where they left off after closing and reopening the browser. Last-viewed session restores on reload, scroll position restores per session, sidebar state and active project survive restart.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — infrastructure phase. Key constraints:

- PERSIST-01: Store last-viewed sessionId + projectName in Zustand persist (UI store or timeline store)
- PERSIST-02: Save scroll position per session on scroll events (throttled), restore on session switch. Use sessionStorage or localStorage keyed by sessionId.
- PERSIST-03: Sidebar open/collapsed already persists (UI store v7). Active project needs to be added to persistence.
- PERSIST-04: Permission mode already persists (UI store v7, implemented this session).
- Existing Zustand persist middleware handles localStorage with version migrations — extend the existing stores, don't create new persistence mechanisms.
- Use the timeline store's persist middleware for session-related state, UI store for layout state.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `stores/ui.ts` — Already persists sidebarOpen, theme, thinkingExpanded, autoExpandTools, showRawParams, permissionMode via Zustand persist v7
- `stores/timeline.ts` — Has persist middleware but only for session metadata, not last-viewed state
- `hooks/useSessionSwitch.ts` — Handles session switching, good integration point for scroll save/restore
- `hooks/useScrollAnchor.ts` — Existing scroll tracking hook

### Established Patterns
- Zustand persist with version migrations (see ui.ts versions 1-7)
- `partialize` to select which fields persist
- `merge` for safe rehydration with defaults

### Integration Points
- ChatView reads sessionId from URL params — on reload, need to redirect to last-viewed session
- App.tsx has a catch-all route that redirects to `/chat` — modify to redirect to last-viewed session
- ContentArea already persists activeTab (but may not survive reload)

</code_context>

<specifics>
## Specific Ideas

- Scroll position should be saved on `scroll` event (throttled to ~200ms) and on session switch
- Restore scroll position AFTER messages are loaded (not before, or scroll target doesn't exist)
- Clear saved scroll position when session is deleted

</specifics>

<deferred>
## Deferred Ideas

- IndexedDB for message caching (evaluate after SQLite cache proves the perf win)
- Cross-device state sync (only relevant if multi-device support added)

</deferred>
