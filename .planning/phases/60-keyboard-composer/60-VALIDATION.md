---
phase: 60
slug: keyboard-composer
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-28
---

# Phase 60 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `src/vitest.config.ts` |
| **Quick run command** | `cd src && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd src && npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd src && npx vitest run --reporter=verbose`
- **After every plan wave:** Run `cd src && npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 60-01-01 | 01 | 1 | KEY-01 | unit | `cd src && npx vitest run src/src/lib/native-plugins.test.ts` | ❌ W0 | ⬜ pending |
| 60-01-02 | 01 | 1 | KEY-01, KEY-05 | unit | `cd src && npx vitest run src/src/lib/native-plugins.test.ts` | ❌ W0 | ⬜ pending |
| 60-02-01 | 02 | 2 | KEY-02, KEY-03, KEY-04 | unit | `cd src && npx vitest run src/src/hooks/useKeyboardOffset.test.ts` | ❌ W0 | ⬜ pending |
| 60-02-02 | 02 | 2 | KEY-04 | unit | `cd src && npx vitest run src/src/components/chat/composer/ChatComposer.test.tsx` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/src/lib/native-plugins.test.ts` — stubs for KEY-01, KEY-05 (plugin init, resize mode, readiness promise)
- [ ] `src/src/hooks/useKeyboardOffset.test.ts` — stubs for KEY-02, KEY-03, KEY-04 (offset hook, scroll coordination)

*Existing ChatComposer.test.tsx covers KEY-04 integration.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Smooth keyboard slide on iOS | KEY-03 | Animation smoothness requires visual inspection on real device | Open app on iPhone 16 Pro Max, tap composer, verify keyboard slides composer up without jank |
| No black gap on dismiss | KEY-03 | Visual artifact requires device testing | Dismiss keyboard, verify no black gap or layout jump |
| Safe area + keyboard transition | KEY-03 | Notch device interaction requires physical device | On notched device, verify no double-padding during keyboard animation |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
