# Adversarial Code Review — Phase 75

**Tier:** max
**Date:** 2026-04-04
**Agents:** Guard (Sonnet), Hunter (Opus), Architect (Opus), Bard (Gemini), Cody (Codex — skipped, no uncommitted)
**Files reviewed:** 27
**Findings:** 49 total (8 S+ grade, fixed)

## Issues (Fixed)

### [S] scrollToBottom inverted for inverted FlatList
**File:** mobile/hooks/useScrollToBottom.ts:37
**Source:** Hunter | **Confidence:** High
**Description:** scrollToEnd on inverted FlatList goes to oldest messages, not newest
**Fix:** Changed to scrollToOffset({ offset: 0 }) — offset 0 = newest in inverted list

### [S] Distance-from-bottom calculation inverted
**File:** mobile/hooks/useScrollToBottom.ts:29
**Source:** Hunter | **Confidence:** High
**Description:** Formula assumed non-inverted list; offset 0 = bottom in inverted FlatList
**Fix:** Changed to contentOffset.y <= BOTTOM_THRESHOLD

### [S] PermissionCard double-tap race condition
**File:** mobile/components/chat/segments/PermissionCard.tsx:114-144
**Source:** Hunter | **Confidence:** High
**Description:** No guard against rapid double-tap sending conflicting permission responses
**Fix:** Added hasRespondedRef guard in both handleApprove and handleDeny

### [A] Conditional useRef (Rules of Hooks violation)
**File:** mobile/components/chat/MessageList.tsx:87
**Source:** Guard + Hunter + Architect (3 agents) | **Confidence:** High
**Description:** React.useRef called conditionally via ?? operator
**Fix:** Always create localRef, then pick which to use

### [A] Wrong font family names (silently falls back to SF Pro)
**File:** mobile/theme/theme.ts:37-61, mobile/lib/toast.tsx:208
**Source:** Guard | **Confidence:** High
**Description:** 'Inter' not registered; loaded as 'Inter-Regular'/'Inter-SemiBold'
**Fix:** Updated all fontFamily values to match registered font names

### [A] useMessageList missing useMemo (perf during streaming)
**File:** mobile/hooks/useMessageList.ts:148
**Source:** Architect + Bard (2 agents) | **Confidence:** High
**Description:** toDisplayMessages re-parses entire history on every streaming token
**Fix:** Wrapped in useMemo, spread for append operations

### [A] Composer sends to stale stub session
**File:** mobile/components/chat/Composer.tsx:115
**Source:** Hunter | **Confidence:** High
**Description:** After stub → real session replacement, composer still uses stub-* ID
**Fix:** Use storeActiveSessionId from stream store when available

### [A] Timer cleanup leaks on unmount
**File:** mobile/hooks/useScrollPosition.ts:24-31, mobile/components/navigation/DrawerContent.tsx:175
**Source:** Hunter + Bard (2 agents) | **Confidence:** Medium
**Description:** Debounce timers and pending delete timers not cleaned up on unmount
**Fix:** Added cleanup useEffect in both locations

## Dismissed Findings (Pre-existing, Not Phase 75)

- Bard SSS: WebSocket re-initialization race (websocket-init.ts) — pre-existing file, not modified
- Bard SS: Unencrypted MMKV snapshots — storage pattern from Phase 69
- Hunter S: Double endStream call — shared multiplexer behavior, idempotent

## Lower-Grade Notes

**B-grade (13):** TOOL_ICONS duplication (Guard), generateDescription switch (Guard), Props not exported (Guard), ScrollToBottomPill hardcoded styles (Guard), largeTitle fontWeight (Guard — fixed as part of font fix), non-null without ASSERT (Guard), as cast without comment (Guard), link handler allows arbitrary schemes (Hunter), Composer missing projectName (Hunter — fixed), pending delete timer leak (Hunter — fixed), code fence parser edge cases (Hunter), useMessageList perf (Architect — fixed), heading style repetition (Architect)

**C-grade (8):** Hardcoded hex colors (Guard ×2), spacing arithmetic (Guard), useEffect dependency boolean (Guard), isUnclosedCodeFence heuristic (Hunter), StreamingIndicator exit animation (Hunter), ScrollToBottomPill shared value on JS thread (Hunter + Architect)

## Verification
**Status:** PASSED
**Date:** 2026-04-04
**Agents:** Guard (Haiku) + Hunter (Haiku)
All S+ issues resolved. Haiku verification found no regressions from fixes. Additional findings are edge cases in pre-existing code (narrowInput empty object, scroll restore timing), not issues introduced by the AR fixes.
