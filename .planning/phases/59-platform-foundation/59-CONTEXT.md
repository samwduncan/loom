# Phase 59: Platform Foundation - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning
**Mode:** Auto-resolved (infrastructure phase — requirements concrete, no UX taste decisions)

<domain>
## Phase Boundary

App can communicate with the Express backend from both web (same-origin) and Capacitor bundled (remote server) modes without code changes. Create a centralized platform detection and URL construction module. Refactor all fetch/WebSocket calls to route through it. Add Capacitor origin to CORS whitelist.

**This phase does NOT implement Capacitor plugins, native features, or iOS-specific UI** — it's purely the URL/platform abstraction layer that all subsequent mobile phases depend on.

</domain>

<decisions>
## Implementation Decisions

### Platform Detection
- **D-01:** Runtime detection via `typeof window.Capacitor !== 'undefined'` — no tight coupling to `@capacitor/core` API semantics
- **D-02:** Single `platform.ts` module exports `IS_NATIVE`, `API_BASE`, `WS_BASE` — all platform logic lives here
- **D-03:** Platform checks ONLY in `platform.ts` — UI components remain platform-unaware
- **D-04:** No build-time detection (no separate Vite configs per target) — runtime detection is correct for exploratory phase

### URL Construction
- **D-05:** `resolveApiUrl(path: string): string` — returns relative path on web, absolute URL on Capacitor
- **D-06:** `resolveWsUrl(path?: string): string` — returns `wss://host/ws` on web (from `window.location`), absolute `ws://server/ws` on Capacitor
- **D-07:** `resolveShellWsUrl(): string` — same pattern for `/shell` endpoint
- **D-08:** API base URL hardcoded as `http://100.86.4.57:5555` with `VITE_API_URL` env var override for flexibility
- **D-09:** Web mode returns empty string for API_BASE (preserving current relative-path behavior — zero behavioral change)

### Fetch Migration
- **D-10:** Create `fetchAnon()` utility for unauthenticated calls (auth bootstrap) — separate from `apiFetch()` which requires a token
- **D-11:** Refactor `auth.ts` to use `fetchAnon()` with `resolveApiUrl()` — eliminates 3 direct `fetch('/api/...')` calls
- **D-12:** Refactor `useUsageMetrics.ts` to use `apiFetch()` — eliminates 2 direct `fetch('/api/...')` calls
- **D-13:** `apiFetch()` in `api-client.ts` calls `resolveApiUrl(path)` before `fetch()` — single integration point

### WebSocket Migration
- **D-14:** `websocket-client.ts` connect() uses `resolveWsUrl()` instead of building from `window.location`
- **D-15:** `shell-ws-client.ts` connect() uses `resolveShellWsUrl()` — both WS clients updated (easy to miss one)
- **D-16:** WS reconnection path in `websocket-client.ts` also updated (reconnect uses same URL helper)

### CORS Configuration
- **D-17:** Add `capacitor://localhost` to Express CORS origin whitelist in `server/index.js`
- **D-18:** Add debug log on backend for unrecognized CORS origins during development (remove before v2.2)

### Capacitor Config
- **D-19:** Create minimal `capacitor.config.ts` in `src/` (Vite webDir = `dist`)
- **D-20:** Explicitly disable `CapacitorHttp` plugin in config — it patches global `fetch()` and breaks WebSocket upgrade
- **D-21:** App ID: `com.samsara.loom`, app name: `Loom`
- **D-22:** Do NOT run `cap add ios` in this phase — that's Phase 63's domain. Config file only.

### Claude's Discretion
- JSDoc depth in platform.ts (minimal vs comprehensive)
- Whether to add an ESLint rule preventing bare `fetch('/api/...')` or rely on grep check
- Exact error handling in `fetchAnon()`
- Whether to create a `resolveApiUrl.test.ts` unit test or rely on existing integration tests

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Platform Abstraction
- `.planning/ROADMAP.md` §Phase 59 — Success criteria and requirements mapping
- `.planning/REQUIREMENTS.md` §Platform Foundation — PLAT-01 through PLAT-04
- `.planning/STATE.md` §Decisions — Prior v2.1 platform architecture decisions

### Files to Modify
- `src/src/lib/api-client.ts` — Current `apiFetch()` with relative paths (integration point for `resolveApiUrl`)
- `src/src/lib/websocket-client.ts` — WS URL construction at line 63-64 and reconnect path
- `src/src/lib/shell-ws-client.ts` — Shell WS URL construction at line 71-72
- `src/src/lib/auth.ts` — Direct `fetch()` calls at lines 77, 81, 94 (bootstrap auth)
- `src/src/hooks/useUsageMetrics.ts` — Direct `fetch()` calls at lines 40, 93
- `server/index.js` — CORS config at line 339-341

### Architecture Constraints
- `.planning/V2_CONSTITUTION.md` — Coding conventions (named exports only, no default exports)
- `.planning/BACKEND_API_CONTRACT.md` — API endpoint paths that the URL helper must support

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `api-client.ts` `apiFetch()` — already centralizes auth header injection and request dedup; just needs `resolveApiUrl()` call added
- `auth.ts` `bootstrapAuth()` — well-structured, clear separation of register vs login flow
- `websocket-init.ts` `initializeWebSocket()` — app-startup entry point, matches proposed `native-plugins.ts` init pattern

### Established Patterns
- Zustand stores accessed via `getState()` outside React (websocket-init.ts pattern)
- Module-scoped singletons (wsClient, inflightRequests map)
- Constitution 2.2: named exports only, no default exports
- `VITE_IS_PLATFORM` env var exists in auth.ts — precedent for build-time platform env vars

### Integration Points
- `src/src/main.tsx` line 9: `void initializeWebSocket()` — platform.ts must be importable before this
- `api-client.ts` `doFetch()` function — where `resolveApiUrl()` integration happens
- `server/index.js` `app.use(cors({...}))` — where Capacitor origin is added

</code_context>

<specifics>
## Specific Ideas

- Web mode must have ZERO behavioral change — `resolveApiUrl('/api/foo')` returns `'/api/foo'` (empty base + path = same relative fetch)
- The three-tier proxy (Tailscale Serve → nginx → Express) means Capacitor can target either the public HTTPS endpoint or the direct Express port; direct is simpler for now
- `fetchAnon()` should be minimal — no dedup, no retry, just `fetch(resolveApiUrl(path), options)` with Content-Type header

</specifics>

<quality_bar>
## Quality Bar (Bard Assessment)

**Good:** Phase ships with success criteria met — Capacitor app can talk to Express, web still works.

**World-class (what to aim for):**
- `platform.ts` has clear JSDoc with examples showing web vs Capacitor behavior
- Grep for `fetch('/api` in `src/` returns 0 results (all calls routed through helpers)
- Both WebSocket clients (chat + shell) tested with URL helper
- `capacitor.config.ts` documents why CapacitorHttp is disabled
- New unit tests: "Capacitor bundled app resolves absolute URLs" + "Web app uses relative URLs"
- Backend logs unrecognized CORS origins for debugging (removed before shipping)

**Key risk to watch:** WebSocket reconnection path — `websocket-client.ts` reconnect() at line ~301 rebuilds the URL separately from connect(). Both must use the same URL helper or reconnection breaks silently on Capacitor.

</quality_bar>

<deferred>
## Deferred Ideas

- ESLint custom rule to prevent bare `fetch('/api/...')` calls — nice but not essential for Phase 59
- Dynamic server URL discovery from backend response — unnecessary when server URL is known
- Separate Vite build configs per platform — premature; runtime detection sufficient for now
- `cap add ios` and iOS project setup — Phase 63 scope

</deferred>

---

*Phase: 59-platform-foundation*
*Context gathered: 2026-03-28*
