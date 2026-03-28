# Phase 63: Bundled Assets & Device Validation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md -- this log preserves the alternatives considered.

**Date:** 2026-03-28
**Phase:** 63-bundled-assets-device-validation
**Mode:** Auto-resolved (--auto flag)
**Areas discussed:** Build pipeline, Connection error handling, Device validation, Auth bootstrap

---

## Build Pipeline Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Script + docs | Create cap-build.sh convenience script + Mac workflow documentation | auto |
| Docs only | Only document the manual steps, no automation | |
| Full CI/CD | Set up GitHub Actions with macOS runner | |

**Auto-selected:** Script + docs (recommended default)
**Rationale:** Single developer workflow -- full CI/CD is overkill, but a convenience script prevents manual errors.

---

## Connection Error Messaging

| Option | Description | Selected |
|--------|-------------|----------|
| Native-specific | Enhance ConnectionBanner with IS_NATIVE-aware messaging (VPN/server context) | auto |
| Generic | Keep existing generic error messages for all platforms | |
| Full reachability | Add network reachability pre-check before auth bootstrap | |

**Auto-selected:** Native-specific (recommended default)
**Rationale:** Users on native need actionable guidance about VPN connectivity. Pre-check adds complexity without much UX benefit beyond a better error message.

---

## Device Validation Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Structured checklist | Create DEVICE-VALIDATION-CHECKLIST.md with binary pass/fail items | auto |
| Informal notes | Ad-hoc testing, no formal checklist | |
| Automated tests | XCTest/Appium suite | |

**Auto-selected:** Structured checklist (recommended default)
**Rationale:** Checklist serves as UAT criteria for the entire v2.1 milestone. Automated tests are overkill for single-device validation.

---

## Auth Bootstrap in Bundled Mode

| Option | Description | Selected |
|--------|-------------|----------|
| Verify + graceful error | Verify existing flow, add graceful handling for unreachable server | auto |
| Verify only | Trust existing code, no changes | |
| Runtime URL config | Add settings screen for server URL | |

**Auto-selected:** Verify + graceful error (recommended default)
**Rationale:** Existing fetchAnon() path is correct but failure mode needs improvement. Runtime URL config is overkill for single-user dev tool.

---

## Bard-Prime Consultation

Bard-Prime was consulted and flagged:
- Cold-start race risk (plugins vs hook access)
- Auth bootstrap failure on non-Tailscale networks
- Splash timeout masking real errors
- iOS code signing as device prerequisite
- file:// asset path resolution differences

All flags incorporated into CONTEXT.md decisions and quality bar section.

## Claude's Discretion

- Shell script implementation details
- Vite base path handling approach
- Test file scope for network reachability
- Validation checklist granularity

## Deferred Ideas

- Runtime server URL configuration -- v2.2 if multi-device testing needed
- CI/CD for iOS builds -- not needed for single developer
- Automated device testing -- manual checklist sufficient
