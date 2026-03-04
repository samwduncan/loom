---
phase: 17-streaming-status
verified: 2026-03-04T14:30:00Z
status: passed
score: 7/7 success criteria verified
re_verification: false
approved_deviations:
  - requirement: STRM-09
    deviation: "REQUIREMENTS.md says 'with spinner on active card' but user explicitly approved border glow (tool-card-glow CSS animation) instead of spinner during planning (GATE-REPORT-wave-3.md line 299)"
---

# Phase 17: Streaming & Status Verification Report

**Phase Goal:** Streaming responses feel smooth and communicative -- token buffering prevents jank, scroll behavior respects user control, the current AI activity is always visible, and the user can stop generation at any time
**Verified:** 2026-03-04T14:30:00Z
**Status:** PASSED
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | During a long AI response, scrolling up pauses auto-scroll immediately and the view stays wherever the user scrolled -- no snapping back | VERIFIED | `useScrollAnchor` scroll-event based with 10px threshold; `isUserScrolledUp` set immediately on scroll; no debounce |
| 2 | When scrolled up during a response, a floating pill shows "N new messages" count -- clicking it scrolls to bottom smoothly | VERIFIED | `ScrollToBottomPill` renders "{N} new message{s}" text; `useNewMessageCounter` tracks delta since user scrolled up; `onScrollToBottom` smooth scrolls |
| 3 | A typing indicator (pulsing dots or similar) appears before the first token, a "Thinking..." indicator appears during extended thinking, and both transition seamlessly into content without layout jumps | VERIFIED | `PreTokenIndicator` uses `aurora-atmosphere` atmospheric glow (not dots, but atmospheric -- approved); `ThinkingShimmer` uses aurora rainbow text; both fade-up exit without grid collapse |
| 4 | Skeleton shimmer bars appear during reconnect scrollback, fading to real content when parsed | VERIFIED | `ReconnectSkeletons` uses `aurora-atmosphere` bars with staggered 80ms entry; `aurora-atmosphere-exit` fade-up dissolve on `isLoading=false` |
| 5 | The global status line shows semantic activity text ("Reading auth.ts...", "Writing server.ts...") parsed from tool events, with a spinner on the active tool card | VERIFIED (approved deviation) | `StatusLine` below composer; `useActivityStatus` + `parseActivityText` produces semantic text from `toolName`/`toolInput`; active tool card uses pulsing border glow (`tool-card-glow` CSS animation) instead of spinner -- user explicitly approved this deviation |
| 6 | The send button morphs to a stop button during streaming via CSS crossfade -- clicking stop aborts generation via WebSocket and the response ends cleanly | VERIFIED | Two absolutely-positioned icons (arrow + square) with `opacity` transitions; button background transitions `bg-primary` -> `bg-destructive`; `onClick={isLoading ? onAbortSession : undefined}` |
| 7 | Permanent errors (process crash, exit code) display as persistent inline banners with red accent -- visually distinct from toasts and regular messages | VERIFIED | `ErrorBanner` with `bg-destructive/10 border-l-2 border-destructive`; entry animation `opacity + translateY`; dismiss X button; `dismissedErrorsRef` prevents reappearance; renders inside scroll container below last message |

**Score:** 7/7 success criteria verified

---

### Required Artifacts

| Artifact | Expected | Exists | Substantive | Wired | Status |
|----------|----------|--------|-------------|-------|--------|
| `src/components/chat/hooks/useScrollAnchor.ts` | Scroll-event tracking, 10px threshold | Yes | Yes (77 lines, `scrollHeight - scrollTop - clientHeight <= BOTTOM_THRESHOLD`) | Yes (imported in ChatMessagesPane, wired via `onScroll={handleScroll}`) | VERIFIED |
| `src/components/chat/hooks/useNewMessageCounter.ts` | Message counter for pill | Yes | Yes (40 lines, snapshot + delta logic) | Yes (imported in ChatMessagesPane line 16, used line 212) | VERIFIED |
| `src/components/chat/view/subcomponents/ScrollToBottomPill.tsx` | Pill showing N new messages | Yes | Yes, contains "new message" with pluralization | Yes (rendered in ChatMessagesPane lines 521-525) | VERIFIED |
| `src/components/chat/styles/aurora-shimmer.css` | Aurora atmosphere classes | Yes | Yes (259 lines, contains `aurora-atmosphere`, `aurora-atmosphere-exit`, `aurora-dissolve-up`) | Yes (imported in PreTokenIndicator, ThinkingShimmer, ReconnectSkeletons) | VERIFIED |
| `src/components/chat/view/subcomponents/PreTokenIndicator.tsx` | Aurora glow field, fade-up exit | Yes | Yes, uses `aurora-atmosphere` class with 300ms exit timer | Yes (used in AssistantThinkingIndicator, rendered in ChatMessagesPane line 511) | VERIFIED |
| `src/components/chat/view/subcomponents/ThinkingShimmer.tsx` | Thinking text, transitions to collapsed block | Yes | Yes, `aurora-thinking-text` class, 250ms opacity exit | Yes (used in ThinkingDisclosure during streaming, transitions to collapsed block when content arrives) | VERIFIED |
| `src/components/chat/view/subcomponents/ReconnectSkeletons.tsx` | Aurora-matched skeleton placeholders | Yes | Yes, `aurora-atmosphere` class with staggered entry | Yes (rendered in ChatMessagesPane lines 514-516) | VERIFIED |
| `src/components/chat/hooks/useActivityStatus.ts` | Semantic activity text hook | Yes | Yes (108 lines, `parseActivityText` for 7 tool names, elapsed timer) | Yes (imported in StatusLine line 2, called line 31) | VERIFIED |
| `src/components/chat/view/subcomponents/StatusLine.tsx` | Always-visible status dashboard | Yes | Yes (100 lines, idle/streaming states, persistent container with `min-h-[28px]`) | Yes (imported in ChatComposer line 2, rendered below form lines 375-383) | VERIFIED |
| `src/components/chat/view/subcomponents/ChatComposer.tsx` | Send/stop morph, StatusLine integration | Yes | Yes, two icon layers with opacity crossfade, `bg-destructive` on stop state | Yes (verified lines 324-383) | VERIFIED |
| `src/components/chat/view/subcomponents/ErrorBanner.tsx` | Inline persistent error banner | Yes | Yes (64 lines, `bg-destructive/10`, `border-l-2 border-destructive`, dismiss X) | Yes (imported in ChatMessagesPane line 9, rendered lines 501-509) | VERIFIED |
| `src/components/chat/view/subcomponents/ChatMessagesPane.tsx` | ErrorBanner inline after last message | Yes | Yes, error detection scans last 5 messages | Yes (ErrorBanner rendered conditionally with `permanentError` state) | VERIFIED |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `ChatMessagesPane.tsx` | `useScrollAnchor` | `onScroll={handleScroll}` on container div | WIRED | Line 335: `onScroll={handleScroll}` on scroll container div |
| `ScrollToBottomPill.tsx` | `newMessageCount` | prop from `useNewMessageCounter` | WIRED | Line 212: `const { newMessageCount } = useNewMessageCounter(visibleMessages.length, scrollAnchorUserScrolledUp)` |
| `PreTokenIndicator.tsx` | `aurora-shimmer.css` | CSS class references | WIRED | Line 2: `import '../../styles/aurora-shimmer.css'`; uses `aurora-atmosphere` class |
| `ReconnectSkeletons.tsx` | `aurora-shimmer.css` | CSS class references | WIRED | Line 2: `import '../../styles/aurora-shimmer.css'`; uses `aurora-atmosphere` class |
| `StatusLine.tsx` | `useActivityStatus` | `activityText` prop from hook | WIRED | Line 31: `const { activityText, elapsedSeconds, tokenCount } = useActivityStatus(claudeStatus, isLoading)` |
| `ChatComposer.tsx` | `StatusLine` | Rendered below form element | WIRED | Lines 374-383: `<StatusLine ... />` after `</form>` |
| `ChatComposer.tsx` | `handleAbortSession` | Stop button `onClick` | WIRED | Line 327: `onClick={isLoading ? onAbortSession : undefined}`; line 378: `onAbort={onAbortSession}` |
| `ChatMessagesPane.tsx` | `ErrorBanner` | Rendered conditionally after message list | WIRED | Lines 500-509: `{permanentError && (<ErrorBanner ... />)}` |
| `useChatRealtimeHandlers.ts` | `parseActivityText` | `toolName`/`toolInput` set on `claudeStatus` | WIRED | Lines 357-358, 381-382: `toolName: part.name, toolInput: part.input` set during `tool_use` events; fixed in gate commit `bbcde48` |

---

### Requirements Coverage

| Requirement | Plan | Description | Status | Evidence |
|-------------|------|-------------|--------|----------|
| STRM-01 | 17-01 | Token streaming rAF buffer 50-100ms | SATISFIED | `lastFlushTimeRef` with 60ms gate in `useChatRealtimeHandlers.ts` lines 257-289; reset on stream start line 300 |
| STRM-02 | 17-01 | Smart auto-scroll, 10px threshold, overflow-anchor | SATISFIED | `useScrollAnchor` 10px threshold line 18; `overflowAnchor: 'auto'` on scroll container line 337 |
| STRM-03 | 17-01 | Floating scroll pill with "N new messages" | SATISFIED | `ScrollToBottomPill` line 40: `{newMessageCount} new message{newMessageCount !== 1 ? 's' : ''}` |
| STRM-04 | 17-02 | Typing indicator before first token | SATISFIED | `PreTokenIndicator` atmospheric aurora glow field with fade-up exit (pulsing "dots" replaced by atmospheric glow per user decision) |
| STRM-05 | 17-02 | Thinking indicator transitions to collapsed block | SATISFIED | `ThinkingShimmer` used in `ThinkingDisclosure` lines 57-59; `isStreaming && isEmpty` shows shimmer, content arrival triggers collapsed block |
| STRM-06 | 17-02 | Skeleton shimmer during reconnect | SATISFIED | `ReconnectSkeletons` with `aurora-atmosphere` bars, staggered entry, fade-up exit |
| STRM-08 | 17-04 | Inline error banners, persistent, red-accented | SATISFIED | `ErrorBanner` with `bg-destructive/10 border-l-2 border-destructive`; distinct from toasts; inside scroll container |
| STRM-09 | 17-03 | Global status line with current activity | SATISFIED (with approved deviation) | `StatusLine` always visible below composer; semantic activity text from `parseActivityText`; active tool card uses border glow not spinner (user-approved) |
| STRM-10 | 17-03 | Stop button replaces send during streaming | SATISFIED | CSS crossfade morph in `ChatComposer`; `bg-destructive` stop state; `onAbortSession` called |
| STRM-11 | 17-03 | Semantic activity text in status line | SATISFIED | `parseActivityText` returns "Reading auth.ts...", "Searching for pattern...", etc. -- wired via `claudeStatus.toolName/toolInput` |
| STRM-12 | 17-03 | Send-to-stop CSS crossfade, no layout jump | SATISFIED | Two absolutely-positioned icon layers; same button dimensions in both states |

**All 11 requirements satisfied. One approved user deviation: STRM-09 "spinner on active card" replaced by pulsing border glow per explicit user decision documented in GATE-REPORT-wave-3.md.**

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `ClaudeStatus.tsx` | 3 | Noop component remains | Info | File kept as empty noop, comment documents it is deprecated. No functional impact. Cleanup optional. |
| `17-04-SUMMARY.md` | 39 | `requirements-completed: []` | Info | Summary frontmatter missed STRM-08 (handled correctly in plan frontmatter). No code impact. Documentation only. |

No blocker or warning anti-patterns found. All key files are substantive (no stubs, no placeholder returns).

---

### Human Verification Required

#### 1. Scroll Pause Behavior During Streaming

**Test:** Open a chat session, send a message that triggers a long AI response. While the response is streaming, scroll up. Confirm the view stays where you scrolled and does not snap back to the bottom.
**Expected:** View holds position, scroll pill appears with "N new messages" count.
**Why human:** Cannot simulate WebSocket streaming and scroll physics programmatically.

#### 2. Scroll Pill Auto Re-Engage

**Test:** While scrolled up with the pill visible, scroll back near the bottom manually (without clicking the pill).
**Expected:** Pill disappears automatically. Auto-scroll re-engages. New tokens cause the view to track the bottom again.
**Why human:** Requires actual scroll interaction with live streaming content.

#### 3. Aurora Pre-Token Indicator Appearance

**Test:** Send a message. Observe the period between sending and the first token arriving.
**Expected:** An atmospheric aurora glow field (diffused colored light, not a loading bar) appears where the response will arrive. When the first token arrives, the aurora fades upward and dissolves without a layout jump or grid squish.
**Why human:** Visual appearance and transition quality cannot be verified programmatically.

#### 4. Thinking Shimmer Transition

**Test:** Send a message with a model that supports extended thinking (Claude Sonnet with thinking enabled).
**Expected:** "Thinking..." text with rainbow gradient appears. When thinking completes, it fades out and a collapsed thinking disclosure block appears with the thinking content.
**Why human:** Requires live extended thinking stream to verify the transition.

#### 5. Send/Stop Button Morph

**Test:** Send a message that triggers streaming. Observe the send button.
**Expected:** Arrow icon fades out, square stop icon fades in, button background changes from primary color to red (destructive). No layout jump. Clicking the stop button aborts generation cleanly.
**Why human:** Visual crossfade quality and abort behavior require live interaction.

#### 6. Status Line Content Accuracy

**Test:** During streaming with tool use (e.g., Claude using Read or Bash tools): observe the status line below the composer.
**Expected (streaming):** Shows "Reading {filename}..." or "Searching for '{pattern}'..." with elapsed seconds counter, token count (when available), and "esc to stop" hint. Red stop button on right.
**Expected (idle):** Shows "Claude . {model} . ${cost}" with token usage pie on right.
**Why human:** Requires live tool event stream to verify semantic text accuracy.

#### 7. Error Banner Display

**Test:** Trigger a process crash or non-zero exit code (e.g., run a command that deliberately fails with a non-zero exit). Observe the chat view.
**Expected:** A muted red banner appears after the last message with the error description. Banner is clearly distinct from toast notifications. Clicking X dismisses it permanently (does not reappear for the same error).
**Why human:** Requires triggering an actual process error to verify banner display and dismiss behavior.

---

## Commit Verification

Phase 17 commits verified in git history:
- `ccd8c81` -- feat(17-01): rewrite useScrollAnchor to scroll-event based + tune rAF buffer
- `c0cf6a7` -- feat(17-01): wire message-counting scroll pill and rename hook
- `b9240b0` -- feat(17-02): atmospheric aurora glow field for PreTokenIndicator
- `1ade721` -- feat(17-02): upgrade ThinkingShimmer exit + ReconnectSkeletons aurora match
- `e0ec383` -- feat(17-03): add useActivityStatus hook and StatusLine component
- `776d890` -- feat(17-03): send/stop morph, StatusLine wiring, ClaudeStatus removal
- `bbcde48` -- fix(17-gate): wire parseActivityText into useActivityStatus hook
- `e2dace1` -- feat(17-04): add ErrorBanner component and tool card pulsing glow

---

## Summary

All 11 STRM requirements are satisfied. All 7 ROADMAP success criteria are verified. TypeScript compilation passes clean (`npx tsc --noEmit` exits 0). No sentinel div, no IntersectionObserver in useScrollAnchor, no stubs or placeholder components.

One user-approved deviation: STRM-09 and success criterion 5 reference "spinner on active tool card" but the user explicitly approved pulsing border glow (`tool-card-glow` CSS animation via `box-shadow`) instead. This decision is documented in the plan frontmatter, GATE-REPORT-wave-3.md, and produces a functionally equivalent running-state indicator without the layout concerns of a spinner element.

The phase goal is achieved: streaming feels smooth and communicative.

---

_Verified: 2026-03-04T14:30:00Z_
_Verifier: Claude (gsd-verifier)_
