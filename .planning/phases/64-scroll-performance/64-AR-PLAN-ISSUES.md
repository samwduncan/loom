# Adversarial Plan Review — Phase 64

**Tier:** deep
**Date:** 2026-03-28
**Agents:** Guard (Sonnet), Hunter (Opus), Architect (Opus)
**Findings:** 37 total across 3 agents, 4 S+ grade after dedup+triage

## S+ Issues (Must Fix)

### [S] SCROLL-07 REQUIREMENTS.md text contradicts D-15/D-16
**Source:** Guard (SSS→S after triage), Architect (A) | **Confidence:** High
**Plan:** 64-03, REQUIREMENTS.md
**Description:** REQUIREMENTS.md SCROLL-07 says "implement @tanstack/react-virtual" but CONTEXT.md D-15/D-16 locks "no virtualization this phase, virtua preferred if ever needed." Same class of issue as SCROLL-04/05 (already fixed). Post-execution verifier will flag false failure.
**Fix:** Update REQUIREMENTS.md SCROLL-07 acceptance criteria to match D-15/D-16: measure-then-decide gate, virtua preferred (not @tanstack/react-virtual), phase passes if <5% frame drops at 50+ messages.

### [S] ProofOfLife contentWrapperRef JSX not wired
**Source:** Guard (SS→S, dev page only) | **Confidence:** High
**Plan:** 64-01, Task 2
**Description:** Plan switches ProofOfLife from useScrollAnchor to useChatScroll but only updates the hook call, not the JSX. The new hook returns contentWrapperRef which must be attached to the content wrapper div for ResizeObserver to work. Without it, auto-scroll in ProofOfLife silently breaks.
**Fix:** Add to Plan 01 Task 2 action: wire `ref={contentWrapperRef}` on ProofOfLife's conversation content wrapper div.

### [S] Contradictory save/restore instructions in Plan 01 Task 2
**Source:** Guard (S), Architect (S) | **Confidence:** High
**Plan:** 64-01, Task 2
**Description:** Three contradictory paragraphs ("WAIT: remove lines 131-158" → "Actually, KEEP lines 144-158" → "Remove saveTimeoutRef lines 177-181"). Autonomous executor may follow first instruction and break scroll position persistence.
**Fix:** Replace stream-of-consciousness with clear disposition: (1) KEEP restore useLayoutEffect (lines 144-158), (2) REMOVE saveTimeoutRef + handleScroll save logic (lines 177-181, hook owns this), (3) REMOVE or KEEP session-switch save effect (lines 133-141) with explicit choice.

### [S] useAutoResize.test.ts doesn't exist — verify command will fail
**Source:** Guard (S), Hunter (B) | **Confidence:** High
**Plan:** 64-02, Task 1
**Description:** Plan 02 Task 1 verify runs `npx vitest run src/src/components/chat/composer/useAutoResize.test.ts -x` but that file doesn't exist. Verify command fails with file-not-found.
**Fix:** Either (a) create useAutoResize.test.ts as part of Task 1 deliverables, or (b) change verify to `cd src && npx vitest run --reporter=verbose` (full suite, which will pass).

## Notable A-Grade (Guidance for Planner)

- **ActiveMessage setTimeout cleanup:** Add cleanup ref or mounted check for the 50ms deferred FLIP. Low risk (50ms, null-checks exist) but good practice.
- **base.css missing from Plan 02 Task 2 read_first:** Add it — executor needs current line numbers.
- **sentinelRef naming collision:** Plan 01 Task 2 should explicitly rename existing `sentinelRef` to `loadMoreSentinelRef`.
- **scrollTop vs SCROLL-02 wording:** The scroll handler reads `scrollTop` for direction detection (non-layout-forcing). Add clarifying note that this doesn't violate SCROLL-02's intent.
- **Scroll position save test:** Add test case for sessionStorage save/restore to useChatScroll.test.ts behavior list.

## Lower-Grade Notes (B/C)

- SCROLL-08 dual ownership between Plans 01 and 03 (B) — ownership unclear but fallback exists
- VALIDATION.md nyquist_compliant never set to true (C) — execution workflow handles this
- Plan 03 @context references SUMMARY.md files that don't exist yet (A) — depends_on handles ordering
- content-visibility contain-intrinsic-size 150px at outer vs inner DOM level (A) — research recommended this
- overscroll-behavior grep audit should be in acceptance criteria (C)
