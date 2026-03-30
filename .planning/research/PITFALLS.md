# Pitfalls Research: Adding React Native + Expo iOS App to Existing Web + Backend

**Domain:** Adding a React Native iOS chat app to an existing React web + Express/WebSocket backend project (solo developer)
**Researched:** 2026-03-30
**Confidence:** HIGH (multiple verified sources, direct Capacitor failure experience, competitor analysis)
**Prior art:** Loom v2.2 Capacitor/WKWebView failure post-mortem (15 plans, 5/7 bugs architecturally unfixable)

---

## Critical Pitfalls

Mistakes that cause rewrites, multi-week delays, or abandoned features. These are ordered by likelihood and severity for this specific project.

---

### Pitfall 1: Porting Web UI to React Native Instead of Redesigning

**What goes wrong:**
The developer copies the web app's component structure, layout logic, and interaction patterns into React Native, replacing `div` with `View` and `span` with `Text`. The result looks like a web app crammed into a phone -- wrong density, wrong gestures, wrong navigation paradigm. Users describe it as "doesn't feel like it belongs on iPhone."

**Why it happens:**
Natural instinct for a developer who built the web app. You already have working components, tested patterns, and a mental model of how the UI fits together. Re-implementing the same design in RN primitives feels efficient. But web patterns (CSS Grid, Tailwind utility classes, hover states, cursor interactions, desktop-density layouts) have no native equivalent. What works at 1440px with a mouse is wrong at 393px with a thumb.

**How to avoid:**
- Design the mobile UI from scratch using reference apps (ChatGPT iOS, Claude iOS) as the starting point, NOT the existing web layout
- Only transfer business logic: Zustand stores, API hooks, WebSocket client, streaming multiplexer, auth flow, tool-call registry
- Treat UI components as "new code" -- no copy-paste from `src/components/` to `mobile/`
- Follow Apple's Human Interface Guidelines for navigation shells, spacing, and density
- Use native navigation (Expo Router's stack/tab navigators) instead of recreating web navigation

**Warning signs:**
- Finding yourself writing `Platform.OS === 'ios' ? webStyle : nativeStyle` conditional logic in shared components
- Components that have both `className` and `style` props
- Typography that looks too big or too small without explicit tuning for mobile density
- swd says "everything is too big" or "doesn't feel iOS-native" (this has happened before)

**Phase to address:**
Design phase (before any code). The three-phase creative process (clone, integrate, elevate) documented in design_philosophy.md directly prevents this. Non-negotiable gate: swd approves visual direction before implementation begins.

---

### Pitfall 2: The Vision Fragmentation Problem (Solo Developer)

**What goes wrong:**
A 15-20 phase roadmap fragments creative vision across weeks of incremental execution. By phase 10, the original aesthetic intent is diluted. Compromises accumulate. Each phase is technically correct but the whole doesn't cohere. The result is "design by accretion" -- functional but soulless, exactly what happened across the web app's 50+ phases.

**Why it happens:**
GSD (and all task-based methodologies) decompose holistic goals into atomic tasks. A task list can specify "build session list with spring animation" but cannot convey "the session list should feel like flipping through a deck of cards." The creative vision exists in the spaces between tasks, and those spaces get lost when execution spans 15+ phase boundaries.

For a solo developer, there's nobody to maintain the meta-vision while you execute. You ARE both the visionary and the builder, and the builder personality dominates during implementation because shipping tasks feels productive.

**How to avoid:**
- Create a "Native App Soul" document before any implementation -- the visual language, animation philosophy, reference screenshots with annotations, interaction personality
- Limit v3.0 to 3-5 phases maximum. Ship three things beautifully: chat, sessions, notifications
- Every phase reads the soul document first. Every device test compares to reference apps side-by-side
- Bard reviews every visual component as a creative partner (not a gate -- a collaborator)
- Iterate WITHIN phases until the bar is met, instead of creating new phases to fix visual gaps
- Accept slower velocity. The web app shipped fast because engineering was the bottleneck. The native app will be slower because creative excellence is the bottleneck. That is correct.

**Warning signs:**
- Phase plans stop referencing the design soul document
- Device tests happen without reference app comparison
- "We'll polish that later" appearing in completion notes
- More than 5 phases planned for v3.0

**Phase to address:**
Pre-implementation (Phase 0/Design). The implementation guardrails document already identifies this risk. Enforce it ruthlessly.

---

### Pitfall 3: WebSocket Connection State Mismanagement on iOS

**What goes wrong:**
The app connects to the backend WebSocket on launch, but when iOS backgrounds the app, the WebSocket silently dies. When the user returns, messages are missing, the connection appears alive but isn't, or buffered callbacks fire all at once causing UI chaos. Streaming sessions appear frozen or jump-cut to completion.

**Why it happens:**
iOS suspends JavaScript execution within ~5-30 seconds of backgrounding. The WebSocket's TCP connection may survive briefly (iOS keeps the socket open for a grace period) but the JS side can't process messages. When the app foregrounds, one of three things happens: (1) the connection is dead and needs reconnection, (2) iOS buffered WebSocket messages and fires them all at once, or (3) the connection looks alive but the server has already timed out and closed it. The existing backend has WebSocket heartbeat logic that will kill idle connections.

**How to avoid:**
- Listen to `AppState` changes (`active`, `inactive`, `background`) and explicitly manage the connection lifecycle
- On `background`: gracefully close the WebSocket (don't rely on iOS to maintain it)
- On `active`: reconnect with exponential backoff, request state diff from backend
- Queue outgoing messages when disconnected; flush on reconnect
- Backend already has heartbeat -- coordinate the client timeout with the server timeout
- For streaming sessions: store the session ID so reconnection can resume the stream or fetch the completed result
- NEVER assume the connection is alive just because `readyState === WebSocket.OPEN` -- the server may have already closed its end

**Warning signs:**
- Messages appearing out of order after foregrounding
- "Connection lost" banner flashing briefly on every app resume
- Streaming sessions stuck at partial content with no completion
- Backend logs showing many rapid connect/disconnect cycles

**Phase to address:**
Foundation/networking phase. This must be solved before the chat screen works reliably. The existing `WebSocketClient` and `tryReconnect()` logic from the web app provides a starting point, but the background/foreground lifecycle is entirely new.

---

### Pitfall 4: FlatList Performance Death in Chat (Streaming + Variable Heights)

**What goes wrong:**
Using React Native's `FlatList` naively for a chat message list results in: dropped frames during scrolling, blank areas while streaming, janky scroll-to-bottom behavior, and visible layout jumps as messages change height (markdown renders, code blocks expand, tool calls animate). Discord's iOS team explicitly called out that "RN lists don't perform well for dynamic content" and built a custom native list.

**Why it happens:**
Chat messages are the worst case for virtualized lists: variable heights (short text vs. long code blocks), content that changes size during streaming, new items appended at the bottom while the user may be scrolled up, and rich content (images, code, tool cards) that's expensive to measure. `FlatList` measures items on the JS thread, and variable-height items can't use `getItemLayout` for O(1) scroll offset calculation.

**How to avoid:**
- Start with `FlashList` (by Shopify) instead of `FlatList` -- it has better recycling and estimation
- Implement `estimatedItemSize` for FlashList based on message type heuristics (text ~60px, code ~200px, tool card ~120px)
- Memoize message components aggressively with `React.memo` and stable keys
- Separate streaming content from the list's render cycle -- accumulate tokens in a ref, flush to the list item on debounced intervals (similar to the web app's rAF buffer pattern)
- For streaming messages, render the active message OUTSIDE the list (pinned to bottom) and move it INTO the list on completion
- Use `removeClippedSubviews` and tune `windowSize` (10-15 for chat)
- Profile with Chrome DevTools "Highlight updates" to catch re-render cascades
- Enable React Compiler (Babel plugin) -- it auto-memoizes and is "the best thing you can do to optimize" Expo apps

**Warning signs:**
- Scroll FPS drops below 50 with 20+ messages
- Visible blank areas ("white flash") while fast-scrolling
- Layout jumps as streaming messages grow
- `VirtualizedList: You have a large list that is slow to update` console warning

**Phase to address:**
Chat screen implementation phase. This is the hardest single screen to build. Budget extra time. Consider building a proof-of-concept chat list before committing to a rendering strategy. The web app's lesson from Phase 64 (content-visibility was harmful for variable-height messages) applies here too -- test assumptions early.

---

### Pitfall 5: Push Notification Complexity Cascade

**What goes wrong:**
Push notifications sound simple ("send a message when Claude asks a question") but the implementation spans: Apple Developer Program enrollment, APNs certificate/key setup, Expo push token registration, server-side notification sending, background processing, notification actions (approve/deny), deep linking from notification tap, and token refresh lifecycle. Each step has its own failure modes. The developer burns a week on infrastructure that isn't visible and doesn't work on simulators.

**Why it happens:**
Push notifications are an inherently distributed system: your app registers with Apple, gets a device token, sends it to your backend, your backend sends it to Expo's push service (or directly to APNs), Apple delivers it to the device, iOS decides whether to show it based on focus/DND/settings, the user interacts, and that interaction routes back to your app via deep linking. Every hop can fail silently.

Additionally: push notifications cannot be tested on iOS Simulator. They require a physical device, a valid Apple Developer certificate, and (as of Expo SDK 53) a development build -- Expo Go no longer supports push on Android, and iOS push has always required dev builds. So you need the full EAS Build pipeline working before you can even test.

**How to avoid:**
- Use Expo's push notification service (not raw APNs) -- it handles token translation, receipt tracking, and retry logic
- Set up EAS Build and Apple Developer certificates in the FIRST phase, not when you need notifications
- Track both the Expo push token AND the native device token in the backend
- Implement notifications in a focused phase, not as an afterthought bolted onto chat
- Build the server-side notification sender as a standalone module that watches for permission requests and model questions
- Test with TestFlight builds on real devices from day one
- Start with simple text notifications. Add actionable notifications (approve/deny buttons) in a later phase
- Handle the "user denied notification permission" case gracefully -- it's not an error, it's a choice

**Warning signs:**
- "It works in Expo Go" (no it doesn't -- push requires dev builds)
- Notifications arrive in foreground but not background
- Token refresh after app update breaks delivery
- Deep link from notification opens wrong screen or crashes

**Phase to address:**
Dedicated notification phase AFTER chat is working and the EAS Build pipeline is proven. Don't combine notification work with chat UI work -- the debugging contexts are completely different (network/server vs. UI/UX).

---

### Pitfall 6: Expo Go Comfort Zone -- Avoiding Development Builds

**What goes wrong:**
The developer stays in Expo Go for too long because it's fast and frictionless (scan QR code, see changes). But Expo Go has a fixed set of native modules. The moment you need a library with custom native code (react-native-skia for GPU effects, custom notification actions, background processing, Dynamic Island), Expo Go breaks. The transition to development builds forces learning EAS Build, certificate management, and longer iteration cycles. If this transition happens mid-project, it disrupts momentum.

**Why it happens:**
Expo Go feels magical compared to Xcode. Hot reload, no compile step, works on any device. The developer avoids the development build transition because it introduces friction: EAS Build takes 5-15 minutes per build (cloud) or requires local Xcode setup, certificates need provisioning, and the iteration cycle slows from 1 second to minutes. This is especially painful for a solo developer who's used to Vite's sub-second HMR.

**How to avoid:**
- Start with a development build from day one. Skip Expo Go entirely
- Run `eas build --profile development --platform ios` in the first hour of the project
- Use `npx expo start --dev-client` instead of `npx expo start` (Expo Go)
- Set up EAS Build credentials (Apple Developer account, distribution certificate, provisioning profile) in the scaffolding phase
- EAS handles certificate management automatically if you let it -- don't fight the system
- Use `eas build --local` if you have Xcode on a Mac to avoid cloud build queues
- Development builds still support fast refresh via Metro -- the iteration speed penalty is only for native code changes, not JS changes

**Warning signs:**
- Using `npx expo start` without `--dev-client`
- Deferring library installation "because it needs a dev build"
- Testing only on Expo Go and finding everything works, then discovering device-specific crashes when switching to dev builds
- Plans that say "will switch to dev builds later"

**Phase to address:**
Phase 0/scaffolding. Before any feature code. The development build IS the foundation.

---

### Pitfall 7: Over-Sharing Code Between Web and Native

**What goes wrong:**
In pursuit of DRY, the developer creates a shared package with Zustand stores, API hooks, AND component abstractions. The shared components use platform conditionals everywhere (`Platform.OS === 'web' ? <div> : <View>`), creating Frankenstein components that are hard to test, hard to debug, and produce suboptimal results on both platforms. The monorepo configuration consumes days of setup. Metro bundler can't resolve web dependencies. Web build breaks because of RN-only packages.

**Why it happens:**
"30-40% code sharing" sounds like you should create a shared package for that 30-40%. But the sharable code is almost entirely non-visual: stores, hooks, API clients, types, constants. This code doesn't need a monorepo -- it can be copied (initially) or extracted into a simple shared directory. The monorepo complexity is high: Metro requires specific configuration to resolve dependencies from hoisted `node_modules`, Vite and Metro have different module resolution strategies, and React Native doesn't support export maps by default.

**How to avoid:**
- Start with a simple directory structure, NOT a monorepo:
  ```
  /src        -- Web app (Vite + React, unchanged)
  /mobile     -- React Native app (Expo)
  /shared     -- Plain TypeScript (stores, types, API hooks, constants)
  /server     -- Backend (unchanged)
  ```
- `/shared` exports only platform-agnostic code: types, Zustand store definitions, API client, WebSocket protocol, streaming logic
- NO shared UI components. The web has `div/span/CSS`, native has `View/Text/StyleSheet` -- accept the duplication
- If monorepo becomes necessary later, migrate then. Don't pay the complexity cost upfront
- Validate that `/shared` imports work in BOTH Metro (RN) and Vite (web) before writing shared code
- Avoid barrel files (`index.ts` re-exports) -- they cause bundler issues in Metro

**Warning signs:**
- `Platform.OS` checks in shared code
- Metro build errors about unresolved modules from `node_modules`
- Web build breaks after installing a React Native package
- More than a day spent on monorepo/workspace configuration

**Phase to address:**
Scaffolding phase. Define the directory structure and sharing boundary. Prove imports work in both directions before writing features.

---

### Pitfall 8: Thinking in Web Layout Instead of Native Layout

**What goes wrong:**
The developer writes layout code using web mental models: percentage widths, media queries, CSS Grid, absolute positioning, nested flex with complex alignment. React Native's Flexbox is similar to CSS Flexbox but NOT identical (defaults differ: `flexDirection` is `column`, not `row`). There is no CSS Grid. There are no media queries (use `Dimensions` or `useWindowDimensions`). Percentage-based layouts often produce layout bugs because RN calculates percentages differently. The result is layouts that don't feel right but the developer can't figure out why.

**Why it happens:**
After 50+ phases of Tailwind CSS, web layout patterns are deeply ingrained. RN's layout engine looks like Flexbox but has subtle differences that produce unexpected results. The developer doesn't realize they're thinking in web paradigms until they've spent hours debugging a layout that "should work."

**How to avoid:**
- Learn React Native's Flexbox defaults: `flexDirection: 'column'`, `alignItems: 'stretch'`
- Use `flex: 1` liberally -- it's the primary layout mechanism in RN
- Prefer absolute values (in density-independent pixels) over percentages for spacing
- Use `SafeAreaView` (or `useSafeAreaInsets` from `react-native-safe-area-context`) for notch/Dynamic Island areas
- Use NativeWind (Tailwind for RN) if you want familiar utility classes, but know that it maps to StyleSheet, not CSS -- not all Tailwind classes work
- Study the reference apps' layout patterns: iOS apps use consistent safe-area insets, system-standard spacing (8/16/20pt grid), and platform-specific component sizes

**Warning signs:**
- Using `width: '50%'` and getting unexpected results
- Layouts that look correct in portrait but break in landscape
- Content hidden behind the notch or Dynamic Island
- Elements overlapping or clipping unexpectedly

**Phase to address:**
First UI phase. Build one screen (session list) correctly, establish layout patterns, then replicate.

---

## Moderate Pitfalls

### Pitfall 9: Streaming Markdown Rendering Performance

**What goes wrong:**
Re-parsing the entire accumulated markdown text on every streaming chunk causes exponential slowdown. With a 500-token response, you parse markdown 500 times, and each parse is longer than the last. The UI stutters, animations drop frames, and the app feels unresponsive during long responses.

**Why it happens:**
The web app solved this with a two-phase renderer (rAF innerHTML during streaming, react-markdown for finalized). React Native doesn't have innerHTML -- everything goes through the React reconciler. Naive streaming renders trigger full markdown re-parse on every token.

**How to avoid:**
- Use `react-native-streamdown` (by Software Mansion) -- built specifically for streaming markdown in RN with memoization and incremental parsing
- Accumulate tokens in a shared value or ref, debounce rendering to ~100ms intervals
- Only re-render changed paragraphs, not the entire message
- For code blocks: detect block boundaries and only re-highlight when a block is complete
- Consider a simpler renderer during streaming (plain text with basic formatting) that upgrades to full markdown on completion -- mirrors the web app's two-phase pattern

**Warning signs:**
- UI freezes during long code block generation
- Scroll-to-bottom animation drops frames during streaming
- CPU spikes visible in React DevTools profiler during streaming

**Phase to address:**
Chat implementation phase. Prototype streaming rendering early -- this determines the entire chat experience quality.

---

### Pitfall 10: Reanimated/Gesture Handler Misuse

**What goes wrong:**
Animations run on the JS thread instead of the UI thread, causing dropped frames during gesture-driven interactions. Gesture callbacks trigger `setState` on every frame, blocking the JS thread. The developer writes smooth animation code that works in isolation but stutters when the chat list is scrolling or streaming is active.

**Why it happens:**
Web developers are used to `useState` + CSS transitions. In React Native, `useState` for animation values runs on the JS thread and must bridge to native for every frame. Reanimated's `useSharedValue` + `useAnimatedStyle` run entirely on the UI thread via worklets, bypassing the JS thread. But the API is different enough that web developers default to the familiar pattern.

**How to avoid:**
- ALWAYS use `useSharedValue` (not `useState`) for animation-driven values
- ALWAYS use `useAnimatedStyle` for animated component styles
- Use `runOnJS` only when you MUST update React state (e.g., after a gesture completes)
- Wrap gesture objects in `useMemo` to prevent reattachment on every render
- Use `simultaneousWithExternalGesture` to handle gesture conflicts (swipe-to-delete + list scroll)
- Profile animations with the React Native performance monitor -- target 60fps minimum, 120fps on ProMotion

**Warning signs:**
- Using `Animated.Value` (old API) instead of `useSharedValue` (Reanimated)
- `runOnJS` called inside gesture `onUpdate` handlers (should be `onEnd` only)
- Animation code using `setState` instead of shared values
- Visible jank when swiping while the list is loading

**Phase to address:**
First phase with animations (likely chat screen). Establish the animation pattern correctly from the start.

---

### Pitfall 11: Apple Developer Program and Certificate Maze

**What goes wrong:**
The developer can't test on their device because certificates are wrong, provisioning profiles don't match, or the Apple Developer account isn't set up for the right capabilities. EAS Build fails with cryptic signing errors. Days lost to Apple infrastructure before writing a line of feature code.

**Why it happens:**
Apple's code signing system is notoriously complex: distribution certificates, development certificates, provisioning profiles (development, ad hoc, App Store), bundle identifiers, capabilities (push notifications, background modes), and entitlements. EAS Build automates much of this, but it still requires an Apple Developer Program membership ($99/year), correct account permissions, and initial configuration.

**How to avoid:**
- Enroll in Apple Developer Program BEFORE starting development (activation can take 24-48 hours)
- Let EAS manage certificates automatically: `eas credentials` handles generation and storage
- Use `eas build --profile development --platform ios` for the first build immediately after scaffold
- Register your test device's UDID for ad hoc provisioning (EAS can register devices for you)
- Add capabilities incrementally: start with just "push notifications" -- add background modes, associated domains, etc. as needed
- Keep your Apple ID 2FA device accessible during builds (Apple requires re-auth periodically)

**Warning signs:**
- "No matching provisioning profile" errors from EAS Build
- "Code signing identity not found" in build logs
- Push notifications work in development but not TestFlight (different APNs environment)
- App crashes on launch on real device but works in simulator

**Phase to address:**
Phase 0/scaffolding. Solve this before any feature code. A working development build on your iPhone should be the first milestone.

---

### Pitfall 12: Ignoring iOS App Lifecycle for Chat State

**What goes wrong:**
The app loses context when iOS force-quits it for memory, when the user switches apps, or when a phone call interrupts. The user returns to find: wrong session loaded, chat scrolled to wrong position, composer content lost, or a stale "connecting..." state that never resolves.

**Why it happens:**
iOS aggressively manages app lifecycle. An app can be suspended (JS execution halted), then terminated entirely without warning. React Native persists component state in memory -- when the app is terminated, all state is lost. The web app uses `persist` middleware on Zustand stores (localStorage), but React Native needs `AsyncStorage` or `expo-secure-store` as the persistence backend.

**How to avoid:**
- Use Zustand's `persist` middleware with `AsyncStorage` as the storage backend for critical state: active session ID, sidebar state, composer draft
- Save scroll position on background transition (AppState listener)
- Restore state on app launch: load last session, restore scroll, check connection
- Handle the "app was terminated" case: on launch, check if the persisted session still exists on the backend
- Don't persist transient state: streaming progress, WebSocket connection state, animation values

**Warning signs:**
- App always opens to session list instead of last active session
- Composer draft lost after switching to another app and back
- Stale data showing from a previous session after termination and relaunch

**Phase to address:**
Foundation phase, alongside WebSocket connection management. State persistence and app lifecycle are intertwined.

---

### Pitfall 13: NativeWind / Styling Expectations Mismatch

**What goes wrong:**
The developer adopts NativeWind expecting Tailwind parity and discovers: no CSS Grid, no `hover:`, limited `gap` support in older RN versions, no `content-visibility`, no `::before`/`::after` pseudo-elements, no CSS animations (`@keyframes`), and subtle differences in how `flex` shorthand resolves. Styling that "should work" produces visual bugs or crashes.

**Why it happens:**
NativeWind (Tailwind CSS for React Native) maps Tailwind utility classes to React Native StyleSheet objects. But React Native's style engine is a subset of CSS. NativeWind v4 is significantly better than v2 (supports CSS variables, media queries, container queries) but still can't paper over fundamental RN layout limitations.

**How to avoid:**
- Read NativeWind v4's compatibility table before starting. Know what's supported and what isn't.
- Accept that some web styles will need Reanimated replacements: CSS transitions become `withSpring`/`withTiming`, `@keyframes` become worklet animations
- Use `StyleSheet.create` for complex styles that NativeWind can't express
- Don't use NativeWind for animation-driven styles -- use Reanimated's `useAnimatedStyle` instead
- Test on real device early -- NativeWind bugs often only manifest on device, not Metro's web target

**Warning signs:**
- `className` prop not applying styles (likely missing NativeWind babel plugin)
- Styles work on web target but break on iOS
- Layout looks different between Expo Go and production build

**Phase to address:**
Scaffolding phase. Establish the styling approach (NativeWind vs StyleSheet vs hybrid) and validate it works for 3-4 representative components before committing.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Copy stores instead of sharing them | Fast start, no monorepo setup | Two copies drift, bugs fixed in one not the other | v3.0 only -- extract shared package before v3.1 |
| Skip TypeScript strict mode in mobile app | Faster prototyping, fewer type errors to fix | Catches bugs at runtime instead of compile time, harder to share types | Never -- strict mode from day one |
| Use Expo Go for initial development | Instant iteration, no build step | Must transition to dev builds for push/native modules, breaking change mid-project | Never for this project -- dev builds from start |
| Inline styles instead of design system | Ship faster, no style infrastructure | Inconsistent spacing/colors, hard to change theme later | First prototype only -- design system before second screen |
| Test only on iPhone 16 Pro Max | Primary device, fast feedback | Misses issues on older devices, different screen sizes | Acceptable for v3.0 if targeting single device |
| Skip automated tests for UI | Faster shipping, less infrastructure | Regressions on every change, no confidence in refactors | MVP only -- add tests before v3.1 |

## Integration Gotchas

Common mistakes when connecting to the existing backend.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| WebSocket (existing) | Assuming connection persists across app lifecycle | Implement connect-on-foreground, disconnect-on-background with AppState listener |
| JWT Auth (existing) | Storing token in AsyncStorage (unencrypted) | Use `expo-secure-store` for JWT tokens -- encrypted at rest on iOS |
| REST API (existing) | Hardcoding server URL | Use environment variables via `expo-constants` + app.config.ts; different URLs for dev/staging/prod |
| Push notifications (new) | Sending Expo push token to backend without device identification | Track device ID + push token + platform in backend; handle token refresh on app update |
| Streaming (existing) | Using the web app's rAF innerHTML approach | Replace with React reconciler approach: accumulate in ref, debounce-render to components |
| Backend CORS | Not configuring CORS for the native app's origin | Native apps don't send Origin headers -- CORS isn't an issue, but the backend might reject requests without Origin if configured to require it |
| File uploads | Using FormData (web) for image attachments | Use `expo-image-picker` + `expo-file-system` for iOS-native file handling; FormData still works for upload but file access is different |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Re-rendering entire message list on each streaming token | Scroll jank, dropped frames | Memoize message items, isolate streaming to active message component | Immediately -- visible from first message |
| Loading all sessions in sidebar at once | Slow app launch, memory pressure | Paginate session list, lazy-load session content | 50+ sessions |
| Storing full message content in Zustand (no pagination) | Growing memory, eventually OOM | Paginate messages, keep only visible window + buffer in memory | 200+ messages in a session |
| Inline function props in FlatList renderItem | Every list item re-renders on parent state change | Extract renderItem to a memoized component, use `useCallback` or React Compiler | 20+ items in list |
| Large images in chat (base64 in state) | Memory spike, scroll jank | Display thumbnails in list, load full images on tap/zoom only | 3+ images in conversation |
| Shiki syntax highlighting on every render | CPU spike on code-heavy responses | Cache highlighted output by content hash, highlight only on completion | 5+ code blocks visible |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| JWT in AsyncStorage | Token readable by any app on jailbroken device | Use `expo-secure-store` (iOS Keychain) |
| Backend URL in source code | URL extractable from app binary | Use environment config; but note this is a personal tool on Tailscale -- risk is low |
| No certificate pinning | MITM on public networks | Low risk on Tailscale private network; implement later if needed |
| Push notification payload contains sensitive content | Lock screen shows message content | Use notification content-extension to redact on lock screen, or send silent notifications that trigger local fetch |
| Expo push token sent over HTTP | Token interceptable | Backend already uses HTTPS via Tailscale Serve -- verify this path |

## UX Pitfalls

Common user experience mistakes specific to chat apps on iOS.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Keyboard covers composer on smaller screens | Can't see what you're typing | Use `KeyboardAvoidingView` + `useKeyboardHandler` from `react-native-keyboard-controller` |
| No haptic feedback on interactions | App feels dead/web-like | Use `expo-haptics` on send, receive, tool complete, permission request |
| Hard-cut transitions between screens | Feels cheap compared to ChatGPT | Use `react-native-reanimated` shared element transitions + spring physics |
| Pull-to-refresh on chat (like a feed) | Chat is not a feed -- PTR is wrong paradigm | Scroll to top to load history; no PTR. New messages appear at bottom |
| Context menu that looks web-like (dropdown list) | Breaks iOS mental model | Use native-feeling context menus (react-native-context-menu-view for UIMenu integration) |
| Text selection that conflicts with gestures | Can't copy message text | Separate tap (navigation) from long-press (selection) with clear timing thresholds |
| Notification badge count not updating | User thinks no new messages | Implement `expo-notifications` badge management; clear on app open |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Chat screen:** Often missing scroll-to-bottom on new message when user is near bottom (not AT bottom) -- verify threshold behavior
- [ ] **WebSocket reconnection:** Often missing message gap detection -- verify no messages lost during reconnect by comparing message IDs
- [ ] **Push notifications:** Often missing foreground notification handling -- verify notifications still appear as banners when app is active
- [ ] **Session list:** Often missing optimistic updates -- verify new session appears immediately, not after server roundtrip
- [ ] **Keyboard avoidance:** Often missing interactive dismiss (drag-to-dismiss keyboard) -- verify gesture works on chat screen
- [ ] **Deep linking:** Often missing cold start handling -- verify notification tap launches correct session when app is terminated
- [ ] **Streaming:** Often missing cancel/abort behavior -- verify user can stop generation mid-stream
- [ ] **Dark mode:** Often missing status bar color sync -- verify status bar text is light on dark background (not default black)
- [ ] **Safe areas:** Often missing landscape orientation handling -- verify (or explicitly disable rotation)

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Ported web UI (too web-like) | HIGH -- redesign from scratch | Accept the cost. The web UI code is a sunk cost. Start from reference app screenshots. Faster to rebuild mobile-native than to fix web-ported layouts |
| Vision fragmentation (15 phases in, looks bland) | MEDIUM -- creative reset | Pause implementation. Revisit soul document. Do a focused "design sprint" comparing current state to ChatGPT iOS. Fix the worst 3 screens. Then continue |
| WebSocket state bugs | LOW -- focused fix | Add AppState listener, implement reconnection protocol, test with real backgrounding. Isolated change, doesn't affect UI |
| FlatList performance | MEDIUM -- significant refactor | Consider FlashList migration or custom native list component (like Discord). May require extracting streaming to a separate view outside the list |
| Certificate/build pipeline failure | LOW -- follow docs | Run `eas credentials` to regenerate. Let EAS manage everything. Don't manually manage certificates |
| Over-shared code (monorepo pain) | MEDIUM -- restructure | Move to simple `/shared` directory. Copy files that need platform-specific changes into `/mobile`. Accept duplication for clarity |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| P1: Porting web UI | Design phase (Phase 0) | swd approves mockups/wireframes that look nothing like web app layout |
| P2: Vision fragmentation | Design phase + every phase | Side-by-side comparison with ChatGPT iOS at every device test |
| P3: WebSocket lifecycle | Foundation/networking phase | Background app for 30s, foreground, verify no missing messages |
| P4: FlatList performance | Chat screen phase | Scroll 100+ messages at 60fps; stream 500-token response without jank |
| P5: Push notification complexity | Dedicated notification phase | Send test push from backend, receive on device, tap to open correct session |
| P6: Expo Go comfort zone | Scaffolding phase (Phase 0) | Development build running on iPhone before any feature code |
| P7: Over-sharing code | Scaffolding phase | Both Vite (web) and Metro (mobile) build successfully with shared code |
| P8: Web layout thinking | First UI screen phase | Layout passes visual comparison against reference app at identical screen size |
| P9: Streaming markdown perf | Chat screen phase | 500-token streaming response renders at 60fps with no visible stutter |
| P10: Reanimated misuse | First animated component | Animation profiled at 120fps on ProMotion device |
| P11: Apple certificates | Scaffolding phase | `eas build` succeeds, app installs and runs on physical device |
| P12: App lifecycle state | Foundation phase | Kill app, relaunch, verify correct session/state restoration |
| P13: NativeWind mismatch | Scaffolding phase | 3-4 representative components render correctly with chosen styling approach |

## Capacitor-to-React-Native Transition: Lessons That Apply

These are NOT about migrating Capacitor code (there's nothing to migrate -- clean break). These are patterns from the Capacitor experience that should inform how the RN app is built.

| Capacitor Lesson | Application to RN |
|------------------|-------------------|
| Fix cascades (fixing A breaks B breaks C) | In RN, this happens with gesture conflicts. Use `simultaneousWithExternalGesture` and explicit gesture priority from the start, not as fixes after conflicts emerge |
| "Workaround only" bugs | If something requires a workaround in RN (it shouldn't for gestures/keyboard/scroll), consider it a red flag. RN should handle these natively. If it doesn't, the library choice is wrong |
| Batch testing found everything broken | Test EACH screen on device as you build it. Not "build 5 screens, then test." The Capacitor experience proved this conclusively |
| Polish on shaky foundation | Don't add spring physics, haptics, or visual effects until the underlying screen works correctly (correct data, correct layout, correct scroll). Polish amplifies quality; it can't fix broken foundations |
| Sunk cost bias (15 plans deep) | Set an explicit "stop and reassess" checkpoint at phase 3. If it doesn't feel native after 3 phases, something fundamental is wrong. Don't continue hoping it gets better -- that's the Capacitor pattern |

## Solo Developer-Specific Risks

| Risk | Why It's Amplified for Solo | Mitigation |
|------|---------------------------|------------|
| Decision fatigue | Every tech choice, every design decision, every architecture call lands on one person | Pre-commit to the stack (Expo, Reanimated, FlashList). Don't re-evaluate mid-project unless something is clearly broken |
| No code review | Nobody catches the "this will be a problem in 3 phases" patterns | Bard architectural review on each phase. Adversarial review on critical phases |
| Context loss between sessions | After a break, forgetting why a decision was made | Document decisions in MEMORY.md and phase completion notes. Read them before resuming |
| Parallel maintenance burden | Web app + mobile app + backend = 3 things to keep working | Web app is DONE for v3.0. Don't touch it. Backend changes should be additive only (new notification endpoint) |
| Overcommitting scope | "Since I'm already in here, let me also add..." | v3.0 ships EXACTLY three features beautifully: chat, sessions, notifications. Dynamic Island, file uploads, terminal, settings all wait for v3.1+ |
| Burnout from infrastructure | Days of certificates, build config, monorepo setup feel unproductive | Budget infrastructure explicitly. "Phase 0: scaffolding" with zero UI expectations. Celebrate a working dev build as a milestone |
| Testing only the happy path | Solo dev tests what they expect to work | Explicitly test: backgrounding mid-stream, poor network, kill-and-relaunch, first launch with no sessions, 100+ messages in a session |

## Sources

### Verified (HIGH confidence)
- [Fernando Rojo: I learned React Native as a web developer, and I got everything wrong](https://fernandorojo.co/mistakes) -- Web dev migration mistakes
- [Expo: Best Practices for Reducing Lag](https://expo.dev/blog/best-practices-for-reducing-lag-in-expo-apps) -- React Compiler, worklets, performance
- [Expo: Development Builds vs Expo Go](https://expo.dev/blog/expo-go-vs-development-builds) -- When to use each, limitations
- [Expo: Monorepos](https://docs.expo.dev/guides/monorepos/) -- Official monorepo guidance
- [Expo: Push Notifications FAQ](https://docs.expo.dev/push-notifications/faq/) -- Common issues and solutions
- [Expo: Config Plugins](https://docs.expo.dev/config-plugins/plugins/) -- Native module integration
- [React Native: Optimizing FlatList](https://reactnative.dev/docs/optimizing-flatlist-configuration) -- Official performance guide
- [RN WebSocket background issue #11795](https://github.com/facebook/react-native/issues/11795) -- iOS background WebSocket behavior
- [RN WebSocket termination issue #26731](https://github.com/facebook/react-native/issues/26731) -- App termination with open WebSocket
- [Discord: How Discord achieves native iOS performance with React Native](https://discord.com/blog/how-discord-achieves-native-ios-performance-with-react-native) -- Custom list, native modules, gesture handling
- [Reanimated Performance Guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/) -- UI thread vs JS thread
- [Software Mansion: react-native-streamdown](https://github.com/software-mansion-labs/react-native-streamdown) -- Streaming markdown for RN

### Verified (MEDIUM confidence)
- [Expo: From Web to Native with React](https://expo.dev/blog/from-web-to-native-with-react) -- Migration patterns
- [Ably: Realtime apps with React Native and WebSockets](https://ably.com/topic/websockets-react-native) -- WebSocket best practices
- [App Store Review Guidelines Checklist (2025)](https://nextnative.dev/blog/app-store-review-guidelines) -- Common rejection reasons
- [Callstack: React Native Wrapped 2025](https://www.callstack.com/blog/react-native-wrapped-2025-a-month-by-month-recap-of-the-year) -- Ecosystem state

### Project-specific (HIGH confidence -- lived experience)
- Loom v2.2 Capacitor post-mortem: 5/7 iOS bugs architecturally unfixable in WKWebView
- Phase 67.1 PLATFORM-RESEARCH.md: Competitor architecture analysis
- Implementation guardrails document: Vision fragmentation risk assessment
- Lessons from Capacitor document: Cascade pattern, sunk cost, testing discipline

---
*Pitfalls research for: Adding React Native + Expo iOS app to existing Loom web + backend project*
*Researched: 2026-03-30*
