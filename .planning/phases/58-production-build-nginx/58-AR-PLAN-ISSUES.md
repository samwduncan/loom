# Adversarial Plan Review — Phase 58

**Tier:** deep
**Date:** 2026-03-27
**Agents:** Guard (Sonnet), Hunter (Opus), Architect (Opus)
**Findings:** 35 raw, 7 unique S+ grade after dedup

## Issues

### [SS] Missing `public/` directory in nginx config — PWA manifest, favicons, icons will 404
**Source:** Architect | **Confidence:** High
**Plan:** 58-01
**Description:** nginx root is `dist/` but PWA manifest, favicons, icons, and api-docs.html live in `public/`. Express currently serves both directories separately. Vite does NOT copy `public/` into `dist/` (no `publicDir` override in vite.config.ts, no `src/public/` exists). Every `/manifest.json`, `/icons/*`, `/favicon.ico` request will 404 through nginx.
**Suggested fix:** Add `publicDir: '../public'` to vite.config.ts so Vite copies public/ contents into dist/ at build time. Alternatively, add nginx location blocks for `/icons/`, `/manifest.json`, `/favicon.ico` aliased to `/home/swd/loom/public/`. OR add a copy step to deploy.sh.

### [S] Graceful shutdown has 500ms unconditional exit — drain never completes
**Source:** Guard, Hunter, Architect (all three) | **Confidence:** High
**Plan:** 58-01
**Description:** The shutdown handler has a 500ms `process.exit(0)` timer that fires before `server.close()` and `wss.close()` callbacks complete. Makes the 10s force-exit dead code for most cases. Any active HTTP connection >500ms gets killed mid-flight.
**Suggested fix:** Remove the 500ms timer entirely. Exit inside the innermost callback chain (after server + wss + messageCache all closed). Keep only the 10s force-kill as safety net.

### [S] Missing `worker_shutdown_timeout` in nginx config despite research Pitfall 4
**Source:** Hunter, Architect | **Confidence:** High
**Plan:** 58-01
**Description:** Research doc explicitly recommends `worker_shutdown_timeout 10s` for nginx. With 24h WebSocket timeouts, old nginx workers linger indefinitely after reload. Over multiple deploys, zombie workers accumulate.
**Suggested fix:** Add `worker_shutdown_timeout 10s;` to nginx config or create a drop-in snippet for nginx.conf.

### [S] PROD-01 in REQUIREMENTS.md says "port 443" but plan delivers port 5443
**Source:** Guard, Hunter, Architect (all three) | **Confidence:** High
**Plan:** 58-01
**Description:** PROD-01 text: "nginx reverse proxy serves Loom on HTTPS (port 443)." Plan correctly uses 5443 due to Tailscale Serve conflict, but REQUIREMENTS.md was never updated. Traceability gap at UAT.
**Suggested fix:** Update PROD-01 in REQUIREMENTS.md to reflect port 5443 via Tailscale Serve. Add REQUIREMENTS.md to Plan 01 files_modified.

### [S] deploy.sh doesn't install backend (root) npm dependencies
**Source:** Hunter, Architect | **Confidence:** High
**Plan:** 58-02
**Description:** Script runs `npm ci` only in `src/`. If `git pull` brings new backend deps, `systemctl restart loom-backend` crashes because root `node_modules/` is stale.
**Suggested fix:** Add `npm ci` at repo root before the frontend build step.

### [S] Graceful shutdown doesn't clean up PTY sessions, file watchers, or SessionWatcher
**Source:** Hunter | **Confidence:** Medium
**Plan:** 58-01
**Description:** Shutdown closes HTTP + WS + messageCache but ignores ptySessionsMap (zombie processes), projectsWatchers (inotify handles), and sessionWatcher (fs.watch handles). PTY children survive parent death.
**Suggested fix:** Add `sessionWatcher.unwatchAll()`, iterate ptySessionsMap and kill PTYs, close projectsWatchers in the shutdown handler.

### [S] deploy.sh `git pull --ff-only` fails on dirty working tree
**Source:** Hunter (S), Guard (A), Architect (A) | **Confidence:** High
**Plan:** 58-02
**Description:** Repo currently has 8+ modified tracked files. `git pull --ff-only` will fail or silently merge with local changes. No pre-flight dirty-tree check.
**Suggested fix:** Add pre-flight: `git diff --quiet HEAD || fail "Working tree dirty — commit or stash first"`. Or add `--no-pull` flag.

## Important A/B Findings (not S+, but worth fixing)

- **[A] Deploy ordering wrong:** nginx reload BEFORE Express restart creates 502 window. Should restart Express first, confirm health, then reload nginx. (Architect)
- **[A] npm ci --production=false deprecated:** Just use `npm ci`. (Architect)
- **[B] Health check sleep 2 race:** All three agents flagged. Replace with retry loop. (Guard, Hunter, Architect)
- **[B] Tailscale Serve persistence:** Not verified — will config survive reboot? (Architect)
- **[B] curl wildcard in acceptance criteria:** `curl .../vendor-react-*.js` — shell glob, not URL wildcard. (Architect)

## Verification: PASSED

All 7 S+ findings and 4 A/B findings were addressed by planner revision. Haiku verification pass confirmed all fixes are adequate with no new S+ violations.

## Lower-Grade Notes

- [B] read_first missing vite.config.ts in Plan 02 Task 2 (Guard)
- [B] No --skip-pull flag for local deploys (Hunter)
- [B] TypeScript error test runs full deploy.sh including git pull (Hunter)
- [B] Brotli not verified via response headers in Plan 01 acceptance criteria (Hunter)
- [C] CONTEXT.md says "bind 0.0.0.0" but plan correctly uses 127.0.0.1 (Hunter, Architect)
- [C] Research doc user_constraints section stale (Architect)
- [C] deploy.sh hardcodes URL instead of variable (Guard)
- [C] Missing brotli_comp_level in acceptance criteria (Guard)
