# Technology Stack: v3.0 "The App" -- React Native + Expo iOS

**Project:** Loom v3.0 "The App"
**Researched:** 2026-03-30
**Target:** New React Native + Expo iOS app in `mobile/` directory
**Overall Confidence:** HIGH (versions verified via npm, features verified via official docs/changelogs)

---

## Decision Context

The existing Loom stack (Vite 7 + React 19 + TypeScript + Tailwind v4 + Zustand + Express backend) is validated and unchanged. This document covers ONLY what's needed for the new native iOS app. The web app continues as the desktop experience. The backend is platform-agnostic and requires zero changes.

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Expo SDK | 55.0.9 | App framework, build system, native module management | Latest stable (released 2026-03-03). Includes RN 0.83, React 19.2, New Architecture only. Auto-detects monorepo. EAS Build handles signing/provisioning. |
| React Native | 0.83.x | Native UI runtime | Bundled with Expo SDK 55. New Architecture (Fabric + JSI + TurboModules) only -- old arch removed. Hermes v1 opt-in for faster startup. |
| React | 19.2.x | Component model | Bundled with Expo SDK 55. Same major version as web app (React 19), maximizing code sharing for hooks/stores. |
| TypeScript | ~5.9 | Type safety | Match web app version. Expo has first-class TS support. |
| Expo Router | 55.0.8 | File-based navigation | Built on React Navigation. File-based routing (`src/app/` directory). Deep linking, typed routes, native tab bars. Replaces react-router-dom from web. |

**Why Expo SDK 55 (not 54):** SDK 55 is the current `latest` on npm. SDK 54 was the last to support Legacy Architecture -- since we're greenfield, there's no reason to carry dead weight. SDK 55's native tab APIs, Hermes v1 opt-in, and Expo UI SwiftUI components are directly useful.

**Why not bare React Native:** Expo handles iOS build pipeline (code signing, provisioning profiles, entitlements), OTA updates, and native module auto-linking. Going bare means fighting Xcode directly -- exactly the kind of platform friction that kills solo dev momentum.

### Gestures & Animation (The Core of "Feels Native")

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| react-native-reanimated | 4.3.0 | 120Hz UI-thread animations, spring physics | Runs on UI thread via worklets (not JS thread). Spring physics, shared values, layout animations. The foundation for "every interaction has physics." Reanimated 4 is New Architecture only -- perfect for SDK 55. |
| react-native-gesture-handler | 2.30.1 | Native gesture recognizers | Pan, pinch, tap, long-press using iOS UIGestureRecognizer (not JS touch events). Composable gestures solve the exact swipe-conflict bugs that killed Capacitor. |
| react-native-worklets | 0.8.1 | Worklet threading (Reanimated dependency) | Required by Reanimated 4. Enables running JS on UI thread for zero-latency gesture responses. |

**Why these matter so much:** The entire reason Capacitor failed was WKWebView's gesture system. These three libraries give Loom access to the same native gesture recognizers that ChatGPT and Claude iOS use. This is the single most important stack decision.

### Styling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| NativeWind | 4.2.3 | Tailwind CSS classes in React Native | Uses Tailwind CSS v3 syntax (className="flex-1 bg-black"). Stable, production-proven. swd already knows Tailwind from the web app. Dramatically faster development than raw StyleSheet. |

**Why NativeWind v4 (not v5):** v5 (currently 5.0.0-preview.3) uses Tailwind CSS v4 and is explicitly pre-release, not recommended for production. v4 is battle-tested in production apps. Since Loom's web app uses Tailwind v4, there will be minor syntax differences (v4 uses `@theme` instead of `tailwind.config.js`), but the class names themselves are 95% identical. Start on v4, migrate to v5 when it stabilizes (likely mid-2026).

**Rejected alternative: StyleSheet only.** Writing `StyleSheet.create({ container: { flex: 1, backgroundColor: '#000' } })` for every component is tedious and loses the rapid iteration speed that Tailwind provides. NativeWind is the clear winner for a developer coming from Tailwind web.

### State Management & Data

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Zustand | 5.0.12 | Global state (shared with web) | Already used in web app (5 stores). Works identically in React Native. Zero provider wrapping. Selector-based re-renders prevent performance death during streaming. **This is the primary code-sharing vector.** |
| react-native-mmkv | 4.3.0 | Fast persistent storage | 30-100x faster than AsyncStorage. Zustand persist middleware works with MMKV via custom storage adapter. Replaces localStorage from web for persisting timeline, UI preferences, connection state. |
| expo-secure-store | 55.0.9 | JWT token storage | Uses iOS Keychain under the hood. Never store JWT in MMKV/AsyncStorage (unencrypted). The backend issues never-expiring JWTs, so this is set-once on login. |

**Code sharing strategy for stores:** The 5 Zustand stores (timeline, stream, ui, connection, file) move to a shared `packages/shared/` directory. The store logic is identical; only the persistence layer changes (localStorage on web, MMKV on native). Use Zustand's `persist` middleware with platform-specific `createJSONStorage()` adapters.

### Networking & Streaming

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| WebSocket (built-in) | -- | Real-time chat streaming | React Native has native WebSocket support. The existing `WebSocketClient` class, stream multiplexer, and token budget logic transfer directly. No library needed. |
| fetch (built-in) | -- | REST API calls | React Native's fetch is native (not polyfilled). The existing `apiFetch` wrapper transfers with minimal changes (base URL becomes the Tailscale server address). |

**What transfers unchanged from web:**
- `WebSocketClient` class (connect, reconnect, heartbeat)
- Stream multiplexer (thinking + content + tool channels)
- Token budget tracking
- Tool-call registry (Map pattern)
- Follow-up suggestion heuristics
- Auth flow (JWT token in headers)

**What needs platform adaptation:**
- Base URL resolution (hardcoded Tailscale IP instead of relative paths)
- Reconnection strategy (needs to handle iOS app backgrounding/foregrounding)
- Push notification integration for missed messages

### Push Notifications

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| expo-notifications | 55.0.14 | Push notifications + local notifications | Expo Push Service handles APNs complexity. Free (600/sec/project limit, more than enough). Actionable notifications for permission approve/deny. Development builds required (no Expo Go). |

**Backend integration:** The Express backend needs a new endpoint to receive Expo push tokens and a service to send notifications when Claude asks a question or needs permission. This is the only backend change required for v3.0.

**Notification categories for Loom:**
1. **Permission request** -- "Claude wants to write to src/App.tsx" with Approve/Deny action buttons
2. **Question** -- "Claude is asking: Should I refactor this?" with Open action
3. **Session complete** -- "Session finished: 47 messages, 12,000 tokens" (informational)

### Dynamic Island & Live Activities

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| expo-live-activity | 0.4.2 | Dynamic Island + Lock Screen Live Activities | Software Mansion library. Start/update/stop Live Activities from RN. Shows active session status (model name, token count, streaming indicator) in Dynamic Island. |

**Maturity note:** expo-live-activity is relatively new (v0.4.2) but from Software Mansion (the team behind Reanimated and Gesture Handler). It requires a SwiftUI widget extension, which Expo's config plugins can scaffold. This is a v3.1+ feature -- defer from initial release but plan the architecture to support it.

**Confidence:** MEDIUM. The library works but requires native Swift widget code. Plan for it, don't implement in first milestone.

### Visual Effects & GPU Rendering

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @shopify/react-native-skia | 2.5.4 | GPU-accelerated 2D graphics, shaders, mesh gradients | Skia renders on GPU thread (not JS or UI). Perfect for Aurora streaming background, ambient gradient effects, and the "living surfaces" design direction. WebGPU support coming via Graphite backend. |

**Why Skia instead of OGL (web choice):** On web, OGL is lighter than Three.js for 2D shaders. On React Native, Skia is the standard for GPU rendering -- it's what Shopify, Expo, and the RN ecosystem have converged on. Skia also integrates with Reanimated for animated shader uniforms.

**Phase target:** v3.0 Phase 3 (Elevation). Don't add Skia until the base chat experience is polished. The design philosophy says: "Content is the star, effects enhance."

### Haptics

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| expo-haptics | 55.0.9 | Tactile feedback | Direct access to iOS Taptic Engine. impactAsync(), selectionAsync(), notificationAsync(). Replaces @capacitor/haptics. The existing hapticEvent grammar (from Phase 62) transfers as-is -- just swap the underlying API calls. |

### Lists & Scrolling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @shopify/flash-list | 2.3.1 | High-performance recycling list for chat messages | 5-10x faster than FlatList via cell recycling (not virtualization). FlashList v2 auto-handles item sizing. Critical for chat with variable-height messages (text, code blocks, tool cards). Discord uses a similar custom native list for chat. |

**Why not FlatList:** FlatList creates/destroys cells as you scroll. For a chat app with complex message components (markdown, code blocks, tool cards), this causes visible jank. FlashList recycles cells, keeping memory and CPU stable.

**Alternative considered:** Building the chat list natively (like Discord did with FastList). Unnecessary complexity for v3.0 -- FlashList handles the load. Revisit only if profiling shows issues with 500+ message sessions.

### Markdown & Streaming Rendering

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| react-native-streamdown | 0.1.1 | Streaming markdown from LLM | Software Mansion. Processes markdown on worklet thread (zero UI lag). Renders streaming markdown correctly mid-token with no visual glitches. Built on react-native-enriched-markdown + remend + react-native-worklets. |
| react-native-enriched-markdown | 0.4.1 | Native markdown text rendering | Renders markdown as native Text components (not WebView). Supports headings, lists, code blocks, blockquotes, inline images. Used by Streamdown under the hood. |

**Critical gap: Syntax highlighting.** react-native-enriched-markdown does NOT have built-in syntax highlighting for code blocks. The web app uses Shiki, which is browser-only. Options:
1. **react-native-nitro-markdown** -- Has syntax highlighting but less mature streaming support
2. **Custom Shiki-to-native bridge** -- Complex, fragile
3. **Plain code blocks initially, add syntax highlighting in v3.1** -- Recommended. Get the streaming feel right first.

**Streaming architecture note:** The web app uses a custom two-phase renderer (rAF innerHTML for streaming, react-markdown for finalized). On RN, react-native-streamdown replaces both phases. The stream multiplexer feeds tokens to StreamdownText, which handles both live and finalized rendering. This is actually SIMPLER than the web approach.

**Confidence:** MEDIUM. react-native-streamdown is v0.1.1 -- very new. Software Mansion's track record is excellent, but test thoroughly. Fallback: build a simpler streaming renderer using Reanimated + native Text components.

### Safe Area & Device Adaptation

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| react-native-safe-area-context | 5.7.0 | Safe area insets (notch, home indicator, Dynamic Island) | Installed automatically as Expo Router peer dependency. Replaces the CSS `env(safe-area-inset-*)` approach from web. Provides `useSafeAreaInsets()` hook. |

### Development & Build

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| EAS Build | (cloud service) | iOS builds without local Xcode | Builds on Expo's macOS VMs. Handles code signing, provisioning profiles, entitlements. Dev builds for testing, production builds for App Store. Free tier available. |
| EAS Update | (cloud service) | Over-the-air JS updates | Push JS/asset changes without App Store review. Critical for rapid iteration. |
| expo-dev-client | (bundled with SDK 55) | Development builds | Debug builds with hot reload on device. Replaces Expo Go for custom native modules. |

**Local build option:** `eas build --local` runs builds on your machine. Requires macOS (swd's Mac mini). Useful for debugging native issues. The Linux dev server can run Metro bundler but cannot build iOS binaries.

**Build workflow:**
1. Develop on Linux server (Metro bundler + hot reload to iPhone via Tailscale)
2. Build with EAS Build (cloud) or `eas build --local` on Mac mini
3. Install dev build on iPhone 16 Pro Max via EAS
4. OTA updates via EAS Update for JS-only changes

---

## Monorepo Structure

### Recommended Layout

```
loom/
  package.json              # Root workspace config (npm workspaces)
  packages/
    shared/                 # Shared between web and native
      package.json
      src/
        stores/             # 5 Zustand stores (timeline, stream, ui, connection, file)
        api/                # WebSocketClient, apiFetch, auth
        streaming/          # Stream multiplexer, token budget
        types/              # Shared TypeScript types
        utils/              # Tool-call registry, follow-up heuristics
  src/                      # Web app (existing, unchanged)
  server/                   # Backend (existing, unchanged)
  mobile/                   # React Native app (NEW)
    package.json
    app.json                # Expo config
    eas.json                # EAS Build profiles
    src/
      app/                  # Expo Router file-based routes
        (tabs)/             # Tab navigator group
          index.tsx         # Chat screen
          sessions.tsx      # Session list
          _layout.tsx       # Tab bar layout
        _layout.tsx         # Root layout
      components/           # RN components (View/Text/etc)
      hooks/                # RN-specific hooks
      lib/                  # Platform adapters (MMKV storage, haptics)
      theme/                # Design tokens, colors, typography
```

### Why npm Workspaces (not Turborepo/pnpm)

The project already uses npm (package-lock.json exists, no pnpm-lock.yaml). Switching package managers mid-project adds unnecessary friction. npm workspaces are sufficient for a two-app monorepo with one shared package.

**Configuration:**

Root `package.json` additions:
```json
{
  "workspaces": [
    "packages/*",
    "mobile"
  ]
}
```

**Metro configuration:** The mobile app's `metro.config.js` must resolve dependencies from the monorepo root. Expo SDK 55 auto-detects monorepos and configures this.

**Important:** React and React Native must be singletons (only one copy in the dependency tree). The mobile app owns these dependencies; the shared package uses `peerDependencies`.

### What Moves to `packages/shared/`

| Module | Current Location | Shared? | Notes |
|--------|-----------------|---------|-------|
| Zustand stores | `src/stores/` | YES | Store logic identical. Persistence adapter differs per platform. |
| WebSocketClient | `src/lib/websocket-*.ts` | YES | Platform-agnostic (RN has native WebSocket). |
| Stream multiplexer | `src/lib/stream-multiplexer.ts` | YES | Pure functions, zero DOM dependencies. |
| Token budget | `src/lib/token-budget.ts` | YES | Pure logic. |
| Tool-call registry | `src/lib/tool-registry.ts` | YES | Pure Map pattern. |
| API fetch wrapper | `src/lib/api.ts` | YES (with adapter) | Base URL differs per platform. Use `getBaseUrl()` adapter. |
| Auth flow | `src/lib/auth.ts` | PARTIAL | Token storage differs (localStorage vs SecureStore). |
| Types | `src/types/` | YES | All shared TypeScript interfaces. |
| Follow-up heuristics | `src/lib/follow-up.ts` | YES | Pure regex, no DOM. |
| React components | `src/components/` | NO | RN uses View/Text, not div/span. |
| CSS/Tailwind styles | `src/*.css` | NO | NativeWind classes, not CSS files. |
| Platform detection | `src/lib/platform.ts` | NO | Completely different per platform. |

**Estimated shared code:** ~35-40% of the web app's business logic transfers to the shared package. This matches the PLATFORM-RESEARCH.md estimate.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Framework | Expo SDK 55 | Bare React Native | Expo handles build pipeline, native modules, OTA updates. Going bare means fighting Xcode for every native feature. |
| Framework | Expo SDK 55 | Expo SDK 54 | SDK 54 was last to support Legacy Arch. No reason to carry that weight on a greenfield project. |
| Styling | NativeWind 4 | StyleSheet | Dramatically slower development. swd knows Tailwind. |
| Styling | NativeWind 4 | NativeWind 5 | v5 is pre-release (preview.3). Production stability matters more than Tailwind v4 parity. |
| Styling | NativeWind 4 | Tamagui | Heavier, opinionated component library. NativeWind is styling-only, composes with any component. |
| Styling | NativeWind 4 | Unistyles | Good library but smaller ecosystem than NativeWind. NativeWind has more community support and documentation. |
| Navigation | Expo Router | React Navigation (direct) | Expo Router IS React Navigation with file-based routing. Less config, typed routes, deep linking out of the box. |
| State | Zustand | Redux Toolkit | Already using Zustand on web. Zustand is lighter, simpler, and the stores transfer directly. |
| State | Zustand | Jotai | Atomic model doesn't match existing 5-store architecture. Would require rewriting all state logic. |
| Lists | FlashList | FlatList | FlashList is 5-10x faster for variable-height items. Chat messages are exactly this use case. |
| Lists | FlashList | react-native-skia-list | Experimental, renders via Skia canvas. Overkill and risky for v3.0. |
| Markdown | react-native-streamdown | Custom renderer | Streamdown handles the hard part (streaming + correct markdown mid-token). Building custom is reinventing the wheel. |
| Markdown | react-native-streamdown | react-native-markdown-display | No streaming support. Would need a two-phase renderer like the web app. |
| Storage | MMKV | AsyncStorage | MMKV is 30-100x faster. Critical for persisting store state without blocking the UI thread on app launch. |
| Notifications | expo-notifications | react-native-firebase | Expo Push Service is simpler (no Firebase project setup). Sufficient for single-user app. Firebase adds unnecessary complexity. |
| GPU rendering | react-native-skia | react-native-gl-react | Skia is the ecosystem standard. gl-react is less maintained. |
| Haptics | expo-haptics | react-native-haptic-feedback | expo-haptics is simpler and sufficient for the three haptic types Loom uses (impact, selection, notification). |

---

## What NOT to Add

| Library | Why Excluded |
|---------|-------------|
| Socket.IO | Loom uses raw WebSocket, not Socket.IO. Adding it would mean rewriting the backend. |
| react-native-firebase | Overkill. expo-notifications handles push without Firebase. |
| @react-navigation/native | Already bundled inside Expo Router. Don't install separately. |
| react-native-web | NOT needed for v3.0. The web app stays as Vite + React. Only relevant if/when we unify codebases (v4.0+). |
| styled-components | NativeWind covers styling. No need for CSS-in-JS. |
| Redux / MobX | Zustand is already the state layer. Don't introduce a second state management library. |
| Lottie | Performance is unacceptable on mobile (91.8% CPU, 17fps vs Skia's 60fps). Already recommended for removal from web app. |
| react-native-svg | Only add if specific SVG rendering is needed. Skia handles most 2D graphics cases. |
| expo-camera / expo-image-picker | Not needed for v3.0 scope. Chat is text-only initially. Add for image attachment support in v3.1+. |
| react-native-webview | Avoid embedding WebViews. The whole point of going native is to NOT use WebViews. Only consider for complex markdown edge cases (LaTeX rendering) if no native solution works. |

---

## Installation

### Mobile app setup (from `mobile/` directory)

```bash
# Create Expo project
npx create-expo-app@latest mobile --template tabs

# Core dependencies (included with Expo SDK 55)
# expo, react-native, react, expo-router, react-native-safe-area-context,
# react-native-screens, expo-dev-client -- all pre-installed

# Gesture & Animation
npx expo install react-native-reanimated react-native-gesture-handler

# Styling
npx expo install nativewind tailwindcss@3.4.17
# Note: NativeWind v4 requires Tailwind CSS v3, NOT v4

# State & Storage
npm install zustand
npx expo install react-native-mmkv expo-secure-store

# Lists
npx expo install @shopify/flash-list

# Notifications
npx expo install expo-notifications expo-device expo-constants

# Haptics
npx expo install expo-haptics

# Streaming Markdown (after evaluating stability)
npx expo install react-native-streamdown react-native-enriched-markdown

# GPU Effects (Phase 3+, not initial install)
# npx expo install @shopify/react-native-skia

# Dynamic Island (v3.1+, not initial install)
# npx expo install expo-live-activity
```

### Shared package setup

```bash
# Create shared package
mkdir -p packages/shared/src
cd packages/shared
npm init -y
# Set "name": "@loom/shared" in package.json
# Set React + React Native as peerDependencies
```

### Root workspace setup

```bash
# Add workspaces to root package.json
# "workspaces": ["packages/*", "mobile"]
npm install  # Links workspaces
```

---

## Backend Changes Required

The Express backend (port 5555) needs minimal changes for native app support:

| Change | Effort | Priority |
|--------|--------|----------|
| Push token registration endpoint (`POST /api/push/register`) | Small | P0 (v3.0) |
| Push notification service (sends to Expo Push API) | Medium | P0 (v3.0) |
| Notification triggers in WebSocket handler (permission requests, questions) | Medium | P0 (v3.0) |
| CORS for Tailscale IP (already exists for port 8184) | Tiny | P0 (v3.0) |
| Live Activity update endpoint (`POST /api/live-activity/update`) | Small | P1 (v3.1) |

**Push notification flow:**
1. Mobile app registers Expo push token with backend on login
2. Backend stores token in SQLite (new table: `push_tokens`)
3. When Claude asks a question or requests permission, backend sends push via Expo Push API
4. Notification includes action buttons (Approve/Deny for permissions)
5. User taps action -> mobile app sends response via existing WebSocket

---

## Version Compatibility Matrix

| Package | Version | Expo SDK 55 | React 19.2 | New Arch | Notes |
|---------|---------|-------------|------------|----------|-------|
| react-native-reanimated | 4.3.0 | YES | YES | Required | New Arch only since v4 |
| react-native-gesture-handler | 2.30.1 | YES | YES | YES | Fixed React 19 ref warnings |
| @shopify/flash-list | 2.3.1 | YES | YES | YES | v2 rebuilt for New Arch |
| @shopify/react-native-skia | 2.5.4 | YES | YES | YES | Actively updated |
| nativewind | 4.2.3 | YES | YES | YES | Stable production |
| react-native-mmkv | 4.3.0 | YES | YES | YES | JSI-based, New Arch native |
| zustand | 5.0.12 | YES | YES | N/A | Pure JS, no native code |
| react-native-streamdown | 0.1.1 | YES | YES | Required | Requires worklets |
| expo-live-activity | 0.4.2 | YES | N/A | YES | Requires Swift widget ext |

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| react-native-streamdown is v0.1.1 (very early) | HIGH | Test streaming performance early. Fallback: build simpler renderer with Reanimated + Text. |
| NativeWind v4 uses Tailwind v3 syntax (web uses v4) | LOW | Class names are 95% identical. Document the few differences. Migrate to NativeWind v5 when stable. |
| Expo EAS Build requires cloud or macOS for iOS | MEDIUM | swd has a Mac mini. Also EAS cloud builds work. Linux server runs Metro bundler only. |
| expo-live-activity requires Swift widget code | LOW | Defer to v3.1. Not a v3.0 blocker. |
| Code block syntax highlighting gap | MEDIUM | Ship plain code blocks in v3.0. Add syntax highlighting in v3.1 when react-native-enriched-markdown or alternative matures. |
| Monorepo Metro resolution | LOW | Expo SDK 55 auto-detects monorepos. Follow official monorepo guide. |

---

## Sources

### Official Documentation (HIGH confidence)
- [Expo SDK 55 Changelog](https://expo.dev/changelog/sdk-55) -- Release notes, React Native 0.83, React 19.2
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/) -- File-based routing
- [Expo Push Notifications Setup](https://docs.expo.dev/push-notifications/push-notifications-setup/) -- APNs integration
- [Expo Monorepo Guide](https://docs.expo.dev/guides/monorepos/) -- Workspace configuration
- [Expo Haptics](https://docs.expo.dev/versions/latest/sdk/haptics/) -- API reference
- [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/) -- iOS Keychain storage
- [React Native Reanimated Compatibility](https://docs.swmansion.com/react-native-reanimated/docs/guides/compatibility/) -- Version matrix
- [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/) -- Native gesture system
- [React Native Versions](https://reactnative.dev/versions) -- 0.84.1 latest, 0.83 in SDK 55
- [FlashList](https://shopify.github.io/flash-list/) -- Recycling list documentation
- [React Native Skia](https://shopify.github.io/react-native-skia/) -- GPU rendering
- [NativeWind v4.1 Announcement](https://www.nativewind.dev/blog/announcement-nativewind-v4-1) -- Production stability

### npm Registry (HIGH confidence -- version numbers verified 2026-03-30)
- expo@55.0.9 (latest), react-native@0.84.1, react-native-reanimated@4.3.0
- react-native-gesture-handler@2.30.1, @shopify/react-native-skia@2.5.4
- @shopify/flash-list@2.3.1, nativewind@4.2.3 (latest), 5.0.0-preview.3 (preview)
- react-native-mmkv@4.3.0, expo-notifications@55.0.14, expo-haptics@55.0.9
- react-native-streamdown@0.1.1, expo-live-activity@0.4.2

### Community & Analysis (MEDIUM confidence)
- [Software Mansion: react-native-streamdown](https://github.com/software-mansion-labs/react-native-streamdown) -- Streaming markdown
- [Software Mansion: expo-live-activity](https://github.com/software-mansion-labs/expo-live-activity) -- Dynamic Island
- [NativeWind v5 Migration Guide](https://www.nativewind.dev/v5/guides/migrate-from-v4) -- Pre-release status documented
- [Zustand + MMKV Integration](https://github.com/mrousavy/react-native-mmkv/blob/main/docs/WRAPPER_ZUSTAND_PERSIST_MIDDLEWARE.md) -- Persist middleware adapter
- [Expo Monorepo Example (byCedric)](https://github.com/byCedric/expo-monorepo-example) -- pnpm monorepo reference

### Prior Loom Research (HIGH confidence -- project-specific)
- `.planning/phases/67.1-ios-bug-fixes/PLATFORM-RESEARCH.md` -- Competitor analysis, architecture patterns
- `.planning/phases/67.1-ios-bug-fixes/LIBRARY-RESEARCH.md` -- Animation, visual effects, component libraries
