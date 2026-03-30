# Architecture Patterns: React Native + Expo iOS Chat Client

**Domain:** Native iOS chat client for AI coding agents, sharing backend with existing React web app
**Researched:** 2026-03-30
**Overall confidence:** HIGH (Expo docs verified, existing codebase audited line-by-line, competitor patterns analyzed)

---

## Recommended Architecture

### System Overview

```
                        Tailscale Network (100.86.4.57)
                                    |
                  +-----------------+-----------------+
                  |                                   |
           +------+------+                   +--------+--------+
           |  Web Client  |                   | Native Client   |
           | (Vite+React) |                   | (Expo+RN)       |
           |  apps/web/   |                   | apps/mobile/    |
           +------+------+                   +--------+--------+
                  |                                   |
                  |    +------------------------+     |
                  +--->|   @loom/shared          |<---+
                       |   packages/shared/      |
                       |                         |
                       |   types/    (13 files)  |
                       |   stores/   (3 stores)  |
                       |   api/      (ws + rest) |
                       |   streaming/ (mux)      |
                       +------------------------+
                                    |
                           +--------+--------+
                           |  Express Backend |
                           |  server/         |
                           |  Port 5555       |
                           |  WS: /ws, /shell |
                           |  REST: /api/*    |
                           +-----------------+
```

**Three-layer architecture:**
1. **Backend** (unchanged) -- Express + WebSocket, platform-agnostic, JWT auth
2. **Shared package** -- Types, Zustand stores, WebSocket client, stream multiplexer, API client
3. **Platform apps** -- Web (Vite + React) and Native (Expo + RN), each with their own UI components

### Monorepo Structure

Use **npm workspaces**. Not Turborepo, not Nx, not pnpm.

**Rationale:** npm is the current package manager (package-lock.json exists). Expo SDK 55 auto-detects monorepos and configures Metro resolution. Turborepo adds caching/orchestration complexity that a solo dev with 3 packages does not need. The ROI of Turborepo is negative at this scale.

```
loom/
  package.json                # Root: workspaces config + root scripts
  packages/
    shared/                   # @loom/shared -- platform-agnostic business logic
      package.json            # name: "@loom/shared", peerDeps: react, zustand
      tsconfig.json           # strict mode, composite project references
      src/
        types/                # Pure TypeScript interfaces (zero runtime)
          message.ts          # Message, MessageRole, MessageMetadata, ToolCall, ThinkingBlock
          session.ts          # Session, SessionMetadata, ProjectGroup
          provider.ts         # ProviderId, ProviderContext, ConnectionStatus, ProviderConnection
          websocket.ts        # ServerMessage, ClientMessage, ClaudeSDKData, all SDK types
          stream.ts           # ThinkingState, ToolCallState
          api.ts              # API response types
          index.ts            # Barrel re-export
        stores/               # Zustand store factories (accept storage adapter)
          timeline.ts         # createTimelineStore(storage) -- sessions, messages
          stream.ts           # createStreamStore() -- ephemeral, no persistence
          connection.ts       # createConnectionStore(storage) -- provider connections
          index.ts
        api/                  # Network layer (standard WebSocket + fetch)
          websocket-client.ts # WebSocketClient class (URL resolver injected)
          stream-multiplexer.ts # Pure function message router
          api-client.ts       # configureApi() + apiFetch<T>() with injected base URL
          index.ts
        utils/                # Pure utility functions
          index.ts
  apps/
    web/                      # Existing web frontend (moved from src/)
      package.json            # Depends on @loom/shared
      vite.config.ts
      tsconfig.json           # paths: @/* -> src/*
      src/
        components/           # Web React components (div/span/CSS)
        hooks/                # Web-specific: useChatScroll, useStreamBuffer, useLongPress
        stores/               # Web-specific: ui.ts (sidebar/modals), file.ts (editor)
        lib/                  # platform.ts, streaming-markdown.ts, native-plugins.ts
    mobile/                   # New Expo + React Native iOS app
      package.json            # Depends on @loom/shared
      app.config.ts           # Expo config (plugins, build settings)
      metro.config.js         # Auto-configured by Expo SDK 55 for monorepo
      eas.json                # EAS Build profiles (dev, preview, production)
      app/                    # Expo Router file-based routes
        _layout.tsx           # Root: GestureHandlerRootView + providers + store init
        (auth)/
          _layout.tsx         # Auth flow layout
          login.tsx           # Server connection + JWT login
        (app)/
          _layout.tsx         # Drawer layout (session sidebar)
          (tabs)/
            _layout.tsx       # Tab navigator (Chat | Settings)
            index.tsx         # Active chat (default tab)
            settings.tsx      # Settings screen
          chat/
            [id].tsx          # Chat screen (pushed from session list)
        modal/
          permission.tsx      # Permission request overlay
      src/
        components/           # RN components (View/Text/Pressable)
        hooks/                # RN-specific: useNativeStreamBuffer, useAppLifecycle
        stores/               # RN-specific: ui-mobile.ts
        lib/                  # RN platform.ts, push service, haptics
        theme/                # NativeWind config, OKLCH token mapping
  server/                     # Express backend (unchanged, stays at root)
```

**Root package.json:**

```json
{
  "name": "loom",
  "private": true,
  "workspaces": ["packages/*", "apps/*"],
  "scripts": {
    "dev:web": "npm run dev -w apps/web",
    "dev:mobile": "npm run start -w apps/mobile",
    "dev:server": "node server/index.js",
    "build:shared": "tsc -p packages/shared/tsconfig.json",
    "test": "npm run test --workspaces --if-present"
  }
}
```

**Critical monorepo rule:** React and React Native must be singletons. The `@loom/shared` package declares `react` and `zustand` as `peerDependencies`, not `dependencies`. Only the app packages install them. Use `overrides` in root package.json if version conflicts arise.

---

## Component Boundaries

### Shared vs Platform-Specific (Based on Codebase Audit)

I audited every file in the current `src/src/` directory. Here is the definitive shareability map:

**Transfers to @loom/shared (zero changes needed):**

| Current File | Target Location | Why Sharable |
|-------------|-----------------|-------------|
| `types/message.ts` | `shared/types/` | Pure TS interfaces (Message, ToolCall, ThinkingBlock) |
| `types/session.ts` | `shared/types/` | Pure TS interfaces (Session, SessionMetadata) |
| `types/provider.ts` | `shared/types/` | Pure TS interfaces (ProviderId, ConnectionStatus) |
| `types/websocket.ts` | `shared/types/` | Discriminated unions (ServerMessage, ClientMessage) + `isServerMessage` guard |
| `types/stream.ts` | `shared/types/` | Pure TS interfaces |
| `types/api.ts` | `shared/types/` | API response types |
| `lib/stream-multiplexer.ts` | `shared/api/` | Pure functions, callback injection, zero React/DOM deps |

**Transfers to @loom/shared (minor refactoring needed):**

| Current File | Refactoring Required | Why |
|-------------|---------------------|-----|
| `stores/timeline.ts` | Convert to factory function, inject storage adapter | Uses `persist` middleware with `localStorage` |
| `stores/stream.ts` | None -- no persistence | Ephemeral store, no DOM deps |
| `stores/connection.ts` | Convert to factory function, inject storage adapter | Uses `persist` middleware |
| `lib/websocket-client.ts` | Inject URL resolver via constructor (remove `platform.ts` import) | Currently imports `resolveWsUrl` from platform.ts |

**Stays in apps/web (platform-specific):**

| File | Why Not Sharable |
|------|-----------------|
| `stores/ui.ts` | Sidebar state, modal state -- different navigation model on mobile |
| `stores/file.ts` | CodeMirror editor state, file tree -- desktop-only features |
| `hooks/useStreamBuffer.ts` | rAF + innerHTML + DOM mutation -- web rendering strategy |
| `hooks/useChatScroll.ts` | DOM ScrollTop, IntersectionObserver, ResizeObserver |
| `hooks/useKeyboardOffset.ts` | Capacitor keyboard events + visualViewport (irrelevant in RN) |
| `hooks/useLongPress.ts` | DOM touch events (RN has native gesture handler) |
| `hooks/useFileMentions.ts` | UI-coupled autocomplete (rebuild for RN UI) |
| `hooks/useFileTree.ts` | Desktop feature, not in v3.0 scope |
| `hooks/useGit*.ts` | Desktop feature, not in v3.0 scope |
| `hooks/useShellWebSocket.ts` | Terminal feature, not in v3.0 scope |
| `lib/platform.ts` | Capacitor detection, `import.meta.env`, `window.location` |
| `lib/streaming-markdown.ts` | DOM innerHTML converter |
| `lib/native-plugins.ts` | Capacitor plugins (dead code for RN) |
| All components | div/span/className -- fundamentally different primitives |

**Estimated code sharing:** ~35% of business logic LOC. 0% of UI components.

---

## Data Flow

### WebSocket Message Lifecycle (Shared Layer)

The beauty of the existing architecture is that the stream multiplexer is already decoupled from React. It uses callback injection, meaning the same multiplexer code works for both web and native:

```
[Backend WebSocket Frame]
    |
    | JSON: { type: "claude-response", data: { type: "assistant", message: { content: [...] } } }
    v
WebSocketClient.handleMessage()              [packages/shared/api/]
    |
    | Parses JSON, validates via isServerMessage()
    v
onMessageCb(msg: ServerMessage)              [injected callback]
    |
    v
streamMultiplexer.routeMessage(msg, cbs)     [packages/shared/api/]
    |
    | Routes based on msg.type and nested data.type
    |
    +---> cbs.onContentToken(text)           -> StreamStore
    +---> cbs.onThinkingBlock(id, text)      -> StreamStore
    +---> cbs.onToolUseStart(toolCall)       -> StreamStore
    +---> cbs.onToolResult(id, output)       -> StreamStore
    +---> cbs.onStreamEnd(sessionId, code)   -> TimelineStore
    +---> cbs.onPermissionRequest(req)       -> StreamStore
    +---> cbs.onTokenBudget(used, total)     -> StreamStore
    +---> cbs.onSessionCreated(id)           -> TimelineStore
    +---> cbs.onActiveSessions(sessions)     -> ConnectionStore
    v
[Platform-specific rendering]
```

**What changes per platform:** Only the rendering layer. The callbacks wire to the same Zustand stores, which trigger re-renders in platform-specific components.

### Token Streaming: Web vs Native

**Web (preserves existing rAF architecture):**

```
wsClient.subscribeContent(token)
    |
    v
useStreamBuffer.onToken(token)       [apps/web]
    |  Appends to bufferRef.current (pure string concat, zero React)
    v
requestAnimationFrame paint loop
    |  Reads bufferRef.current
    |  convertStreamingMarkdown(text) -> HTML string
    |  node.innerHTML = html          -> DOM mutation
    v
On isStreaming false -> true transition:
    |  onFlush(bufferRef.current)     -> TimelineStore.addMessage
```

**Native (new -- batched state flush):**

```
wsClient.subscribeContent(token)
    |
    v
useNativeStreamBuffer.onToken(token)  [apps/mobile]
    |  Appends to stringRef.current (same principle: no React re-render per token)
    |
    |  Every ~100ms OR every ~16 tokens (whichever comes first):
    |  setState(stringRef.current)    -> Triggers React re-render of active message
    v
ActiveMessage component re-renders
    |  react-native-streamdown or manual markdown -> native Text/View
    v
FlashList (inverted) maintains scroll position
    |  maintainVisibleContentPosition handles auto-scroll
    v
On isStreaming false -> true transition:
    |  flush to TimelineStore.addMessage (same as web)
```

**Key difference:** Web bypasses React entirely during streaming (rAF + innerHTML). Native MUST go through React (no innerHTML in RN), but batching to ~10 re-renders/sec instead of ~100 tokens/sec keeps performance acceptable. The 60Hz budget is 16.6ms per frame; rendering a markdown chunk takes ~2-5ms.

### Auth Flow (Identical for Both Platforms)

```
App Launch
    |
    v
Check stored JWT
    |  Web: localStorage
    |  Native: expo-secure-store (iOS Keychain)
    |
    +-- No token --> Login screen
    |                |
    |                v
    |                POST /api/auth/login or /api/auth/register
    |                |
    |                v
    |                Store JWT, proceed
    |
    +-- Has token --> GET /health (validates server reachability)
    |                |
    |                +-- 200 OK --> Connect WebSocket with ?token=jwt
    |                +-- Error --> Clear token, show login
```

Zero backend changes. The JWT auth is already platform-agnostic.

---

## Shared Code Patterns

### Pattern 1: Factory Stores with Storage Injection

The 3 stores that use `persist` middleware (timeline, connection) need platform-specific storage:

```typescript
// packages/shared/src/stores/timeline.ts
import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Message } from '../types/message';
import type { Session } from '../types/session';
import type { ProviderId } from '../types/provider';

interface TimelineState {
  sessions: Session[];
  activeSessionId: string | null;
  activeProviderId: ProviderId;
  addSession: (session: Session) => void;
  removeSession: (sessionId: string) => void;
  setActiveSession: (sessionId: string | null) => void;
  addMessage: (sessionId: string, message: Message) => void;
  updateMessage: (sessionId: string, messageId: string, updates: Partial<Message>) => void;
  // ... rest of current timeline store interface
}

export function createTimelineStore(storage: StateStorage) {
  return create<TimelineState>()(
    persist(
      immer((set) => ({
        sessions: [],
        activeSessionId: null,
        activeProviderId: 'claude' as ProviderId,
        // ... all current store actions (identical logic)
      })),
      {
        name: 'loom-timeline',
        storage: createJSONStorage(() => storage),
        partialize: (state) => ({
          sessions: state.sessions.map((s) => ({
            id: s.id,
            title: s.title,
            providerId: s.providerId,
            createdAt: s.createdAt,
            updatedAt: s.updatedAt,
            metadata: s.metadata,
          })),
          activeSessionId: state.activeSessionId,
          activeProviderId: state.activeProviderId,
        }),
      }
    )
  );
}
```

**Web wiring:**
```typescript
// apps/web/src/stores/timeline.ts
import { createTimelineStore } from '@loom/shared/stores';

export const useTimelineStore = createTimelineStore(localStorage);
```

**Native wiring (MMKV for speed):**
```typescript
// apps/mobile/src/stores/timeline.ts
import { createTimelineStore } from '@loom/shared/stores';
import { MMKV } from 'react-native-mmkv';

const mmkv = new MMKV();
const mmkvStorage = {
  getItem: (name: string) => mmkv.getString(name) ?? null,
  setItem: (name: string, value: string) => mmkv.set(name, value),
  removeItem: (name: string) => mmkv.delete(name),
};

export const useTimelineStore = createTimelineStore(mmkvStorage);
```

### Pattern 2: WebSocket Client with Injected URL Resolver

The current `WebSocketClient` imports `resolveWsUrl` from `platform.ts`. This couples it to web-specific URL resolution. Refactor to constructor injection:

```typescript
// packages/shared/src/api/websocket-client.ts
export type UrlResolver = (path: string, token: string) => string;

export class WebSocketClient {
  private resolveUrl: UrlResolver;
  // ... all existing private fields

  constructor(resolveUrl: UrlResolver) {
    this.resolveUrl = resolveUrl;
  }

  connect(token: string): void {
    this.token = token;
    this.setState('connecting');
    const url = this.resolveUrl('/ws', token);
    this.ws = new WebSocket(url);
    // ... rest of connect() unchanged
  }

  // ... all other methods unchanged
}
```

**Web wiring:**
```typescript
// apps/web/src/lib/ws-init.ts
import { WebSocketClient } from '@loom/shared/api';

function resolveWsUrl(path: string, token: string): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}${path}?token=${token}`;
}

export const wsClient = new WebSocketClient(resolveWsUrl);
```

**Native wiring:**
```typescript
// apps/mobile/src/lib/ws-init.ts
import { WebSocketClient } from '@loom/shared/api';

const SERVER = 'ws://100.86.4.57:5555';

function resolveWsUrl(path: string, token: string): string {
  return `${SERVER}${path}?token=${token}`;
}

export const wsClient = new WebSocketClient(resolveWsUrl);
```

### Pattern 3: API Client with Platform Configuration

```typescript
// packages/shared/src/api/api-client.ts
let baseUrl = '';
let getToken: () => string | null = () => null;

export function configureApi(config: {
  baseUrl: string;
  getToken: () => string | null;
}) {
  baseUrl = config.baseUrl;
  getToken = config.getToken;
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers as Record<string, string> | undefined),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}
```

**Web init:** `configureApi({ baseUrl: '', getToken: () => localStorage.getItem('token') })`
**Native init:** `configureApi({ baseUrl: 'http://100.86.4.57:5555', getToken: () => cachedToken })`

### Pattern 4: Inverted FlashList for Chat Messages

```typescript
// apps/mobile/src/components/chat/ChatMessageList.tsx
import { FlashList } from '@shopify/flash-list';
import { useTimelineStore } from '../../stores/timeline';

export function ChatMessageList({ sessionId }: { sessionId: string }) {
  const messages = useTimelineStore(
    (s) => s.sessions.find((sess) => sess.id === sessionId)?.messages ?? []
  );

  return (
    <FlashList
      data={messages}
      inverted
      renderItem={({ item }) => <ChatMessage message={item} />}
      keyExtractor={(item) => item.id}
      estimatedItemSize={120}
    />
  );
}
```

FlashList v2 is 10x faster than FlatList on JS thread via cell recycling. `inverted` renders newest at bottom. `maintainVisibleContentPosition` (enabled by default in v2) keeps scroll stable during streaming.

### Pattern 5: App Lifecycle-Aware WebSocket

```typescript
// apps/mobile/src/hooks/useAppLifecycleWebSocket.ts
import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

export function useAppLifecycleWebSocket(wsClient: WebSocketClient) {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appState.current === 'background' && nextState === 'active') {
        // Foreground: reconnect and sync state
        wsClient.tryReconnect();
      } else if (nextState === 'background') {
        // Background: disconnect gracefully (iOS kills idle WS anyway)
        wsClient.disconnect();
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, [wsClient]);
}
```

iOS suspends JS execution 5-30 seconds after backgrounding. The WebSocket will die. Explicit lifecycle management prevents stale connection state.

---

## Navigation Architecture

**Use Expo Router** (file-based routing built on React Navigation).

### Route Structure

```
app/
  _layout.tsx                 # Root: GestureHandlerRootView, providers
  (auth)/
    _layout.tsx               # Stack layout for auth screens
    login.tsx                 # Server URL + JWT login
  (app)/
    _layout.tsx               # Drawer navigator (session sidebar)
    (chat)/
      _layout.tsx             # Stack for chat screens
      index.tsx               # Active session chat view
      [id].tsx                # Specific session (deep link target)
    settings.tsx              # Settings screen
  modal/
    permission.tsx            # Permission request modal overlay
```

**Navigation pattern:** Drawer with session list + nested stack for chat screens. This matches ChatGPT iOS exactly: swipe from left edge for session sidebar, tap a session to navigate, active chat fills the screen.

**Why drawer instead of tabs:** Loom is a single-context chat app. Tab bars waste 49pt of vertical space that the composer needs. ChatGPT and Claude both use sidebar drawer navigation. Anti-Feature AF-3 in FEATURES.md explicitly rejects bottom tabs.

**Why Expo Router over bare React Navigation:** Expo Router IS React Navigation with file-based routing on top. It eliminates ~40 lines of navigator configuration. Typed routes, automatic deep linking, and React Navigation's full API are all available.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Porting Web Components to RN

**What:** Replacing `div` with `View` and `className` with `style` in copied web components.

**Why bad:** RN layout defaults differ (flexDirection: column, no CSS cascade, no pseudo-elements). The web app was designed for desktop density (1440px+ with mouse). A port will feel "too big, too web-like" -- exactly what swd flagged during Capacitor testing.

**Instead:** Design mobile screens from scratch using ChatGPT/Claude iOS as pixel-level references. Share ONLY business logic (stores, API, types). UI components are 100% new code.

### Anti-Pattern 2: react-native-web for "Universal" Components

**What:** Building components with `View`/`Text` and using react-native-web to render them on the web too.

**Why bad for this project:** The web app has 50+ polished components using Tailwind v4, Radix, DOM APIs. Converting to react-native-web primitives would degrade the web experience. This approach makes sense for greenfield; it is destructive for a mature web app.

**Instead:** Accept that web and native UI codebases are separate. Share the 35% that's sharable (stores, types, API). The two apps can look different -- they serve different contexts.

### Anti-Pattern 3: Socket.IO

**What:** Adding Socket.IO because "it's easier than raw WebSocket."

**Why bad:** The backend uses `ws` (raw WebSocket). The existing `WebSocketClient` already handles reconnection, heartbeat, content stream subscription, and backlog buffering. Adding Socket.IO means rewriting the backend protocol. React Native supports standard `WebSocket` natively.

### Anti-Pattern 4: Sharing Navigation State

**What:** Putting screen-level state (scroll position, input draft, selected tool) in shared Zustand stores.

**Why bad:** Causes stale state when navigating between screens. Expo Router manages screen lifecycle. Navigation-scoped state should live in React state or Reanimated shared values.

**Instead:** Reserve Zustand for truly global state: sessions, streaming, connection, active session.

### Anti-Pattern 5: Over-Eager Monorepo Setup

**What:** Spending 2+ days configuring the monorepo before writing any feature code.

**Why bad:** Metro bundler resolution, TypeScript project references, workspace linking, and barrel file issues can consume days. The shared code is ~10 files of types and ~5 files of logic.

**Instead:** Start simple: copy the 15 sharable files into `packages/shared/`. Validate that both Vite and Metro can import them. If workspace resolution causes issues, fall back to a plain `shared/` directory at the repo root with TypeScript path aliases. The monorepo is a packaging concern, not an architectural concern.

---

## Scalability Considerations

| Concern | At launch (v3.0, 1 user) | At v3.1+ (features grow) | If Android later |
|---------|--------------------------|---------------------------|-------------------|
| **Code sharing** | ~35% (types + stores + API) | Grows as more logic extracts | ~95% between iOS/Android |
| **Bundle size** | ~15-20MB (standard RN app) | +~2MB if Skia added for effects | Same |
| **Build time** | EAS Build: ~10min cloud, ~5min local | Metro cache effective | Add Android build target |
| **State** | 3 shared + 1 mobile UI store | Add settings to shared when needed | Same stores |
| **Navigation** | 4-5 screens | Add file view, terminal screens | Same Expo Router |
| **WebSocket** | 1 connection, single backend | Same | Same |
| **Message perf** | FlashList handles 1000+ messages | Cell recycling scales linearly | Same |

---

## Backend Integration Points

### Zero Backend Changes for Core Chat

The backend is already platform-agnostic:

1. **WebSocket auth:** `?token=<jwt>` query param -- works from any client
2. **REST auth:** `Authorization: Bearer <jwt>` -- standard HTTP
3. **CORS:** Not an issue for native apps (no Origin header sent)
4. **API contract:** 47+ endpoints in BACKEND_API_CONTRACT.md, all JSON/HTTP
5. **WebSocket protocol:** `ServerMessage` / `ClientMessage` discriminated unions, no browser assumptions

### One Backend Addition for Push Notifications (later phase)

```
POST /api/push/register     -- { pushToken: string, platform: 'ios' }
POST /api/push/unregister   -- { pushToken: string }
```

Backend changes:
1. New SQLite table: `push_tokens` (token, platform, user_id, created_at)
2. When permission request fires and no WebSocket client connected: send APNs via Expo Push API
3. Handle notification action response via existing WebSocket or new REST endpoint

This is the ONLY backend change. It belongs in a dedicated phase AFTER chat works.

---

## Shared Code Migration Plan (5 Steps)

### Step 1: Extract Types (zero risk, zero changes)

Move 6 type files from `src/src/types/` to `packages/shared/src/types/`. These are pure TypeScript interfaces with zero runtime code. Replace `@/types/` import paths with `../types/` or package imports.

Files: `message.ts`, `session.ts`, `provider.ts`, `websocket.ts`, `stream.ts`, `api.ts`

### Step 2: Extract Stream Multiplexer (low risk)

Move `stream-multiplexer.ts`. It already has zero React imports, zero store imports, and uses callback injection. The only change is import paths.

### Step 3: Extract WebSocket Client (low risk, minor refactor)

Move `websocket-client.ts`. Refactor: replace `import { resolveWsUrl } from '@/lib/platform'` with constructor-injected URL resolver (see Pattern 2 above). All other code is unchanged.

### Step 4: Extract Zustand Stores (medium risk)

Convert `timeline.ts` and `connection.ts` from singleton stores to factory functions that accept a `StateStorage` adapter. `stream.ts` moves as-is (no persistence). Move test files too.

**Risk:** The `immer` + `persist` middleware composition needs testing. Run the existing store tests against the refactored factories with an in-memory storage mock.

### Step 5: Update Web App Imports

Mechanical find-and-replace: `@/types/*` -> `@loom/shared/types/*`, `@/stores/timeline` -> local re-export that calls the factory. TypeScript compiler validates each change.

---

## Sources

### Official Documentation (HIGH confidence)
- [Expo Monorepo Guide](https://docs.expo.dev/guides/monorepos/) -- Workspace configuration, Metro auto-detection
- [Expo Router Introduction](https://docs.expo.dev/router/introduction/) -- File-based routing, layout components
- [Expo Push Notifications Setup](https://docs.expo.dev/push-notifications/push-notifications-setup/) -- APNs + EAS credentials
- [React Native Reanimated Performance](https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/) -- UI thread worklets
- [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/docs/) -- Native gesture recognizers
- [FlashList v2 Announcement](https://shopify.engineering/flashlist-v2) -- Cell recycling, maintainVisibleContentPosition
- [NativeWind v4 Docs](https://www.nativewind.dev/docs/getting-started/installation) -- Tailwind classes in RN
- [Expo SDK 55](https://expo.dev/changelog/sdk-54) -- RN 0.83, React 19.2, New Architecture only

### Competitor Architecture (HIGH confidence)
- [Discord RN Blog](https://discord.com/blog/how-discord-achieves-native-ios-performance-with-react-native) -- Custom lists, native modules
- [PLATFORM-RESEARCH.md](../phases/67.1-ios-bug-fixes/PLATFORM-RESEARCH.md) -- Full competitor analysis (ChatGPT, Claude, Slack, Telegram)

### Community / npm (MEDIUM confidence)
- [react-native-streamdown](https://github.com/software-mansion-labs/react-native-streamdown) -- v0.1.1, streaming markdown
- [Zustand + MMKV](https://github.com/mrousavy/react-native-mmkv/blob/main/docs/WRAPPER_ZUSTAND_PERSIST_MIDDLEWARE.md) -- Storage adapter pattern
- [Expo Live Activities](https://expo.dev/blog/home-screen-widgets-and-live-activities-in-expo) -- Dynamic Island from RN

### Project-Specific (HIGH confidence, audited codebase)
- `src/src/stores/` -- 5 Zustand stores: timeline, stream, ui, connection, file
- `src/src/types/` -- 13 type files defining the complete data contract
- `src/src/lib/websocket-client.ts` -- WebSocketClient with callback injection
- `src/src/lib/stream-multiplexer.ts` -- Pure function multiplexer with MultiplexerCallbacks
- `src/src/hooks/useStreamBuffer.ts` -- rAF + innerHTML streaming architecture (web-specific)
- `server/` -- Express 4, WebSocket (ws), JWT auth, 47+ REST endpoints
