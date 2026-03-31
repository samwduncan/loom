# Phase 68: Scaffolding & Design - Research

**Researched:** 2026-03-31
**Domain:** React Native / Expo SDK 55, npm workspaces monorepo, NativeWind v4, Zustand factory extraction, EAS Build, Apple Developer enrollment
**Confidence:** HIGH

## Summary

Phase 68 delivers two parallel outcomes: (1) a working Expo development build on iPhone 16 Pro Max with shared business logic extracted from the web app, and (2) a Native App Soul document that locks visual direction for all v3.0 phases. The phase is infrastructure-heavy with a creative design component gated by swd approval.

The shared code extraction is the riskiest technical piece -- five Zustand stores, the WebSocket client, API client, stream multiplexer, and 13 type files must move to `shared/` while maintaining zero regressions in the web app. The factory pattern for Zustand stores (accepting a `StateStorage` adapter) is well-supported by Zustand's persist middleware and documented for MMKV integration. The Expo scaffolding is straightforward given SDK 55's automatic monorepo Metro configuration.

**Primary recommendation:** Execute extraction first (validates shared/ imports for both bundlers), then Expo scaffolding (consumes shared/ on device), then NativeWind primitives (validates styling pipeline), then Soul doc (creative work with Bard), then Apple enrollment/certs last (external dependency, parallel where possible).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Full extraction to `shared/` (~20 files): types, Zustand store factories, API client, WebSocket client, stream multiplexer, tool registry
- **D-02:** Factory pattern for Zustand stores -- `createTimelineStore(storageAdapter)`. Web passes localStorage, native passes MMKV. Each store becomes a factory function accepting a storage adapter.
- **D-03:** Auth abstracted via `AuthProvider` interface: `getToken()`, `setToken()`, `clearToken()`. Web implements with localStorage, native with iOS Keychain (`expo-secure-store`). API client and WebSocket client accept AuthProvider, not concrete storage.
- **D-04:** `shared/` gets its own test suite. Existing tests from `src/src/lib/` and `src/src/stores/` move with the code. Running tests in shared/ proves code works in isolation from either platform.
- **D-05:** Stream multiplexer transfers as-is (callback-based, zero DOM deps). The rAF + DOM mutation streaming renderer stays in `src/` (web-only). Native streaming renderer is Phase 69 scope.
- **D-06:** Explicit web regression gate: `vitest` full suite + `vite build` verification as Phase 68 exit criteria. Documented proof extraction didn't break the web app.
- **D-07:** Bard leads creative exploration, Claude formalizes into document, swd reviews and approves.
- **D-08:** Format: written specs (3-5 page markdown) + annotated reference screenshots from ChatGPT iOS and Claude iOS. No Figma mockups.
- **D-09:** All v3.0 screens covered: session list, chat thread, composer, tool cards, permission request, sidebar drawer, settings, share sheet, notification UI, code block detail, search, pinned sessions
- **D-10:** 2 plans budgeted for Soul doc. Plan 1: Bard analyzes reference apps + proposes direction. Plan 2: Claude formalizes doc + swd reviews between sessions.
- **D-11:** Elevation direction: motion (spring physics on interactions) + depth/glass (layered surfaces with blur/shadows) + dynamic color (ambient shifts based on context). All three layers, applied contextually.
- **D-12:** swd's vision: "essentially a copy of ChatGPT/Claude's app, but with much more dynamic interfaces -- things moving, nice animations, beautiful color palettes, native support for all Loom features (git, file browser, monitoring)."
- **D-13:** npm workspaces from day 1. Root package.json declares workspaces for src/, mobile/, shared/, server/. Fallback to plain directory imports if Metro has issues.
- **D-14:** NativeWind v4 uses Tailwind v3 syntax (web uses Tailwind v4). No shared styling code -- only logic shares via `shared/`.
- **D-15:** Personal Apple Developer account ($99/year). Enrollment starts immediately.
- **D-16:** SCAFF-05 (APNs push certs) is Phase 68's last task, gated on enrollment clearing.
- **D-17:** Development build profile (standalone app with Expo Dev Client). Connects to Metro bundler over Tailscale network.
- **D-18:** MacBook M1 Pro available ~30% of the time. EAS cloud builds are the primary path.
- **D-19:** Build 4-5 design system primitives: surface/card with depth, text hierarchy (heading/body/caption), button with states, list item, glass/blur surface.
- **D-20:** Start with web app's OKLCH tokens and typography (Inter/JetBrains Mono) as baseline. Soul doc overrides the actual values when finalized.
- **D-21:** Drawer + Stack navigation architecture. Sidebar drawer as root navigator, stack for chat screens. Matches ChatGPT/Claude iOS pattern.
- **D-22:** All v3.0 routes scaffolded as placeholders.
- **D-23:** Expo Dev Client connects to Metro bundler on Linux server (100.86.4.57) over Tailscale.
- **D-24:** Debugging: console logs + React DevTools connected over network.

### Claude's Discretion
- WebSocket and API client configuration pattern (constructor injection vs global configure) -- Claude picks what fits the existing code best during extraction

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SCAFF-01 | Developer can build and install Expo dev build on iPhone 16 Pro Max via EAS Build | EAS Build development profile, eas.json config, Expo SDK 55 setup documented |
| SCAFF-02 | Shared code directory (`shared/`) created at repo root with types, Zustand store factories, WebSocket client, stream multiplexer, and API client | Store factory pattern, StateStorage adapter, AuthProvider interface, dependency analysis complete |
| SCAFF-03 | Native app (`mobile/`) created with Expo Router, coexists with web app (`src/`) without restructuring | Expo Router v5, Drawer+Stack layout, file-based routing documented |
| SCAFF-04 | Both Vite (web) and Metro (native) resolve `shared/` imports correctly -- web app builds with zero regressions | npm workspaces config, Vite alias, Metro auto-config (SDK 55), vitest + vite build verification |
| SCAFF-05 | Apple Developer Program enrolled with APNs certificates configured for push notifications | Enrollment timeline (48hrs individual), cert workflow documented, gated as last task |
| SCAFF-06 | NativeWind v4 configured with representative styling validated on device | NativeWind v4.2.3 + Tailwind v3.4.19, babel/metro/tailwind config, 5 primitive components |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo | 55.0.9 | React Native framework | Latest stable SDK, auto-configures Metro for monorepos, mandatory for EAS Build |
| react-native | 0.83.2 | Native runtime | Bundled with Expo SDK 55, New Architecture only (legacy removed) |
| react | 19.2.4 | UI framework | Bundled with Expo SDK 55, matches web app's React 19 |
| expo-router | 55.0.8 | File-based navigation | Expo's blessed router, v5 with anchor routes and protected routes |
| nativewind | 4.2.3 | Tailwind CSS for React Native | Stable v4, uses Tailwind v3 syntax, NativeWind v5 is pre-release |
| tailwindcss | 3.4.19 | CSS utility framework (for NativeWind) | Latest Tailwind v3.x -- NativeWind v4 requires v3, NOT v4 |
| zustand | 5.0.12 | State management | Already in web app at same version, persist middleware has StateStorage interface |
| immer | 11.1.4 | Immutable updates | Already in web app for timeline store, transfers to shared/ |
| react-native-mmkv | 4.3.0 | Persistent storage for native | 30x faster than AsyncStorage, Zustand persist adapter well-documented |
| expo-secure-store | 55.0.9 | iOS Keychain access | JWT token storage, AuthProvider native implementation |
| react-native-reanimated | 4.3.0 | 120Hz animations | Required by NativeWind, expo-router drawer, future spring physics |
| react-native-gesture-handler | 2.30.1 | Native gestures | Required by expo-router drawer navigation |
| @react-navigation/drawer | 7.9.8 | Drawer navigator | Required by expo-router Drawer layout |
| react-native-safe-area-context | 5.7.0 | Safe area insets | Required by NativeWind, handles Dynamic Island/notch |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zustand-mmkv-storage | 1.0.0 | MMKV adapter for Zustand persist | When creating native store instances with persist middleware |
| expo-dev-client | 55.0.19 | Development build runtime | Included in dev builds for hot reload and dev tools |
| expo-haptics | 55.0.9 | Haptic feedback | Phase 68 validation of haptic capability, heavy use in Phase 71 |
| eas-cli | 18.4.0 | Build and submit tool | Cloud builds and device deployment |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| NativeWind v4 | NativeWind v5 (pre-release) | v5 uses Tailwind v4 syntax (matching web) but is NOT stable -- API still evolving, production-breaking issues reported |
| react-native-mmkv | AsyncStorage | MMKV is 30-100x faster, but requires native module compilation; AsyncStorage is JS-only but slow |
| zustand-mmkv-storage | Custom adapter | The official MMKV docs show a 6-line custom adapter; zustand-mmkv-storage adds lazy loading and hydration detection |
| npm workspaces | pnpm workspaces | pnpm has better hoisting control but adds symlink complexity with Metro; npm workspaces are simpler and Expo explicitly supports them |

**Installation (mobile/ app):**
```bash
npx create-expo-app mobile --template blank-typescript
cd mobile
npx expo install nativewind react-native-reanimated react-native-safe-area-context react-native-gesture-handler react-native-mmkv expo-secure-store expo-haptics expo-dev-client @react-navigation/drawer
npm install --save-dev tailwindcss@3.4.19
```

**Installation (shared/ package):**
```bash
# shared/ is a plain TypeScript package -- no bundler, no framework
npm install zustand immer
# Tests: vitest (run from shared/ or root)
```

## Architecture Patterns

### Recommended Project Structure
```
loom/                          # Repo root
  package.json                 # Workspaces: ["src", "mobile", "shared", "server"]
  shared/
    package.json               # name: "@loom/shared", main: "index.ts"
    index.ts                   # Barrel export
    types/                     # 13 type files (from src/src/types/)
    stores/                    # Factory functions (from src/src/stores/)
      timeline.ts              # createTimelineStore(storage)
      stream.ts                # createStreamStore() -- no persist, no adapter
      connection.ts            # createConnectionStore(storage)
      ui.ts                    # createUIStore(storage)
      file.ts                  # createFileStore() -- no persist
    lib/
      auth.ts                  # AuthProvider interface + type exports
      api-client.ts            # apiFetch(path, opts, signal, auth, urlResolver)
      websocket-client.ts      # WebSocketClient class with injected resolvers
      stream-multiplexer.ts    # Transfers as-is (callback-based, zero DOM deps)
      tool-registry-types.ts   # ToolConfig, ToolCardProps interfaces (NOT components)
    __tests__/                 # Tests from src/src/stores/*.test.ts, lib/*.test.ts
  mobile/
    package.json               # Expo app, depends on @loom/shared
    app/                       # Expo Router file-based routes
      _layout.tsx              # Root Drawer layout
      (drawer)/
        _layout.tsx            # Drawer screen definitions
        index.tsx              # Session list placeholder
        settings.tsx           # Settings placeholder
      (stack)/
        chat/[id].tsx          # Chat screen placeholder
        notifications.tsx      # Notifications placeholder
    components/                # Native components (100% new, no web port)
    lib/
      auth-provider.ts         # AuthProvider impl: expo-secure-store
      storage-adapter.ts       # StateStorage impl: react-native-mmkv
      platform.ts              # API_BASE, WS_BASE for native (Tailscale IP)
    stores/                    # Instantiated stores using shared factories
      index.ts                 # useTimelineStore = createTimelineStore(mmkvStorage)
    global.css                 # @tailwind base/components/utilities
    tailwind.config.js         # NativeWind preset, content paths
    metro.config.js            # withNativeWind wrapper
    babel.config.js            # babel-preset-expo + nativewind/babel
    app.json                   # Expo config
    eas.json                   # Build profiles
  src/                         # Web app (UNCHANGED structure, updated imports)
    package.json               # Existing, add @loom/shared dependency
    src/
      stores/                  # Thin wrappers: createTimelineStore(localStorageAdapter)
      lib/
        auth.ts                # AuthProvider impl: localStorage (replaces direct calls)
        platform.ts            # Unchanged (web URL resolution)
  server/                      # Backend (unchanged)
    package.json
```

### Pattern 1: Zustand Store Factory with Storage Adapter

**What:** Store logic lives in `shared/` as a factory function. Platform code instantiates with platform-specific storage.

**When to use:** Any Zustand store that uses `persist` middleware (timeline, connection, ui).

**Example:**
```typescript
// shared/stores/timeline.ts
import { create } from 'zustand';
import { persist, type StateStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Message } from '../types/message';
import type { Session } from '../types/session';
import type { ProviderId } from '../types/provider';

// ... state interface and initial state unchanged ...

export function createTimelineStore(storage: StateStorage) {
  return create<TimelineState>()(
    persist(
      immer((set) => ({
        // ... all existing store logic unchanged ...
      })),
      {
        name: 'loom-timeline',
        version: 1,
        storage: createJSONStorage(() => storage),
        // partialize, merge, migrate unchanged
      },
    ),
  );
}

// Type export for consumers
export type TimelineStore = ReturnType<typeof createTimelineStore>;
```

```typescript
// mobile/stores/index.ts
import { createTimelineStore } from '@loom/shared/stores/timeline';
import { mmkvStorage } from '../lib/storage-adapter';

export const useTimelineStore = createTimelineStore(mmkvStorage);
```

```typescript
// src/src/stores/timeline.ts (web -- thin wrapper)
import { createTimelineStore } from '@loom/shared/stores/timeline';

const localStorageAdapter = {
  getItem: (name: string) => localStorage.getItem(name),
  setItem: (name: string, value: string) => localStorage.setItem(name, value),
  removeItem: (name: string) => localStorage.removeItem(name),
};

export const useTimelineStore = createTimelineStore(localStorageAdapter);

// Dev-mode window exposure preserved for E2E testing
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__ZUSTAND_TIMELINE_STORE__ = useTimelineStore;
}
```

### Pattern 2: AuthProvider Interface Abstraction

**What:** Auth operations abstracted behind an interface. Platform provides implementation.

**When to use:** API client and WebSocket client need auth tokens but must not import platform-specific storage.

**Example:**
```typescript
// shared/lib/auth.ts
export interface AuthProvider {
  getToken(): string | null;
  setToken(token: string): void;
  clearToken(): void;
}

// shared/lib/api-client.ts
import type { AuthProvider } from './auth';

export function createApiClient(
  auth: AuthProvider,
  resolveUrl: (path: string) => string,
) {
  async function apiFetch<T>(
    path: string,
    options: RequestInit = {},
    signal?: AbortSignal,
  ): Promise<T> {
    const token = auth.getToken();
    const res = await fetch(resolveUrl(path), {
      ...options,
      signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers as Record<string, string> | undefined),
      },
    });
    // ... 401 handling uses auth.clearToken() + re-bootstrap ...
  }
  return { apiFetch };
}
```

### Pattern 3: MMKV Storage Adapter for Zustand

**What:** Bridges react-native-mmkv to Zustand's StateStorage interface.

**Example:**
```typescript
// mobile/lib/storage-adapter.ts
import { MMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

const mmkv = new MMKV();

export const mmkvStorage: StateStorage = {
  getItem: (name: string) => mmkv.getString(name) ?? null,
  setItem: (name: string, value: string) => mmkv.set(name, value),
  removeItem: (name: string) => mmkv.delete(name),
};
```

### Pattern 4: Expo Router Drawer + Stack Layout

**What:** Root drawer navigator wrapping a stack for chat screens.

**Example:**
```typescript
// mobile/app/_layout.tsx
import { Drawer } from 'expo-router/drawer';

export default function RootLayout() {
  return (
    <Drawer>
      <Drawer.Screen name="(drawer)" options={{ headerShown: false }} />
      <Drawer.Screen name="(stack)" options={{ drawerItemStyle: { display: 'none' } }} />
    </Drawer>
  );
}
```

### Pattern 5: npm Workspace Root Configuration

**What:** Root package.json declares workspace packages. Expo SDK 55 auto-configures Metro.

**Example:**
```json
{
  "name": "@siteboon/claude-code-ui",
  "private": true,
  "workspaces": ["src", "mobile", "shared", "server"],
  "scripts": {
    "dev:web": "cd src && npm run dev",
    "dev:mobile": "cd mobile && npx expo start",
    "test:shared": "cd shared && npx vitest run",
    "test:web": "cd src && npx vitest run",
    "build:web": "cd src && npm run build"
  }
}
```

### Anti-Patterns to Avoid

- **Moving web app files:** The web app at `src/` must NOT be restructured. Only import paths change to point at `@loom/shared`. The directory structure, router, components all stay put.
- **Sharing React components between platforms:** `shared/` contains ZERO React components, ZERO JSX, ZERO DOM APIs. Only types, store logic, pure functions, and class-based clients. The tool-registry has React component imports -- these must be separated (types go to shared, component registration stays in each platform).
- **Using Tailwind v4 for NativeWind:** NativeWind v4 requires Tailwind v3 syntax. The web app uses Tailwind v4. These are intentionally different -- no sharing of CSS or Tailwind config.
- **Importing `import.meta.env` in shared/:** Vite env vars (`import.meta.env.VITE_*`) don't exist in Metro. Any env-dependent code must accept values via injection, not read globals directly.
- **Direct localStorage calls in shared/:** The entire point of the factory pattern is to abstract storage. Any `localStorage.getItem()` in shared/ is a bug.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| MMKV-Zustand bridge | Custom persist storage engine | `zustand-mmkv-storage` or 6-line `StateStorage` adapter | Well-documented pattern, Zustand's `createJSONStorage` handles serialization |
| Monorepo Metro config | Custom watchFolders, resolver config | Expo SDK 55 auto-configuration | SDK 55 detects workspaces automatically, manual config is deprecated |
| iOS Keychain access | Native module for secure storage | `expo-secure-store` | Battle-tested, handles kSecAttrAccessible, data persists across reinstalls |
| Navigation architecture | Custom navigator from React Navigation | `expo-router` Drawer + Stack layouts | File-based routing eliminates boilerplate, deep linking built-in |
| Haptic feedback | Direct native module calls | `expo-haptics` | Simple API, already in Expo ecosystem, no native module compilation |
| Development builds | Manual Xcode project configuration | `eas build --profile development` | Handles signing, provisioning, Dev Client inclusion automatically |

**Key insight:** Expo SDK 55 eliminates almost all of the monorepo configuration pain that plagued earlier versions. The team should NOT follow older tutorials that manually configure `watchFolders` or `resolver.nodeModulesPaths` -- these are now auto-detected.

## Common Pitfalls

### Pitfall 1: Duplicate React/React Native in Monorepo
**What goes wrong:** Two versions of React get bundled -- hooks crash with "Invalid hook call" error.
**Why it happens:** npm hoisting resolves React to different node_modules depending on which workspace imports it.
**How to avoid:** Ensure `react` and `react-native` are in root `package.json` only, not in individual workspace `package.json` files. Use `npm why react` to verify single resolution. Add `overrides` in root package.json if needed.
**Warning signs:** "Invalid hook call" error, "Cannot read property of null" in hooks, mismatched React versions in bundle.

### Pitfall 2: NativeWind + Tailwind Version Mismatch
**What goes wrong:** NativeWind v4 silently fails to apply styles. No error, just unstyled components.
**Why it happens:** Installing `tailwindcss` (v4.x, latest) instead of `tailwindcss@^3.4.17`. NativeWind v4 compiles Tailwind v3 syntax.
**How to avoid:** Pin `tailwindcss@3.4.19` explicitly in mobile/package.json devDependencies. The web app can continue using Tailwind v4.
**Warning signs:** `className` prop has no visual effect, NativeWind babel plugin warnings about unsupported features.

### Pitfall 3: Vite Path Aliases Breaking After Extraction
**What goes wrong:** Web app imports break because `@/lib/auth` no longer exists at that path -- it moved to `shared/`.
**Why it happens:** Files moved to shared/ but import statements in consuming web code still use `@/lib/auth`.
**How to avoid:** Two-step process: (1) Move files to shared/, update shared/ internal imports to relative paths. (2) Update web app imports from `@/lib/auth` to `@loom/shared/lib/auth`. Run `tsc -b` and `vitest run` after each step.
**Warning signs:** TypeScript errors in IDE, Vite build failures with "Module not found".

### Pitfall 4: `import.meta.env` in Shared Code
**What goes wrong:** Metro bundler crashes because `import.meta.env` is a Vite-only construct.
**Why it happens:** Extracted code from web app still references `import.meta.env.VITE_*` or `import.meta.env.DEV`.
**How to avoid:** Search all files in shared/ for `import.meta.env` after extraction. Replace with injected values (constructor params, factory function args, or environment-agnostic checks).
**Warning signs:** Metro build error "Cannot access import.meta", runtime undefined values.

### Pitfall 5: tool-registry.ts Has React Component Imports
**What goes wrong:** Attempting to put tool-registry.ts in shared/ fails because it imports Lucide icons and per-tool React components.
**Why it happens:** The tool registry mixes platform-independent logic (tool config map, display names) with platform-specific rendering (React components, icon components).
**How to avoid:** Split into two files: `shared/lib/tool-registry-types.ts` (interfaces: ToolConfig, ToolCardProps, displayName map) and `src/src/lib/tool-registry.ts` (React component registration, icon imports). Native app gets its own tool-registry.ts with native components in Phase 70.
**Warning signs:** Metro errors about JSX or React imports, missing icon components.

### Pitfall 6: Metro Bundler Can't Reach from iPhone
**What goes wrong:** Expo Dev Client on iPhone shows "Unable to connect to Metro bundler" when running on Linux server.
**Why it happens:** Metro binds to localhost or wrong interface; iPhone needs to reach the Tailscale IP.
**How to avoid:** Set `REACT_NATIVE_PACKAGER_HOSTNAME=100.86.4.57` before running `npx expo start`. This tells Metro to advertise the Tailscale IP. Verify with `curl http://100.86.4.57:8081/status` from another device.
**Warning signs:** QR code shows wrong IP, Dev Client spinner on device, "Network request failed".

### Pitfall 7: Apple Developer Enrollment Delays
**What goes wrong:** Cannot create EAS builds for physical device because Apple hasn't processed enrollment.
**Why it happens:** Individual enrollment typically takes 48 hours but can take up to 2 weeks.
**How to avoid:** Start enrollment before Phase 68 code begins (D-15). Use iOS Simulator builds (`"simulator": true` in eas.json) for initial validation while waiting. SCAFF-05 (push certs) is explicitly the last task.
**Warning signs:** EAS Build fails with provisioning errors, Apple Developer portal shows "Enrollment in Review".

### Pitfall 8: Zustand persist middleware hydration flash
**What goes wrong:** Native app shows initial state briefly before persisted state loads from MMKV.
**Why it happens:** Zustand persist middleware is asynchronous by default -- store initializes with defaults, then hydrates.
**How to avoid:** MMKV is synchronous (unlike AsyncStorage), so the `zustand-mmkv-storage` adapter can use synchronous reads. Alternatively, use the `onRehydrateStorage` callback to show a loading state until hydration completes.
**Warning signs:** Brief flash of empty session list, UI "jumping" on app launch.

## Code Examples

### NativeWind Configuration Files

```javascript
// mobile/babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
```

```javascript
// mobile/metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });
```

```javascript
// mobile/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // OKLCH tokens from web app as baseline
        // Soul doc overrides these later
        surface: {
          0: 'rgb(10, 10, 12)',
          1: 'rgb(18, 18, 22)',
          2: 'rgb(26, 26, 32)',
          3: 'rgb(34, 34, 42)',
        },
      },
      fontFamily: {
        sans: ['Inter'],
        mono: ['JetBrains Mono'],
      },
    },
  },
  plugins: [],
};
```

```css
/* mobile/global.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

```typescript
// mobile/nativewind-env.d.ts
/// <reference types="nativewind/types" />
```

### EAS Build Configuration

```json
// mobile/eas.json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "development-simulator": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  }
}
```

### Expo App Configuration

```json
// mobile/app.json
{
  "expo": {
    "name": "Loom",
    "slug": "loom",
    "version": "3.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "scheme": "loom",
    "userInterfaceStyle": "dark",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.siteboon.loom"
    },
    "web": {
      "bundler": "metro"
    },
    "plugins": [
      "expo-router",
      "expo-secure-store"
    ],
    "extra": {
      "eas": {
        "projectId": "TBD_AFTER_EAS_INIT"
      }
    }
  }
}
```

### Shared Package Configuration

```json
// shared/package.json
{
  "name": "@loom/shared",
  "version": "0.0.1",
  "private": true,
  "main": "index.ts",
  "types": "index.ts",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "zustand": "^5.0.12",
    "immer": "^11.1.4"
  },
  "devDependencies": {
    "typescript": "~5.9.3",
    "vitest": "^4.0.18"
  }
}
```

### Metro Dev Server Over Tailscale

```bash
# Start Metro bundler on Linux server, advertising Tailscale IP
cd /home/swd/loom/mobile
REACT_NATIVE_PACKAGER_HOSTNAME=100.86.4.57 npx expo start --dev-client

# On iPhone: open Expo Dev Client, enter URL:
# http://100.86.4.57:8081
```

### Vite Config Update for shared/ Imports

```typescript
// src/vite.config.ts -- add alias for @loom/shared
resolve: {
  alias: {
    '@': '/src',
    '@loom/shared': path.resolve(__dirname, '../shared'),
  },
},
```

### Web App AuthProvider Implementation

```typescript
// src/src/lib/auth.ts (updated -- implements AuthProvider from shared)
import type { AuthProvider } from '@loom/shared/lib/auth';

const TOKEN_KEY = 'loom-jwt';

export const webAuthProvider: AuthProvider = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
};

// bootstrapAuth and refreshAuth stay here (web-specific, uses fetchAnon)
```

### Native App AuthProvider Implementation

```typescript
// mobile/lib/auth-provider.ts
import * as SecureStore from 'expo-secure-store';
import type { AuthProvider } from '@loom/shared/lib/auth';

const TOKEN_KEY = 'loom-jwt';

export const nativeAuthProvider: AuthProvider = {
  getToken: () => SecureStore.getItem(TOKEN_KEY),
  setToken: (token: string) => SecureStore.setItem(TOKEN_KEY, token),
  clearToken: () => SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {}),
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual Metro watchFolders config | Expo auto-detects workspaces | SDK 52 (mid-2025) | No metro.config.js needed for monorepo resolution |
| Old Architecture (bridge) | New Architecture only (Fabric+JSI) | SDK 55 (Feb 2026) | Legacy architecture permanently removed, 43% faster cold starts |
| expo-background-fetch | expo-background-task | SDK 53 (mid-2025) | New API for background work |
| react-native-worklets separate | Bundled with reanimated 4.x | Reanimated 4 | No separate install needed for drawer animations |
| NativeWind v2 styled() | NativeWind v4 className prop | NativeWind v4 (2024) | Direct className support, jsxImportSource transform |
| `@capacitor/core` platform detection | React Native `Platform` API | v3.0 migration | No more window.Capacitor checks |

**Deprecated/outdated:**
- **Metro watchFolders/nodeModulesPaths:** Auto-configured since SDK 52. Remove if present.
- **Legacy Architecture:** Permanently disabled in SDK 55. All native modules must support New Architecture.
- **NativeWind `styled()` wrapper:** v4 uses `className` prop directly via babel transform.
- **expo-background-fetch:** Replaced by expo-background-task in SDK 53.

## Open Questions

1. **Expo Router Drawer + Stack nesting pattern**
   - What we know: Both Drawer and Stack layouts are supported, nesting is documented.
   - What's unclear: The exact file structure for drawer as root with stack screens for chat. The official docs show simple cases but Loom needs drawer containing both a session list and a stack navigator for chat screens.
   - Recommendation: Implement the `(drawer)` and `(stack)` group pattern during scaffolding. If the nesting is problematic, fall back to a single Stack with a custom drawer component.

2. **REACT_NATIVE_PACKAGER_HOSTNAME reliability with Expo SDK 55**
   - What we know: The env var works with earlier Expo/React Native versions to override the advertised bundler IP.
   - What's unclear: Whether Expo SDK 55's `npx expo start` still respects this variable, or if a different mechanism is needed.
   - Recommendation: Test immediately during scaffolding. Fallback: `--tunnel` mode (routes through Expo servers, higher latency but reliable).

3. **shared/ package.json `main` field for dual-bundler consumption**
   - What we know: Vite resolves via `resolve.alias`, Metro resolves via workspaces + `main` field.
   - What's unclear: Whether `"main": "index.ts"` works for both Vite (which does its own TS compilation) and Metro (which also compiles TS). If Metro needs a compiled JS output, the setup gets more complex.
   - Recommendation: Start with `"main": "index.ts"` -- both Vite and Metro compile TypeScript. If Metro complains, add `"exports"` field with conditional paths.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Metro bundler, Vite, all tooling | Yes | 22.22.1 | -- |
| npm | Package management, workspaces | Yes | 10.9.4 | -- |
| eas-cli | EAS cloud builds | No | -- | `npm install -g eas-cli` (18.4.0) |
| expo CLI | Metro dev server | No (not global) | -- | `npx expo start` (uses local package) |
| Xcode | Local iOS builds | No (Linux server) | -- | EAS cloud builds (primary path per D-18) |
| CocoaPods | Local iOS builds | No (Linux server) | -- | EAS cloud handles pod install |
| Ruby | CocoaPods dependency | Yes | 3.2.3 | Not needed if using EAS cloud only |
| iPhone 16 Pro Max | Device testing | Yes (swd's device) | -- | iOS Simulator via EAS build (`development-simulator` profile) |
| Tailscale | Network access to Linux server | Yes (100.86.4.57) | -- | Expo tunnel mode (`--tunnel`) |
| Apple Developer Account | EAS builds, push certs | Pending enrollment | -- | Simulator builds until enrollment clears |

**Missing dependencies with no fallback:**
- eas-cli must be installed globally: `npm install -g eas-cli@18.4.0`

**Missing dependencies with fallback:**
- Xcode not available on Linux server -- EAS cloud builds handle all native compilation. MacBook M1 Pro available ~30% for local builds.
- Apple Developer enrollment pending -- use simulator builds for initial validation.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.0.18 (existing web), vitest 4.0.18 (new shared/) |
| Config file (web) | `src/vite.config.ts` (test section) |
| Config file (shared) | `shared/vitest.config.ts` (new -- Wave 0) |
| Quick run command | `cd src && npx vitest run --reporter=verbose 2>&1 | tail -20` |
| Full suite command | `cd src && npx vitest run && npx tsc -b && npx vite build` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SCAFF-01 | EAS dev build installs on device | manual | `eas build --profile development --platform ios` | N/A (manual) |
| SCAFF-02 | Shared code directory with stores, clients, types | unit | `cd shared && npx vitest run` | Wave 0 (move tests from src/) |
| SCAFF-03 | Expo Router app with Drawer+Stack | smoke | Launch dev build on device, navigate routes | N/A (manual) |
| SCAFF-04 | Vite + Metro both resolve shared/ imports | integration | `cd src && npx vitest run && npx vite build` | Yes (existing web tests) |
| SCAFF-05 | Apple Developer enrolled, APNs certs | manual | Verify in Apple Developer portal | N/A (manual) |
| SCAFF-06 | NativeWind styling on device | smoke | Launch dev build, verify 5 primitives render | N/A (manual) |

### Sampling Rate
- **Per task commit:** `cd src && npx vitest run` (web regression check)
- **Per wave merge:** `cd src && npx vitest run && npx vite build && cd ../shared && npx vitest run`
- **Phase gate:** Full web suite green + vite build + shared/ tests green + device verification

### Wave 0 Gaps
- [ ] `shared/vitest.config.ts` -- vitest config for shared/ package
- [ ] `shared/__tests__/` -- migrated tests from src/src/stores/*.test.ts and selected lib/*.test.ts
- [ ] `shared/tsconfig.json` -- TypeScript config without Vite/DOM types

## Sources

### Primary (HIGH confidence)
- npm registry -- verified all package versions via `npm view` (expo 55.0.9, nativewind 4.2.3, react-native 0.84.1, zustand 5.0.12, react-native-mmkv 4.3.0, tailwindcss 3.4.19)
- [Expo SDK 55 changelog](https://expo.dev/changelog/sdk-55) -- React Native 0.83, React 19.2, no legacy architecture
- [Expo monorepo guide](https://docs.expo.dev/guides/monorepos/) -- auto Metro config since SDK 52, npm workspace support
- [NativeWind v4 installation](https://www.nativewind.dev/docs/getting-started/installation) -- babel, metro, tailwind config
- [Expo Router drawer docs](https://docs.expo.dev/router/advanced/drawer/) -- drawer layout, packages required
- [EAS Build development profile](https://docs.expo.dev/develop/development-builds/create-a-build/) -- eas.json config, Dev Client
- [react-native-mmkv Zustand wrapper](https://github.com/mrousavy/react-native-mmkv/blob/main/docs/WRAPPER_ZUSTAND_PERSIST_MIDDLEWARE.md) -- StateStorage adapter pattern
- [Zustand persist middleware](https://zustand.docs.pmnd.rs/reference/integrations/persisting-store-data) -- createJSONStorage, StateStorage interface
- [expo-secure-store docs](https://docs.expo.dev/versions/latest/sdk/securestore/) -- iOS Keychain, kSecClassGenericPassword

### Secondary (MEDIUM confidence)
- [Expo Router v5 blog](https://expo.dev/blog/expo-router-v5) -- anchor routes, protected routes
- [NativeWind v4 vs v5 discussion](https://github.com/nativewind/nativewind/discussions/1604) -- v4 stable for production, v5 pre-release
- Apple Developer enrollment timeline -- 48hrs individual, up to 2 weeks for organizations (community reports)
- REACT_NATIVE_PACKAGER_HOSTNAME -- documented for React Native, status with Expo SDK 55 not explicitly confirmed

### Tertiary (LOW confidence)
- Expo + Tailscale dev workflow -- no official documentation. Community confirms REACT_NATIVE_PACKAGER_HOSTNAME works for custom IPs, but specifics with current Expo versions need testing.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all versions verified against npm registry, Expo SDK 55 is current stable
- Architecture: HIGH -- factory pattern for Zustand stores is well-documented, existing code analyzed, dependency graph mapped
- Pitfalls: HIGH -- based on analysis of existing codebase (tool-registry React deps, import.meta.env usage, platform.ts Capacitor refs) and documented Expo monorepo issues
- NativeWind config: HIGH -- official docs consulted, v4 confirmed stable
- Tailscale dev workflow: MEDIUM -- env var documented but not verified with SDK 55
- Apple enrollment timing: MEDIUM -- community reports vary, 48hrs typical for individual

**Research date:** 2026-03-31
**Valid until:** 2026-04-14 (Expo ecosystem moves fast, NativeWind v5 may stabilize)
