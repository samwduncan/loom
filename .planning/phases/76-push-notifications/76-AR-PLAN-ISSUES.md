# Adversarial Plan Review — Phase 76

**Tier:** max
**Date:** 2026-04-04
**Agents:** Guard (Sonnet), Hunter (Opus), Architect (Opus), Bard (Gemini), Cody (Codex)
**Findings:** 51 raw, 8 S+ after dedup (2 SS, 6 S)

## S+ Issues (Must Fix)

### [SS-1] Session name shows UUID in notification title
**Source:** Guard, Architect, Hunter, Cody, Bard (5/5 agents) | **Confidence:** Very High
**Plan:** 76-01, Task 2
**Description:** `_triggerPushIfNeeded` uses `data.sessionId || 'Session'` as sessionName. The `claude-complete` event payload has no human-readable session name — only UUID. Every notification title will be a cryptic UUID like `01JQ7VZ3...`. D-21 specifies `title = sessionName`.
**Suggested fix:** Resolve session name from cache DB (`SELECT summary FROM sessions WHERE id = ?`) or add sessionName to the WS event payload in `claude-sdk.js`. Add `getSessionName(sessionId)` helper to PushService.

### [SS-2] `app-state` not in ClientMessage union type — TS build failure
**Source:** Architect, Hunter, Cody (3/5 agents) | **Confidence:** Very High
**Plan:** 76-04, Task 1
**Description:** Plan 04 sends `{ type: 'app-state' }` via `wsClient.send()` but `app-state` is not in `ClientMessage` union in `shared/types/websocket.ts`. TypeScript will reject the call. Also `wsClient.isConnected()` doesn't exist — must use `wsClient.getState() === 'connected'`.
**Suggested fix:** Add `| { type: 'app-state'; foreground: boolean; viewingSessionId: string | null }` to `ClientMessage` in `shared/types/websocket.ts`. Add file to Plan 04 `files_modified`. Replace `isConnected()` with `getState() === 'connected'`.

### [S-3] UI-SPEC "Behavior" section contradicts Plan 03
**Source:** Guard, Architect (2/5 agents) | **Confidence:** High
**Plan:** 76-03 / 76-UI-SPEC.md
**Description:** UI-SPEC includes "BEHAVIOR" section with batch toggle. Plan 03 explicitly excludes it (correct per D-04). Executor will have contradictory specs.
**Suggested fix:** Remove "Behavior" section from UI-SPEC before execution.

### [S-4] Plans 02/03 wave 1 parallelism broken — push-preferences.ts dependency
**Source:** Guard, Architect, Hunter (3/5 agents) | **Confidence:** High
**Plan:** 76-02, 76-03
**Description:** Plan 03 imports from `push-preferences.ts` (created by Plan 02 Task 1) and adds `getPushToken`/`setPushToken` to it. Both are wave 1 with `depends_on: []`. Parallel execution will fail.
**Suggested fix:** Move `getPushToken`/`setPushToken` into Plan 02 Task 1 (where push-preferences.ts is created). This eliminates Plan 03's need to modify the file.

### [S-5] `setPushToken()` never called — settings sync always gets null
**Source:** Cody, Bard (2/5 agents) | **Confidence:** High
**Plan:** 76-02, Task 2
**Description:** `useNotifications` registers push token and sends to backend, but never calls `setPushToken(token)` to persist in MMKV. Plan 03's settings screen calls `getPushToken()` which returns null. `syncPreferenceToBackend` silently fails.
**Suggested fix:** Plan 02 Task 2 must call `setPushToken(token)` after successful registration. Add to acceptance criteria.

### [S-6] TOOL_APPROVAL_TIMEOUT_MS is 55s, not 120s per D-07
**Source:** Hunter (1 agent, code-verified) | **Confidence:** High
**Plan:** 76-01 or 76-04
**Description:** D-07 requires 120s timeout for cold-start permission approval. Actual `TOOL_APPROVAL_TIMEOUT_MS` in `server/claude-sdk.js` is 55s. Cold-start flow (boot + auth + WS + drain) easily takes 10-30s, leaving razor-thin margin.
**Suggested fix:** Add task to update `TOOL_APPROVAL_TIMEOUT_MS` default to 120000 in `server/claude-sdk.js`. Add file to `files_modified`.

### [S-7] `wsClient.isConnected()` doesn't exist — runtime error
**Source:** Hunter (1 agent, code-verified) | **Confidence:** High
**Plan:** 76-04, Task 1
**Description:** `WebSocketClient` has no `isConnected()` method. Only `getState()` returning `WsConnectionState`. Plan 04 uses `isConnected()` in app-state reporting code.
**Suggested fix:** Replace `wsClient.isConnected()` with `wsClient.getState() === 'connected'` everywhere in Plan 04.

### [S-8] Cold-start handleNotificationResponse calls API before auth
**Source:** Guard, Cody, Bard (3/5 agents) | **Confidence:** High
**Plan:** 76-02, Task 2
**Description:** Module-level listener fires `handleNotificationResponse` before React mounts, before auth completes. If it calls `apiClient.get('/api/projects')` for session validation, the JWT is not loaded yet — request fails. Need to separate "store response" from "act on response."
**Suggested fix:** Module-level listener should ONLY store the response. Session validation + navigation should only happen inside useEffect 3 (after auth gate in AuthenticatedApp).

## A-Grade Notes (Should Fix During Execution)

- **Codex session events (`codex-complete`/`codex-error`) not handled** — Hunter
- **Logout token cleanup missing** — Bard
- **Suppression check at queue time vs send time** — Guard
- **MMKV queue drain race (lost approvals on WS flap)** — Hunter
- **Duplicate push from multiple WebSocketWriter instances** — Architect
- **In-app banner suppression not checking viewingSessionId** — Bard
- **setCurrentViewingSessionId(null) race on session-to-session nav** — Cody
- **Stale MMKV approvals never expire** — Hunter
- **Deep link fetches entire project tree for one session** — Architect
- **removeClient(wsId) needs reverse index or userId param** — Guard
- **Batch timer resets indefinitely (no max hold cap)** — Cody
- **expo-blur dependency not verified** — Cody
- **Notification category action identifiers not spelled out** — Bard

## B-Grade Notes (Minor)

- Token ownership on DELETE/PATCH (single-user mitigated) — Guard, Hunter, Cody
- shouldSuppressPush/isUserViewingSession redundancy — Architect
- WS send mechanism unspecified in queue drain — Guard, Architect, Cody
- import path for useConnectionStore unverified — Guard, Cody
- push-preferences.ts not in Plan 03 files_modified — Guard, Cody
- Verification commands mask real errors — Cody
- Plan 04 autonomous:false vs auto task types — Architect

## Verification: PASSED (2026-04-04)

All 7 actionable S+ issues addressed by planner revision. Haiku verification pass: 0 remaining issues.
UI-SPEC batch toggle section removed (S-3). All other fixes in plan text with acceptance criteria.
