# Adversarial Plan Review — Phase 68

**Tier:** full
**Date:** 2026-03-31
**Agents:** Guard (Sonnet), Hunter (Opus), Architect (Opus)
**Findings:** 12 S+ (2 SSS, 2 SS, 8 S), plus ~15 A/B/C (lower grade)
**Status:** All S+ issues fixed via planner revision. Haiku verification: PASSED.

## S+ Issues (All Fixed)

### [SSS] Plan 01 `tsconfig.json` excludes `__tests__/`
**Source:** Guard | **Plan:** 68-01
Excluded test directory from TypeScript checking. Fixed: removed `__tests__` from exclude array.

### [SS] `server/` in workspaces has no package.json
**Source:** All 3 agents | **Plan:** 68-01
Root workspaces array included `server/` which has no package.json. Fixed: removed from array.

### [SS] React 18 (root) vs React 19 (src/mobile) version conflict
**Source:** Guard, Architect | **Plan:** 68-01
Workspace hoisting would produce duplicate React. Fixed: added `overrides` for React ^19.0.0.

### [S] Plans 05/06 incorrect SCAFF-06 requirement mapping
**Source:** All 3 agents | **Plans:** 68-05, 68-06
Soul doc plans claimed NativeWind requirement. Fixed: changed to `requirements: []` with design gate note.

### [S] `resolveWsUrl` signature mismatch — missing token parameter
**Source:** Hunter, Architect | **Plan:** 68-02
Factory proposed single-param resolver but actual takes `(path, token)`. Fixed: corrected signature.

### [S] api-client `refreshAuth()` not in factory options
**Source:** Hunter | **Plan:** 68-02
401 auto-retry machinery lost in extraction. Fixed: added `onAuthRefresh` callback option.

### [S] AuthProvider `clearToken` sync/async mismatch
**Source:** All 3 agents | **Plan:** 68-03
Native auth used async `deleteItemAsync` but interface is sync. Fixed: use `deleteItem()` (SDK 55 sync API).

### [S] stream-multiplexer `@/stores/stream` import — not "transfer as-is"
**Source:** Hunter | **Plan:** 68-02
Vite alias import won't resolve in shared/. Fixed: instruction to rewrite to relative path + grep check.

### [S] NativeWind custom classes used before tokens defined
**Source:** Hunter, Architect | **Plan:** 68-03
Plan 03 placeholders used `bg-surface-base` but tokens not defined until Plan 04. Fixed: inline styles.

### [S] Plan 01 barrel export references non-existent files
**Source:** Architect | **Plan:** 68-01
Task 1 created full barrel but files don't exist until Task 2. Fixed: stub in Task 1, finalize in Task 2.

### [S] zustand/immer duplication risk in workspaces
**Source:** Guard | **Plan:** 68-01
Direct deps in shared/ + root risks duplicate resolution. Fixed: peerDependencies in shared/.

### [S] `npx expo install` bypasses workspace hoisting
**Source:** Guard | **Plan:** 68-03
Running npm inside workspace creates conflicting lockfile. Fixed: lockfile cleanup + root npm install.

## Lower-Grade Notes (Not Requiring Fixes)

- [A] Hardcoded Tailscale IP 100.86.4.57 in platform.ts — acceptable for single-developer scaffolding
- [A] Button component opacity redundancy (className + style) — cosmetic
- [A] Existing `shared/modelConstants.js` not in barrel — intentionally kept separate
- [B] Plan 07 `eas credentials` is interactive — human checkpoint handles this
- [B] Missing search/share/pinned routes in scaffolding — low priority for Phase 68
- [C] Plan 07 wave 1 vs "last task" labeling — human checkpoints enforce ordering

## Verification

**Revision:** Planner addressed all 12 issues with targeted edits
**Haiku pass:** 12/12 confirmed fixed, no remaining S+ issues
**Approval:** PASSED
