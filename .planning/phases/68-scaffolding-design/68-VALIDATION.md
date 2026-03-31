---
phase: 68
slug: scaffolding-design
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-31
---

# Phase 68 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.0.18 (existing web), vitest 4.0.18 (new shared/) |
| **Config file (web)** | `src/vite.config.ts` (test section) |
| **Config file (shared)** | `shared/vitest.config.ts` (new — Wave 0) |
| **Quick run command** | `cd src && npx vitest run --reporter=verbose 2>&1 \| tail -20` |
| **Full suite command** | `cd src && npx vitest run && npx tsc -b && npx vite build` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd src && npx vitest run` (web regression check)
- **After every plan wave:** Run `cd src && npx vitest run && npx vite build && cd ../shared && npx vitest run`
- **Before `/gsd:verify-work`:** Full web suite green + vite build + shared/ tests green + device verification
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 68-XX-01 | XX | 1 | SCAFF-01 | manual | `eas build --profile development --platform ios` | N/A (manual) | ⬜ pending |
| 68-XX-02 | XX | 1 | SCAFF-02 | unit | `cd shared && npx vitest run` | ❌ W0 | ⬜ pending |
| 68-XX-03 | XX | 1 | SCAFF-03 | smoke | Launch dev build, navigate routes | N/A (manual) | ⬜ pending |
| 68-XX-04 | XX | 1 | SCAFF-04 | integration | `cd src && npx vitest run && npx vite build` | ✅ | ⬜ pending |
| 68-XX-05 | XX | 2 | SCAFF-05 | manual | Verify in Apple Developer portal | N/A (manual) | ⬜ pending |
| 68-XX-06 | XX | 1 | SCAFF-06 | smoke | Launch dev build, verify 5 primitives render | N/A (manual) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `shared/vitest.config.ts` — vitest config for shared/ package
- [ ] `shared/__tests__/` — migrated tests from src/src/stores/*.test.ts and selected lib/*.test.ts
- [ ] `shared/tsconfig.json` — TypeScript config without Vite/DOM types

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| EAS dev build installs on device | SCAFF-01 | Requires physical iPhone + Apple account | Run `eas build --profile development --platform ios`, install via QR code |
| Expo Router navigation works | SCAFF-03 | Requires device interaction | Open app, verify drawer opens, stack navigation works |
| NativeWind primitives render | SCAFF-06 | Visual verification on device | Open app, check 5 design primitives match design intent |
| Apple Developer enrollment | SCAFF-05 | External portal verification | Check developer.apple.com for active membership + APNs certs |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
