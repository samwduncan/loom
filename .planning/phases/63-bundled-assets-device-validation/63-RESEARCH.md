# Phase 63: Bundled Assets & Device Validation - Research

**Researched:** 2026-03-28
**Domain:** Capacitor iOS build pipeline, bundled asset serving, connection error handling
**Confidence:** HIGH

## Summary

Phase 63 bridges the gap between "code written on Linux" and "working app on iPhone." The four requirements (BUNDLE-01 through BUNDLE-04) cover the build pipeline, bundled asset verification, connection error handling, and splash-to-content flow integrity. All prior phases (59-62) have laid the platform, keyboard, touch, haptics, and motion groundwork -- this phase validates it all works end-to-end as a bundled iOS app.

The primary technical risk is **Vite's default absolute asset paths**. The current `vite.config.ts` has no `base` option, meaning Vite outputs paths like `/assets/index-xxx.js` and font URLs like `url(/fonts/inter-variable.woff2)`. While Capacitor's `capacitor://localhost` scheme handler maps `/` to the bundled webDir root (so absolute paths technically work), the safer and more portable approach is `base: './'` which produces relative paths (`./assets/...`). This eliminates any ambiguity and matches the universal recommendation from Vite + Capacitor guides.

The secondary risk is the **white flash gap** between splash dismissal and first CSS paint. The `index.html` has no inline `background-color`, relying entirely on CSS custom properties loaded asynchronously. Adding `style="background-color:#2b2521"` to `<html>` and `<body>` in `index.html` provides an instant dark background that matches the splash screen color, preventing any flash.

**Primary recommendation:** Set `base: './'` in vite.config.ts, add inline background-color to index.html, enhance ConnectionBanner with native-aware messaging, create cap-build.sh script, and produce a comprehensive device validation checklist.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Create `scripts/cap-build.sh` convenience script that runs: `npm run build` -> validates dist/ -> `npx cap sync ios`. Fails fast if not on macOS.
- **D-02:** cap-build.sh is separate from deploy.sh (iOS bundle vs server deploy).
- **D-03:** Build validation gates before cap sync: dist/index.html exists, assets/ non-empty, no TypeScript errors.
- **D-04:** No CI/CD for iOS builds -- single developer, manual Mac workflow. Document the steps.
- **D-05:** capacitor.config.ts already correct for bundled mode. No changes needed.
- **D-06:** Verify Vite build output has correct base path -- `base: './'` in vite.config.ts if not already set.
- **D-07:** Font loading must work from bundled assets -- verify @font-face URLs resolve from file:// origin.
- **D-08:** Enhance ConnectionBanner with native-specific messaging -- "Server unreachable -- check VPN/network".
- **D-09:** Add network reachability pre-check in auth bootstrap flow. Show informative error state on failure.
- **D-10:** After splash hides, ConnectionBanner MUST be visible if connection failed.
- **D-11:** Verify cold-start sequence: initializeNativePlugins() -> initializeWebSocket() -> hideSplashWhenReady() -> React render.
- **D-12:** SplashScreen backgroundColor (#2b2521) must match CSS background on `<html>` and `<body>`.
- **D-13:** Auth bootstrap flow already uses fetchAnon() through resolveApiUrl() -- no changes needed for auth path.
- **D-14:** Create structured DEVICE-VALIDATION-CHECKLIST.md.
- **D-15:** Checklist items are binary pass/fail with specific actions to verify.
- **D-16:** On-device testing requires: Mac with Xcode, iPhone 16 Pro Max, Tailscale VPN.

### Claude's Discretion
- Exact shell script implementation details for cap-build.sh
- Level of detail in DEVICE-VALIDATION-CHECKLIST.md
- Whether to add a vite.config.ts `base` option or handle via Capacitor's webDir resolution
- Test file additions for network reachability logic

### Deferred Ideas (OUT OF SCOPE)
- Runtime-configurable API server URL (QR code scan or settings screen)
- CI/CD for iOS builds (GitHub Actions with macOS runner)
- Automated device testing via Appium/XCTest

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BUNDLE-01 | Vite production build syncs to iOS app via `cap sync` pipeline | Build pipeline research: cap-build.sh script, webDir mapping, build validation gates |
| BUNDLE-02 | App loads and functions correctly from bundled assets with remote API | Vite base path analysis, font URL resolution, capacitor://localhost scheme behavior |
| BUNDLE-03 | Clear error state when server/VPN connection lost | ConnectionBanner enhancement patterns, network reachability pre-check architecture |
| BUNDLE-04 | Splash-to-auth-to-content flow without white flash | Inline background-color technique, startup sequence analysis, splash/CSS color matching |

</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **No placeholders** -- all generated code must be complete and functional
- **Verify before done** -- run test/build/lint and show output
- **Plan before multi-file changes** -- 3+ files means numbered plan, wait for approval
- **Confidence gate** -- >=90% proceed, 70-89% pause and state uncertainty
- **Evidence-based claims** -- never claim "tests pass" without showing evidence
- **Named exports only** (Constitution 2.2) -- no default exports (except Capacitor config which is exempted)
- **Custom ESLint rule** -- `// ASSERT: [reason]` format for non-null assertions
- **Tool fallback chain** -- Context7 > gemini_search > WebSearch > WebFetch
- **Cost awareness** -- targeted reads, no broad exploration

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @capacitor/cli | 7.6.1 | iOS build/sync tooling | Already installed, drives cap sync pipeline |
| @capacitor/core | 7.6.1 | Runtime native bridge | Already installed as devDep |
| @capacitor/ios | 7.6.1 | iOS platform support | Already installed |
| vite | 7.3.1 | Build tool | Already installed, produces the dist/ bundle |
| vitest | 4.0.18 | Test framework | Already installed, 1477 tests passing |

### Supporting (No New Dependencies)
This phase requires ZERO new npm packages. All work uses existing tools.

| Tool | Purpose | Notes |
|------|---------|-------|
| `npx cap sync ios` | Sync web assets to iOS project | Requires macOS for full sync |
| `npx tsc -b` | TypeScript type checking | Build gate validation |
| `npx vite build` | Production bundle | Outputs to src/dist/ |

**Installation:** None needed. All dependencies already present.

## Architecture Patterns

### Build Pipeline Architecture

```
Linux (development):
  npm run build (tsc -b && vite build)
    -> src/dist/index.html
    -> src/dist/assets/*.{js,css}
    -> src/dist/fonts/*.woff2

macOS (device build):
  scripts/cap-build.sh
    -> npm run build (same as above)
    -> Validation gates (dist exists, assets present, etc.)
    -> npx cap sync ios (copies dist/ -> ios/App/App/public/)
    -> npx cap open ios (opens Xcode)
    -> Xcode: Build & Run on device
```

### Critical Path Discovery: Two dist/ Directories

**Problem:** `deploy.sh` builds to `../dist` (repo root) via `--outDir ../dist --emptyOutDir`. The default `npm run build` (in `src/`) builds to `src/dist/`. Capacitor's `webDir: 'dist'` means `src/dist/`.

**Resolution:** The cap-build.sh script MUST use `npm run build` from the `src/` directory (default outDir). It must NOT use deploy.sh which targets the wrong directory. The two build targets serve different purposes:
- `deploy.sh` -> `loom/dist/` -> nginx serves for web
- `cap-build.sh` -> `loom/src/dist/` -> Capacitor syncs to iOS

### Vite Base Path Fix

**Current state:** No `base` in vite.config.ts = defaults to `'/'` (absolute paths).

**What Vite produces with `base: '/'`:**
```html
<script src="/assets/index-xxx.js"></script>
```
```css
@font-face { src: url(/fonts/inter-variable.woff2); }
```

**What Vite produces with `base: './'`:**
```html
<script src="./assets/index-xxx.js"></script>
```
```css
@font-face { src: url(./fonts/inter-variable.woff2); }
```

**Why this matters:** Capacitor iOS serves via `capacitor://localhost/` scheme where the WKURLSchemeHandler maps `/` to the bundled public/ directory. Absolute paths technically work because `capacitor://localhost/fonts/x.woff2` resolves correctly. However, `base: './'` is safer because:
1. It works in BOTH web (dev server) and native (bundled) contexts
2. It matches universal Capacitor + Vite recommendations
3. It eliminates any edge case where path resolution differs between schemes
4. The web deploy (deploy.sh) uses `--outDir ../dist` which overrides the base anyway

**Impact on deploy.sh:** deploy.sh uses `--outDir ../dist --emptyOutDir` which puts files in repo root. The relative `./` base means nginx must serve from the correct directory. Since nginx already points to `loom/dist/` as its root, relative paths like `./assets/index.js` resolve to `loom/dist/assets/index.js` -- this is correct. No deploy.sh changes needed.

**Confidence:** HIGH -- verified by examining Vite docs, build output, and Capacitor scheme handler behavior.

### White Flash Prevention (D-12)

**Current state:** `index.html` has no inline background-color. Body background comes from CSS custom property `var(--surface-base)` which is `oklch(0.20 0.010 32)`.

**The problem sequence on cold start:**
1. Splash screen shows (#2b2521 background)
2. Splash hides (300ms fade)
3. HTML renders with DEFAULT white background
4. CSS loads, body gets dark background
5. Brief white flash between steps 3-4

**Fix:** Add inline `style="background-color:#2b2521"` to both `<html>` and `<body>` in `index.html`. This provides an instant dark background matching the splash color before any CSS loads.

```html
<html lang="en" style="background-color:#2b2521">
  <!-- ... -->
  <body style="background-color:#2b2521">
```

The CSS `background-color: var(--surface-base)` on `body` will override this once loaded, but the inline style prevents the flash.

**Color match verification:** `#2b2521` = RGB(43, 37, 33). `oklch(0.20 0.010 32)` converts to approximately the same dark warm brown. Any sub-pixel difference is imperceptible.

### Connection Error Handling Architecture (D-08, D-09, D-10)

**Current ConnectionBanner states:**
1. `connected` / `connecting` -> renders nothing
2. `disconnected` + error -> red error banner with message
3. `reconnecting` -> overlay with attempt counter
4. `disconnected` + no error -> "Connection lost" with reconnect button

**Enhancement for native:** When `IS_NATIVE` is true, the "Connection lost" and error messages should include VPN-specific guidance since the server (100.86.4.57:5555) is behind Tailscale.

**Network reachability pre-check (D-09):** Add a pre-check in the auth bootstrap flow. Before `fetchAnon('/api/auth/status')`, attempt a lightweight connectivity check. On failure, set an error state visible to the user rather than letting the fetch throw an unhandled error that results in a blank screen.

**Implementation approach:**
```typescript
// In websocket-init.ts, wrap bootstrapAuth in try/catch
try {
  const token = await bootstrapAuth();
  wsClient.connect(token);
} catch (err) {
  // Set connection error state so ConnectionBanner shows
  useConnectionStore.getState().setProviderError(
    'claude',
    IS_NATIVE
      ? 'Server unreachable -- check Tailscale VPN connection'
      : 'Server unreachable -- check network connection'
  );
  useConnectionStore.getState().updateProviderStatus('claude', 'disconnected');
}
```

This ensures that after the 3s splash fallback hides, the ConnectionBanner is visible with an actionable error message.

### Startup Sequence Verification (D-11)

**Current sequence in main.tsx:**
```
1. void initializeNativePlugins()    // fire-and-forget, sets data-native, inits plugins
2. void initializeWebSocket()         // fire-and-forget, bootstrapAuth + wsClient.connect
3. createRoot().render(<App />)       // React render tree
4. void hideSplashWhenReady()         // subscribes to connection store, 3s fallback
```

**Key concern:** Steps 1 and 2 are fire-and-forget (no await). This means React renders immediately while plugins are still loading. This is CORRECT behavior -- the splash screen covers the initial render, and `hideSplashWhenReady()` waits for either connection or 3s timeout before revealing.

**The state machine for splash dismissal:**
- Connection succeeds within 3s -> splash hides, user sees app
- Connection fails within 3s -> splash hides at 3s timeout, ConnectionBanner visible with error
- Plugins fail to load -> splash hide falls through (splashModule null), no-op

**Gap identified:** If `bootstrapAuth()` throws (server unreachable), the current code does NOT catch it. `initializeWebSocket()` has `isInitialized` guard but no try/catch around the auth+connect sequence. This means the error propagates as an unhandled promise rejection, connection store stays at `disconnected` with no error message, and after splash hides the user sees... nothing helpful.

**This is the core fix for D-09:** Wrap the auth+connect in websocket-init.ts with error handling that sets a meaningful error state.

### Anti-Patterns to Avoid

- **Building to wrong dist/**: The cap-build.sh must NOT use deploy.sh's `--outDir ../dist`. Use default `npm run build` which outputs to `src/dist/`.
- **Testing cap sync on Linux**: `cap sync ios` requires macOS with Xcode command line tools. The script must detect the platform and fail gracefully on Linux.
- **Hardcoding error messages**: ConnectionBanner messages should use `IS_NATIVE` from platform.ts, not check `window.Capacitor` directly.
- **Modifying capacitor.config.ts server.url**: The bundled mode is the DEFAULT (no server.url). Do not set it.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Build validation | Custom build checker | Shell script with `test -f` / `find` | deploy.sh already has this pattern |
| Platform detection in components | window.Capacitor checks | Import IS_NATIVE from platform.ts | Single source of truth per v2.1 decisions |
| Splash screen timing | Manual setTimeout | hideSplashWhenReady() with connection store subscription | Already built in Phase 61 |
| Asset path resolution | Manual URL construction | Vite's `base: './'` option | Vite handles all URL rewriting automatically |

## Common Pitfalls

### Pitfall 1: Wrong dist/ Directory
**What goes wrong:** cap-build.sh uses deploy.sh pattern and builds to `loom/dist/` instead of `loom/src/dist/`. `cap sync` finds stale/wrong assets.
**Why it happens:** deploy.sh uses `--outDir ../dist` for nginx. Capacitor expects `webDir: 'dist'` relative to project root (`src/`).
**How to avoid:** cap-build.sh runs `npm run build` from `src/` with NO outDir override. Default goes to `src/dist/`.
**Warning signs:** `cap sync` succeeds but app shows old content or blank page.

### Pitfall 2: Unhandled Auth Failure on Unreachable Server
**What goes wrong:** App launches, splash hides after 3s, user sees blank app with no error messaging.
**Why it happens:** `bootstrapAuth()` throws when server is unreachable. No try/catch in `initializeWebSocket()` means connection store never gets error state. ConnectionBanner renders nothing because status stays at initial `disconnected` with null error.
**How to avoid:** Wrap auth+connect in websocket-init.ts with try/catch that sets provider error and disconnected status.
**Warning signs:** Splash hides to blank screen when not on Tailscale VPN.

### Pitfall 3: Stale Synced iOS Config
**What goes wrong:** The synced `ios/App/App/capacitor.config.json` has stale values (wrong appId, missing plugin configs).
**Why it happens:** `cap sync` regenerates this file from `capacitor.config.ts`. But if sync hasn't run since config changes, the iOS project uses old config.
**How to avoid:** Always run fresh `cap sync ios` before Xcode build. The cap-build.sh enforces this.
**Warning signs:** App builds but plugins don't activate (wrong config), or wrong bundle identifier.

### Pitfall 4: Font Loading Failure in Bundled Mode
**What goes wrong:** Fonts don't load, app falls back to system fonts, typography looks wrong.
**Why it happens:** Font URLs are absolute (`/fonts/...`) and may not resolve in Capacitor's `capacitor://localhost` scheme.
**How to avoid:** Set `base: './'` in vite.config.ts. Verify built CSS has relative font URLs.
**Warning signs:** Different typography on device vs web browser.

### Pitfall 5: White Flash Between Splash and Content
**What goes wrong:** Brief white flash visible between splash dismissal and React render with dark background.
**Why it happens:** index.html has no inline background-color. CSS loads asynchronously. Default HTML background is white.
**How to avoid:** Add `style="background-color:#2b2521"` to `<html>` and `<body>` in index.html.
**Warning signs:** Visible during manual device testing in dark environment.

### Pitfall 6: viewport-fit=cover vs interactive-widget
**What goes wrong:** The stale dist/index.html has `interactive-widget=resizes-content` instead of `viewport-fit=cover`.
**Why it happens:** The source index.html was updated but the dist was built from an older version.
**How to avoid:** Fresh build from current source. cap-build.sh always rebuilds.
**Warning signs:** Safe-area insets not working correctly on device.

## Code Examples

### cap-build.sh Script Pattern (following deploy.sh style)
```bash
#!/usr/bin/env bash
set -euo pipefail

# Colors (same as deploy.sh)
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

fail() { echo -e "${RED}FAIL:${NC} $1"; exit 1; }
ok()   { echo -e "${GREEN}  OK:${NC} $1"; }
step() { echo -e "\n${YELLOW}=== $1 ===${NC}"; }

REPO_DIR="/home/swd/loom"
SRC_DIR="$REPO_DIR/src"

# Step 1: Platform check
step "Step 1: Platform check"
if [[ "$(uname)" != "Darwin" ]]; then
    fail "cap sync requires macOS. Build web assets only: cd src && npm run build"
fi
ok "Running on macOS"

# Step 2: Install dependencies
step "Step 2: Install dependencies"
(cd "$SRC_DIR" && npm ci) || fail "npm ci failed"
ok "Dependencies installed"

# Step 3: TypeScript check
step "Step 3: TypeScript check"
(cd "$SRC_DIR" && npx tsc -b) || fail "TypeScript errors found"
ok "TypeScript clean"

# Step 4: Build
step "Step 4: Vite build"
(cd "$SRC_DIR" && npx vite build) || fail "Vite build failed"
ok "Built to src/dist/"

# Step 5: Validate
step "Step 5: Validate build"
[[ -s "$SRC_DIR/dist/index.html" ]] || fail "dist/index.html missing"
[[ -d "$SRC_DIR/dist/assets" ]] || fail "dist/assets/ missing"
ASSET_COUNT=$(find "$SRC_DIR/dist/assets" -type f | wc -l)
[[ "$ASSET_COUNT" -ge 20 ]] || fail "Only $ASSET_COUNT assets (expected >= 20)"
ok "Build validated ($ASSET_COUNT assets)"

# Step 6: Cap sync
step "Step 6: Capacitor sync"
(cd "$SRC_DIR" && npx cap sync ios) || fail "cap sync failed"
ok "iOS project synced"

step "Build complete"
echo -e "${GREEN}Ready for Xcode.${NC} Run: cd src && npx cap open ios"
```

### ConnectionBanner Native Enhancement
```typescript
import { IS_NATIVE } from '@/lib/platform';

// Inside the disconnected-without-error branch:
const message = IS_NATIVE
  ? 'Server unreachable \u2014 check Tailscale VPN'
  : 'Connection lost';
```

### Network Reachability Error Handling (websocket-init.ts)
```typescript
// Wrap the existing bootstrapAuth + connect:
try {
  const token = await bootstrapAuth();
  wsClient.connect(token);
} catch (err: unknown) {
  const message = IS_NATIVE
    ? 'Server unreachable \u2014 check Tailscale VPN connection'
    : 'Unable to connect to server';
  connectionStore().setProviderError('claude', message);
  connectionStore().updateProviderStatus('claude', 'disconnected');
}
```

### Vite Base Path Config
```typescript
// vite.config.ts addition:
export default defineConfig({
  base: './',
  // ... rest of config
});
```

### Inline Background Color in index.html
```html
<html lang="en" style="background-color:#2b2521">
  <head><!-- ... --></head>
  <body style="background-color:#2b2521">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 |
| Config file | `src/vite.config.ts` (test section) |
| Quick run command | `cd /home/swd/loom/src && npx vitest run --reporter verbose` |
| Full suite command | `cd /home/swd/loom/src && npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BUNDLE-01 | Build pipeline produces valid dist/ | smoke | `cd src && npm run build && test -f dist/index.html` | N/A (shell) |
| BUNDLE-02 | Bundled assets load correctly (base path) | unit | `cd src && npx vitest run src/lib/platform.test.ts -x` | Yes |
| BUNDLE-03 | ConnectionBanner shows native-specific error | unit | `cd src && npx vitest run src/components/shared/ConnectionBanner.test.tsx -x` | Yes (needs update) |
| BUNDLE-03 | Auth bootstrap handles unreachable server | unit | `cd src && npx vitest run src/lib/websocket-init.test.ts -x` | Wave 0 |
| BUNDLE-04 | No white flash (inline bg-color in HTML) | manual-only | Visual check on device | N/A |

### Sampling Rate
- **Per task commit:** `cd /home/swd/loom/src && npx vitest run --reporter verbose`
- **Per wave merge:** `cd /home/swd/loom/src && npx vitest run`
- **Phase gate:** Full suite green + on-device spot check

### Wave 0 Gaps
- [ ] `src/src/components/shared/ConnectionBanner.test.tsx` -- needs IS_NATIVE-aware message tests (BUNDLE-03)
- [ ] Auth error handling test -- needs test for unreachable server scenario in websocket-init (BUNDLE-03)

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build pipeline | Yes | (runtime present) | -- |
| npm | Dependencies | Yes | (present) | -- |
| Capacitor CLI | cap sync | Yes | 7.6.1 | -- |
| macOS + Xcode | cap sync ios, device build | No (Linux dev) | -- | Code changes on Linux, sync/build on Mac |
| iPhone 16 Pro Max | Device validation | Yes (swd owns) | -- | -- |
| Tailscale VPN | Device-to-server connectivity | Yes | (configured) | -- |

**Missing dependencies with no fallback:**
- macOS with Xcode is required for `cap sync ios` and device builds. This is a known constraint documented in the phase description. cap-build.sh detects the platform and fails fast with instructions on Linux.

**Missing dependencies with fallback:**
- None. All code changes (vite.config.ts, ConnectionBanner, index.html, websocket-init.ts) can be built and tested on Linux.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Cordova file:// | Capacitor capacitor:// | Capacitor 1.0+ | Custom URL scheme with proper CORS origin |
| Vite `base: '/'` (default) | Vite `base: './'` for mobile | Best practice | Relative asset paths work everywhere |
| Blank HTML before CSS | Inline background-color | Standard PWA pattern | Prevents FOUC/white flash |

## Open Questions

1. **Exact color match between #2b2521 and oklch(0.20 0.010 32)**
   - What we know: Both are dark warm brown, visually nearly identical
   - What's unclear: Sub-pixel color difference due to OKLCH gamut mapping
   - Recommendation: Accept #2b2521 as the hex approximation. Any difference is imperceptible. If perfectionism demands it, compute the exact sRGB conversion on device.

2. **Whether absolute paths actually break in capacitor:// scheme**
   - What we know: Capacitor's WKURLSchemeHandler maps `/` to webDir root, so `/assets/x.js` -> `capacitor://localhost/assets/x.js` -> `App/App/public/assets/x.js`
   - What's unclear: Edge cases in certain WebKit versions or with certain URL patterns
   - Recommendation: Use `base: './'` anyway. It's safer, universally recommended, and has zero downside.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/vite.config.ts`, `src/capacitor.config.ts`, `src/src/lib/platform.ts`, `src/src/lib/native-plugins.ts`, `src/src/components/shared/ConnectionBanner.tsx`, `deploy.sh`, `src/src/main.tsx`, `src/src/lib/websocket-init.ts`
- Vite build output: inspected `src/dist/` and `src/ios/App/App/public/` for actual path format
- Capacitor 7.6.1 installed: verified via `npx cap --version`
- Test suite: 141 files, 1477 tests passing

### Secondary (MEDIUM confidence)
- [Vite docs on base path](https://vite.dev/guide/build) -- confirmed `base: './'` for relative paths
- [Vite static asset handling](https://vite.dev/guide/assets) -- URL rewriting with base option
- [Capacitor config docs](https://capacitorjs.com/docs/config) -- iosScheme defaults to `capacitor`
- [Capacitor font loading issue](https://github.com/ionic-team/capacitor/issues/5147) -- confirms font path issues in bundled mode

### Tertiary (LOW confidence)
- General web search about Capacitor + Vite base path best practices -- multiple sources agree on `base: './'`

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all tools already installed and verified
- Architecture: HIGH -- build pipeline, error handling, and splash flow thoroughly analyzed from existing code
- Pitfalls: HIGH -- identified from direct inspection of codebase (wrong dist/, unhandled auth error, stale config, font paths, white flash)

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (stable -- Capacitor 7.x is mature, no breaking changes expected)
