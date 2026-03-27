# Adversarial Plan Review — Phase 57

**Tier:** max
**Date:** 2026-03-27
**Agents:** Guard (Sonnet), Hunter (Opus), Architect (Opus), Bard Prime (Gemini)
**Findings:** 18 raw, 10 unique after dedup (3 S, 5 A, 2 B)

## Issues Addressed

### [S] ROADMAP success criteria impossible from Linux (Architect)
**Source:** Architect | **Confidence:** High
**Description:** ROADMAP SC2 says "tested from WKWebView" and SC3 says "loads and renders" — both impossible without Mac/iOS device.
**Fix:** Plan amended to update ROADMAP wording. SC2 → "analyzed with documented verdict"; SC3 → "scaffolded and configured."

### [S] `cap init` missing before `cap add ios` (Guard, Architect)
**Source:** Guard, Architect | **Confidence:** High
**Description:** Plan jumped directly to `cap add ios` without initialization step.
**Fix:** Added `npx cap init` step before `cap add ios`.

### [S] `require()` fails in ESM mode (Architect)
**Source:** Architect | **Confidence:** High
**Description:** Verify command used `require('./package.json')` but `"type": "module"` in package.json means `require` is unavailable.
**Fix:** Changed to `--input-type=module` with `import{readFileSync}from'fs'`.

### [A] SPM fallback flag missing (Guard, Bard)
**Source:** Guard, Bard | **Confidence:** High
**Fix:** Changed to `cap add ios --packagemanager SPM` as primary, bare `cap add ios` as fallback.

### [A] `process.env` comment misleading (Architect, Bard)
**Source:** Architect, Bard | **Confidence:** High
**Fix:** Updated comments to clarify value is resolved at `cap sync` time, not runtime.

### [A] No .gitignore for ios/ (Architect)
**Source:** Architect | **Confidence:** High
**Fix:** Added step to append `ios/` to `src/.gitignore`.

### [A] Build verification missing (Hunter, Architect)
**Source:** Hunter, Architect | **Confidence:** Medium
**Fix:** Added `npm run build` to automated verify chain.

### [A] Task 2 "actual output" criterion not grep-verifiable (Guard, Hunter, Bard)
**Source:** Guard, Hunter, Bard | **Confidence:** High
**Fix:** Changed to check for fenced code block in Prototype Results section.

## Lower-Grade Notes (B/C)

- [B] AppId inconsistency in research doc (`com.loom.app` vs `com.loom.agent`) — noted, not plan-blocking
- [B] Effort estimate contradiction for prototype row — fixed with "(scaffolding works on Linux)" note
- [B] Missing VALIDATION.md in Task 2 read_first — added
- [C] Duplicate `</output>` tag — formatting nit
- [C] AppId inconsistency between research sections — cosmetic

## Bard Inflation Corrections

| Bard Grade | Actual Grade | Reason |
|------------|-------------|--------|
| SSS-01 | A | Plan intentionally treats cap failure as valid; concern is about capture location |
| SSS-02 | A | process.env works at sync time as intended; comments misleading, not broken |
| SSS-03 | C | Research adequately caveats theoretical basis; "HIGH confidence (theoretical)" is defensible |
| SS-01 | Dismissed | API base URL abstraction is out of scope for research phase |
| SS-02 | False | Automated verify already runs vitest |

**Verification: PASSED** — All S+ issues addressed in plan revision.
