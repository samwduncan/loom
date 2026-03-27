---
phase: 58-production-build-nginx
plan: 02
subsystem: infra
tags: [deploy-pipeline, vite-build, typescript, nginx, systemd, validation-gates, zero-downtime]

requires:
  - phase: 58-production-build-nginx-01
    provides: nginx reverse proxy on 127.0.0.1:5580, Tailscale Serve TLS on 5443, systemd services with dependency ordering

provides:
  - Single-command deploy.sh pipeline with build validation gates
  - TypeScript compilation gate before deploy
  - Vendor chunk validation (react, shiki, radix, zustand, markdown)
  - Bundle size limit enforcement (15MB)
  - Zero-downtime reload (Express restart + health check + nginx reload)
  - Dirty-tree guard with --no-pull override

affects: [production-operations, future-deploys, ci-cd]

tech-stack:
  added: []
  patterns: [deploy-pipeline-with-validation-gates, retry-health-check, express-first-reload-ordering]

key-files:
  created:
    - deploy.sh
  modified: []

key-decisions:
  - "Added --emptyOutDir to vite build -- required because outDir is outside Vite project root, stale files accumulated to 54MB without it"
  - "Health check grep for '\"status\":\"ok\"' matches exact backend response format"
  - "public/ copy step after vite build ensures PWA manifest, favicons, and icons are in dist/"

patterns-established:
  - "Deploy pipeline: dirty check -> pull -> npm ci (both) -> tsc -> vite build -> public copy -> validate -> Express restart -> health check -> nginx reload"
  - "Validation gates: index.html exists, 5 vendor chunks present, 4+ fonts, 50+ assets, <15MB, CSS present, manifest.json present"

requirements-completed: [PROD-03, PROD-04]

duration: 5min
completed: 2026-03-27
---

# Phase 58 Plan 02: Deploy Pipeline Summary

**Single-command deploy.sh with 7 build validation gates, TypeScript compilation check, public/ asset copy, and zero-downtime Express-first reload ordering with retry health check**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-27T22:04:15Z
- **Completed:** 2026-03-27T22:09:30Z
- **Tasks:** 2
- **Files modified:** 1 (deploy.sh)

## Accomplishments

- deploy.sh orchestrates full deploy: dirty-tree check, git pull, npm ci (backend + frontend), tsc -b, vite build --outDir ../dist --emptyOutDir, public/ copy, 7 validation gates, Express restart with retry health check, nginx reload
- Build validation gates catch: missing index.html, missing vendor chunks (5 named), missing fonts (<4 woff2), low asset count (<50), oversized bundle (>15MB), missing CSS, missing manifest.json
- Zero-downtime reload: Express restarts first, retry health check (5 attempts, 1s apart) confirms backend is healthy, THEN nginx reload (preserves existing connections)
- Full TLS path verified end-to-end: Tailscale Serve :5443 -> nginx :5580 -> Express :5555
- Static assets confirmed with immutable cache headers, index.html with no-cache, brotli compression active

## Task Commits

Each task was committed atomically:

1. **Task 1: Create deploy.sh** - `e697056` (feat)
2. **Task 2: Run deploy.sh + verify full TLS path** - `5ef7f2c` (fix -- added --emptyOutDir)

**Plan metadata:** pending (docs commit)

## Files Created/Modified

- `deploy.sh` - Single-command deploy pipeline (155 lines) with validation gates and service reload

## Decisions Made

1. **--emptyOutDir required for vite build** -- When outDir is outside the Vite project root (../dist from src/), Vite does not auto-clean. Without this flag, stale files from previous builds accumulated to 54MB. With it, clean builds are 6MB.

2. **Health check matches exact response format** -- Backend returns `{"status":"ok",...}` so the grep pattern `'"status":"ok"'` is reliable and specific.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added --emptyOutDir to vite build command**
- **Found during:** Task 2 (running deploy.sh end-to-end)
- **Issue:** dist/ accumulated 54MB of stale files from previous builds because Vite's outDir (../dist) is outside the project root -- Vite refuses to auto-clean external outDirs without explicit flag
- **Fix:** Added `--emptyOutDir` flag to the vite build command
- **Files modified:** deploy.sh
- **Verification:** Clean build produces 6MB dist/ with 136 assets, passes all validation gates
- **Committed in:** 5ef7f2c

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential fix -- without it, stale files cause size validation to fail on every deploy. No scope creep.

## Issues Encountered
None beyond the --emptyOutDir issue documented above.

## User Setup Required
None - no external service configuration required.

## Verification Results

All acceptance criteria verified:

| # | Check | Result |
|---|-------|--------|
| 1 | `./deploy.sh --no-pull` completes | Exit 0, 136 assets, 6MB |
| 2 | `curl -sSk https://...5443/health` | `{"status":"ok"}` |
| 3 | Static asset Cache-Control | `public, max-age=31536000, immutable` |
| 4 | index.html Cache-Control | `no-cache, no-store, must-revalidate` |
| 5 | `curl .../manifest.json` | Valid JSON with "name" field |
| 6 | `curl .../favicon.svg` | HTTP 200 |
| 7 | TypeScript error gate | Aborts with "TypeScript compilation failed" |
| 8 | Dirty-tree guard | Aborts with "Working tree dirty" |
| 9 | `systemctl is-active loom-backend` | active |
| 10 | `systemctl is-active nginx` | active |
| 11 | `systemctl show nginx -p After` | Contains loom-backend.service |
| 12 | Brotli compression | `Content-Encoding: br` |

## Next Phase Readiness
- Production deployment infrastructure is fully operational
- Phase 58 (production-build-nginx) is complete -- all 5 PROD requirements satisfied
- Future deploys: `./deploy.sh` (from clean tree) or `./deploy.sh --no-pull` (for local changes)
- Access URL: https://samsara.tailad2401.ts.net:5443

---
*Phase: 58-production-build-nginx*
*Completed: 2026-03-27*
