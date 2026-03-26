# Pitfalls Research: v2.0 "The Engine" -- SQLite Cache, Live Attach, Mobile, iOS

**Domain:** Adding SQLite message caching, JSONL live session watching, mobile-native UX, and iOS app research to a 49K+ LOC React workspace app with existing Zustand state management, WebSocket streaming, and chokidar file watchers
**Researched:** 2026-03-26
**Confidence:** HIGH (architecture well-understood, pitfalls confirmed across multiple sources)

---

## Critical Pitfalls

Mistakes that cause data loss, architectural rewrites, or user-facing corruption.

### Pitfall 1: SQLite Cache Diverges from JSONL Source of Truth

**What goes wrong:**
The SQLite cache holds messages that no longer match the JSONL files on disk. Claude Code can delete sessions, rewrite JSONL files during compaction, or modify entries outside Loom's awareness. The cache serves stale or phantom messages that don't exist in the source data. Users see conversations that have been deleted or modified.

**Why it happens:**
JSONL files are the source of truth -- they live in `~/.claude/projects/`. The backend reads them directly on every `getSessionMessages()` call (server/projects.js:930+). A cache in front of this creates a classic dual-source problem: the cache has no way to know when the upstream JSONL changed unless explicitly told. Developers naturally optimize for "cache hit" and forget to build invalidation.

**How to avoid:**
1. **Use file mtime as cache key.** Before serving from SQLite, check `fs.stat()` mtime of the JSONL file. If mtime > cache timestamp, invalidate and re-parse. This is O(1) stat vs O(n) file read.
2. **Store the JSONL file hash or byte offset alongside cached data.** If the file grew (new messages appended), only parse the delta from the last known byte offset.
3. **Never cache session metadata separately from messages.** If you cache the session list, it must invalidate when any JSONL file changes -- the existing chokidar watcher (server/index.js:168-206) already handles this.
4. **Cache invalidation on delete.** When `deleteSession()` runs, the cache entry must be purged synchronously before the response returns.

**Warning signs:**
- User deletes a session in Loom but it reappears after reload
- Message counts in sidebar don't match actual conversation length
- "Ghost sessions" appear that have no backing JSONL file

**Phase to address:** SQLite data layer phase (first phase of milestone)

---

### Pitfall 2: WAL Checkpoint Starvation from Concurrent Reads

**What goes wrong:**
The SQLite WAL (Write-Ahead Log) file grows without bound because the backend holds long-running read transactions open while streaming sessions. SQLite cannot checkpoint (transfer WAL data back to the main database file) while any reader holds a snapshot. The WAL eventually consumes hundreds of MB of disk, and read performance degrades as SQLite must scan increasingly large WAL files.

**Why it happens:**
Loom's backend serves multiple concurrent requests -- session list, message fetching, file tree operations -- each potentially holding an SQLite read. With better-sqlite3's synchronous API, transactions are typically short, but if a long-running operation (like parsing all JSONL files for cache population) holds a read lock while writes happen, checkpointing stalls. The existing auth.db is tiny and never hits this, but a message cache with thousands of entries will.

**How to avoid:**
1. **Enable WAL mode immediately.** `db.pragma('journal_mode = WAL')` -- the existing auth.db doesn't do this, so don't copy its pattern.
2. **Keep read transactions short.** Use `db.prepare().all()` for bounded queries, never hold a read open across async boundaries.
3. **Set busy_timeout.** `db.pragma('busy_timeout = 5000')` prevents SQLITE_BUSY errors when writes briefly block.
4. **Periodic manual checkpoint.** If the WAL file exceeds 10MB, call `db.pragma('wal_checkpoint(TRUNCATE)')` during idle periods (e.g., when no sessions are streaming).
5. **Separate databases for auth and cache.** Don't add message cache tables to auth.db -- use a dedicated `cache.db` that can be deleted without losing auth state.

**Warning signs:**
- `*.db-wal` file growing beyond 50MB
- Session loading gets progressively slower over days without restart
- SQLITE_BUSY errors in server logs

**Phase to address:** SQLite data layer phase (schema design)

---

### Pitfall 3: Cache Schema Migration Corrupts Existing Data

**What goes wrong:**
A schema change (adding a column, changing an index) during a Loom update either fails silently (leaving the cache in a broken state) or drops data. Unlike the auth.db which has a well-defined schema, a cache schema will evolve rapidly during development. Users who update Loom mid-milestone get a broken cache with no recovery path.

**Why it happens:**
The existing auth.db migration system (server/database/db.js:74+) uses `PRAGMA table_info()` to detect missing columns and adds them individually. This works for a stable schema with 2-3 migrations, but a cache schema undergoing rapid iteration needs a more robust system. SQLite doesn't support `ALTER TABLE DROP COLUMN` (before 3.35.0) or `ALTER TABLE MODIFY COLUMN` at all. Renaming columns requires creating a new table, copying data, and dropping the old one.

**How to avoid:**
1. **Use a version number in the cache database.** Store schema version via `PRAGMA user_version`. On startup, check version -- if outdated, drop and rebuild from JSONL source. A cache is rebuildable by definition.
2. **Make the cache fully expendable.** Design so that deleting `cache.db` simply means a slower first load while the cache rebuilds from JSONL files. Never store data in the cache that can't be regenerated.
3. **Use `user_version` pragma, not a migrations table.** `db.pragma('user_version')` returns a single integer. Increment it with each schema change. On mismatch, `DROP TABLE` and recreate. No need for a migration tracking table on a cache.
4. **Test the "cold start" path.** Every code path must handle "cache.db doesn't exist or is version 0" gracefully.

**Warning signs:**
- "SQLITE_ERROR: no such column" in server logs after update
- Session list loads but messages fail to display
- Cache works on fresh install but breaks after upgrade

**Phase to address:** SQLite data layer phase (migration strategy)

---

### Pitfall 4: Live Session Attach Creates Duplicate Messages

**What goes wrong:**
When attaching to a live CLI session via JSONL file watching, the same messages appear twice -- once from the initial file read and once from the watcher's change events. Or worse, partial JSONL lines are parsed as the file is being written, producing corrupt JSON that crashes the parser.

**Why it happens:**
JSONL files are append-only during a session. When you read the file initially to load history, then start watching for changes, there's a window where:
1. You read the file up to byte offset N
2. Between your read completing and the watcher starting, bytes N+1 through M are written
3. The watcher fires for the change, you re-read from offset N, getting everything from N to M+more
4. Result: bytes N+1 through M are processed twice

Additionally, JSONL lines are written as complete operations, but the OS may report a write before the full line (including newline) is flushed. `fs.read()` at that moment captures a partial JSON line.

**How to avoid:**
1. **Track byte offset, not line count.** After initial read, record the file size. On `change` events, read from that offset forward. Use `fs.createReadStream({ start: lastOffset })`.
2. **Buffer incomplete lines.** If the last chunk doesn't end with `\n`, hold it and prepend to the next read. Only parse complete lines terminated by newline.
3. **Deduplicate by entry ID.** Every JSONL entry has a unique combination of `sessionId` + `timestamp` + `type`. Use a Set of seen entry hashes to skip duplicates.
4. **Use `awaitWriteFinish` carefully.** The existing chokidar config uses `stabilityThreshold: 2000` (server/index.js:183), but for live attach you need much lower latency. For live session watching, use a separate watcher with `stabilityThreshold: 100` -- you want near-real-time, not 2-second debounce.
5. **Don't use the existing chokidar session watcher.** That watcher (server/index.js:104-210) is for session list updates with 1.5s debounce. Live attach needs its own dedicated watcher per active session with sub-200ms latency.

**Warning signs:**
- Messages flash in, disappear, then reappear during live streaming
- JSON parse errors in logs during active sessions
- Tool call cards appear duplicated in the chat view

**Phase to address:** Live session attach phase

---

### Pitfall 5: iOS Safari Virtual Keyboard Destroys Chat Composer Layout

**What goes wrong:**
When the user taps the chat composer on iOS Safari, the virtual keyboard slides up and either: (a) the composer is pushed behind the keyboard and becomes invisible, (b) the entire viewport resizes causing the message list to jump, or (c) the address bar animation fights with the layout causing a cascade of resize events that trigger janky scroll behavior.

**Why it happens:**
iOS Safari has unique viewport behavior:
- `100vh` includes the bottom bar, so elements pinned to the bottom disappear behind the keyboard
- The `resize` event fires multiple times during keyboard animation (not just once when done)
- `visualViewport.height` changes dynamically as the keyboard slides, but `window.innerHeight` updates only after the animation completes
- The existing `overflow: hidden` on `html, body` (src/src/styles/base.css) doesn't prevent iOS bounce scrolling within scrollable containers
- Input elements with `font-size < 16px` trigger automatic zoom, and Loom uses Inter at various sizes

**How to avoid:**
1. **Use `dvh` (dynamic viewport height) instead of `vh`.** Baseline support since June 2025 (~95% of browsers). Replace `100vh` with `100dvh` for the app shell.
2. **Add `interactive-widget=resizes-content` to viewport meta tag.** This tells the browser to shrink the layout viewport when the keyboard opens, making `dvh` reflect the reduced space.
3. **Ensure composer input is `font-size: 16px` or larger.** iOS auto-zooms on inputs < 16px. The composer textarea must explicitly set this. Check with `window.visualViewport.scale` -- if > 1 after tapping input, you've hit this.
4. **Use `visualViewport` API for keyboard detection.** Listen to `visualViewport.resize` events to detect keyboard presence. The difference between `window.innerHeight` and `visualViewport.height` tells you the keyboard height.
5. **Don't fight the resize.** Let the layout reflow naturally with CSS, don't try to JavaScript your way to fixed positioning during keyboard animation.
6. **Test with real iOS device.** The iOS simulator keyboard doesn't behave identically to physical device keyboard. Xcode Simulator -> I/O -> Keyboard -> Toggle Software Keyboard still differs from real hardware.

**Warning signs:**
- Composer disappears when keyboard opens on iPhone
- Message list jumps up and down during keyboard animation
- Text in composer appears zoomed in after tapping

**Phase to address:** Mobile-native UX phase

---

### Pitfall 6: Service Worker Serves Stale App After Update

**What goes wrong:**
After deploying a Loom update, users continue seeing the old version indefinitely. The service worker caches the entire SPA shell and serves it from cache without checking for updates. Even after the user manually reloads, they get the cached version because the service worker intercepts the navigation request and serves the old index.html.

**Why it happens:**
Service workers use a lifecycle: install -> waiting -> activate. A new service worker version won't activate until ALL tabs running the old version are closed. Even with `skipWaiting()`, the page must reload to pick up the new worker. For a PWA that users keep open in a pinned tab (Loom's primary use case), this means potentially days of stale content. The Vite build outputs hashed filenames for JS/CSS, but `index.html` itself isn't hashed.

**How to avoid:**
1. **Don't add a service worker yet.** Loom is served over Tailscale on a local network. Service workers solve offline access and install-to-homescreen -- neither is critical for v2.0. The PWA manifest can exist without a service worker.
2. **If you must add one, use network-first for index.html.** Cache static assets (JS/CSS with content hashes) but always fetch index.html from the network. Fall back to cache only when offline.
3. **Implement an update notification.** When a new service worker is detected, show a toast: "New version available. Reload to update." with a button that calls `registration.waiting.postMessage({ type: 'SKIP_WAITING' })`.
4. **Version the service worker file itself.** Include a version constant that changes with each build. The browser compares service worker files byte-by-byte; any change triggers an update cycle.

**Warning signs:**
- Users report seeing old UI after you've deployed
- console.log version strings show old build hash
- "New version available" prompts never appear

**Phase to address:** Do NOT implement in v2.0 unless explicitly required for iOS app. Defer to PWA-specific phase.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Storing parsed messages in SQLite as JSON blobs | Fast to implement, no schema design | Can't query individual fields, can't index message content for search, re-parse cost on every read | Never -- design proper columns for queryable fields (sessionId, timestamp, role, type) with a `content` JSON column for the variable parts |
| Using localStorage for mobile state persistence | Works today, no new deps | 5-10MB limit, synchronous API blocks main thread on large reads, no structured queries | Only for small state (<100KB): expanded projects, UI preferences. Never for messages. |
| Polling JSONL files instead of inotify-based watching | Works cross-platform, no inotify limit concerns | CPU waste at scale, latency proportional to poll interval, battery drain on mobile | Only as fallback when inotify watches are exhausted (> `fs.inotify.max_user_watches`). Log a warning when falling back. |
| Caching message list in Zustand memory alongside SQLite | Instant re-renders, familiar pattern | Double memory consumption -- messages in SQLite + in-memory Zustand store. 1000-message sessions with tool calls can be 5MB+ each | Acceptable for the active session only. Evict non-active sessions from Zustand to SQLite cache. |
| Wrapping entire web app in Capacitor without code changes | "Works" immediately | WebSocket URLs hardcoded to `window.location`, no native safe area padding, no deep links, push notifications don't work, Tailscale DNS not resolvable from iOS app sandbox | Never -- Capacitor requires explicit URL configuration, safe area CSS, and native plugin integration |

## Integration Gotchas

Common mistakes when connecting SQLite cache to the existing Loom architecture.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| SQLite + existing `getSessionMessages()` | Adding cache check inside the existing function, tangling cache logic with JSONL parsing | Wrap with a caching layer: `getCachedSessionMessages()` calls cache first, falls back to `getSessionMessages()` on miss. Keep the original pure. |
| SQLite + Zustand persist middleware | Using Zustand's persist middleware to write to SQLite via a custom storage adapter | Don't. Zustand persist is for serializable config (UI prefs, expanded state). Message data should flow: JSONL -> SQLite cache -> REST API -> Zustand. The cache is a backend concern, not a frontend store middleware. |
| Live watcher + existing chokidar session watcher | Reusing the existing chokidar watcher (server/index.js:104-210) that watches `~/.claude/projects/` for session list updates | Create a separate, per-session watcher for live attach. The existing watcher has 1.5s debounce and ignores `change` events (line 190-191 comment). Live attach needs `change` events with ~100ms latency. |
| Live watcher + WebSocket | Sending raw JSONL entries over WebSocket without the stream multiplexer format | Route live attach data through a new WebSocket message type (e.g., `type: 'live-session-update'`) that the frontend multiplexer can route. Don't try to pretend it's a normal streaming response -- it has different semantics (append-only history vs. active tool calls). |
| Mobile viewport + existing `overflow: hidden` on body | Assuming the existing `overflow: hidden` on html/body (base.css) handles mobile scroll containment | iOS Safari ignores `overflow: hidden` on body when the keyboard is open. Use `position: fixed; inset: 0;` on the app shell container to truly lock the viewport. |
| Capacitor + JWT auth | Assuming `window.location` works for constructing API URLs in Capacitor | Capacitor apps don't have a meaningful `window.location.host` -- it's `localhost` or a custom scheme. API URLs must be configured explicitly via env vars or Capacitor config. The existing `bootstrapAuth()` in `src/src/lib/auth.ts` constructs URLs from `window.location`. |

## Performance Traps

Patterns that work at small scale but fail as Loom's usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Re-parsing entire JSONL file on every cache miss | First load is slow but tolerable; gets worse as session grows | Track byte offset of last read; parse only the delta. Index by sessionId in SQLite. | Sessions > 500 messages (~2MB JSONL). Current largest sessions are probably 1000+ entries with tool calls. |
| Loading all sessions into SQLite at startup | Server startup takes 30+ seconds scanning hundreds of JSONL files across projects | Lazy population: only cache a session when it's first requested. Background populate on idle. | > 50 projects with > 10 sessions each. The existing `getProjects()` already has progress broadcasting because it's slow. |
| Watching every JSONL file for live attach | inotify watch count explodes, `ENOSPC: System limit for number of file watchers reached` | Only watch the JSONL file for the currently attached session. Close watcher when detaching. Current `max_user_watches` default is 65536 on most Linux distros. | > 100 simultaneous JSONL files being watched. Unlikely for single user, but the existing chokidar watcher with `depth: 3` already creates many watches. |
| Sending full message objects over WebSocket for live attach | Bandwidth and parse overhead scales with message complexity (tool calls with large outputs) | Send only the new JSONL line (raw string) and let the frontend parse/transform. Or send a minimal delta: `{ type, sessionId, timestamp, preview }`. | Messages with large tool outputs (file contents, grep results) can be 100KB+ each. |
| CSS `backdrop-filter: blur()` on mobile during streaming | GPU compositing overhead on mobile GPUs causes dropped frames | Disable `backdrop-filter` on mobile via `@media (max-width: 767px)` or use a solid semi-transparent background instead. The iGPU can handle it on desktop; mobile WebView cannot. | Any mobile device during active streaming. The glass effects from v1.5 will compound this. |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| SQLite cache.db readable without auth | Anyone with filesystem access reads all cached conversations, which may contain secrets, API keys, credentials the AI discussed | Set `cache.db` permissions to `0600` (owner read/write only). Store in a user-specific directory, not the Loom install directory. Consider encrypting at rest with `sqlcipher` if compliance matters. |
| Live attach exposes other users' CLI sessions | In a multi-user server scenario, JSONL watcher could expose sessions from other system users' `~/.claude/` | The existing auth model is single-user, so this is low risk now. But if Loom ever supports multi-user: validate that the requested session's JSONL path is within the authenticated user's home directory. Path traversal check. |
| Capacitor WebView stores auth token in cleartext | JWT token persisted via `localStorage` in the WebView is accessible to any app that can read the WebView data directory | Use Capacitor's `@capacitor/preferences` (encrypted storage on iOS Keychain / Android Keystore) instead of `localStorage` for auth tokens in the native app. |
| Service worker caches API responses containing sensitive data | Cached API responses (session messages, file contents) persist in the browser's Cache Storage even after logout | Never cache API responses in the service worker. Only cache static assets (JS, CSS, fonts, images). Use `Cache-Control: no-store` headers on all `/api/*` responses. |

## UX Pitfalls

Common user experience mistakes when adding these features.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing "Loading..." every time when SQLite cache exists | User sees a flash of loading state even though data is available instantly from cache | Serve from cache immediately (optimistic), then validate in background. Only show loading if cache is empty. The existing `useSessionSwitch` (line 58-63) already has memory cache check -- extend this pattern to SQLite. |
| Live attach indicator is invisible or unclear | User doesn't know if they're watching a live CLI session vs. viewing history. They type a message thinking they're in Loom but it goes nowhere. | Clear visual indicator: pulsing dot + "Live" badge in session header. Disable the composer when viewing a live CLI session (you can't type into someone else's Claude Code). Or show "Send via Loom" vs "Watching CLI" modes. |
| Mobile hamburger menu hides critical controls | User can't find settings, project switcher, or session list because everything is behind a hamburger | The existing 767px breakpoint (sidebar becomes drawer) is correct. But ensure the drawer has swipe-to-open gesture, not just a button. Touch target for the hamburger must be at minimum 44x44px (Apple HIG). |
| Cache makes deleted sessions "come back" | User deletes a session, switches away, comes back -- session reappears because the SQLite cache wasn't invalidated | Delete from both SQLite and JSONL atomically. The existing `deleteSession()` endpoint must clear the cache entry. Use a "tombstone" approach if needed: mark as deleted in cache, garbage collect later. |
| Mobile pull-to-refresh conflicts with scroll | User tries to scroll up in message list but triggers browser pull-to-refresh, reloading the entire page | Use `overscroll-behavior-y: contain` on the message list container. This prevents the browser's native pull-to-refresh from activating on inner scrollable elements. |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **SQLite cache:** Often missing cache invalidation on JSONL file modification -- verify that editing a session externally (e.g., via Claude Code `--resume`) updates the cached version
- [ ] **SQLite cache:** Often missing WAL mode configuration -- verify `PRAGMA journal_mode` returns `wal`, not `delete`
- [ ] **SQLite cache:** Often missing busy_timeout -- verify concurrent requests don't produce SQLITE_BUSY errors under load
- [ ] **Live attach:** Often missing partial line buffering -- verify that a JSONL line written across two OS write operations doesn't produce a JSON parse error
- [ ] **Live attach:** Often missing watcher cleanup -- verify that switching away from a live session closes its file watcher (leaked watchers consume inotify handles)
- [ ] **Live attach:** Often missing "catch up" on reconnect -- verify that if WebSocket disconnects during live session, reconnecting replays missed messages from the JSONL file
- [ ] **Mobile viewport:** Often missing iOS zoom prevention -- verify that tapping the composer on iPhone doesn't trigger auto-zoom (font-size >= 16px check)
- [ ] **Mobile viewport:** Often missing keyboard detection -- verify that the message list scrolls up when keyboard opens, keeping the most recent message visible
- [ ] **Mobile touch:** Often missing touch target sizes -- verify all interactive elements are at minimum 44x44px on mobile (Apple HIG requirement)
- [ ] **Mobile offline:** Often missing graceful degradation -- verify that the app shows a clear "No connection" state instead of silently failing when the server is unreachable
- [ ] **iOS app (Capacitor):** Often missing URL configuration -- verify that API calls work with a configured server URL, not `window.location`
- [ ] **iOS app (Capacitor):** Often missing safe area insets -- verify that content doesn't overlap the iPhone notch or home indicator bar (`env(safe-area-inset-top)`)

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Cache diverged from JSONL | LOW | Delete `cache.db`. It rebuilds from JSONL on next request. Design this as a supported operation: `DELETE /api/cache/clear`. |
| WAL checkpoint starvation | LOW | Restart server. WAL checkpoints on clean shutdown. Or call `PRAGMA wal_checkpoint(TRUNCATE)` via a maintenance endpoint. |
| Schema migration failure | LOW | Delete `cache.db`, let it recreate with the new schema. Only possible because cache is expendable (JSONL is source of truth). |
| Duplicate messages from live attach | MEDIUM | Frontend deduplication by message hash. Clear and re-fetch the session to reset state. Long-term: server-side dedup before sending over WebSocket. |
| iOS keyboard layout broken | MEDIUM | Revert to non-`dvh` viewport units. Use `visualViewport` API JavaScript fallback. Test on actual iOS device (not simulator). |
| Service worker serves stale app | HIGH | Users must manually clear site data (Settings -> Safari -> Clear Website Data). This is why service workers should NOT be added in v2.0. If already deployed: add `self.skipWaiting()` + `clients.claim()` to the new service worker and pray. |
| Capacitor app store URL rejected | HIGH | Apple review can reject apps that are "just a web wrapper." Ensure the app provides native value (push notifications, share sheet integration, file picking). If rejected, pivot to PWA-only strategy. |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Cache diverges from JSONL | SQLite data layer | Load session, modify JSONL externally, reload -- verify updated content appears |
| WAL checkpoint starvation | SQLite data layer | Run server for 1 hour with active use, verify WAL file stays < 10MB |
| Schema migration corruption | SQLite data layer | Delete cache.db, restart server, verify sessions load correctly from JSONL |
| Live attach duplicate messages | Live session attach | Start Claude Code CLI, attach in Loom, send 10 messages -- verify exactly 10 appear, not 20 |
| Live attach partial JSON lines | Live session attach | Send a rapid burst of messages (10+ in 2 seconds) -- verify no parse errors in logs |
| iOS keyboard layout | Mobile-native UX | Open on iPhone, tap composer, verify no zoom and keyboard doesn't cover input |
| Mobile touch targets | Mobile-native UX | Tap every button/link on mobile -- verify no mis-taps from undersized targets |
| Service worker stale content | NOT in v2.0 | Defer entirely. Only add service worker if iOS Capacitor app requires it. |
| Capacitor URL configuration | iOS app research | If Capacitor path chosen, verify API connectivity before any other feature work |

## Sources

- [better-sqlite3 performance docs](https://github.com/WiseLibs/better-sqlite3/blob/master/docs/performance.md) -- WAL mode, busy_timeout, concurrency
- [SQLite WAL mode docs](https://sqlite.org/wal.html) -- checkpoint starvation, reader/writer concurrency
- [chokidar v4 README](https://github.com/paulmillr/chokidar) -- awaitWriteFinish, depth, inotify implications
- [ENOSPC inotify fix guide (2026)](https://blog.path-finder.jp/troubleshooting/how-to-fix-enospc-system-limit-for-number-of-file/) -- max_user_watches tuning
- [PWA on iOS limitations (2025)](https://brainhub.eu/library/pwa-on-ios) -- push notifications, service worker lifecycle
- [PWA iOS limitations (2026)](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide) -- Safari restrictions
- [CSS dvh explained](https://savvy.co.il/en/blog/css/css-dynamic-viewport-height-dvh/) -- dynamic viewport units, interactive-widget
- [iOS viewport-resize-behavior](https://github.com/bramus/viewport-resize-behavior/blob/main/explainer.md) -- interactive-widget meta tag
- [Fix mobile keyboard overlap with dvh](https://www.franciscomoretti.com/blog/fix-mobile-keyboard-overlap-with-visualviewport) -- visualViewport API
- [Zustand persist middleware docs](https://zustand.docs.pmnd.rs/reference/integrations/persisting-store-data) -- partialize, onRehydrateStorage, storage adapters
- [Capacitor vs React Native (2025)](https://nextnative.dev/blog/capacitor-vs-react-native) -- WebView vs native UI tradeoffs
- [WebSocket reconnection guide](https://websocket.org/guides/reconnection/) -- state sync, sequence numbers
- [Service worker cache invalidation](https://iinteractive.com/resources/blog/taming-pwa-cache-behavior) -- skipWaiting, double-reload problem
- Loom server/index.js -- existing chokidar watcher configuration, WebSocket architecture
- Loom server/projects.js -- existing JSONL parsing, getSessionMessages implementation
- Loom src/src/stores/stream.ts -- existing stream state management
- Loom src/src/hooks/useSessionSwitch.ts -- existing session switching with memory cache

---
*Pitfalls research for: v2.0 "The Engine" -- SQLite cache, live attach, mobile, iOS*
*Researched: 2026-03-26*
