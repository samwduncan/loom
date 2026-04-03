---
phase: 74
slug: shell-connection
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-03
---

# Phase 74 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest-expo (Jest 29.x with Expo preset) |
| **Config file** | `mobile/jest.config.js` (Wave 0 creates) |
| **Quick run command** | `cd mobile && npx jest --bail --silent` |
| **Full suite command** | `cd mobile && npx jest --verbose` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd mobile && npx jest --bail --silent`
- **After every plan wave:** Run `cd mobile && npx jest --verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 74-01-01 | 01 | 1 | N/A (cleanup) | build | `cd mobile && npx expo export --platform ios 2>&1` | N/A | ⬜ pending |
| 74-02-01 | 02 | 1 | N/A (theme) | unit | `cd mobile && npx jest theme` | ❌ W0 | ⬜ pending |
| 74-03-01 | 03 | 2 | CONN-01 | unit | `cd mobile && npx jest useAuth` | ❌ W0 | ⬜ pending |
| 74-04-01 | 04 | 2 | NAV-01, NAV-02 | unit | `cd mobile && npx jest drawer` | ❌ W0 | ⬜ pending |
| 74-05-01 | 05 | 3 | CONN-02, CONN-03 | unit | `cd mobile && npx jest useConnection` | ❌ W0 | ⬜ pending |
| 74-06-01 | 06 | 3 | NAV-03, NAV-04 | unit | `cd mobile && npx jest chat` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `mobile/jest.config.js` — Jest config with jest-expo preset
- [ ] `mobile/jest.setup.js` — Reanimated mock, SecureStore mock, Haptics mock, MMKV mock
- [ ] `jest-expo` + `@testing-library/react-native` — install test deps
- [ ] `mobile/__tests__/` — test directory structure

*Test infrastructure is entirely new — no existing jest config in mobile/.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Drawer parallax animation | NAV-02 | Spring physics + visual shift need visual verification | Open drawer, verify content shifts ~20px right with smooth spring |
| Safe area compliance | NAV-04 | Requires physical device with Dynamic Island | Launch on iPhone 15 Pro, verify no content behind notch/home indicator |
| Connection banner glass effect | CONN-03 | Visual blur + glass appearance | Disconnect server, verify banner slides down with blur visible |
| Keyboard avoidance | NAV-03 | Requires device keyboard | Tap composer input, verify content adjusts smoothly |
| Haptic feedback on taps | N/A | Requires physical device haptic motor | Tap hamburger, session items, buttons — verify haptic response |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
