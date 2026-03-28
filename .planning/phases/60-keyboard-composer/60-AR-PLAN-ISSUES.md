# Adversarial Plan Review -- Phase 60

**Tier:** default
**Date:** 2026-03-28
**Agents:** Guard (Haiku), Hunter (Sonnet), Architect (Sonnet)
**Findings:** 8 S+ grade (2 SS, 6 S) -- all resolved by planner revision

## Issues (All Resolved)

### [SS] @capacitor/keyboard as production dependency
**Source:** Hunter | **Confidence:** High
**Plan:** 60-01, Task 1
**Description:** Install command without `--save-dev` places package in `dependencies` instead of `devDependencies`, breaking convention with other @capacitor/* packages.
**Resolution:** Changed to `npm install --save-dev`. Acceptance criteria updated.

### [SS] Async cleanup race -- listener handles null on fast unmount
**Source:** Hunter, Architect | **Confidence:** High
**Plan:** 60-02, Task 1
**Description:** Async IIFE pattern means `showHandle`/`hideHandle` are null when cleanup runs if component unmounts before IIFE resolves. Listeners leak in StrictMode.
**Resolution:** Added `cancelled` flag pattern inside IIFE. Cleanup sets cancelled=true before removing handles.

### [SS] Scroll coordination references useScrollAnchor misleadingly
**Source:** Guard, Hunter, Architect | **Confidence:** High
**Plan:** 60-02, Task 1
**Description:** Interfaces block referenced `useScrollAnchor.ts` but it's not wired to ChatComposer. Also `scrollToBottom` used instant jump instead of smooth scroll.
**Resolution:** Removed useScrollAnchor references. Changed to `el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })`.

### [S] Cold-start async race -- getKeyboardModule() null before init resolves
**Source:** Hunter | **Confidence:** High
**Plan:** 60-01 + 60-02
**Description:** React mounts before `initializeNativePlugins()` resolves, causing `getKeyboardModule()` to return null on cold start.
**Resolution:** Added `nativePluginsReady: Promise<void>` export. Hook awaits it before checking module.

### [S] CSS @supports gate changed from env() to max() incorrectly
**Source:** Guard, Hunter, Architect | **Confidence:** High
**Plan:** 60-02, Task 2
**Description:** `max(0px)` is more widely supported than `env()`, making the gate meaningless.
**Resolution:** Kept original `@supports (padding-bottom: env(safe-area-inset-bottom))` gate. Only inner value uses `max()`.

### [S] scrollToBottom uses instant jump, not smooth scroll
**Source:** Architect | **Confidence:** High
**Plan:** 60-02, Task 1
**Description:** `el.scrollTop = el.scrollHeight` is instant snap during keyboard animation. Should match MessageList's own smooth scroll.
**Resolution:** Changed to `el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })`.

### [S] Test "skips init when IS_NATIVE=false" assertion unverifiable
**Source:** Architect | **Confidence:** High
**Plan:** 60-01, Task 2
**Description:** Can't spy on dynamic `import()` calls in Vitest.
**Resolution:** Reframed to test side effects: `Keyboard.setResizeMode` never called, `data-native` not set.

### [S] Missing null scrollContainerRef handling in tests
**Source:** Guard | **Confidence:** High
**Plan:** 60-02, Task 1
**Description:** scrollContainerRef can be null/undefined but no test covered this edge case.
**Resolution:** Added test case: "when scrollContainerRef is undefined, keyboard opens without errors."

## Lower-Grade Notes (Not Revised)

- [A] `html[data-native]` CSS rule now wrapped in `@media (max-width: 767px)` -- fixed during revision
- [A] `_resetForTesting()` export added following websocket-init.ts precedent -- fixed during revision
- [A] VALIDATION.md KEY-05 row corrected -- fixed during revision
- [A] fullHeight stale on orientation change -- inherited from existing code, documented as known limitation
- [B] Missing read_first for useScrollAnchor.ts -- resolved by removing misleading references
- [B] Verify script logic confusing but correct -- left as-is (functionally correct)
- [C] must_haves truths include manual-only assertions -- moved to manual verification section

## Verification

**Haiku verification pass:** PASSED -- all 7 S+ issues confirmed resolved in revised plans.
