# Phase 58: Production Build & Nginx - Research

**Researched:** 2026-03-27
**Domain:** Production deployment infrastructure (nginx, systemd, TLS, build automation)
**Confidence:** HIGH

## Summary

The deployment infrastructure is straightforward but has one critical constraint: Tailscale Serve already occupies port 443 on the Tailscale IP (100.86.4.57), proxying to RowLab on port 3001. nginx cannot bind to that address:port simultaneously. The recommended architecture uses Tailscale Serve on a dedicated HTTPS port (e.g., 5443) to terminate TLS and forward to nginx on localhost, where nginx handles static asset serving and reverse-proxying to Express. Alternatively, nginx can do its own TLS termination using `tailscale cert` files on a port not claimed by Tailscale Serve.

A second key finding: Vite builds to `src/dist/` but Express reads from `dist/` at the repo root. The deploy script must bridge this gap, either by passing `--outDir ../dist` to the Vite build or by changing `vite.config.ts`.

Brotli nginx modules are available via apt on Ubuntu 24.04 (`libnginx-mod-http-brotli-filter` and `libnginx-mod-http-brotli-static`) -- no compilation required. Express has no graceful shutdown handler, so one must be added for zero-downtime deploys. The server already uses the `sites-available/sites-enabled` pattern with symlinks, so Loom should follow that convention.

**Primary recommendation:** Use a dedicated Tailscale Serve HTTPS port (5443) terminating TLS to nginx on 127.0.0.1:5580, with nginx serving dist/ and proxying /api + /ws to Express on 5555. Add graceful shutdown to Express. Bridge the dist path gap in the build step.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- nginx listens on port 443 (HTTPS) and proxies API/WebSocket traffic to Express on port 5555
- Port 80 redirects to 443
- WebSocket upgrade handling for /ws and /shell paths
- `X-Accel-Buffering: no` for SSE/streaming endpoints (server already sets this header)
- Use `tailscale cert` to obtain real Let's Encrypt certs for the Tailscale hostname
- nginx handles TLS termination; Express receives plain HTTP on 5555
- Cert renewal strategy needed (tailscale certs auto-renew but need nginx reload)
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
- HTTP/3 (QUIC) support
- CDN/edge caching
- Container/Docker deployment
- CI/CD pipeline (GitHub Actions)
- Rate limiting / WAF
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PROD-01 | nginx reverse proxy serves Loom on HTTPS (port 443) with Tailscale certs, proxying API/WS to Express on 5555 | Tailscale cert workflow verified (sudo required), nginx WebSocket proxy patterns documented, port 443 conflict with Tailscale Serve identified with mitigation strategy |
| PROD-02 | nginx serves static assets (dist/) directly with immutable cache headers and brotli/gzip compression | brotli modules available via apt (no compilation), cache header patterns documented, dist path discrepancy identified |
| PROD-03 | Single `./deploy.sh` command builds frontend, validates build, and reloads services with zero-downtime | Build flow documented (tsc -b + vite build from src/), nginx reload preserves connections, Express graceful shutdown pattern provided |
| PROD-04 | Build validation gates: TypeScript compilation, bundle size limits, dist/ integrity checks | Current dist stats: 4.7MB total, 136 asset files, tsc -b exit code validation, du-based size checking |
| PROD-05 | nginx and Express managed as systemd services with proper dependencies and restart policies | Existing loom-backend.service documented, After= + Wants= pattern recommended, system nginx service already exists |
</phase_requirements>

## Critical Finding: Port 443 Conflict

**Tailscale Serve already binds 100.86.4.57:443**, proxying to RowLab (127.0.0.1:3001). nginx cannot simultaneously bind to this address:port.

### Current Tailscale Serve Configuration

| Port | Target | Service |
|------|--------|---------|
| 443 | http://127.0.0.1:3001 | RowLab (frontend) |
| 3443 | http://127.0.0.1:3002 | RowLab (backend) |
| 8443 | http://127.0.0.1:8082 | Unknown service |
| 8765 | http://127.0.0.1:9876 | Unknown service |
| 8022/8766/2223 | 127.0.0.1:2222 | SSH TCP forwarding |

### Recommended Architecture

**Approach: Tailscale Serve HTTPS on dedicated port, forwarding to nginx on localhost**

```
Client (browser)
    |
    v
Tailscale Serve :5443 (TLS termination, tailnet HTTPS)
    |
    v  (plain HTTP)
nginx 127.0.0.1:5580
    |-- /assets/*, /fonts/*, index.html -> serve from dist/ directly
    |-- /api/* -> proxy_pass http://127.0.0.1:5555
    |-- /ws, /shell -> proxy_pass + WebSocket upgrade to 127.0.0.1:5555
    v
Express :5555 (plain HTTP, unchanged)
```

**Why this approach:**
1. Does NOT disrupt RowLab or other Tailscale Serve bindings
2. Tailscale handles TLS cert provisioning and renewal automatically (no systemd timer needed)
3. nginx does what it's good at: static serving, caching, compression, WebSocket proxying
4. Express stays unchanged on port 5555
5. Access URL: `https://samsara.tailad2401.ts.net:5443`

**Alternative: nginx-managed TLS on a non-Tailscale port**
- nginx binds to `0.0.0.0:5443` with `tailscale cert` files
- Requires cert renewal automation (systemd timer)
- More complex but gives full nginx control over TLS

**The user's CONTEXT.md says "nginx listens on port 443"** -- this needs clarification given the Tailscale Serve conflict. The planner should note this in Wave 0 or as a pre-task. The practical choice is either (a) a non-standard port with Tailscale Serve TLS, or (b) reconfigure Tailscale Serve to point RowLab elsewhere and give nginx port 443 on the Tailscale IP.

## Standard Stack

### Core (No New Dependencies)

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| nginx | 1.24.0 (installed) | Reverse proxy, static serving, compression | Already on system, Ubuntu LTS package |
| libnginx-mod-http-brotli-filter | 1.0.0~rc-5build1 (apt) | Dynamic brotli compression | Available in Ubuntu 24.04 repos, no compilation |
| libnginx-mod-http-brotli-static | 1.0.0~rc-5build1 (apt) | Pre-compressed .br file serving | Available in Ubuntu 24.04 repos |
| systemd | system | Service management | Already managing loom-backend |
| tailscale | 1.96.2 (installed) | TLS certs via `tailscale cert` | Already installed, Tailscale Serve active |

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
  server/index.js                       # Express (unchanged except graceful shutdown)
  dist/                                 # Built frontend (nginx serves this)
  src/                                  # Source (builds TO ../dist)

/etc/nginx/
  sites-available/loom                  # Loom nginx config
  sites-enabled/loom -> ../sites-available/loom

/etc/systemd/system/
  loom-backend.service                  # Express backend (existing, updated)
  loom-cert-renew.service               # Cert renewal (only if nginx-managed TLS)
  loom-cert-renew.timer                 # Timer for cert renewal

/etc/loom/certs/                        # Tailscale certs (if nginx-managed TLS)
  samsara.tailad2401.ts.net.crt
  samsara.tailad2401.ts.net.key
```

### Pattern 1: nginx Site Configuration (sites-available/sites-enabled)

**What:** Follow existing server convention with symlinked site configs.
**When to use:** Always -- this server already has jellyfin, nextcloud, upload-nextcloud using this pattern.
**Example:**
```nginx
# /etc/nginx/sites-available/loom
server {
    listen 127.0.0.1:5580;
    server_name samsara.tailad2401.ts.net;

    root /home/swd/loom/dist;
    index index.html;

    # Hashed assets: immutable cache
    location ~* \.(js|css|woff2)$ {
        expires max;
        add_header Cache-Control "public, max-age=31536000, immutable";
        try_files $uri =404;
    }

    # Fonts directory (non-hashed but rarely change)
    location /fonts/ {
        expires max;
        add_header Cache-Control "public, max-age=31536000, immutable";
        try_files $uri =404;
    }

    # index.html: never cache
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
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

**What:** Handle SIGTERM to drain connections before exit.
**When to use:** Required for zero-downtime deploy with systemd restart.
**Example:**
```javascript
// Add to server/index.js
function gracefulShutdown(signal) {
    console.log(`[INFO] Received ${signal}, starting graceful shutdown...`);

    // Stop accepting new connections
    server.close(() => {
        console.log('[INFO] HTTP server closed');
        // Close WebSocket server
        wss.close(() => {
            console.log('[INFO] WebSocket server closed');
            // Close database connections
            messageCache.close();
            process.exit(0);
        });
    });

    // Force exit after timeout
    setTimeout(() => {
        console.error('[WARN] Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
```

### Pattern 3: Deploy Script Structure

**What:** Single-command deploy with validation gates.
**Example:**
```bash
#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="/home/swd/loom"
MAX_DIST_SIZE_MB=15  # Configurable threshold

cd "$REPO_DIR"

echo "=== Step 1: Pull latest ==="
git pull --ff-only

echo "=== Step 2: Install dependencies ==="
(cd src && npm ci --production=false)

echo "=== Step 3: TypeScript check ==="
(cd src && npx tsc -b) || { echo "FAIL: TypeScript compilation failed"; exit 1; }

echo "=== Step 4: Build frontend ==="
(cd src && npx vite build --outDir ../dist) || { echo "FAIL: Vite build failed"; exit 1; }

echo "=== Step 5: Validate build ==="
# Check index.html exists and is non-empty
[[ -s "$REPO_DIR/dist/index.html" ]] || { echo "FAIL: dist/index.html missing or empty"; exit 1; }

# Check expected vendor chunks exist
for chunk in vendor-react vendor-shiki vendor-radix vendor-zustand vendor-markdown; do
    ls "$REPO_DIR/dist/assets/${chunk}-"*.js >/dev/null 2>&1 || \
        { echo "FAIL: Missing chunk: $chunk"; exit 1; }
done

# Check total size
DIST_SIZE=$(du -sm "$REPO_DIR/dist" | cut -f1)
if (( DIST_SIZE > MAX_DIST_SIZE_MB )); then
    echo "FAIL: dist/ is ${DIST_SIZE}MB, exceeds ${MAX_DIST_SIZE_MB}MB limit"
    exit 1
fi

echo "=== Step 6: Reload services ==="
sudo systemctl reload nginx
sudo systemctl restart loom-backend

echo "=== Deploy complete ==="
```

### Anti-Patterns to Avoid
- **Compiling nginx from source for brotli:** Ubuntu 24.04 has brotli modules in apt. Compiling from source means no security updates from apt.
- **Using `nginx restart` instead of `reload`:** Restart drops all connections. Reload spawns new workers and gracefully drains old ones.
- **Proxying static assets through Express:** Defeats the purpose of nginx. Express should only handle API/WS routes.
- **Hardcoding bundle hashes in deploy validation:** Hashes change every build. Validate with glob patterns like `vendor-react-*.js`.
- **Running `tsc` globally:** Use `npx tsc -b` from within `src/` to use the project's TypeScript version.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TLS cert management | Custom ACME client | `tailscale cert` or Tailscale Serve | Tailscale handles ACME/DNS-01 challenges automatically |
| Compression | Custom pre-compression scripts | nginx brotli module (dynamic) | Handles content negotiation, fallback to gzip, proper Vary headers |
| WebSocket ping/pong | Custom heartbeat in nginx config | Express already has WS_PING_INTERVAL | The server pings every 30s; nginx just needs long read_timeout |
| Process management | PM2 + nginx | systemd | Already using systemd for loom-backend; PM2 is redundant |
| Log rotation | Custom scripts | System logrotate (already configured for nginx) | nginx logrotate config already exists at `/etc/logrotate.d/nginx` |

## Common Pitfalls

### Pitfall 1: dist/ Path Discrepancy
**What goes wrong:** Vite builds to `src/dist/` but Express reads from `dist/` (repo root). After a fresh build, nginx/Express serve stale files.
**Why it happens:** `vite.config.ts` has `outDir: 'dist'` which resolves relative to `src/` where it runs.
**How to avoid:** Build with `--outDir ../dist` in deploy.sh, OR update `vite.config.ts` to `outDir: '../dist'`.
**Warning signs:** File dates in `dist/` don't match latest build time.

### Pitfall 2: Tailscale Serve Port Conflict
**What goes wrong:** nginx fails to bind to 100.86.4.57:443 because `tailscaled` already holds it.
**Why it happens:** Tailscale Serve reserves port 443 on the Tailscale interface for its built-in HTTPS proxy.
**How to avoid:** Either use Tailscale Serve as TLS frontend (recommended) or reconfigure Tailscale Serve to free port 443.
**Warning signs:** `nginx -t` passes but `systemctl start nginx` fails with "address already in use".

### Pitfall 3: WebSocket Timeout at 60 Seconds
**What goes wrong:** WebSocket connections drop after exactly 60 seconds of inactivity.
**Why it happens:** nginx default `proxy_read_timeout` is 60s. If no data flows, nginx closes the upstream connection.
**How to avoid:** Set `proxy_read_timeout 86400s` on WebSocket locations. Express already sends pings every 30s which keeps the connection alive.
**Warning signs:** WebSocket disconnects after quiet periods, reconnection loop.

### Pitfall 4: nginx Reload Not Preserving Old WebSocket Connections
**What goes wrong:** Long-lived WebSocket connections may get stuck in old worker processes after nginx reload.
**Why it happens:** nginx reload gracefully shuts down old workers, but WebSocket connections never "complete" -- they're open-ended.
**How to avoid:** Set `worker_shutdown_timeout 10s` in nginx.conf to force-close old worker connections after reload. Accept brief reconnection.
**Warning signs:** Old nginx workers linger with `is shutting down` status.

### Pitfall 5: Brotli Module Not Loaded
**What goes wrong:** Brotli compression not active despite installing packages.
**Why it happens:** The apt packages install the `.so` files but don't automatically create symlinks in `/etc/nginx/modules-enabled/`.
**How to avoid:** After installing, verify symlinks exist and run `nginx -t` to confirm module loads.
**Warning signs:** Response headers show `Content-Encoding: gzip` but never `br`.

### Pitfall 6: tailscale cert Requires sudo
**What goes wrong:** `tailscale cert` fails with usage error when run without sudo.
**Why it happens:** Certificate generation requires root access to the Tailscale daemon socket.
**How to avoid:** Run with `sudo tailscale cert` in the renewal script/timer.
**Warning signs:** cert command exits with code 1 and prints usage help.

### Pitfall 7: Let's Encrypt Rate Limits
**What goes wrong:** `tailscale cert` fails with rate limit error, 34-hour cooldown.
**Why it happens:** Running cert renewal too frequently (e.g., every deploy) hits Let's Encrypt limits.
**How to avoid:** Renew on a schedule (every 30 days), NOT on every deploy. Use `--min-validity` flag.
**Warning signs:** cert command fails with rate limit message.

## Code Examples

### Brotli Module Configuration
```nginx
# In http{} block of nginx.conf or in the site config
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

# Also keep gzip as fallback
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

### Tailscale Serve Integration
```bash
# Add Loom on a dedicated HTTPS port via Tailscale Serve
sudo tailscale serve --bg --https=5443 http://127.0.0.1:5580

# Verify
tailscale serve status
# Should show: https://samsara.tailad2401.ts.net:5443 -> http://127.0.0.1:5580
```

### Tailscale Cert Renewal (if nginx-managed TLS)
```ini
# /etc/systemd/system/loom-cert-renew.service
[Unit]
Description=Renew Tailscale TLS certificates for Loom

[Service]
Type=oneshot
ExecStart=/usr/bin/tailscale cert --cert-file /etc/loom/certs/samsara.tailad2401.ts.net.crt --key-file /etc/loom/certs/samsara.tailad2401.ts.net.key samsara.tailad2401.ts.net
ExecStartPost=/usr/bin/systemctl reload nginx

# /etc/systemd/system/loom-cert-renew.timer
[Unit]
Description=Monthly Tailscale cert renewal

[Timer]
OnCalendar=*-*-01,15 03:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

### Updated systemd Service (loom-backend.service)
```ini
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
- `Restart=on-failure` (was `Restart=always` -- `on-failure` is more appropriate, avoids restart loops on clean exit)
- `TimeoutStopSec=15` -- gives Express time for graceful shutdown
- `KillSignal=SIGTERM` -- explicit (was implicit default)

### Health Check Endpoint
```javascript
// Add to Express routes (before auth middleware)
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
});
```

```nginx
# nginx health check (optional, for monitoring)
location = /health {
    proxy_pass http://127.0.0.1:5555;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    access_log off;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| PM2 process management | systemd native services | Already using systemd | PM2 config (ecosystem.config.cjs) is redundant, can be removed |
| gzip-only compression | brotli preferred, gzip fallback | nginx 1.19.6+ (2020) | 15-25% better compression for text assets |
| Manual cert management | `tailscale cert` / Tailscale Serve | Tailscale TLS support (2022+) | No certbot, no cron jobs, no port 80 ACME challenges |
| Express serves everything | nginx for static, Express for API | This phase | Major latency and throughput improvement for static assets |

**Deprecated/outdated:**
- PM2 ecosystem.config.cjs: Redundant now that systemd manages the process. Can be removed or kept for development use.
- Express static file serving in production: Replaced by nginx. Express fallback stays for development mode only.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| nginx | Reverse proxy | YES | 1.24.0 | -- |
| libnginx-mod-http-brotli-filter | Brotli compression | NO (in apt) | 1.0.0~rc-5build1 | `sudo apt install` |
| libnginx-mod-http-brotli-static | Pre-compressed brotli | NO (in apt) | 1.0.0~rc-5build1 | `sudo apt install` |
| tailscale | TLS certs | YES | 1.96.2 | -- |
| systemd | Service management | YES | system | -- |
| Node.js | Express runtime | YES | v22.22.1 | -- |
| TypeScript | Build validation | YES (local) | 5.9.3 | -- |
| Vite | Frontend build | YES (local) | 7.x | -- |
| logrotate | Log management | YES | 3.21.0 | -- |

**Missing dependencies with no fallback:**
- None -- all critical tools are available.

**Missing dependencies with fallback:**
- Brotli nginx modules: Not installed but available via `sudo apt install`. Install required before nginx config references brotli directives.

## Current Environment State

### Existing nginx Sites
| Site | Status | Interface:Port |
|------|--------|---------------|
| jellyfin | enabled | 10.0.0.78:443 |
| nextcloud | enabled | (check config) |
| upload-nextcloud | enabled | (check config) |
| default | available (not enabled) | -- |

### Port Allocations
| Port | Service | Interface |
|------|---------|-----------|
| 80 | nginx | 0.0.0.0 |
| 443 | nginx (jellyfin) | 10.0.0.78 |
| 443 | tailscaled (Tailscale Serve) | 100.86.4.57 |
| 5555 | loom-backend (Express) | 0.0.0.0 |
| 3001 | RowLab frontend | 127.0.0.1 |
| 3002 | RowLab backend | 127.0.0.1 |

### Tailscale Hostname
- DNS Name: `samsara.tailad2401.ts.net`
- Tailscale IP: `100.86.4.57`
- cert generation: Verified working with `sudo tailscale cert`

### Current Build Output
- dist location: `src/dist/` (4.7MB, 136 asset files)
- Express expects: `dist/` at repo root (stale March 24 build)
- JS files: 131, CSS files: 5, Fonts: 4 (woff2)
- Named vendor chunks: vendor-react, vendor-markdown, vendor-shiki, vendor-radix, vendor-zustand

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.x + Playwright |
| Config file | src/vite.config.ts (test section) |
| Quick run command | `cd src && npx vitest run --reporter=verbose 2>&1 | tail -5` |
| Full suite command | `cd src && npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PROD-01 | nginx proxies HTTPS to Express | smoke | `curl -sSk https://samsara.tailad2401.ts.net:5443/api/health` | Wave 0 |
| PROD-02 | Static assets served with correct headers | smoke | `curl -sI https://samsara.tailad2401.ts.net:5443/assets/index-*.js \| grep Cache-Control` | Wave 0 |
| PROD-03 | deploy.sh builds and reloads | integration | `./deploy.sh` (manual run, check exit code) | Wave 0 |
| PROD-04 | Build validation catches failures | unit (bash) | Intentionally break tsc, run deploy.sh, verify abort | Wave 0 |
| PROD-05 | systemd services have correct deps | smoke | `systemctl show loom-backend -p After \| grep network` | Wave 0 |

### Sampling Rate
- **Per task commit:** `nginx -t && curl -s http://127.0.0.1:5580/health`
- **Per wave merge:** Full deploy.sh dry run
- **Phase gate:** All 5 smoke tests pass, deploy.sh completes successfully

### Wave 0 Gaps
- [ ] `deploy.sh` -- covers PROD-03, PROD-04
- [ ] nginx site config (`/etc/nginx/sites-available/loom`) -- covers PROD-01, PROD-02
- [ ] Brotli module installation -- prerequisite for PROD-02
- [ ] Express graceful shutdown handler -- prerequisite for PROD-03 zero-downtime
- [ ] Health check endpoint in Express -- enables smoke testing

## Open Questions

1. **Port 443 vs dedicated port for Loom**
   - What we know: Tailscale Serve holds port 443 on 100.86.4.57 for RowLab
   - What's unclear: Does the user want Loom to REPLACE RowLab on port 443, or use a different port?
   - Recommendation: Use port 5443 via Tailscale Serve. This is non-disruptive. The user's "port 443" intent likely assumed the port was free. Clarify before planning.

2. **Vite outDir resolution**
   - What we know: Build goes to `src/dist/`, Express reads from `dist/` (repo root)
   - What's unclear: Was this always the intent or did something drift?
   - Recommendation: Change the build command to `--outDir ../dist` in deploy.sh. Do NOT change vite.config.ts (that would break dev server).

3. **PM2 ecosystem.config.cjs disposition**
   - What we know: File exists but systemd is the actual process manager
   - Recommendation: Leave it alone for now. Not in scope for this phase.

## Sources

### Primary (HIGH confidence)
- Environment audit: Direct system inspection via bash (nginx -v, tailscale version, apt list, ss -tlnp, systemctl)
- Existing systemd service: `/etc/systemd/system/loom-backend.service` (read directly)
- Existing nginx config: `/etc/nginx/nginx.conf`, `/etc/nginx/sites-available/jellyfin` (pattern reference)
- Tailscale Serve status: `tailscale serve status --json` (direct query)
- Tailscale cert verification: Tested `sudo tailscale cert` successfully

### Secondary (MEDIUM confidence)
- [Tailscale HTTPS cert docs](https://tailscale.com/docs/how-to/set-up-https-certificates) - cert workflow, renewal, rate limits
- [Tailscale cert renewal with systemd timers](https://stfn.pl/blog/78-tailscale-certs-renew/) - timer configuration pattern
- [Ubuntu brotli module](https://launchpad.net/ubuntu/noble/amd64/libnginx-mod-http-brotli-static) - Ubuntu 24.04 package availability
- [nginx WebSocket proxy](http://nginx.org/en/docs/http/websocket.html) - Official nginx WebSocket docs
- [systemd dependency ordering](https://fedoramagazine.org/systemd-unit-dependencies-and-order/) - After= vs Requires= vs Wants=
- [nginx reload behavior](https://lemp.io/nginx-reload-does-it-drop-connections/) - Connection preservation during reload

### Tertiary (LOW confidence)
- WebSocket connection preservation during nginx reload: Some reports suggest WebSocket connections can break during reload in edge cases. The Express ping interval (30s) should keep connections active through the reload window.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All tools verified installed or available via apt
- Architecture: HIGH - Existing server patterns inspected, port conflicts identified
- Pitfalls: HIGH - Verified through direct environment testing (cert generation, port bindings, dist paths)
- Build validation: HIGH - Current dist stats measured, build commands tested

**Research date:** 2026-03-27
**Valid until:** 2026-04-27 (stable infrastructure, no fast-moving deps)
