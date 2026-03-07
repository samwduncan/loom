# Phase 15: Tool Card Shell + State Machine - Research

**Researched:** 2026-03-07
**Domain:** React component architecture, CSS state-driven animations, timer patterns
**Confidence:** HIGH

## Summary

Phase 15 builds the shared wrapper and state machine for tool card display. The existing codebase already has solid foundations: `ToolChip` with expand/collapse toggle, `tool-chip.css` with status dot colors and pulse animations, `ToolCallState` with `startedAt`/`completedAt` timestamps, and the `ThinkingDisclosure` CSS Grid expand/collapse pattern. The work is primarily component restructuring (inserting `ToolCardShell` between `ToolChip` expansion and `renderCard`), adding elapsed time display via `useRef`+`setInterval`, upgrading `DefaultToolCard` from raw JSON to structured key-value layout, and adding error-state visual treatments.

No new dependencies are needed. Everything builds on existing Lucide icons (`AlertTriangle` available), design tokens (OKLCH colors, motion durations, ease curves), and established CSS patterns (`data-status` attributes, `grid-template-rows` animation, `prefers-reduced-motion`).

**Primary recommendation:** Extract `ToolCardShell` as a wrapper component that owns the expand/collapse animation, consistent header (icon + name + status + timer), and body slot. `ToolChip` delegates to `ToolCardShell` for expanded state instead of directly rendering `CardComponent`. `DefaultToolCard` becomes a body-only component that `ToolCardShell` wraps.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Tool chips stay collapsed after resolve -- user clicks to expand. Error cards force-expanded on first render.
- Expansion allowed anytime, including during active streaming. Scroll anchor keeps position stable.
- Entire chip is the click target for toggle (no separate chevron). Already implemented this way.
- No explicit collapse button in card -- click chip again to collapse.
- Expand/collapse animation: CSS spring approximation via cubic-bezier, combined with CSS Grid `grid-template-rows: 0fr->1fr` (consistent with ThinkingDisclosure). Uses motion tokens. CSS only (Constitution Tier 1). No LazyMotion/framer-motion.
- Timer shown in both chip and card header. Middle dot separator on chip: `Read auth.ts . 1.2s`
- Smart format: sub-second "0.3s", seconds "1.2s", long-running "1m 23s"
- Updates every 100ms via `setInterval` using `startedAt` timestamp from `ToolCallState`
- Timer freezes at final duration on resolve/error -- stays visible as static text
- Timer interval cleaned up on resolve/error/unmount (clearInterval)
- Error cards force-expanded on first render, but user CAN collapse after seeing
- Both chip and card get red treatment: chip gets subtle red border tint + red status dot, card gets `border-error/30` accent + `bg-error/5` tint
- Full error output in scrollable container (max-height ~200px, overflow-y auto). No truncation.
- Lucide `AlertTriangle` icon in card header for error state
- Error text in monospace font, preserving whitespace
- Header: Left side: tool icon + display name. Right side: status dot + status text label + elapsed time. Single compact row.
- No footer. Collapse via chip click. Per-tool cards (Phase 16) add their own "Show more" buttons.
- Card visual: Connected but distinct from chip. Appears directly below with matching border radius, subtle border + `surface-raised` background. Small gap (4px).
- Status indicator: Both colored dot AND text label ("Running", "Completed", "Failed") in card header.
- DefaultToolCard: Structured key-value layout instead of raw JSON dump. Parse tool input into labeled rows. Output in monospace pre block, scrollable. Max-height ~200px scrollable for body.
- Per-tool cards (Phase 16) handle their own truncation -- ToolCardShell imposes no max-height on body.

### Claude's Discretion
- Exact cubic-bezier values for spring approximation
- Status text label wording (e.g., "Running" vs "Executing", "Done" vs "Completed")
- Key-value parsing logic for DefaultToolCard (handling nested objects, arrays)
- Exact gap/padding values within ToolCardShell header
- Timer implementation details (useRef for interval, cleanup patterns)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TOOL-01 | Tool state machine: invoked->executing->resolved/error with CSS data-status visual transitions. GPU-only animations during streaming. | Existing `data-status` pattern in tool-chip.css, ToolCallState type with status field, stream store updateToolCall action |
| TOOL-02 | ToolChip inline pill: tool name, status dot (pulsing executing, static green/red resolved/error), click expands to ToolCard | Existing ToolChip component needs elapsed time added, error styling, ToolCardShell wrapper for expansion |
| TOOL-03 | ToolCard expanded view via ToolCardShell wrapper: consistent header (name, status, elapsed time), body (tool-specific), footer (collapse). Expansion deferred until streaming ends. | New ToolCardShell component, CSS Grid 0fr/1fr pattern from ThinkingDisclosure |
| TOOL-04 | Elapsed time counter on executing tools: 100ms updates using startedAt, "1.2s"/"5.4s" format, cleanup on resolve/error/unmount | useRef+setInterval pattern, formatElapsedTime utility, startedAt/completedAt fields already on ToolCallState |
| TOOL-05 | Error state: expanded card with border-error/30, bg-error/5, error message text, force-expanded | Error tokens in tokens.css (--status-error), existing isError/status fields, Lucide AlertTriangle |
| TOOL-06 | All tool cards register via registerTool(). ToolCardShell provides consistent header/footer/expand. DefaultToolCard as fallback. | Existing registry API, DefaultToolCard upgrade to structured key-value |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19 | Component rendering | Already in project |
| lucide-react | ^0.577.0 | AlertTriangle icon for error state | Already installed, used throughout app |
| CSS custom properties | N/A | Design tokens for colors, timing, spacing | Constitution requirement |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| cn() utility | N/A | Conditional className merging | All component class logic |
| Zustand (stream store) | 5 | Tool call state subscriptions | ToolChipFromStore pattern for live tool state |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| setInterval for timer | rAF loop | setInterval at 100ms is fine for text updates; rAF would be overkill and harder to reason about cleanup |
| CSS Grid 0fr/1fr for expand | max-height animation | max-height requires guessing a value, grid-template-rows is exact and already proven in ThinkingDisclosure |
| Framer Motion for spring | CSS cubic-bezier approximation | Constitution Tier 1 requires CSS-only. Cubic-bezier approximates spring feel without JS runtime |

**Installation:**
```bash
# No new dependencies needed
```

## Architecture Patterns

### Recommended Project Structure
```
src/src/components/chat/tools/
  ToolChip.tsx           # Modified: add elapsed time, error chip styling, delegate expansion to ToolCardShell
  ToolChip.test.tsx      # Modified: update tests for new behavior
  ToolCardShell.tsx      # NEW: shared wrapper with header/body/expand animation
  ToolCardShell.test.tsx  # NEW: tests for shell behavior
  tool-chip.css          # Modified: add error chip border tint, spring animation
  tool-card-shell.css    # NEW: card shell styles, expand animation, error treatment
src/src/lib/
  tool-registry.ts       # Modified: DefaultToolCard upgraded to structured key-value
  format-elapsed.ts      # NEW: elapsed time formatting utility
  format-elapsed.test.ts # NEW: tests for timer formatting
src/src/hooks/
  useElapsedTime.ts      # NEW: hook wrapping setInterval + cleanup for elapsed time
```

### Pattern 1: ToolCardShell Wrapper Architecture
**What:** ToolCardShell receives the tool-specific card component as `children` and provides the consistent outer chrome (header with status, expand/collapse animation, error treatment).
**When to use:** Every tool card expansion, whether DefaultToolCard or per-tool (Phase 16).
**Example:**
```typescript
// ToolChip renders ToolCardShell when expanded
// ToolCardShell receives the card body as children
interface ToolCardShellProps {
  toolCall: ToolCallState;
  config: ToolConfig;
  isExpanded: boolean;
  children: React.ReactNode; // The tool-specific card body
}

// In ToolChip:
<ToolCardShell toolCall={toolCall} config={config} isExpanded={isExpanded}>
  <CardComponent
    toolName={toolCall.toolName}
    input={toolCall.input}
    output={toolCall.output}
    isError={toolCall.isError}
    status={toolCall.status}
  />
</ToolCardShell>
```

### Pattern 2: CSS Grid Expand/Collapse with Spring Easing
**What:** Same pattern as ThinkingDisclosure -- `grid-template-rows: 0fr/1fr` with `overflow: hidden` on inner div. Spring feel via cubic-bezier.
**When to use:** ToolCardShell expand/collapse animation.
**Example:**
```css
.tool-card-shell-body {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--duration-spring) var(--ease-spring);
}

.tool-card-shell-body[data-expanded="true"] {
  grid-template-rows: 1fr;
}

.tool-card-shell-body > div {
  overflow: hidden;
}
```

### Pattern 3: useElapsedTime Hook
**What:** Custom hook that takes `startedAt` and `completedAt` from `ToolCallState`, returns formatted elapsed time string, manages interval lifecycle.
**When to use:** Both ToolChip (inline display) and ToolCardShell header.
**Example:**
```typescript
function useElapsedTime(startedAt: string, completedAt: string | null): string {
  const [elapsed, setElapsed] = useState(() => computeElapsed(startedAt, completedAt));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (completedAt) {
      // Frozen -- compute once, no interval
      setElapsed(computeElapsed(startedAt, completedAt));
      return;
    }
    // Live -- update every 100ms
    intervalRef.current = setInterval(() => {
      setElapsed(computeElapsed(startedAt, null));
    }, 100);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startedAt, completedAt]);

  return elapsed;
}
```

### Pattern 4: Error Force-Expand with User Override
**What:** Error tool calls start expanded (`useState` initialized based on `isError`). User can collapse after seeing. Different from default collapsed behavior.
**When to use:** ToolChip initializes `isExpanded` based on `toolCall.isError && toolCall.status === 'rejected'`.
**Example:**
```typescript
// In ToolChip:
const [isExpanded, setIsExpanded] = useState(
  toolCall.isError && toolCall.status === 'rejected'
);
```

**Important caveat:** Since `useState` initializer only runs on mount, if a tool transitions to error state after mount (streaming scenario), we need the "adjust state during rendering" pattern to force-expand when status changes to `rejected`. Same pattern used in ThinkingDisclosure.

### Anti-Patterns to Avoid
- **Don't use `useEffect` to detect status change for force-expand:** Use the "adjust state during rendering" pattern (track previous status in state, compare in render body). Already proven in ThinkingDisclosure.
- **Don't animate height directly:** Use `grid-template-rows: 0fr/1fr` -- animating height requires knowing the target value, grid doesn't.
- **Don't create separate timer components:** The `useElapsedTime` hook is reusable across chip and card header without component duplication.
- **Don't pass elapsed time as a prop between ToolChip and ToolCardShell:** Both should call `useElapsedTime` independently -- the hook is cheap and it avoids prop threading. Actually, better: ToolChip passes it down since it already has it.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Elapsed time formatting | Custom date math | Dedicated `formatElapsed(ms)` utility | Edge cases: sub-second, minutes, boundary rounding |
| Spring-feel CSS easing | Custom JavaScript animation | `--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)` token | Already defined in tokens.css, proven in EASING.spring from motion.ts |
| Expand/collapse animation | JS height measurement + animate | CSS Grid `grid-template-rows` | Already proven in ThinkingDisclosure, handles dynamic content height automatically |
| Icon rendering | Emoji spans for error icon | Lucide `AlertTriangle` | Consistent with app icon system (AlertCircle used in ErrorMessage, Copy/Check in CodeBlock) |
| Status dot styling | Inline style objects | CSS `data-status` attribute selectors | Already implemented in tool-chip.css for all 4 states |

**Key insight:** The existing codebase has already solved expand/collapse (ThinkingDisclosure), status dot animation (tool-chip.css), and icon patterns (Lucide throughout). This phase is about composition and wiring, not inventing new patterns.

## Common Pitfalls

### Pitfall 1: Timer Leak on Fast Tool Resolution
**What goes wrong:** Tool resolves before the 100ms interval fires, but interval isn't cleaned up because the effect cleanup hasn't run yet.
**Why it happens:** React batches state updates -- the `completedAt` change and effect cleanup may not be synchronous.
**How to avoid:** Always check `completedAt` inside the interval callback. If it's set, clear the interval from within. Belt-and-suspenders with the `useEffect` cleanup.
**Warning signs:** Memory leaks in dev tools, console warnings about setting state on unmounted components.

### Pitfall 2: useState Initializer Only Runs Once
**What goes wrong:** Error force-expand doesn't work for tools that START as `executing` and transition to `rejected` during streaming.
**Why it happens:** `useState(toolCall.isError)` only reads the initial value. Subsequent prop changes don't re-initialize state.
**How to avoid:** Use the "adjust state during rendering" pattern: track `prevStatus` in state, compare with current `toolCall.status` in render body, call `setIsExpanded(true)` when transitioning to `rejected`.
**Warning signs:** Error tool cards staying collapsed during live streaming sessions.

### Pitfall 3: CSS Grid Animation Not Working Without Inner Wrapper
**What goes wrong:** `grid-template-rows: 0fr` collapses to nothing but there's no animation.
**Why it happens:** The direct child of the grid container MUST have `overflow: hidden` for the 0fr->1fr transition to animate smoothly. Without it, content overflows during collapse.
**How to avoid:** Always wrap card body content in a `<div>` with `overflow: hidden` inside the grid container. See ThinkingDisclosure for reference.
**Warning signs:** Content appears/disappears instantly instead of smoothly animating.

### Pitfall 4: DefaultToolCard Key-Value Parsing Edge Cases
**What goes wrong:** Nested objects or arrays in tool input render as `[object Object]` or crash.
**Why it happens:** Simple `Object.entries()` doesn't handle nested values.
**How to avoid:** For nested objects/arrays, fall back to `JSON.stringify(value, null, 2)` in a monospace block. Only flatten the top-level keys as labeled rows.
**Warning signs:** Garbled output in the card body for tools with complex inputs.

### Pitfall 5: GPU-Only Animation Constraint During Streaming
**What goes wrong:** Expand/collapse animation uses `grid-template-rows` which triggers layout, causing jank during active streaming.
**Why it happens:** Constitution 11.4 says GPU-only (opacity, transform) during streaming.
**How to avoid:** The CONTEXT.md says "Expansion deferred until streaming ends" for TOOL-03. But CONTEXT.md also says "Expansion allowed anytime, including during active streaming." These are in tension. The user's CONTEXT.md decisions override requirements. Allow expansion anytime, but note that `grid-template-rows` is a layout animation. In practice, a single tool card expanding won't cause noticeable jank since it's a one-time layout change, not a continuous animation.
**Warning signs:** Frame drops when expanding a tool card during heavy streaming.

## Code Examples

### Elapsed Time Formatting
```typescript
// src/src/lib/format-elapsed.ts
export function formatElapsed(ms: number): string {
  if (ms < 1000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}
```

### useElapsedTime Hook
```typescript
// src/src/hooks/useElapsedTime.ts
import { useState, useEffect, useRef } from 'react';
import { formatElapsed } from '@/lib/format-elapsed';

export function useElapsedTime(
  startedAt: string,
  completedAt: string | null,
): string {
  const compute = () => {
    const start = new Date(startedAt).getTime();
    const end = completedAt ? new Date(completedAt).getTime() : Date.now();
    return formatElapsed(end - start);
  };

  const [display, setDisplay] = useState(compute);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (completedAt) {
      setDisplay(compute());
      return;
    }
    intervalRef.current = setInterval(() => setDisplay(compute()), 100);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startedAt, completedAt]);

  return display;
}
```

### ToolCardShell CSS (error + expand animation)
```css
/* Error chip border tint */
.tool-chip--rejected {
  border-color: oklch(from var(--status-error) l c h / 0.3);
}

/* Card shell expand animation */
.tool-card-shell-body {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--duration-spring) var(--ease-spring);
}

.tool-card-shell-body[data-expanded="true"] {
  grid-template-rows: 1fr;
}

.tool-card-shell-body > div {
  overflow: hidden;
}

/* Error card treatment */
.tool-card-shell[data-status="rejected"] {
  border-color: oklch(from var(--status-error) l c h / 0.3);
  background: oklch(from var(--status-error) l c h / 0.05);
}
```

### Structured DefaultToolCard Body
```typescript
function DefaultToolCardBody({ input, output, isError }: ToolCardProps) {
  const entries = Object.entries(input);
  return (
    <div className="default-tool-card-body">
      <div className="default-tool-card-input">
        {entries.map(([key, value]) => (
          <div key={key} className="default-tool-card-row">
            <span className="default-tool-card-key">{key}:</span>
            <span className="default-tool-card-value">
              {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
            </span>
          </div>
        ))}
      </div>
      {output != null && (
        <div className={cn('default-tool-card-output', isError && 'default-tool-card-output--error')}>
          <pre>{output}</pre>
        </div>
      )}
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Raw JSON dump in DefaultToolCard | Structured key-value rows | This phase | Much better readability for tool inputs |
| Direct `CardComponent` render in ToolChip | ToolCardShell wrapper with consistent chrome | This phase | Uniform header/status across all tool types |
| No elapsed time display | Live 100ms timer with frozen-on-complete | This phase | Users see how long each tool call takes |
| Binary expand (mount/unmount) | CSS Grid animated expand/collapse | This phase | Smooth spring-feel transitions matching ThinkingDisclosure |

## Open Questions

1. **Expansion during streaming vs TOOL-03 wording**
   - What we know: TOOL-03 says "Expansion deferred until streaming ends" but CONTEXT.md user decision says "Expansion allowed anytime, including during active streaming"
   - Recommendation: Follow user decision (CONTEXT.md overrides). Allow expansion anytime. The grid-template-rows animation is a single layout event, not continuous -- acceptable performance impact.

2. **ToolCardShell as always-rendered vs conditional**
   - What we know: Current ToolChip uses `{isExpanded && <CardComponent />}` (conditional mount). The new pattern needs the grid container always rendered for animation.
   - Recommendation: Always render ToolCardShell but use `grid-template-rows: 0fr` for collapsed state. Card body content conditionally rendered or always rendered with overflow:hidden. For performance, render body only when expanded OR transitioning (add a small delay on collapse to let animation complete before unmounting body content).

3. **Status text labels**
   - What we know: User left wording to Claude's discretion
   - Recommendation: "Running" (executing), "Done" (resolved), "Failed" (rejected), "Starting" (invoked). Short, scannable, familiar from IDE tool output.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest + @testing-library/react (jsdom) |
| Config file | src/vite.config.ts (test section) |
| Quick run command | `cd /home/swd/loom/src && npx vitest run --reporter=verbose` |
| Full suite command | `cd /home/swd/loom/src && npx vitest run --coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TOOL-01 | data-status attribute changes with tool state | unit | `cd /home/swd/loom/src && npx vitest run src/components/chat/tools/ToolChip.test.tsx -x` | Exists (needs update) |
| TOOL-02 | ToolChip displays status dot, elapsed time, click expands | unit | `cd /home/swd/loom/src && npx vitest run src/components/chat/tools/ToolChip.test.tsx -x` | Exists (needs update) |
| TOOL-03 | ToolCardShell renders header, body, expand animation | unit | `cd /home/swd/loom/src && npx vitest run src/components/chat/tools/ToolCardShell.test.tsx -x` | Wave 0 |
| TOOL-04 | Elapsed time formats correctly, interval cleanup | unit | `cd /home/swd/loom/src && npx vitest run src/lib/format-elapsed.test.ts -x` | Wave 0 |
| TOOL-05 | Error cards force-expanded, red treatment, AlertTriangle | unit | `cd /home/swd/loom/src && npx vitest run src/components/chat/tools/ToolCardShell.test.tsx -x` | Wave 0 |
| TOOL-06 | DefaultToolCard renders structured key-value layout | unit | `cd /home/swd/loom/src && npx vitest run src/components/chat/tools/ToolChip.test.tsx -x` | Exists (needs update) |

### Sampling Rate
- **Per task commit:** `cd /home/swd/loom/src && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd /home/swd/loom/src && npx vitest run --coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/src/components/chat/tools/ToolCardShell.test.tsx` -- covers TOOL-03, TOOL-05
- [ ] `src/src/lib/format-elapsed.test.ts` -- covers TOOL-04
- [ ] Update `src/src/components/chat/tools/ToolChip.test.tsx` -- covers TOOL-01, TOOL-02, TOOL-06 updates

## Sources

### Primary (HIGH confidence)
- Existing codebase: ToolChip.tsx, tool-chip.css, tool-registry.ts, stream.ts types, ThinkingDisclosure.tsx, motion.ts, stream store
- tokens.css -- all design tokens referenced
- AssistantMessage.tsx, ActiveMessage.tsx -- integration points for tool call rendering

### Secondary (MEDIUM confidence)
- CSS Grid `grid-template-rows` animation pattern -- well-documented, proven in ThinkingDisclosure in this codebase
- `prefers-reduced-motion` support -- already implemented in tool-chip.css

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, everything already in project
- Architecture: HIGH -- building on proven patterns (ThinkingDisclosure, tool-chip.css, stream store)
- Pitfalls: HIGH -- identified from direct codebase analysis and React patterns already used in project

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (stable domain, no external dependencies)
