# Stack Research: v2.0 "The Engine" Additions

**Project:** Loom V2
**Researched:** 2026-03-26
**Confidence:** HIGH (core stack) / MEDIUM (Capacitor/mobile) / LOW (iOS App Store specifics)

**Scope:** NEW additions only. Existing stack (Vite 7, React 19, TypeScript, Tailwind v4, Zustand 5, Vitest, better-sqlite3, Express 4, ws, chokidar 4) is validated and NOT re-researched.

---

## 1. SQLite Message Cache (Backend)

### Decision: Extend existing better-sqlite3 -- no new dependencies needed

The backend already has `better-sqlite3@^12.6.2` for auth (`server/database/db.js`). The message cache should be a **second database file** (`cache.db`, not tables crammed into `auth.db`) using the same driver. This is the standard better-sqlite3 pattern for separating concerns while sharing the same synchronous, high-performance API.

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| better-sqlite3 | ^12.6.2 (already installed) | Message/session cache DB | Synchronous API eliminates callback hell; 10-50x faster than async sqlite3 for reads; already proven in codebase |

**Why NOT add a new library:**
- `sqlite3` + `sqlite` (async wrapper) are imported in `server/projects.js` but appear **unused** beyond the import. They're dead weight from upstream CloudCLI. Don't build on them -- better-sqlite3 is faster and already powers auth.
- No need for WAL mode complexity -- single-writer (the backend process), multiple readers (same process).
- No need for a separate cache service or Redis -- message data is bounded per session and this is a single-user app.

### Schema Design Recommendation

```sql
-- New file: ~/.cloudcli/cache.db (separate from auth.db, in user data dir)

CREATE TABLE IF NOT EXISTS session_messages (
  session_id TEXT NOT NULL,
  project_path TEXT NOT NULL,            -- encoded project path
  message_index INTEGER NOT NULL,        -- ordering within session
  role TEXT NOT NULL,                     -- user/assistant/system
  content TEXT NOT NULL,                  -- full message JSON blob (entire JSONL entry)
  created_at TEXT,                        -- ISO timestamp from JSONL
  PRIMARY KEY (session_id, message_index)
);

CREATE INDEX idx_messages_project ON session_messages(project_path);

CREATE TABLE IF NOT EXISTS session_metadata (
  session_id TEXT PRIMARY KEY,
  project_path TEXT NOT NULL,
  title TEXT,
  message_count INTEGER DEFAULT 0,
  last_message_at TEXT,
  jsonl_mtime REAL,                      -- file mtime for cache invalidation
  jsonl_size INTEGER,                    -- file size for cache invalidation
  cached_at TEXT NOT NULL
);

CREATE INDEX idx_metadata_project ON session_metadata(project_path);
```

**Cache invalidation strategy:** Compare JSONL file `mtime` + `size` against cached values via a single `fs.statSync()` call. If different, re-parse and update cache. Handles both appends (active sessions) and external edits.

### Integration with Existing Code

Current slow path:
1. `GET /api/projects/:projectName/sessions/:sessionId/messages`
2. Backend reads JSONL file line-by-line via `readline.createInterface(fs.createReadStream(...))`
3. Parses every JSON line, filters non-message types, transforms, returns

Cache layer inserts between steps 1 and 2:
1. `fs.statSync()` on JSONL file -> compare against `session_metadata.jsonl_mtime/jsonl_size`
2. **Cache hit:** `SELECT * FROM session_messages WHERE session_id = ? ORDER BY message_index` (~2-5ms)
3. **Cache miss:** Parse JSONL (existing code), populate both tables, return results

**Expected speedup:** JSONL parsing of a 500-message session: 200-800ms (readline, JSON.parse per line, filtering). Cached SQLite read: <5ms. This is the difference between "feels sluggish" and "instant."

---

## 2. Live Session Attach (JSONL File Watching)

### Decision: Custom tail implementation using Node.js fs.watch + byte offset tracking -- no new dependencies

The backend already has `chokidar@^4.0.3` for project directory watching (new/deleted JSONL files). For live session attach (watching a *specific* JSONL file for new lines as Claude CLI writes them), chokidar is **overkill** -- its `awaitWriteFinish` stabilization (currently set to 2s delay in `server/index.js:182`) works *against* real-time tailing.

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Node.js `fs.watch` | Built-in (Node 22) | Watch specific JSONL file for changes | Zero dependencies; lower overhead than chokidar for single-file watch |
| `fs.createReadStream` | Built-in (Node 22) | Read only new bytes from known offset | Efficient append-only reads without re-reading entire file |

**Why NOT `node-tail` or `@logdna/tail-file`:**
- JSONL files are append-only (Claude CLI never truncates/rotates them) -- the hard problems these libraries solve (log rotation, inode changes) don't apply.
- Our use case is narrow: detect change -> read from last known byte offset -> parse new complete lines -> emit via WebSocket.
- Adding a dependency for ~30 lines of straightforward code is over-engineering.

### Implementation Pattern

```typescript
class JsonlTailer {
  private offset = 0;
  private watcher: fs.FSWatcher | null = null;

  watch(filePath: string, onNewEntries: (entries: unknown[]) => void) {
    const stat = fs.statSync(filePath);
    this.offset = stat.size; // Start from end of file (don't replay history)

    this.watcher = fs.watch(filePath, async () => {
      const newStat = fs.statSync(filePath);
      if (newStat.size <= this.offset) return;

      const stream = fs.createReadStream(filePath, {
        start: this.offset,
        end: newStat.size - 1,
        encoding: 'utf8',
      });

      let buffer = '';
      for await (const chunk of stream) buffer += chunk;
      this.offset = newStat.size;

      const entries = buffer
        .split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line));

      onNewEntries(entries);
    });
  }

  stop() {
    this.watcher?.close();
    this.watcher = null;
  }
}
```

### WebSocket Protocol Extension

New message types on the existing `/ws` WebSocket connection:

```typescript
// Client -> Server: request live attach
{ type: 'attach-session', sessionId: string, projectPath: string }

// Server -> Client: new JSONL entries as they appear in real time
{ type: 'session-update', sessionId: string, entries: JsonlEntry[] }

// Client -> Server: stop watching
{ type: 'detach-session', sessionId: string }
```

No new WebSocket endpoint needed. This extends the existing protocol.

---

## 3. State Persistence (Frontend)

### Decision: Zustand persist middleware (already in use) + sessionStorage for ephemeral state -- no new dependencies

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| zustand/middleware persist | ^5.0.12 (already installed) | Persist sidebar state, last session, preferences | Already used for timeline/ui stores; proven pattern |
| sessionStorage | Built-in | Scroll position per session | Survives refresh but not tab close -- correct semantics for scroll position |

**What gets persisted where:**

| State | Storage | Mechanism |
|-------|---------|-----------|
| Last active session ID | localStorage | Zustand persist (ui store) |
| Sidebar open/collapsed | localStorage | Zustand persist (ui store, already done) |
| Active tab per session | localStorage | Zustand persist (ui store) |
| Scroll position | sessionStorage | Manual save/restore keyed by session ID |
| Draft composer text | localStorage | Already implemented (draft persistence) |

**What NOT to persist (intentionally ephemeral):**
- Stream state -- resets on page load by design
- Connection state -- re-established on load
- Active tool calls -- ephemeral per streaming response
- Permission requests -- ephemeral, security-sensitive

No new libraries needed. This is configuration of existing infrastructure.

---

## 4. Mobile-Native UX

### Decision: CSS-only responsive improvements + native touch event handling -- no new dependencies

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| CSS `@media` queries | Built-in | Responsive breakpoints | Already using 767px breakpoint convention |
| CSS `env(safe-area-inset-*)` | Built-in | iOS notch/home indicator safe areas | PWA requirement; prevents content behind system UI |
| CSS `touch-action` | Built-in | Control touch behavior per element | Prevent double-tap zoom, optimize scroll |
| CSS `overscroll-behavior` | Built-in | Prevent pull-to-refresh bounce | Essential for app-like feel |

**Already in codebase (validated):**
- Sidebar drawer pattern with 767px breakpoint
- ComposerStatusBar component for mobile
- `overflow: hidden` on html/body (base.css)

**What's missing (all CSS or native DOM, zero libraries):**
- `<meta name="viewport" content="..., maximum-scale=1">` to prevent zoom on iOS input focus
- `touch-action: manipulation` on interactive elements (eliminates 300ms click delay)
- `env(safe-area-inset-bottom)` padding on composer for iPhone home indicator
- Swipe gesture for sidebar toggle: `touchstart`/`touchmove`/`touchend` handlers (~40 lines)
- `overscroll-behavior: none` on scroll containers to prevent pull-to-refresh

**Why NOT a gesture library (`@use-gesture/react`, `react-swipeable`):**
- We need exactly one gesture: sidebar swipe open/close.
- 40 lines of touch event handlers vs. 15KB dependency with React re-render overhead.
- Loom's streaming architecture bypasses React reconciler -- gesture libraries that trigger re-renders fight this pattern.

---

## 5. iOS App Path

### Decision: PWA first (immediate), Capacitor later (App Store distribution when features stabilize)

Two paths, pursued sequentially:

### Path A: PWA (Immediate -- one new dev dependency)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| vite-plugin-pwa | ^0.21.x | Service worker + manifest generation | Automated PWA setup for Vite; generates icons, manifest.json, service worker registration |
| workbox | (bundled with vite-plugin-pwa) | Service worker caching strategies | Industry standard; cache shell assets, not API responses |

**PWA on Loom's infrastructure is viable because:**
- Tailscale MagicDNS provides HTTPS certificates (`https://machine-name.tailNNNN.ts.net`)
- HTTPS is required for service workers and PWA install prompts
- This path was already validated in project memory ("PWA via Tailscale MagicDNS HTTPS is viable")

**PWA is sufficient for Loom because:**
- Single user, self-hosted -- no App Store discovery needed
- Primary use case is active interaction (not background notifications)
- WebSocket connection provides real-time updates when app is open
- All features are web-native (no camera, Bluetooth, NFC, GPS needed)

**PWA limitations on iOS (2026 reality):**
- Must be added to Home Screen manually (no App Store)
- Push notifications: require Home Screen install + explicit permission (iOS 16.4+)
- No background execution (app suspends when not visible)
- Storage may be evicted after 7 days of non-use
- EU users: Apple removed standalone PWA support under DMA (opens in Safari tab instead)

### Path B: Capacitor (Future -- post-v2.0)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @capacitor/core | ^8.3.0 | Native bridge | Latest stable; wraps existing Vite+React output |
| @capacitor/cli | ^8.3.0 | Build tooling | Xcode project generation |
| @capacitor/ios | ^8.3.0 | iOS platform | iOS 15.0+ deployment target |
| @capacitor/keyboard | ^8.x | Keyboard events | Handle iOS keyboard push-up behavior |
| @capacitor/status-bar | ^8.x | Status bar styling | Dark/transparent for Loom aesthetic |
| @capacitor/splash-screen | ^8.x | Launch screen | Branded loading experience |
| @capacitor/haptics | ^8.x | Haptic feedback | Tactile confirmation on actions |

**Capacitor 8 requirements (verified 2026-03-26):**
- Node.js 22+ -- we have 22.22.1 (compatible)
- Xcode 26.0+ for iOS builds (need Mac for compilation)
- iOS 15.0+ deployment target
- Uses Swift Package Manager by default (not CocoaPods)

**Why Capacitor over React Native:**
- Loom is 49K+ LOC of web-native React -- React Native would require rewriting with native components
- Capacitor wraps `dist/` output with zero code changes to existing app
- Same codebase for web, PWA, and native app
- WebSocket, CodeMirror, xterm.js all work in Capacitor's WKWebView
- Add Capacitor to existing project in hours, not weeks

**Why Capacitor over Swift native:**
- 49K LOC TypeScript rewrite to Swift is not viable for solo developer
- Feature parity maintenance across two codebases is unsustainable
- WKWebView performance is sufficient for a chat/editor/terminal app

**Timing recommendation:** Defer Capacitor to after v2.0 ships. PWA provides mobile access immediately. Capacitor is the path to App Store distribution once the feature surface is stable and final.

---

## 6. Performance Optimization

### Decision: Leverage existing tools, add targeted patterns -- no new dependencies

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| virtua | ^0.48.8 (already installed) | Virtual scrolling fallback | In package.json but unused; escape hatch if content-visibility fails at 1000+ messages |
| React.lazy + Suspense | Built-in (React 19) | Code-split heavy panels | Extend to FileTree, Terminal, GitPanel, Editor |
| Intersection Observer | Built-in | Lazy load off-screen content | Already using shared single-observer pattern |

**Existing performance infrastructure (no changes needed):**
- `content-visibility: auto` on message list (CSS-only virtualization)
- 5 vendor chunk groups (react, markdown, shiki, radix, zustand)
- Shiki LRU cache with Map iteration eviction
- Shared IntersectionObserver (element-to-messageId map)
- rAF streaming buffer (bypasses React reconciler at 60fps)

**New patterns to implement (zero new dependencies):**

| Pattern | Implementation | Impact |
|---------|----------------|--------|
| Request deduplication | `Map<string, Promise>` guard in `apiFetch()` | Prevent duplicate session/message fetches on rapid switching |
| Optimistic updates | Zustand action + error rollback | Instant UI for rename, delete, pin operations |
| Stale-while-revalidate | Return cached messages immediately, background refresh from API | Sub-second session switching |
| Lazy panel mounting | `React.lazy()` for FileTree, Terminal, GitPanel, Editor | Reduce initial JS by ~100-120KB |
| Image lazy loading | `loading="lazy"` attribute on message images | Reduce initial paint time for image-heavy conversations |
| Backend SQLite cache | See Section 1 | Sub-5ms message loads vs 200-800ms JSONL parse |

**virtua status:** Already installed (`^0.48.8`) but explicitly **not** used. MessageList.tsx comment: "No virtualization library. All messages are in the DOM but the browser skips rendering off-screen items via content-visibility: auto." Keep as fallback. Content-visibility handles the common case (100-500 messages). Virtua is the escape hatch if sessions with 1000+ messages cause scroll jank -- but that's a rare case for Loom's use pattern.

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| sql.js / wa-sqlite (client-side SQLite) | Over-engineering; Loom has a backend 10ms away | Server-side better-sqlite3 cache with HTTP responses |
| IndexedDB (for message cache) | Complex API, no SQL queries, harder to debug than SQLite | Server-side SQLite + fast API responses |
| React Native | Would require rewriting 49K LOC with native components | Capacitor (wraps existing web app as-is) |
| @use-gesture/react | 15KB for one swipe gesture | 40 lines of touch event handlers |
| node-tail / @logdna/tail-file | Solves log rotation -- JSONL files never rotate | Custom fs.watch + offset tracker (~30 lines) |
| socket.io | Heavyweight abstraction; Loom already has raw ws | Extend existing WebSocket protocol |
| Redis / Memcached | Single-user in-process app; external cache server is absurd | better-sqlite3 in-process SQLite |
| Turso / Cloudflare D1 / ElectricSQL | Distributed sync for a single-user local app | Local better-sqlite3 file |
| Flutter / Kotlin Multiplatform | Web-first app, entire UI is React/TypeScript | Capacitor or PWA |
| Service worker offline mode | Loom requires active backend + Claude API connection | PWA install + cache app shell only |
| Workbox (standalone) | vite-plugin-pwa bundles workbox already | Use through vite-plugin-pwa |

---

## Installation Plan

### v2.0 Immediate

```bash
# PWA support (frontend dev dependency)
cd /home/swd/loom/src
npm install -D vite-plugin-pwa

# That's it. No other new dependencies.
# better-sqlite3 (backend cache): already installed
# chokidar (project watching): already installed
# virtua (scroll fallback): already installed
# fs.watch (JSONL tailing): built into Node.js
```

### Post-v2.0 (iOS App)

```bash
# Run from project root
cd /home/swd/loom
npm install @capacitor/core @capacitor/cli
npx cap init "Loom" "ai.loom.app" --web-dir src/dist

# Add iOS platform
npm install @capacitor/ios
npx cap add ios

# Essential native plugins
npm install @capacitor/keyboard @capacitor/status-bar @capacitor/splash-screen @capacitor/haptics
```

---

## Version Compatibility Matrix

| Package | Compatible With | Notes |
|---------|----------------|-------|
| better-sqlite3 ^12.6.2 | Node 22.22.1 | Already working; add second DB file for cache |
| chokidar ^4.0.3 | Node 22.22.1 | Already working; project directory watching only |
| vite-plugin-pwa ^0.21.x | Vite 7.x | Generates manifest.json + service worker; **verify Vite 7 compat before installing** |
| @capacitor/core ^8.3.0 | Node 22+, Vite 7.x | Requires Xcode 26.0+ for iOS builds |
| virtua ^0.48.8 | React 18/19 | Already installed; 3KB gzip; unused fallback |

---

## Sources

- [better-sqlite3 GitHub](https://github.com/WiseLibs/better-sqlite3) -- synchronous API docs (HIGH confidence)
- [Capacitor 8 migration guide](https://capacitorjs.com/docs/updating/8-0) -- Node 22 requirement, Swift PM default (HIGH confidence)
- [Capacitor + React docs](https://capacitorjs.com/solution/react) -- Vite integration (HIGH confidence)
- [Capacitor vs React Native comparison](https://nextnative.dev/blog/capacitor-vs-react-native) -- framework tradeoffs (MEDIUM confidence)
- [chokidar v4 GitHub](https://github.com/paulmillr/chokidar) -- awaitWriteFinish behavior (HIGH confidence)
- [SQLite persistence on the web (PowerSync, Nov 2025)](https://www.powersync.com/blog/sqlite-persistence-on-the-web) -- wa-sqlite/OPFS vs sql.js comparison (MEDIUM confidence)
- [PWA iOS limitations (MagicBell, 2026)](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide) -- iOS Safari PWA constraints (MEDIUM confidence)
- [PWA on iOS complete guide (Mobiloud, 2026)](https://www.mobiloud.com/blog/progressive-web-apps-ios) -- current iOS PWA support status (MEDIUM confidence)
- [Tailscale HTTPS certificates docs](https://tailscale.com/docs/how-to/set-up-https-certificates) -- MagicDNS cert provisioning (HIGH confidence)
- [virtua npm](https://www.npmjs.com/package/virtua) -- v0.48.8, 3KB gzip (HIGH confidence)
- [Node.js fs.watch docs](https://nodejs.org/docs/latest/api/fs.html) -- file watching API (HIGH confidence)
- [node-tail GitHub](https://github.com/lucagrulla/node-tail) -- evaluated and rejected (MEDIUM confidence)
- [Offline-first frontend apps (LogRocket, 2025)](https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite/) -- client-side cache patterns (MEDIUM confidence)

---
*Stack research for: Loom v2.0 "The Engine" -- SQLite caching, live session attach, mobile/iOS, performance*
*Researched: 2026-03-26*
