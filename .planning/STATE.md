---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: "The Engine"
status: Ready to execute
stopped_at: Completed 58-01-PLAN.md
last_updated: "2026-03-27T22:02:58.762Z"
progress:
  total_phases: 9
  completed_phases: 8
  total_plans: 17
  completed_plans: 16
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-26)

**Core value:** Make AI agent work visible, beautiful, and controllable
**Current focus:** Phase 58 — production-build-nginx

## Current Position

Phase: 58 (production-build-nginx) — EXECUTING
Plan: 2 of 2

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: --
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

*Updated after each plan completion*
| Phase 50 P01 | 2min | 1 tasks | 2 files |
| Phase 50 P02 | 3min | 2 tasks | 3 files |
| Phase 51 P01 | 3min | 2 tasks | 3 files |
| Phase 52 P01 | 2min | 2 tasks | 2 files |
| Phase 52 P02 | 4min | 2 tasks | 7 files |
| Phase 52 P03 | 4min | 2 tasks | 3 files |
| Phase 53 P02 | 2min | 2 tasks | 5 files |
| Phase 53 P01 | 2min | 1 tasks | 7 files |
| Phase 53 P03 | 2min | 2 tasks | 5 files |
| Phase 54 P02 | 3min | 1 tasks | 2 files |
| Phase 54 P01 | 3min | 2 tasks | 3 files |
| Phase 55 P01 | 3min | 2 tasks | 4 files |
| Phase 55 P02 | 3min | 2 tasks | 8 files |
| Phase 57 P01 | 5min | 2 tasks | 6 files |
| Phase 58 P01 | 6min | 2 tasks | 5 files |

## Accumulated Context

### Decisions

- [v1.5] Spring easing profiles: gentle (modals), snappy (tool expand), bouncy (scroll pill)
- [v1.5] Glass overlays: oklch(0 0 0 / 0.35) opacity, static backdrop-filter (no animation)
- [v2.0-pre] Mobile sidebar: overlay drawer with hamburger, backdrop dismiss, auto-close on navigation
- [v2.0-pre] Backend cwd fix: extractProjectDirectory() resolves projectPath before SDK call
- [v2.0-pre] ComposerStatusBar: permission mode, model name, context window, 5h%, burn rate, cost
- [v2.0-pre] Stream store: added tokenBudget, modelName fields; multiplexer extracts model from result
- [v2.0-pre] UI store v7: added permissionMode with persistence and migration
- [v2.0] SQLite cache is freely deletable -- JSONL remains source of truth, cache rebuilds from scratch
- [v2.0] No service worker in v2.0 -- manifest-only PWA to avoid stale content trap
- [v2.0] Zero new production deps -- better-sqlite3 already installed, fs.watch is built-in
- [Phase 50]: Schema versioning via PRAGMA user_version -- drop-and-rebuild on mismatch (cache is disposable)
- [Phase 50]: Separate cache.db from auth.db -- deletable without auth impact
- [Phase 50]: Pre-compiled prepared statements on this._stmts for zero per-call overhead
- [Phase 50]: Cache-first with silent fallback -- cache errors never break the API, always fall through to JSONL
- [Phase 50]: Write-through on JSONL miss -- first read populates cache automatically for next time
- [Phase 50]: Background warmer is fire-and-forget -- server fully functional without cache via JSONL fallback
- [Phase 51]: sessionStorage for scroll positions -- ephemeral, auto-cleans on tab close, survives F5
- [Phase 51]: LastSessionRedirect reads persisted activeSessionId for smart root-path routing
- [Phase 52]: Singleton SessionWatcher: one instance per server, shared across all WS clients
- [Phase 52]: clientAttachments Map<ws, Set<sessionId>> for multi-client subscription tracking with orphan cleanup
- [Phase 52]: Static import of transformBackendMessages in websocket-init for live session data transformation
- [Phase 52]: Green live dot (oklch 0.72 0.19 142, 2s pulse) visually distinct from blue streaming dot (1.5s pulse)
- [Phase 52]: didAttachRef pattern: track attach state in ref written only inside useEffect to satisfy React 19 refs rule
- [Phase 52]: Selector-only store access in ChatView components (no getState) for Constitution 4.5 compliance
- [Phase 53]: DOMMatrix for swipe distance reading; 100px close threshold; interactive-widget primary + visualViewport fallback for keyboard avoidance
- [Phase 53]: Mobile-first touch targets: 44px default with md: breakpoint restoring desktop sizes
- [Phase 53]: Mobile content containment: overflow-hidden on markdown-body + max-w-full min-w-0 on code blocks + break-all on inline code
- [Phase 54]: useState over useRef for visitedTabs to satisfy React 19 react-hooks/refs lint rule
- [Phase 54]: Dedup map stores raw fetch Promise<Response>, consumers clone independently
- [Phase 54]: Optimistic delete for single sessions only; bulk delete waits for API
- [Phase 55]: Client-side regex heuristics for follow-up suggestions (code/error/list/default categories)
- [Phase 55]: Static amber dot (no animation) for background session notifications
- [Phase 55]: Provider-specific options: Claude gets images/fileMentions/permissionMode; Codex/Gemini get projectPath/sessionId only
- [Phase 57]: Capacitor 7.6.1 over 8.x -- Xcode 16+ requirement is more accessible than 26+
- [Phase 57]: Tailscale DNS from WKWebView: HIGH confidence -- system-wide VPN routes all traffic including WKWebView networking daemon
- [Phase 57]: API base URL abstraction is highest-value prep for Capacitor bundled assets mode
- [Phase 58]: worker_shutdown_timeout in nginx.conf main context (not conf.d/) -- directive is main-context only
- [Phase 58]: Three-tier proxy: Tailscale Serve :5443 -> nginx :5580 -> Express :5555 with brotli/gzip and immutable caching
- [Phase 58]: Graceful shutdown: PTY kill -> session unwatch -> file watcher close -> WS close -> DB close -> HTTP drain -> exit

### Pending Todos

None.

### Blockers/Concerns

- Weekly rate limit % not available from SDK -- only from Claude Code runtime JSON
- Phases 48-49 (DecryptedText, StarBorder) deferred from v1.5 to v2.2 "The Polish"
- Verify `vite-plugin-pwa` compatibility with Vite 7 before Phase 56
- Capacitor + Tailscale DNS resolution in WKWebView sandbox needs device testing (Phase 57)

## Session Continuity

Last session: 2026-03-27T22:02:58.760Z
Stopped at: Completed 58-01-PLAN.md
Resume: `/gsd:complete-milestone` or `/gsd:verify-work 57`
