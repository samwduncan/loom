# Phase 58: Production Build & Nginx - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning
**Source:** Interactive scoping session

<domain>
## Phase Boundary

Production-grade deployment infrastructure for Loom. nginx as reverse proxy with TLS termination, optimized static asset serving, and an automated build/deploy pipeline with validation gates.

**This phase does NOT touch application code** — it's purely infrastructure: nginx config, systemd services, deploy scripts, and build validation.

</domain>

<decisions>
## Implementation Decisions

### nginx Reverse Proxy
- **UPDATED:** Tailscale Serve terminates TLS on port 5443, forwards to nginx on 127.0.0.1:5580 (port 443 occupied by RowLab via Tailscale Serve)
- nginx listens on 127.0.0.1:5580 (plain HTTP) and proxies API/WebSocket traffic to Express on port 5555
- **DEFERRED:** Port 80 redirect not applicable — Tailscale Serve handles HTTPS directly
- WebSocket upgrade handling for /ws and /shell paths
- `X-Accel-Buffering: no` for SSE/streaming endpoints (server already sets this header)
- Access URL: https://samsara.tailad2401.ts.net:5443

### TLS Termination
- **UPDATED:** Tailscale Serve handles TLS termination and cert lifecycle automatically — no `tailscale cert` or renewal timers needed
- nginx receives plain HTTP from Tailscale Serve on 127.0.0.1:5580
- Express receives plain HTTP from nginx on 127.0.0.1:5555

### Static Asset Serving
- nginx serves dist/ directly (not proxied through Express)
- Hashed assets (*.js, *.css, *.woff2): `Cache-Control: public, max-age=31536000, immutable`
- index.html: `Cache-Control: no-cache, no-store, must-revalidate`
- brotli + gzip compression enabled (brotli preferred, gzip fallback)
- Try files: serve from dist/ first, fall through to Express for API routes

### Build Automation
- Single `./deploy.sh` script orchestrates the entire deploy
- Steps: pull → build frontend → validate → reload services
- Build validation gates before service reload:
  - TypeScript compilation succeeds (`tsc -b`)
  - Bundle size within limits (configurable threshold)
  - dist/index.html exists and is non-empty
  - Expected chunk files present
- Zero-downtime: nginx reload (not restart), Express graceful restart

### Systemd Services
- `loom-backend.service` already exists — update if needed
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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Server Configuration
- `server/index.js` — Express entry point, current static serving + SPA fallback logic
- `loom-backend.service` — Existing systemd service for Express backend
- `ecosystem.config.cjs` — PM2 config (may be superseded by systemd)

### Frontend Build
- `src/vite.config.ts` — Vite build config, chunk splitting, output paths
- `src/package.json` — Build scripts (`npm run build`)

### Infrastructure
- `.planning/REQUIREMENTS.md` — PROD-01 through PROD-05
- `.planning/ROADMAP.md` — Phase 58 success criteria

</canonical_refs>

<specifics>
## Specific Ideas

- Express already sets `X-Accel-Buffering: no` on SSE routes (server/routes/agent.js) — nginx config should respect this
- The Vite build already produces content-hashed filenames — nginx just needs to serve them with proper headers
- Express has production detection via `fs.existsSync(distIndexPath)` — this stays as fallback but nginx handles the primary serving path
- Tailscale IP is 100.86.4.57 — nginx should bind to 0.0.0.0 to serve on all interfaces
- Consider keeping Express's static serving as a development fallback (no nginx in dev)

</specifics>

<deferred>
## Deferred Ideas

- HTTP/3 (QUIC) support — revisit when browser/nginx support matures
- CDN/edge caching — single-user tool on Tailscale, no CDN needed
- Container/Docker deployment — systemd is simpler for this use case
- CI/CD pipeline (GitHub Actions) — manual deploy is fine for now
- Rate limiting / WAF — trusted network, not needed

</deferred>

---

*Phase: 58-production-build-nginx*
*Context gathered: 2026-03-27 via interactive scoping*
