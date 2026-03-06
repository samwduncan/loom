# Phase 9: E2E Integration Wiring + Playwright Verification - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning
**Source:** Claude + Gemini Architect debate (2 rounds, code-verified)

<domain>
## Phase Boundary

Phase 9 closes 2 integration gaps and 3 broken E2E flows found by the v1.0 milestone audit. All 28 requirements pass at unit level, but the production `/chat` route is non-functional because:
1. `initializeWebSocket()` is never called outside ProofOfLife.tsx
2. SessionList click handler updates store but doesn't navigate (URL doesn't change, ChatView never loads)

Additionally, ChatComposer has a UX gap where the first message in a new chat has no optimistic display (input clears, blank screen until backend responds).

After fixing wiring, Playwright E2E tests verify the 6 human-verification items deferred from Phase 7.

</domain>

<decisions>
## Implementation Decisions

### WebSocket Initialization (INT-01 fix)
- Call `initializeWebSocket()` in `main.tsx` before `createRoot()`, fire-and-forget (no await)
- Rationale: Infrastructure init before React tree. Connection store tracks state reactively. isInitialized guard handles idempotency. No await because: no white screen while connecting, components react to connection state naturally, backend-down doesn't block app render.
- Do NOT put in App.tsx useEffect (error boundaries don't catch useEffect errors anyway, and it muddies the separation)

### SessionList Navigation (INT-02 fix)
- Add `useNavigate()` + `navigate(\`/chat/${sessionId}\`)` directly in `handleSessionClick`
- Do NOT use `useSessionSwitch` from SessionList (would double-fetch — ChatView already reacts to URL change)
- SessionList owns navigation intent; ChatView owns reaction to URL change

### Optimistic First Message (Ghost Message fix)
- ChatComposer.tsx line 67: `if (sessionId)` guard prevents optimistic message in new chats
- Fix: Create a local stub session before sending the WS command, add optimistic message to it
- When `session-created` fires back from backend, reconcile the stub with the real session ID

### projects_updated Wiring
- Currently no-op at stream-multiplexer.ts:282-284
- Add `onProjectsUpdated` callback to MultiplexerCallbacks
- Wire in websocket-init.ts to trigger session list refetch
- Keep it simple — just re-fetch, no incremental updates

### Playwright E2E Strategy
- Real backend (not mocked WebSocket) — mocking defeats E2E purpose
- Config at `src/playwright.config.ts`
- Tests in `src/e2e/` directory
- Before suite: ensure dev server + backend running
- Auth handled naturally by bootstrapAuth() auto-registration
- CLS assertion: `page.evaluate` measuring scrollHeight delta during ActiveMessage finalization
- 6 test areas: streaming, session switching, new chat, tool calls, thinking blocks, scroll anchor

### Claude's Discretion
- Playwright dependency management (which package, version)
- Exact test file organization within src/e2e/
- Whether to use Playwright's built-in webServer config or manual server management
- Error message content for connection failures
- projects_updated refetch debouncing (if needed)

</decisions>

<specifics>
## Specific Ideas

### Key File References (from code exploration)
- `src/src/main.tsx` — Entry point, add initializeWebSocket() here
- `src/src/lib/websocket-init.ts` — async, no args needed, has isInitialized guard
- `src/src/components/sidebar/SessionList.tsx:48-53` — handleSessionClick missing navigate()
- `src/src/components/chat/composer/ChatComposer.tsx:67` — sessionId guard blocks optimistic first msg
- `src/src/lib/stream-multiplexer.ts:282-284` — projects_updated no-op
- `src/src/stores/stream.ts` — activeSessionId tracks backend session

### Verified Non-Issues (Gemini hallucinations, code-checked)
- ActiveMessage finalization handshake is CORRECT — MessageList.tsx uses showActiveMessage state driven by onFinalizationComplete callback, NOT isStreaming
- MessageContainer padding is CORRECT — identical px-4 py-3 for both streaming and finalized messages, explicit CLS prevention design

</specifics>

<deferred>
## Deferred Ideas

- projects_updated incremental updates (just refetch for now)
- Playwright visual regression testing (screenshot comparison)
- Performance benchmarks in E2E (token throughput measurement)

</deferred>

---

*Phase: 09-e2e-integration-wiring*
*Context gathered: 2026-03-06 via Claude + Gemini Architect debate*
