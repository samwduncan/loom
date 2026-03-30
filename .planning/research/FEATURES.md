# Feature Landscape: Native iOS AI Coding Agent Client (React Native + Expo)

**Domain:** Native iOS chat client for an AI coding agent (Claude Code, Gemini, Codex)
**Researched:** 2026-03-30
**Platform:** iPhone 16 Pro Max, iOS 17+, React Native + Expo
**Reference Apps:** ChatGPT iOS, Claude iOS, Discord (React Native), Perplexity iOS, iMessage, Telegram
**Replaces:** Previous FEATURES.md (v2.2 Capacitor/WKWebView -- now abandoned)

---

## Table Stakes

Features users expect from any quality native iOS AI chat app in 2026. Missing = "why did I download this instead of using the web app?"

### Core Chat

| # | Feature | Why Expected | Complexity | Backend Deps | Notes |
|---|---------|--------------|------------|-------------|-------|
| TS-1 | Streaming message display with markdown | ChatGPT/Claude both stream responses with rich formatting. Users expect real-time token-by-token rendering with code blocks, lists, bold/italic, headers. | High | WebSocket `/ws` (exists) | Use `react-native-streamdown` (Software Mansion) or build custom incremental markdown parser. Memoize completed blocks -- re-parsing entire conversation per token is the #1 perf killer. Existing stream multiplexer logic transfers directly. |
| TS-2 | Code block syntax highlighting | Every AI chat app highlights code. Syntax themes matching the dark aesthetic are expected. Copy button must be prominent (44pt+ touch target). | Medium | None (client-side) | Options: `react-native-syntax-highlighter` or a WebView-based Shiki renderer per block. Native Text-based highlighting is lower fidelity but faster. Horizontal scroll on code blocks is mandatory -- no line wrapping. |
| TS-3 | Session list with create/switch/search | ChatGPT sidebar pattern. List of conversations, tap to switch, plus button to create, search to find. Basic session management is table stakes. | Medium | REST `/api/sessions` (exists) | Existing timeline store + API hooks transfer. Use FlashList v2 for performant list. Need `maintainVisibleContentPosition` for smooth loading of older sessions. |
| TS-4 | Tool call visualization | Loom's core differentiator is making agent work VISIBLE. Tool calls (file writes, terminal commands, MCP operations) must show status, be expandable, and feel informative. | High | WebSocket tool events (exists) | Existing tool-call registry pattern transfers. Need RN components for each tool card type (Read, Write, Execute, Search, MCP, Bash). Collapse/expand with reanimated spring animations. |
| TS-5 | Permission request handling | Claude Code asks for file write/command execution permission. User MUST be able to approve/deny in-app with a single tap. This is the core interaction loop for a coding agent. | Medium | WebSocket permission events (exists) | Inline banner at bottom of chat (above composer) with Approve/Deny buttons. Haptic `Warning` on permission arrival. Timer countdown visual (existing web pattern). Critical that this works reliably -- missed permissions block the agent. |
| TS-6 | Keyboard avoidance (native-quality) | Chat apps live and die by keyboard behavior. Keyboard must push content up smoothly, composer must stay visible, no layout jumps, no content hidden behind keyboard. | Medium | None | Use `react-native-keyboard-controller` (v1.21.0+) -- purpose-built for chat apps, handles iOS keyboard layout guide natively. Far superior to React Native's built-in `KeyboardAvoidingView`. Provides animated keyboard transitions at 120Hz on ProMotion displays. |
| TS-7 | Pull-to-refresh on session list | Universal iOS pattern. Users pull down expecting fresh data. | Low | REST `/api/sessions` (exists) | React Native `RefreshControl` component -- built-in, native-quality. Wire to timeline store refresh. Haptic `Success` on complete. |
| TS-8 | Haptic feedback on key interactions | iOS users expect tactile confirmation. Send message, permission approve/deny, swipe actions, context menu open. Without haptics, native app feels hollow. | Low | None | `expo-haptics` provides Impact (Light/Medium/Heavy), Notification (Success/Warning/Error), Selection feedback. Existing haptic grammar from v2.2 transfers conceptually. Map: send = `Success`, permission = `Warning`, error = `Error`, selection = `Selection`, swipe = `Light`. |
| TS-9 | Status bar integration | Native status bar tint matching app theme, tap-to-scroll-top behavior. | Low | None | `expo-status-bar` for style management. ScrollView `scrollsToTop` prop enables native status bar tap. Three lines of code for a deeply native feel. |
| TS-10 | Safe area handling | Notch, Dynamic Island, home indicator -- content must respect all safe areas without manual padding math. | Low | None | `react-native-safe-area-context` (included with Expo). `SafeAreaView` wrapper or `useSafeAreaInsets()` hook. Unlike WKWebView, this just works -- no `max()` hacks needed. |
| TS-11 | Network status awareness | Users on mobile frequently lose connectivity. App must show clear connection state and reconnect gracefully. | Medium | WebSocket reconnection (exists) | Existing connection store + WebSocket reconnection logic transfers. Add `@react-native-community/netinfo` for reachability detection. Visual banner when disconnected (existing ConnectionBanner concept). |

### Navigation & Session Management

| # | Feature | Why Expected | Complexity | Backend Deps | Notes |
|---|---------|--------------|------------|-------------|-------|
| TS-12 | Sidebar drawer for session list | Every AI chat app has a left-side drawer with conversation history. Swipe from left edge to open, tap outside to close. | Medium | None | Use `react-native-gesture-handler` for native gesture recognizer on left edge. `react-native-reanimated` for spring-physics open/close animation. Unlike WKWebView, native gesture recognizers don't fight each other. |
| TS-13 | Long-press context menu on sessions | Pin, rename, delete. Standard iOS secondary-action pattern. | Medium | REST session endpoints (exist) | React Native's `ContextMenu` or a custom Popover. Native blur background. Haptic `Selection` on open. Existing session context menu actions transfer. |
| TS-14 | Swipe-to-delete on sessions | iOS list interaction pattern. Swipe left reveals red delete button. | Medium | REST `DELETE /api/sessions/:id` (exists) | `react-native-gesture-handler` Swipeable component or custom with `GestureDetector`. Spring-back on incomplete swipe. Haptic `Light` on reveal, `Medium` on delete confirm. |
| TS-15 | Session pinning | Pin important conversations to the top. ChatGPT has this. | Low | Needs backend or local storage | Existing pinning logic (localStorage in web) can use AsyncStorage in RN. Pin state in timeline store transfers. |

### Visual Polish

| # | Feature | Why Expected | Complexity | Backend Deps | Notes |
|---|---------|--------------|------------|-------------|-------|
| TS-16 | 120Hz animations (ProMotion) | iPhone Pro users expect butter-smooth 120fps. Any 60fps animation feels sluggish by comparison. React Native + Reanimated delivers this on the UI thread. | Low | None | `react-native-reanimated` v4 runs animations on the UI thread at native frame rate. ProMotion displays automatically get 120Hz. No opt-in needed (unlike WKWebView where only CSS animations hit 120Hz). This is a massive upgrade from Capacitor. |
| TS-17 | Spring physics on all interactive elements | Native iOS apps use spring animations (UISpringAnimation). Linear or ease-in-out animations feel "web-like." | Low | None | Reanimated `withSpring()` -- configure mass, damping, stiffness per interaction type. Gentle springs for drawer open, snappy springs for button press, bouncy springs for pull-to-refresh. Existing spring profiles from v1.5 transfer conceptually. |
| TS-18 | Dark theme matching system appearance | AI chat apps are dark-mode-first. Must match iOS system appearance and look intentional, not just "dark background with light text." | Low | None | Existing OKLCH color system transfers. Use React Native `Appearance` API for system theme detection. `useColorScheme()` hook. For v3.0: dark-only is acceptable (matches web app). |

---

## Differentiators

Features that make Loom uniquely valuable as a CODING AGENT companion on iOS. These are what justify installing a dedicated app vs. opening the web app in Safari.

### Push Notifications (THE killer feature for a coding agent mobile client)

| # | Feature | Value Proposition | Complexity | Backend Deps | Notes |
|---|---------|-------------------|------------|-------------|-------|
| D-1 | Push notifications for permission requests | **The single most valuable native feature.** Agent hits a permission gate, phone buzzes. User approves from lock screen without opening the app. Keeps the agent working while you're away from your desk. No other coding agent client offers this. | High | **NEW: Push notification backend required** (APNs via Expo Push or direct) | Requires new backend endpoint to register device push tokens. Backend sends push when permission event fires on WebSocket and no client is connected. Notification payload: `{ title: "Loom: Permission Needed", body: "Write to src/App.tsx?", categoryIdentifier: "PERMISSION_REQUEST" }`. |
| D-2 | Actionable notification buttons (Approve/Deny) | Approve or deny file writes, command executions, MCP calls WITHOUT opening the app. Two-tap workflow: notification arrives -> tap Approve. Agent continues. You never leave your current context. | High | **NEW: REST endpoint for permission response from push context** | iOS `UNNotificationAction` with `APPROVE` and `DENY` actions registered under `PERMISSION_REQUEST` category. App handles action in background via `expo-notifications` `addNotificationResponseReceivedListener`. Backend needs a REST endpoint like `POST /api/permissions/:id/respond` that the app calls when handling the notification action. |
| D-3 | Push for agent completion/errors | "Session 'refactor auth' completed" or "Agent encountered an error in session 'fix tests'." Know when your coding agent finishes work without polling. | Medium | **NEW: Push on session state changes** | Less complex than D-1/D-2 -- no interactive actions needed, just informational push. Backend watches for session completion events (WebSocket close, final message) and sends push. |
| D-4 | Silent push for background state sync | When a push arrives (permission, completion), the app syncs session state in the background so it's up-to-date when the user opens it. No loading spinner, instant display. | Medium | Background fetch + REST APIs (exist) | iOS silent/content-available push triggers background fetch. App fetches latest session state, caches locally. When user taps notification and opens app, the conversation is already loaded. Use Expo's background fetch capabilities. |

### Dynamic Island & Live Activities

| # | Feature | Value Proposition | Complexity | Backend Deps | Notes |
|---|---------|-------------------|------------|-------------|-------|
| D-5 | Live Activity showing active session status | Lock Screen and Dynamic Island show: session name, agent status (thinking/writing/executing/waiting), elapsed time. Glanceable awareness of what your agent is doing without opening the app. ChatGPT does this for voice mode -- Loom does it for coding. | High | WebSocket state events (exists), **NEW: push updates for Live Activity** | Two paths: (1) `expo-widgets` (alpha, Expo UI components, officially supported), or (2) `expo-live-activity` from Software Mansion Labs (more mature, predefined layout with title/subtitle/progress). Recommend path (2) for v3.0 since the predefined layout (title + subtitle + progress bar) maps perfectly to session name + status + time. Upgrade to custom layout via `expo-widgets` later. |
| D-6 | Dynamic Island compact view | Pill-shaped indicator showing session activity. Tap to expand, tap to open app. Minimal footprint, maximum awareness. | High | Same as D-5 | Part of Live Activity implementation. Compact view: leading = Loom icon, trailing = animated status indicator (pulsing dot for thinking, check for complete). Expanded view: session name, current action, approve button if permission pending. |

### Native Sharing & System Integration

| # | Feature | Value Proposition | Complexity | Backend Deps | Notes |
|---|---------|-------------------|------------|-------------|-------|
| D-7 | Native share sheet for code/conversations | Share a code block to Slack, a conversation excerpt to Notes, a full session export to Files. Uses iOS native share sheet -- feels native, not a web hack. | Medium | REST `/api/sessions/:id/export` (exists) | `react-native-share` or Expo's `Sharing` API. Share sources: code block text, message text, full conversation (markdown export), conversation URL. |
| D-8 | Share Extension (receive content INTO Loom) | Share text/code/URLs from other apps into a Loom session. Copy code from Safari or Stack Overflow, share to Loom, agent gets it as context. | High | **NEW: Compose-with-attachment endpoint or prepopulate composer** | Requires an App Extension target (Swift code, not RN). Expo config plugin can scaffold this. Shared content opens app to composer with pre-populated text. Powerful but complex -- defer to v3.1+. |
| D-9 | Spotlight search for sessions | Type session names in iOS Spotlight to find and jump to conversations. Sessions are indexed on-device via CoreSpotlight. | Medium | Session data (local cache) | `expo-spotlight` or custom CoreSpotlight module. Index session titles + first message. Deep link opens specific session. Powerful discoverability feature that ChatGPT and Claude lack. |
| D-10 | Siri Shortcuts / App Intents | "Hey Siri, check on my Loom session" or "Hey Siri, start a new Loom conversation." Voice-driven agent interaction. | High | REST APIs (exist), **NEW: App Intent Swift code** | Requires native Swift App Intents (not doable purely in JS). Expo config plugin or local module needed. Pre-built intents: "Open latest session," "Start new session," "Show agent status." Powerful but high complexity -- defer to v3.1+. |

### Advanced Chat Features

| # | Feature | Value Proposition | Complexity | Backend Deps | Notes |
|---|---------|-------------------|------------|-------------|-------|
| D-11 | Swipe-to-reply on messages | Right-swipe on an assistant message to quote-reply. Trained by WhatsApp/iMessage/Telegram. Creates natural conversational flow with the agent. | High | WebSocket message protocol (exists) | `react-native-gesture-handler` pan gesture on message rows. Elastic drag with haptic at ~60px threshold. Quote reference in composer. Backend treats it as a new user message with quoted context prefix. No protocol change needed -- just prepend quoted text. |
| D-12 | Inline code expand to fullscreen | Tap a code block to view it full-screen with syntax highlighting, line numbers, and horizontal scroll. Comfortable code review on a phone screen. | Medium | None | Bottom sheet (react-native-bottom-sheet) with full-screen snap point. Code content in a horizontal ScrollView with monospace font. Close by swipe-down. GitHub Mobile uses this exact pattern for file viewing. |
| D-13 | Message context menu (native) | Long-press on a message for Copy, Retry, Share. Uses iOS native context menu with blur background, not a web popover. | Medium | None | React Native `ContextMenu` or `ActionSheetIOS`. Native blur backdrop. Haptic `Selection` on open. Actions: Copy Text, Copy as Markdown, Retry (user messages), Share (assistant messages). |
| D-14 | Follow-up suggestions | Quick-action chips below the last assistant message. "Explain this further," "Run tests," "Fix the error." One-tap to send a follow-up. | Low | None (client-side heuristics exist) | Existing follow-up suggestion heuristics transfer directly. Render as horizontally scrollable pill buttons below the last message. Haptic `Light` on tap. Spring animation on appearance. |
| D-15 | Image attachment in composer | Attach photos (camera or library) to send as context to the agent. Screenshot a bug, share it with Claude. | Medium | WebSocket image attachment (exists) | `expo-image-picker` for camera/library access. Existing backend image handling works. Thumbnail preview in composer before send. |

### Accessibility (iOS-specific)

| # | Feature | Value Proposition | Complexity | Backend Deps | Notes |
|---|---------|-------------------|------------|-------------|-------|
| D-16 | Full VoiceOver support | iOS accessibility is not optional. VoiceOver users must be able to navigate sessions, read messages, approve permissions, and compose messages. React Native has better a11y primitives than web. | Medium | None | React Native `accessibilityLabel`, `accessibilityRole`, `accessibilityHint` on all interactive elements. Dynamic content: use `accessibilityLiveRegion` for streaming messages. Announce permission requests immediately. Focus management on screen transitions. Group tool cards as single accessible elements with summary labels. |
| D-17 | Dynamic Type support | iOS users who set larger text sizes expect apps to respect it. Many developers skip this. Getting it right is a differentiator. | Medium | None | React Native supports Dynamic Type via `allowFontScaling` (default true). Ensure layout doesn't break at accessibility text sizes (up to 310% on iOS). Test all screens at largest Dynamic Type setting. Set `maxFontSizeMultiplier` on elements where extreme scaling would break layout (e.g., status indicators). |
| D-18 | Reduce Motion support | Users with vestibular disorders or motion sensitivity enable Reduce Motion in iOS Settings. App must respect this. | Low | None | Check `AccessibilityInfo.isReduceMotionEnabled()` in React Native. When true: replace spring animations with instant transitions, disable parallax effects, use crossfade instead of slide transitions. Existing web pattern (0.01ms transition override) translates to RN as `withTiming(value, { duration: 0 })`. |

---

## Anti-Features

Features to explicitly NOT build. Lessons from v2.2 Capacitor failure and competitor analysis.

| # | Anti-Feature | Why Avoid | What to Do Instead |
|---|--------------|-----------|-------------------|
| AF-1 | Offline mode / local AI | Loom connects to a remote server running Claude Code. There is no offline use case. Building offline support adds massive complexity for zero value. | Show a clear "Not Connected" state. Cache recent session list for browsing. But don't pretend the app works offline -- it doesn't and shouldn't. |
| AF-2 | Voice mode / speech-to-text for coding | ChatGPT and Claude have voice modes, but for CODING agents, voice input is impractical. You can't dictate code, file paths, or technical instructions accurately. It's a trap feature that looks good in demos but nobody uses for this domain. | Excellent keyboard experience with @-mentions and slash commands. Let iOS dictation button handle the rare voice-to-text need. |
| AF-3 | Bottom tab navigation | Loom is a single-context chat app, not a multi-section app. Tab bars waste vertical space (49pt) that's critical for the composer and keyboard. ChatGPT uses a sidebar drawer, not tabs. | Sidebar drawer for session navigation. Full screen for chat. Settings as a modal sheet. |
| AF-4 | WebView for entire chat rendering | "Just put the web app in a WebView" is exactly the Capacitor trap that failed. Native components or bust. Individual code blocks can use a small WebView for Shiki highlighting, but the message list, composer, and navigation must be native. | Native `FlatList`/`FlashList` for message list. Native `TextInput` for composer. Native gestures, native keyboard. WebView only for isolated rich-content blocks if needed. |
| AF-5 | Full IDE features on mobile (terminal, file tree, editor) | The phone is for monitoring, approving, and quick conversations -- not for editing code. Terminal, file tree, and code editor are desktop/laptop features. Porting them to mobile creates a cramped, unusable experience. | Chat + session management + push notifications + code viewing (read-only). File editing stays on desktop. Terminal stays on desktop. The mobile app is a remote control, not a workstation. |
| AF-6 | Character-by-character typewriter animation | Looks cool in demos, kills performance with React Native re-renders at 100 tokens/sec. Existing web app proved batch rendering (rAF buffer, flush on complete) is the correct architecture. | Batch token accumulation, flush rendered blocks periodically. Same architecture as web app's useRef + rAF buffer, adapted for RN Text components. |
| AF-7 | Multi-model chat / provider switching on mobile | The web app has multi-provider support (Claude, Gemini, Codex). On mobile, the primary use case is monitoring your CURRENT agent session, not switching providers. Provider management is a settings concern, not a chat-flow concern. | Default to whatever provider the current session uses. Model/provider switching in settings, not in the composer. Defer multi-provider UX to v3.1+. |
| AF-8 | Android support in v3.0 | PROJECT.md explicitly scopes v3.0 to iOS-only. React Native enables Android later, but trying to support both platforms in v1 doubles testing surface and slows iOS polish to a crawl. | Build iOS-only with `Platform.OS` checks where needed. Android is a v3.1+ expansion after iOS hits daily-driver quality. |
| AF-9 | Custom keyboard / input accessory view in v3.0 | High complexity for moderate payoff. Standard iOS keyboard with the composer toolbar above it is sufficient for v3.0. Custom InputAccessoryView requires native module work. | Standard `TextInput` with auto-resize. @-mention and slash-command triggers above the keyboard in the composer area. Defer custom InputAccessoryView to v3.1+. |
| AF-10 | Conversation forking / branching | Some AI apps let you branch a conversation and try different paths. High backend complexity, confusing mobile UX, not a feature Claude iOS or ChatGPT iOS offer. | Linear conversation model. Retry last message is sufficient for exploring alternatives. |

---

## Feature Dependencies

```
Core Chat Foundation:
  TS-1 (Streaming markdown) --> TS-2 (Code highlighting -- renders within markdown)
  TS-1 (Streaming markdown) --> TS-4 (Tool visualization -- renders within message stream)
  TS-1 (Streaming markdown) --> TS-5 (Permission handling -- triggered by stream events)
  TS-6 (Keyboard avoidance) --> Composer component (implicit dependency)

Session Management:
  TS-3 (Session list) --> TS-12 (Sidebar drawer -- sessions live in sidebar)
  TS-3 (Session list) --> TS-13 (Long-press menu -- actions on sessions)
  TS-3 (Session list) --> TS-14 (Swipe-to-delete -- delete gesture on sessions)
  TS-3 (Session list) --> TS-15 (Pinning -- pin action on sessions)
  TS-3 (Session list) --> TS-7 (Pull-to-refresh -- refresh session list)

Push Notification Chain:
  D-1 (Permission push) --> D-2 (Actionable buttons -- extends D-1 with inline actions)
  D-1 (Permission push) --> D-4 (Silent push sync -- background state update)
  D-3 (Completion push) --> D-4 (Silent push sync)
  D-1 (Permission push) --> NEW BACKEND: push token registration + APNs integration
  D-2 (Actionable buttons) --> NEW BACKEND: REST permission response endpoint

Dynamic Island:
  D-5 (Live Activity) --> D-6 (Dynamic Island compact -- part of same implementation)
  D-5 (Live Activity) --> NEW BACKEND: push updates for Live Activity state

Chat Enhancements:
  D-11 (Swipe-to-reply) --> TS-1 (Streaming markdown -- quoted content in messages)
  D-12 (Code expand) --> TS-2 (Code highlighting -- reuses highlighting in fullscreen)
  D-13 (Message context menu) --> TS-1 (Streaming markdown -- operates on message content)
  D-14 (Follow-up suggestions) --> TS-1 (Streaming markdown -- appears after last message)
  D-15 (Image attachment) --> Composer component
```

### Critical Backend Dependencies (NEW work required)

| Feature | Backend Change | Effort | Priority |
|---------|---------------|--------|----------|
| D-1, D-2 Push for permissions | Device token registration endpoint, APNs integration (via Expo Push Service or direct), push on permission events when no WS client connected | 2-3 days | **v3.0 (core value prop)** |
| D-2 Actionable notification response | `POST /api/permissions/:id/respond` REST endpoint | 0.5 day | **v3.0** |
| D-3 Completion push | Push on session state change (complete/error) | 1 day | **v3.0** |
| D-5 Live Activity updates | Push updates for activity state via APNs content-state | 1-2 days | v3.1 |
| D-8 Share Extension | Compose-with-attachment from other apps | 1 day | v3.1+ |
| D-9 Spotlight indexing | Session data must be cached locally (already planned) | 0 days | v3.0 (client-only) |

---

## Reference App Comparison Matrix

| Feature | ChatGPT iOS | Claude iOS | Discord (RN) | Perplexity iOS | **Loom v3.0 Target** |
|---------|-------------|-----------|--------------|----------------|---------------------|
| Streaming markdown | Yes | Yes | N/A (not AI) | Yes | **Yes** |
| Code syntax highlighting | Yes | Yes | Yes (limited) | Yes | **Yes** |
| Push notifications | Tasks/reminders only | Conversation replies | Full messaging | Search results | **Permission requests + completions (unique)** |
| Actionable notifications | No (no approve/deny) | No | Reply from notification | No | **Yes -- approve/deny permissions (unique)** |
| Dynamic Island | Voice mode only | No | No | No | **Agent status (unique for coding)** |
| Live Activities | Voice mode lock screen | No | No | No | **Session progress on lock screen (unique)** |
| Native share sheet | Share conversation link | Share conversation link | Share message | Share answer | **Share code blocks + conversations** |
| Spotlight search | No | No | Messages search | No | **Session search (differentiator)** |
| Siri Shortcuts | Limited (via Apple Intelligence) | Via Apple Intelligence | No | No | **v3.1+ (defer)** |
| Haptic feedback | Minimal | Minimal | Yes (reactions) | Minimal | **Comprehensive grammar** |
| VoiceOver | Good | Good | Good | Basic | **Full support** |
| Dynamic Type | Partial | Partial | Yes | Partial | **Full support** |
| Tool call visualization | N/A | N/A | N/A | N/A | **Yes (Loom's core differentiator -- no competitor has this)** |
| Permission handling | N/A | N/A | N/A | N/A | **Yes (unique to coding agent clients)** |

**Key takeaway:** Loom's entire differentiator space is in features NO competitor has -- push notifications for permission requests, Dynamic Island for agent status, and tool call visualization. These aren't "nice to have" -- they're the entire reason to build a native app instead of using Safari.

---

## MVP Recommendation (v3.0 Scope)

### Phase 1: Foundation (connect + display)

Absolute minimum to prove the native app works and feels good.

1. **TS-1: Streaming markdown** -- Core rendering. Without this, there's no app.
2. **TS-3: Session list** -- Navigate between conversations.
3. **TS-6: Keyboard avoidance** -- Composer must work perfectly from day one.
4. **TS-10: Safe area handling** -- Notch/Dynamic Island/home indicator.
5. **TS-11: Network status** -- Connection awareness.
6. **TS-18: Dark theme** -- Visual foundation.

### Phase 2: Feel Native (gestures + polish)

Make it feel like an iOS app, not a React prototype.

7. **TS-12: Sidebar drawer** -- Session navigation with gesture.
8. **TS-7: Pull-to-refresh** -- On session list.
9. **TS-8: Haptics** -- On all interactions.
10. **TS-9: Status bar** -- Tap-to-scroll, theme matching.
11. **TS-13: Long-press sessions** -- Context menu.
12. **TS-14: Swipe-to-delete** -- Sessions.
13. **TS-16 + TS-17: 120Hz spring physics** -- On all animations.

### Phase 3: Core Value (agent features)

The features that justify the native app's existence.

14. **TS-4: Tool call visualization** -- Loom's signature feature.
15. **TS-5: Permission handling** -- Inline approve/deny.
16. **D-1 + D-2: Push notifications with actionable approve/deny** -- THE killer feature.
17. **D-3: Completion push** -- Know when agent finishes.
18. **D-4: Silent push sync** -- Background state update.

### Phase 4: Polish & Differentiators

Elevate beyond competitors.

19. **D-7: Share sheet** -- Code and conversation sharing.
20. **D-13: Message context menu** -- Copy, retry, share.
21. **D-14: Follow-up suggestions** -- Quick-action chips.
22. **D-15: Image attachment** -- Camera/library to agent.
23. **D-16: VoiceOver** -- Accessibility (should be woven in from Phase 1, formalized here).
24. **TS-2: Code highlighting polish** -- Full syntax theme.
25. **TS-15: Session pinning** -- Quick access to important sessions.

### Defer to v3.1+

| Feature | Reason to Defer | When |
|---------|-----------------|------|
| D-5, D-6: Dynamic Island / Live Activities | High complexity, requires push infrastructure first. Build on D-1-D-4 foundation. | v3.1 |
| D-8: Share Extension (receive INTO Loom) | Requires App Extension Swift code. Low urgency for initial release. | v3.1+ |
| D-9: Spotlight search | Nice differentiator but not core functionality. Need local session cache first. | v3.1 |
| D-10: Siri Shortcuts / App Intents | Requires native Swift code, complex integration. | v3.2+ |
| D-11: Swipe-to-reply | High complexity gesture state machine. Quote-reply UX adds visual complexity. | v3.1 |
| D-12: Code expand fullscreen | Medium complexity, depends on bottom sheet infrastructure. | v3.1 |
| D-17: Dynamic Type | Needs layout testing at all sizes. Do it, but formalize testing in v3.1. | v3.1 |
| D-18: Reduce Motion | Low effort but needs animation system to be complete first. | v3.1 |
| AF-7 caveat: Provider switching | Defer multi-provider UX. Default to session's provider. | v3.1+ |

---

## Complexity Assessment Summary

| Feature | Complexity | Effort | Risk | Transfers from Web? |
|---------|------------|--------|------|---------------------|
| TS-1 Streaming markdown | High | 2-3 days | Medium | Multiplexer logic yes, rendering no |
| TS-2 Code highlighting | Medium | 1-2 days | Medium | Shiki approach needs adaptation |
| TS-3 Session list | Medium | 1-2 days | Low | Timeline store + API hooks yes |
| TS-4 Tool cards | High | 2-3 days | Low | Tool registry pattern yes, components no |
| TS-5 Permission handling | Medium | 1 day | Low | Permission logic yes, UI no |
| TS-6 Keyboard avoidance | Medium | 1 day | Medium | None (new approach) |
| TS-7 Pull-to-refresh | Low | 0.5 day | None | None needed (native component) |
| TS-8 Haptics | Low | 0.5 day | None | Haptic grammar yes |
| TS-12 Sidebar drawer | Medium | 1-2 days | Low | Layout concept yes, implementation no |
| TS-16/17 120Hz springs | Low | 0.5 day | None | Spring profiles transfer |
| D-1 Permission push | High | 2-3 days | High | NEW backend + Expo push setup |
| D-2 Actionable notifications | High | 1-2 days | High | NEW (iOS-specific) |
| D-3 Completion push | Medium | 1 day | Low | Extends D-1 infrastructure |
| D-5/D-6 Dynamic Island | High | 3-5 days | High | NEW (iOS-specific, Swift required) |
| D-7 Share sheet | Medium | 0.5 day | None | Straightforward API |
| D-16 VoiceOver | Medium | 1-2 days | Low | Accessibility concepts transfer |

**Total estimated effort for v3.0 MVP (Phases 1-4):** 3-4 weeks
**Total estimated effort for v3.1 (Dynamic Island + deferred features):** 2-3 weeks additional

---

## Sources

### HIGH Confidence (Official docs, verified implementations)
- [Expo Push Notifications Setup](https://docs.expo.dev/push-notifications/push-notifications-setup/) -- APNs configuration with Expo
- [Expo Notifications API](https://docs.expo.dev/versions/latest/sdk/notifications/) -- Categories, interactive actions, background handling
- [Expo Widgets (Live Activities)](https://docs.expo.dev/versions/latest/sdk/widgets/) -- Alpha, supports Dynamic Island and Live Activities
- [Apple: Declaring Actionable Notification Types](https://developer.apple.com/documentation/usernotifications/declaring-your-actionable-notification-types) -- UNNotificationAction, UNNotificationCategory
- [Apple: UNNotificationCategory](https://developer.apple.com/documentation/usernotifications/unnotificationcategory) -- iOS notification category registration
- [React Native Accessibility](https://reactnative.dev/docs/accessibility) -- VoiceOver, accessibilityLabel, Dynamic Type
- [react-native-keyboard-controller](https://kirillzyusko.github.io/react-native-keyboard-controller/) -- v1.21.0, KeyboardChatScrollView, 120Hz keyboard animations
- [React Native Reanimated withSpring](https://docs.swmansion.com/react-native-reanimated/docs/animations/withSpring/) -- Spring physics configuration
- [Expo Haptics API](https://docs.expo.dev/versions/latest/sdk/haptics/) -- Impact, Notification, Selection feedback types
- [FlashList v2](https://shopify.engineering/flashlist-v2) -- Ground-up rewrite for New Architecture, cell recycling

### MEDIUM Confidence (Verified with multiple sources)
- [Software Mansion: expo-live-activity](https://github.com/software-mansion-labs/expo-live-activity) -- Live Activities from React Native
- [Home Screen Widgets and Live Activities in Expo](https://expo.dev/blog/home-screen-widgets-and-live-activities-in-expo) -- Official Expo blog
- [react-native-streamdown](https://github.com/software-mansion-labs/react-native-streamdown) -- Streaming markdown for RN (Software Mansion)
- [ChatGPT Dynamic Island / Live Activity](https://x.com/nathanwchan/status/1714042573545955833) -- Voice mode Live Activity confirmed
- [Push Notifications in Chat Apps: Best Practices](https://connectycube.com/2025/12/18/push-notifications-in-chat-apps-best-practices-for-android-ios/) -- APNs as fallback transport, not message container
- [Expo Spotlight Module](https://github.com/Pflaumenbaum/expo-spotlight) -- CoreSpotlight via Expo native module
- [iOS App Intents in an Expo App](https://dev.to/cross19xx/ios-app-intents-in-an-expo-app-38od) -- App Intents via Expo local module
- [VoiceOver Support in React Native](https://oneuptime.com/blog/post/2026-01-15-react-native-screen-reader-support/view) -- Screen reader best practices
- [2025 Guide to Haptics](https://saropa-contacts.medium.com/2025-guide-to-haptics-enhancing-mobile-ux-with-tactile-feedback-676dd5937774) -- Haptic UX patterns and accessibility

### LOW Confidence (Single source, needs validation)
- react-native-haptic-feedback claimed 2-4x faster than expo-haptics -- verify before switching from expo-haptics
- FlashList v2 inverted scroll chat UX regression (Issue #1844) -- may be resolved by v3.0 build time
- Expo Widgets alpha stability -- needs real-device testing before committing to this path for Live Activities
