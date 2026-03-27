# Phase 58: Production Build & Nginx - Research

**Researched:** 2026-03-27 (updated)
**Domain:** Production deployment infrastructure (nginx, systemd, TLS, build automation)
**Confidence:** HIGH

## Summary

The deployment infrastructure for Loom is well-scoped with no new dependencies beyond two apt packages (nginx brotli modules). The architecture uses a three-tier proxy chain: Tailscale Serve terminates TLS on port 5443, forwarding plain HTTP to nginx on 127.0.0.1:5580, which serves static assets directly and proxies API/WebSocket traffic to Express on port 5555. This avoids disrupting RowLab's existing claim on port 443 via Tailscale Serve.

Two critical findings drive the implementation. First, Vite builds to `src/dist/` but Express (and nginx) read from `dist/` at the repo root -- the deploy script must use `--outDir ../dist` to bridge this gap. Second, the root `dist/` directory has accumulated 976 stale files (54MB) from multiple builds because Vite's `emptyOutDir` only cleans `src/dist/`. Building with `--outDir ../dist` will clean the root dist properly since Vite empties the outDir when it's inside the project root.

Express has no graceful shutdown handler, which must be added before zero-downtime deploys work. The server manages WebSocket connections, PTY sessions, file system watchers, and an SQLite cache -- all need cleanup on SIGTERM. The brotli nginx modules are available via apt and compatible with the installed nginx 1.24.0 ABI -- no compilation required.

**Primary recommendation:** Use Tailscale Serve on port 5443 for TLS termination, nginx on 127.0.0.1:5580 for static serving and reverse proxying, with Express unchanged on port 5555. Add graceful shutdown to Express. Deploy via `./deploy.sh` with validation gates.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **UPDATED:** Tailscale Serve terminates TLS on port 5443, forwards to nginx on 127.0.0.1:5580 (port 443 occupied by RowLab via Tailscale Serve)
- nginx listens on 127.0.0.1:5580 (plain HTTP) and proxies API/WebSocket traffic to Express on port 5555
- **DEFERRED:** Port 80 redirect not applicable -- Tailscale Serve handles HTTPS directly
- WebSocket upgrade handling for /ws and /shell paths
- `X-Accel-Buffering: no` for SSE/streaming endpoints (server already sets this header)
- Access URL: https://samsara.tailad2401.ts.net:5443
- **UPDATED:** Tailscale Serve handles TLS termination and cert lifecycle automatically -- no `tailscale cert` or renewal timers needed
- nginx receives plain HTTP from Tailscale Serve on 127.0.0.1:5580
- Express receives plain HTTP from nginx on 127.0.0.1:5555
- nginx serves dist/ directly (not proxied through Express)
- Hashed assets: `Cache-Control: public, max-age=31536000, immutable`
- index.html: `Cache-Control: no-cache, no-store, must-revalidate`
- brotli + gzip compression enabled (brotli preferred, gzip fallback)
- Try files: serve from dist/ first, fall through to Express for API routes
- Single `./deploy.sh` script orchestrates the entire deploy
- Steps: pull -> build frontend -> validate -> reload services
- Build validation gates: tsc succeeds, bundle size limits, dist/index.html exists, chunk files present
- Zero-downtime: nginx reload (not restart), Express graceful restart
- `loom-backend.service` already exists -- update if needed
- New `loom-nginx.service` or use system nginx with Loom-specific site config
- Dependency ordering: nginx After=loom-backend.service
- Restart=on-failure for both services
- Deploy script handles `systemctl reload nginx` + `systemctl restart loom-backend`

### Claude's Discretion
- nginx config file location (sites-available/sites-enabled vs standalone)
- Exact bundle size thresholds
- Whether to use system nginx package or compile from source for brotli
- Log rotation configuration
- Monitoring/health check endpoints

### Deferred Ideas (OUT OF SCOPE)
- HTTP/3 (QUIC) support -- revisit when browser/nginx support matures
- CDN/edge caching -- single-user tool on Tailscale, no CDN needed
- Container/Docker deployment -- systemd is simpler for this use case
- CI/CD pipeline (GitHub Actions) -- manual deploy is fine for now
- Rate limiting / WAF -- trusted network, not needed
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PROD-01 | nginx reverse proxy serves Loom on HTTPS (port 5443 via Tailscale Serve) proxying API/WS to Express on 5555 | Tailscale Serve HTTPS mode verified (`--https=5443`), nginx WebSocket proxy patterns documented, port 443 conflict identified and resolved with 5443 |
| PROD-02 | nginx serves static assets (dist/) directly with immutable cache headers and brotli/gzip compression | Brotli modules available via apt (libnginx-mod-http-brotli-filter 1.0.0~rc-5build1, compatible with nginx-abi-1.24.0-1), cache header patterns documented, dist path gap identified with `--outDir ../dist` fix |
| PROD-03 | Single `./deploy.sh` command builds frontend, validates build, and reloads services with zero-downtime | Build flow documented (tsc -b + vite build from src/), nginx reload preserves connections, Express graceful shutdown pattern provided, public/ copy step required for PWA assets |
| PROD-04 | Build validation gates: TypeScript compilation, bundle size limits, dist/ integrity checks | Current dist stats: 4.7MB total after clean build, 136 asset files, 5 named vendor chunks, tsc exit code validation, du-based size checking |
| PROD-05 | nginx and Express managed as systemd services with proper dependencies and restart policies | Existing loom-backend.service audited, systemd drop-in override for nginx After= dependency, system nginx service already exists, worker_shutdown_timeout recommended |
</phase_requirements>

## Architecture: Three-Tier Proxy Chain

```
Client (browser/iOS)
    |
    v  (HTTPS, auto-managed certs)
Tailscale Serve :5443  (TLS termination, tailnet only)
    |
    v  (plain HTTP)
nginx 127.0.0.1:5580
    |-- /assets/*, /fonts/*, /icons/*, static files -> serve from dist/ directly
    |-- /api/* -> proxy_pass http://127.0.0.1:5555
    |-- /ws, /shell -> proxy_pass + WebSocket upgrade to 127.0.0.1:5555
    |-- /* (SPA fallback) -> try_files $uri $uri/ /index.html
    v
Express :5555  (plain HTTP, unchanged)
```

**Why this approach:**
1. Does NOT disrupt RowLab or other Tailscale Serve bindings (port 443 stays with RowLab)
2. Tailscale handles TLS cert provisioning and renewal automatically -- no timers, no certbot
3. nginx does what it's good at: static serving, caching, compression, WebSocket proxying
4. Express stays unchanged on port 5555 (except adding graceful shutdown)
5. Access URL: `https://samsara.tailad2401.ts.net:5443`

### Current Tailscale Serve Configuration (DO NOT DISRUPT)

| Port | Target | Service |
|------|--------|---------|
| 443 | http://127.0.0.1:3001 | RowLab (frontend) |
| 3443 | http://127.0.0.1:3002 | RowLab (backend) |
| 8443 | http://127.0.0.1:8082 | Other service |
| 8765 | http://127.0.0.1:9876 | Other service |
| 8022/8766/2223 | 127.0.0.1:2222 | SSH TCP forwarding |
| **5443 (NEW)** | **http://127.0.0.1:5580** | **Loom (this phase)** |

### Tailscale Serve WebSocket Caveat

A [known issue](https://github.com/tailscale/tailscale/issues/18651) exists where Tailscale Serve may strip WebSocket query parameters. Loom's WebSocket auth uses `?token=xxx` on the upgrade request. In our architecture, Tailscale Serve acts as an HTTP-level reverse proxy to nginx, which then proxies WebSockets to Express. Testing is needed to verify query parameters survive the full chain. If they don't, a workaround is to pass the token via a WebSocket subprotocol or first-message auth instead.

**Risk level:** MEDIUM -- the issue was filed Feb 2026 and is unresolved, but it may only affect Tailscale Funnel (internet-facing), not Serve (tailnet-only). Verification required during Plan 01 execution.

## Standard Stack

### Core (No New Dependencies)

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| nginx | 1.24.0 (installed) | Reverse proxy, static serving, compression | Already on system, Ubuntu LTS package |
| libnginx-mod-http-brotli-filter | 1.0.0~rc-5build1 (apt) | Dynamic brotli compression | Available in Ubuntu 24.04 repos, matches nginx ABI |
| libnginx-mod-http-brotli-static | 1.0.0~rc-5build1 (apt) | Pre-compressed .br file serving | Available in Ubuntu 24.04 repos |
| systemd | 255 (system) | Service management | Already managing loom-backend |
| Tailscale | 1.96.2 (installed) | TLS via Tailscale Serve | Already installed, Serve already active |

### Build Tools (Already Installed)

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | v22.22.1 | Runtime |
| TypeScript | 5.9.3 (local) | Type checking (`tsc -b`) |
| Vite | 7.x | Build tool |
| npm | 10.9.4 | Package manager |

### No New Dependencies Needed
Zero new packages. All tools are already installed or available via apt.

**Installation (brotli modules only):**
```bash
sudo apt install libnginx-mod-http-brotli-filter libnginx-mod-http-brotli-static
```

## Architecture Patterns

### Recommended File Layout
```
/home/swd/loom/
  deploy.sh                             # Single deploy entry point
  server/index.js                       # Express (add graceful shutdown)
  dist/                                 # Built frontend (nginx serves this)
  public/                               # Static assets (copied into dist/ at build)
  src/                                  # Source (builds TO ../dist via deploy.sh)

/etc/nginx/
  sites-available/loom                  # Loom nginx config
  sites-enabled/loom -> ../sites-available/loom
  conf.d/worker-timeout.conf            # worker_shutdown_timeout 10s

/etc/systemd/system/
  loom-backend.service                  # Express backend (existing, updated)
  nginx.service.d/loom-order.conf       # Drop-in: nginx After=loom-backend
```

### Pattern 1: nginx Site Configuration (sites-available/sites-enabled)

**What:** Follow existing server convention with symlinked site configs.
**When to use:** Always -- this server already has jellyfin, nextcloud, upload-nextcloud using this pattern.

**Recommendation (Claude's Discretion):** Use sites-available/sites-enabled, not standalone config. Consistent with existing server convention.

```nginx
# /etc/nginx/sites-available/loom
server {
    listen 127.0.0.1:5580;
    server_name samsara.tailad2401.ts.net;

    root /home/swd/loom/dist;
    index index.html;

    # Brotli compression (preferred)
    brotli on;
    brotli_comp_level 4;  # 4 is good balance of speed vs compression
    brotli_types text/plain text/css text/javascript application/javascript
                 application/json application/xml image/svg+xml application/wasm;

    # Gzip fallback
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/javascript application/javascript
               application/json application/xml image/svg+xml application/wasm;

    # Hashed assets: immutable cache (js, css in assets/)
    location /assets/ {
        expires max;
        add_header Cache-Control "public, max-age=31536000, immutable";
        try_files $uri =404;
    }

    # Fonts directory (non-hashed filenames but rarely change)
    location /fonts/ {
        expires max;
        add_header Cache-Control "public, max-age=31536000, immutable";
        try_files $uri =404;
    }

    # index.html: never cache (so new deploys are picked up immediately)
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    # Health check (no auth, fast path)
    location = /health {
        proxy_pass http://127.0.0.1:5555;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        access_log off;
    }

    # API routes -> Express
    location /api/ {
        proxy_pass http://127.0.0.1:5555;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;  # SSE/streaming: let X-Accel-Buffering from backend control it
    }

    # WebSocket: chat
    location /ws {
        proxy_pass http://127.0.0.1:5555;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400s;  # 24h for long-lived WS
        proxy_send_timeout 86400s;
    }

    # WebSocket: shell/terminal
    location /shell {
        proxy_pass http://127.0.0.1:5555;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # SPA fallback: everything else -> index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Pattern 2: Express Graceful Shutdown

**What:** Handle SIGTERM to drain connections and clean up all resources before exit.
**When to use:** Required for zero-downtime deploy with systemd restart.

Express manages these resources that must be cleaned up:
- `server` (HTTP server) -- stop accepting connections, drain existing
- `wss` (WebSocketServer) -- close all clients with code 1001
- `ptySessionsMap` (Map) -- kill PTY child processes to prevent zombies
- `sessionWatcher` -- unwatchAll() to release fs.watch handles
- `projectsWatchers` (array) -- close inotify file watchers
- `messageCache` -- close SQLite database connection

```javascript
function gracefulShutdown(signal) {
    console.log(`[INFO] Received ${signal}, starting graceful shutdown...`);

    // Force exit after timeout (systemd SIGKILL at TimeoutStopSec anyway)
    const forceTimer = setTimeout(() => {
        console.error('[WARN] Forced shutdown after 10s timeout');
        process.exit(1);
    }, 10000);
    forceTimer.unref();

    // Kill PTY sessions (prevent zombie child processes)
    for (const [key, session] of ptySessionsMap) {
        try { session.pty?.kill(); } catch (e) { /* ignore */ }
    }
    ptySessionsMap.clear();

    // Release fs.watch handles
    try { sessionWatcher.unwatchAll(); } catch (e) { /* ignore */ }

    // Close project file watchers
    for (const watcher of projectsWatchers) {
        try { watcher.close(); } catch (e) { /* ignore */ }
    }
    projectsWatchers = [];

    // Close WebSocket connections
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.close(1001, 'Server shutting down');
        }
    });
    wss.close(() => console.log('[INFO] WebSocket server closed'));

    // Close database
    try { messageCache.close(); } catch (e) { /* ignore */ }

    // Stop accepting HTTP, exit when drained
    server.close(() => {
        console.log('[INFO] HTTP server closed -- shutdown complete');
        process.exit(0);
    });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
```

**Critical:** Exit ONLY from `server.close()` callback -- NOT from an unconditional timer. The 10s force-kill is a safety net only.

### Pattern 3: Deploy Script Structure

**What:** Single-command deploy with validation gates and correct reload ordering.

Key design decisions:
- **Express restart BEFORE nginx reload** -- avoids 502 window
- **Health check retry loop** -- not sleep-and-pray
- **`--no-pull` flag** -- for local deploys with dirty working trees
- **`cp -r public/* dist/`** -- copies PWA manifest, favicons, icons into dist/
- **`--outDir ../dist`** -- bridges Vite output to Express/nginx root

### Pattern 4: systemd Dependency Ordering

**What:** nginx starts after loom-backend via a drop-in override. Using a drop-in (not editing the system nginx unit) avoids conflicts with apt upgrades.

```ini
# /etc/systemd/system/nginx.service.d/loom-order.conf
[Unit]
After=loom-backend.service
Wants=loom-backend.service
```

`After=` provides ordering, `Wants=` provides automatic start (but nginx still starts if loom-backend fails -- it can still serve static assets).

### Anti-Patterns to Avoid
- **Compiling nginx from source for brotli:** Ubuntu 24.04 has brotli modules in apt. Compiling means no security updates from apt.
- **Using `nginx restart` instead of `reload`:** Restart drops all connections. Reload spawns new workers and gracefully drains old ones.
- **Proxying static assets through Express:** Defeats the purpose of nginx. Express should only handle API/WS routes.
- **Hardcoding bundle hashes in deploy validation:** Hashes change every build. Validate with glob patterns like `vendor-react-*.js`.
- **Running `tsc` globally:** Use `npx tsc -b` from within `src/` to use the project's TypeScript version.
- **500ms unconditional exit in shutdown handler:** Makes graceful drain impossible. Exit only inside `server.close()` callback.
- **`npm ci --production=false`:** Deprecated. Just use `npm ci`.
- **Reloading nginx before Express is healthy:** Creates 502 window. Restart Express first, health check, THEN reload nginx.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TLS cert management | Custom ACME client or cron | Tailscale Serve | Handles TLS lifecycle automatically, zero config |
| Compression | Custom pre-compression scripts | nginx brotli module (dynamic) | Handles content negotiation, fallback to gzip, proper Vary headers |
| WebSocket ping/pong in proxy | Custom heartbeat in nginx | Express already has WS_PING_INTERVAL (60s) | Server pings every 60s; nginx just needs long read_timeout |
| Process management | PM2 + nginx | systemd | Already using systemd for loom-backend; PM2 is redundant |
| Log rotation | Custom scripts | System logrotate (already configured for nginx) | `/etc/logrotate.d/nginx` already exists |
| Cert renewal timers | systemd timer + tailscale cert | Tailscale Serve | Serve manages certs internally, no renewal needed |

## Common Pitfalls

### Pitfall 1: dist/ Path Discrepancy
**What goes wrong:** Vite builds to `src/dist/` but Express/nginx read from `dist/` (repo root). After a build, nginx/Express serve stale files.
**Why it happens:** `vite.config.ts` has `outDir: 'dist'` which resolves relative to `src/` where Vite runs.
**How to avoid:** Build with `--outDir ../dist` in deploy.sh. Do NOT change vite.config.ts (breaks dev server's output location).
**Warning signs:** File dates in `dist/` don't match latest build time. 976 files in dist/ when a clean build produces ~140.

### Pitfall 2: Stale Files in dist/
**What goes wrong:** Root `dist/` has accumulated 976 files (54MB) from multiple builds because content-hashed filenames differ per build and nothing cleans up old ones.
**Why it happens:** Without `--outDir ../dist`, builds went to `src/dist/` and someone manually copied. Old files linger.
**How to avoid:** Using `--outDir ../dist` causes Vite to empty the output dir before writing (default behavior when outDir is inside project root or an explicit path). This cleans up stale files automatically.
**Warning signs:** `dist/` is 54MB when a clean build produces 4.7MB.

### Pitfall 3: Tailscale Serve Port Conflict
**What goes wrong:** Cannot use port 443 because `tailscaled` already holds it for RowLab.
**Why it happens:** Tailscale Serve reserves port 443 on the Tailscale interface (100.86.4.57).
**How to avoid:** Use port 5443 instead. This is a locked decision in CONTEXT.md.
**Warning signs:** Attempted bind to 100.86.4.57:443 fails with "address already in use".

### Pitfall 4: WebSocket Timeout at 60 Seconds
**What goes wrong:** WebSocket connections drop after exactly 60 seconds of inactivity.
**Why it happens:** nginx default `proxy_read_timeout` is 60s. If no data flows, nginx closes the upstream connection.
**How to avoid:** Set `proxy_read_timeout 86400s` on WebSocket locations. Express sends pings every 60s which keeps the connection alive.
**Warning signs:** WebSocket disconnects after quiet periods, reconnection loop.

### Pitfall 5: Zombie nginx Workers After Reload
**What goes wrong:** Old nginx worker processes linger after reload because WebSocket connections never "complete."
**Why it happens:** nginx reload gracefully shuts down old workers, but WebSocket connections with 24h timeout are open-ended.
**How to avoid:** Set `worker_shutdown_timeout 10s` in a conf.d/ snippet. This force-closes old worker connections after reload.
**Warning signs:** `nginx -s reload` followed by `ps aux | grep nginx` shows multiple worker processes with "shutting down" status.

### Pitfall 6: Brotli Module Not Loaded
**What goes wrong:** Brotli compression not active despite installing packages.
**Why it happens:** apt packages install `.so` files but may not automatically create symlinks in `/etc/nginx/modules-enabled/`.
**How to avoid:** After installing, verify symlinks exist: `ls /etc/nginx/modules-enabled/ | grep brotli`. Run `nginx -t` to confirm module loads.
**Warning signs:** Response headers show `Content-Encoding: gzip` but never `br`.

### Pitfall 7: PWA Assets 404 Through nginx
**What goes wrong:** `manifest.json`, favicons, icons, `api-docs.html` all return 404.
**Why it happens:** These files live in `public/` (served by Express via `express.static`). Vite does NOT copy the root `public/` into `dist/` -- it only copies `src/public/` (which only contains fonts). nginx's root is `dist/`, so it can't see `public/`.
**How to avoid:** Deploy script must `cp -r public/* dist/` after `vite build`. This copies manifest, favicons, icons into the nginx root.
**Warning signs:** PWA install prompt stops working. `curl /manifest.json` returns 404.

### Pitfall 8: Tailscale Serve WebSocket Query Parameter Stripping
**What goes wrong:** WebSocket auth token (`?token=xxx`) may be stripped by Tailscale Serve.
**Why it happens:** [Known issue #18651](https://github.com/tailscale/tailscale/issues/18651) in Tailscale's HTTP proxy layer.
**How to avoid:** Test the full chain during Plan 01 execution. If query params are stripped, fall back to first-message auth or subprotocol-based auth.
**Warning signs:** WebSocket connects but immediately gets closed by auth failure.

## Code Examples

### Brotli Module Configuration
```nginx
# In server{} block of the Loom site config
brotli on;
brotli_comp_level 4;  # 4 is good balance of speed vs compression
brotli_types
    text/plain
    text/css
    text/javascript
    application/javascript
    application/json
    application/xml
    image/svg+xml
    application/wasm;

# Gzip fallback (for clients that don't support brotli)
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types
    text/plain
    text/css
    text/javascript
    application/javascript
    application/json
    application/xml
    image/svg+xml
    application/wasm;
```

### Tailscale Serve Setup
```bash
# Add Loom on port 5443 via Tailscale Serve (persistent across restarts)
sudo tailscale serve --bg --https=5443 http://127.0.0.1:5580

# Verify
tailscale serve status
# Should show: https://samsara.tailad2401.ts.net:5443 -> http://127.0.0.1:5580

# Verify persistence across tailscaled restart
sudo systemctl restart tailscaled
sleep 3
tailscale serve status 2>&1 | grep 5443
```

If `--bg` config does NOT survive tailscaled restart, create a systemd oneshot:
```ini
# /etc/systemd/system/tailscale-serve-loom.service
[Unit]
Description=Tailscale Serve for Loom
After=tailscaled.service
Requires=tailscaled.service

[Service]
Type=oneshot
ExecStart=/usr/bin/tailscale serve --bg --https=5443 http://127.0.0.1:5580
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
```

### Updated systemd Service
```ini
# /etc/systemd/system/loom-backend.service
[Unit]
Description=Loom AI Backend
After=network.target

[Service]
Type=simple
User=swd
WorkingDirectory=/home/swd/loom
ExecStart=/usr/bin/node server/index.js
Restart=on-failure
RestartSec=3
TimeoutStopSec=15
KillSignal=SIGTERM
Environment=PATH=/home/swd/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/snap/bin
Environment=NODE_ENV=production
Environment=PORT=5555
Environment=VITE_IS_PLATFORM=true
EnvironmentFile=-/home/swd/loom/.env
StandardOutput=journal
StandardError=journal
SyslogIdentifier=loom-backend

[Install]
WantedBy=multi-user.target
```

Key changes from current:
- `Restart=on-failure` (was `Restart=always` -- avoids restart loops on clean exit from graceful shutdown)
- `TimeoutStopSec=15` -- gives Express 15s to drain connections before SIGKILL
- `KillSignal=SIGTERM` -- explicit (was implicit default)

### Health Check Endpoint
Already exists in Express:
```javascript
// server/index.js line 341
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), installMode });
});
```
No need to add one -- just proxy it through nginx.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| PM2 process management | systemd native services | Already using systemd | PM2 config (ecosystem.config.cjs) is redundant |
| gzip-only compression | brotli preferred, gzip fallback | nginx 1.19.6+ (2020) | 15-25% better compression for text assets |
| `tailscale cert` + renewal timer | Tailscale Serve auto-managed TLS | Tailscale Serve (2022+) | No certbot, no cron jobs, no manual cert management |
| Express serves everything | nginx for static, Express for API | This phase | Major throughput improvement for static assets |

**Deprecated/outdated:**
- PM2 ecosystem.config.cjs: Redundant. systemd manages the process. Can be kept for development but is not used in production.
- Express static file serving in production: Replaced by nginx. Express fallback stays for development mode only.
- `tailscale cert` with renewal timers: Not needed with Tailscale Serve approach.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| nginx | Reverse proxy | YES | 1.24.0 | -- |
| libnginx-mod-http-brotli-filter | Brotli compression | NO (in apt) | 1.0.0~rc-5build1 | `sudo apt install` |
| libnginx-mod-http-brotli-static | Pre-compressed brotli | NO (in apt) | 1.0.0~rc-5build1 | `sudo apt install` |
| Tailscale | TLS via Serve | YES | 1.96.2 | -- |
| systemd | Service management | YES | 255 | -- |
| Node.js | Express runtime | YES | v22.22.1 | -- |
| TypeScript | Build validation | YES (local) | 5.9.3 | -- |
| Vite | Frontend build | YES (local) | 7.x | -- |
| logrotate | Log management | YES | system | -- |
| sudo | Service commands | YES (passwordless for swd) | -- | -- |

**Missing dependencies with no fallback:**
- None -- all critical tools are available.

**Missing dependencies requiring install:**
- Brotli nginx modules: `sudo apt install libnginx-mod-http-brotli-filter libnginx-mod-http-brotli-static`. Must be installed before nginx config references brotli directives.

## Current Environment State

### Existing nginx Sites
| Site | Status | Notes |
|------|--------|-------|
| jellyfin | enabled | Binds 10.0.0.78:443 |
| nextcloud | enabled | -- |
| upload-nextcloud | enabled | -- |
| default | available (not enabled) | -- |
| samsara-api | available (not enabled) | Flask app proxy on 127.0.0.1:80 |

### Port Allocations
| Port | Service | Interface |
|------|---------|-----------|
| 443 | tailscaled (RowLab) | 100.86.4.57 |
| 443 | nginx (jellyfin) | 10.0.0.78 |
| 5184 | Vite dev server | 0.0.0.0 |
| 5555 | loom-backend (Express) | 0.0.0.0 |
| 3001 | RowLab frontend | 127.0.0.1 |
| 3002 | RowLab backend | 127.0.0.1 |
| **5443 (PLANNED)** | **Tailscale Serve (Loom)** | **100.86.4.57** |
| **5580 (PLANNED)** | **nginx (Loom)** | **127.0.0.1** |

### Tailscale
- DNS Name: `samsara.tailad2401.ts.net`
- Tailscale IP: `100.86.4.57`
- Serve already configured with multiple ports (see table above)

### Current Build Output
After a clean `cd src && npm run build`:
- Output: `src/dist/` (4.7MB, ~140 files)
- Build time: ~5 seconds
- Largest chunks: vendor-shiki (746KB), editor (435KB), index (342KB), TerminalPanel (343KB)
- Named vendor chunks: vendor-react, vendor-markdown, vendor-shiki, vendor-radix, vendor-zustand
- CSS files: 1 main (107KB)
- Fonts: 4 woff2 files (Inter, Instrument Serif, JetBrains Mono)
- Stale root `dist/`: 976 files, 54MB (accumulated from multiple builds -- will be cleaned by `--outDir ../dist`)

### Express Server Key Facts
- Binds to `0.0.0.0:5555` (PORT env var, HOST env var)
- Single `http.createServer(app)` with single `WebSocketServer` attached
- WebSocket routes by URL path: `/ws` (chat), `/shell` (terminal)
- WebSocket auth via `?token=xxx` query parameter or `Authorization` header
- Already sets `X-Accel-Buffering: no` on SSE routes (server/routes/agent.js:916,1206)
- Health check already exists at `/health` (line 341)
- **No graceful shutdown handler** -- must be added
- Manages: PTY sessions (Map), file watchers (array), SessionWatcher, MessageCache (SQLite)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Bash smoke tests + curl verification |
| Config file | None -- validation is script-based |
| Quick run command | `nginx -t && curl -s http://127.0.0.1:5580/health` |
| Full suite command | `./deploy.sh --no-pull && curl -sSk https://samsara.tailad2401.ts.net:5443/health` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PROD-01 | nginx proxies HTTPS to Express | smoke | `curl -sSk https://samsara.tailad2401.ts.net:5443/health` | Wave 0 |
| PROD-02 | Static assets served with correct headers | smoke | `curl -sI http://127.0.0.1:5580/assets/vendor-react-*.js \| grep Cache-Control` | Wave 0 |
| PROD-03 | deploy.sh builds and reloads | integration | `./deploy.sh --no-pull` (check exit code) | Wave 0 |
| PROD-04 | Build validation catches failures | unit (bash) | Create tsc error, run deploy.sh, verify abort | Wave 0 |
| PROD-05 | systemd services have correct deps | smoke | `systemctl show nginx -p After \| grep loom-backend` | Wave 0 |

### Sampling Rate
- **Per task commit:** `nginx -t && curl -s http://127.0.0.1:5580/health`
- **Per wave merge:** Full deploy.sh run
- **Phase gate:** All 5 smoke tests pass, deploy.sh completes, full TLS path verified

### Wave 0 Gaps
- [ ] `deploy.sh` -- covers PROD-03, PROD-04
- [ ] nginx site config (`/etc/nginx/sites-available/loom`) -- covers PROD-01, PROD-02
- [ ] Brotli module installation -- prerequisite for PROD-02
- [ ] Express graceful shutdown handler -- prerequisite for PROD-03 zero-downtime
- [ ] Tailscale Serve binding on port 5443 -- covers PROD-01

*(All gaps are addressed by Plan 01 and Plan 02)*

## Open Questions

1. **Tailscale Serve WebSocket Query Parameter Stripping**
   - What we know: [Issue #18651](https://github.com/tailscale/tailscale/issues/18651) reports TS Serve strips WebSocket query params. Filed Feb 2026, still open.
   - What's unclear: Whether this affects tailnet-only Serve (vs Funnel), and whether it affects the HTTP proxy path (Serve -> nginx) differently than direct Serve -> backend.
   - Recommendation: Test during Plan 01 execution. If broken, WebSocket auth can be moved to Authorization header (already supported as fallback) or first-message auth.

2. **Tailscale Serve `--bg` Persistence**
   - What we know: `--bg` runs the serve in background, but persistence across tailscaled restart is unclear.
   - Recommendation: Verify during Plan 01. If not persistent, create a systemd oneshot service (pattern provided above).

3. **PM2 ecosystem.config.cjs Disposition**
   - What we know: File exists but systemd is the actual process manager.
   - Recommendation: Leave alone. Not in scope for this phase.

## Project Constraints (from CLAUDE.md)

- No placeholders -- all generated code must be complete and functional
- Verify before done -- run test/build/lint and show output
- Evidence-based claims -- never claim "tests pass" without showing evidence
- Confidence gate: >=90% proceed, 70-89% pause, <70% research first
- Push back on bad ideas with evidence
- Run verification before reporting completion
- Avoid `npm ci --production=false` (deprecated)

## Sources

### Primary (HIGH confidence)
- Environment audit: Direct system inspection via bash (nginx -v, tailscale version, apt-cache, ss -tlnp, systemctl)
- Existing systemd service: `/etc/systemd/system/loom-backend.service` (read directly)
- Existing nginx config: `/etc/nginx/nginx.conf`, `/etc/nginx/sites-available/samsara-api` (pattern reference)
- Tailscale Serve status: `tailscale serve status --json` (direct query, confirmed port allocations)
- Build output: Ran `cd src && npm run build` and measured (4.7MB, 136 asset files, 5s build time)
- Express server: Read server/index.js directly for all resource management code
- Brotli compatibility: `apt-cache show libnginx-mod-http-brotli-filter` confirms `nginx-abi-1.24.0-1` dependency match

### Secondary (MEDIUM confidence)
- [nginx WebSocket proxy docs](http://nginx.org/en/docs/http/websocket.html) -- Official nginx WebSocket proxying reference
- [Tailscale Serve docs](https://tailscale.com/kb/1242/tailscale-serve) -- Serve command reference
- [Tailscale Serve examples](https://tailscale.com/kb/1313/serve-examples) -- Port and path configuration examples
- [nginx HTTPS + WebSocket guide](https://www.f5.com/company/blog/nginx/websocket-nginx) -- F5/nginx blog reference

### Tertiary (LOW confidence)
- [Tailscale WebSocket query param issue #18651](https://github.com/tailscale/tailscale/issues/18651) -- Reported Feb 2026, unresolved. May or may not affect our architecture. Needs testing.
- WebSocket connection preservation during nginx reload: Some reports suggest connections can break. Express ping interval (60s) should keep connections alive through the reload window. The worker_shutdown_timeout (10s) will force-close connections on old workers.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all tools verified installed or available via apt, versions confirmed
- Architecture: HIGH -- existing server patterns inspected, port conflicts identified and resolved via CONTEXT.md decisions
- Pitfalls: HIGH -- verified through direct environment testing (port bindings, dist paths, build output, module compatibility)
- Build validation: HIGH -- current dist stats measured from fresh build, build commands tested end-to-end
- WebSocket proxy: MEDIUM -- nginx WebSocket proxying is well-documented but TS Serve query param issue needs testing

**Research date:** 2026-03-27
**Valid until:** 2026-04-27 (stable infrastructure, no fast-moving deps)
