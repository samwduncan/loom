---
phase: 57
slug: ios-research
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-27
---

# Phase 57 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 |
| **Config file** | `src/vite.config.ts` (test section) |
| **Quick run command** | `cd src && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd src && npx vitest run --coverage` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** `cd src && npx vitest run --reporter=verbose` (existing tests still pass)
- **After every plan wave:** Full suite with coverage
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 57-01-01 | 01 | 1 | IOS-01 | manual | Visual inspection of output document | N/A | ⬜ pending |
| 57-01-02 | 01 | 1 | IOS-02 | manual | Visual inspection of DNS analysis | N/A | ⬜ pending |
| 57-01-03 | 01 | 1 | IOS-03 | smoke | `cd src && npx cap doctor` (if available) | No — Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Verify `npx cap add ios` succeeds on Linux — if it fails, document the error and provide manual alternative
- [ ] No new test files needed — this is a research/document phase, not a code phase

*Existing infrastructure covers all unit/integration requirements. Phase deliverables are documents and a scaffold.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Document covers Capacitor path with pros/cons/effort | IOS-01 | Document deliverable — subjective content review | Verify document has sections for: architecture options, pros/cons table, effort estimate |
| DNS analysis documented with evidence | IOS-02 | Research deliverable — requires human judgment on completeness | Verify document covers WKWebView sandbox behavior, ATS implications, MagicDNS vs raw IP |
| Capacitor shell project loads Loom | IOS-03 | Requires iOS device to fully verify — Linux can only scaffold | Verify ios/ folder exists, capacitor.config.ts points to Loom, `cap doctor` passes basic checks |
