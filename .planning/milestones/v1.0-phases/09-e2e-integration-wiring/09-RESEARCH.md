# Phase 9: E2E Integration Wiring + Playwright Verification - Research

**Researched:** 2026-03-06
**Domain:** Integration wiring (WebSocket init, React Router navigation), Playwright E2E testing
**Confidence:** HIGH

## Summary

Phase 9 has two distinct halves: (1) wiring 3-4 integration points that are individually functional but disconnected in the production `/chat` route, and (2) establishing Playwright E2E tests to verify these fixes and close 6 human-verification gaps from earlier phases.

The integration fixes are straightforward -- all the code exists and works (proven by ProofOfLife at `/dev/proof-of-life`), it just needs to be connected at the right call sites. The research verified the exact code locations, function signatures, and behavioral contracts for each fix. There are no unknowns in the wiring half.

The Playwright half requires a new dependency (`@playwright/test` 1.58.x), a config file using the `webServer` array option (to start both Vite dev server and backend), and 6 test files covering streaming, session switching, new chat, tool calls, thinking blocks, and scroll anchor. Playwright's native WebSocket inspection API (`page.on('websocket')`, `ws.waitForEvent('framereceived')`) handles real-backend WebSocket streaming assertions without mocking. CLS measurement uses `PerformanceObserver` via `page.evaluate()` with the Layout Instability API.

**Primary recommendation:** Split into 2 plans -- Plan 1 for the 4 integration fixes (small, surgical code changes), Plan 2 for Playwright setup + E2E test suite.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Call `initializeWebSocket()` in `main.tsx` before `createRoot()`, fire-and-forget (no await)
- Add `useNavigate()` + `navigate(\`/chat/${sessionId}\`)` directly in SessionList's `handleSessionClick`
- Do NOT use `useSessionSwitch` from SessionList (would double-fetch)
- ChatComposer: create local stub session before sending WS command, add optimistic message to it
- When `session-created` fires, reconcile stub with real session ID
- `projects_updated`: add `onProjectsUpdated` callback to MultiplexerCallbacks, wire in websocket-init.ts to trigger session list refetch
- Real backend for Playwright (not mocked WebSocket)
- Config at `src/playwright.config.ts`, tests in `src/e2e/`
- CLS assertion via `page.evaluate` measuring scrollHeight delta during ActiveMessage finalization
- 6 test areas: streaming, session switching, new chat, tool calls, thinking blocks, scroll anchor

### Claude's Discretion
- Playwright dependency management (which package, version)
- Exact test file organization within src/e2e/
- Whether to use Playwright's built-in webServer config or manual server management
- Error message content for connection failures
- projects_updated refetch debouncing (if needed)

### Deferred Ideas (OUT OF SCOPE)
- projects_updated incremental updates (just refetch for now)
- Playwright visual regression testing (screenshot comparison)
- Performance benchmarks in E2E (token throughput measurement)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| STRM-01 | WebSocket client connects to backend with auto-reconnect | Integration fix: initializeWebSocket() in main.tsx wires wsClient to production route |
| STRM-02 | Stream multiplexer routes messages to channels | Integration fix: same wsClient init -- multiplexer already works, just needs connection |
| STRM-03 | useStreamBuffer rAF token accumulation | E2E verification: Playwright streaming test proves rAF buffer works end-to-end |
| NAV-01 | Sidebar renders with grouped sessions, clicking updates URL | Integration fix: SessionList.handleSessionClick + navigate(); E2E: session switching test |
| NAV-02 | Session click loads messages, URL updates, loading state visible | Integration fix: navigate() triggers ChatView URL reaction; E2E: session switching + new chat tests |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @playwright/test | 1.58.x | E2E testing framework | Industry standard for browser E2E, native WebSocket inspection, cross-browser support |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| playwright chromium | (bundled) | Chromium browser for tests | Default browser, only one needed for this project |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @playwright/test | Cypress | Cypress has no native WebSocket frame inspection; would need cy-websocket plugin. Playwright is superior here. |
| Real backend testing | Mock WebSocket | Mocking defeats E2E purpose; real backend already exists and works |

**Installation:**
```bash
cd src && npm install -D @playwright/test && npx playwright install chromium
```

Note: Only install `chromium` browser, not all browsers. This is a single-developer tool, not a cross-browser product. Saves ~500MB of browser downloads.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── playwright.config.ts       # Playwright config with webServer array
├── e2e/
│   ├── streaming.spec.ts      # WebSocket streaming on /chat route
│   ├── session-switching.spec.ts  # Sidebar click -> message load
│   ├── new-chat.spec.ts       # New chat optimistic message flow
│   ├── tool-calls.spec.ts     # ToolChip rendering during streaming
│   ├── thinking.spec.ts       # ThinkingDisclosure during streaming
│   └── scroll-anchor.spec.ts  # Auto-scroll + disengage + pill
├── src/
│   ├── main.tsx               # + initializeWebSocket() call
│   ├── lib/
│   │   ├── stream-multiplexer.ts  # + onProjectsUpdated callback
│   │   └── websocket-init.ts      # + projects_updated wiring
│   └── components/
│       ├── sidebar/SessionList.tsx # + useNavigate() + navigate()
│       └── chat/composer/ChatComposer.tsx # + optimistic stub session
```

### Pattern 1: Fire-and-Forget WebSocket Init in main.tsx
**What:** Call `initializeWebSocket()` before `createRoot()`, no await
**When to use:** Infrastructure that must run before React tree but shouldn't block rendering
**Example:**
```typescript
// src/src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeWebSocket } from '@/lib/websocket-init';
import '@/styles/index.css';
import { App } from '@/App';

// Fire-and-forget: connection store tracks state reactively.
// isInitialized guard handles idempotency. No await because:
// - No white screen while connecting
// - Components react to connection state naturally
// - Backend-down doesn't block app render
void initializeWebSocket();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```
**Source:** CONTEXT.md locked decision. `void` prefix satisfies TypeScript no-floating-promises rule.

### Pattern 2: Direct Navigate in SessionList (No useSessionSwitch)
**What:** SessionList adds `useNavigate()` and calls `navigate()` in handleSessionClick
**When to use:** When the navigation target component already reacts to URL changes
**Example:**
```typescript
// In SessionList.tsx handleSessionClick:
import { useNavigate } from 'react-router-dom';
// ...
const navigate = useNavigate();

const handleSessionClick = useCallback(
  (sessionId: string) => {
    setActiveSession(sessionId);
    navigate(`/chat/${sessionId}`);
  },
  [setActiveSession, navigate],
);
```
**Why not useSessionSwitch:** ChatView already has a `useEffect` that detects URL changes via `useParams()` and calls `switchSession()`. Using `useSessionSwitch` from SessionList would double-fetch messages. SessionList owns navigation intent; ChatView owns reaction to URL change.

### Pattern 3: Optimistic Stub Session for New Chat
**What:** When no sessionId exists, ChatComposer creates a local stub session before sending the WS command
**When to use:** First message in a new conversation needs immediate visual feedback
**Example:**
```typescript
// In ChatComposer.handleSend, when sessionId is null:
const stubId = 'stub-' + Math.random().toString(36).slice(2, 10);
// 1. Add stub session to timeline store
addSession({
  id: stubId,
  title: trimmed.slice(0, 50),
  messages: [],
  providerId: 'claude',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null },
});
// 2. Add optimistic user message to stub session
addMessage(stubId, userMessage);
// 3. Navigate to stub session
navigate(`/chat/${stubId}`);
// 4. When session-created fires, reconcile:
//    - websocket-init.ts onSessionCreated already adds real session
//    - Need to migrate messages from stub to real session
//    - Remove stub session
```
**Reconciliation approach:** The `onSessionCreated` callback in websocket-init.ts already adds the real session. The reconciliation needs to copy messages from stub to real session, set active session to real ID, remove stub, and update URL.

### Pattern 4: Playwright webServer Array Config
**What:** Use Playwright's built-in `webServer` option to manage both dev servers
**When to use:** Always for E2E tests -- Playwright handles startup, port checking, and teardown
**Example:**
```typescript
// src/playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  webServer: [
    {
      command: 'npm run dev',
      url: 'http://localhost:5184',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: 'cd .. && npm run server',
      url: 'http://localhost:5555/api/auth/status',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
  use: {
    baseURL: 'http://localhost:5184',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
```
**Source:** [Playwright webServer docs](https://playwright.dev/docs/test-webserver)

### Pattern 5: WebSocket Frame Inspection in Playwright
**What:** Capture and assert on WebSocket frames using Playwright's native API
**When to use:** E2E tests that need to verify streaming messages arrive
**Example:**
```typescript
// Capture WebSocket connection established by the page
const wsPromise = page.waitForEvent('websocket');
await page.goto('/chat');
const ws = await wsPromise;

// Wait for a specific frame type
const framePromise = ws.waitForEvent('framereceived', {
  predicate: (event) => {
    const data = JSON.parse(event.payload as string);
    return data.type === 'claude-response';
  },
  timeout: 30_000,
});

// Trigger a message send
await page.fill('[aria-label="Message input"]', 'Hello');
await page.click('[aria-label="Send message"]');

// Assert frame arrived
const frame = await framePromise;
expect(frame.payload).toBeTruthy();
```
**Source:** [Playwright WebSocket API](https://playwright.dev/docs/api/class-websocket)

### Pattern 6: CLS Measurement via PerformanceObserver
**What:** Use Layout Instability API inside `page.evaluate()` to measure layout shift
**When to use:** Asserting zero CLS during ActiveMessage finalization handoff
**Example:**
```typescript
// Inject CLS observer before streaming starts
await page.evaluate(() => {
  (window as Record<string, unknown>).__cls = 0;
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!(entry as PerformanceEntry & { hadRecentInput: boolean }).hadRecentInput) {
        (window as Record<string, unknown>).__cls =
          ((window as Record<string, unknown>).__cls as number) +
          (entry as PerformanceEntry & { value: number }).value;
      }
    }
  });
  observer.observe({ type: 'layout-shift', buffered: true });
});

// ... trigger streaming and wait for finalization ...

// Assert CLS
const cls = await page.evaluate(() => (window as Record<string, unknown>).__cls);
expect(cls).toBeLessThan(0.1);
```
**Source:** [Checkly CLS measurement guide](https://www.checklyhq.com/docs/learn/playwright/performance/), [web.dev CLS docs](https://web.dev/articles/cls)

### Anti-Patterns to Avoid
- **Mocking WebSocket in E2E tests:** Defeats the entire purpose. The real backend is right there on port 5555.
- **Putting initializeWebSocket() in App.tsx useEffect:** Error boundaries don't catch useEffect errors, muddies separation between infrastructure and React tree.
- **Using useSessionSwitch in SessionList:** Double-fetch since ChatView already reacts to URL changes via useParams().
- **Awaiting initializeWebSocket() before render:** Blocks app render if backend is down, showing white screen.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Browser E2E tests | Custom puppeteer scripts | @playwright/test | Built-in assertions, auto-wait, WebSocket inspection, webServer management |
| WebSocket frame assertions | Manual frame buffer tracking | `ws.waitForEvent('framereceived')` | Playwright's native API handles timing, predicates, timeouts |
| CLS measurement | scrollHeight delta tracking | PerformanceObserver Layout Instability API | Browser-native, handles all sources of layout shift, not just height |
| Server lifecycle management | shell scripts to start/stop servers | Playwright webServer config | Handles port checking, startup wait, reuse existing, cleanup |

**Key insight:** Playwright 1.58.x has first-class WebSocket support. No plugins, no workarounds. The `page.on('websocket')` / `ws.waitForEvent('framereceived')` API is exactly what this use case needs.

## Common Pitfalls

### Pitfall 1: Auth State Between Tests
**What goes wrong:** Tests share localStorage/cookies, so the first test registers/logs in, and subsequent tests find stale tokens.
**Why it happens:** Playwright uses persistent browser contexts by default within a test file.
**How to avoid:** Use `page.evaluate(() => localStorage.clear())` in `beforeEach`, or configure `storageState` in Playwright config. The bootstrapAuth() auto-registration handles fresh starts.
**Warning signs:** Tests pass individually but fail when run together; "token expired" or "user already exists" errors.

### Pitfall 2: WebSocket Connection Race
**What goes wrong:** Test tries to send a message before WebSocket connection is established.
**Why it happens:** `initializeWebSocket()` is fire-and-forget; connection is async.
**How to avoid:** Wait for connection indicator in the UI, or use `page.waitForEvent('websocket')` to confirm WebSocket is established before interacting with the chat.
**Warning signs:** `wsClient.send()` returns `false`, test sees empty chat.

### Pitfall 3: Streaming Timeout in E2E
**What goes wrong:** Claude SDK takes longer than expected to respond, test times out.
**Why it happens:** Real backend means real API calls to Anthropic. Response time varies.
**How to avoid:** Use generous timeouts (30s+) for streaming assertions. Consider using a simple prompt ("Write 'hello'") that produces minimal output. The `CLAUDECODE` env var must be unset for the backend (server/load-env.js already handles this).
**Warning signs:** Tests pass locally but fail intermittently; timeout errors on `waitForEvent`.

### Pitfall 4: Stub Session ID Reconciliation
**What goes wrong:** Messages added to stub session are lost when real session ID arrives.
**Why it happens:** The `onSessionCreated` callback adds a NEW session with the real ID, but the optimistic user message is on the stub session.
**How to avoid:** In the reconciliation logic: (1) copy messages from stub to real session, (2) set activeSession to real ID, (3) remove stub, (4) navigate to `/chat/${realSessionId}`.
**Warning signs:** User's first message disappears when assistant response starts streaming.

### Pitfall 5: CLS False Negatives
**What goes wrong:** CLS observer reports 0 even when layout shift occurs.
**Why it happens:** PerformanceObserver only captures layout shifts that affect visual viewport. If the shifted element is below the fold or the test doesn't scroll, shifts may not register.
**How to avoid:** Ensure the ActiveMessage is visible in viewport when finalization occurs. Scroll to the streaming area first. Also consider measuring `scrollHeight` delta as a secondary check.
**Warning signs:** CLS test always passes even when visual shift is visible.

### Pitfall 6: Strict Mode Double-Init
**What goes wrong:** `initializeWebSocket()` called twice due to React StrictMode double-render.
**Why it happens:** StrictMode remounts components in development.
**How to avoid:** Already handled -- `isInitialized` guard in websocket-init.ts prevents double connection. Since we're calling it in main.tsx (outside React), StrictMode doesn't affect it at all. This is a non-issue but worth noting.

## Code Examples

### Integration Fix 1: main.tsx WebSocket Init
```typescript
// Source: verified against src/src/main.tsx and src/src/lib/websocket-init.ts
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeWebSocket } from '@/lib/websocket-init';
import '@/styles/index.css';
import { App } from '@/App';

void initializeWebSocket();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

### Integration Fix 2: SessionList Navigate
```typescript
// Source: verified against src/src/components/sidebar/SessionList.tsx lines 15-53
import { useNavigate } from 'react-router-dom';
// ... existing imports ...

export function SessionList() {
  // ... existing code ...
  const navigate = useNavigate();

  const handleSessionClick = useCallback(
    (sessionId: string) => {
      setActiveSession(sessionId);
      navigate(`/chat/${sessionId}`);
    },
    [setActiveSession, navigate],
  );
  // ... rest unchanged ...
}
```

### Integration Fix 3: projects_updated Wiring
```typescript
// stream-multiplexer.ts: Add callback to interface
export interface MultiplexerCallbacks {
  // ... existing callbacks ...
  onProjectsUpdated: () => void;
}

// stream-multiplexer.ts: Route the event
case 'projects_updated':
  callbacks.onProjectsUpdated();
  break;

// websocket-init.ts: Wire the callback
onProjectsUpdated: () => {
  // Re-fetch session list. useSessionList hook uses apiFetch internally,
  // but it only runs on mount. We need a different approach.
  // Option A: window custom event that useSessionList listens for
  // Option B: Module-level refetch function exported from useSessionList
  // Recommendation: Simple window event -- minimal coupling
  window.dispatchEvent(new CustomEvent('loom:projects-updated'));
},
```

### Integration Fix 4: ChatComposer Optimistic New Chat
```typescript
// Source: verified against src/src/components/chat/composer/ChatComposer.tsx line 67
// The fix: when sessionId is null, create a stub session before sending

const handleSend = useCallback(() => {
  const trimmed = input.trim();
  if (!trimmed || isStreaming) return;

  let effectiveSessionId = sessionId;

  if (!effectiveSessionId) {
    // Create optimistic stub session
    const stubId = 'stub-' + Math.random().toString(36).slice(2, 10);
    addSession({
      id: stubId,
      title: trimmed.slice(0, 50),
      messages: [],
      providerId: 'claude',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null },
    });
    effectiveSessionId = stubId;
    navigate(`/chat/${stubId}`);
  }

  // Add optimistic user message
  const userMessage: Message = { /* ... */ };
  addMessage(effectiveSessionId, userMessage);

  // Send WS command (no sessionId = new chat on backend)
  wsClient.send({
    type: 'claude-command',
    command: trimmed,
    options: {
      projectPath: projectName,
      ...(sessionId ? { sessionId } : {}),  // Don't send stub ID to backend
    },
  });

  setInput('');
  requestAnimationFrame(() => inputRef.current?.focus());
}, [/* deps */]);
```

### Playwright Config
```typescript
// src/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,  // Sequential -- tests share backend state
  retries: 1,
  workers: 1,            // Single worker -- real backend can't handle parallel
  reporter: 'html',
  timeout: 60_000,       // Real API calls need generous timeouts

  use: {
    baseURL: 'http://localhost:5184',
    trace: 'on-first-retry',
    video: 'on-first-retry',
  },

  webServer: [
    {
      command: 'cd .. && npm run server',
      url: 'http://localhost:5555/api/auth/status',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      stdout: 'pipe',
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:5184',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      stdout: 'pipe',
    },
  ],

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

### Streaming E2E Test Pattern
```typescript
// src/e2e/streaming.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Streaming on /chat', () => {
  test('sends message and receives streaming response', async ({ page }) => {
    // Navigate and wait for WebSocket
    const wsPromise = page.waitForEvent('websocket');
    await page.goto('/chat');
    const ws = await wsPromise;

    // Confirm connection established
    await expect(ws.url()).toContain('/ws?token=');

    // Wait for session list to load (sidebar ready)
    await page.waitForSelector('[aria-label="Chat sessions"]');

    // Send a message
    const input = page.locator('[aria-label="Message input"]');
    await input.fill('Say the word hello');
    await page.click('[aria-label="Send message"]');

    // Wait for streaming content to appear
    await expect(page.locator('[data-testid="active-message"]')).toBeVisible({
      timeout: 30_000,
    });

    // Wait for streaming to complete (active-message finalization)
    await expect(page.locator('[data-testid="streaming-cursor"]')).toBeHidden({
      timeout: 60_000,
    });

    // Verify assistant message is in the finalized list
    const messages = page.locator('[data-testid="message-container"]');
    await expect(messages).toHaveCount(2, { timeout: 5_000 }); // user + assistant
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Playwright `page.on('websocket')` only | WebSocketRoute for mocking + native inspection for real | v1.48 (2024) | Can mock OR inspect -- we use inspect for E2E |
| Cypress for React E2E | Playwright standard for new projects | 2024-2025 | Better WebSocket support, faster, native auto-wait |
| Manual server start/stop scripts | `webServer` config with health check | Playwright 1.x | Handles lifecycle, port detection, reuse |
| Custom CLS tracking with scrollHeight | PerformanceObserver Layout Instability API | Chrome 77+ | Browser-native, captures all shift sources |

**Deprecated/outdated:**
- `experimentalWebSocketInspection` flag: No longer needed in Playwright 1.48+; WebSocket inspection is built-in.

## Open Questions

1. **Stub Session Reconciliation Complexity**
   - What we know: When `session-created` fires, we need to migrate messages from stub to real session, update activeSession, remove stub, and update URL
   - What's unclear: Whether the URL update (`navigate(\`/chat/${realId}\`)`) will cause ChatView's useEffect to fire and double-fetch messages
   - Recommendation: Use `navigate(\`/chat/${realId}\`, { replace: true })` to avoid history pollution, and check if activeSessionId already matches before triggering switchSession

2. **projects_updated Callback Coupling**
   - What we know: The multiplexer is pure functions with callback injection -- clean. The session list fetch is in useSessionList hook via useEffect.
   - What's unclear: Best way to trigger a refetch from outside React (the multiplexer callback runs in wsClient's onMessage handler, not in a React component)
   - Recommendation: Use `window.dispatchEvent(new CustomEvent('loom:projects-updated'))` and add a `useEffect` listener in useSessionList. Alternatively, add a `refetchSessions` action to the timeline store that the hook watches. The window event approach has less coupling.

3. **E2E Test Isolation**
   - What we know: Tests share a real backend with real state (SQLite database)
   - What's unclear: Whether tests create sessions that pollute subsequent test runs
   - Recommendation: Each test run starts fresh by using a unique project name or by clearing localStorage before each test. The backend auto-registers on first boot; subsequent runs use existing credentials. Tests should be written to not depend on clean slate.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | @playwright/test 1.58.x |
| Config file | `src/playwright.config.ts` |
| Quick run command | `cd src && npx playwright test --grep @smoke` |
| Full suite command | `cd src && npx playwright test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| STRM-01 | WebSocket connects on /chat | e2e | `cd src && npx playwright test streaming.spec.ts` | Wave 0 |
| STRM-02 | Multiplexer routes content/thinking/tool | e2e | `cd src && npx playwright test streaming.spec.ts` | Wave 0 |
| STRM-03 | rAF buffer renders streaming tokens | e2e | `cd src && npx playwright test streaming.spec.ts` | Wave 0 |
| NAV-01 | Sidebar click updates URL | e2e | `cd src && npx playwright test session-switching.spec.ts` | Wave 0 |
| NAV-02 | Session switch loads messages | e2e | `cd src && npx playwright test session-switching.spec.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** Integration fix unit tests (existing vitest suite)
- **Per wave merge:** `cd src && npx playwright test`
- **Phase gate:** Full Playwright suite green + existing Vitest suite green

### Wave 0 Gaps
- [ ] `src/playwright.config.ts` -- Playwright config file
- [ ] `src/e2e/streaming.spec.ts` -- Streaming E2E test
- [ ] `src/e2e/session-switching.spec.ts` -- Session switching E2E test
- [ ] `src/e2e/new-chat.spec.ts` -- New chat flow E2E test
- [ ] `src/e2e/tool-calls.spec.ts` -- Tool call display E2E test
- [ ] `src/e2e/thinking.spec.ts` -- Thinking blocks E2E test
- [ ] `src/e2e/scroll-anchor.spec.ts` -- Scroll anchor E2E test
- [ ] Framework install: `cd src && npm install -D @playwright/test && npx playwright install chromium`

## Sources

### Primary (HIGH confidence)
- [Playwright webServer docs](https://playwright.dev/docs/test-webserver) - Configuration for managing dev servers
- [Playwright WebSocket API](https://playwright.dev/docs/api/class-websocket) - Frame inspection, waitForEvent
- [Playwright network docs](https://playwright.dev/docs/network#websockets) - WebSocket capture via page.on('websocket')
- Codebase verification: main.tsx, websocket-init.ts, SessionList.tsx, ChatComposer.tsx, stream-multiplexer.ts, ChatView.tsx -- all read and analyzed

### Secondary (MEDIUM confidence)
- [Checkly CLS measurement guide](https://www.checklyhq.com/docs/learn/playwright/performance/) - PerformanceObserver pattern in Playwright
- [web.dev CLS docs](https://web.dev/articles/cls) - CLS thresholds and measurement API
- [@playwright/test npm](https://www.npmjs.com/package/@playwright/test) - Version 1.58.2 confirmed current

### Tertiary (LOW confidence)
- None -- all findings verified against primary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Playwright is the clear choice; version verified on npm
- Architecture: HIGH - All integration fix points verified against actual source code; Playwright patterns from official docs
- Pitfalls: HIGH - Based on direct code analysis of auth flow, WebSocket lifecycle, and React strict mode behavior
- CLS measurement: MEDIUM - PerformanceObserver approach from official docs, but CLS in headless Chromium may behave differently than user browsers

**Research date:** 2026-03-06
**Valid until:** 2026-04-06 (stable -- Playwright and project code both well-understood)
