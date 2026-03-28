# Technology Stack: v2.2 "The Touch" -- iOS-Native Capabilities

**Project:** Loom v2.2 "The Touch"
**Researched:** 2026-03-28
**Capacitor Version:** 7.6.1 (locked)
**Target Device:** iPhone 16 Pro Max, iOS 17+

---

## Existing Stack (DO NOT RE-RESEARCH)

Already installed and validated in v2.1:

| Plugin | Version | Status |
|--------|---------|--------|
| @capacitor/core | ^7.6.1 | Installed (devDep) |
| @capacitor/cli | ^7.6.1 | Installed (devDep) |
| @capacitor/ios | ^7.6.1 | Installed (devDep) |
| @capacitor/keyboard | ^7.0.6 | Installed, loaded, setAccessoryBarVisible configured |
| @capacitor/status-bar | ^7.0.6 | Installed, loaded, Style.Dark configured |
| @capacitor/splash-screen | ^7.0.5 | Installed, loaded, launchAutoHide=true |
| @capacitor/haptics | ^7.0.5 | Installed, loaded, impact/notification/vibrate wired |

---

## Recommended New Plugins

### Tier 1: High Value for Chat App (Install for v2.2)

#### @capacitor/app -- App Lifecycle Events
| Field | Value |
|-------|-------|
| **Package** | `@capacitor/app` |
| **Version** | `^7.1.2` |
| **Install as** | devDependency |
| **Purpose** | Background/foreground detection, app state management |
| **Why for Loom** | Reconnect WebSocket when app returns from background. Pause streaming when backgrounded. Detect app state for splash screen timing. Currently Loom has NO lifecycle handling -- backgrounding the app kills the WS connection silently and the user sees a stale UI on return. |
| **Key API** | `App.addListener('appStateChange', cb)` -- fires on foreground/background transitions. `App.addListener('resume', cb)` / `App.addListener('pause', cb)` for specific transitions. `App.getState()` returns `{ isActive: boolean }`. |
| **Integration** | Dynamic import in `native-plugins.ts` following existing pattern. Wire `appStateChange` to trigger WebSocket reconnect in `connection` store. |
| **server.url conflict** | None. Works identically in server.url and bundled modes. |
| **Confidence** | HIGH -- official plugin, stable API, verified 7.x version exists |

#### @capacitor/clipboard -- Native Copy/Paste
| Field | Value |
|-------|-------|
| **Package** | `@capacitor/clipboard` |
| **Version** | `^7.0.4` |
| **Install as** | devDependency |
| **Purpose** | Programmatic clipboard access for copy-message, copy-code-block actions |
| **Why for Loom** | GESTURE-06 requires long-press on messages to offer "Copy Text". The web Clipboard API (`navigator.clipboard`) requires HTTPS and a secure context. In WKWebView with server.url mode (HTTP over Tailscale), `navigator.clipboard.writeText()` may fail silently. The Capacitor Clipboard plugin bypasses this by going through the native iOS pasteboard API. Also supports copying images and URLs natively. |
| **Key API** | `Clipboard.write({ string: 'text' })` -- copy text. `Clipboard.write({ url: 'https://...' })` -- copy URL. `Clipboard.read()` -- read from clipboard. |
| **Integration** | Dynamic import in `native-plugins.ts`. Create `clipboard.ts` utility (like `haptics.ts`) with `copyToClipboard(text)` that falls back to `navigator.clipboard` on web. |
| **server.url conflict** | None. This plugin actually SOLVES a server.url limitation. |
| **Confidence** | HIGH -- official plugin, directly addresses GESTURE-06 |

#### @capacitor/share -- Native Share Sheet
| Field | Value |
|-------|-------|
| **Package** | `@capacitor/share` |
| **Version** | `^7.0.4` |
| **Install as** | devDependency |
| **Purpose** | iOS native share sheet (UIActivityViewController) for sharing conversations |
| **Why for Loom** | Users want to share interesting AI conversations. The native share sheet gives access to Messages, Mail, Notes, AirDrop, and all installed share targets -- impossible to replicate in web. Existing "Export" feature could be enhanced with a "Share" option on mobile that invokes the native sheet. |
| **Key API** | `Share.share({ title, text, url, dialogTitle })` -- opens native share sheet. `Share.canShare()` -- check availability. |
| **Integration** | Dynamic import in `native-plugins.ts`. Add share button to message context menu (GESTURE-06) and session context menu (GESTURE-03). Falls back to Web Share API on web (or hidden if unavailable). |
| **server.url conflict** | None. File sharing from non-cache directories requires extra iOS config, but text/URL sharing works out of the box. |
| **Confidence** | HIGH -- official plugin, straightforward integration |

#### @capacitor/action-sheet -- Native iOS Action Sheets
| Field | Value |
|-------|-------|
| **Package** | `@capacitor/action-sheet` |
| **Version** | `^7.0.4` |
| **Install as** | devDependency |
| **Purpose** | Native UIAlertController action sheet for destructive confirmations |
| **Why for Loom** | GESTURE-01 (swipe-to-delete) and GESTURE-03 (long-press context menu) need confirmation dialogs. The native action sheet slides up from the bottom with iOS-standard styling, destructive button highlighting, and cancel button. Feels dramatically more native than a web modal. |
| **Key API** | `ActionSheet.showActions({ title, message, options: [{ title, style }] })` -- returns `{ index }` of selected option. `ActionSheetButtonStyle.Destructive` for red delete buttons. |
| **Integration** | Dynamic import in `native-plugins.ts`. Create `native-dialogs.ts` utility. Use for delete confirmations on mobile, fall back to existing Radix AlertDialog on web. |
| **server.url conflict** | None. iOS-only feature, no network dependency. |
| **Confidence** | HIGH -- official plugin, iOS message string support |

### Tier 2: Valuable for Polish (Install for v2.2 if scope allows)

#### @capacitor/network -- Connection Status Monitoring
| Field | Value |
|-------|-------|
| **Package** | `@capacitor/network` |
| **Version** | `^7.0.4` |
| **Install as** | devDependency |
| **Purpose** | Real-time network connectivity monitoring |
| **Why for Loom** | ConnectionBanner already shows disconnect state, but currently relies on WebSocket failure detection (reactive, not proactive). The Network plugin provides `networkStatusChange` events that fire BEFORE the WebSocket dies. Can show "No network" banner immediately instead of waiting for the WS heartbeat timeout (currently 30s). Also distinguishes wifi/cellular/none -- useful for warning users on cellular about token costs. |
| **Key API** | `Network.addListener('networkStatusChange', cb)` -- fires on connectivity changes. `Network.getStatus()` -- returns `{ connected, connectionType }`. |
| **Integration** | Dynamic import in `native-plugins.ts`. Wire to `connection` store to augment WebSocket-based detection. |
| **server.url conflict** | None. Read-only status monitoring. |
| **Confidence** | HIGH -- official plugin, simple API |

#### @capacitor/browser -- In-App Link Opening
| Field | Value |
|-------|-------|
| **Package** | `@capacitor/browser` |
| **Version** | `^7.0.5` |
| **Install as** | devDependency |
| **Purpose** | Open links in SFSafariViewController (in-app Safari) |
| **Why for Loom** | Currently, tapping links in AI responses navigates away from the app (either opens Safari or replaces the WKWebView content). The Browser plugin opens links in an in-app Safari view that slides up from the bottom, preserving the app context. User swipes down to dismiss and returns exactly where they were. Critical for a chat app where AI responses contain many URLs. |
| **Key API** | `Browser.open({ url })` -- opens SFSafariViewController. `Browser.addListener('browserFinished', cb)` -- fires when user dismisses. |
| **Integration** | Dynamic import in `native-plugins.ts`. Intercept link clicks in MarkdownRenderer on native to route through `Browser.open()` instead of `window.open()`. |
| **server.url conflict** | None. Opens a separate view controller. |
| **Confidence** | HIGH -- official plugin, SFSafariViewController is iOS standard |

### Tier 3: Defer to v2.3+ (Not Needed for v2.2 Scope)

#### @capacitor/local-notifications -- Background Task Notifications
| Field | Value |
|-------|-------|
| **Package** | `@capacitor/local-notifications` |
| **Version** | `^7.0.6` |
| **Install as** | devDependency (when needed) |
| **Purpose** | Notify user when long-running AI tasks complete while app is backgrounded |
| **Why defer** | v2.2 focuses on touch/gesture UX, not background workflows. Local notifications require iOS permission prompts (friction) and are only valuable once @capacitor/app lifecycle handling is solid. Better to ship lifecycle first, then add notifications in a subsequent milestone. |
| **Confidence** | HIGH -- official plugin, well-documented |

#### @aparajita/capacitor-biometric-auth -- Face ID / Touch ID
| Field | Value |
|-------|-------|
| **Package** | `@aparajita/capacitor-biometric-auth` |
| **Version** | `^9.1.2` (supports @capacitor/core >=6.1.0) |
| **Install as** | devDependency (when needed) |
| **Purpose** | Face ID authentication for app access |
| **Why defer** | Loom is a single-user tool on a personal device. The JWT auth is already in place. Biometric auth is a nice-to-have for "lock app" functionality but not critical for the v2.2 touch-first UX milestone. Also requires NSFaceIDUsageDescription in Info.plist. |
| **Confidence** | MEDIUM -- third-party plugin, but well-maintained (v9/v10 active) |

#### @capacitor-community/privacy-screen -- App Switcher Protection
| Field | Value |
|-------|-------|
| **Package** | `@capacitor-community/privacy-screen` |
| **Version** | `^6.0.0` (peerDep: @capacitor/core >=7.0.0, confirmed compatible) |
| **Install as** | devDependency (when needed) |
| **Purpose** | Hide app content in iOS app switcher, prevent screenshots |
| **Why defer** | Privacy is important for a coding assistant (API keys, code), but the official `@capacitor/privacy-screen` is being developed and the community version works. Defer to v2.3 when post-touch-UX polish is the focus. |
| **Confidence** | MEDIUM -- community plugin, confirmed Capacitor 7 peer dep |

---

## What NOT to Install

### Plugins to Avoid

| Plugin | Why Avoid |
|--------|-----------|
| **@capacitor/http (CapacitorHttp)** | Already disabled in capacitor.config.ts. Patches global `fetch()` which breaks WebSocket upgrade handshake. All HTTP routing handled by `platform.ts resolveApiUrl()`. DO NOT re-enable. |
| **@capacitor/preferences** | Loom uses Zustand with `persist` middleware to localStorage. Adding another persistence layer creates confusion. UserDefaults (iOS backing) also requires PrivacyInfo.xcprivacy configuration. |
| **@capacitor/camera** | Chat app, not a photo app. Image attachments in composer use file input, not camera. |
| **@capacitor/filesystem** | No local file storage needed. All data lives on the server (JSONL source of truth, SQLite cache). |
| **@capacitor/geolocation** | No location features in a coding assistant. |
| **@capacitor/push-notifications** | Requires Apple Push Notification service (APNs) certificate, server-side push infrastructure. Overkill for a single-user tool. Local notifications (deferred) are sufficient. |
| **@capacitor/text-zoom** | Conflicts with custom typography system (TYPO-01 through TYPO-08). Let the app control font sizes, not iOS text zoom. |
| **@capacitor/motion** | Accelerometer/gyroscope. No use case for a chat app. |
| **@capacitor/screen-orientation** | Loom works in portrait only on iPhone. No need to programmatically control orientation. |
| **capacitor-plugin-swipe-gestures** | Third-party, low maintenance. Loom's existing touch handler pattern (see Sidebar.tsx) is simpler and more controllable. |
| **@notnotsamuel/capacitor-swipe-back** | Only toggles WKWebView's `allowsBackForwardNavigationGestures`. Not useful for a SPA with no history-based navigation. |

### Features to Build In-App (No Plugin Needed)

| Feature | Implementation | Why No Plugin |
|---------|---------------|---------------|
| **Swipe-to-delete** (GESTURE-01) | Custom touch handlers (same pattern as Sidebar.tsx swipe-to-close). Track `touchStart`/`touchMove`/`touchEnd` with translateX. | The existing codebase already has this exact gesture pattern. No library adds value over 50 lines of touch handling code. |
| **Pull-to-refresh** (GESTURE-02) | Custom `onTouchStart`/`onTouchMove`/`onTouchEnd` on session list container. Detect overscroll (scrollTop === 0 + pull down). Show spinner, call refresh API. Apply `overscroll-behavior: none` on the container to prevent WKWebView bounce. | iOS has no Capacitor plugin for this. Web implementation is straightforward and more controllable than any library. |
| **Long-press context menu** (GESTURE-03, GESTURE-06) | Use existing Radix ContextMenu component (`radix-ui` already installed at ^1.4.3). Radix ContextMenu natively supports long-press trigger on touch devices. Replace custom `SessionContextMenu` with Radix ContextMenu for consistency. | Radix already handles long-press detection, portal rendering, keyboard navigation, and focus management. The custom `SessionContextMenu` is a simplified version that should be migrated to Radix. |
| **Spring animations** (VISUAL-03, VISUAL-04, VISUAL-05) | CSS transitions with `spring-easing` (already installed as devDep at ^2.3.3). Generate cubic-bezier approximations of spring curves tuned for 120Hz. | No native plugin needed. CSS runs at 120Hz in WKWebView natively. The `spring-easing` package generates CSS-compatible timing functions. |
| **OLED optimization** (VISUAL-01) | CSS custom properties. Set `html { background: oklch(0 0 0) }` while keeping `--surface-base` at the current elevation. | Pure CSS change, no plugin involvement. |

---

## Integration Architecture

### Dynamic Import Pattern (Existing)

All new plugins MUST follow the established `native-plugins.ts` pattern:

```typescript
// In native-plugins.ts initializeNativePlugins():
// --- App Lifecycle plugin (separate try/catch -- SS-7) ---
try {
  const { App } = await import('@capacitor/app');
  App.addListener('appStateChange', (state) => {
    // Wire to connection store for WebSocket reconnect
  });
} catch (err: unknown) {
  console.warn('[native-plugins] App plugin failed to load:', err);
}
```

**Rules:**
1. Each plugin in its own try/catch (SS-7 pattern -- one failure must not affect others)
2. Dynamic `import()` only -- never static imports of native plugins
3. Cache module reference if needed downstream (like `keyboardModule`)
4. Fire-and-forget for non-critical operations (like haptics)
5. `IS_NATIVE` guard at entry point -- web must be a no-op

### Utility Module Pattern (Existing)

For plugins used across multiple components, create a utility module (like `haptics.ts`):

```
native-plugins.ts  -->  setClipboardModule()  -->  clipboard.ts
                   -->  setAppModule()         -->  app-lifecycle.ts
                   -->  setShareModule()        -->  share.ts
```

Each utility module:
- Accepts injected module via setter (testable, no import side effects)
- Exports typed functions that are no-ops on web
- Has `_resetForTesting()` for test isolation

### Configuration (capacitor.config.ts)

No changes needed to `capacitor.config.ts` for Tier 1 plugins. All new plugins work with the existing configuration:
- `CapacitorHttp.enabled: false` -- no conflict
- `server.url` mode -- no conflict (all plugins work in both modes)
- `ios.webContentsDebuggingEnabled: true` -- development aid, no conflict

---

## Installation Commands

### Tier 1 (v2.2)

```bash
cd /home/swd/loom/src

# Install as devDependencies (matches existing @capacitor/* pattern)
npm install -D @capacitor/app@^7.1.2 \
              @capacitor/clipboard@^7.0.4 \
              @capacitor/share@^7.0.4 \
              @capacitor/action-sheet@^7.0.4

# Sync native project
npx cap sync ios
```

### Tier 2 (v2.2 stretch)

```bash
npm install -D @capacitor/network@^7.0.4 \
              @capacitor/browser@^7.0.5

npx cap sync ios
```

### Tier 3 (v2.3+)

```bash
# Defer -- do not install yet
# npm install -D @capacitor/local-notifications@^7.0.6
# npm install -D @aparajita/capacitor-biometric-auth@^9.1.2
# npm install -D @capacitor-community/privacy-screen@^6.0.0
```

---

## Version Verification

All versions verified via `npm view @capacitor/<plugin>@7 version` on 2026-03-28:

| Plugin | Latest 7.x | Peer Dep | Compatible |
|--------|-----------|----------|------------|
| @capacitor/app | 7.1.2 | @capacitor/core ^7.0.0 | YES |
| @capacitor/clipboard | 7.0.4 | @capacitor/core ^7.0.0 | YES |
| @capacitor/share | 7.0.4 | @capacitor/core ^7.0.0 | YES |
| @capacitor/action-sheet | 7.0.4 | @capacitor/core ^7.0.0 | YES |
| @capacitor/network | 7.0.4 | @capacitor/core ^7.0.0 | YES |
| @capacitor/browser | 7.0.5 | @capacitor/core ^7.0.0 | YES |
| @capacitor/local-notifications | 7.0.6 | @capacitor/core ^7.0.0 | YES |
| @aparajita/capacitor-biometric-auth | 9.1.2 | @capacitor/core >=6.1.0 | YES |
| @capacitor-community/privacy-screen | 6.0.0 | @capacitor/core >=7.0.0 | YES |

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Context menus | Radix ContextMenu (already installed) | @capacitor/action-sheet for all menus | Action sheet is bottom-anchored; context menus should appear at touch point for discoverability. Use action sheet for confirmations, Radix for context menus. |
| Swipe gestures | Custom touch handlers | react-swipe-to-delete-component | Extra dependency for 50 lines of code. Existing Sidebar.tsx already proves the pattern works. |
| Pull-to-refresh | Custom touch + CSS overscroll-behavior | pulltorefresh.js library | iOS WKWebView has specific quirks with overscroll. Custom implementation gives full control over the spinner and API call. |
| Clipboard | @capacitor/clipboard | navigator.clipboard API | navigator.clipboard requires secure context (HTTPS). In server.url mode over HTTP/Tailscale, it may fail silently. Plugin uses native iOS pasteboard -- always works. |
| Share | @capacitor/share | Web Share API | Web Share API has spotty support and no file sharing. Native share sheet gives access to AirDrop, Messages, etc. |
| Biometrics | @aparajita/capacitor-biometric-auth | @capgo/capacitor-native-biometric | aparajita's plugin is more actively maintained, supports Capacitor 7, and has better TypeScript types. |
| Privacy screen | @capacitor-community/privacy-screen@6 | @capacitor/privacy-screen (official) | Official version does not have a 7.x release yet. Community version confirmed compatible via peer dep check. |

---

## Sources

- [Capacitor Official Plugins List](https://capacitorjs.com/docs/apis)
- [Capacitor App Plugin API](https://capacitorjs.com/docs/apis/app)
- [Capacitor Clipboard Plugin API](https://capacitorjs.com/docs/apis/clipboard)
- [Capacitor Share Plugin API](https://capacitorjs.com/docs/apis/share)
- [Capacitor Action Sheet Plugin API](https://capacitorjs.com/docs/apis/action-sheet)
- [Capacitor Network Plugin API](https://capacitorjs.com/docs/apis/network)
- [Capacitor Browser Plugin API](https://capacitorjs.com/docs/apis/browser)
- [Capacitor Local Notifications Plugin API](https://capacitorjs.com/docs/apis/local-notifications)
- [Capacitor Community Plugins](https://capacitorjs.com/docs/plugins/community)
- [Radix UI Context Menu](https://www.radix-ui.com/primitives/docs/components/context-menu)
- [@aparajita/capacitor-biometric-auth GitHub](https://github.com/aparajita/capacitor-biometric-auth)
- [@capacitor-community/privacy-screen GitHub](https://github.com/capacitor-community/privacy-screen)
- [Capacitor Plugin Directory](https://capacitorjs.com/directory)
- [Capacitor 7 Update Guide](https://capacitorjs.com/docs/updating/7-0)
- npm registry version checks (2026-03-28)
