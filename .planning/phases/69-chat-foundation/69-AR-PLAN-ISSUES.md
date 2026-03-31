# Adversarial Plan Review -- Phase 69

**Tier:** deep
**Date:** 2026-03-31
**Agents:** Guard (Sonnet), Hunter (Sonnet), Architect (Sonnet)
**Findings:** 14 deduplicated (3 SSS, 3 SS, 2 S, 6 A-grade)

## Critical Issues (S+ grade)

### [SSS-1] Store API phantom methods -- Plan 01 wiring uses fabricated method names
**Source:** All 3 agents | **Confidence:** High
**Plan:** 69-01, Task 1 Step 8
**Description:** The multiplexer callback wiring in Plan 01 uses store action names that do not exist:
- `useStreamStore.getState().appendContentToken` -- does not exist
- `useStreamStore.getState().setThinkingBlock` -- actual: `setThinkingState`
- `useStreamStore.getState().completeToolCall` -- actual: `updateToolCall`
- `useConnectionStore.getState().updateStatus` -- actual: `updateProviderStatus('claude', status)`
- `useConnectionStore.getState().setError` -- actual: `setProviderError`
- `useTimelineStore.getState().refreshSession` -- does not exist
- `useTimelineStore.getState().setActiveSessions` -- does not exist
**Fix:** Replace all fabricated names with real store actions. Executor MUST read `shared/stores/stream.ts`, `shared/stores/connection.ts`, `shared/stores/timeline.ts` to get actual method signatures.

### [SSS-2] MultiplexerCallbacks interface incomplete -- 8 of 17 required callbacks missing
**Source:** Hunter + Architect | **Confidence:** High
**Plan:** 69-01, Task 1 Step 8
**Description:** Plan 01 provides 10 callbacks for `routeServerMessage` but the real `MultiplexerCallbacks` interface in `shared/lib/stream-multiplexer.ts` has 17. Missing: `onTokenBudget`, `onPermissionRequest`, `onPermissionCancelled`, `onResultData`, `onProjectsUpdated`, `onLiveSessionData`, `onLiveSessionAttached`, `onLiveSessionDetached`. TypeScript will refuse to compile.
**Fix:** Add all missing callbacks as explicit no-ops for Phase 69 scope. `onPermissionRequest` is security-relevant -- must be at least a no-op, not silently omitted.

### [SSS-3] Wave 1 hidden dependency -- Plan 02 imports from Plan 01 artifact
**Source:** Guard + Hunter | **Confidence:** High
**Plan:** 69-02
**Description:** Plan 02 (wave 1, `depends_on: []`) imports `initializeWebSocket` from `mobile/lib/websocket-init.ts`, which Plan 01 creates. If executed in parallel, Plan 02 fails at import resolution.
**Fix:** Add `depends_on: [69-01]` to Plan 02 and move to wave 2, OR split Plan 02 Task 1 (auth hooks, independent) from Task 2 (root layout, depends on Plan 01).

### [SS-4] disconnect() nulls token -- reconnection permanently broken after background
**Source:** Hunter | **Confidence:** High
**Plan:** 69-01, Task 1 Step 8
**Description:** Plan instructs `wsClient.disconnect()` after 30s background timer. `disconnect()` sets `this.token = null`. On foreground, `tryReconnect()` checks `if (!this.token) return` and silently exits. CHAT-11 broken after first background cycle > 30s.
**Fix:** Use `wsClient.ws?.close(1000)` instead of `disconnect()`, or re-inject token from `nativeAuthProvider.getToken()` before calling `tryReconnect()`. Add a `suspend()` method concept.

### [SS-5] createSession() returns void -- navigation uses undefined sessionId
**Source:** Guard | **Confidence:** High
**Plan:** 69-03, Task 1
**Description:** `createSession()` fires a WS command and returns void. `ProjectPicker` calls it then navigates to `chat/${sessionId}` -- but sessionId is undefined because the session ID comes asynchronously from `onSessionCreated` callback.
**Fix:** Either return `Promise<string>` that resolves from `onSessionCreated`, or navigate from the `onSessionCreated` callback itself (not from the UI trigger).

### [SS-6] clearToken stores empty string instead of deleting
**Source:** Guard + Hunter | **Confidence:** High
**Plan:** 69-02, Task 1
**Description:** `clearToken: () => SecureStore.setItem(TOKEN_KEY, '')` stores empty string. `getToken()` returns `'' || null` = null (works by accident). But proper API is `SecureStore.deleteItemAsync(TOKEN_KEY)`.
**Fix:** Use `deleteItemAsync` for proper Keychain cleanup.

### [S-7] Dual Drawer nesting -- root layout and (drawer)/_layout.tsx both configure Drawer
**Source:** Architect | **Confidence:** High
**Plan:** 69-02, Task 2
**Description:** Plan 02 root `_layout.tsx` wraps with `<Drawer>`. Plan 03 `(drawer)/_layout.tsx` is also a `<Drawer>`. Expo Router will see two competing drawer navigators.
**Fix:** Root `_layout.tsx` should use `<Slot />` or `<Stack>`, not `<Drawer>`. The Drawer belongs exclusively in `(drawer)/_layout.tsx`.

### [S-8] D-28 files_modified gap in Plan 05
**Source:** All 3 agents | **Confidence:** High
**Plan:** 69-05
**Description:** Plan 05 Task 1 item 7 modifies `MessageBubble.tsx` and `websocket-init.ts` for D-28 but neither is in `files_modified`. Store schema changes (`isInterrupted` field) need to be in Plans 01/04, not discovered in Plan 05.
**Fix:** Add `mobile/components/chat/MessageBubble.tsx` and `mobile/lib/websocket-init.ts` to Plan 05's `files_modified`.

## Significant Issues (A-grade)

### [A-1] Streamdown PoC is predetermined -- D-02 requires GFM tables, streamdown has none
**Source:** Architect + Hunter | **Confidence:** High
**Description:** The parallel evaluation (Plan 01 Task 2) will fail streamdown on the table test because streamdown only supports CommonMark. The PoC outcome is known. Entire worklets/remend dependency chain is risk for no benefit.
**Fix:** Skip streamdown path. Use react-native-enriched-markdown directly. Remove streamdown deps + PoC components.

### [A-2] useConnection reads flat `status` that doesn't exist on store
**Source:** Hunter + Architect | **Confidence:** High
**Description:** ConnectionStore has `providers: Record<ProviderId, ProviderConnection>`, not a flat `status` field. `useConnection` as designed returns undefined.
**Fix:** Read `state.providers.claude.status` instead.

### [A-3] ConnectionBanner flashes on cold start
**Source:** Hunter | **Confidence:** Medium
**Description:** Status starts as `disconnected`, satisfying render condition, before WebSocket connects.
**Fix:** Add `hasConnectedOnce` ref; only show banner after first successful connection.

### [A-4] Stale JWT no recovery path
**Source:** All 3 agents | **Confidence:** High
**Description:** `checkAuth()` trusts any non-null Keychain token without validation. Expired JWT = authenticated but can't connect. No path to re-auth.
**Fix:** Handle WS close code 401/4001 by clearing token and showing AuthPrompt.

### [A-5] createSession sends empty claude-command
**Source:** Hunter + Guard | **Confidence:** Medium
**Description:** `createSession()` sends `{ type: 'claude-command', command: '' }`. May burn tokens or error. Should verify against BACKEND_API_CONTRACT.md for correct session creation API.
**Fix:** Read backend contract. Likely needs REST POST to `/api/projects/:name/sessions`.

### [A-6] Root layout blank during async checkAuth()
**Source:** Guard | **Confidence:** High
**Description:** No loading state defined. `isLoading=true` falls into Drawer branch, briefly flashing main app to unauthenticated user.
**Fix:** Three-way render: `isLoading ? <Splash/> : !isAuthenticated ? <AuthPrompt/> : <Drawer/>`.

## Lower-Grade Notes (B/C)

- Version discrepancies in Plan 01 install commands vs research (worklets, remend, enriched-markdown versions)
- ScrollView for session list (50+ items without virtualization)
- Type duplication in useSessions vs shared/types/session.ts
- Staggered animation code uses invalid Reanimated API mixing
- CHAT-08 (60fps at 50+ messages) unowned across all plans
- Pinned sessions MMKV-local conflicts with future server-backed pins
- FlashList acceptance criterion allows FlatList fallback without justification
- Reanimated Layout Animation `.springify().damping(22)` bypasses centralized SPRING constants
- reduce-motion (NATIVE-08) mentioned in prose but not in acceptance criteria
- CHAT-12 (120Hz keyboard) deferred to Phase 70 but mechanism built in Phase 69 with no verification
