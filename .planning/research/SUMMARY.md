# Project Research Summary

**Project:** Loom v2.0 "The Engine"
**Domain:** Self-hosted AI coding agent workspace — data layer, live session attach, mobile-native UX, iOS app path
**Researched:** 2026-03-26
**Confidence:** HIGH (stack, architecture, pitfalls) / MEDIUM (iOS App Store specifics)

## Executive Summary

Loom v2.0 is a focused performance and mobility upgrade for a 49K+ LOC, 609-commit React workspace already shipping terminal, filesystem, git, and multi-provider chat. The central challenge is not building new surface area — it's replacing a slow, file-scan-on-every-load data model with a SQLite cache that makes every interaction feel native-app fast. The research is unambiguous: better-sqlite3 (already installed) is the right tool, JSONL files remain the canonical source of truth, and the cache must be designed as freely deletable and rebuildable at all times. Every performance, persistence, and mobile feature in this milestone depends on that foundation being correct.

The two killer differentiators for this milestone are the SQLite data layer and live session attach. Live session attach — watching a running Claude Code CLI session in real-time from the browser — requires nothing beyond custom byte-offset JSONL tailing with `fs.watch` (no new backend dependencies) and a new WebSocket message type routed through the existing stream multiplexer. No competitor web interface can do this. The mobile story is not "chat from your phone" but "monitor your AI agent from your phone" — this is where mobile + live attach combine into something Cursor charges for with cloud infrastructure and Loom provides for free from a personal server.

The top risk is cache-JSONL divergence: serving phantom or stale messages if mtime-based invalidation is wrong or if the delete path doesn't synchronously purge the cache. The second risk is the iOS virtual keyboard destroying the chat composer layout, which requires `dvh` units and the `visualViewport` API, not the `100vh` currently in use. Service workers must NOT be added in v2.0 — the stale-content trap is severe for a pinned-tab app and the offline benefit is near-zero for a server-dependent tool.

## Key Findings

### Recommended Stack

The stack requires no new production dependencies for v2.0. The backend message cache uses `better-sqlite3` (already installed at `^12.6.2`). Live JSONL tailing uses `fs.watch` (built into Node.js 22). State persistence uses Zustand `persist` middleware (already in use). The single new dev dependency is `vite-plugin-pwa` for the PWA manifest — but service worker registration should be deferred to a later PWA-specific phase. For the iOS app path: PWA via Tailscale MagicDNS HTTPS is immediately viable and takes one day. Capacitor 8 (wrapping the existing Vite/React app in a WKWebView) is the right long-term path. React Native and native Swift are both explicitly rejected — 49K LOC of web-native React does not get rewritten for a single-user tool.

**Core technologies for v2.0:**
- `better-sqlite3` (existing): Message/session cache — synchronous API, 10-50x faster than async alternatives for bounded reads, already proven in auth.db
- `fs.watch` (Node built-in): JSONL live tailing — inotify-based, zero-CPU idle, millisecond latency vs. chokidar's 2s stabilization delay
- `zustand/middleware persist` (existing): UI state persistence across browser restart — extend to activeSessionId, scroll positions, active tabs
- `vite-plugin-pwa` (new dev dep, manifest only): PWA manifest + icon generation for mobile install-to-homescreen; service worker deferred
- `@capacitor/core ^8.3.0` (post-v2.0): iOS App Store distribution without code duplication

**Explicitly rejected:** sql.js / wa-sqlite, IndexedDB for messages, React Native, @use-gesture/react, node-tail, socket.io, Redis, Turso — all evaluated and rejected with documented rationale.

### Expected Features

**Must have — P1 (defines whether v2.0 is a meaningful upgrade):**
- SQLite data layer — Message cache for sub-200ms session switching. Parse JSONL once, serve from SQLite. Foundation for everything else.
- State persistence — Last session, scroll position, sidebar state, active tab survive browser restart. Daily-driver requirement.
- Live session attach — JSONL file watcher streams running CLI sessions to browser in real-time. THE killer differentiator.
- Mobile-responsive layout — Sidebar drawer, 44px+ touch targets, composer above keyboard, safe area insets, no zoom on input focus.
- Performance — Lazy loading, request deduplication, optimistic updates. Every 100ms saved compounds across hundreds of daily interactions.

**Should have — P2 (this milestone if time permits):**
- Suggested follow-up prompts — Extract potential questions from AI responses as pill chips. Low effort, high perceived value.
- Conversation templates / system prompts — Create and save project-scoped system prompt templates.
- Background session indicators — Sidebar dots showing which sessions are actively streaming.
- Desktop notifications — Notification API when background session completes or needs permission.
- Enhanced empty state — Project-aware suggestions, recent session quick-resume.

**Defer to v2.1+:**
- Message editing with branch navigation — Requires backend fork support and branch storage on top of the data layer.
- Multi-provider model switching — Full v2.1 "The Power" scope.
- Conversation sharing via links — Auth/access design complexity for self-hosted.
- Cross-conversation memory — High effort, uncertain value in coding context.
- Cost tracking dashboard — Per-turn usage shown; aggregation is nice-to-have.
- PWA service worker and install flow — Manifest only for v2.0; service worker is a dedicated later effort.

**Anti-features (do not build):**
- Offline chat with local models — Quality gap makes Loom feel broken
- Full IDE (LSP, debugger, extensions) — Cursor/VS Code have thousands of engineer-years invested; CodeMirror in Loom is for viewing/quick-edit
- Typewriter streaming — Already banned by Constitution; rAF buffer is superior
- Plugin/extension marketplace — MCP servers ARE the extension mechanism
- Voice/video input — Coding via voice is poor UX; OS dictation handles this
- Light mode — Dark-only is a deliberate brand choice

### Architecture Approach

The architecture adds a pure caching layer between the existing JSONL file system and the existing REST endpoints. JSONL files remain the source of truth — Claude CLI owns them and Loom never writes to them. SQLite is a rebuildable cache: delete `messages.db` and the next request rebuilds from JSONL at the cost of a slower first load. Live session attach extends the existing `/ws` WebSocket with two new message types (`attach-session`, `live-session-data`) routed through the existing stream multiplexer — no new WebSocket endpoint, no new connection. The iOS path wraps the existing Vite build output in Capacitor's WKWebView with zero code changes to the React application.

**Major new components:**
1. `server/cache/message-cache.js` — SQLite read/write for session metadata + messages, WAL mode, `user_version` migration guard, separate `messages.db` file from `auth.db`
2. `server/cache/session-watcher.js` — Byte-offset JSONL tailing via `fs.watch`, EventEmitter interface, per-session watcher lifecycle
3. `server/cache/cache-warmer.js` — Background JSONL-to-SQLite indexing on startup, incremental by mtime comparison, non-blocking via `setImmediate()`

**Modified components:**
- `server/projects.js` — Add cache-first lookup; JSONL fallback on miss; write-through on parse
- `server/index.js` — Wire SessionWatcher to `change` events; broadcast `live-session-data` over WebSocket
- `stream-multiplexer.ts` — Add `onLiveSessionMessage` callback for non-owned session streams
- `websocket-init.ts` — Wire `live-session-data` to `transformBackendMessages()` + `timeline.addMessage()`

**Schema design decision:** Store raw JSONL entries (`raw_json TEXT NOT NULL`) rather than normalized columns. Claude CLI schema changes between versions (`"2.1.59"` through `"2.1.71"` observed in loom project alone). Raw storage means cache output matches existing REST response format exactly — `transformBackendMessages()` applies without cache migrations on CLI upgrades.

### Critical Pitfalls

1. **Cache-JSONL divergence** — Stale or phantom messages if mtime-based invalidation is skipped or the delete path misses the cache. Prevent: compare `fs.stat()` mtime before every cache read; delete from SQLite synchronously when `deleteSession()` runs. Recovery: delete `cache.db`, rebuild from JSONL.

2. **WAL checkpoint starvation** — WAL file grows without bound if long-running reads block checkpointing. Prevent: `PRAGMA journal_mode = WAL`, `PRAGMA busy_timeout = 5000`, periodic `wal_checkpoint(TRUNCATE)` on idle. Do NOT copy the `auth.db` setup which omits these.

3. **Live attach duplicate messages** — Same entries appear twice if byte-offset tracking has a race window, or partial JSON lines are parsed mid-write. Prevent: track exact byte offset, buffer incomplete lines until newline, deduplicate by entry UUID. Use a separate per-session watcher at ~100ms latency — NOT the existing chokidar watcher which has a 1.5s debounce and explicitly ignores `change` events (server/index.js:190-191).

4. **iOS virtual keyboard layout destruction** — Composer disappears behind keyboard or viewport jumps on input focus. Prevent: replace `100vh` with `100dvh`, add `interactive-widget=resizes-content` to viewport meta, ensure composer textarea has `font-size: 16px` minimum, use `visualViewport` API for keyboard height detection.

5. **Service worker stale content** — Users stuck on old version indefinitely if service worker caches `index.html`. Prevent: do NOT add a service worker in v2.0. PWA manifest can exist without one. Recovery requires users to manually clear Safari data — unacceptable UX for a tool used in pinned tabs.

## Implications for Roadmap

### Phase 1: SQLite Data Layer
**Rationale:** Everything else depends on fast data access. Session switching speed is the single most impactful UX change. Architecture specifies build order: MessageCache module first (no dependencies), then CacheWarmer, then wire into projects.js. Verify with actual JSONL files before proceeding to Phase 2.
**Delivers:** Sub-20ms session message loads (from 200-800ms), sub-10ms session list (from ~500ms), `messages.db` with WAL mode, `user_version` migration guard, `DELETE /api/cache/clear` maintenance endpoint.
**Addresses:** Instant session switching (P1), session search speedup, foundation for branching/templates.
**Avoids:** Cache-JSONL divergence (Pitfall 1), WAL starvation (Pitfall 2), schema migration corruption (Pitfall 3).
**Research flag:** Skip `/gsd:research-phase` — architecture is fully specified in ARCHITECTURE.md with working code samples and exact SQLite pragmas.

### Phase 2: State Persistence
**Rationale:** Low-complexity, high-impact. Depends on Phase 1 being reliable (scroll position restoration is meaningless if sessions don't load fast). Zustand persist middleware already exists; this is extension and configuration, not new infrastructure.
**Delivers:** Last active session restored on reload, scroll position per session via sessionStorage keyed by session ID, sidebar state, active tab persistence, draft message verification across session switches.
**Addresses:** "Survive browser restart" table-stakes requirement. All P1 state persistence items from FEATURES.md.
**Avoids:** Zustand persist being misused for message data (messages should flow JSONL → SQLite → REST → Zustand, NOT through persist middleware).
**Research flag:** Skip `/gsd:research-phase` — established pattern in codebase.

### Phase 3: Live Session Attach
**Rationale:** Independent of data layer (architecture confirms this explicitly). The marquee differentiator; deserves its own focused phase. Can ship any time after Phase 1 validates the WebSocket extension pattern.
**Delivers:** Real-time streaming of external CLI sessions to browser, attach/detach controls with "Attach" button visible when session last_activity < 5 minutes ago, pulsing live indicator badge, SessionWatcher lifecycle (auto-detach after 30s of inactivity), WebSocket protocol extension.
**Uses:** `fs.watch` (built-in), existing `/ws` WebSocket, existing stream multiplexer callback pattern, existing `transformBackendMessages()` + `timeline.addMessage()`.
**Avoids:** Duplicate messages from byte-offset race (Pitfall 4), partial JSON lines, inotify handle leaks from unwatched sessions, conflation with existing chokidar directory watcher.
**Research flag:** Skip `/gsd:research-phase` — implementation fully specified in ARCHITECTURE.md with working SessionWatcher class.

### Phase 4: Mobile-Responsive Layout
**Rationale:** Independent of backend work. Pure CSS and frontend. Phase 4 benefits from Phase 2 (scroll position persistence compounds the mobile monitoring use case). The "monitor your agent from phone" story requires this before the PWA phase.
**Delivers:** Sidebar as full-screen drawer at 767px breakpoint, `dvh` viewport replacement, `font-size: 16px` minimum on composer textarea, `env(safe-area-inset-*)` padding on composer and header, `overscroll-behavior-y: contain` on message list, 44px minimum touch targets (audit all buttons/links), swipe gesture for sidebar toggle (~40 lines of touch event handlers, no library), `visualViewport` API for keyboard height detection.
**Addresses:** All P1 mobile-responsive items. The "monitor AI agent from phone" use case.
**Avoids:** iOS keyboard layout destruction (Pitfall 5), pull-to-refresh conflict with message list scroll, invisible/undersized touch targets.
**Research flag:** Skip `/gsd:research-phase` — exact CSS fixes documented in PITFALLS.md with property names and values.

### Phase 5: Performance Hardening
**Rationale:** Build on Phase 1's data layer. Request deduplication, optimistic updates, and lazy panel mounting are clean-up work that requires the SQLite foundation to be in place and tested first.
**Delivers:** `AbortController` request deduplication guard (`Map<string, Promise>`) in `apiFetch()`, optimistic updates for rename/delete/pin with error rollback, `React.lazy()` for FileTree/Terminal/GitPanel/Editor (~100-120KB initial JS reduction), `loading="lazy"` on message images, stale-while-revalidate pattern for session switching (return cache immediately, background revalidate).
**Addresses:** P1 performance items. Speed as a compounding daily-driver feature.
**Avoids:** Re-parsing entire JSONL on every cache miss, loading all 383 sessions at startup.
**Research flag:** Skip `/gsd:research-phase` — standard SWR patterns, all using existing infrastructure.

### Phase 6: P2 Enhancements
**Rationale:** Deferred until P1 items are solid. Polish on top of a fast, reliable foundation. Group these together since they share no inter-dependencies and can be ordered by implementation complexity.
**Delivers:** Suggested follow-up prompts (client-side extraction from response text, rendered as pill chips below assistant messages), conversation templates stored in SQLite (project-scoped), background session indicators (pulsing sidebar dots for active streams), desktop Notification API integration (permission prompt, fire on session complete), enhanced empty state with project context and recent session quick-resume.
**Addresses:** All P2 features from FEATURES.md.
**Research flag:** Desktop Notification API permissions on mobile PWA vary between browsers and iOS versions. Recommend quick research spike before implementing the notification feature specifically.

### Phase 7: PWA Manifest
**Rationale:** Manifest-only PWA (no service worker) is safe and immediately useful. Service worker is explicitly deferred due to stale-content risk. This phase makes Loom installable on mobile via Tailscale HTTPS, enabling the "monitor from phone" use case without native app complexity.
**Delivers:** `manifest.json`, app icons at required resolutions, `vite-plugin-pwa` configuration with service worker registration DISABLED, "Add to Home Screen" support on iOS/Android via Tailscale MagicDNS HTTPS.
**Addresses:** P3 PWA item. Mobile install path for monitoring use case.
**Avoids:** Service worker stale content trap (Pitfall 6) — explicitly not registering service worker in this phase.
**Research flag:** Verify `vite-plugin-pwa ^0.21.x` + Vite 7 compatibility before installing (flagged in STACK.md version matrix). Quick check required.

### Phase 8: Capacitor iOS Shell (Post-v2.0)
**Rationale:** Feature surface must be stable before wrapping in a native shell. iOS shell changes are painful to iterate on. Do PWA first; add Capacitor when push notifications or haptics are desired or App Store distribution is needed. Explicitly post-v2.0.
**Delivers:** Capacitor 8 setup (`npx cap init`), Xcode project, Tailscale URL explicit configuration in `capacitor.config.ts`, safe area native handling, status bar styling, splash screen, `@capacitor/preferences` for JWT token storage (iOS Keychain, not localStorage).
**Addresses:** Long-term iOS App Store distribution path.
**Avoids:** Hardcoded `window.location` URLs (broken in Capacitor WKWebView), cleartext JWT in localStorage, WKWebView out-of-memory white screen without recovery.
**Research flag:** This phase REQUIRES `/gsd:research-phase` — Capacitor URL config with Tailscale HTTPS, App Store compliance for WebView apps, and `@capacitor/preferences` vs `localStorage` for auth are niche topics with sparse up-to-date documentation.

### Phase Ordering Rationale

- **SQLite first** because every user-visible improvement (speed, persistence, search, branching) either directly requires it or is trivially easy once it exists. Building mobile or live attach on a slow data layer is building on sand.
- **Persistence before mobile** because scroll position restoration on mobile is the most important mobile UX detail — it requires Phase 1's data layer to be reliable.
- **Live attach as dedicated phase** because it's the marquee feature and should ship cleanly without being tangled with performance cleanup or mobile CSS work.
- **Performance after live attach** because performance hardening (optimistic updates, lazy loading) modifies the same code paths as live attach, and should wait for live attach to stabilize.
- **P2 enhancements after P1 is solid** because shipping a fast, reliable foundation is more valuable than shipping three half-baked features.
- **PWA manifest before Capacitor** because manifest is trivial and immediately useful; Capacitor requires a stable surface and Mac for Xcode compilation.
- **Service worker deferred entirely** from v2.0 because the stale-content recovery path (users manually clearing Safari data) is unacceptable for a tool used daily in pinned tabs.

### Research Flags

Phases requiring `/gsd:research-phase` during planning:
- **Phase 8 (Capacitor iOS):** Niche topic. Tailscale HTTPS DNS resolution in WKWebView sandbox, App Store compliance for WKWebView wrapper apps, Capacitor 8 + Vite 7 build pipeline specifics — documented patterns are sparse.
- **Phase 6 (P2, partial):** Desktop Notification API permission handling on mobile PWA (iOS 16.4+ required, behavior varies). Quick research spike before implementing notifications.
- **Phase 7 (PWA):** Verify `vite-plugin-pwa ^0.21.x` Vite 7 compatibility before installing — explicitly flagged in STACK.md.

Phases with standard patterns (skip research):
- **Phase 1 (SQLite):** Architecture fully specified with exact schema, pragmas, WAL config, and build order. Working code samples in ARCHITECTURE.md.
- **Phase 2 (State Persistence):** Zustand persist middleware already in use; extending existing pattern.
- **Phase 3 (Live Attach):** Implementation fully specified with working SessionWatcher class in ARCHITECTURE.md.
- **Phase 4 (Mobile):** Exact CSS fixes documented in PITFALLS.md with property names, values, and rationale.
- **Phase 5 (Performance):** Standard SWR/deduplication patterns; all using existing infrastructure.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core additions use already-installed dependencies. Only new dep (`vite-plugin-pwa`) needs Vite 7 compat check. Capacitor 8 requirements verified 2026-03-26. All rejections (sql.js, Redis, React Native, etc.) have documented rationale. |
| Features | HIGH | 7 competitor products analyzed with official release notes. Existing reference-app-analysis.md and chat-interface-standards.md cross-referenced. Live attach feasibility confirmed against Happy Coder session scanner pattern. |
| Architecture | HIGH | Data layer is proven pattern (Open WebUI, LibreChat). JSONL tailing is Node.js idiomatic. WebSocket extension reuses existing multiplexer infrastructure. Anti-patterns documented against actual codebase line numbers. |
| Pitfalls | HIGH | Pitfalls confirmed against actual Loom codebase (projects.js, server/index.js, base.css line numbers cited). WAL behavior documented against SQLite official spec. iOS keyboard behavior documented against MDN + browser testing reports. |

**Overall confidence: HIGH**

### Gaps to Address

- **Vite 7 + vite-plugin-pwa compatibility:** STACK.md flags this explicitly — verify before installing in Phase 7. May require pinning to a specific minor version.
- **Capacitor + Tailscale DNS resolution in WKWebView sandbox:** Whether a Tailscale MagicDNS hostname (`machine.tailNNNN.ts.net`) resolves from inside iOS app sandbox needs device testing. This is Phase 8's first validation step.
- **App Store review for WKWebView apps:** Apple has historically rejected pure web wrappers. Capacitor apps with native plugin integration (push notifications, biometrics) generally pass. Not guaranteed — flag as risk during Phase 8 planning, have PWA fallback.
- **inotify watch limit on this machine:** The existing chokidar watcher with `depth: 3` already consumes significant inotify handles across a large project tree. Adding per-session `fs.watch` handles is bounded (1-3 simultaneous) but worth verifying against `cat /proc/sys/fs/inotify/max_user_watches` before shipping Phase 3.
- **better-sqlite3 + WAL + Node 22:** The existing `auth.db` does not use WAL mode and has been working fine. WAL mode for `messages.db` (much larger, higher write volume) needs verification under concurrent load. CacheWarmer's `setImmediate()` yielding pattern needs testing against the event loop during active streaming sessions.

## Sources

### Primary (HIGH confidence)
- `server/projects.js` — Existing JSONL parsing, getSessionMessages implementation, line-level analysis
- `server/index.js` — Existing chokidar watcher config (lines 168-206), WebSocket architecture, session handling
- `src/src/styles/base.css` — Existing `overflow: hidden` pattern on html/body
- `src/src/hooks/useSessionSwitch.ts` — Existing session switching with in-memory cache pattern
- [better-sqlite3 GitHub](https://github.com/WiseLibs/better-sqlite3) — Synchronous API docs, WAL mode, busy_timeout
- [Capacitor 8 migration guide](https://capacitorjs.com/docs/updating/8-0) — Node 22 requirement, Swift PM default
- [SQLite WAL mode docs](https://sqlite.org/wal.html) — Checkpoint starvation, reader/writer concurrency
- [Node.js fs.watch docs](https://nodejs.org/api/fs.html) — File watching API, `start` option for byte-offset reads
- [Tailscale HTTPS certificates docs](https://tailscale.com/docs/how-to/set-up-https-certificates) — MagicDNS cert provisioning

### Secondary (MEDIUM confidence)
- [ChatGPT Release Notes](https://help.openai.com/en/articles/6825453-chatgpt-release-notes) — Competitor feature matrix
- [Claude Pro Mobile Features](https://aionx.co/claude-ai-reviews/claude-pro-mobile-app-features/) — Competitor mobile UX
- [Cursor Features](https://cursor.com/features) + [CLI Cloud Handoff](https://cursor.com/changelog/cli-jan-16-2026) — Live agent monitoring comparison
- [iOS PWA limitations 2026](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide) — Storage eviction, push limits, Safari restrictions
- [CSS dvh explained](https://savvy.co.il/en/blog/css/css-dynamic-viewport-height-dvh/) — Dynamic viewport units, interactive-widget
- [Fix mobile keyboard overlap](https://www.franciscomoretti.com/blog/fix-mobile-keyboard-overlap-with-visualviewport) — visualViewport API pattern
- [SQLite WAL mode optimizations (phiresky)](https://phiresky.github.io/blog/2020/sqlite-performance-tuning/) — Pragma recommendations, 64MB cache setting
- Existing `.planning/reference-app-analysis.md`, `.planning/chat-interface-standards.md` — Cross-referenced competitor analysis

### Tertiary (LOW confidence — verify before adopting)
- [Capacitor vs React Native (2025)](https://nextnative.dev/blog/capacitor-vs-react-native) — WKWebView performance claims; test on device
- [PWA vs Native App 2026](https://progressier.com/pwa-vs-native-app-comparison-table) — iOS PWA capability table; verify specifics on target iOS version
- App Store PWA/WebView acceptance — Apple review policy for WKWebView apps is undocumented and subject to change; treat as risk

---
*Research completed: 2026-03-26*
*Ready for roadmap: yes*
