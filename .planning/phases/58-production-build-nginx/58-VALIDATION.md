---
phase: 58
slug: production-build-nginx
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-27
---

# Phase 58 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Bash smoke tests + curl verification |
| **Config file** | None — validation is script-based |
| **Quick run command** | `nginx -t && curl -s http://127.0.0.1:5580/health` |
| **Full suite command** | `./deploy.sh && curl -sSk https://samsara.tailad2401.ts.net:5443/api/health` |
| **Estimated runtime** | ~30 seconds (build + validate + reload) |

---

## Sampling Rate

- **After every task commit:** Run `nginx -t && curl -s http://127.0.0.1:5580/health`
- **After every plan wave:** Run `./deploy.sh` (full build + validate + reload)
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 58-01-01 | 01 | 1 | PROD-01 | smoke | `curl -sSk https://samsara.tailad2401.ts.net:5443/api/health` | ❌ W0 | ⬜ pending |
| 58-01-02 | 01 | 1 | PROD-02 | smoke | `curl -sI https://samsara.tailad2401.ts.net:5443/assets/index-*.js \| grep Cache-Control` | ❌ W0 | ⬜ pending |
| 58-01-03 | 01 | 1 | PROD-05 | smoke | `systemctl show loom-backend -p After \| grep network` | ❌ W0 | ⬜ pending |
| 58-02-01 | 02 | 2 | PROD-03 | integration | `./deploy.sh` exit code 0 | ❌ W0 | ⬜ pending |
| 58-02-02 | 02 | 2 | PROD-04 | unit | Intentionally break tsc, verify deploy.sh aborts | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Express health check endpoint (`/health`) — prerequisite for smoke tests
- [ ] Express graceful shutdown handler — prerequisite for zero-downtime deploy
- [ ] brotli nginx modules installed via apt

*These are infrastructure prerequisites, not test files.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Tailscale Serve TLS termination | PROD-01 | Requires Tailscale daemon configuration | Run `sudo tailscale serve --bg --https=5443 http://127.0.0.1:5580`, verify with `tailscale serve status` |
| Zero-downtime during reload | PROD-03 | Requires concurrent connection during reload | Open WebSocket session, run `./deploy.sh`, verify WS reconnects within 5s |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
