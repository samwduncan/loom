# Phase 64: Scroll Performance - Discussion Log (Auto Mode)

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md -- this log preserves the analysis.

**Date:** 2026-03-28
**Phase:** 64-scroll-performance
**Mode:** Auto (--auto flag, all decisions auto-resolved with recommended defaults)
**Areas analyzed:** Scroll Architecture, Auto-Scroll Mechanism, Virtualization Gating, useAutoResize Fix, ActiveMessage Finalization, SCROLL-06 Ordering

---

## Scroll Architecture (SCROLL-01, SCROLL-02)

| Option | Description | Selected |
|--------|-------------|----------|
| Extract to `useChatScroll.ts` hook | Clean API surface, testable in isolation, MessageList stays readable | ✓ |
| Fix inline in MessageList.tsx | Less code movement, faster to implement | |

**Auto-selected:** Extract to `useChatScroll.ts` hook
**Rationale:** MessageList is 260+ lines with ~120 lines of scroll logic. Hook extraction creates clean boundary. Bard-Prime concurs.

---

## Auto-Scroll During Streaming (SCROLL-03)

| Option | Description | Selected |
|--------|-------------|----------|
| ResizeObserver on content wrapper | Fires 1-5x/sec during streaming, no false positives | ✓ |
| rAF loop with scrollTop assignment | Fires 60-120x/sec regardless of content changes | |
| MutationObserver on message container | Fires on every DOM insertion even without size change | |

**Auto-selected:** ResizeObserver on content wrapper
**Rationale:** Research confirms ResizeObserver is the sweet spot -- fires only on actual size changes. Telegram uses similar deferred-measurement approach.

---

## Virtualization Decision (SCROLL-07)

| Option | Description | Selected |
|--------|-------------|----------|
| Measure after fixes, >5% frame drops = investigate | Fix JS execution first, data-driven virtualization decision | ✓ |
| Add virtualization preemptively | Avoid potential future rework | |

**Auto-selected:** Measure after fixes
**Rationale:** ChatGPT, Slack, WhatsApp all use non-virtualized lists. A18 Pro handles 4,000+ DOM nodes. The bottleneck is JS, not DOM.

---

## useAutoResize Fix (SCROLL-04)

| Option | Description | Selected |
|--------|-------------|----------|
| Keep useLayoutEffect, verify keystroke lag | Fires ~10-20x/sec, acceptable. Measure first. | ✓ |
| Double-rAF separation | Separates reads/writes across frames. Over-engineering risk. | |
| CSS-only (max-height) | Avoids DOM reads entirely. Causes visible overflow issues. | |

**Auto-selected:** Keep useLayoutEffect, verify keystroke lag
**Rationale:** Bard-Prime assessment: secondary priority, useLayoutEffect is already the correct batching mechanism at this frequency.

---

## ActiveMessage Finalization (SCROLL-05)

| Option | Description | Selected |
|--------|-------------|----------|
| Keep FLIP, add rAF+50ms defer | Prevents collision with scroll frame, minimal change | ✓ |
| Replace with Web Animations API | Still needs height measurement, no benefit for this case | |
| Remove animation entirely | Loses visual polish | |

**Auto-selected:** Keep FLIP, add rAF+50ms defer
**Rationale:** Forced reflow is unavoidable for FLIP. Deferral prevents the offsetHeight read from blocking an active scroll frame.

---

## SCROLL-06 Ordering

| Option | Description | Selected |
|--------|-------------|----------|
| Delete after consolidation into useChatScroll | Port useful patterns first, then delete dead code | ✓ |
| Delete first as cleanup | Risk losing useful patterns (ResizeObserver, anti-oscillation) | |

**Auto-selected:** Delete after consolidation
**Rationale:** useScrollAnchor has better auto-scroll patterns than MessageList's inline implementation. Port good ideas to new hook, then delete.

---

## Bard-Prime Consultation

**Approach:** Fix-first-then-virtualize confirmed as sound. 90% confidence.

**Key additions from Bard:**
- SCROLL-06 is deceptively dangerous -- consolidate before deleting
- Content-visibility paint storms possible on fast scroll -- must test real device
- Hysteresis band for pill visibility (show 200px, hide 100px) prevents flashing
- 50ms defer for ActiveMessage FLIP prevents collision with active scroll
- Quality bar: test 200+ messages, profile with Safari Web Inspector flame graphs

**Disagreements:** None. Full alignment on approach.

---

## Claude's Discretion

- Hook API design for `useChatScroll`
- Implementation ordering (recommended: 06→01+02→03→04+05)
- Custom benchmark vs Safari Web Inspector for validation
- Older device testing scope

## Deferred Ideas

- Virtualization (explicitly deferred to post-measurement gate)
- Automated frame timing benchmark
- Older device (iPhone SE) testing
