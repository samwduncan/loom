# Adversarial Code Review — Phase 66

**Tier:** default
**Date:** 2026-03-29
**Agents:** Guard (Haiku) + Hunter (Sonnet) + Architect (Sonnet)
**Files reviewed:** 14
**Findings:** 13 total (6 Phase 66, 7 pre-existing)

## Phase 66 Issues (Fixed)

### [SS] Token test regex captures both :root blocks
**File:** src/src/styles/tokens.test.ts:78
**Source:** Architect + Hunter | **Confidence:** High
**Description:** Greedy `[\s\S]*` regex captured both main and mobile override :root blocks, weakening duplicate detection.
**Fix:** Non-greedy `[^}]*` match isolates first :root block. Added --text-code dual-definition assertion.
**Status:** FIXED (commit 0d1f36c)

### [S] MarkdownRenderer inline code text-[0.85em] = 11.9px on desktop
**File:** src/src/components/chat/view/MarkdownRenderer.tsx:46
**Source:** Architect | **Confidence:** High
**Description:** 0.85em relative to 14px parent = 11.9px, below 12px minimum. Also caused streaming/finalized inline code size mismatch.
**Fix:** Changed to `text-[length:var(--text-code)]` for token consistency and streaming parity.
**Status:** FIXED (commit 0d1f36c)

### [A] TYPO-01 test exception class escaping broken
**File:** src/e2e/typography.spec.ts:58
**Source:** Hunter | **Confidence:** High
**Description:** `replace('\\', '')` only replaces first backslash, leaving broken class match. Exception for text-[10px] never fires.
**Fix:** Removed unnecessary backslash escaping, exception strings now literal.
**Status:** FIXED (commit 0d1f36c)

### [A] TYPO-03 test hardcoded 500ms delay
**File:** src/e2e/typography.spec.ts:176
**Source:** Hunter | **Confidence:** High
**Description:** `waitForTimeout(500)` is flaky on slow CI. Sidebar may not render in time.
**Fix:** Replaced with `waitForSelector('[role="option"]', { timeout: 3000 })`.
**Status:** FIXED (commit 0d1f36c)

### [B] ComposerStatusBar 10px on desktop violates Constitution 14.1
**File:** src/src/components/chat/composer/ComposerStatusBar.tsx:176
**Source:** Guard + Architect | **Confidence:** High
**Description:** `text-[10px] max-md:text-[length:var(--text-xs)]` left 10px on desktop. Not listed as exception.
**Fix:** Changed to `text-[length:var(--text-xs)]` (12px everywhere).
**Status:** FIXED (commit 0d1f36c)

### [C] Defensive no-op cmdk CSS declaration
**File:** src/src/styles/base.css:217-220
**Source:** Architect | **Confidence:** High
**Description:** `[cmdk-item]` font-size override was already the same value — dead code.
**Fix:** Replaced with audit comment documenting the verification.
**Status:** FIXED (commit 0d1f36c)

## Pre-existing Issues (Forgejo)

### [SS] --surface-0, --surface-1 undefined in streaming-markdown.css
**File:** src/src/components/chat/styles/streaming-markdown.css:11,35
**Source:** Guard + Hunter + Architect (3/3 agents)
**Description:** Streaming code blocks have transparent background — tokens never defined.

### [SS] --z-popover undefined in composer.css
**File:** src/src/components/chat/composer/composer.css:83
**Source:** Architect + Hunter (2/3 agents)
**Description:** Mention/slash pickers get z-index: auto instead of proper stacking.

### [S] --text-accent undefined in thinking-disclosure.css
**File:** src/src/components/chat/styles/thinking-disclosure.css:80
**Source:** Guard + Hunter + Architect (3/3 agents)
**Description:** Links in thinking blocks inherit parent color, no visual affordance.

### [B] V2_CONSTITUTION Section 7 documents V1 token names
**File:** .planning/V2_CONSTITUTION.md:401-545
**Source:** Architect
**Description:** Sections 7.1-7.11 reference HSL-era token names (--background, --card, etc.) superseded in V2.

### [B] Stale context window after session switch
**File:** src/src/hooks/useUsageMetrics.ts:76-81
**Source:** Hunter
**Description:** Previous session's token usage persists in state on null sessionId.

### [B] CodeBlock LINE_HEIGHT_PX underestimate on mobile
**File:** src/src/components/chat/view/CodeBlock.tsx:32,46
**Source:** Hunter
**Description:** Hardcoded 20px line height constant undershoots on mobile (18px font → ~27px actual).

### [C] fmtCost renders "$Infinity" for non-finite values
**File:** src/src/components/chat/composer/ComposerStatusBar.tsx:42-47
**Source:** Hunter
**Description:** Infinity passes isNaN check, toFixed returns "Infinity" string.

## Verification
**Status:** PASSED
**Date:** 2026-03-29
**All Phase 66 issues resolved. 1476 Vitest tests + Playwright typography tests passing.**
