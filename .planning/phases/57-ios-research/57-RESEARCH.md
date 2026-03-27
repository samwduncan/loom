# Phase 57: iOS Research - Research

**Researched:** 2026-03-27
**Domain:** Capacitor iOS integration, Tailscale networking in WKWebView, App Store viability
**Confidence:** MEDIUM

## Summary

This phase is a **research and prototyping phase**, not a production implementation phase. The three deliverables are: (1) a written assessment document, (2) Tailscale DNS testing results, and (3) a minimal Capacitor shell project. The key constraint is that **no Mac with Xcode is available** -- the server is AMD Ryzen 7 on Linux. This limits what can actually be compiled and tested on-device but does NOT prevent generating the Capacitor project scaffolding or writing the assessment.

The critical unknown -- Tailscale DNS from WKWebView -- has a **HIGH confidence theoretical answer**: it will work. Tailscale on iOS uses a system-wide VPN tunnel (NetworkExtension), and WKWebView traffic to 100.x.x.x addresses routes through that tunnel like any other app. The complication is ATS (App Transport Security): loading HTTP content over a raw IP requires `NSAllowsArbitraryLoads: true` in Info.plist, which Apple scrutinizes during App Store review. The practical test requires an actual iOS device with Tailscale installed, which means IOS-02 can only be verified theoretically from this Linux machine.

**Primary recommendation:** Use Capacitor 7.6.1 (not 8.x, which requires Xcode 26). Generate the `ios/` project scaffold on Linux via `cap init` + `cap add ios`. Configure `capacitor.config.ts` with `server.url` pointing at the Tailscale IP for development, and document the bundled-assets path for eventual App Store submission. The prototype shell is creatable on Linux; building/running it requires a Mac or cloud build service.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
None -- all implementation choices are at Claude's discretion (infrastructure/research phase).

### Claude's Discretion
All implementation choices are at Claude's discretion -- pure infrastructure/research phase. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

### Deferred Ideas (OUT OF SCOPE)
None -- discuss phase skipped.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| IOS-01 | Document Capacitor integration path with tradeoffs | Capacitor architecture research, App Store guidelines, two deployment models (bundled vs server.url), effort estimates |
| IOS-02 | Verify Tailscale DNS resolution from WKWebView sandbox | Tailscale VPN architecture on iOS, WKWebView networking model, ATS constraints, theoretical analysis (device test impossible from Linux) |
| IOS-03 | Prototype minimal Capacitor shell with Loom web build | Capacitor 7.6.1 scaffolding works on Linux, `cap init` + `cap add ios` + `cap sync`, configuration for remote server.url |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Zero new production deps for v2.0 milestone -- Capacitor packages are devDependencies only (scaffolding tool)
- No placeholders -- all generated code must be complete and functional
- Verify before done -- show evidence of results
- Quality bar: 10/10 rated by critical developer
- Evidence-based claims -- never claim "this works" without showing proof

## Standard Stack

### Core (devDependencies only -- scaffolding, not production)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @capacitor/core | 7.6.1 | Runtime bridge between web and native | Industry standard for web-to-native wrapping |
| @capacitor/cli | 7.6.1 | CLI tooling for init, sync, build | Required companion to core |
| @capacitor/ios | 7.6.1 | iOS platform support | Generates Xcode project structure |

### Why Capacitor 7.x, not 8.x
| Property | Capacitor 7 | Capacitor 8 |
|----------|-------------|-------------|
| Node.js minimum | 20+ | 22+ |
| Xcode minimum | 16.0+ | **26.0+** (very new) |
| iOS minimum | 15.0 | 15.0 |
| SPM default | No (CocoaPods) | Yes |
| Stability | Mature, 7.6.1 latest | 8.3.0 latest, but Xcode 26 requirement is bleeding edge |

Capacitor 7.6.1 is the right choice: it supports our Node 22, requires the more widely-available Xcode 16+, and is battle-tested. Upgrading to 8.x later is straightforward (breaking changes are minor).

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Capacitor | React Native | Full rewrite, not wrapping existing SPA -- wrong tool |
| Capacitor | PWA-only (no native) | Already done in Phase 56; native shell enables push notifications, App Store presence, home screen icon with badge |
| Capacitor | Tauri Mobile | Experimental, uses system webview directly but beta for iOS |
| Capacitor | Cordova | Legacy, Capacitor is its successor by the same team |

**Installation (devDependencies):**
```bash
cd src
npm install --save-dev @capacitor/core @capacitor/cli @capacitor/ios
```

**Version verification:**
- @capacitor/core: 7.6.1 (verified via npm view, published 2026-03-XX)
- @capacitor/cli: 7.6.1 (verified)
- @capacitor/ios: 7.6.1 (verified)

## Architecture Patterns

### Two Deployment Models

There are exactly two ways to run a Capacitor iOS app, and the research document must evaluate both:

#### Model A: Bundled Assets (App Store path)
```
iOS App
  +-- WKWebView loads capacitor://localhost/index.html
  |     (web build is embedded in app binary)
  +-- Fetches API/WS from remote server (100.86.4.57:5555)
```

**Pros:** Offline-capable UI, App Store compliant, fast initial load
**Cons:** Requires rebuilding/resubmitting for UI changes, needs CORS/ATS config for remote API calls
**Effort:** Medium -- need to configure API base URL to be dynamic (not relative `/api`)

#### Model B: Remote server.url (Development/personal use path)
```
iOS App
  +-- WKWebView loads http://100.86.4.57:5184
  |     (web content served from Tailscale server)
  +-- All requests go to remote (API proxied by Vite or same origin)
```

**Pros:** Zero rebuild for UI changes, identical to browser experience, simpler
**Cons:** Officially "not for production" per Capacitor docs, App Store rejection risk under guideline 4.2, requires Tailscale VPN active, no offline capability
**Effort:** Low -- just set `server.url` in config

### Recommended Project Structure
```
src/
  capacitor.config.ts     # Capacitor configuration
  ios/                    # Generated by `cap add ios` (gitignored or committed)
    App/
      App/
        Info.plist        # ATS settings, app metadata
        AppDelegate.swift
      App.xcodeproj/
      App.xcworkspace/
    capacitor-cordova-ios-plugins/
  dist/                   # Web build output (synced into ios/App/App/public/)
```

### Configuration Pattern
```typescript
// capacitor.config.ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.loom.app',
  appName: 'Loom',
  webDir: 'dist',
  server: {
    // Development: point at Tailscale server
    url: process.env.CAPACITOR_SERVER_URL || undefined,
    // Allow HTTP for Tailscale IP (no HTTPS cert)
    cleartext: true,
  },
  ios: {
    // Allow web content to load over HTTP
    // Required for Tailscale IP without HTTPS
    allowsLinkPreview: false,
    webContentsDebuggingEnabled: true,
  },
};

export default config;
```

### Anti-Patterns to Avoid
- **Hardcoding Tailscale IP in source code:** Use environment variable or config. The IP could change.
- **Using Capacitor 8 without verifying Xcode availability:** Xcode 26 is too new; stick with 7.x.
- **Bundling Capacitor packages as production deps:** These are build/scaffold tools, not runtime dependencies for the web app.
- **Attempting `cap run ios` on Linux:** Will fail. The scaffold (`cap add ios`) works; the build does not.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Web-to-native bridge | Custom WKWebView wrapper | Capacitor | Handles ATS, scheme registration, plugin bridge, lifecycle |
| iOS project scaffolding | Manual Xcode project | `cap add ios` | Generates correct structure with Swift/ObjC bridge code |
| Cloud iOS builds | Rent a Mac | Capgo Build or Xcode Cloud | Compiles, signs, uploads to TestFlight from Linux |
| API URL switching | Build-time find/replace | Capacitor `server.url` config | Environment-aware, no code changes |

## Tailscale DNS from WKWebView -- The Key Unknown (IOS-02)

### How Tailscale Works on iOS

1. Tailscale installs a **system-wide VPN** via iOS NetworkExtension framework
2. By default, it uses **split tunneling**: only traffic to 100.x.y.z addresses goes through the Tailscale tunnel
3. All other internet traffic goes directly (no exit node required)
4. The VPN profile appears in iOS Settings > General > VPN & Device Management

### How WKWebView Networking Works

1. WKWebView runs its networking in a **separate system process** (not inside the app process)
2. DNS resolution happens via the system daemon (mDNSResponder)
3. The system VPN tunnel applies to **all processes**, including the WKWebView networking daemon
4. Therefore: WKWebView traffic to 100.86.4.57 WILL route through the Tailscale tunnel

### Theoretical Verdict: HIGH Confidence It Works

**Traffic to a Tailscale 100.x IP from WKWebView will reach the Loom server** when:
- Tailscale iOS app is installed and connected
- The VPN tunnel is active
- The target machine (100.86.4.57) is on the same tailnet

**Caveats:**
1. **ATS (App Transport Security):** HTTP to a raw IP address requires `NSAllowsArbitraryLoads: true` in Info.plist. Capacitor sets this by default. For App Store submission, Apple may scrutinize this.
2. **No HTTPS without domain:** Tailscale MagicDNS provides `.ts.net` hostnames with auto-HTTPS via Let's Encrypt, but this requires Tailscale HTTPS feature to be enabled. Using `machine-name.tailnet-name.ts.net` with HTTPS is cleaner than raw IP + HTTP.
3. **VPN must be active:** If the user disconnects Tailscale, the app cannot reach the server. Unlike a PWA in Safari, a Capacitor app won't show a "VPN not connected" browser warning -- it will just fail silently unless we add error handling.
4. **WebSocket connections:** WKWebView supports WebSocket (`ws://`) through the VPN tunnel. The Loom `/ws` and `/shell` endpoints will work.

### What Cannot Be Tested from Linux

- Actual on-device verification (requires iOS device + Tailscale)
- ATS enforcement behavior (requires Xcode build)
- WebSocket latency through Tailscale on cellular vs WiFi
- MagicDNS hostname resolution timing

### Recommended Testing Protocol (for future Mac access)

```
1. Install Tailscale on iPhone, connect to tailnet
2. Open Safari, navigate to http://100.86.4.57:5184 -- verify Loom loads
3. Build Capacitor app with server.url = http://100.86.4.57:5184
4. Install on device, verify Loom loads in WKWebView
5. Test ws://100.86.4.57:5555/ws -- verify WebSocket streaming
6. Test with Tailscale disconnected -- verify graceful error
7. Test with MagicDNS hostname + HTTPS if enabled
```

## Common Pitfalls

### Pitfall 1: Assuming `cap add ios` Requires macOS
**What goes wrong:** Developers skip Capacitor scaffolding because they think it needs Xcode
**Why it happens:** The docs say "macOS required" for iOS development, which conflates scaffolding with building
**How to avoid:** `cap init` and `cap add ios` generate project files (templates + JSON) and work on any OS. Only `cap run ios` and Xcode compilation require macOS.
**Warning signs:** Error about missing Xcode command line tools when trying to BUILD, not when adding platform

### Pitfall 2: Using server.url in App Store Builds
**What goes wrong:** Apple rejects the app under Guideline 4.2 (minimum functionality) or 4.2.2 (web clippings)
**Why it happens:** An app that just loads a remote URL looks like a "wrapped website" to reviewers
**How to avoid:** For App Store: bundle assets via `cap sync`, connect to remote API only for data. For personal use: server.url is fine since you're not submitting to the store.
**Warning signs:** App Store rejection citing "this app is a repackaged website"

### Pitfall 3: Forgetting ATS for HTTP + IP Address
**What goes wrong:** WKWebView silently blocks HTTP requests to IP addresses
**Why it happens:** iOS App Transport Security defaults to requiring HTTPS for all connections
**How to avoid:** Set `NSAllowsArbitraryLoads: true` in Info.plist (Capacitor does this by default). Consider Tailscale HTTPS with MagicDNS for a cleaner solution.
**Warning signs:** Network requests fail with no visible error in WKWebView

### Pitfall 4: Relative API URLs in Web Build
**What goes wrong:** Bundled web build tries to fetch `/api/sessions` which resolves to `capacitor://localhost/api/sessions` -- not the remote server
**Why it happens:** Vite dev server proxies `/api` to localhost:5555, but bundled builds don't have a proxy
**How to avoid:** Make API base URL configurable. Either use an environment variable at build time or detect Capacitor runtime and switch URLs.
**Warning signs:** All API calls return 404 in the native app

### Pitfall 5: WebSocket URL Scheme Mismatch
**What goes wrong:** WebSocket connections fail because the app tries `wss://` when server only supports `ws://`
**Why it happens:** When using `capacitor://` scheme (HTTPS-like), the browser may upgrade WebSocket URLs
**How to avoid:** Explicitly construct WebSocket URLs with the correct scheme (`ws://` for HTTP, `wss://` for HTTPS)
**Warning signs:** WebSocket connection immediately closes with protocol error

## Code Examples

### Capacitor Configuration for Loom
```typescript
// src/capacitor.config.ts
import type { CapacitorConfig } from '@capacitor/cli';

const serverUrl = process.env.CAPACITOR_SERVER_URL;

const config: CapacitorConfig = {
  appId: 'com.loom.agent',
  appName: 'Loom',
  webDir: 'dist',
  server: {
    // When set: loads remote content (dev/personal use)
    // When undefined: loads bundled assets from dist/ (production)
    url: serverUrl,
    cleartext: true,
    // Allow navigation to the Tailscale server for API calls
    allowNavigation: ['100.86.4.57:*', '*.ts.net'],
  },
  ios: {
    webContentsDebuggingEnabled: true,
    preferredContentMode: 'mobile',
  },
};

export default config;
```

### Capacitor Init Commands (works on Linux)
```bash
# From src/ directory
npx cap init "Loom" "com.loom.agent" --web-dir dist

# Add iOS platform (generates ios/ folder -- no Xcode needed)
npx cap add ios

# After building web assets
npm run build

# Sync web build into iOS project
npx cap sync ios
```

### API Base URL Detection Pattern
```typescript
// src/src/lib/api-base.ts
// Source: Capacitor docs + project convention
import { Capacitor } from '@capacitor/core';

export function getApiBaseUrl(): string {
  // In Capacitor native app with bundled assets,
  // we need an absolute URL to the backend
  if (Capacitor.isNativePlatform()) {
    // TODO: Make configurable per environment
    return 'http://100.86.4.57:5555';
  }
  // In browser (dev or PWA), use relative URLs
  // Vite proxy handles /api -> localhost:5555
  return '';
}

export function getWsBaseUrl(): string {
  if (Capacitor.isNativePlatform()) {
    return 'ws://100.86.4.57:5555';
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}`;
}
```

## App Store Viability Assessment

### Guideline 4.2: Minimum Functionality
Apple rejects apps that are "repackaged websites." Loom in its current form IS essentially a web app in a WebView. To pass review:

**Must-haves for approval:**
- Bundle web assets (don't use server.url)
- Push notifications (at minimum -- this is the easiest native feature to add)
- Native splash screen and app icon
- Proper error states when offline/disconnected
- App-like navigation (already satisfied -- SPA with router)

**Nice-to-haves:**
- Face ID/Touch ID for authentication
- Haptic feedback on interactions
- Share extension (share URLs/text into Loom)

### Effort Estimate
| Milestone | Effort | Dependency |
|-----------|--------|------------|
| Prototype (server.url, personal use) | 2-4 hours | Linux only, no Mac needed |
| Buildable on Mac (local dev) | 1-2 hours | Mac with Xcode 16+ |
| App Store minimum viable | 2-3 days | Mac, Apple Developer Account ($99/yr), push notification server |
| Production quality | 1-2 weeks | Above + proper offline handling, native features |

### Recommendation for This Phase
**Build the prototype scaffold on Linux.** This satisfies IOS-03 (Capacitor shell exists and is configured to load Loom). Document the full path from prototype to App Store for IOS-01. Provide theoretical + evidence-based analysis for IOS-02 (Tailscale DNS), noting that on-device verification requires a Mac + iOS device.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Cordova | Capacitor | 2019+ | Modern JS/TS config, Swift by default, official Ionic successor |
| CocoaPods | Swift Package Manager | Cap 6+ (default in Cap 8) | Faster builds, Apple-native dependency management |
| UIWebView | WKWebView | iOS 12+ mandatory | Multi-process, better security, ATS enforcement |
| App wrapping via server.url | Bundled assets + remote API | Always recommended | App Store compliant, offline capable |

## Open Questions

1. **Does `cap add ios` actually succeed on Linux without CocoaPods/Xcode CLI tools?**
   - What we know: Multiple sources (Capgo blog, Ionic forum) say it generates the folder structure on Windows/Linux
   - What's unclear: Whether it errors on missing CocoaPods when using CocoaPods mode (SPM mode should be fine)
   - Recommendation: Try it during implementation. Use `--packagemanager SPM` flag if CocoaPods causes issues. Worst case: generate a minimal ios/ folder manually from the Capacitor template.

2. **Will Tailscale MagicDNS + HTTPS work from WKWebView?**
   - What we know: Tailscale offers auto-HTTPS via Let's Encrypt for `.ts.net` hostnames. Safari on iOS can browse these.
   - What's unclear: Whether WKWebView handles the Tailscale-provisioned TLS cert the same as Safari
   - Recommendation: Document as a future enhancement. For the prototype, use raw IP + HTTP.

3. **How does Capacitor handle the existing PWA manifest?**
   - What we know: Capacitor ignores the web manifest when running natively (uses Info.plist instead)
   - What's unclear: Whether the manifest in `public/manifest.json` causes any conflicts
   - Recommendation: No action needed. Capacitor and PWA manifest coexist peacefully.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Capacitor CLI | Yes | 22.22.1 | -- |
| npm | Package install | Yes | 10.9.4 | -- |
| Xcode | iOS build/run | No | -- | Cloud build (Capgo/Xcode Cloud), or defer to Mac |
| CocoaPods | iOS deps (legacy) | No | -- | Use SPM (Capacitor 7 supports it) |
| macOS | iOS simulator | No | -- | Physical device test deferred |
| iOS device | On-device testing | No | -- | Theoretical analysis + Safari-based evidence |
| Apple Developer Account | App Store submission | Unknown | -- | Not needed for prototype phase |

**Missing dependencies with no fallback:**
- Xcode/macOS blocks actual iOS build and simulator testing. The PROTOTYPE (scaffold + config) is still achievable on Linux.

**Missing dependencies with fallback:**
- CocoaPods not needed if using SPM mode
- iOS device testing deferred -- theoretical analysis provided with HIGH confidence

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 |
| Config file | `src/vite.config.ts` (test section) |
| Quick run command | `cd src && npx vitest run --reporter=verbose` |
| Full suite command | `cd src && npx vitest run --coverage` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| IOS-01 | Document exists with required sections | manual | Visual inspection of output document | N/A -- document deliverable |
| IOS-02 | DNS analysis documented with evidence | manual | Visual inspection of research findings | N/A -- document deliverable |
| IOS-03 | Capacitor config valid, ios/ folder generated | smoke | `cd src && npx cap doctor` (if available on Linux) | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `cd src && npx vitest run --reporter=verbose` (existing tests still pass)
- **Per wave merge:** Full suite with coverage
- **Phase gate:** All three deliverables exist and contain required content

### Wave 0 Gaps
- [ ] Verify `npx cap add ios` succeeds on Linux -- if it fails, document the error and provide manual alternative
- [ ] No new test files needed -- this is a research/document phase, not a code phase

## Sources

### Primary (HIGH confidence)
- [Capacitor official docs](https://capacitorjs.com/docs/config) -- server configuration, iOS options, Capacitor 8 requirements
- [Capacitor iOS docs](https://capacitorjs.com/docs/ios) -- iOS platform setup workflow
- [Capacitor environment setup](https://capacitorjs.com/docs/getting-started/environment-setup) -- system requirements per version
- npm registry -- verified Capacitor 7.6.1 package versions

### Secondary (MEDIUM confidence)
- [Capgo Build blog](https://capgo.app/blog/build-ios-app-from-windows-capacitor-capgo-build/) -- `cap add ios` works on Windows/Linux, cloud build workflow
- [Tailscale iOS docs](https://tailscale.com/kb/1020/install-ios) -- iOS VPN implementation
- [Tailscale DNS docs](https://tailscale.com/docs/reference/dns-in-tailscale) -- MagicDNS architecture
- [Apple Developer Forums](https://developer.apple.com/forums/thread/689859) -- WKWebView DNS uses system daemon
- [Shareup blog](https://shareup.app/blog/use-tailscale-to-test-websites-and-apps-against-a-local-server/) -- Tailscale 100.x IP access works from iOS Safari and apps
- [MobileLoud](https://www.mobiloud.com/blog/app-store-review-guidelines-webview-wrapper) -- App Store review guideline 4.2 analysis
- [Capacitor server.url discussion](https://github.com/ionic-team/capacitor/discussions/4080) -- production use risks and workarounds
- [GitHub Issue #13799](https://github.com/tailscale/tailscale/issues/13799) -- MagicDNS hostname detection issues on iOS (open)

### Tertiary (LOW confidence)
- WKWebView + per-app VPN limitations -- extrapolated from system VPN vs per-app VPN distinction; not directly tested
- `cap add ios` on Linux success -- multiple secondary sources agree, but no official Capacitor statement

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Capacitor version selection well-supported by npm data and official docs
- Architecture (two deployment models): HIGH -- well-documented in Capacitor ecosystem
- Tailscale DNS from WKWebView: MEDIUM -- strong theoretical basis (system VPN routes all traffic) but no on-device test from this machine
- App Store viability: MEDIUM -- guideline 4.2 analysis from multiple sources, but outcome depends on specific reviewer
- `cap add ios` on Linux: MEDIUM -- multiple sources confirm, but edge cases possible

**Research date:** 2026-03-27
**Valid until:** 2026-04-27 (Capacitor releases are frequent but 7.x is stable)
