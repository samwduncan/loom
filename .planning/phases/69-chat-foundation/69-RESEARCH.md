# Phase 69: Chat Foundation - Research

**Researched:** 2026-03-31
**Domain:** React Native streaming chat, WebSocket lifecycle, NativeWind styling, Expo Router navigation
**Confidence:** HIGH (core libraries verified, architecture patterns confirmed, existing code audited)

## Summary

Phase 69 builds the end-to-end native messaging loop: session list, drawer navigation, auth, WebSocket lifecycle, streaming markdown rendering, and the composer -- all Soul-doc-compliant from day one. The existing shared code (`shared/lib/`, `shared/stores/`, `shared/types/`) provides a strong foundation -- WebSocket client, stream multiplexer, API client, auth provider, and 5 Zustand stores are already extracted and factory-instantiated for MMKV in `mobile/stores/index.ts`.

The streaming markdown evaluation (D-01) is the highest-risk item. **react-native-streamdown** (Software Mansion, v0.1.1) is purpose-built for this exact use case -- worklet-thread markdown processing with zero JS thread jank -- but it is very new, requires the experimental `react-native-worklets` Bundle Mode, and currently only supports CommonMark (no GFM tables). The parallel spike with a custom renderer using `react-native-enriched-markdown` (v0.4.1, same maintainer, supports GFM) provides a solid fallback. Both require New Architecture (Fabric), which is already enabled (`newArchEnabled: true` in app.json).

Dynamic color implementation needs Reanimated `interpolateColor` + `useSharedValue`, not NativeWind CSS custom properties. NativeWind v4 supports CSS variables but they cannot be animated at runtime on the native thread -- Reanimated shared values are the correct tool for the streaming warmth shift and error color cooling specified in the Soul doc.

**Primary recommendation:** Start with a parallel markdown PoC (Plan 1). Use `react-native-keyboard-controller` for keyboard sync, `@shopify/flash-list` v2.3.1 for the message list, Reanimated `interpolateColor` for dynamic color, and custom Expo Router drawer content for the session list. Wire WebSocket + multiplexer + stores using the same `configure()` callback pattern the web app uses in `websocket-init.ts`, but with AppState lifecycle integration.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Parallel evaluation in Plan 1: test react-native-streamdown AND build a minimal custom renderer spike. Compare rendering quality, performance, and styling control. Pick the winner for remaining plans.
- **D-02:** Phase 69 markdown scope: full markdown minus syntax-highlighted code blocks. Headings, bold, italic, inline code, lists, blockquotes, tables, horizontal rules, links. Code blocks render as unstyled monospace on surface-sunken background. Syntax highlighting is Phase 70.
- **D-03:** If both approaches fail the PoC, fallback to plain text streaming with basic inline markup.
- **D-04:** Soul-compliant from the start. Every component implements NATIVE-APP-SOUL.md: correct spring configs, 4-tier surface hierarchy, dynamic color shifts, proper typography. No deferred motion debt.
- **D-05:** Dynamic color from the start: streaming warmth shift, idle, error, thinking, permission states.
- **D-06:** All Soul doc anti-patterns enforced from Phase 69.
- **D-07:** Auto-connect with token prompt. Tailscale backend URL prefilled.
- **D-08:** Connection failure shows error with manual server URL override in Settings.
- **D-09:** No onboarding flow. First launch: token prompt -> connect -> empty state.
- **D-10:** Full Soul doc session list (grouped by project, pinned, search, swipe-to-delete, staggered animations).
- **D-11:** Active session: surface-raised + 3px left accent border. Streaming: accent dot pulses.
- **D-12:** Pull-to-refresh with custom spring (damping 25, stiffness 120), 60pt overscroll.
- **D-13:** "New Chat" button at top, 44px, accent bg. Tapping opens project selection sheet.
- **D-14:** Full Soul doc composer (glass backdrop, expanding input, send/stop toggle, status bar).
- **D-15:** Attachment button present but non-functional.
- **D-16:** Keyboard avoidance: react-native-keyboard-controller, matches system curve exactly.
- **D-17:** Glass backdrop: try first, measure FPS, fallback to opaque surface-raised.
- **D-18:** Full Soul doc message layout (user bubbles, assistant free-flowing, provider avatar).
- **D-19:** 24px avatar, 24px turn spacing, 8px same-role spacing.
- **D-20:** Timestamps after 5-minute gaps. Long-press reveal deferred to Phase 71.
- **D-21:** Message entrance animations per Soul doc.
- **D-22:** Scroll-to-bottom pill: glass, accent text, Standard spring bounce.
- **D-23:** New session empty state: avatar + model name + "How can I help?"
- **D-24:** Empty session list: centered text + New Chat button.
- **D-25:** Loading states with context (skeletons, connecting text, sending indicator).
- **D-26:** Streaming indicator: 2px accent line, pulsing opacity 0.3-0.8.
- **D-27:** Full AppState integration. Background: disconnect after 30s. Foreground: reconnect with backoff.
- **D-28:** Partial stream persistence on backgrounding. Show partial with "interrupted" indicator on return.
- **D-29:** Connection banner: glass, Navigation spring, destructive tint, auto-dismiss on reconnect.
- **D-30:** AppState listener in root layout.

### Claude's Discretion
- Markdown renderer internal architecture (AST walker vs regex vs hybrid)
- FlashList vs FlatList for message list (profile and choose)
- WebSocket message buffering strategy during reconnection
- Project selection sheet UI pattern (bottom sheet vs modal vs inline)

### Deferred Ideas (OUT OF SCOPE)
- Syntax-highlighted code blocks (Phase 70 -- Shiki)
- Long-press context menu Copy/Retry/Share (Phase 71)
- Haptic pairing on all interactions (Phase 71 -- springs yes, haptics no)
- Tool cards (Phase 70 -- text indicators only in Phase 69)
- Thinking block disclosure (Phase 70)
- File attachment (Phase 70+)
- Multiple providers (Phase 72+)
- Push notifications (Phase 72)
- Deep linking (Phase 72)
- Share sheet (Phase 73)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CHAT-01 | User can view a scrollable list of chat sessions grouped by project | Session types (`ProjectGroup`, `ProjectSessionGroup`) in shared/types/session.ts + API `GET /api/projects` + `GET /api/projects/:name/sessions`. Custom drawer content with FlashList. |
| CHAT-02 | User can create a new chat session and select a project | WebSocket `claude-command` with `projectPath` + `GET /api/projects` for project list. Bottom sheet or modal for project picker. |
| CHAT-03 | User can switch between sessions via sidebar drawer (swipe from left edge) | Expo Router Drawer with custom `drawerContent` prop. Gesture-driven open/close via react-native-gesture-handler (already installed). |
| CHAT-04 | User can send a message and see streaming markdown response in real-time | WebSocket client `send()` -> multiplexer routes `claude-response` -> content tokens -> markdown renderer. PoC evaluates react-native-streamdown vs custom renderer. |
| CHAT-09 | User can authenticate via JWT token with secure storage (iOS Keychain) | `nativeAuthProvider` in mobile/lib/auth-provider.ts (expo-secure-store). Token prompt UI on first launch. API client factory wired with auth. |
| CHAT-10 | User sees connection status banner when WebSocket disconnects | Connection store `updateProviderStatus` + banner component with Soul-doc glass surface, Navigation spring slide-down, destructive tint. |
| CHAT-11 | App reconnects WebSocket automatically on foreground with exponential backoff | AppState listener + WebSocketClient `tryReconnect()` (already has exponential backoff). 30s grace period on background, immediate reconnect on foreground. |
</phase_requirements>

## Standard Stack

### Core (Already Installed in mobile/)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo | ~54.0.33 | App framework, dev client, EAS builds | Project standard. Expo SDK 54, RN 0.81. |
| react-native | 0.81.5 | UI runtime | Pinned by Expo SDK 54. New Architecture enabled. |
| expo-router | ~5.0.7 | File-based navigation (drawer + stack) | Phase 68 decision. Drawer/stack groups already scaffolded. |
| @react-navigation/drawer | ^7.3.9 | Drawer navigator (custom content support) | Peer dep of expo-router drawer. Custom drawerContent for session list. |
| react-native-reanimated | ~3.19.5 | Spring physics, dynamic color interpolation | Phase 68 decision. All Soul doc springs + `interpolateColor` for dynamic color. |
| react-native-gesture-handler | ~2.25.0 | Gesture system (drawer swipe, swipe-to-delete) | Peer dep. Already installed. Powers drawer and gesture recognizers. |
| react-native-mmkv | ^3.2.0 | Fast key-value storage (Zustand persistence) | Phase 68 decision. MMKV adapter in mobile/lib/storage-adapter.ts. |
| expo-secure-store | ~14.2.3 | iOS Keychain (JWT token storage) | Phase 68 decision. Auth provider in mobile/lib/auth-provider.ts. |
| expo-blur | ~14.1.5 | Glass surface (BlurView) | Phase 68 decision. GlassSurface primitive validated on device. |
| nativewind | ^4.1.23 | Tailwind CSS styling (v3 syntax) | Phase 68 decision. Config + 5 primitives validated. |
| expo-haptics | ~14.1.4 | Haptic feedback | Phase 68 installed. Phase 69 uses for send button only (full haptic pairing is Phase 71). |
| react-native-safe-area-context | ~5.4.0 | Safe area insets | Standard for notch/Dynamic Island/home indicator handling. |
| react-native-screens | ~4.11.1 | Native screen containers | Peer dep of expo-router. |

### New Dependencies for Phase 69

| Library | Version | Purpose | Why Needed |
|---------|---------|---------|------------|
| react-native-keyboard-controller | ^1.21.3 | Keyboard avoidance synced to iOS system curve | D-16 locked decision. `KeyboardStickyView` for composer. Peer: reanimated >=3.0.0 (satisfied). |
| @shopify/flash-list | ^2.3.1 | High-performance message list | Variable-height markdown messages, 50+ items. v2 auto-sizes items (no estimatedItemSize needed). Requires New Architecture (enabled). |
| react-native-streamdown | 0.1.1 | Streaming markdown (PoC candidate A) | D-01: parallel evaluation. Worklet-thread processing = zero JS jank. CommonMark only (no GFM tables). |
| react-native-enriched-markdown | 0.4.1 | Full markdown rendering (PoC candidate B / fallback) | D-01: parallel evaluation. GFM tables, code blocks, links, accessibility built-in. Fabric-only (enabled). |
| react-native-worklets | 0.8.1 | Worklet threading (streamdown dependency) | Required by react-native-streamdown Bundle Mode. Peer: RN 0.81-0.85 (satisfied). |
| remend | 1.3.0 | Streaming markdown token repair | Required by react-native-streamdown. Closes incomplete markdown tokens mid-stream. |
| lucide-react-native | ^1.7.0 | Icons (Loom-specific, fallback to SF Symbols) | Soul doc: Lucide for tool card icons, provider logos. Peer: react-native-svg. |
| react-native-svg | ^15.x | SVG rendering (Lucide dependency) | Peer dep of lucide-react-native. |
| expo-symbols | ~55.0.5 | SF Symbols (system UI icons) | Soul doc: SF Symbols for navigation, system UI. Peer: expo, expo-font. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-native-streamdown | react-native-marked (marked.js) | No worklet-thread processing, JS thread parses on every token. Acceptable for <10 msg but jank at scale. |
| @shopify/flash-list | FlatList (built-in) | FlatList works but lacks recycling optimization. FlashList v2 auto-sizes without estimates. Profile during implementation -- if FlashList causes issues, FlatList is zero-dep fallback. |
| react-native-keyboard-controller | KeyboardAvoidingView (built-in) | Built-in doesn't sync with iOS system curve. Soul doc explicitly prohibits unsynchronized keyboard animations (Anti-pattern #5). |
| expo-symbols + lucide-react-native | @expo/vector-icons | Vector icons are bitmap-scaled, not native SF Symbols. Soul doc specifies SF Symbols for system UI. |

**Installation:**
```bash
cd mobile
npx expo install react-native-keyboard-controller @shopify/flash-list expo-symbols react-native-svg
npm install react-native-streamdown react-native-enriched-markdown react-native-worklets@bundle-mode-preview remend lucide-react-native
```

**Note:** react-native-worklets needs the `bundle-mode-preview` tag for streamdown compatibility. After install, Babel and Metro config changes are required (see Architecture Patterns section).

## Architecture Patterns

### Recommended Project Structure

```
mobile/
  app/
    _layout.tsx              # Root: GestureHandler + Drawer + providers + AppState listener
    (drawer)/
      _layout.tsx            # Drawer layout with custom drawerContent
      index.tsx              # Main screen (redirects or shows chat)
      settings.tsx           # Settings screen
    (stack)/
      _layout.tsx            # Stack navigator
      chat/[id].tsx          # Chat screen (messages + composer)
  components/
    primitives/              # 5 existing Soul-doc primitives
    chat/
      MessageList.tsx        # FlashList of messages + scroll-to-bottom pill
      MessageBubble.tsx      # User bubble (surface-raised) or assistant (free-flowing)
      MarkdownRenderer.tsx   # Winner of PoC evaluation (streamdown or custom)
      StreamingIndicator.tsx # 2px accent pulsing line
      ProviderAvatar.tsx     # 24px circular provider icon
    composer/
      Composer.tsx           # Glass backdrop + input + send/stop + status bar
      ComposerInput.tsx      # Expanding TextInput (1-6 lines, Standard spring)
      SendButton.tsx         # Circular 36px, accent/destructive toggle
      ComposerStatus.tsx     # Token count, model name, connection dot
    session/
      SessionList.tsx        # Custom drawer content (grouped sessions)
      SessionItem.tsx        # 56px list item with active indicator
      SessionGroup.tsx       # Project header + session items
      NewChatButton.tsx      # Accent CTA at top of drawer
      SearchInput.tsx        # Glass expanding search
      ProjectPicker.tsx      # Bottom sheet for project selection
    connection/
      ConnectionBanner.tsx   # Glass slide-down banner with destructive tint
      AuthPrompt.tsx         # First-launch JWT token input
    empty/
      EmptySessionList.tsx   # "No sessions yet" + New Chat button
      EmptyChat.tsx          # Avatar + model name + "How can I help?"
  hooks/
    useAppState.ts           # AppState listener (background/foreground lifecycle)
    useWebSocket.ts          # WebSocket init + multiplexer wiring
    useDynamicColor.ts       # Reanimated shared values for streaming warmth/error cooling
    useMessageList.ts        # Session message fetching + caching
    useScrollToBottom.ts     # Scroll position tracking + pill visibility
  lib/
    auth-provider.ts         # (exists) iOS Keychain auth
    platform.ts              # (exists) Tailscale URLs
    storage-adapter.ts       # (exists) MMKV adapter
    websocket-init.ts        # NEW: mobile-specific WS + multiplexer + store wiring
    springs.ts               # Soul doc spring config constants
    colors.ts                # Dynamic color interpolation helpers
  stores/
    index.ts                 # (exists) 5 factory stores instantiated
```

### Pattern 1: WebSocket Init (Mobile-Specific)

The web app's `websocket-init.ts` provides the exact pattern. The mobile version replaces web-specific code (window.location, localStorage, CustomEvent) with React Native equivalents.

**What:** Single `initializeWebSocket()` function wires WebSocketClient callbacks -> stream multiplexer -> Zustand stores. Called once in root layout, guarded against double-init.

**Key differences from web:**
- No `window.history.replaceState` -- use Expo Router `router.replace()` for session ID swap
- No `localStorage` draft migration -- use MMKV
- No `window.dispatchEvent` for projects-updated -- use a Zustand action or EventEmitter
- AppState integration: disconnect on background, reconnect on foreground

```typescript
// mobile/lib/websocket-init.ts (simplified structure)
import { AppState, type AppStateStatus } from 'react-native';
import { WebSocketClient } from '@loom/shared/lib/websocket-client';
import { routeServerMessage } from '@loom/shared/lib/stream-multiplexer';
import { nativeAuthProvider } from './auth-provider';
import { resolveWsUrl } from './platform';
import { useConnectionStore, useStreamStore, useTimelineStore } from '../stores';

let isInitialized = false;
let wsClient: WebSocketClient | null = null;
let backgroundTimer: ReturnType<typeof setTimeout> | null = null;

export function getWsClient(): WebSocketClient | null { return wsClient; }

export async function initializeWebSocket(): Promise<void> {
  if (isInitialized) return;
  isInitialized = true;

  wsClient = new WebSocketClient({ resolveWsUrl, auth: nativeAuthProvider });

  // Build multiplexer callbacks (same pattern as web, minus browser-specific code)
  const callbacks = buildMultiplexerCallbacks(wsClient);

  // Configure client
  let isCurrentlyStreaming = false;
  wsClient.configure({
    onMessage: (msg) => {
      if (msg.type === 'claude-response' && !isCurrentlyStreaming) {
        isCurrentlyStreaming = true;
        wsClient!.startContentStream();
        callbacks.onStreamStart();
      }
      routeServerMessage(msg, callbacks, (m) => wsClient!.send(m));
      if (msg.type === 'claude-complete' || msg.type === 'claude-error') {
        isCurrentlyStreaming = false;
        wsClient!.endContentStream();
      }
    },
    onStateChange: (state) => {
      // Map to connection store (same as web)
    },
  });

  // AppState lifecycle
  AppState.addEventListener('change', (nextState: AppStateStatus) => {
    if (nextState === 'active') {
      // Foreground: cancel disconnect timer, reconnect if needed
      if (backgroundTimer) { clearTimeout(backgroundTimer); backgroundTimer = null; }
      if (wsClient?.getState() === 'disconnected') wsClient.tryReconnect();
    } else if (nextState === 'background') {
      // Background: start 30s disconnect timer
      backgroundTimer = setTimeout(() => { wsClient?.disconnect(); }, 30_000);
    }
  });

  // Bootstrap auth and connect
  const token = nativeAuthProvider.getToken();
  if (token) wsClient.connect(token);
}
```

### Pattern 2: Dynamic Color via Reanimated

NativeWind cannot animate CSS custom properties at runtime on the native thread. Dynamic color MUST use Reanimated shared values + `interpolateColor`.

**What:** A `useDynamicColor` hook manages shared values that drive background warmth shift during streaming and cooling during errors.

```typescript
// mobile/hooks/useDynamicColor.ts
import { useSharedValue, useAnimatedStyle, withTiming, interpolateColor, Easing } from 'react-native-reanimated';
import { useStreamStore, useConnectionStore } from '../stores';

// Soul doc: color transitions use withTiming at 500ms with Easing.out(Easing.cubic)
const COLOR_TIMING = { duration: 500, easing: Easing.out(Easing.cubic) };

// Surface base: idle rgb(46,42,40), streaming shifts warmer, error shifts cooler
const IDLE_BG = 'rgb(46, 42, 40)';
const STREAMING_BG = 'rgb(48, 43, 40)';   // +3 hue warmth (subtle)
const ERROR_BG = 'rgb(44, 42, 42)';       // cooler, desaturated

export function useDynamicColor() {
  const colorPhase = useSharedValue(0); // 0=idle, 1=streaming, -1=error
  const accentPulse = useSharedValue(1); // 0.6-1.0 sinusoidal during streaming

  const backgroundStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      colorPhase.value,
      [-1, 0, 1],
      [ERROR_BG, IDLE_BG, STREAMING_BG],
    ),
  }));

  // Trigger streaming warmth
  function enterStreaming() {
    colorPhase.value = withTiming(1, COLOR_TIMING);
    // Start accent pulse: withRepeat(withTiming(...))
  }

  function exitStreaming() {
    colorPhase.value = withTiming(0, COLOR_TIMING);
  }

  function enterError() {
    colorPhase.value = withTiming(-1, COLOR_TIMING);
  }

  return { backgroundStyle, accentPulse, enterStreaming, exitStreaming, enterError };
}
```

### Pattern 3: Soul Doc Spring Constants

Centralize all 6 spring configs as typed constants for consistent use.

```typescript
// mobile/lib/springs.ts
import { type WithSpringConfig } from 'react-native-reanimated';

export const SPRING = {
  micro:      { damping: 18, stiffness: 220, mass: 0.8 } satisfies WithSpringConfig,
  standard:   { damping: 20, stiffness: 150, mass: 1.0 } satisfies WithSpringConfig,
  navigation: { damping: 22, stiffness: 130, mass: 1.0 } satisfies WithSpringConfig,
  drawer:     { damping: 20, stiffness: 100, mass: 1.0 } satisfies WithSpringConfig,
  expand:     { damping: 18, stiffness: 90,  mass: 1.0 } satisfies WithSpringConfig,
  dramatic:   { damping: 15, stiffness: 70,  mass: 1.2 } satisfies WithSpringConfig,
} as const;

// Pull-to-refresh (custom per D-12)
export const PULL_REFRESH_SPRING = { damping: 25, stiffness: 120, mass: 1.0 } satisfies WithSpringConfig;
```

### Pattern 4: Custom Drawer Content

Expo Router's Drawer accepts a `drawerContent` prop for complete custom rendering. The session list replaces the default drawer items.

```typescript
// In app/(drawer)/_layout.tsx
import { Drawer } from 'expo-router/drawer';
import { SessionListDrawer } from '../../components/session/SessionList';

export default function DrawerLayout() {
  return (
    <Drawer
      drawerContent={(props) => <SessionListDrawer {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: 'rgb(38, 35, 33)', width: 300 },
        sceneStyle: { backgroundColor: 'rgb(46, 42, 40)' },
      }}
    >
      {/* screens */}
    </Drawer>
  );
}
```

### Pattern 5: Keyboard-Synced Composer

`KeyboardStickyView` moves the composer in perfect sync with the iOS keyboard animation. This is the correct component -- NOT `KeyboardAvoidingView` which resizes content and doesn't match the system curve.

```typescript
import { KeyboardStickyView } from 'react-native-keyboard-controller';

function ChatScreen() {
  return (
    <View style={{ flex: 1 }}>
      <MessageList />
      <KeyboardStickyView>
        <Composer />
      </KeyboardStickyView>
    </View>
  );
}
```

The `KeyboardProvider` must wrap the app at the root level (in `_layout.tsx`).

### Pattern 6: Streaming Markdown Token Accumulation

For the custom renderer path (not streamdown), the pattern is: accumulate tokens in a ref, debounce setState to batch re-renders. This mirrors the web app's rAF buffer approach adapted for React Native.

```typescript
const contentRef = useRef('');
const [displayContent, setDisplayContent] = useState('');
const updateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

// Subscribe to WebSocket content tokens
useEffect(() => {
  const unsub = wsClient.subscribeContent((token) => {
    contentRef.current += token;
    // Batch updates every 50ms to avoid per-token re-renders
    if (!updateTimer.current) {
      updateTimer.current = setTimeout(() => {
        setDisplayContent(contentRef.current);
        updateTimer.current = null;
      }, 50);
    }
  });
  return unsub;
}, []);
```

### Anti-Patterns to Avoid

- **Per-token setState for streaming:** Calling setState on every content token causes 100+ re-renders/second. Use ref accumulation + debounced flush.
- **KeyboardAvoidingView:** Built-in component doesn't match iOS system keyboard curve. Soul doc anti-pattern #5 explicitly prohibits unsynchronized keyboard animations.
- **Direct store imports in shared code:** Shared libraries accept callbacks/injection. Never import `mobile/stores` from `shared/`.
- **Inline style={{ color: ... }} for dynamic surfaces:** Use Reanimated `useAnimatedStyle` for animated colors. Static colors use NativeWind classes.
- **FlatList inverted for chat:** FlashList supports `inverted` but it reverses item order AND scroll direction. For chat, use normal order with `scrollToEnd` -- inverted causes gesture conflicts with drawer swipe.
- **setTimeout for background disconnect without ref cleanup:** Use a ref-tracked timer that clears on foreground. Leaked timers cause disconnects after rapid background/foreground toggling.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Keyboard avoidance | Custom `Animated.View` tracking keyboard events | `react-native-keyboard-controller` `KeyboardStickyView` | Must match iOS system animation curve exactly. Custom solutions always lag or jump. |
| Streaming markdown repair | Custom regex to close unclosed `**`, `` ` ``, etc. mid-stream | `remend` (used by streamdown) | Token boundary can split any markdown syntax. Remend handles all CommonMark edge cases. |
| Markdown -> native Text | Custom regex parser | `react-native-enriched-markdown` or `react-native-streamdown` | Native text rendering with proper line height, nesting, lists, links, tables. Hand-rolled parsers break on edge cases. |
| List virtualization | Custom windowing for messages | `@shopify/flash-list` | Recycling, auto-sizing, variable height items. FlashList v2 handles all of this. |
| Spring physics constants | Inline `withSpring({ damping: ... })` everywhere | Centralized `springs.ts` constants | Soul doc has 6 named spring configs. Centralize for consistency and easy tuning. |
| WebSocket reconnection | Custom reconnect timer logic | `WebSocketClient.tryReconnect()` from shared | Already implemented with exponential backoff, max delay, state machine. Just call it. |
| Auth token storage | AsyncStorage for JWT | `expo-secure-store` (iOS Keychain) | Keychain is encrypted at rest. AsyncStorage is not. Security requirement for auth tokens. |
| Gesture-driven drawer | Custom `PanGestureHandler` + `Animated.View` | Expo Router `Drawer` from `@react-navigation/drawer` | Drawer navigator handles edge swipe detection, gesture competing with back gesture, spring physics, overlay dimming. |

**Key insight:** The shared code layer already solves the hardest problems (WebSocket state machine, stream multiplexing, store factories, auth abstraction). Phase 69's job is wiring, UI components, and the streaming markdown evaluation -- not re-implementing infrastructure.

## Common Pitfalls

### Pitfall 1: Streamdown Bundle Mode Misconfiguration
**What goes wrong:** react-native-streamdown silently fails to process markdown on the worklet thread if Bundle Mode isn't correctly configured in Babel + Metro.
**Why it happens:** Streamdown requires `bundleMode: true` in the Worklets Babel plugin AND Metro config changes. Missing either causes fallback to JS thread (defeating the purpose) or runtime errors.
**How to avoid:** Follow the exact setup from react-native-worklets docs: (1) `babel.config.js` must include `['react-native-worklets/plugin', { bundleMode: true, workletizableModules: ['remend'] }]`, (2) `metro.config.js` must apply the Bundle Mode config transformer.
**Warning signs:** Markdown renders but with visible jank during streaming, or `StreamdownText` component throws "worklet not found" error.

### Pitfall 2: Peer Dependency Version Mismatch
**What goes wrong:** react-native-streamdown v0.1.1 requires exact versions: `react-native-enriched-markdown@0.4.0`, `react-native-worklets@0.8.0-bundle-mode-preview-2`, `remend@1.2.2`. Installing latest versions of these breaks.
**Why it happens:** Streamdown is very new (v0.1.1) and pins to specific preview versions of its dependencies.
**How to avoid:** Install exact versions: `npm install react-native-worklets@0.8.0-bundle-mode-preview-2 remend@1.2.2 react-native-enriched-markdown@0.4.0` for the streamdown path. If using enriched-markdown standalone (custom renderer), use latest (0.4.1).
**Warning signs:** npm peer dependency warnings during install. Runtime: "module not found" or typing errors.

### Pitfall 3: NativeWind CSS Variables Not Animatable
**What goes wrong:** Developer tries to animate background color by changing a CSS custom property value at runtime. Nothing animates -- color snaps instantly.
**Why it happens:** NativeWind CSS variables are resolved at style compilation time, not at runtime on the native thread. They cannot be interpolated by Reanimated.
**How to avoid:** Use Reanimated `useAnimatedStyle` + `interpolateColor` for any animated color. NativeWind classes are for static colors only. Dynamic color (Soul doc requirement) MUST use shared values.
**Warning signs:** Colors change but without the 500ms timing transition specified in Soul doc.

### Pitfall 4: AppState "inactive" Mishandling
**What goes wrong:** App disconnects WebSocket immediately when user opens Control Center or Notification Center (iOS `inactive` state).
**Why it happens:** On iOS, `inactive` fires for Control Center, incoming calls, and app switcher -- NOT just backgrounding. Treating `inactive` as `background` causes spurious disconnects.
**How to avoid:** Only start the 30s disconnect timer on `background` state, NOT `inactive`. The D-30 context decision explicitly says "inactive -> no action."
**Warning signs:** WebSocket disconnects when user pulls down Notification Center, then reconnects when they dismiss it.

### Pitfall 5: FlashList with Streaming Content Height Changes
**What goes wrong:** Message list jumps or flickers during streaming as the last message grows in height.
**Why it happens:** FlashList recalculates layouts when item heights change. Frequent height changes during streaming can cause visible jumps.
**How to avoid:** (1) Use `maintainVisibleContentPosition` prop if available in FlashList v2. (2) Keep scroll anchored to bottom during streaming (detect via scroll position). (3) Only update the last item's content via a separate shared value or ref, not by re-rendering the entire list item.
**Warning signs:** Visible scroll jumps during streaming, especially when content wraps to a new line.

### Pitfall 6: Double WebSocket Init from React Strict Mode
**What goes wrong:** Two WebSocket connections open simultaneously, causing duplicate messages and state corruption.
**Why it happens:** React 19 strict mode double-invokes effects. If `initializeWebSocket()` is called inside a useEffect without a guard, it runs twice.
**How to avoid:** The `isInitialized` guard in `websocket-init.ts` prevents this (same pattern as web). Call `initializeWebSocket()` from a module-level init or a guarded useEffect. The web app's pattern works directly.
**Warning signs:** Duplicate messages in timeline, connection store rapidly toggling between states.

### Pitfall 7: Glass Backdrop Performance on Older Devices
**What goes wrong:** Composer with `BlurView` drops below 60fps on the chat screen, especially during scroll.
**Why it happens:** `expo-blur` renders a real-time blur of content behind it. On chat screens with rapid scrolling, this is computationally expensive.
**How to avoid:** D-17 explicitly allows fallback: "Try glass first, measure FPS, fall back to opaque surface-raised." Test on iPhone 16 Pro Max first (target device), but also consider older hardware. Keep the blur area small (just the composer, not full screen).
**Warning signs:** FPS drops below 50 when scrolling chat with glass composer visible.

## Code Examples

### WebSocket Message Send Flow
```typescript
// Sending a message through the existing shared WebSocket client
import { getWsClient } from '../lib/websocket-init';
import type { ClientMessage } from '@loom/shared/types/websocket';

function sendMessage(text: string, projectPath: string, sessionId?: string) {
  const client = getWsClient();
  if (!client) return false;

  const msg: ClientMessage = {
    type: 'claude-command',
    command: text,
    options: {
      projectPath,
      sessionId,
      model: 'sonnet', // default
    },
  };

  return client.send(msg);
}
```

### Session List Fetch via API Client
```typescript
// Fetching sessions grouped by project
import { createApiClient } from '@loom/shared/lib/api-client';
import { nativeAuthProvider } from '../lib/auth-provider';
import { resolveApiUrl } from '../lib/platform';
import type { ProjectGroup } from '@loom/shared/types/session';

const apiClient = createApiClient({
  auth: nativeAuthProvider,
  resolveUrl: resolveApiUrl,
});

async function fetchProjects(): Promise<ProjectGroup[]> {
  const projects = await apiClient.apiFetch<any[]>('/api/projects');
  // Transform into ProjectGroup[] with date grouping
  // (reuse logic from web or build new)
  return transformToProjectGroups(projects);
}

async function fetchSessionMessages(projectName: string, sessionId: string) {
  return apiClient.apiFetch<{ messages: any[] }>(
    `/api/projects/${projectName}/sessions/${sessionId}/messages`
  );
}
```

### Staggered Session List Animation
```typescript
// Soul doc: 30ms delay per item, max 10 animated
import Animated, { useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';
import { SPRING } from '../lib/springs';

function AnimatedSessionItem({ index, children }: { index: number; children: React.ReactNode }) {
  const delay = Math.min(index, 10) * 30; // Cap at 10 items * 30ms = 300ms max

  const animStyle = useAnimatedStyle(() => ({
    opacity: withDelay(delay, withSpring(1, SPRING.standard)),
    transform: [{ translateY: withDelay(delay, withSpring(0, SPRING.standard)) }],
  }));

  return (
    <Animated.View style={animStyle} entering={{ initialValues: { opacity: 0, transform: [{ translateY: 20 }] } }}>
      {children}
    </Animated.View>
  );
}
```

### Connection Banner with Soul Doc Compliance
```typescript
// Glass surface, Navigation spring slide-down, destructive tint, auto-dismiss
import Animated, { useAnimatedStyle, withSpring, FadeOut } from 'react-native-reanimated';
import { GlassSurface } from '../primitives/GlassSurface';
import { SPRING } from '../../lib/springs';

function ConnectionBanner({ message, isError }: { message: string; isError: boolean }) {
  return (
    <Animated.View
      entering={SlideInUp.springify()
        .damping(SPRING.navigation.damping)
        .stiffness(SPRING.navigation.stiffness)}
      exiting={SlideOutUp.springify()
        .damping(SPRING.standard.damping)
        .stiffness(SPRING.standard.stiffness)}
    >
      <GlassSurface className="mx-4 mt-2 px-4 py-3">
        <Text className={`text-base ${isError ? 'text-destructive' : 'text-text-primary'}`}>
          {message}
        </Text>
      </GlassSurface>
    </Animated.View>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-native-markdown-display | react-native-enriched-markdown | 2025 | Native text rendering, GFM support, accessibility, no WebView. Software Mansion actively maintained. |
| Custom keyboard offset tracking | react-native-keyboard-controller | 2024-2025 | Perfect iOS system curve sync. KeyboardStickyView/KeyboardChatScrollView components. |
| FlatList for large lists | @shopify/flash-list v2 | 2025 | Auto-sizing (no estimatedItemSize), New Architecture native, recycling. |
| KeyboardAvoidingView | KeyboardStickyView | 2024 | Sticky moves with keyboard (doesn't resize). Perfect for chat composers. |
| Per-token markdown reparse | react-native-streamdown (worklet thread) | 2026 | Markdown processing off JS thread entirely. Zero-jank streaming. Very new (v0.1.1). |
| Regex markdown parsing | md4c native parser (via enriched-markdown) | 2025 | C-based parser called from native, not JS. Orders of magnitude faster than JS regex. |

**Deprecated/outdated:**
- `react-native-markdown-renderer` -- unmaintained since 2020, CommonMark only
- `simple-markdown` -- Instagram's parser, no longer maintained, no streaming support
- `KeyboardAvoidingView` for chat apps -- replaced by keyboard-controller for any app needing iOS system curve sync

## Open Questions

1. **react-native-streamdown stability with Expo SDK 54**
   - What we know: Streamdown requires New Architecture (enabled), RN 0.81 (matched), worklets Bundle Mode. Software Mansion builds both streamdown and reanimated, so integration should be solid.
   - What's unclear: Whether the exact peer dep versions (`worklets@0.8.0-bundle-mode-preview-2`, `enriched-markdown@0.4.0`) conflict with any Expo SDK 54 packages. EAS Build may need custom native module linking.
   - Recommendation: This is exactly why D-01 mandates a PoC as Plan 1. If streamdown fails to build or crashes on device, the custom renderer path using enriched-markdown@0.4.1 standalone is the immediate fallback.

2. **FlashList v2 with streaming content**
   - What we know: FlashList v2 auto-sizes items and requires New Architecture. It handles variable heights.
   - What's unclear: How it handles rapid height changes on the last item during streaming. The `useLayoutState` hook exists for communicating state changes but documentation is sparse.
   - Recommendation: Profile with 50+ messages. If scroll jumping occurs during streaming, fallback to FlatList with `maintainVisibleContentPosition` is acceptable for Phase 69 (performance optimization is Phase 70).

3. **Glass blur FPS impact on chat with KeyboardStickyView**
   - What we know: expo-blur uses native iOS blur (performant for static content). Moving a BlurView with the keyboard while scrolling chat could compound performance costs.
   - What's unclear: Actual FPS numbers on iPhone 16 Pro Max with glass composer + scrolling + streaming.
   - Recommendation: D-17 gives explicit permission to fallback. Test glass first on device, measure with Instruments. If <55fps during typing + scrolling, switch to opaque `surface-raised`.

4. **Project selection bottom sheet**
   - What we know: User taps "New Chat" -> needs to select a project before sending a message.
   - What's unclear: Best Expo-compatible bottom sheet library. Options: `@gorhom/bottom-sheet` (popular, may need additional dep), native `Modal` (simpler), inline dropdown.
   - Recommendation: Claude's discretion per CONTEXT.md. Use a simple `Modal` with `presentationStyle="pageSheet"` for the project picker -- it's native iOS sheet behavior without additional dependencies. Can upgrade to @gorhom/bottom-sheet in Phase 70 if needed.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Expo CLI | Build system | Yes | ~54.0.33 (project) | -- |
| Node.js | Metro bundler | Yes | 20.x+ | -- |
| EAS Build | Device builds | Yes (cloud) | -- | Local Xcode (Mac ~30% available) |
| Backend (port 5555) | All API/WS calls | Yes | -- | Start with `npm start` in server/ |
| Tailscale | Device connectivity | Yes | -- | Manual IP entry in Settings |
| iPhone 16 Pro Max | Device testing | Yes | iOS 18.x | Simulator (loses performance fidelity) |
| react-native-worklets (Bundle Mode) | Streamdown PoC | Needs install | 0.8.0-preview | Custom renderer (enriched-markdown only) |

**Missing dependencies with no fallback:**
- None. All dependencies are installable.

**Missing dependencies with fallback:**
- react-native-worklets Bundle Mode: If EAS Build fails with worklets, fall back to custom renderer using enriched-markdown standalone (no worklet thread, but still functional).

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (web) -- shared/ tests run via Vitest. Mobile-specific tests TBD (jest via expo). |
| Config file | shared/vitest.config.ts (for shared code), mobile has no test config yet |
| Quick run command | `cd /home/swd/loom && npx vitest run --project shared --reporter=verbose 2>&1 | tail -20` |
| Full suite command | `cd /home/swd/loom && npx vitest run 2>&1 | tail -30` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CHAT-01 | Session list grouped by project | integration (API + store) | `npx vitest run shared/__tests__/timeline.test.ts -x` | Yes (shared store tests) |
| CHAT-02 | Create session + select project | integration (WS message) | Manual: send claude-command via WS, verify session-created | Manual-only (requires backend) |
| CHAT-03 | Switch sessions via drawer | e2e (navigation) | Manual: device test | Manual-only |
| CHAT-04 | Send message + streaming markdown | integration (WS + renderer) | Manual: device test with real Claude streaming | Manual-only |
| CHAT-09 | JWT auth via Keychain | unit (auth provider) | Wave 0: `jest mobile/__tests__/auth-provider.test.ts` | Wave 0 gap |
| CHAT-10 | Connection banner on disconnect | unit (connection store) | `npx vitest run shared/__tests__/connection.test.ts -x` | Yes (shared store tests) |
| CHAT-11 | Auto-reconnect on foreground | integration (AppState + WS) | Manual: background app, kill WS, foreground, verify reconnect | Manual-only |

### Sampling Rate
- **Per task commit:** `npx vitest run --project shared --reporter=verbose 2>&1 | tail -20` + `cd mobile && npx tsc --noEmit`
- **Per wave merge:** Full vitest suite + vite build (web regression gate)
- **Phase gate:** Full suite green + device test of all 7 requirements

### Wave 0 Gaps
- [ ] `mobile/__tests__/auth-provider.test.ts` -- covers CHAT-09 (mock SecureStore)
- [ ] `mobile/__tests__/websocket-init.test.ts` -- covers CHAT-11 (mock AppState + WS)
- [ ] TypeScript strict compilation check: `cd mobile && npx tsc --noEmit`
- [ ] Web regression: `cd /home/swd/loom && npx vitest run && npx vite build`

## Project Constraints (from CLAUDE.md)

- **Push back on bad ideas.** State flaws directly with evidence.
- **No performative agreement.** Take positions.
- **Confidence gate:** >=90% proceed, 70-89% pause, <70% research first.
- **No placeholders.** All generated code must be complete and functional.
- **Verify before done.** Run test/build/lint and show output.
- **Plan before multi-file changes.** 3+ files -> numbered plan, wait for approval.
- **Forgejo integration:** Track bugs, findings, decisions as issues in `swd/loom`.
- **Commit-issue linking:** Fix references with `Fixes #N`.
- **Adversarial review:** `workflow.adversarial_review: true`. Fix ALL findings.
- **V2 Constitution:** Named exports only, no default exports (exception: Expo Router page components MAY use default exports). Props interfaces named `{ComponentName}Props`. Memoize message list components.
- **Soul doc compliance:** NATIVE-APP-SOUL.md is the authoritative visual contract. Every component must comply. Anti-patterns are defects.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `shared/lib/websocket-client.ts`, `shared/lib/stream-multiplexer.ts`, `shared/lib/api-client.ts`, `shared/stores/*`, `mobile/*` -- audited directly
- `NATIVE-APP-SOUL.md` -- authoritative visual contract, all spring configs and surface tiers
- `BACKEND_API_CONTRACT.md` -- WebSocket protocol, REST endpoints for sessions/projects
- `69-CONTEXT.md` -- all 30 locked decisions

### Secondary (MEDIUM confidence)
- [react-native-streamdown GitHub](https://github.com/software-mansion-labs/react-native-streamdown) -- Software Mansion, verified v0.1.1 on npm
- [react-native-enriched-markdown GitHub](https://github.com/software-mansion-labs/react-native-enriched-markdown) -- GFM support, Fabric-only, verified v0.4.1
- [react-native-keyboard-controller docs](https://kirillzyusko.github.io/react-native-keyboard-controller/docs/api/components/keyboard-sticky-view) -- KeyboardStickyView for chat composer
- [Expo Router Drawer docs](https://docs.expo.dev/router/advanced/drawer/) -- custom drawerContent pattern
- [@shopify/flash-list v2 docs](https://shopify.github.io/flash-list/docs/v2-changes/) -- auto-sizing, New Architecture requirement
- [Reanimated interpolateColor docs](https://docs.swmansion.com/react-native-reanimated/docs/utilities/interpolateColor/) -- color interpolation for dynamic color
- [NativeWind v4 themes](https://www.nativewind.dev/docs/guides/themes) -- CSS variables support (static only, not animatable)
- [React Native AppState docs](https://reactnative.dev/docs/appstate) -- lifecycle states and event handling
- npm registry -- verified all package versions and peer dependencies via `npm view`

### Tertiary (LOW confidence)
- expo-blur performance characteristics: no hard benchmarks found for chat + keyboard + blur scenario. Device testing required.
- FlashList v2 behavior during rapid height changes on streaming items: `useLayoutState` hook exists but documentation is sparse. Profile on device.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries verified on npm, peer deps checked, compatibility with Expo SDK 54 + RN 0.81 confirmed
- Architecture: HIGH -- existing codebase patterns (websocket-init.ts, factory stores, auth provider) provide direct templates
- Pitfalls: HIGH -- informed by Capacitor v2.2 failures, web app streaming experience, and library documentation
- Streaming markdown: MEDIUM -- react-native-streamdown is v0.1.1 with preview dependencies. The PoC-first approach (D-01) correctly de-risks this.
- Dynamic color: HIGH -- Reanimated interpolateColor is well-documented and battle-tested

**Research date:** 2026-03-31
**Valid until:** 2026-04-14 (2 weeks -- react-native-streamdown is fast-moving, check for new releases)
