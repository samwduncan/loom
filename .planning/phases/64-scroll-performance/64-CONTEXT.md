# Phase 64: Scroll Performance - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning
**Mode:** Auto-resolved (performance/infrastructure phase -- requirements concrete, Bard-Prime consulted)

<domain>
## Phase Boundary

Chat scrolling sustains 60fps on iPhone 16 Pro Max with 50+ messages. This phase eliminates all known scroll jank sources identified in the SCROLL-DEEP-DIVE research: setState in scroll handlers, DOM measurements in scroll handlers, rAF scrollIntoView loops, layout thrashing in composer auto-resize, and forced reflows in message finalization.

**This phase does NOT add virtualization** -- SCROLL-07 is a deferred evaluation gate. Fix the JS execution bottleneck first. Virtualization is only considered if fixes don't achieve 60fps.

**This phase does NOT change visual appearance** -- scroll behavior and performance only.

</domain>

<decisions>
## Implementation Decisions

### Scroll Architecture (SCROLL-01, SCROLL-02)
- **D-01:** Extract scroll logic from MessageList.tsx into a new `useChatScroll.ts` hook. MessageList currently has ~120 lines of inline scroll handling that should be a clean hook with defined API surface.
- **D-02:** The new `useChatScroll` hook replaces the inline `handleScroll` callback (MessageList.tsx:169-182) with IntersectionObserver-based atBottom detection. No `setAtBottom()` or `setUnreadCount()` in scroll event handlers -- these move to IO callbacks.
- **D-03:** atBottom state tracked as a ref (`isAtBottomRef`) for scroll-driven logic. Only sync to React state via debounced update (200ms+) for pill visibility. Scroll handler itself reads/writes ZERO React state.
- **D-04:** Remove all DOM measurements (`scrollHeight`, `scrollTop`, `clientHeight`) from scroll event handler. IO sentinel with `rootMargin: '0px 0px -150px 0px'` replaces distance-from-bottom calculation.
- **D-05:** Pill show/hide uses hysteresis band: show when sentinel exits 200px threshold, hide when sentinel enters 100px threshold. Prevents pill flashing during programmatic auto-scroll.

### Auto-Scroll During Streaming (SCROLL-03)
- **D-06:** Replace per-messages.length `useEffect` auto-scroll (MessageList.tsx:160-166) with ResizeObserver on the scroll container's content wrapper. Fires only when content actually grows (~1-5x/sec during streaming vs 120x/sec for rAF loop).
- **D-07:** ResizeObserver callback gated by `isAutoScrollingRef.current` check + rAF throttle guard (skip if frame already pending). Prevents double-scroll during rapid content growth.
- **D-08:** Auto-scroll uses `container.scrollTop = container.scrollHeight - container.clientHeight` (single assignment) not `scrollIntoView()` -- avoids forced layout calculations that scrollIntoView triggers.

### Composer Auto-Resize (SCROLL-04)
- **D-09:** Keep useLayoutEffect in useAutoResize.ts -- it fires ~10-20x/sec on fast typing, which is acceptable. The write→read→write pattern is unavoidable for height measurement.
- **D-10:** Verify that the composer textarea resize does NOT cause jank during scroll. If it does, wrap in rAF to separate from scroll frame. Secondary priority -- measure first.

### ActiveMessage Finalization (SCROLL-05)
- **D-11:** Keep the FLIP animation pattern (forced reflow is required for CSS transitions to animate from streaming height to finalized height).
- **D-12:** Defer the finalization animation setup by rAF + 50ms setTimeout to avoid collision with active scroll. This prevents the `void container.offsetHeight` from blocking a scroll frame.

### Dead Code Cleanup (SCROLL-06)
- **D-13:** Delete `useScrollAnchor.ts` and `useScrollAnchor.test.ts` AFTER the new `useChatScroll.ts` hook is complete. Port useful patterns first: ResizeObserver on content wrapper, anti-oscillation guard, rAF throttle pattern.
- **D-14:** Remove `useScrollAnchor` import from `ProofOfLife.tsx` (the only production consumer). Replace with `useChatScroll` or remove scroll demo from ProofOfLife.

### Virtualization Gate (SCROLL-07)
- **D-15:** No virtualization library added in this phase. After SCROLL-01 through 06, measure on real device: if >5% frame drops at 50+ messages during fast scroll, investigate further. If <5%, content-visibility is sufficient -- STOP.
- **D-16:** If virtualization IS needed in future, `virtua` (~3KB, built-in reverse scroll via `shift` prop) is preferred over react-virtuoso (15.7KB, streaming edge cases) or @tanstack/react-virtual (no reverse scroll support).

### iOS Scroll Features (SCROLL-08, SCROLL-09)
- **D-17:** Status bar tap → Capacitor `statusTap` event → `scrollTo({ top: 0, behavior: 'smooth' })` on the message list scroll container. Listen in the `useChatScroll` hook.
- **D-18:** Audit all scroll containers for `overscroll-behavior`. Message list and session list MUST have native rubber band bounce (no `overscroll-behavior: none`). Only `html`/`body` should have `overscroll-behavior: none` to prevent page-level bounce.

### Validation (SCROLL-10)
- **D-19:** End-to-end validation on physical iPhone 16 Pro Max with Safari Web Inspector profiling. Not simulator -- must be real device.
- **D-20:** Test with 50+ message conversation (the requirement) AND 200+ messages (headroom). If 50 sustains 60fps but 200 drops, document the ceiling.
- **D-21:** Test edge case: scroll while streaming + new message arrival + user scroll conflict. Verify no scroll jumps or oscillation.

### Claude's Discretion
- Exact hook API surface for `useChatScroll` (return type, parameter shape)
- Whether to add a custom scroll-performance benchmark or rely on Safari Web Inspector
- Whether to test on older devices (iPhone SE) in addition to Pro Max
- Implementation order of SCROLL-01 through 06 (recommended: 06 first since it's deletion, then 01+02 together, then 03, then 04+05)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scroll Performance Research
- `.planning/research/SCROLL-DEEP-DIVE.md` -- Production app analysis (Telegram, Discord, Slack, WhatsApp, ChatGPT), virtualization library comparison, 8 specific fix recommendations with code patterns
- `.planning/REQUIREMENTS.md` §SCROLL -- SCROLL-01 through SCROLL-10 acceptance criteria with specific code patterns to fix

### Source Files (Jank Sources)
- `src/src/components/chat/view/MessageList.tsx` -- THE scroll container. Lines 169-182 (handleScroll), 160-166 (auto-follow), 100-129 (infinite scroll IO)
- `src/src/hooks/useScrollAnchor.ts` -- Dead hook to delete. Has useful patterns to port (ResizeObserver, anti-oscillation guard)
- `src/src/hooks/useScrollAnchor.test.ts` -- Tests for dead hook (delete with hook)
- `src/src/components/chat/view/ActiveMessage.tsx` -- Line 184: `void container.offsetHeight` forced reflow
- `src/src/components/chat/composer/useAutoResize.ts` -- Layout thrashing pattern (write→read→write)

### Integration Points
- `src/src/stores/stream.ts` -- `isStreaming` state drives auto-scroll engagement
- `src/src/components/chat/view/ScrollToBottomPill.tsx` -- Consumes `showPill` / `unreadCount` from scroll logic
- `src/src/components/dev/ProofOfLife.tsx` -- Only consumer of useScrollAnchor (update on deletion)
- `src/e2e/scroll-anchor.spec.ts` -- E2E tests for scroll anchor behavior (update after refactor)

### Prior Architecture Decisions
- `.planning/phases/54-performance-hardening/54-CONTEXT.md` -- Performance patterns (request dedup, optimistic updates, lazy mounting)
- `.planning/V2_CONSTITUTION.md` -- Coding conventions (selector-only store access, named exports)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useScrollAnchor.ts` -- IntersectionObserver setup, ResizeObserver on content wrapper, rAF throttle guard, anti-oscillation pattern. Port these patterns to new `useChatScroll.ts` before deleting.
- `ScrollToBottomPill.tsx` -- Already consumes `showPill` and `unreadCount`. Hook API should match its needs.
- `MemoizedMessageItem` (MessageList.tsx:39-62) -- Already memoized. Prevents re-render on parent re-render. Good.
- `content-visibility: auto` on `.msg-item` -- Already in place for off-screen rendering optimization.

### Established Patterns
- Passive event listeners used throughout (`{ passive: true }`)
- IntersectionObserver for sentinel-based detection (load-more sentinel already works this way)
- `useStreamStore` selector pattern for stream state access
- useLayoutEffect for synchronous DOM measurements (useAutoResize)
- Session scroll position saved to sessionStorage with `SCROLL_STORAGE_PREFIX`

### Integration Points
- New `useChatScroll` hook consumed by `MessageList.tsx` -- replaces ~120 lines of inline logic
- Capacitor `@capacitor/status-bar` plugin `statusTap` event for SCROLL-08 (needs import in hook or component)
- `scrollContainerRef` passed down from `ChatPanel` to `MessageList` -- hook attaches to this ref

</code_context>

<specifics>
## Specific Ideas

No specific requirements -- open to standard approaches. The requirements are concrete enough that implementation choices follow from the acceptance criteria.

</specifics>

<quality_bar>
## Quality Bar (Bard Assessment)

**Good:** Fixes the 6 jank sources, validates 60fps at 50 messages on real device.

**Exceptional:**
- Profiles on real device with Safari Web Inspector flame graphs during scroll -- identifies bottlenecks quantitatively, not just "it feels smooth"
- Validates 200+ messages (2x target) to establish headroom for future content growth
- Tests on iPhone SE / older iPad to find the real lower bound (not just Pro Max flagship)
- Measures composer interaction latency DURING scroll -- should stay <50ms
- Edge case coverage: scroll while streaming + new message arrival + user scroll conflict
- Documents before/after performance measurements for future reference
- Verifies Cmd+F search still works with content-visibility (virtualization would break this)
- Measures memory via Safari Web Inspector to ensure content-visibility isn't over-caching

</quality_bar>

<deferred>
## Deferred Ideas

- **Virtualization** -- SCROLL-07 explicitly defers this. If fixes achieve 60fps at 50+ messages, no virtualization needed. If needed in future, `virtua` is the recommended library (~3KB, reverse scroll support).
- **Custom scroll-performance benchmark** -- Automated frame timing comparison (before/after). Nice-to-have for regression testing but not in scope for this phase.
- **Older device testing** -- iPhone SE / older iPad testing is quality-bar stretch, not a requirement. Phase targets iPhone 16 Pro Max specifically.

None -- analysis stayed within phase scope.

</deferred>

---

*Phase: 64-scroll-performance*
*Context gathered: 2026-03-28*
