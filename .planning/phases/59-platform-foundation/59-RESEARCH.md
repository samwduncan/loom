# Phase 59: Platform Foundation - Research

**Researched:** 2026-03-28
**Domain:** Capacitor platform detection, URL abstraction, CORS configuration
**Confidence:** HIGH

## Summary

Phase 59 creates the URL/platform abstraction layer that all subsequent mobile phases depend on. The scope is narrow and well-defined: a single `platform.ts` module for runtime detection and URL construction, migration of 5 bare `fetch()` calls and 3 `new WebSocket()` calls to use the URL helpers, CORS whitelist update on Express, and a minimal `capacitor.config.ts`.

All required libraries are already installed (`@capacitor/core@7.6.1`, `@capacitor/cli@7.6.1`, `@capacitor/ios@7.6.1`). No new dependencies. The existing code is well-structured with clear integration points: `api-client.ts` has a single `doFetch()` where the URL helper slots in, both WS clients build URLs in exactly 2 lines each, and the CORS config is a single `origin` array on line 339-341 of `server/index.js`.

**Primary recommendation:** Implement `platform.ts` as a pure module with zero imports from `@capacitor/core` (use `window.Capacitor` detection per D-01), wire it into the 4 existing files that need URL resolution, and add `capacitor://localhost` to the CORS origin array. Write unit tests for `platform.ts` itself (URL resolution in both modes) rather than modifying existing test files.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Runtime detection via `typeof window.Capacitor !== 'undefined'` -- no tight coupling to `@capacitor/core` API semantics
- **D-02:** Single `platform.ts` module exports `IS_NATIVE`, `API_BASE`, `WS_BASE` -- all platform logic lives here
- **D-03:** Platform checks ONLY in `platform.ts` -- UI components remain platform-unaware
- **D-04:** No build-time detection (no separate Vite configs per target) -- runtime detection is correct for exploratory phase
- **D-05:** `resolveApiUrl(path: string): string` -- returns relative path on web, absolute URL on Capacitor
- **D-06:** `resolveWsUrl(path?: string): string` -- returns `wss://host/ws` on web (from `window.location`), absolute `ws://server/ws` on Capacitor
- **D-07:** `resolveShellWsUrl(): string` -- same pattern for `/shell` endpoint
- **D-08:** API base URL hardcoded as `http://100.86.4.57:5555` with `VITE_API_URL` env var override for flexibility
- **D-09:** Web mode returns empty string for API_BASE (preserving current relative-path behavior -- zero behavioral change)
- **D-10:** Create `fetchAnon()` utility for unauthenticated calls (auth bootstrap) -- separate from `apiFetch()` which requires a token
- **D-11:** Refactor `auth.ts` to use `fetchAnon()` with `resolveApiUrl()` -- eliminates 3 direct `fetch('/api/...')` calls
- **D-12:** Refactor `useUsageMetrics.ts` to use `apiFetch()` -- eliminates 2 direct `fetch('/api/...')` calls
- **D-13:** `apiFetch()` in `api-client.ts` calls `resolveApiUrl(path)` before `fetch()` -- single integration point
- **D-14:** `websocket-client.ts` connect() uses `resolveWsUrl()` instead of building from `window.location`
- **D-15:** `shell-ws-client.ts` connect() uses `resolveShellWsUrl()` -- both WS clients updated (easy to miss one)
- **D-16:** WS reconnection path in `websocket-client.ts` also updated (reconnect uses same URL helper)
- **D-17:** Add `capacitor://localhost` to Express CORS origin whitelist in `server/index.js`
- **D-18:** Add debug log on backend for unrecognized CORS origins during development (remove before v2.2)
- **D-19:** Create minimal `capacitor.config.ts` in `src/` (Vite webDir = `dist`)
- **D-20:** Explicitly disable `CapacitorHttp` plugin in config -- it patches global `fetch()` and breaks WebSocket upgrade
- **D-21:** App ID: `com.samsara.loom`, app name: `Loom`
- **D-22:** Do NOT run `cap add ios` in this phase -- that's Phase 63's domain. Config file only.

### Claude's Discretion
- JSDoc depth in platform.ts (minimal vs comprehensive)
- Whether to add an ESLint rule preventing bare `fetch('/api/...')` or rely on grep check
- Exact error handling in `fetchAnon()`
- Whether to create a `resolveApiUrl.test.ts` unit test or rely on existing integration tests

### Deferred Ideas (OUT OF SCOPE)
- ESLint custom rule to prevent bare `fetch('/api/...')` calls
- Dynamic server URL discovery from backend response
- Separate Vite build configs per platform
- `cap add ios` and iOS project setup (Phase 63 scope)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PLAT-01 | App detects native vs web platform and configures API/WS URLs accordingly | `platform.ts` module with `IS_NATIVE`, `API_BASE`, `WS_BASE` exports. Detection via `window.Capacitor` (D-01). Verified: Capacitor 7.x injects `window.Capacitor` object in all native contexts. |
| PLAT-02 | All fetch() calls route through centralized URL helper supporting same-origin (web) and remote server (Capacitor) modes | Audit found exactly 5 bare `fetch('/api/...')` calls: 3 in `auth.ts`, 2 in `useUsageMetrics.ts`. Plus 1 `fetch(path, ...)` in `api-client.ts` `doFetch()`. All have clear integration patterns documented below. |
| PLAT-03 | All WebSocket connections construct absolute URLs for Capacitor bundled mode | 3 `new WebSocket(url)` calls: `websocket-client.ts` lines 66 and 301 (connect + reconnect), `shell-ws-client.ts` line 74. All build URL from `window.location` -- replace with `resolveWsUrl()`/`resolveShellWsUrl()`. |
| PLAT-04 | Express backend accepts requests from `capacitor://localhost` origin (CORS whitelist) | Current CORS origin array at `server/index.js` line 340 has 3 entries. Add `capacitor://localhost` as 4th entry. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Named exports only** (Constitution 2.2) -- no default exports in any new files
- **No placeholders** -- all generated code must be complete and functional
- **Verify before done** -- run test/build/lint and show output
- **Plan before multi-file changes** -- 3+ files requires numbered plan
- **Confidence gate** -- >=90% to proceed, 70-89% pause, <70% research first
- **Evidence-based claims** -- never claim "tests pass" without showing evidence
- **`// ASSERT:` format** for non-null assertions (custom ESLint rule `loom/no-non-null-without-reason`)
- **Test collocation** -- test files live next to source files (Constitution 1.3)

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Verified |
|---------|---------|---------|----------|
| @capacitor/core | 7.6.1 | Runtime platform detection (`window.Capacitor`) | `npm ls` confirmed |
| @capacitor/cli | 7.6.1 | Config file TypeScript types (`CapacitorConfig`) | `npm ls` confirmed |
| @capacitor/ios | 7.6.1 | iOS platform support (config only this phase) | `npm ls` confirmed |

### No New Dependencies
This phase requires zero new packages. Everything needed is already installed or is built-in browser/Node APIs.

## Architecture Patterns

### New File: `src/src/lib/platform.ts`
```
src/src/lib/
  platform.ts          # NEW: Platform detection + URL resolution
  platform.test.ts     # NEW: Unit tests for URL resolution in both modes
  api-client.ts        # MODIFY: doFetch() calls resolveApiUrl()
  auth.ts              # MODIFY: bootstrapAuth() uses fetchAnon()
  websocket-client.ts  # MODIFY: connect() + reconnect() use resolveWsUrl()
  shell-ws-client.ts   # MODIFY: connect() uses resolveShellWsUrl()
```

### Pattern 1: Platform Detection (window.Capacitor)

**What:** Detect native vs web runtime without importing `@capacitor/core`.

**Why `window.Capacitor` over `Capacitor.isNativePlatform()`:** Decision D-01 specifies no tight coupling to `@capacitor/core` API semantics. The `window.Capacitor` object is injected by the Capacitor runtime in all native contexts (iOS/Android). Checking `typeof window.Capacitor !== 'undefined'` is the lightest possible detection. Importing from `@capacitor/core` would add a module resolution dependency and is unnecessary when we only need a boolean.

**Verified behavior** (Capacitor official docs + multiple community sources):
- On iOS: `window.Capacitor` is always present, `window.Capacitor.isNativePlatform()` returns `true`
- On web: `window.Capacitor` is `undefined` (Capacitor runtime is not loaded)
- The `Capacitor` global is injected before any user JavaScript runs

```typescript
// Source: Capacitor docs (capacitorjs.com/docs/basics/utilities)
// + Leonel Ngande (leonelngande.com) confirmed pattern for avoiding @capacitor/core import
export const IS_NATIVE = typeof window !== 'undefined' && typeof (window as any).Capacitor !== 'undefined';
```

### Pattern 2: URL Resolution (empty-string base for web)

**What:** Web mode uses empty string as API_BASE, so `resolveApiUrl('/api/foo')` returns `'/api/foo'` unchanged. Capacitor mode prepends the server URL.

**Why this works:** The Vite dev server proxy handles `/api/*` -> `http://localhost:5555` and `/ws` -> `ws://localhost:5555/ws`. Production nginx does the same. By returning the path unchanged, web mode has literally zero behavioral change.

```typescript
// Web: '' + '/api/foo' = '/api/foo' (relative, same-origin, proxy handles it)
// Native: 'http://100.86.4.57:5555' + '/api/foo' = 'http://100.86.4.57:5555/api/foo'
const API_BASE = IS_NATIVE
  ? (import.meta.env.VITE_API_URL ?? 'http://100.86.4.57:5555')
  : '';

export function resolveApiUrl(path: string): string {
  return `${API_BASE}${path}`;
}
```

### Pattern 3: WebSocket URL Resolution

**What:** On web, build WS URL from `window.location` (current behavior). On Capacitor, build absolute `ws://` URL from the known server address.

**Why not `wss://` for Capacitor:** The direct Express port (5555) is plain HTTP. The three-tier proxy (Tailscale Serve -> nginx -> Express) could provide HTTPS, but for Phase 59 direct-to-Express is simpler. `VITE_API_URL` override allows switching later.

```typescript
export function resolveWsUrl(path: string = '/ws'): string {
  if (IS_NATIVE) {
    // Parse protocol from API_BASE: http -> ws, https -> wss
    const base = API_BASE.replace(/^http/, 'ws');
    return `${base}${path}`;
  }
  // Web: derive from current page location (existing behavior)
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}${path}`;
}
```

### Pattern 4: fetchAnon() for Auth Bootstrap

**What:** Minimal fetch wrapper for unauthenticated calls during `bootstrapAuth()`. Separate from `apiFetch()` which requires a token.

**Why separate:** `bootstrapAuth()` calls `/api/auth/status`, `/api/auth/register`, and `/api/auth/login` before any token exists. It cannot use `apiFetch()` (which injects auth headers). `fetchAnon()` just adds `resolveApiUrl()` + Content-Type header.

```typescript
// In platform.ts or api-client.ts (discretion area)
export async function fetchAnon(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(resolveApiUrl(path), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    },
  });
}
```

### Pattern 5: capacitor.config.ts

**What:** Minimal config file that `@capacitor/cli` reads. Does NOT trigger any native project creation.

**Verified** (Capacitor docs): `capacitor.config.ts` is read by `cap sync`, `cap add`, etc. Having it present does nothing until those commands are run. CapacitorHttp is disabled by default, but D-20 says to explicitly disable it for documentation clarity.

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.samsara.loom',
  appName: 'Loom',
  webDir: 'dist',
  plugins: {
    CapacitorHttp: {
      // Disabled: patches global fetch() which breaks WS upgrade handshake.
      // All HTTP routing handled by platform.ts resolveApiUrl() instead.
      enabled: false,
    },
  },
};

export default config; // Exception: Capacitor CLI requires default export
```

**Note:** This is the one file in the project that uses a default export. Capacitor CLI requires it. Add a comment explaining the exception per Constitution 2.2.

### Anti-Patterns to Avoid

- **Importing `@capacitor/core` in platform.ts:** Creates a module dependency for what should be a simple global check. Use `window.Capacitor` detection (D-01).
- **Adding `resolveApiUrl()` inside each file:** Violates D-03 (platform checks only in platform.ts). All URL resolution must go through platform.ts exports.
- **Conditionally including `@capacitor/core` via dynamic import for detection:** Overengineered. The `window.Capacitor` check is synchronous and immediate.
- **Using `VITE_API_URL` for web mode:** Web mode must return empty string (D-09). The env var override only applies to native mode's hardcoded default.
- **Enabling CapacitorHttp:** It patches `window.fetch` globally, which can interfere with WebSocket upgrade handshakes and breaks the assumption that `fetch()` is the standard browser API. The platform.ts URL approach is safer.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Platform detection | Custom user-agent parsing, feature detection | `window.Capacitor` presence check | Capacitor injects this object reliably in all native contexts |
| CORS handling on client | Custom preflight logic, proxy workarounds | Express `cors()` middleware origin array | Server-side CORS is the correct solution; client-side workarounds are fragile |
| WebSocket URL building | Complex URL parsing with `new URL()` for simple path concat | String template with `resolveWsUrl()` | The URL pattern is fixed and predictable (protocol + host + path) |

## Common Pitfalls

### Pitfall 1: WebSocket Reconnection Uses Separate URL Construction
**What goes wrong:** The chat WebSocket client has a `reconnect()` method (line 284-306) that independently builds the URL from `window.location`. If only `connect()` is updated but `reconnect()` is missed, reconnection breaks silently on Capacitor.
**Why it happens:** The reconnect path is easy to miss because it's 230 lines below connect(). It's a copy-paste of the URL construction, not a shared method.
**How to avoid:** Both `connect()` (line 63-64) and `reconnect()` (line 298-299) must call `resolveWsUrl()`. The refactored code should extract URL construction into a single call.
**Warning signs:** WebSocket connects fine on Capacitor but fails after first disconnect/reconnect cycle.

### Pitfall 2: auth.ts fetch() Calls Cannot Use apiFetch()
**What goes wrong:** If auth.ts is refactored to use `apiFetch()`, it creates a circular dependency: `apiFetch()` imports `getToken` from `auth.ts`, and `auth.ts` would import from `api-client.ts`.
**Why it happens:** The auth bootstrap runs before any token exists, so it needs a separate fetch path.
**How to avoid:** Use `fetchAnon()` (D-10) which imports only from `platform.ts`, not from `api-client.ts`. This keeps the dependency graph clean: `platform.ts` has zero internal imports.
**Warning signs:** TypeScript circular dependency warning, or `getToken()` returning null during auth bootstrap.

### Pitfall 3: Capacitor Config Default Export Exception
**What goes wrong:** The ESLint/Constitution rule banning default exports flags `capacitor.config.ts`.
**Why it happens:** Capacitor CLI requires `export default config` in the config file. This is non-negotiable.
**How to avoid:** Add a comment explaining the exception. Constitution 2.2 already has an exception clause for router lazy-loading; this is analogous.
**Warning signs:** Lint failure on the config file.

### Pitfall 4: CORS Origin Must Be Exact String Match
**What goes wrong:** Adding `capacitor://localhost/` (with trailing slash) or `capacitor://localhost:*` (with wildcard) to the CORS origin array. Express `cors()` does exact string matching on the origin header.
**Why it happens:** Developers expect glob/regex matching in CORS config.
**How to avoid:** The origin sent by iOS WKWebView when loading from Capacitor is exactly `capacitor://localhost` (no trailing slash, no port). Add that exact string.
**Warning signs:** CORS errors only on iOS, not on web.

### Pitfall 5: CapacitorHttp Patches fetch() Silently
**What goes wrong:** If a future developer enables `CapacitorHttp` in the config, all `fetch()` calls silently route through native HTTP libraries. This breaks WebSocket upgrade handshakes (which rely on the browser's native fetch/XHR for the initial HTTP upgrade).
**Why it happens:** CapacitorHttp patches `window.fetch` globally when enabled, and the WebSocket API's internal HTTP upgrade uses the same path.
**How to avoid:** D-20 explicitly disables it. The comment in `capacitor.config.ts` explains why. Our approach (resolveApiUrl in platform.ts) is safer because it only affects URL construction, not the fetch implementation.
**Warning signs:** WebSocket connections fail with network errors on native, while fetch API calls work fine.

### Pitfall 6: useUsageMetrics.ts Has Token in Headers
**What goes wrong:** `useUsageMetrics.ts` manually injects the auth header via `getToken()` instead of using `apiFetch()`. When migrating to `apiFetch()` (D-12), the manual header injection must be removed or it will duplicate headers.
**Why it happens:** The hook was written before `apiFetch()` existed or before its auth handling was robust.
**How to avoid:** Replace the entire `fetchMetricsData()` function body with a single `apiFetch('/api/usage/metrics')` call, and replace the `useSessionTokenUsage` fetch with `apiFetch()`. Remove the manual `getToken()` + header construction.
**Warning signs:** Duplicate `Authorization` headers in requests.

## Code Examples

### Complete platform.ts Module

```typescript
/**
 * Platform detection and URL resolution -- single source of truth for
 * native vs web runtime configuration.
 *
 * Web mode: all URLs remain relative (empty API_BASE), matching existing
 * proxy-based routing. Zero behavioral change.
 *
 * Capacitor mode: URLs resolve to absolute server addresses.
 *
 * Constitution: Named exports only (2.2), no default export.
 */

/** True when running inside a Capacitor native shell (iOS/Android). */
export const IS_NATIVE: boolean =
  typeof window !== 'undefined' &&
  typeof (window as Record<string, unknown>).Capacitor !== 'undefined';

/**
 * Base URL for API requests.
 * - Web: '' (relative paths, handled by Vite proxy / nginx)
 * - Native: 'http://100.86.4.57:5555' or VITE_API_URL override
 */
export const API_BASE: string = IS_NATIVE
  ? (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://100.86.4.57:5555'
  : '';

/**
 * Base URL for WebSocket connections.
 * - Web: '' (derived from window.location at connect time)
 * - Native: 'ws://100.86.4.57:5555' (derived from API_BASE)
 */
export const WS_BASE: string = IS_NATIVE
  ? API_BASE.replace(/^http/, 'ws')
  : '';

/**
 * Resolve an API path to a full URL.
 * Web: '/api/foo' -> '/api/foo'
 * Native: '/api/foo' -> 'http://100.86.4.57:5555/api/foo'
 */
export function resolveApiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

/**
 * Resolve a WebSocket path to a full URL with token.
 * Web: builds from window.location (wss: or ws: based on page protocol)
 * Native: builds absolute URL from WS_BASE
 */
export function resolveWsUrl(path: string, token: string): string {
  if (IS_NATIVE) {
    return `${WS_BASE}${path}?token=${token}`;
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}${path}?token=${token}`;
}

/**
 * Convenience: resolve the /shell WebSocket URL.
 */
export function resolveShellWsUrl(token: string): string {
  return resolveWsUrl('/shell', token);
}

/**
 * Minimal fetch for unauthenticated requests (auth bootstrap).
 * Does NOT inject Authorization header. Does NOT deduplicate.
 * Only adds Content-Type and resolves the URL via platform detection.
 */
export async function fetchAnon(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  return fetch(resolveApiUrl(path), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    },
  });
}
```

### Integration: api-client.ts doFetch()

```typescript
// BEFORE (line 50-61):
function doFetch(path: string, options: RequestInit, signal?: AbortSignal): Promise<Response> {
  const token = getToken();
  return fetch(path, { ... });
}

// AFTER:
import { resolveApiUrl } from '@/lib/platform';

function doFetch(path: string, options: RequestInit, signal?: AbortSignal): Promise<Response> {
  const token = getToken();
  return fetch(resolveApiUrl(path), { ... });
}
```

### Integration: websocket-client.ts connect() + reconnect()

```typescript
// BEFORE (connect, line 63-64):
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const url = `${protocol}//${window.location.host}/ws?token=${token}`;

// AFTER:
import { resolveWsUrl } from '@/lib/platform';
// In connect():
const url = resolveWsUrl('/ws', token);
// In reconnect():
const url = resolveWsUrl('/ws', this.token);
```

### Integration: auth.ts bootstrapAuth()

```typescript
// BEFORE:
const statusRes = await fetch('/api/auth/status');
const res = await fetch('/api/auth/register', { method: 'POST', ... });
const res = await fetch('/api/auth/login', { method: 'POST', ... });

// AFTER:
import { fetchAnon } from '@/lib/platform';
const statusRes = await fetchAnon('/api/auth/status');
const res = await fetchAnon('/api/auth/register', { method: 'POST', ... });
const res = await fetchAnon('/api/auth/login', { method: 'POST', ... });
```

### Integration: server/index.js CORS

```javascript
// BEFORE (line 339-341):
app.use(cors({
    origin: ['https://samsara.tailad2401.ts.net:5443', 'http://100.86.4.57:5184', 'http://localhost:5184'],
}));

// AFTER:
app.use(cors({
    origin: [
        'https://samsara.tailad2401.ts.net:5443',
        'http://100.86.4.57:5184',
        'http://localhost:5184',
        'capacitor://localhost',
    ],
}));
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (via vite.config.ts `test` section) |
| Config file | `src/vite.config.ts` (inline test config) |
| Quick run command | `cd src && npx vitest run src/lib/platform.test.ts` |
| Full suite command | `cd src && npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PLAT-01 | Platform detection + URL config | unit | `cd src && npx vitest run src/lib/platform.test.ts -x` | Wave 0 |
| PLAT-02 | All fetch() routed through URL helper | unit + grep | `cd src && npx vitest run src/lib/api-client.test.ts -x` + grep audit | api-client.test.ts exists |
| PLAT-03 | WebSocket URLs absolute for Capacitor | unit | `cd src && npx vitest run src/lib/platform.test.ts -x` | Wave 0 |
| PLAT-04 | CORS accepts capacitor://localhost | manual | Start server, send request with Origin header | Manual only -- Express CORS is config, not unit-testable in frontend |

### Sampling Rate
- **Per task commit:** `cd src && npx vitest run src/lib/platform.test.ts src/lib/api-client.test.ts src/lib/auth.test.ts -x`
- **Per wave merge:** `cd src && npx vitest run`
- **Phase gate:** Full suite green + grep audit shows 0 bare `fetch('/api/` calls in `src/src/`

### Wave 0 Gaps
- [ ] `src/src/lib/platform.test.ts` -- covers PLAT-01, PLAT-03 (URL resolution in web vs native modes)
- [ ] Update `src/src/lib/auth.test.ts` -- existing tests use bare `fetch('/api/auth/status')` assertions that will change to `fetchAnon()` calls
- [ ] Update `src/src/lib/api-client.test.ts` -- existing tests mock `fetch(path, ...)` which will now receive resolved URLs

### Existing Test Impact Assessment

**auth.test.ts** (225 lines, 9 tests): Tests mock `globalThis.fetch` and assert calls like `mockFetch.mock.calls[1]?.[0]` === `'/api/auth/register'`. After migration to `fetchAnon()`, these assertions still work because `resolveApiUrl('/api/auth/register')` returns `'/api/auth/register'` in web mode (empty API_BASE). **No test changes needed for web mode assertions.**

**api-client.test.ts** (278 lines, 14 tests): Tests call `apiFetch('/api/test')` and assert `fetch` was called with `'/api/test'`. After adding `resolveApiUrl()` in `doFetch()`, `resolveApiUrl('/api/test')` returns `'/api/test'` in web mode. **No test changes needed for web mode assertions.**

**websocket-client.test.ts** (existing): Uses `MockWebSocket` class that captures URLs. Tests assert URL patterns. After migration, web mode URLs are identical. **No test changes needed** -- but new platform.test.ts should test the Capacitor URL path.

**Key insight:** Because web mode returns empty-string API_BASE, all existing tests continue to pass without modification. New tests only needed for the Capacitor code path (mocking `window.Capacitor`).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CapacitorHttp to handle CORS | Server-side CORS + direct fetch | Capacitor 6+ | CapacitorHttp is opt-in since v6; disabled by default since v7. Direct fetch with proper CORS is now the recommended approach. |
| `Capacitor.isNativePlatform()` import | `window.Capacitor` presence check | Always available | Lighter weight, no import needed, same reliability |
| Build-time platform flags | Runtime detection | Community consensus | Runtime detection is simpler and avoids maintaining separate build configs |

## Open Questions

1. **Token in WebSocket URL -- should resolveWsUrl() include the token parameter?**
   - What we know: Currently connect() and reconnect() append `?token=${token}` to the URL. The token is available at call time.
   - What's unclear: Whether `resolveWsUrl()` should accept a token parameter (coupling it to auth) or return a base URL and let the caller append the token.
   - Recommendation: Accept token as parameter (shown in code examples above). It keeps the caller code cleaner and the URL construction is fully centralized. The alternative (returning base URL) leaves URL construction split across files, which is what we're trying to eliminate.

2. **Where to put fetchAnon() -- platform.ts or separate file?**
   - What we know: It needs `resolveApiUrl()` from platform.ts. It's consumed only by auth.ts.
   - Recommendation: Put it in `platform.ts`. It's small (5 lines), directly related to URL resolution, and keeps the dependency graph simple (auth.ts -> platform.ts, no circular deps).

## Sources

### Primary (HIGH confidence)
- [Capacitor Configuration docs](https://capacitorjs.com/docs/config) -- CapacitorConfig interface, server/plugins sections
- [Capacitor Http Plugin docs](https://capacitorjs.com/docs/apis/http) -- CapacitorHttp behavior, disabled by default
- [Capacitor JavaScript Utilities](https://capacitorjs.com/docs/basics/utilities) -- `isNativePlatform()`, `getPlatform()`, import patterns
- [Capacitor 7.x core/http.md](https://github.com/ionic-team/capacitor/blob/7.x/core/http.md) -- CapacitorHttp 7.x specifics
- Direct code audit of all 6 files to modify (api-client.ts, auth.ts, websocket-client.ts, shell-ws-client.ts, useUsageMetrics.ts, server/index.js)

### Secondary (MEDIUM confidence)
- [Ionic CORS Troubleshooting](https://ionicframework.com/docs/troubleshooting/cors) -- `capacitor://localhost` as iOS origin
- [Leonel Ngande: Native Platform Check Without Importing Capacitor](https://www.leonelngande.com/native-platform-check-without-importing-capacitor/) -- window.Capacitor pattern
- [Capacitor GitHub Issue #7241](https://github.com/ionic-team/capacitor/issues/7241) -- Platform detection edge cases
- [Ionic Forum: CORS allow capacitor://localhost](https://forum.ionicframework.com/t/does-my-api-server-need-to-cors-allow-capacitor-localhost/250480) -- Community confirmation of exact origin string

### Tertiary (LOW confidence)
- None -- all findings verified with primary or secondary sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all packages already installed, versions confirmed via npm ls
- Architecture: HIGH -- code audit of all 6 files complete, integration points identified with line numbers, existing test impact assessed
- Pitfalls: HIGH -- WS reconnection path verified by reading code, CORS origin format confirmed by multiple sources, CapacitorHttp behavior verified in official docs

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (stable domain -- Capacitor 7.x, Express CORS middleware, browser fetch API are all mature)
