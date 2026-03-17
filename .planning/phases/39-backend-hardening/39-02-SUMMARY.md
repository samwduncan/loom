---
phase: 39-backend-hardening
plan: 02
subsystem: api
tags: [express, systemd, pm2, jsonl, session-management]

requires:
  - phase: none
    provides: n/a
provides:
  - "PATCH /api/projects/:name/sessions/:id endpoint for session title updates"
  - "systemd unit file for auto-start/auto-restart backend service"
  - "pm2 ecosystem.config.cjs as fallback process manager"
affects: [40-session-management, frontend-session-rename]

tech-stack:
  added: []
  patterns: [append-only JSONL summary entries for title updates, systemd service management]

key-files:
  created: [loom-backend.service, ecosystem.config.cjs]
  modified: [server/index.js, server/projects.js]

key-decisions:
  - "Append-only fs.appendFile for JSONL title updates to avoid race conditions"
  - "systemd as primary process manager, pm2 as documented fallback"

patterns-established:
  - "JSONL summary entries: append {type:'summary', sessionId, summary, timestamp} to update session title"

requirements-completed: [BACK-02, BACK-03]

duration: 2min
completed: 2026-03-17
---

# Phase 39 Plan 02: Session Title Endpoint and Backend Service Summary

**PATCH endpoint for session title rename via append-only JSONL summary entry, plus systemd service for crash recovery**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-17T23:31:54Z
- **Completed:** 2026-03-17T23:33:24Z
- **Tasks:** 1
- **Files modified:** 4

## Accomplishments
- PATCH /api/projects/:name/sessions/:id endpoint with title validation (non-empty, max 200 chars)
- updateSessionTitle() function using append-only fs.appendFile to avoid race conditions
- systemd unit file installed at /etc/systemd/system/loom-backend.service and enabled for auto-start
- pm2 ecosystem.config.cjs as documented fallback process manager

## Task Commits

Each task was committed atomically:

1. **Task 1: PATCH endpoint for session title and systemd service** - `61873e5` (feat)

## Files Created/Modified
- `server/projects.js` - Added updateSessionTitle() function and export
- `server/index.js` - Added PATCH route with validation, imported updateSessionTitle
- `loom-backend.service` - systemd unit file for Loom backend
- `ecosystem.config.cjs` - pm2 fallback config

## Decisions Made
- Used fs.appendFile (append-only) rather than read-write-replace to avoid race conditions with concurrent JSONL writes
- systemd as primary process manager (already available on system), pm2 as documented fallback for environments without systemd
- RestartSec=3 for fast crash recovery without tight restart loops

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None - backend not currently running so endpoint couldn't be live-tested, but syntax checks pass for both modified files.

## User Setup Required

To start the backend as a systemd service:
```bash
sudo systemctl start loom-backend
journalctl -u loom-backend -f  # view logs
```

## Next Phase Readiness
- PATCH endpoint ready for frontend session rename feature in Phase 40
- Backend can be managed as a system service going forward

---
*Phase: 39-backend-hardening*
*Completed: 2026-03-17*
