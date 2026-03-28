# Phase 63: Bundled Assets & Device Validation - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning
**Mode:** Auto-resolved (infrastructure/validation phase -- requirements concrete, Bard-Prime consulted)

<domain>
## Phase Boundary

The Capacitor app loads from bundled HTML/CSS/JS with remote API calls, and all previous phases work correctly on a real iPhone. This phase bridges the gap between "code written" and "working iOS app" by ensuring the build pipeline produces a valid bundle, the app handles server unreachability gracefully, and creating a structured validation checklist for on-device testing.

**This phase does NOT implement new features or UI** -- it validates that the existing Phases 59-62 code works correctly end-to-end when bundled as a native iOS app.

**Key constraint:** swd develops on Linux. `cap sync ios` and Xcode builds require macOS. This phase focuses on (a) code changes that can be built and tested on Linux, and (b) documentation/scripts for the Mac build step.

</domain>

<decisions>
## Implementation Decisions

### Build Pipeline (BUNDLE-01)
- **D-01:** Create a `scripts/cap-build.sh` convenience script in `src/` that runs: `npm run build` → validates dist/ → `npx cap sync ios`. Script fails fast with clear error if not on macOS (cap sync needs it).
- **D-02:** Existing `deploy.sh` handles web deployment only -- cap-build.sh is a separate concern (iOS bundle vs server deploy).
- **D-03:** Build validation gates before cap sync: dist/index.html exists, assets/ directory non-empty, no TypeScript errors. Mirrors deploy.sh's validation approach.
- **D-04:** No CI/CD for iOS builds in this phase -- single developer, manual Mac workflow. Document the steps.

### Bundled Asset Loading (BUNDLE-02)
- **D-05:** capacitor.config.ts already correct: `webDir: 'dist'`, `server.url` only set via env var for dev mode, bundled mode is the default. No changes needed.
- **D-06:** Verify Vite build output has correct base path for Capacitor bundled mode -- `base: './'` in vite.config.ts if not already set (Capacitor loads from file:// protocol, so absolute paths break).
- **D-07:** Font loading must work from bundled assets -- verify `@font-face` URLs resolve correctly from file:// origin (relative paths, not /fonts/...).

### Connection Error Handling (BUNDLE-03)
- **D-08:** Enhance ConnectionBanner with native-specific messaging -- when IS_NATIVE is true and connection fails, show "Server unreachable -- check VPN/network" instead of generic "Connection lost".
- **D-09:** Add a network reachability pre-check in the auth bootstrap flow: before attempting fetchAnon(), check if the API server is reachable. On failure, show an informative error state rather than a blank screen or cryptic fetch error.
- **D-10:** The existing 3s splash screen fallback timeout (hideSplashWhenReady) is correct -- but after splash hides, ConnectionBanner MUST be visible if connection failed. Verify the state machine transition: splash hides → connection status is 'disconnected' → banner shows.

### Splash-to-Auth-to-Content Flow (BUNDLE-04)
- **D-11:** Verify the cold-start sequence on native: initializeNativePlugins() → initializeWebSocket() → hideSplashWhenReady() → React render. Ensure no visual discontinuity (white flash) between splash dismiss and first React paint.
- **D-12:** SplashScreen backgroundColor (#2b2521) already matches the app background. Verify the CSS `background-color` on `<html>` and `<body>` elements matches this exact value for seamless transition.
- **D-13:** Auth bootstrap flow already uses fetchAnon() through resolveApiUrl() -- native mode correctly gets absolute URL. No changes needed for the auth path itself.

### Device Validation (SC-5)
- **D-14:** Create a structured `DEVICE-VALIDATION-CHECKLIST.md` in the phase directory. Covers: keyboard avoidance, touch targets, haptics, status bar, safe-area, springs, splash flow, connection error states.
- **D-15:** Checklist items are binary pass/fail with specific actions to verify (e.g., "Open keyboard, type a message -- composer should slide up smoothly without jank").
- **D-16:** On-device testing requires: Mac with Xcode, iPhone 16 Pro Max (physical), Tailscale VPN to reach server. Document prerequisites.

### Claude's Discretion
- Exact shell script implementation details for cap-build.sh
- Level of detail in DEVICE-VALIDATION-CHECKLIST.md
- Whether to add a vite.config.ts `base` option or handle via Capacitor's webDir resolution
- Test file additions for network reachability logic

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Platform layer
- `src/src/lib/platform.ts` -- IS_NATIVE, API_BASE, WS_BASE, resolveApiUrl(), resolveWsUrl(), fetchAnon()
- `src/src/lib/native-plugins.ts` -- Plugin init, hideSplashWhenReady(), nativePluginsReady promise
- `src/src/lib/auth.ts` -- bootstrapAuth(), token management, fetchAnon usage

### Build & config
- `src/capacitor.config.ts` -- webDir, server.url, plugin config, iOS preferences
- `src/vite.config.ts` -- Build output config, outDir, manualChunks
- `src/package.json` -- cap:sync script, dependencies
- `deploy.sh` -- Existing deploy validation pattern to follow for cap-build.sh

### Connection handling
- `src/src/components/shared/ConnectionBanner.tsx` -- Current error/reconnect UI
- `src/src/lib/websocket-client.ts` -- WS connection state machine
- `src/src/stores/connection.ts` -- Connection state store

### iOS project
- `src/ios/App/App/Info.plist` -- ProMotion opt-in, app metadata
- `src/ios/App/App/capacitor.config.json` -- Synced config (auto-generated by cap sync)

### Prior phase context
- `.planning/phases/59-platform-foundation/59-CONTEXT.md` -- Platform detection decisions
- `.planning/phases/58-production-build-nginx/58-CONTEXT.md` -- Build/deploy patterns

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ConnectionBanner` component: Already handles 3 connection states (error, reconnecting, lost). Needs IS_NATIVE-aware messaging.
- `deploy.sh`: Validation gate pattern (TypeScript check, dist validation, health check) to replicate for iOS build script.
- `platform.ts`: IS_NATIVE flag available for conditional logic in ConnectionBanner and auth flow.
- `hideSplashWhenReady()`: Splash dismiss logic with 3s fallback and connection store subscription.

### Established Patterns
- Per-plugin try/catch isolation (SS-7) -- any new native code follows this pattern
- Dynamic imports behind IS_NATIVE guard -- zero web bundle impact
- CSS `[data-native]` selector for native-only styling
- `resolveApiUrl()` / `resolveWsUrl()` for all network requests

### Integration Points
- `main.tsx` -- Startup sequence (plugins → WS → splash → React)
- `ConnectionBanner` rendered in `AppShell.tsx` -- always mounted
- `vite.config.ts` build output → `capacitor.config.ts` webDir → `cap sync ios` pipeline
- `src/ios/` directory already initialized -- cap sync copies dist/ into it

</code_context>

<specifics>
## Specific Ideas

- Build script should mirror deploy.sh's style (colored output, fail/ok/step helpers, validation gates)
- ConnectionBanner native message should mention VPN specifically since the server is behind Tailscale
- Device validation checklist should be comprehensive enough to serve as UAT criteria for the entire v2.1 milestone
- Vite base path is critical -- Capacitor loads from file:// and any absolute asset paths will break

</specifics>

<quality_bar>
## Quality Bar (Bard Assessment)

**Risk flags from Bard-Prime consultation:**
1. **Cold-start race** -- Verify all hooks that need native plugins await `nativePluginsReady` before accessing modules. `useKeyboardOffset` should already do this; confirm during planning.
2. **Auth on unreachable server** -- Hardcoded API_BASE (100.86.4.57:5555) requires Tailscale. If device is on different network, app is DOA. Add graceful error handling, not runtime URL config (single-user dev tool).
3. **Splash timeout masking errors** -- The 3s fallback hides splash even if connection failed. ConnectionBanner MUST be visible after splash dismisses with broken state.
4. **iOS code signing** -- Real device deployment requires development team ID and device provisioning. This is a Mac-side prerequisite, not a code change. Document in checklist.
5. **Font/asset loading from file://*** -- file:// origin has different path resolution than http://. All asset URLs must be relative, not absolute.

**World-class execution for this phase:**
- Build produces correct bundle with zero manual fixups
- Every error state has a clear, actionable message (not "something went wrong")
- Validation checklist is thorough enough that any developer with a Mac could verify the entire v2.1 milestone
- No white flash, no blank screens, no silent failures

</quality_bar>

<deferred>
## Deferred Ideas

- Runtime-configurable API server URL (QR code scan or settings screen) -- would help if testing from different networks, but overkill for single-user dev tool. Consider for v2.2 if multi-device testing needed.
- CI/CD for iOS builds (GitHub Actions with macOS runner) -- not needed for single developer workflow.
- Automated device testing via Appium/XCTest -- manual checklist is sufficient for v2.1 scope.

</deferred>

---

*Phase: 63-bundled-assets-device-validation*
*Context gathered: 2026-03-28*
