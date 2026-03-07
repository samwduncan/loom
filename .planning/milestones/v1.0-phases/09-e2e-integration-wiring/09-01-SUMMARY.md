---
phase: 09-e2e-integration-wiring
plan: 01
subsystem: ui
tags: [react, websocket, zustand, react-router, integration]

# Dependency graph
requires:
  - phase: 08-navigation-sessions
    provides: SessionList, ChatComposer, ChatView, useSessionList, websocket-init
  - phase: 07-tool-registry-proof-of-life
    provides: stream-multiplexer, websocket-init with onSessionCreated
provides:
  - Fire-and-forget WebSocket init in main.tsx (no manual /dev/proof-of-life visit required)
  - Sidebar session click navigates to /chat/:sessionId
  - projects_updated WebSocket event triggers session list refetch
  - Optimistic stub session for new chats with backend reconciliation
affects: [09-02-PLAN, chat-e2e, streaming, session-management]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Stub session reconciliation (stub-* prefix -> replaceState on session-created)
    - Window CustomEvent bridge (loom:projects-updated) between WebSocket infra and React hooks
    - Ref-based stable callbacks for event listeners (avoids set-state-in-effect ESLint rule)

key-files:
  created: []
  modified:
    - src/src/main.tsx
    - src/src/components/sidebar/SessionList.tsx
    - src/src/components/chat/composer/ChatComposer.tsx
    - src/src/lib/stream-multiplexer.ts
    - src/src/lib/websocket-init.ts
    - src/src/hooks/useSessionList.ts
    - src/src/lib/stream-multiplexer.test.ts
    - src/src/components/sidebar/SessionList.test.tsx
    - src/src/lib/websocket-init.test.ts
    - src/src/components/chat/composer/ChatComposer.test.tsx

key-decisions:
  - "useSessionList refetch uses ref-based callbacks (no setState) to satisfy react-hooks/set-state-in-effect ESLint rule"
  - "Stub session reconciliation uses window.history.replaceState instead of navigate() to avoid ChatView URL effect double-fetch"
  - "onProjectsUpdated wired through window CustomEvent bridge to decouple WebSocket infra from React hooks"

patterns-established:
  - "Stub session pattern: create stub-* session for instant UX, reconcile on session-created"
  - "Window CustomEvent bridge: WebSocket infra dispatches CustomEvent, hooks listen via addEventListener"

requirements-completed: [STRM-01, STRM-02, NAV-01, NAV-02]

# Metrics
duration: 8min
completed: 2026-03-06
---

# Phase 9 Plan 01: E2E Integration Wiring Summary

**Wired 4 disconnected integration points (WS init, sidebar navigate, projects_updated, stub sessions) so /chat route works end-to-end**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-06T21:43:11Z
- **Completed:** 2026-03-06T21:51:39Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- WebSocket connection now initializes automatically on app load (fire-and-forget in main.tsx)
- Sidebar session clicks navigate to /chat/:sessionId (was only setting store state before)
- projects_updated WebSocket events trigger session list refetch via CustomEvent bridge
- New chats create an optimistic stub session immediately, reconciled when backend responds

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire WebSocket init + SessionList navigation + projects_updated** - `cee0873` (feat)
2. **Task 2: ChatComposer optimistic stub session for new chats** - `a467d26` (feat)

## Files Created/Modified
- `src/src/main.tsx` - Added fire-and-forget initializeWebSocket() before createRoot()
- `src/src/components/sidebar/SessionList.tsx` - Added useNavigate, navigate on session click
- `src/src/lib/stream-multiplexer.ts` - Added onProjectsUpdated to MultiplexerCallbacks interface
- `src/src/lib/websocket-init.ts` - Added onProjectsUpdated callback + stub session reconciliation
- `src/src/hooks/useSessionList.ts` - Added loom:projects-updated event listener for refetch
- `src/src/components/chat/composer/ChatComposer.tsx` - Added stub session creation + navigate for new chats
- `src/src/lib/stream-multiplexer.test.ts` - Added projects_updated routing test
- `src/src/components/sidebar/SessionList.test.tsx` - Added navigate test
- `src/src/lib/websocket-init.test.ts` - Added projects_updated dispatch + stub reconciliation tests
- `src/src/components/chat/composer/ChatComposer.test.tsx` - Added 4 stub session tests

## Decisions Made
- **Ref-based refetch for event listener:** The `loom:projects-updated` event handler uses refs for `projectName` and `addSession` instead of including them in useCallback deps. This avoids the `react-hooks/set-state-in-effect` ESLint rule which flags any setState call reachable from an effect body. The refetch path (event-driven) intentionally does not update loading/error state since it's a background refresh.
- **replaceState over navigate:** Stub session reconciliation uses `window.history.replaceState` instead of React Router's `navigate()` to update the URL from `/chat/stub-*` to `/chat/real-id`. Using `navigate()` would trigger ChatView's `useParams()` effect and cause a redundant message fetch.
- **Window CustomEvent bridge:** The `loom:projects-updated` event goes through `window.dispatchEvent(new CustomEvent(...))` rather than a direct store call. This keeps the WebSocket infrastructure (websocket-init.ts) decoupled from the session-fetching hook (useSessionList.ts), which lives in the React layer.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] projects_updated ServerMessage type requires additional fields**
- **Found during:** Task 1
- **Issue:** Test created `{ type: 'projects_updated' }` but TypeScript requires `projects`, `timestamp`, `changeType`, `changedFile`, `watchProvider` fields
- **Fix:** Added all required fields to test fixture objects
- **Files modified:** stream-multiplexer.test.ts, websocket-init.test.ts
- **Verification:** TypeScript compilation passes
- **Committed in:** cee0873

**2. [Rule 3 - Blocking] react-hooks/set-state-in-effect ESLint rule on useSessionList refetch**
- **Found during:** Task 1
- **Issue:** Extracting fetchSessions as useCallback with setState calls triggered ESLint error when called from useEffect
- **Fix:** Split into inline async (mount) and ref-based refetch (event listener) to avoid ESLint violation
- **Files modified:** useSessionList.ts
- **Verification:** ESLint passes, all tests pass
- **Committed in:** cee0873

**3. [Rule 3 - Blocking] ChatComposer.test.tsx needed MemoryRouter + useNavigate mock**
- **Found during:** Task 2
- **Issue:** Adding useNavigate to ChatComposer broke existing tests (missing Router context)
- **Fix:** Added MemoryRouter wrapper via renderComposer() helper, mocked useNavigate
- **Files modified:** ChatComposer.test.tsx
- **Verification:** All 14 ChatComposer tests pass
- **Committed in:** a467d26

**4. [Rule 3 - Blocking] Non-null assertion ASSERT comments required**
- **Found during:** Task 2
- **Issue:** `sessions[0]!.id` flagged by loom/no-non-null-without-reason ESLint rule
- **Fix:** Added `// ASSERT: length check above guarantees sessions[0] exists` comments
- **Files modified:** ChatComposer.test.tsx
- **Verification:** ESLint passes
- **Committed in:** a467d26

---

**Total deviations:** 4 auto-fixed (4 blocking issues)
**Impact on plan:** All auto-fixes necessary to satisfy TypeScript compiler and ESLint rules. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 4 integration gaps are closed
- /chat route is wired for end-to-end WebSocket streaming
- 367 tests passing (8 new, 0 regressions)
- Ready for 09-02 (Playwright E2E verification)

---
*Phase: 09-e2e-integration-wiring*
*Completed: 2026-03-06*
