# Architecture Research: SQLite Data Layer, Live Session Attach, iOS App

**Domain:** AI chat client data layer + mobile app architecture
**Researched:** 2026-03-26
**Confidence:** HIGH (data layer, live attach) / MEDIUM (iOS app paths)

## System Overview

### Current Architecture (Before)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend (React 19)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ timeline │  │  stream  │  │    ui    │  │   file   │           │
│  │  store   │  │  store   │  │  store   │  │  store   │           │
│  └────┬─────┘  └────┬─────┘  └──────────┘  └──────────┘           │
│       │              │                                             │
│  useSessionSwitch    │  stream-multiplexer                        │
│       │              │        │                                    │
│  apiFetch(REST)  WebSocket(/ws)                                   │
└───────┼──────────────┼────────────────────────────────────────────┘
        │              │
┌───────┼──────────────┼────────────────────────────────────────────┐
│       ▼              ▼           Backend (Express 4 + ws)         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                        │
│  │projects.js│  │claude-sdk│  │  db.js   │                        │
│  │(JSONL I/O)│  │ (Agent)  │  │(auth.db) │                        │
│  └────┬─────┘  └──────────┘  └──────────┘                        │
│       │                                                           │
│  ~/.claude/projects/-project-name/*.jsonl  (646MB for loom)       │
│  383 files, 140K lines, read on every session load                │
└───────────────────────────────────────────────────────────────────┘
```

**Problem:** Every session load reads raw JSONL files (line-by-line parse of potentially hundreds of KB). The loom project alone has 383 JSONL files totaling 646MB. Session list refresh re-scans all files. No caching layer exists between JSONL and REST response.

### Target Architecture (After)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend (React 19)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ timeline │  │  stream  │  │    ui    │  │   file   │           │
│  │  store   │  │  store   │  │  store   │  │  store   │           │
│  └────┬─────┘  └────┬─────┘  └──────────┘  └──────────┘           │
│       │              │                                             │
│  useSessionSwitch    │  stream-multiplexer                        │
│       │              │        │                                    │
│  apiFetch(REST)  WebSocket(/ws)                                   │
│       │              │     ┌──────────────┐                       │
│       │              ├─────│ live-session  │  <── NEW WS channel  │
│       │              │     │  messages     │                       │
│       │              │     └──────────────┘                       │
└───────┼──────────────┼────────────────────────────────────────────┘
        │              │
┌───────┼──────────────┼────────────────────────────────────────────┐
│       ▼              ▼           Backend (Express 4 + ws)         │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐                    │
│  │projects.js│  │claude-sdk│  │  db.js        │                   │
│  │(JSONL→SQL)│  │ (Agent)  │  │  auth.db      │                   │
│  └────┬─────┘  └──────────┘  │  messages.db  │── NEW             │
│       │                       └──────────────┘                    │
│       │         ┌────────────────┐                                │
│       └────────►│  MessageCache  │◄── NEW module                  │
│                 │  (SQLite R/W)  │                                │
│                 └───────┬────────┘                                │
│                         │                                         │
│                 ┌───────▼────────┐                                │
│                 │ SessionWatcher │◄── NEW module                  │
│                 │ (JSONL tail)   │                                │
│                 └───────┬────────┘                                │
│                         │                                         │
│  ~/.claude/projects/-project-name/*.jsonl  (source of truth)      │
└───────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

### New Components

| Component | Responsibility | Location |
|-----------|----------------|----------|
| **MessageCache** | SQLite read/write for session metadata + messages. Handles cache invalidation, indexing, bulk import from JSONL. | `server/cache/message-cache.js` |
| **SessionWatcher** | Tails active JSONL files for new appended lines. Emits parsed entries to subscribers (WebSocket broadcast). | `server/cache/session-watcher.js` |
| **CacheWarmer** | Background process that indexes un-cached JSONL files into SQLite on startup and incrementally on file changes. | `server/cache/cache-warmer.js` |

### Modified Components

| Component | Current | Change |
|-----------|---------|--------|
| **projects.js** `getSessionMessages()` | Reads JSONL, parses line-by-line, filters by sessionId | Check SQLite cache first; fall back to JSONL on cache miss; write to cache after JSONL read |
| **projects.js** `getSessions()` | Reads all JSONL files, parses all sessions | Check SQLite for session list; fall back to JSONL scan on first load |
| **projects.js** `parseJsonlSessions()` | Returns session metadata from JSONL | Also writes parsed metadata to SQLite cache as side-effect |
| **server/index.js** `setupProjectsWatcher()` | Watches for new/deleted JSONL files (ignores `change` events) | Add SessionWatcher for `change` events on active session files |
| **websocket-init.ts** | Routes `claude-response`, `claude-complete`, etc. | Add `live-session-data` message type for attached sessions |
| **stream-multiplexer.ts** | Routes SDK messages to store callbacks | Add `onLiveSessionMessage` callback for non-owned session data |

### Unchanged Components

| Component | Why Unchanged |
|-----------|---------------|
| **claude-sdk.js** | Continues to manage SDK sessions. MessageCache is downstream. |
| **db.js** (auth.db) | Separate concern. Message cache uses its own database file. |
| **timeline store** | Already handles `prependMessages()` and `addMessage()`. |
| **stream store** | Already handles live streaming state. |
| **useSessionSwitch** | Only change is: REST endpoint returns faster (SQLite vs JSONL). |

---

## Architectural Patterns

### Pattern 1: Write-Through Cache with JSONL as Source of Truth

**What:** SQLite caches parsed JSONL data. JSONL files remain the canonical source. Cache is always rebuildable by re-reading JSONL. The backend never writes to JSONL (only Claude CLI does).

**When to use:** Loom's relationship with JSONL files is read-only. Claude CLI owns the files. We cannot switch to SQLite-primary without breaking Claude CLI compatibility.

**Trade-offs:**
- Pro: Zero risk to existing Claude CLI sessions
- Pro: Cache can be deleted and rebuilt at any time
- Con: Must handle cache staleness (new JSONL entries not yet in SQLite)
- Con: Two sources means potential consistency issues

**Implementation:**

```javascript
// server/cache/message-cache.js
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = path.join(__dirname, '..', 'database', 'messages.db');
const db = new Database(DB_PATH);

// WAL mode for concurrent reads during writes
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = -64000');  // 64MB cache
db.pragma('temp_store = MEMORY');
```

**Cache lookup with JSONL fallback:**

```javascript
function getSessionMessages(projectName, sessionId, limit, offset) {
  // 1. Check cache
  const cached = db.prepare(`
    SELECT raw_json FROM messages
    WHERE session_id = ? AND project_name = ?
    ORDER BY timestamp ASC
  `).all(sessionId, projectName);

  if (cached.length > 0) {
    const messages = cached.map(row => JSON.parse(row.raw_json));
    return paginate(messages, limit, offset);
  }

  // 2. Cache miss -- read JSONL (existing code path)
  // 3. Write to cache (non-blocking via process.nextTick)
}
```

### Pattern 2: Byte-Offset JSONL Tailing

**What:** Track the last-read byte position in each JSONL file. On file change notification, open a ReadStream starting at that byte offset, read only new lines, parse them, and emit to subscribers.

**When to use:** For live session attach -- watching an active JSONL file being appended to by Claude CLI.

**Trade-offs:**
- Pro: Only reads new data (not entire file)
- Pro: Works with Node.js `fs.createReadStream({ start: offset })`
- Pro: Stateless -- if offset is lost, re-read from 0 (full cache rebuild)
- Con: File rotation/truncation breaks assumptions (Claude CLI doesn't do this)
- Con: Partial line at EOF requires buffering

**Implementation:**

```javascript
// server/cache/session-watcher.js
import { watch, statSync, createReadStream } from 'fs';
import { stat } from 'fs/promises';
import readline from 'readline';
import { EventEmitter } from 'events';

class SessionWatcher extends EventEmitter {
  constructor() {
    super();
    this.watched = new Map(); // filePath -> { offset, sessionId, watcher }
  }

  watch(filePath, sessionId) {
    const fileSize = statSync(filePath).size;
    const fsWatcher = watch(filePath, async (eventType) => {
      if (eventType === 'change') {
        await this.readNewLines(filePath);
      }
    });
    this.watched.set(filePath, { offset: fileSize, sessionId, watcher: fsWatcher });
  }

  async readNewLines(filePath) {
    const state = this.watched.get(filePath);
    if (!state) return;

    const currentSize = (await stat(filePath)).size;
    if (currentSize <= state.offset) return;

    const stream = createReadStream(filePath, {
      start: state.offset,
      encoding: 'utf8'
    });
    const rl = readline.createInterface({ input: stream });
    const newEntries = [];

    for await (const line of rl) {
      if (line.trim()) {
        try { newEntries.push(JSON.parse(line)); } catch { /* skip */ }
      }
    }

    state.offset = currentSize;
    if (newEntries.length > 0) {
      this.emit('entries', { sessionId: state.sessionId, filePath, entries: newEntries });
    }
  }

  unwatch(filePath) {
    const state = this.watched.get(filePath);
    if (state?.watcher) state.watcher.close();
    this.watched.delete(filePath);
  }
}
```

**Why `fs.watch` over chokidar for live tailing:**

Chokidar is already used for project-level file discovery (new/deleted files). For live tailing of a specific known file, `fs.watch` is simpler and lower overhead. Chokidar's `awaitWriteFinish` (stabilityThreshold: 2000ms in the existing setup) adds latency that defeats live streaming. Use `fs.watch` with inotify for immediate change notifications, then read only new bytes.

### Pattern 3: WebSocket Channel Multiplexing for Live Attach

**What:** Reuse the existing WebSocket connection (`/ws`) with a new message type for live session data from JSONL file tailing. No new WebSocket endpoint needed.

**When to use:** When a user views a session that's being actively written to by Claude CLI (not by Loom's own SDK connection).

**Trade-offs:**
- Pro: No new WebSocket connections
- Pro: Reuses existing multiplexer infrastructure
- Con: Must distinguish between "owned stream" (Loom spawned it) and "attached stream" (CLI spawned it)

**Message types added to existing protocol:**

```typescript
// Client -> Server: Subscribe to live updates for a session
interface AttachSession {
  type: 'attach-session';
  projectName: string;
  sessionId: string;
}

// Client -> Server: Unsubscribe from live updates
interface DetachSession {
  type: 'detach-session';
  sessionId: string;
}

// Server -> Client: New entries from JSONL file watching
interface LiveSessionData {
  type: 'live-session-data';
  sessionId: string;
  entries: BackendEntry[];  // Same shape as REST message response
}
```

---

## Data Flow

### Flow 1: Session List Load (Optimized Path)

```
[Sidebar mounts]
    ↓
[useMultiProjectSessions] → GET /api/projects
    ↓
[projects.js] → SELECT * FROM sessions WHERE project_name = ?
    ↓                    (SQLite, <5ms)
[Response with session list]
    ↓
    │  On cache miss (first load or new project):
    ↓
[projects.js] → parseJsonlSessions() → INSERT INTO sessions
    ↓                                     (JSONL parse, then cache)
[Response with session list]
```

**Expected improvement:** Session list load from ~500ms (383 JSONL stat + parse) to <10ms (single SQLite query with index on project_name).

### Flow 2: Session Messages Load (Cache Hit)

```
[User clicks session in sidebar]
    ↓
[useSessionSwitch] → GET /api/projects/:name/sessions/:id/messages
    ↓
[projects.js] → SELECT raw_json FROM messages WHERE session_id = ?
    ↓               (SQLite, <20ms for typical 200-entry session)
[transformBackendMessages()] → timeline store update
    ↓
[ChatView renders messages]
```

**Expected improvement:** Message load from ~200-800ms (JSONL line-by-line parse with readline) to <20ms (indexed SQLite query).

### Flow 3: Live Session Attach (New)

```
[User views session that CLI is actively writing to]
    ↓
[Frontend] → WS: { type: 'attach-session', projectName, sessionId }
    ↓
[server/index.js] → SessionWatcher.watch(jsonlFilePath, sessionId)
    ↓
[Claude CLI appends to .jsonl file]
    ↓
[fs.watch fires] → SessionWatcher.readNewLines(filePath)
    ↓
[New JSONL entries parsed]
    ↓
[WS broadcast] → { type: 'live-session-data', sessionId, entries }
    ↓
[stream-multiplexer.ts] → onLiveSessionMessage callback
    ↓
[transformBackendMessages(entries)] → timeline store addMessage()
    ↓
[ChatView renders new messages in real-time]
```

### Flow 4: Cache Warming (Background)

```
[Server starts]
    ↓
[CacheWarmer] → Check sessions table for last cached_at per project
    ↓
[For each project directory]:
    ↓
    ├── stat each .jsonl file → compare mtime to cached_at
    │   ↓ (file newer than cache)
    ├── parseJsonlSessions() → UPSERT into sessions table
    ├── For sessions with messages not yet cached:
    │   ↓
    │   readJsonlMessages() → INSERT INTO messages
    │
    └── Skip files older than cached_at (already cached)
```

**Startup time budget:** Cache warming should be non-blocking. Process files in the background with `setImmediate()` yielding between files to avoid blocking the event loop. REST endpoints work immediately with JSONL fallback while cache warms.

---

## SQLite Schema Design

### Separate Database File

Use a separate `messages.db` file, NOT the existing `auth.db`. Rationale:

1. **Independent lifecycle** -- message cache can be deleted and rebuilt without affecting auth
2. **Size isolation** -- messages.db will grow to 50-100MB; auth.db stays tiny
3. **WAL mode isolation** -- separate WAL files prevent checkpoint contention
4. **Backup simplicity** -- auth.db needs backup, messages.db is disposable (rebuildable from JSONL)

### Tables

```sql
-- Session metadata (replaces in-memory parseJsonlSessions results)
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,              -- UUID from JSONL sessionId field
  project_name TEXT NOT NULL,       -- e.g. '-home-swd-loom'
  summary TEXT DEFAULT 'New Session',
  message_count INTEGER DEFAULT 0,
  last_activity TEXT,               -- ISO 8601
  cwd TEXT,
  last_user_message TEXT,
  last_assistant_message TEXT,
  jsonl_file TEXT,                  -- filename (not full path)
  jsonl_byte_offset INTEGER,        -- last read position
  cached_at TEXT,                   -- when this row was last updated
  is_junk INTEGER DEFAULT 0         -- 1 = filtered from session list
);

-- Individual JSONL entries (full raw data)
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  project_name TEXT NOT NULL,
  entry_type TEXT NOT NULL,         -- 'user', 'assistant', 'progress', 'summary', etc.
  message_id TEXT,                  -- message.id from Claude API (nullable)
  uuid TEXT UNIQUE,                 -- JSONL entry UUID (for dedup)
  parent_uuid TEXT,
  timestamp TEXT,
  raw_json TEXT NOT NULL,           -- Complete JSONL line as stored
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Indexes for common access patterns
CREATE INDEX idx_sessions_project ON sessions(project_name, last_activity DESC);
CREATE INDEX idx_messages_session ON messages(session_id, timestamp ASC);
CREATE INDEX idx_messages_type ON messages(session_id, entry_type);
CREATE INDEX idx_sessions_not_junk ON sessions(project_name, is_junk, last_activity DESC);
```

### Why Store `raw_json` Instead of Normalized Columns

1. **JSONL schema is Claude's, not ours.** The entry format changes between Claude CLI versions (we've seen `version: "2.1.59"` through `"2.1.71"` in the loom project alone). Normalizing into typed columns means schema migrations on every CLI update.
2. **The frontend already has `transformBackendMessages()`.** It expects raw JSONL entries. Storing raw JSON means the cache output matches the existing REST response format exactly.
3. **Storage is cheap.** 140K JSONL lines for loom at ~1KB average = ~140MB raw. SQLite with TEXT compression stores this efficiently. A typical session (100-500 entries) is 100KB-500KB.
4. **Query patterns are simple.** We only query by session_id + timestamp order. We never query message content. Full-text search (if ever needed) would use SQLite FTS5 on a separate virtual table.

---

## Live Session Attach: Detailed Design

### Detecting Active CLI Sessions

The server already knows which sessions it started via `claude-sdk.js` (the `activeSessions` Map). But CLI sessions started outside Loom don't appear there.

**Detection strategy (recommended -- explicit attach):**

Don't auto-detect. Let the user explicitly "attach" to a session. Show an "Attach" button when session's last_activity is within the last 5 minutes. When attached, start the SessionWatcher. When the JSONL file stops growing for 30 seconds, auto-detach and send a completion signal.

**Why not auto-detect:** Auto-detecting active CLI sessions requires either:
- Process scanning (`ps aux | grep claude`) -- fragile, platform-specific
- Lock file detection -- Claude CLI doesn't create lock files
- File mtime polling -- adds complexity for uncertain benefit

Explicit attach is simpler, more reliable, and gives the user control.

### Resolving Which JSONL File Contains a Session

A session's entries may span multiple JSONL files (though typically one). The `getSessionMessages()` function already scans all JSONL files in a project directory. For the SessionWatcher, we need to know which file to watch.

**Strategy:** When messages are loaded for a session (either from JSONL or from cache), record the JSONL filename in the `sessions.jsonl_file` column. When attaching, watch that specific file.

### Frontend Integration

The stream-multiplexer already has the callback injection pattern. Add one new callback:

```typescript
// In MultiplexerCallbacks interface
onLiveSessionMessage: (sessionId: string, entries: BackendEntry[]) => void;

// In routeMessage()
case 'live-session-data': {
  callbacks.onLiveSessionMessage(msg.sessionId, msg.entries);
  break;
}
```

The `websocket-init.ts` wiring:

```typescript
onLiveSessionMessage: (sessionId, entries) => {
  const messages = transformBackendMessages(entries);
  const timelineState = useTimelineStore.getState();
  for (const msg of messages) {
    timelineState.addMessage(sessionId, msg);
  }
}
```

This reuses the existing `addMessage` flow, which ChatView already renders reactively.

### Edge Cases

| Edge Case | Handling |
|-----------|----------|
| File gets very large during attach | Byte-offset means we only read new data; no risk |
| Multiple clients watching same session | SessionWatcher broadcasts to all connected WebSocket clients |
| JSONL file rotated/deleted mid-watch | `fs.watch` fires, readNewLines detects size shrink, re-read from 0 |
| Client disconnects while attached | WebSocket close handler calls `SessionWatcher.unwatch()` |
| Partial JSON line at EOF | readline module handles this -- waits for newline before emitting |
| Session entries span multiple JSONL files | Watch all files that contain the session (rare, but handle gracefully) |

---

## iOS App Architecture: Options Analysis

### Option 1: Capacitor (RECOMMENDED)

**What:** Wrap the existing Vite React app in Capacitor's native iOS container (WKWebView). Same codebase, same build, native shell.

**Effort:** 2-3 days for initial working build, 1-2 weeks for polish.

**Architecture:**

```
┌────────────────────────────────┐
│     iOS App (Capacitor)        │
│  ┌───────────────────────────┐ │
│  │  WKWebView                │ │
│  │  ┌─────────────────────┐  │ │
│  │  │  Loom React App     │  │ │
│  │  │  (same bundle)      │  │ │
│  │  └─────────────────────┘  │ │
│  └───────────────────────────┘ │
│  Capacitor Bridge              │
│  - Push notifications          │
│  - Haptic feedback             │
│  - Safe area management        │
│  - Status bar control          │
└────────────────────────────────┘
         │ HTTPS via Tailscale
         ▼
┌────────────────────────────────┐
│  Loom Backend (port 5555)      │
│  100.86.4.57                   │
└────────────────────────────────┘
```

**Pros:**
- Zero code duplication -- same React app, same components, same Zustand stores
- Capacitor's WKWebView has full JIT engine access (faster JS than React Native's bridge)
- Tailscale provides HTTPS via MagicDNS which WKWebView requires
- Capacitor plugins for push notifications, haptics, biometric auth
- Publishable to App Store via Xcode
- 1 codebase serves web, mobile web, and iOS app
- Existing responsive work (767px breakpoint, sidebar drawer, ComposerStatusBar) directly applies

**Cons:**
- Not truly "native" UI -- uses web rendering, not UIKit
- WKWebView can be killed by iOS for memory pressure ("white screen of death")
- iOS gesture conflicts (swipe-back navigation vs. sidebar gestures)
- App Store review is not guaranteed for wrapper apps (but Capacitor apps with native API integration generally pass)

### Option 2: PWA (Progressive Web App)

**What:** Add web app manifest, service worker, icons. Users add to Home Screen from Safari.

**Effort:** 1-2 days.

**Pros:**
- Minimal implementation effort
- No App Store submission, no Xcode, no Apple Developer account ($99/year saved)
- Same codebase with zero changes
- Tailscale MagicDNS provides required HTTPS

**Cons:**
- iOS PWA limitations are severe (as of iOS 18.x / early 2026):
  - Storage evicted after 7 days of non-use
  - No Background Sync
  - Push notifications require Home Screen install + iOS 16.4+ and are limited
  - No Fullscreen API
  - Session/cookie storage isolated from Safari
  - No haptic feedback, no status bar control
- Apple actively discourages PWAs
- Memory limits are tighter than Capacitor's WKWebView
- Feels second-class on iOS

### Option 3: React Native

**What:** Rewrite the frontend in React Native components (not web views).

**Effort:** 4-8 weeks minimum.

**Pros:**
- True native UI components (UIKit rendered)
- Best gesture handling
- Largest mobile library ecosystem

**Cons:**
- Complete frontend rewrite -- NONE of these transfer: CSS/Tailwind, shadcn/ui, react-markdown, Shiki, CodeMirror, xterm.js
- Two codebases to maintain forever
- Massive effort for a single-user tool
- Different animation/styling paradigms

### Option 4: Native Swift/SwiftUI

**Effort:** 8-16 weeks. Completely separate codebase. Requires dedicated iOS development skills. Massively overengineered for a single-user tool. Not recommended.

### iOS Recommendation

**Capacitor** is the clear winner:

1. **Single-user tool** -- Native feel matters less than development speed
2. **Existing responsive work** -- Sidebar drawer, ComposerStatusBar, 767px breakpoint already in place
3. **Tailscale provides HTTPS** -- Solves the biggest barrier
4. **Zero code duplication** -- One codebase, one design system, one build pipeline

**Recommended order:**
1. Add PWA manifest + service worker now (1 day, free, immediately useful)
2. Add Capacitor when push notifications or haptics are desired (2-3 days)
3. Never build React Native or Swift native

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1 user (current) | SQLite cache is more than sufficient. Single-process Node.js handles everything. |
| 1-5 users (potential) | SQLite WAL mode handles concurrent readers. No changes needed. |
| Beyond 5 users | Not a realistic scenario. If needed: PostgreSQL migration with same schema. |

### First Bottleneck: Cache Warming on Startup

With 646MB of JSONL for the loom project alone, initial cache warming could take 30-60 seconds. Mitigation:
- Process files in chunks with `setImmediate()` between files
- REST endpoints fall back to JSONL during warming
- Cache persists across server restarts (only re-index files with newer mtime)
- Session list is usable before all messages are cached (session metadata is fast; message caching is lazy)

### Second Bottleneck: JSONL File Growth

Individual JSONL files can grow to several MB for long sessions. Mitigation:
- Byte-offset tailing reads only new data
- SQLite cache means JSONL is read once per session
- Cache invalidation is timestamp-based (compare JSONL mtime to cached_at)

---

## Anti-Patterns

### Anti-Pattern 1: Replacing JSONL with SQLite as Source of Truth

**What people do:** Stop reading JSONL, write all data to SQLite, treat it as primary.
**Why wrong:** Claude CLI writes to JSONL. If we stop reading JSONL, we lose sessions started from the terminal.
**Do this instead:** SQLite is always a cache. JSONL is always source of truth. Cache can be deleted and rebuilt.

### Anti-Pattern 2: Watching All JSONL Files Simultaneously

**What people do:** `fs.watch` on every JSONL file in every project directory.
**Why wrong:** 383 files in one project. inotify watches are a finite kernel resource (default 8192 per user on Linux). Watching all files wastes descriptors.
**Do this instead:** Only watch JSONL files for sessions the user is actively viewing. Watch project directories for new/deleted files (existing chokidar setup). Max simultaneous watches: 1-3 files.

### Anti-Pattern 3: Polling JSONL Files for Changes

**What people do:** `setInterval` every 500ms to stat/read JSONL files.
**Why wrong:** CPU waste. `fs.watch` uses inotify (Linux) which is event-driven, zero-CPU when idle, triggers within milliseconds of a write.
**Do this instead:** Use `fs.watch` for live tailing. Use chokidar (which also uses inotify internally) for directory-level watching.

### Anti-Pattern 4: Storing Messages in auth.db

**What people do:** Add message tables to auth.db for simplicity.
**Why wrong:** auth.db is critical (user credentials, API keys). messages.db is disposable. Mixing them means larger backups, WAL contention, and inability to safely rebuild the cache.
**Do this instead:** Separate database file. Same `better-sqlite3` driver. Independent lifecycle.

### Anti-Pattern 5: Building Native WebSocket in Capacitor Plugin

**What people do:** Create a native Swift WebSocket connection via Capacitor plugin.
**Why wrong:** WKWebView already has full WebSocket support via the browser API. The existing `WebSocketClient` class works unchanged.
**Do this instead:** Web app's WebSocket code works as-is in Capacitor.

### Anti-Pattern 6: Caching Transformed Messages Instead of Raw JSONL

**What people do:** Store the frontend's `Message` type in SQLite instead of raw JSONL entries.
**Why wrong:** The transformation logic (`transformBackendMessages`) evolves with the frontend. If cached transformed data has a bug, the entire cache is poisoned. Raw JSONL is stable (CLI owns the format).
**Do this instead:** Cache raw JSONL entries. Transform on read (same as current code path). Transformation is fast (in-memory object mapping) and benefits from frontend fixes without cache invalidation.

---

## Integration Points

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| projects.js <-> MessageCache | Direct import (same process) | MessageCache exposes synchronous better-sqlite3 methods |
| server/index.js <-> SessionWatcher | EventEmitter pattern | SessionWatcher emits `entries` events; index.js broadcasts to WS clients |
| Frontend <-> Live session data | WebSocket messages | New `live-session-data` type through existing `/ws` connection |
| CacheWarmer <-> MessageCache | Direct import | CacheWarmer calls MessageCache.upsertSession/insertMessages |
| CacheWarmer <-> JSONL files | fs.createReadStream | Read-only; never modifies JSONL files |

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Claude CLI JSONL files | Read-only filesystem access | Source of truth; never written to by Loom |
| Tailscale MagicDNS | HTTPS for Capacitor/PWA | Required for iOS WKWebView security |
| Apple App Store | Capacitor build -> Xcode -> TestFlight | Only if App Store distribution desired |

---

## Recommended Build Order

Dependencies determine order. Each step is independently testable.

1. **MessageCache module** (no dependencies on existing code)
   - Create `server/database/messages.db` with schema
   - Implement `upsertSession()`, `insertMessages()`, `getSessionsByProject()`, `getMessagesBySession()`
   - Unit test with better-sqlite3 in-memory database
   - **Output:** Working SQLite cache module, fully tested, not wired into anything yet

2. **CacheWarmer module** (depends on MessageCache)
   - Background JSONL scanning and cache population
   - Incremental update based on file mtime vs cached_at
   - Integration test: create temp JSONL files, verify they appear in SQLite
   - **Output:** Cache populates on startup, incrementally updates

3. **Wire MessageCache into projects.js** (depends on MessageCache)
   - Add cache-first lookup to `getSessionMessages()` and `getSessions()`
   - JSONL fallback on cache miss with write-through
   - Verify existing REST endpoints return identical data, faster
   - **Output:** Sub-second session loads with zero frontend changes

4. **SessionWatcher module** (independent of cache, depends on fs.watch)
   - Byte-offset tailing of individual JSONL files
   - EventEmitter interface
   - Unit test: append lines to a temp file, verify events fire with correct data
   - **Output:** Working file tailing, not connected to anything yet

5. **WebSocket integration for live attach** (depends on SessionWatcher)
   - `attach-session` / `detach-session` client message handling
   - Server-side wiring in index.js
   - `live-session-data` broadcast to attached clients
   - **Output:** Backend can broadcast JSONL changes over WebSocket

6. **Frontend live attach** (depends on WebSocket integration)
   - New multiplexer callback `onLiveSessionMessage`
   - Wiring in websocket-init.ts
   - "Attach" button in session header when session appears active
   - Visual indicator for live-attached sessions
   - **Output:** User can watch CLI sessions in real-time from the Loom UI

7. **PWA manifest + service worker** (independent of all above)
   - `manifest.json`, icons, basic service worker for offline shell
   - Can be done in parallel with steps 1-6
   - **Output:** "Add to Home Screen" works on mobile

8. **Capacitor iOS shell** (depends on working PWA manifest)
   - `npx cap init`, `npx cap add ios`
   - Configure for Tailscale HTTPS endpoint
   - Status bar, safe area, splash screen
   - **Output:** Loom runs as an iOS app via WKWebView

---

## Sources

- [better-sqlite3 performance docs](https://github.com/WiseLibs/better-sqlite3/blob/master/docs/performance.md)
- [SQLite WAL mode optimizations](https://www.powersync.com/blog/sqlite-optimizations-for-ultra-high-performance)
- [SQLite performance tuning (phiresky)](https://phiresky.github.io/blog/2020/sqlite-performance-tuning/)
- [SQLite production setup 2026](https://oneuptime.com/blog/post/2026-02-02-sqlite-production-setup/view)
- [SQLite WAL mode on Ubuntu 2026](https://oneuptime.com/blog/post/2026-03-02-how-to-set-up-sqlite-with-wal-mode-on-ubuntu/view)
- [Node.js fs.createReadStream docs](https://nodejs.org/api/fs.html) -- `start` option for byte-offset reads
- [chokidar v5](https://github.com/paulmillr/chokidar) -- ESM-only, used for project directory watching
- [node-tail](https://github.com/lucagrulla/node-tail) -- zero-dependency file tailing reference
- [tail-file-stream](https://www.npmjs.com/package/tail-file-stream) -- streaming interface for appended files
- [Capacitor vs React Native 2025](https://nextnative.dev/blog/capacitor-vs-react-native)
- [Capacitor with React](https://capacitorjs.com/solution/react)
- [Capacitor WKWebView performance](https://nextnative.dev/blog/improve-mobile-app-performance)
- [iOS PWA limitations 2026](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)
- [PWA vs Native App 2026](https://progressier.com/pwa-vs-native-app-comparison-table)
- [PWAs on iOS 2025 analysis](https://ravi6997.medium.com/pwas-on-ios-in-2025-why-your-web-app-might-beat-native-0b1c35acf845)

---
*Architecture research for: Loom V2 data layer, live session attach, iOS app*
*Researched: 2026-03-26*
