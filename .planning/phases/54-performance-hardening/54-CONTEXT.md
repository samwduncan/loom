# Phase 54: Performance Hardening - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

Every interaction feels instant through request deduplication, optimistic UI updates, lazy panel mounting, and skeleton loading states. This is about perceived performance — making the app feel snappy even when network/disk operations take time.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion. Key constraints:

- PERF-01: Request deduplication via `Map<string, Promise>` pattern in api-client.ts. Same concurrent URL returns same promise.
- PERF-02: Optimistic updates for session delete/rename/pin — update UI immediately, rollback on error. Apply in SessionList or timeline store actions.
- PERF-03: Terminal and Git panels already use React.lazy(). Verify they don't mount until first tab visit. If they mount eagerly (via CSS show/hide pattern), convert to true lazy mounting.
- PERF-04: Skeleton loading states already exist for some components (MessageListSkeleton, GitPanelSkeleton, TerminalSkeleton). Audit for any async content that shows blank/flash instead of skeleton. Zero layout shifts means skeleton dimensions match final content.
- ContentArea uses CSS show/hide (mount-once pattern) which conflicts with lazy mounting. PERF-03 may need to convert panels to lazy-mount-on-first-visit pattern while preserving state for subsequent visits.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/src/lib/api-client.ts` — `apiFetch()` function, good place for dedup
- `src/src/stores/timeline.ts` — Session operations (delete, rename) happen here
- `src/src/components/content-area/view/ContentArea.tsx` — CSS show/hide mount-once pattern
- `src/src/components/shared/Skeleton.tsx` — Existing skeleton primitive

### Established Patterns
- React.lazy() for code splitting (TerminalPanel, GitPanel, SettingsModal, CommandPalette)
- Mount-once CSS show/hide via `hidden` class — preserves terminal sessions and editor state
- Skeleton components use `cn()` and design tokens

### Integration Points
- api-client.ts for request dedup
- Timeline store actions for optimistic updates
- ContentArea for lazy mounting strategy

</code_context>

<specifics>
## Specific Ideas

- Dedup map should auto-clean entries after promise resolves (weak reference or timeout)
- Optimistic rollback can use Zustand's `set()` with captured previous state
- Layout shift measurement: compare skeleton height vs loaded content height

</specifics>

<deferred>
## Deferred Ideas

None — phase scope is well-defined.

</deferred>
