# Phase 74: Shell & Connection - Research

**Researched:** 2026-04-03
**Domain:** React Native (Expo SDK 54) -- auth, WebSocket lifecycle, drawer navigation, theme system, iOS safe areas
**Confidence:** HIGH

## Summary

Phase 74 is a clean-slate rebuild of the mobile app shell. The existing shared business logic (`shared/`, `mobile/hooks/`, `mobile/lib/`, `mobile/stores/`) is NativeWind-free and transfers as-is. The cleanup scope is well-defined: delete 26 component files, 9+ route screen files, NativeWind deps and config, then build fresh with `StyleSheet.create` + typed Theme object.

The drawer parallax effect (D-09) requires `useDrawerProgress` from `@react-navigation/drawer` -- this hook returns a Reanimated `SharedValue` (0=closed, 1=open) that can drive `translateX` interpolation on the main content. The `drawerType: 'slide'` already shifts both drawer and content, but the parallax (content shifts 20px right) needs a custom wrapper component using `useAnimatedStyle`.

Testing infrastructure does not exist yet. Jest + jest-expo preset is the standard for Expo projects. The phase must scaffold the test framework (Wave 0 gap) before writing auth/WebSocket/drawer tests.

**Primary recommendation:** Structure as 5 plans: (1) NativeWind removal + theme system, (2) auth screen + auth flow, (3) drawer navigation + session list stub, (4) WebSocket lifecycle + connection banner, (5) chat placeholder + safe areas + tests.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Drop NativeWind entirely. Use `StyleSheet.create` + typed Theme object following Private Mind's `createStyles(theme)` pattern. All Soul doc values (colors, spacing, typography, springs) centralized in a single `theme.ts` file. No `className` prop anywhere in mobile/.
- **D-02:** Remove `nativewind` and `react-native-css-interop` from mobile/package.json. Delete `tailwind.config.ts`, `global.css`, `postcss.config.js` from mobile/. Remove NativeWind preset from `babel.config.js`.
- **D-03:** Theme values pulled directly from NATIVE-APP-SOUL.md: warm charcoal base `rgb(38,35,33)`, accent `rgb(196,108,88)`, Inter typography, all 6 spring configs (Micro/Standard/Navigation/Drawer/Expand/Dramatic), 4 surface tiers. Dark mode only -- no light mode.
- **D-04:** Full cleanup. Delete ALL Phase 69 components (`mobile/components/**` -- 26 files) and route screens (`mobile/app/**` -- 9 files). Start fresh with empty directories. Keep: `mobile/hooks/` (7 hooks), `mobile/lib/` (6 files), Expo config files (`app.json`, `eas.json`, `metro.config.js`, `tsconfig.json`).
- **D-05:** Token input screen on first launch. Full-screen with Loom branding, server URL field (pre-filled with Tailscale IP `100.86.4.57:5555`), JWT token field, Connect button. Shows on first launch or when stored token is invalid. After successful connect, never shown again unless user clears token. Developer-tool UX -- no username/password form.
- **D-06:** Auto-connect on subsequent launches. App tries stored token from iOS Keychain (expo-secure-store). If valid: straight to chat shell. If invalid/missing: show token input screen. Carries forward Phase 69 D-07/D-09.
- **D-07:** Use `@react-navigation/drawer` (already a dependency) with `drawerType: 'slide'`, custom `drawerContent` component, `swipeEdgeWidth: width` (full-width swipe area), `overlayColor: 'rgba(0,0,0,0.4)'`. Matches Private Mind's exact pattern from PATTERNS-PLAYBOOK.
- **D-08:** Stub session list in drawer: Loom branding at top, "New Chat" button, flat list of sessions (title + relative date, no grouping/search/pin/context menus). Connection status dot in drawer footer. Enough for navigation. Full session management is Phase 76 scope.
- **D-09:** Parallax effect: main content shifts 20px right during drawer open, per Soul doc. Drawer spring: damping 20, stiffness 100, ~350ms settle.
- **D-10:** Empty state + composer shell. Shows empty chat state (Claude icon + "How can I help?" in Body text) and a visual-only composer bar (text input + disabled send button). Proves layout, safe areas, and keyboard avoidance work. No actual message sending -- that's Phase 75. Hamburger icon in header opens drawer.
- **D-11:** Background: disconnect WebSocket after 30s grace period. Foreground: detect disconnected state, trigger reconnect with exponential backoff (shared WebSocket client already has this logic). AppState listener in root layout.
- **D-12:** Connection banner: fixed overlay at top of chat content (does NOT push layout down). Glass surface, slides down with Navigation spring (damping 22, stiffness 130) on disconnect, slides up on reconnect. Auto-dismisses on successful reconnect. Content stays in place underneath.
- **D-13:** Cold-start guard: `hasConnectedOnce` useRef pattern. No banner flash before first connection attempt. Banner only appears after first connection failure or a subsequent disconnect.
- **D-14:** Active stream interrupted by backgrounding: persist partial message to MMKV. On foreground return, show partial message with "interrupted" indicator. User can retry.
- **D-15:** Jest (Expo default) + unit tests on logic. Test auth flow (login, token persist, token clear, invalid token), WebSocket lifecycle (connect, reconnect, foreground resume, 30s background grace, cold-start guard), and drawer navigation state. No component rendering/snapshot tests -- focus on hooks and state logic.

### Claude's Discretion
- Theme object structure (exact TypeScript type, how to organize colors/spacing/typography sub-objects)
- Drawer header design (Loom branding layout, icon choice)
- Connection banner text content ("Reconnecting..." vs "Connection lost" etc.)
- Auth screen visual polish (button styling, input field design, error states)
- How to handle the NativeWind removal in babel/metro config

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CONN-01 | User authenticates via login screen | useAuth hook exists with login/logout/checkAuth. Auth screen is new UI (D-05). Backend validates at `GET /api/auth/user`. |
| CONN-02 | Auth token persists in iOS Keychain (SecureStore) | nativeAuthProvider in `mobile/lib/auth-provider.ts` already implements this via expo-secure-store. Tested pattern from Phase 69. |
| CONN-03 | WebSocket connects on app launch | `initializeWebSocket()` in `mobile/lib/websocket-init.ts` handles this. Reads token from Keychain, calls `wsClient.connect(token)`. |
| CONN-04 | WebSocket reconnects on disconnect with exponential backoff | Shared `WebSocketClient` has built-in reconnection state machine. Connection store tracks attempts. |
| CONN-05 | Connection banner shows when disconnected | New component needed (D-12). useConnection hook provides `isConnected`/`isReconnecting` state. Cold-start guard via `hasConnectedOnce` ref (D-13). |
| CONN-07 | App resumes WebSocket on foreground with correct auth | AppState listener in websocket-init.ts already handles: foreground clears background timer, gets fresh token, calls `wsClient.connect(token)`. |
| NAV-01 | User sees slide drawer with session list on swipe-right or hamburger tap | `@react-navigation/drawer` v7.9.8 installed, `drawerType: 'slide'` config. Custom drawerContent for session list. |
| NAV-02 | User navigates between drawer and chat screen with animated transition | Expo Router drawer+stack layout. Drawer spring (20/100, ~350ms). useDrawerProgress for parallax. |
| NAV-03 | App shell respects iOS safe areas (notch, Dynamic Island, home indicator) | `react-native-safe-area-context` v5.6.2 installed. SafeAreaView/useSafeAreaInsets for all screens. |
| NAV-04 | Main content shifts with parallax effect when drawer opens | useDrawerProgress hook returns SharedValue 0-1. Interpolate to translateX 0-20px. Custom AnimatedScreen wrapper. |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo | 54.0.33 | App framework | Current SDK, matches project |
| expo-router | 6.0.23 | File-based routing + drawer/stack integration | Expo's official router |
| @react-navigation/drawer | 7.9.8 | Drawer navigator | Installed, provides useDrawerProgress |
| react-native-reanimated | 4.1.7 | Spring animations, interpolation | Soul doc springs, parallax effect |
| react-native-gesture-handler | 2.28.0 | Gesture recognition for drawer | Drawer swipe, touch feedback |
| react-native-safe-area-context | 5.6.2 | Safe area insets | NAV-03 compliance |
| expo-secure-store | 15.0.8 | iOS Keychain token storage | CONN-02 auth persistence |
| react-native-keyboard-controller | 1.18.5 | Keyboard avoidance | Composer keyboard sync (D-10) |
| react-native-mmkv | 3.3.3 | Fast KV storage | Stream snapshots, pinned sessions |
| expo-haptics | 15.0.8 | Tactile feedback | Soul doc haptic pairing |
| expo-blur | 15.0.8 | Glass surface effects | Connection banner glass (D-12) |
| expo-symbols | 1.0.8 | SF Symbols icons | Navigation icons (hamburger, back) |
| lucide-react-native | 1.7.0 | Fallback icon library | Loom-specific icons |

### To Install (Testing -- Wave 0)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| jest-expo | 55.0.13 | Jest preset for Expo | D-15 test infrastructure |
| jest | (bundled) | Test runner | Installed via jest-expo |
| @types/jest | latest | TypeScript definitions | Type-safe test files |

### To Remove (NativeWind Cleanup -- D-02)
| Library | Action | Notes |
|---------|--------|-------|
| nativewind | Remove from dependencies | `npm uninstall nativewind` |
| react-native-css-interop | Remove from dependencies | `npm uninstall react-native-css-interop` |
| tailwindcss | Remove from devDependencies | `npm uninstall tailwindcss` |

### Files to Delete (D-02)
| File | Reason |
|------|--------|
| `mobile/tailwind.config.js` | NativeWind config |
| `mobile/global.css` | Tailwind directives |
| `mobile/app/_layout.tsx` line `import '../global.css'` | CSS import |
| `babel.config.js` NativeWind preset line | `"nativewind/babel"` and `jsxImportSource: "nativewind"` |
| `metro.config.js` `withNativeWind` wrapper | Replace with plain config export |
| `package.json` postinstall script | Tailwind v3 nesting hack |

**Installation (testing only):**
```bash
cd mobile && npx expo install jest-expo jest @types/jest --dev
```

## Architecture Patterns

### Recommended Project Structure (Post-Cleanup)
```
mobile/
  app/
    _layout.tsx          # Root: GestureHandler > KeyboardProvider > auth gate > Slot
    (drawer)/
      _layout.tsx        # Drawer navigator (ONLY Drawer in app)
      index.tsx          # Empty state / redirect to active chat
      (stack)/
        _layout.tsx      # Stack navigator inside drawer
        chat/[id].tsx    # Chat screen (placeholder in Phase 74)
  components/
    auth/
      AuthScreen.tsx     # Token input screen (D-05)
    navigation/
      DrawerContent.tsx  # Custom drawer content (session list stub)
      AnimatedScreen.tsx # Parallax wrapper using useDrawerProgress
      ChatHeader.tsx     # Header with hamburger + title
    connection/
      ConnectionBanner.tsx  # Glass overlay banner (D-12)
    chat/
      EmptyChat.tsx      # Empty state placeholder
      ComposerShell.tsx  # Visual-only composer (D-10)
  hooks/                 # KEEP all 7 existing hooks
  lib/                   # KEEP all 6 existing lib files
  stores/                # KEEP existing store index
  theme/
    theme.ts             # Single source of truth: colors, spacing, typography, springs
    types.ts             # Theme TypeScript interface
    ThemeProvider.tsx     # React context for theme access
    createStyles.ts      # Helper: (theme) => StyleSheet.create({...})
  __tests__/
    hooks/
      useAuth.test.ts
      useConnection.test.ts
      useAppState.test.ts
    lib/
      websocket-init.test.ts
```

### Pattern 1: Theme System (createStyles pattern from Private Mind)

**What:** Typed Theme object + `createStyles(theme)` pattern replaces NativeWind
**When to use:** Every component that needs styling
**Example:**
```typescript
// theme/types.ts
interface LoomTheme {
  colors: {
    surface: { sunken: string; base: string; raised: string; overlay: string };
    accent: string;
    destructive: string;
    success: string;
    text: { primary: string; secondary: string; muted: string };
    border: { subtle: string; interactive: string };
    background: { idle: string; streaming: string; error: string };
  };
  typography: {
    largeTitle: TextStyle;
    heading: TextStyle;
    body: TextStyle;
    caption: TextStyle;
    code: TextStyle;
    subheading: TextStyle;
  };
  spacing: Record<string, number>;
  springs: typeof SPRING;
  shadows: { subtle: ViewStyle; medium: ViewStyle; heavy: ViewStyle; glow: (color: string) => ViewStyle };
  radii: { sm: number; md: number; lg: number; xl: number; full: number };
}

// theme/theme.ts
export const theme: LoomTheme = {
  colors: {
    surface: {
      sunken: 'rgb(28, 26, 24)',
      base: 'rgb(44, 40, 38)',
      raised: 'rgb(64, 60, 57)',
      overlay: 'rgb(82, 78, 74)',
    },
    accent: 'rgb(196, 108, 88)',
    // ... all Soul doc values
  },
  // ...
};

// theme/createStyles.ts
export function createStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (theme: LoomTheme) => T
): T {
  return StyleSheet.create(factory(theme));
}

// Usage in components:
function ChatHeader() {
  const styles = useMemo(() => createStyles((t) => ({
    container: { backgroundColor: t.colors.surface.base, height: 56 },
    title: { ...t.typography.heading, color: t.colors.text.primary },
  })), []);
  // ...
}
```

### Pattern 2: Drawer Parallax via useDrawerProgress

**What:** Animated wrapper that shifts main content 20px right when drawer opens
**When to use:** Wraps every screen rendered inside the drawer
**Example:**
```typescript
// Source: React Navigation docs + Soul doc D-09
import { useDrawerProgress } from '@react-navigation/drawer';
import Animated, { useAnimatedStyle, interpolate } from 'react-native-reanimated';

function AnimatedScreen({ children }: { children: React.ReactNode }) {
  const progress = useDrawerProgress();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [0, 20]) },
    ],
  }));

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      {children}
    </Animated.View>
  );
}
```

**Critical detail:** `drawerType: 'slide'` already shifts content. The parallax wrapper adds an ADDITIONAL 20px shift on top. If the built-in slide already moves content, the parallax amount may need adjustment. Test on device.

### Pattern 3: Auth Gate (3-way render)

**What:** Root layout renders splash, auth screen, or app shell based on auth state
**When to use:** Root `_layout.tsx` only
**Example:**
```typescript
// Existing pattern from Phase 69 _layout.tsx -- carries forward
// isLoading -> splash (prevents blank flash during Keychain read)
// !isAuthenticated -> AuthScreen
// authenticated -> Slot (drawer routes)
```

### Pattern 4: Connection Banner with Cold-Start Guard

**What:** Glass overlay that slides down on disconnect, with useRef guard preventing flash on first load
**When to use:** Rendered in root layout, above Slot
**Example:**
```typescript
const hasConnectedOnce = useRef(false);
const { isConnected, isReconnecting } = useConnection();

// Track first successful connection
useEffect(() => {
  if (isConnected) hasConnectedOnce.current = true;
}, [isConnected]);

// Only show banner after first connection has been established
const showBanner = hasConnectedOnce.current && !isConnected;
```

### Anti-Patterns to Avoid
- **className prop anywhere in mobile/:** NativeWind is removed. All styling via StyleSheet.create + theme.
- **Nested Drawer navigators:** Only ONE Drawer in the entire app, in `(drawer)/_layout.tsx`. Root uses `<Slot />`.
- **KeyboardAvoidingView (React Native built-in):** Use `react-native-keyboard-controller` KeyboardAvoidingView instead. The built-in one has timing bugs.
- **tryReconnect() after background:** `disconnect()` nulls the internal token. MUST use `wsClient.connect(token)` with fresh token from Keychain.
- **SecureStore.setItem('', ...):** Empty string is truthy. Use `deleteItemAsync()` to clear token.
- **Linear/ease animations:** All motion uses spring physics per Soul doc. Only exception: color transitions use `withTiming` at 500ms.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Keyboard avoidance | Custom keyboard listener + offset | `react-native-keyboard-controller` KeyboardAvoidingView | Timing sync with iOS keyboard is deceptively hard; built-in RN version has known bugs |
| Drawer navigation | Custom gesture-driven panel | `@react-navigation/drawer` with Expo Router | Gesture tracking, velocity thresholds, spring physics all handled |
| Safe area insets | Manual padding for notch/indicator | `react-native-safe-area-context` useSafeAreaInsets | Values change per device, Dynamic Island vs notch |
| Glass/blur surface | Semi-transparent View with opacity | `expo-blur` BlurView with `intensity={40}` tint="dark" | Native blur requires platform APIs |
| Haptic feedback | Vibration API | `expo-haptics` Impact/Notification types | Correct haptic engine types (Light, Medium, Heavy, Success, Warning, Error) |
| Auth token storage | AsyncStorage | `expo-secure-store` (iOS Keychain) | Security: Keychain is encrypted at rest, AsyncStorage is plaintext |

**Key insight:** Every item on this list was either already solved in Phase 69 or is a platform API wrapper. The phase is about composition and quality, not invention.

## Common Pitfalls

### Pitfall 1: NativeWind Removal Leaves Stale Config
**What goes wrong:** Metro bundler crashes or warns about missing NativeWind after removal.
**Why it happens:** `metro.config.js` wraps config with `withNativeWind()`, `babel.config.js` includes NativeWind presets, `postinstall` script nests tailwindcss.
**How to avoid:** Clean all five touchpoints: (1) metro.config.js -- remove `withNativeWind` wrapper, export plain config, (2) babel.config.js -- remove `"nativewind/babel"` preset and `jsxImportSource: "nativewind"`, keep `babel-preset-expo` and `react-native-reanimated/plugin`, (3) package.json -- uninstall nativewind, react-native-css-interop, tailwindcss, remove postinstall script, (4) delete global.css, (5) delete tailwind.config.js. Run `npx expo start --clear` after to clear caches.
**Warning signs:** "Cannot find module 'nativewind'" errors, Metro transform failures.

### Pitfall 2: Drawer Parallax Double-Shift
**What goes wrong:** `drawerType: 'slide'` already moves the scene. Adding a parallax translateX via `useDrawerProgress` causes content to shift too far.
**Why it happens:** The 'slide' type built into react-native-drawer-layout already applies a horizontal transform to the scene container.
**How to avoid:** Test with `drawerType: 'slide'` first. If the built-in slide already provides a shift effect, the parallax wrapper's interpolation range should be calibrated to add only the additional 20px on top. Alternatively, use `drawerType: 'front'` (overlay) and handle ALL content shifting via useDrawerProgress -- this gives full control.
**Warning signs:** Content shifts 40+ px instead of 20px, or content appears to "jump" on release.

### Pitfall 3: Connection Banner Flash on Cold Start
**What goes wrong:** Banner briefly appears before the first WebSocket connection attempt resolves.
**Why it happens:** Initial state is `disconnected`. Banner renders immediately before `wsClient.connect()` transitions to `connected`.
**How to avoid:** `hasConnectedOnce` useRef pattern (D-13). Banner only renders when `hasConnectedOnce.current === true && !isConnected`. First connection sets the ref.
**Warning signs:** Brief "Connection lost" flash on every app launch.

### Pitfall 4: WebSocket Auth After Background
**What goes wrong:** App resumes from background, WebSocket silently fails to reconnect.
**Why it happens:** `disconnect()` nulls the internal token. Calling `tryReconnect()` checks the (null) internal token and silently no-ops.
**How to avoid:** ALWAYS use `wsClient.connect(token)` with a fresh token from `nativeAuthProvider.getToken()` on foreground return. This is already correctly implemented in `websocket-init.ts`.
**Warning signs:** App shows "connected" state but no messages flow; no error in logs.

### Pitfall 5: Jest Cannot Transform Reanimated Worklets
**What goes wrong:** Tests crash with "Reanimated: Cannot evaluate worklet" or Babel errors.
**Why it happens:** Jest runs in Node, not the Reanimated runtime. Worklets need mocking.
**How to avoid:** Add `require('react-native-reanimated').setUpTests()` in jest.setup.js. Add `react-native-reanimated` to `transformIgnorePatterns` exception. If hooks/lib files don't use Reanimated directly (they don't currently), tests run fine without these mocks -- but components that use animated styles will need them.
**Warning signs:** "Cannot find module 'react-native-reanimated/mock'" or worklet evaluation errors.

### Pitfall 6: Safe Area Insets Not Applied Consistently
**What goes wrong:** Content hidden behind Dynamic Island or home indicator on some screens.
**Why it happens:** Developer applies SafeAreaView at root but not inside drawer content or modals.
**How to avoid:** Use `useSafeAreaInsets()` hook in each screen's container. Apply `paddingTop: insets.top` for status bar/notch, `paddingBottom: insets.bottom` for home indicator. The drawer content needs its own safe area handling since it's a separate view hierarchy.
**Warning signs:** Text overlapping status bar, buttons hidden under home indicator.

## Code Examples

### NativeWind Removal: Clean Metro Config
```javascript
// metro.config.js (AFTER NativeWind removal)
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [...(config.watchFolders || []), monorepoRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  ...(config.resolver.nodeModulesPaths || []),
];

config.resolver.extraNodeModules = {
  react: path.resolve(projectRoot, "node_modules/react"),
  "react-native": path.resolve(projectRoot, "node_modules/react-native"),
  "react-dom": path.resolve(projectRoot, "node_modules/react-dom"),
};

const rootReactPaths = [
  path.resolve(monorepoRoot, "node_modules", "react"),
  path.resolve(monorepoRoot, "node_modules", "react-native"),
  path.resolve(monorepoRoot, "node_modules", "react-dom"),
];
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const blockPatterns = rootReactPaths.map(
  (p) => new RegExp(`^${escapeRegex(p)}(/|$)`)
);
const existingBlockList = config.resolver.blockList || [];
const blockArray = Array.isArray(existingBlockList)
  ? existingBlockList
  : [existingBlockList];
config.resolver.blockList = [...blockArray, ...blockPatterns];

module.exports = config;
```

### NativeWind Removal: Clean Babel Config
```javascript
// babel.config.js (AFTER NativeWind removal)
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [["babel-preset-expo"]],
    plugins: [
      "react-native-reanimated/plugin", // Must be last plugin
    ],
  };
};
```

### Auth Screen Layout Pattern
```typescript
// Token input screen (D-05) -- developer-tool UX
// Pre-filled server URL, JWT token field, Connect button
// Error state shows below button
<KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
  <View style={styles.container}>
    {/* Loom branding */}
    <Text style={styles.title}>Loom</Text>
    <Text style={styles.subtitle}>Connect to your server</Text>

    {/* Server URL */}
    <TextInput
      value={serverUrl}
      onChangeText={setServerUrl}
      placeholder="Server URL"
      style={styles.input}
    />

    {/* JWT Token */}
    <TextInput
      value={token}
      onChangeText={setToken}
      placeholder="JWT Token"
      secureTextEntry
      style={styles.input}
    />

    {/* Error message */}
    {error && <Text style={styles.error}>{error}</Text>}

    {/* Connect button */}
    <Pressable onPress={handleConnect} style={styles.button}>
      <Text style={styles.buttonText}>Connect</Text>
    </Pressable>
  </View>
</KeyboardAvoidingView>
```

### Connection Banner with Glass + Spring
```typescript
// D-12: Glass surface, Navigation spring slide-down
const bannerTranslateY = useSharedValue(-80);

useEffect(() => {
  bannerTranslateY.value = showBanner
    ? withSpring(0, SPRING.navigation)
    : withSpring(-80, SPRING.navigation);
}, [showBanner]);

const bannerStyle = useAnimatedStyle(() => ({
  transform: [{ translateY: bannerTranslateY.value }],
  position: 'absolute',
  top: insets.top,
  left: 0,
  right: 0,
  zIndex: 100,
}));

<Animated.View style={bannerStyle}>
  <BlurView intensity={40} tint="dark" style={styles.bannerGlass}>
    <Text style={styles.bannerText}>Reconnecting...</Text>
  </BlurView>
</Animated.View>
```

### Jest Setup for Expo
```javascript
// jest.setup.js
require('react-native-reanimated').setUpTests();

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItem: jest.fn(),
  getItemAsync: jest.fn(),
  setItem: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));
```

```json
// package.json jest config
{
  "jest": {
    "preset": "jest-expo",
    "setupFilesAfterSetup": ["./jest.setup.js"],
    "transformIgnorePatterns": [
      "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@react-navigation/.*|react-native-reanimated|react-native-gesture-handler|react-native-mmkv|react-native-safe-area-context|react-native-screens|@loom/shared)"
    ]
  }
}
```

## State of the Art

| Old Approach (Phase 69) | Current Approach (Phase 74) | When Changed | Impact |
|-------------------------|----------------------------|--------------|--------|
| NativeWind v4 + className | StyleSheet.create + typed Theme | Phase 74 D-01 | Eliminates 40+ TS errors from NativeWind v4 type mismatches |
| Mixed inline/className styling | Consistent createStyles(theme) | Phase 74 D-01 | Every component follows same pattern |
| KeyboardAvoidingView removed | KeyboardProvider from keyboard-controller | Phase 74 (restore) | Root layout needs KeyboardProvider back |
| Phase 69 components (26 files) | Fresh build from PATTERNS-PLAYBOOK | Phase 74 D-04 | Clean slate, no NativeWind debt |

**Deprecated/outdated:**
- `global.css` + Tailwind directives: Removed, replaced by theme.ts
- `nativewind/babel` preset: Removed, plain babel-preset-expo
- `withNativeWind` Metro wrapper: Removed, plain Metro config
- `postinstall` Tailwind v3 nesting hack: Removed

## Existing Code Inventory

### KEEP (no changes needed)
| File | Purpose | NativeWind-Free |
|------|---------|----------------|
| `mobile/hooks/useAuth.ts` | Auth state machine | Yes |
| `mobile/hooks/useConnection.ts` | Connection status selector | Yes |
| `mobile/hooks/useAppState.ts` | Foreground/background lifecycle | Yes |
| `mobile/hooks/useSessions.ts` | Session CRUD + navigation | Yes |
| `mobile/hooks/useMessageList.ts` | Message state (Phase 75+) | Yes |
| `mobile/hooks/useScrollToBottom.ts` | Scroll pill (Phase 76+) | Yes |
| `mobile/hooks/useDynamicColor.ts` | Color shifts (Phase 75+) | Yes |
| `mobile/lib/auth-provider.ts` | iOS Keychain SecureStore adapter | Yes |
| `mobile/lib/platform.ts` | API/WS base URLs | Yes |
| `mobile/lib/storage-adapter.ts` | MMKV Zustand adapter | Yes |
| `mobile/lib/websocket-init.ts` | WS client + multiplexer + AppState | Yes |
| `mobile/lib/springs.ts` | Soul doc spring constants | Yes |
| `mobile/lib/colors.ts` | Surface palette + dynamic color | Yes |
| `mobile/stores/index.ts` | 5 Zustand store instances | Yes |

### DELETE (D-04)
- `mobile/components/**` -- 26 files (all use NativeWind className)
- `mobile/app/(drawer)/index.tsx` -- imports deleted components
- `mobile/app/(drawer)/(stack)/**` -- imports deleted components
- `mobile/app/(drawer)/settings.tsx` -- placeholder, rebuild later
- `mobile/app/_layout.tsx` -- rebuild (remove global.css import, add KeyboardProvider)

### MODIFY (D-02)
- `mobile/babel.config.js` -- remove NativeWind presets
- `mobile/metro.config.js` -- remove withNativeWind wrapper
- `mobile/package.json` -- remove NativeWind deps + postinstall

## Open Questions

1. **Parallax with drawerType: 'slide' -- additive or replacement?**
   - What we know: `drawerType: 'slide'` already moves the scene alongside the drawer. `useDrawerProgress` provides a 0-1 SharedValue for custom interpolation.
   - What's unclear: Whether the built-in slide transform and the parallax wrapper's translateX are additive (content would shift too far) or if the parallax wrapper should replace the built-in behavior via `drawerType: 'front'`.
   - Recommendation: Start with `drawerType: 'front'` + custom parallax via useDrawerProgress for full control. If the visual isn't right, try `slide` and reduce the interpolation range. This needs on-device testing.

2. **KeyboardProvider placement**
   - What we know: Phase 69 root layout had it removed ("using RN's built-in KeyboardAvoidingView per screen"). D-10 requires keyboard avoidance for the composer shell.
   - What's unclear: Whether KeyboardProvider should wrap the entire app (root layout) or just the chat screen.
   - Recommendation: Wrap at root layout level. `react-native-keyboard-controller` KeyboardProvider is a context provider that doesn't force behavior -- individual screens opt in via the KeyboardAvoidingView component from the same library.

3. **Theme values: colors.ts vs theme.ts consolidation**
   - What we know: `mobile/lib/colors.ts` already has Soul doc surface values (with device-adjusted jumps: 16-20 RGB units vs Soul doc's 8-unit jumps). `mobile/lib/springs.ts` has all 6 springs.
   - What's unclear: Whether to keep colors.ts/springs.ts as separate files and import them into theme.ts, or consolidate everything into theme.ts.
   - Recommendation: Keep colors.ts and springs.ts as the source of truth (they're already correct). Import into theme.ts which adds typography, spacing, shadows, and radii. This avoids disrupting existing lib/ imports.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + jest-expo 55.0.13 |
| Config file | None -- Wave 0 gap |
| Quick run command | `cd mobile && npx jest --passWithNoTests` |
| Full suite command | `cd mobile && npx jest` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CONN-01 | Auth login flow (valid token, invalid token, network error) | unit | `npx jest __tests__/hooks/useAuth.test.ts -x` | Wave 0 |
| CONN-02 | Token persist/clear via SecureStore | unit | `npx jest __tests__/hooks/useAuth.test.ts -x` | Wave 0 |
| CONN-03 | WebSocket connects on init | unit | `npx jest __tests__/lib/websocket-init.test.ts -x` | Wave 0 |
| CONN-04 | Reconnect with backoff on disconnect | unit | `npx jest __tests__/lib/websocket-init.test.ts -x` | Wave 0 |
| CONN-05 | Banner shows on disconnect (cold-start guard) | unit | `npx jest __tests__/hooks/useConnectionBanner.test.ts -x` | Wave 0 |
| CONN-07 | Foreground resume with fresh token | unit | `npx jest __tests__/lib/websocket-init.test.ts -x` | Wave 0 |
| NAV-01 | Drawer renders with session list | manual | Device/simulator testing | N/A |
| NAV-02 | Drawer open/close navigation | manual | Device/simulator testing | N/A |
| NAV-03 | Safe area insets applied | manual | Visual inspection on device/sim | N/A |
| NAV-04 | Parallax 20px shift | manual | Visual inspection on device/sim | N/A |

### Sampling Rate
- **Per task commit:** `cd mobile && npx jest --passWithNoTests`
- **Per wave merge:** `cd mobile && npx jest`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `mobile/jest.setup.js` -- Reanimated mock, expo-secure-store mock, expo-haptics mock
- [ ] `mobile/package.json` jest config section -- preset, transformIgnorePatterns, setupFilesAfterSetup
- [ ] `jest-expo` + `@types/jest` -- dev dependency install
- [ ] `mobile/__tests__/hooks/useAuth.test.ts` -- covers CONN-01, CONN-02
- [ ] `mobile/__tests__/lib/websocket-init.test.ts` -- covers CONN-03, CONN-04, CONN-07
- [ ] `mobile/__tests__/hooks/useConnectionBanner.test.ts` -- covers CONN-05

## Project Constraints (from CLAUDE.md)

- **No placeholders.** All generated code must be complete and functional.
- **Verify before done.** Run test/build/lint and show output.
- **Plan before multi-file changes.** 3+ files = numbered plan, wait for approval.
- **Confidence gate:** >=90% proceed, 70-89% pause, <70% research first.
- **Every interactive element: 44x44 point minimum** (V2_CONSTITUTION Section 13 + Soul doc anti-pattern #4).
- **No linear/ease animations** except keyboard sync and color transitions.
- **Forgejo integration:** Bugs found during testing -> create Forgejo issues.
- **Fix ALL adversarial findings:** Every finding (SSS through C) must be fixed.
- **Commit-issue linking:** Fixes #N or Related to #N in commit messages.

## Sources

### Primary (HIGH confidence)
- Project codebase: `mobile/hooks/`, `mobile/lib/`, `mobile/stores/` -- direct file reads
- `.planning/NATIVE-APP-SOUL.md` -- authoritative visual contract
- `mobile/.planning/research/PATTERNS-PLAYBOOK.md` -- primary implementation reference
- `.planning/phases/74-shell-connection/74-CONTEXT.md` -- locked decisions
- [React Navigation Drawer docs](https://reactnavigation.org/docs/drawer-navigator/) -- useDrawerProgress, drawerType options
- [React Navigation DrawerLayout docs](https://reactnavigation.org/docs/drawer-layout/) -- animation customization
- [Expo unit testing docs](https://docs.expo.dev/develop/unit-testing/) -- jest-expo setup

### Secondary (MEDIUM confidence)
- [Expo Drawer docs](https://docs.expo.dev/router/advanced/drawer/) -- Expo Router drawer integration
- Web search: parallax examples with useDrawerProgress (multiple sources agree on interpolate pattern)

### Tertiary (LOW confidence)
- None -- all findings verified against codebase or official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all packages already installed and version-verified from `npm ls`
- Architecture: HIGH -- follows Private Mind PATTERNS-PLAYBOOK patterns with locked decisions
- Pitfalls: HIGH -- 4 of 6 pitfalls are documented from Phase 69 experience (project memory)
- Testing: MEDIUM -- jest-expo setup is standard but not yet validated in this project
- Parallax implementation: MEDIUM -- drawerType interaction with useDrawerProgress needs device testing

**Research date:** 2026-04-03
**Valid until:** 2026-05-03 (stable: Expo SDK 54 LTS, no breaking changes expected)
