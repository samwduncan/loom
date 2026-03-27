# Loom v2.0 "The Engine" — Requirements

**Defined:** 2026-03-26
**Core Value:** Make AI agent work visible, beautiful, and controllable

## Data Layer (DATA)
- [x] **DATA-01**: Sessions load in <50ms from SQLite cache (vs 200-800ms JSONL parsing)
- [x] **DATA-02**: Cache auto-populates on first JSONL read, invalidates on mtime/size change
- [x] **DATA-03**: Session list loads from cached metadata in <10ms
- [x] **DATA-04**: Cache uses WAL mode in separate `cache.db` file (deletable without losing auth)
- [x] **DATA-05**: Background cache warmer indexes all JSONL files on server startup

## State Persistence (PERSIST)
- [x] **PERSIST-01**: Last-viewed session restores on browser reload
- [x] **PERSIST-02**: Scroll position restores per session on switch
- [x] **PERSIST-03**: Sidebar open/collapsed state and active project survive reload
- [x] **PERSIST-04**: Permission mode persists across sessions

## Live Session Attach (LIVE)
- [x] **LIVE-01**: Sidebar shows "active" indicator for sessions with running CLI processes
- [x] **LIVE-02**: User can attach to a running session and see real-time output
- [x] **LIVE-03**: JSONL file watcher uses fs.watch with byte-offset delta parsing (<200ms latency)
- [x] **LIVE-04**: User can detach from live session without interrupting the CLI process
- [x] **LIVE-05**: Permission prompts from attached sessions surface in Loom UI

## Mobile UX (MOBILE)
- [x] **MOBILE-01**: No auto-zoom on input focus (viewport meta + 16px inputs)
- [x] **MOBILE-02**: Touch-friendly tap targets (minimum 44x44px hit areas)
- [x] **MOBILE-03**: Sidebar drawer with swipe-to-close gesture
- [x] **MOBILE-04**: Composer keyboard avoidance (input stays above virtual keyboard)
- [x] **MOBILE-05**: Responsive message layout (code blocks horizontal scroll, images resize)

## Performance (PERF)
- [x] **PERF-01**: Request deduplication (concurrent identical fetches share one promise)
- [x] **PERF-02**: Optimistic UI updates for session operations (delete, rename, pin)
- [x] **PERF-03**: Lazy panel mounting (terminal, git panel only mount on first visit)
- [x] **PERF-04**: Skeleton loading states for all async content (no layout shifts)

## Conversation UX (CONV)
- [ ] **CONV-01**: Suggested follow-up prompts after assistant responses
- [ ] **CONV-02**: Conversation templates (quick-start prompts for common tasks)
- [ ] **CONV-03**: Background session indicator (notification when idle session gets response)
- [ ] **CONV-04**: Model selector in composer (switch between Claude/Gemini/Codex per message)

## PWA (PWA)
- [ ] **PWA-01**: PWA manifest enables "Add to Home Screen" on mobile
- [ ] **PWA-02**: App icon and splash screen for installed PWA
- [ ] **PWA-03**: No service worker (manifest-only — avoid stale content on Tailscale network)

## iOS Research (IOS)
- [ ] **IOS-01**: Document Capacitor integration path with tradeoffs
- [ ] **IOS-02**: Verify Tailscale DNS resolution from WKWebView sandbox
- [ ] **IOS-03**: Prototype minimal Capacitor shell with Loom web build

## Future Requirements (deferred)
- Message editing with branch navigation (depends on data layer maturity)
- Conversation forking (depends on Claude SDK --fork-session investigation)
- Full service worker with offline support (reconsider when PWA usage data available)
- Capacitor App Store submission (depends on IOS research results)

## Out of Scope
- Voice mode / text-to-speech — Not aligned with coding agent mission
- Plugin/extension marketplace — Over-engineering for single-user tool
- Light mode — Dark-only per Constitution
- Local/offline LLM support — Loom consumes cloud models only
- Full IDE replacement — Complements VS Code/Cursor

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | Phase 50 | Complete |
| DATA-02 | Phase 50 | Complete |
| DATA-03 | Phase 50 | Complete |
| DATA-04 | Phase 50 | Complete |
| DATA-05 | Phase 50 | Complete |
| PERSIST-01 | Phase 51 | Complete |
| PERSIST-02 | Phase 51 | Complete |
| PERSIST-03 | Phase 51 | Complete |
| PERSIST-04 | Phase 51 | Complete |
| LIVE-01 | Phase 52 | Complete |
| LIVE-02 | Phase 52 | Complete |
| LIVE-03 | Phase 52 | Complete |
| LIVE-04 | Phase 52 | Complete |
| LIVE-05 | Phase 52 | Complete |
| MOBILE-01 | Phase 53 | Complete |
| MOBILE-02 | Phase 53 | Complete |
| MOBILE-03 | Phase 53 | Complete |
| MOBILE-04 | Phase 53 | Complete |
| MOBILE-05 | Phase 53 | Complete |
| PERF-01 | Phase 54 | Complete |
| PERF-02 | Phase 54 | Complete |
| PERF-03 | Phase 54 | Complete |
| PERF-04 | Phase 54 | Complete |
| CONV-01 | Phase 55 | Pending |
| CONV-02 | Phase 55 | Pending |
| CONV-03 | Phase 55 | Pending |
| CONV-04 | Phase 55 | Pending |
| PWA-01 | Phase 56 | Pending |
| PWA-02 | Phase 56 | Pending |
| PWA-03 | Phase 56 | Pending |
| IOS-01 | Phase 57 | Pending |
| IOS-02 | Phase 57 | Pending |
| IOS-03 | Phase 57 | Pending |
