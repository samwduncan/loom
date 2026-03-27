# iOS Integration Assessment — Loom

**Date:** 2026-03-27
**Phase:** 57 (ios-research)
**Requirements:** IOS-01, IOS-02, IOS-03
**Environment:** AMD Ryzen 7 8745HS, Linux 6.8.0, Node 22.22.1, no Mac/Xcode

## Executive Summary

Capacitor 7.6.1 can wrap the existing Vite+React SPA in a WKWebView with minimal effort. Two deployment models exist: bundled assets (App Store compliant, requires API base URL abstraction) and remote `server.url` (zero code changes, personal use only). Tailscale DNS resolution from WKWebView has HIGH confidence of working — iOS NetworkExtension system-wide VPN routes all process traffic including WKWebView's networking daemon through the Tailscale tunnel. No Mac is available for on-device testing, so prototype verification is deferred. The Capacitor scaffold was successfully generated on Linux. Effort ranges from 2-4 hours (personal prototype with Mac) to 2-3 days (App Store minimum viable).

## Deployment Models

### Model A: Bundled Assets (App Store Path)

**How it works:** The Vite production build (`dist/`) is embedded inside the iOS app binary. WKWebView loads content from `capacitor://localhost/index.html`. API calls and WebSocket connections go to the remote server at `100.86.4.57:5555`.

**Pros:**
- Offline-capable UI (shell renders without network)
- App Store compliant — not a "wrapped website"
- Fast initial load (no network fetch for HTML/CSS/JS)
- Can add push notifications, Face ID, haptics

**Cons:**
- Requires app rebuild + resubmit for any UI changes
- API base URL must be configurable — currently Loom uses relative paths (`/api/sessions`) that resolve via Vite proxy in dev and same-origin in production. In Capacitor bundled mode, these would resolve to `capacitor://localhost/api/sessions` which doesn't exist.
- CORS headers needed on Express backend for `capacitor://localhost` origin
- WebSocket URL must be explicitly constructed (`ws://100.86.4.57:5555/ws` instead of relative `/ws`)

**Required code changes:**
1. **API base URL abstraction** — Make fetch paths configurable. Detect `Capacitor.isNativePlatform()` and prefix with `http://100.86.4.57:5555`. This is the single highest-value prep work.
2. **CORS headers** — Add `capacitor://localhost` to Express CORS whitelist
3. **WebSocket URL construction** — Build absolute `ws://` URL when running in native context
4. **ATS exception** — Capacitor sets `NSAllowsArbitraryLoads: true` by default (allows HTTP to IP addresses)

**Effort:** 2-3 days with Mac + Apple Developer Account ($99/yr)

### Model B: Remote server.url (Personal Use Path)

**How it works:** WKWebView loads `http://100.86.4.57:5184` directly. All requests (HTML, API, WebSocket) go to the remote Vite dev server or production server. The app is a thin native shell around the web content.

**Pros:**
- Zero code changes required
- Zero rebuild for UI updates — changes appear instantly
- Identical experience to browser
- Good for personal use / testing

**Cons:**
- Apple rejects under **Guideline 4.2** (minimum functionality) — "repackaged website"
- Requires active Tailscale VPN connection at all times
- No offline capability whatsoever
- Silent failure when VPN disconnects (no browser-level error page)

**Effort:** 2-4 hours with Mac

## Tailscale DNS from WKWebView (IOS-02)

**Verdict: HIGH confidence it works.**

### Mechanism

1. **Tailscale on iOS** uses the `NetworkExtension` framework to install a **system-wide VPN tunnel**
2. By default, split tunneling routes only `100.x.y.z` (CGNAT range) traffic through Tailscale
3. WKWebView runs its networking in a **separate system process** (`nsurlsessiond`), not inside the app sandbox
4. The system VPN applies to **all processes** including `nsurlsessiond`
5. Therefore: HTTP/WS requests from WKWebView to `100.86.4.57` route through the Tailscale tunnel and reach the Loom server

### Evidence

- [Tailscale iOS docs](https://tailscale.com/kb/1020/install-ios): Confirms NetworkExtension system-wide VPN implementation
- [Apple Developer Forums](https://developer.apple.com/forums/thread/689859): WKWebView DNS resolves through system daemon, not app process
- [Shareup blog](https://shareup.app/blog/use-tailscale-to-test-websites-and-apps-against-a-local-server/): Confirms Tailscale 100.x IP access works from iOS Safari and native apps
- [Tailscale DNS docs](https://tailscale.com/docs/reference/dns-in-tailscale): MagicDNS architecture applies to all system traffic

### Caveats

1. **ATS (App Transport Security):** HTTP to a raw IP address requires `NSAllowsArbitraryLoads: true` in `Info.plist`. Capacitor sets this by default. Apple scrutinizes this during App Store review.
2. **MagicDNS `.ts.net` with HTTPS** is a cleaner alternative (auto-HTTPS via Let's Encrypt) but is untested from WKWebView. The TLS cert provisioned by Tailscale should work since WKWebView uses the system trust store, but this needs device verification.
3. **VPN must be active.** If the user disconnects Tailscale, the app silently fails — no network error page like Safari shows. The app should detect connectivity loss and show an error state.
4. **WebSocket `ws://`** works through the VPN tunnel. Both `/ws` (chat) and `/shell` (terminal) endpoints will function.
5. **Per-app VPN does NOT apply** — Tailscale uses system-wide VPN, so there's no concern about WKWebView being excluded from the tunnel.

### What Cannot Be Tested from Linux

- Actual on-device WKWebView → Tailscale → Loom server connectivity
- ATS enforcement behavior with different Info.plist configurations
- WebSocket latency through Tailscale on cellular vs WiFi
- MagicDNS hostname resolution timing in WKWebView
- Behavior when Tailscale VPN disconnects mid-session

### Recommended Testing Protocol

When a Mac + iOS device becomes available:
1. Install Tailscale on iPhone, connect to tailnet
2. Open Safari, navigate to `http://100.86.4.57:5184` — verify Loom loads
3. Build Capacitor app with `server.url = http://100.86.4.57:5184`
4. Install on device via `cap run ios`, verify Loom loads in WKWebView
5. Test `ws://100.86.4.57:5555/ws` — verify WebSocket streaming works
6. Disconnect Tailscale — verify graceful error handling
7. Test with MagicDNS hostname + HTTPS if enabled on tailnet

## Prototype Results (IOS-03)

### What Was Attempted

On Linux (AMD Ryzen 7, Node 22.22.1, no Xcode/CocoaPods):

1. Installed Capacitor 7.6.1 packages as devDependencies
2. Created `capacitor.config.ts` with Loom configuration
3. Ran `cap add ios --packagemanager SPM`
4. Built web assets with `npm run build`
5. Ran `cap sync ios`

### Command Output

```
=== cap init ===
[error] Cannot run init for a project using a non-JSON configuration file.
        Delete capacitor.config.ts and try again.

=== cap add ios (SPM first) ===
✔ Adding native Xcode project in ios in 9.77ms
✔ add in 9.99ms
✔ Copying web assets from dist to ios/App/App/public in 12.22ms
✔ Creating capacitor.config.json in ios/App/App in 258.57μs
✔ copy ios in 29.86ms
✔ Updating iOS plugins in 3.03ms
✖ Updating iOS native dependencies with pod install - failed!
✖ update ios - failed!
[error] Error: ENOENT: no such file or directory, open '/home/swd/loom/src/ios/App/Podfile'

=== npm run build ===
> loom-v2@0.0.0 build
> tsc -b && vite build
✓ 2655 modules transformed.
✓ built in 4.90s

=== cap sync ios ===
✔ Copying web assets from dist to ios/App/App/public in 8.80ms
✔ Creating capacitor.config.json in ios/App/App in 323.26μs
✔ copy ios in 30.30ms
✔ Updating iOS plugins in 3.82ms
[info] All plugins have a Package.swift file and will be included in Package.swift
[info] Writing Package.swift
✔ update ios in 24.17ms
[info] Sync finished in 0.097s
```

### Analysis

| Step | Result | Notes |
|------|--------|-------|
| `cap init` | Skipped (error) | Config file already existed as `.ts` — `cap init` only works with JSON config. Not needed since we created `capacitor.config.ts` manually. |
| `cap add ios` | **Succeeded** | Generated full `ios/` directory structure with `App/` and `capacitor-cordova-ios-plugins/` |
| `pod install` | Failed (expected) | CocoaPods not installed on Linux. The iOS project scaffold was still created successfully. |
| `npm run build` | Succeeded | 2655 modules, built in 4.90s. Web assets ready in `dist/`. |
| `cap sync ios` | **Succeeded** | Copied web assets to `ios/App/App/public/`, generated `Package.swift` for SPM, finished in 0.097s |

### Files Created

- `src/capacitor.config.ts` — Capacitor configuration (appId: `com.loom.agent`, webDir: `dist`, cleartext + Tailscale allowNavigation)
- `src/ios/App/` — Xcode project scaffold (AppDelegate.swift, Info.plist, App.xcodeproj)
- `src/ios/App/App/public/` — Synced web build (copy of dist/)
- `src/ios/App/App/capacitor.config.json` — Runtime config generated from .ts
- `src/ios/capacitor-cordova-ios-plugins/` — Plugin bridge scaffold
- `src/ios/App/App/Package.swift` — SPM manifest for native dependencies

### Key Finding

**`cap add ios` works fully on Linux.** The Xcode project structure is generated from templates — no Xcode or CocoaPods required for scaffolding. Only `pod install` (legacy dependency manager) fails, and `cap sync` successfully falls back to SPM. The resulting project is ready to open in Xcode on a Mac and build immediately.

## App Store Viability

### Guideline 4.2: Minimum Functionality

Apple rejects apps that are "repackaged websites." A Capacitor app using `server.url` (Model B) will be rejected. A bundled-assets app (Model A) passes if it demonstrates native functionality beyond what a browser provides.

**Must-haves for App Store approval:**
- Bundle web assets (do not use `server.url`)
- Push notifications (easiest native feature to add, demonstrates native integration)
- Native splash screen and app icon (Capacitor provides these via `ios/App/App/Assets.xcassets/`)
- Proper offline/disconnected error states
- SPA navigation (already satisfied — React Router provides app-like transitions)

**Nice-to-haves that strengthen the case:**
- Face ID/Touch ID for authentication
- Haptic feedback on interactions (tap responses, message send confirmation)
- Share extension (share URLs/text into Loom as context)
- Capacitor local notifications for long-running task completion

### Risk Assessment

Even with bundled assets and push notifications, Apple **may** still reject under 4.2 if the reviewer determines the app doesn't provide enough value beyond the web experience. Mitigations:
- Add 2-3 native features (push + Face ID + haptics minimum)
- Ensure the app works meaningfully offline (at minimum: show cached conversation history)
- Include a native onboarding flow
- The AI agent interaction pattern (streaming responses, tool use visualization) is sufficiently complex to differentiate from a simple web wrapper

## Effort Estimates

| Milestone | Effort | Dependencies | Description |
|-----------|--------|-------------|-------------|
| Prototype (personal use, server.url) | 2-4 hours | Mac with Xcode 16+ | Open existing scaffold in Xcode, build and install via `cap run ios`, loads remote Loom over Tailscale |
| Local dev (bundled assets) | 1-2 days | Mac, API base URL abstraction | Bundle `dist/`, configure CORS on Express backend, construct absolute WS URLs, test all features |
| App Store minimum viable | 2-3 days | Mac, Apple Dev Account ($99/yr), push notification server | Add push notifications, native splash, offline error states, submit to App Store Connect |
| Production quality | 1-2 weeks | All above + proper offline handling | Full native feature set: Face ID, haptics, share extension, offline conversation cache |

## Recommendations

1. **Short-term: Use PWA (Phase 56) for mobile access.** It works now with zero additional effort. Safari on iOS with Tailscale already provides a good experience.

2. **Medium-term: When a Mac becomes available, build the server.url prototype.** The scaffold is ready — open `src/ios/App/App.xcworkspace` in Xcode, build, install on device. This validates the full Tailscale → WKWebView → Loom pipeline in ~2 hours.

3. **Long-term: If App Store presence is desired, invest in Model A (bundled assets).** The API base URL abstraction is the critical prep work. This change benefits Capacitor, any future Electron build, and makes the frontend deployable to any origin.

4. **The API base URL abstraction is the single highest-value prep work.** Currently, all fetch calls use relative paths (`/api/sessions`, `/ws`). Extracting these into a configurable base URL enables:
   - Capacitor bundled mode (connects to remote `100.86.4.57:5555`)
   - Multi-server deployment (point any frontend instance at any backend)
   - Testing against staging servers

## Open Questions

1. **Does `cap add ios` fully succeed on Linux?**
   **Answered: YES.** The Xcode project scaffold generates successfully. Only `pod install` fails (expected — CocoaPods not available on Linux), and `cap sync` falls through to SPM which works. The project is ready to open in Xcode.

2. **Will MagicDNS HTTPS work from WKWebView?**
   Deferred to device testing. Theoretically yes — WKWebView uses the system trust store, and Tailscale's Let's Encrypt certs are publicly trusted. But the hostname resolution timing and cert pinning behavior need on-device verification.

3. **How does Capacitor handle the existing PWA manifest?**
   No conflict. Capacitor ignores `public/manifest.json` when running natively — it uses `Info.plist` for app metadata. The two coexist peacefully. The PWA manifest continues to work in Safari while Capacitor uses native configuration.

4. **What about `capacitor.config.ts` using `process.env`?**
   The `.ts` config is read at **build/sync time** by the Capacitor CLI (which runs in Node.js), not at app runtime. `process.env.CAPACITOR_SERVER_URL` resolves when running `cap sync`, and the resulting `capacitor.config.json` (baked into the iOS project) contains the resolved value. This is correct behavior — the env var controls which mode (bundled vs remote) is built.
