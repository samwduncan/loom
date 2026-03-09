---
phase: 15-tool-card-shell-state-machine
verified: 2026-03-07T21:46:00Z
status: passed
score: 4/4 must-haves verified
re_verification: false
---

# Phase 15: Tool Card Shell + State Machine Verification Report

**Phase Goal:** Tool calls display with state machine animations and consistent card wrapper
**Verified:** 2026-03-07T21:46:00Z
**Status:** passed
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths (from ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Tool calls transition through invoked/executing/resolved/error states with visual CSS transitions -- pulsing dot during execution, static green/red on completion | VERIFIED | `tool-chip.css` L44-65: `.tool-chip-dot--invoked` (pulse animation), `--executing` (pulse), `--resolved` (static `--status-success`), `--rejected` (static `--status-error`). `data-status` attribute on ToolCardShell root drives error CSS. ToolChip test confirms all 4 status classes render correctly. |
| 2 | Executing tools show elapsed time counter that updates live ("1.2s", "5.4s") and cleans up on resolve/error | VERIFIED | `useElapsedTime.ts`: 100ms `setInterval` when `completedAt` is null (L50-76), freezes via adjust-state-during-rendering when `completedAt` transitions (L35-40), belt-and-suspenders ref guard (L58-63), cleanup on unmount (L70-75). `formatElapsed` tested with 8 boundary cases. ToolChip renders elapsed with middle-dot separator (L61-66). |
| 3 | Error tool cards force-expand with red accent and error message text -- never auto-collapsed | VERIFIED | `ToolChip.tsx` L27-29: `useState(toolCall.isError && toolCall.status === 'rejected')` initializes expanded for errors. L38-43: adjust-state-during-rendering auto-expands on transition to rejected. `tool-card-shell.css` L104-111: red border (`oklch(from var(--status-error) l c h / 0.3)`) and background tint (`oklch(... / 0.05)`) on `[data-status="rejected"]`. `tool-chip.css` L136-138: `.tool-chip--rejected` red border tint on chip. Tests confirm: error starts expanded (L163-177), auto-expands on transition (L179-194). |
| 4 | ToolCardShell provides consistent header/footer/expand behavior; DefaultToolCard handles unregistered tools | VERIFIED | `ToolCardShell.tsx`: memo-wrapped component with header (icon, displayName, status dot, status label, elapsed time), CSS Grid body (0fr/1fr animation), onToggle callback. `tool-registry.ts` L137-148: `getToolConfig()` returns DefaultToolCard fallback for unknown tools. DefaultToolCard renders structured key-value rows (L91-103) with scrollable container (`max-height: 200px`). ToolChip test L150-159 confirms unknown tools render correctly. |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/src/lib/format-elapsed.ts` | Elapsed time formatting utility | VERIFIED | 17 lines, exports `formatElapsed`, sub-60s and 60s+ formats |
| `src/src/lib/format-elapsed.test.ts` | Boundary case tests | VERIFIED | 8 tests covering 0ms through multi-minute |
| `src/src/hooks/useElapsedTime.ts` | Hook with 100ms interval + cleanup | VERIFIED | 79 lines, interval lifecycle, adjust-state-during-rendering, ref guard |
| `src/src/components/chat/tools/ToolCardShell.tsx` | Shared card wrapper | VERIFIED | 93 lines, memo-wrapped, header/body/error treatment, imports useElapsedTime |
| `src/src/components/chat/tools/ToolCardShell.test.tsx` | Component tests | VERIFIED | 10 tests covering header, expand, error, children |
| `src/src/components/chat/tools/tool-card-shell.css` | CSS Grid animation + error styles | VERIFIED | 119 lines, 0fr/1fr grid, spring easing, error oklch tint, reduced-motion |
| `src/src/components/chat/tools/ToolChip.tsx` | Refactored with elapsed, error, shell | VERIFIED | 85 lines, useElapsedTime, ToolCardShell always mounted, adjust-state-during-rendering |
| `src/src/components/chat/tools/ToolChip.test.tsx` | Updated + new tests | VERIFIED | 16 tests (8 updated + 6 new for elapsed/error/shell) |
| `src/src/components/chat/tools/tool-chip.css` | Elapsed, rejected, DefaultToolCard CSS | VERIFIED | 185 lines, separator/elapsed/rejected classes, DefaultToolCard structured layout |
| `src/src/lib/tool-registry.ts` | DefaultToolCard structured key-value | VERIFIED | Object.entries key-value rows, scrollable container, error class preserved |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `useElapsedTime.ts` | `format-elapsed.ts` | `import formatElapsed` | WIRED | L2: `import { formatElapsed } from '@/lib/format-elapsed'` |
| `ToolCardShell.tsx` | `useElapsedTime.ts` | `import useElapsedTime` | WIRED | L13: `import { useElapsedTime } from '@/hooks/useElapsedTime'` |
| `ToolCardShell.tsx` | `stream.ts` types | `import ToolCallState` | WIRED | L14: `import type { ToolCallState, ToolCallStatus } from '@/types/stream'` |
| `ToolChip.tsx` | `ToolCardShell.tsx` | `import ToolCardShell` | WIRED | L17: `import { ToolCardShell } from './ToolCardShell'`, used L69-82 |
| `ToolChip.tsx` | `useElapsedTime.ts` | `import useElapsedTime` | WIRED | L16: `import { useElapsedTime } from '@/hooks/useElapsedTime'`, called L34 |
| `ToolChip.tsx` | `tool-registry.ts` | `import getToolConfig` | WIRED | L15: `import { getToolConfig } from '@/lib/tool-registry'`, called L30 |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| TOOL-01 | 15-01 | Tool state machine: invoked/executing/resolved/error with CSS data-status | SATISFIED | ToolCardShell data-status attribute, tool-chip-dot CSS classes with pulse/static |
| TOOL-02 | 15-02 | ToolChip: status dot, click expands to ToolCard | SATISFIED | ToolChip renders dot, click toggles ToolCardShell expansion (test L76-97) |
| TOOL-03 | 15-01 | ToolCard via ToolCardShell wrapper with header, elapsed, expand | SATISFIED | ToolCardShell component with full header layout and CSS Grid animation |
| TOOL-04 | 15-01 | Elapsed time counter: 100ms updates, cleanup on resolve/error | SATISFIED | useElapsedTime hook with interval lifecycle, formatElapsed utility |
| TOOL-05 | 15-01 | Error state: force-expanded, red accent, error message | SATISFIED | Error force-expand init + adjust-state-during-rendering, oklch red tint CSS |
| TOOL-06 | 15-02 | registerTool API, ToolCardShell shared wrapper, DefaultToolCard fallback | SATISFIED | getToolConfig returns DefaultToolCard for unknown tools, structured key-value layout |

No orphaned requirements found.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (none) | - | - | - | No TODO/FIXME/placeholder/stub patterns found in any phase files |

### Human Verification Required

### 1. CSS Grid Expand/Collapse Animation

**Test:** Click a ToolChip to expand, observe the card body animating open via CSS Grid 0fr to 1fr transition with spring easing.
**Expected:** Smooth spring-like animation expanding the card body, no layout jank or pop-in.
**Why human:** CSS Grid animation smoothness cannot be verified programmatically; requires visual observation.

### 2. Error State Visual Treatment

**Test:** Trigger a tool call error (rejected status). Observe the chip and card shell.
**Expected:** Red border tint on chip, red border + subtle red background tint on card header, AlertTriangle icon visible, card auto-expanded.
**Why human:** Color rendering and visual prominence of error treatment needs human eye.

### 3. Live Elapsed Time Counter

**Test:** Start a tool call and watch the elapsed time update on the chip and card header.
**Expected:** Timer increments smoothly every ~100ms showing "0.3s", "1.2s", etc. Freezes when tool completes.
**Why human:** Real-time timer behavior and perceived smoothness requires live observation.

---

_Verified: 2026-03-07T21:46:00Z_
_Verifier: Claude (gsd-verifier)_
