---
phase: 58-production-build-nginx
plan: 01
subsystem: infra
tags: [nginx, tailscale, systemd, graceful-shutdown, brotli, reverse-proxy, tls]

requires:
  - phase: 50-sqlite-cache
    provides: message-cache with .close() method for graceful shutdown
  - phase: 52-live-session-attach
    provides: session-watcher with .unwatchAll() method for graceful shutdown

provides:
  - nginx reverse proxy on 127.0.0.1:5580 with static asset serving
  - Tailscale Serve TLS termination on port 5443
  - Express graceful shutdown handler (SIGTERM/SIGINT)
  - systemd service with on-failure restart and stop timeout
  - nginx dependency ordering on loom-backend via drop-in

affects: [58-02, deploy-pipeline, production-operations]

tech-stack:
  added: [libnginx-mod-http-brotli-filter, libnginx-mod-http-brotli-static]
  patterns: [graceful-shutdown-with-resource-cleanup, three-tier-proxy-chain]

key-files:
  created:
    - /etc/nginx/sites-available/loom
    - /etc/systemd/system/nginx.service.d/loom-order.conf
  modified:
    - server/index.js
    - /etc/nginx/nginx.conf
    - /etc/systemd/system/loom-backend.service

key-decisions:
  - "worker_shutdown_timeout in nginx.conf main context (not conf.d/) -- directive is main-context only"
  - "Tailscale Serve persists across restarts natively -- no oneshot service fallback needed"
  - "PROD-01 already reflected port 5443 -- no REQUIREMENTS.md change needed"

patterns-established:
  - "Three-tier proxy chain: Tailscale Serve :5443 -> nginx :5580 -> Express :5555"
  - "Graceful shutdown: kill PTYs -> unwatch sessions -> close file watchers -> close WS -> close DB -> drain HTTP -> exit"

requirements-completed: [PROD-01, PROD-02, PROD-05]

duration: 6min
completed: 2026-03-27
---

# Phase 58 Plan 01: Nginx + Tailscale Serve + Graceful Shutdown Summary

**Three-tier proxy chain (Tailscale TLS :5443 -> nginx :5580 -> Express :5555) with brotli/gzip compression, immutable asset caching, and Express graceful shutdown draining all resources on SIGTERM**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-27T21:55:01Z
- **Completed:** 2026-03-27T22:01:32Z
- **Tasks:** 2
- **Files modified:** 5 (1 in-repo, 4 system-level)

## Accomplishments

- nginx serves Loom static assets from dist/ with brotli (level 4) + gzip (level 6), immutable 1-year cache on hashed assets, no-cache on index.html
- Tailscale Serve terminates TLS on port 5443, forwarding to nginx on 127.0.0.1:5580 -- full HTTPS path verified working
- Express graceful shutdown handler cleans up PTY sessions, session watchers, project file watchers, WebSocket connections, message cache DB, and HTTP connections before exit
- systemd service updated: Restart=on-failure, TimeoutStopSec=15, KillSignal=SIGTERM
- nginx starts after loom-backend via systemd drop-in ordering (After= + Wants=)
- worker_shutdown_timeout 10s prevents zombie nginx workers on reload with long-lived WS connections

## Task Commits

Each task was committed atomically:

1. **Task 1: nginx site config, brotli modules, Tailscale Serve** + **Task 2: systemd updates, graceful shutdown** - `ccb7fab` (feat)
   - Task 1 changes were all system-level (no repo files); Task 2's server/index.js change committed here

**Plan metadata:** pending (docs commit)

## Files Created/Modified

### In-repo
- `server/index.js` - Added gracefulShutdown() function and SIGTERM/SIGINT signal handlers

### System-level (not in repo)
- `/etc/nginx/sites-available/loom` - nginx reverse proxy + static serving config (listen 127.0.0.1:5580)
- `/etc/nginx/sites-enabled/loom` - Symlink activating the Loom nginx site
- `/etc/nginx/nginx.conf` - Added worker_shutdown_timeout 10s in main context
- `/etc/systemd/system/loom-backend.service` - Restart=on-failure, TimeoutStopSec=15, KillSignal=SIGTERM
- `/etc/systemd/system/nginx.service.d/loom-order.conf` - After=loom-backend.service + Wants=loom-backend.service

## Decisions Made

1. **worker_shutdown_timeout in nginx.conf main context** -- The plan specified `/etc/nginx/conf.d/worker-timeout.conf`, but `worker_shutdown_timeout` is a main-context directive, not valid inside `http{}`. Placed it directly in nginx.conf after the modules-enabled include line.

2. **No Tailscale Serve persistence service needed** -- `--bg` flag persists config across tailscaled restarts. Verified by restarting tailscaled and confirming port 5443 mapping survived.

3. **REQUIREMENTS.md already up to date** -- PROD-01 already read "port 5443 via Tailscale Serve" (updated during planning phase), so no change was needed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] worker_shutdown_timeout location**
- **Found during:** Task 1 (nginx config creation)
- **Issue:** Plan specified `/etc/nginx/conf.d/worker-timeout.conf` but `worker_shutdown_timeout` is a main-context directive -- nginx rejects it inside the `http{}` block where `conf.d/*.conf` is included
- **Fix:** Added the directive directly to `/etc/nginx/nginx.conf` in the main context (after `include modules-enabled` line)
- **Files modified:** `/etc/nginx/nginx.conf`
- **Verification:** `sudo nginx -t` passes; `grep worker_shutdown_timeout /etc/nginx/nginx.conf` confirms presence
- **Committed in:** ccb7fab (system-level, not in repo)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary correction for nginx config validity. No scope creep.

## Issues Encountered
None beyond the worker_shutdown_timeout context issue documented above.

## User Setup Required
None - no external service configuration required.

## Verification Results

All 12 plan verification checks passed:

| # | Check | Result |
|---|-------|--------|
| 1 | `sudo nginx -t` | test is successful |
| 2 | `curl http://127.0.0.1:5580/health` | `{"status":"ok"}` |
| 3 | `curl -sI http://127.0.0.1:5580/assets/` | nginx response headers |
| 4 | `curl -sSk https://samsara.tailad2401.ts.net:5443/health` | `{"status":"ok"}` |
| 5 | `curl http://127.0.0.1:5580/manifest.json` | valid JSON |
| 6 | `systemctl is-active loom-backend` | active |
| 7 | `grep -c gracefulShutdown server/index.js` | 3 (function + 2 handlers) |
| 8 | `grep sessionWatcher.unwatchAll server/index.js` | present |
| 9 | `tailscale serve status` | 5443 -> 127.0.0.1:5580 |
| 10 | `systemctl show nginx -p After` | contains loom-backend |
| 11 | `grep worker_shutdown_timeout /etc/nginx/nginx.conf` | 10s |
| 12 | `.planning/REQUIREMENTS.md` PROD-01 | port 5443 via Tailscale Serve |

## Next Phase Readiness
- nginx + Tailscale Serve + Express are production-ready
- Plan 02 (deploy.sh build pipeline) can now use `systemctl reload nginx` and `systemctl restart loom-backend`
- dist/ directory served by nginx; Vite build output goes here

---
*Phase: 58-production-build-nginx*
*Completed: 2026-03-27*
