# Phase 53: Mobile-Responsive Layout - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via autonomous workflow)

<domain>
## Phase Boundary

Users can comfortably monitor and interact with AI agents from a phone browser. Touch-friendly targets, swipe gestures, keyboard avoidance, responsive code blocks and images.

Note: MOBILE-01 (viewport zoom fix) is already implemented — viewport meta has maximum-scale=1.0 and inputs use text-base on mobile. The sidebar hamburger drawer is also already done. This phase focuses on remaining mobile polish.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion. Key constraints:

- MOBILE-01: Already done (viewport meta + text-base inputs). Verify, don't re-implement.
- MOBILE-02: Audit all interactive elements for 44x44px minimum touch targets. Use padding/min-height, not scaling.
- MOBILE-03: Add swipe-to-close gesture on mobile sidebar drawer (already has backdrop click + X button). Use touch events or pointer events.
- MOBILE-04: Composer should stay above virtual keyboard. Use `visualViewport` API or `interactive-widget=resizes-content` meta tag. Test on iOS Safari.
- MOBILE-05: Code blocks need `overflow-x: auto` on mobile. Images need `max-width: 100%`. Message layout should be comfortable at 390px width.
- Mobile detection: reuse existing `useSyncExternalStore` + `matchMedia('(max-width: 767px)')` pattern from ContentArea/Sidebar.

</decisions>

<code_context>
## Existing Code Insights

### Already Implemented (this session)
- `src/index.html` — `maximum-scale=1.0, user-scalable=no` viewport meta
- `src/src/components/sidebar/Sidebar.tsx` — Mobile overlay drawer with hamburger, backdrop, auto-close
- `src/src/components/chat/composer/ChatComposer.tsx` — `text-base md:text-sm` on textarea
- `src/src/components/sidebar/SearchInput.tsx` — `text-base md:text-sm` on search input

### Patterns
- Mobile detection via `useSyncExternalStore` in ContentArea.tsx and Sidebar.tsx
- Tailwind responsive: `md:` prefix for 768px+ breakpoint
- `hidden md:flex` pattern for hiding elements on mobile (TabBar)

### Integration Points
- Message components (UserMessage, AssistantMessage) for touch targets
- CodeBlock component for horizontal scroll
- MarkdownRenderer for image sizing
- ComposerKeyboardHints for mobile-specific hints

</code_context>

<specifics>
## Specific Ideas

- Swipe gesture: track touchstart/touchmove/touchend on sidebar overlay, close if swipe-left > 100px
- Keyboard avoidance: CSS `env(safe-area-inset-bottom)` for notch devices, `visualViewport.resize` event for keyboard
- Code blocks: `pre > code` already has `overflow-x: auto` in most cases, verify
- Touch targets: tool chips, session items, settings toggles are likely too small

</specifics>

<deferred>
## Deferred Ideas

- Bottom navigation bar for mobile (tab switching without sidebar) — evaluate after core mobile UX
- Haptic feedback on interactions (requires native wrapper / Capacitor)

</deferred>
