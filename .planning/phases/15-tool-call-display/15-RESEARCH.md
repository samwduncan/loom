# Phase 15: Tool Call Display - Research

**Researched:** 2026-03-03
**Domain:** React component visual refinement, CSS animations, state-driven UI
**Confidence:** HIGH

## Summary

Phase 15 transforms existing tool call components from rectangular cards into compact pill-shaped action indicators with clear state differentiation through left-border color and pulse animation. The codebase already has all the architectural foundations: `ToolActionCard` handles individual tool display with icon + name + key argument + expand/collapse via CSS grid 0fr/1fr animation; `ToolCallGroup` handles 3+ consecutive grouping with summary headers; and `groupConsecutiveToolCalls` implements the threshold logic. This phase is purely visual refinement, not architectural.

The key technical additions are: (1) a CSS `@keyframes` pulse animation for the running state's dusty rose border, (2) state-driven styling based on the presence/absence of `toolResult`, and (3) pill-shaped group headers with count badges. All CSS variable tokens needed (`--rose-accent`, `--accent`, status colors) already exist from Phase 10.

**Primary recommendation:** Refine `ToolActionCard` styling to pill shape with state-driven left borders and running pulse animation, then update `ToolCallGroup` header to match pill aesthetic with count badge. No new libraries or architectural changes needed.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Rounded pill shape (full border-radius), not the current rectangular card — modern tag/badge aesthetic
- Info density: icon + tool name + key argument (current pattern preserved)
- Category color tints retained (blue for edit, purple for search, green for bash, etc.)
- Expand behavior: inline below the pill with existing CSS grid animation pattern
- Pulsing dusty rose left border (2px) that animates between transparent and `--rose-accent`
- Mirrors the existing error left-border pattern but with pulse animation
- No elapsed time counter — pulsing indicator only
- Smooth color transition (~300ms) when state changes: rose pulse fades → green border (success) or red border (error)
- **Running:** Pulsing dusty rose left border + no status icon (pulse is the indicator)
- **Complete:** Muted green left border + green CheckCircle2 icon (current pattern)
- **Failed:** Red left border + red XCircle icon + auto-expand to show error content
- Double signal: both left border color AND status icon convey state
- Failed pills auto-expand by default — errors need immediate attention
- Completed pills collapsed by default — click to expand input/result
- Group header becomes pill-styled with count badge (e.g. "▶ Tool Calls [5]")
- Grouping threshold stays at 3+ consecutive tool calls
- Error count badge on group header in red (e.g. "[2 failed]") when group contains failures
- Groups with errors auto-expand, and failed pills within auto-expand too
- Groups with running tools stay expanded until all tools complete, then collapse

### Claude's Discretion
- Exact pulse animation timing and easing
- Category icon refinements if needed
- Spacing and typography tuning within the pill design
- Transition timing details for state changes
- Internal expand/collapse animation refinements

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TOOL-01 | Tool call invocations display as compact action pills -- icon + tool name + semantic state color | Pill shape via `rounded-full`, left border color driven by state, existing `categoryIcons` and `categoryBg` maps |
| TOOL-02 | Running tool calls show pulsing dusty rose indicator | CSS `@keyframes` pulse on `border-left-color`, `--rose-accent` token available, running state = `toolResult == null` |
| TOOL-03 | Completed tool calls collapse to minimal chip with success state | Green left border + CheckCircle2 icon (already exists), collapsed by default (already the default behavior) |
| TOOL-04 | Failed tool calls expand with muted red background and error message visible | Red left border + XCircle (exists), auto-expand via `useState(true)` when `isError`, red bg already in expanded result pane |
| TOOL-05 | 3+ sequential tool calls group into accordion with count badge | `ToolCallGroup` already groups at 3+ threshold, needs pill-styled header with `[N]` count badge + `[X failed]` error badge |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.x | Component framework | Already in project |
| Tailwind CSS | 4.x | Utility-first styling | Already in project |
| lucide-react | latest | Icon library | Already provides CheckCircle2, XCircle, ChevronRight |

### Supporting
No new libraries needed. All required functionality is achievable with existing CSS and React.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS @keyframes pulse | framer-motion | Overkill for a single border pulse — CSS is simpler, zero bundle cost |
| Manual state detection | useEffect with timer | Unnecessary — `toolResult == null` already indicates running state |

**Installation:** None needed — all dependencies already present.

## Architecture Patterns

### Existing Component Structure (no changes)
```
src/components/chat/
├── view/subcomponents/
│   ├── ToolActionCard.tsx      # Individual pill (MODIFY)
│   ├── ToolCallGroup.tsx       # Group accordion (MODIFY)
│   ├── TurnBlock.tsx           # Consumes grouped items
│   └── MessageComponent.tsx    # Individual message rendering
├── utils/
│   └── groupConsecutiveToolCalls.ts  # Grouping logic (NO CHANGES)
└── tools/
    ├── configs/toolConfigs.ts  # Per-tool display config (NO CHANGES)
    └── ToolRenderer.tsx        # Category classification (NO CHANGES)
```

### Pattern 1: State-Driven Left Border
**What:** Use the presence/absence of `toolResult` to determine the tool's running state, then apply different left-border styles.
**When to use:** Every ToolActionCard render.
**Example:**
```typescript
// In ToolActionCard
const isRunning = !toolResult;  // null/undefined means still executing
const isError = toolResult?.isError === true;
const isSuccess = toolResult != null && !isError;

// Border class
const borderClass = isRunning
  ? 'border-l-2 animate-tool-pulse'  // pulsing rose
  : isError
    ? 'border-l-2 border-red-500'     // solid red (existing)
    : isSuccess
      ? 'border-l-2 border-green-500'  // solid green
      : '';
```

### Pattern 2: CSS Keyframe Pulse Animation
**What:** A `@keyframes` animation that pulses the left border between transparent and dusty rose.
**When to use:** Applied to tool cards in running state.
**Example:**
```css
@keyframes tool-pulse {
  0%, 100% { border-left-color: transparent; }
  50% { border-left-color: hsl(var(--rose-accent)); }
}

.animate-tool-pulse {
  border-left-color: hsl(var(--rose-accent));
  animation: tool-pulse 1.5s ease-in-out infinite;
}
```

### Pattern 3: Auto-Expand on Error
**What:** Failed tool calls start expanded by default so errors are immediately visible.
**When to use:** When `toolResult?.isError` is true on initial render.
**Example:**
```typescript
// Initialize expand state based on error
const [isExpanded, setIsExpanded] = useState(
  toolResult?.isError === true
);
```

### Pattern 4: Group State Awareness
**What:** ToolCallGroup detects whether any child tools are running or have errors and adjusts its default expand state accordingly.
**When to use:** When rendering a grouped accordion.
**Example:**
```typescript
const hasRunning = messages.some(m => !m.toolResult);
const hasErrors = messages.some(m => m.toolResult?.isError);
// Auto-expand when running or has errors
const defaultExpanded = hasRunning || hasErrors;
```

### Anti-Patterns to Avoid
- **Timer-based running state:** Don't use setTimeout/setInterval to track running state. The reactive `toolResult == null` check is sufficient and updates automatically when the WebSocket delivers results.
- **Inline styles for animation:** Use CSS `@keyframes` in index.css, not inline `style` objects. Tailwind can reference the animation class.
- **State transition effects in JS:** Don't manage border color transitions in JavaScript. CSS `transition: border-color 300ms` handles the smooth state change natively.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Pulse animation | JS setInterval to toggle border | CSS @keyframes | Smoother, no re-renders, GPU-accelerated |
| Running state detection | WebSocket event tracking | `toolResult == null` check | Already reactive, simpler |
| Pill shape | Custom border-radius values | `rounded-full` Tailwind utility | Standard, consistent |
| State transition | Manual className toggling with delays | CSS `transition: border-color 300ms ease` | Native, no timer management |

**Key insight:** All visual refinements in this phase are CSS-only. The existing React component structure and data flow are sound — we're changing how things look, not how they work.

## Common Pitfalls

### Pitfall 1: useState Initial Value for Auto-Expand
**What goes wrong:** Setting `useState(toolResult?.isError)` captures the initial value, but if the component mounts before `toolResult` arrives (during streaming), the state won't update when the error result arrives.
**Why it happens:** React `useState` initial value only applies on mount.
**How to avoid:** Use `useEffect` to update expand state when `toolResult` changes from null to an error state. Or derive expand state from props using `useMemo` and control the component differently.
**Warning signs:** Error tool calls appearing collapsed, requiring manual expand.

### Pitfall 2: CSS Transition Conflict with Animation
**What goes wrong:** Applying both `transition: border-color` and `animation: tool-pulse` on the same element causes conflicts. The animation overrides the transition.
**Why it happens:** CSS animations take priority over transitions for the same property.
**How to avoid:** Remove the animation class BEFORE the state changes, let the transition handle the color change. Use `animation: none` + `transition: border-color 300ms` for the non-running states.
**Warning signs:** Abrupt color jump when tool completes instead of smooth transition.

### Pitfall 3: Group Auto-Collapse Timing
**What goes wrong:** Group with running tools should stay expanded until all complete, then auto-collapse. If collapse happens while the last tool result is still animating in, it looks janky.
**Why it happens:** React state update (all tools complete → collapse) happens before CSS animation finishes.
**How to avoid:** Add a small delay (300-500ms) after the last tool completes before collapsing, or use `onTransitionEnd` to sync.
**Warning signs:** Group visually snapping closed while the last tool's state color is still transitioning.

### Pitfall 4: Pill Border-Radius with Left Border
**What goes wrong:** `rounded-full` with `border-l-2` can look odd at small sizes because the left border has squared ends at the rounded corners.
**Why it happens:** CSS border-left doesn't round with border-radius by default — it only clips if the element is actually round.
**How to avoid:** Either use a slightly less aggressive rounding (e.g., `rounded-xl` = 12px) or use a pseudo-element `::before` for the left indicator instead of a real border. Test at actual component size.
**Warning signs:** Visual artifact at the top-left and bottom-left corners of the pill.

## Code Examples

### Example 1: Pulse Keyframes (CSS)
```css
/* In src/index.css */
@keyframes tool-pulse {
  0%, 100% {
    border-left-color: transparent;
  }
  50% {
    border-left-color: hsl(var(--rose-accent));
  }
}
```

### Example 2: ToolActionCard State Classes
```typescript
// Derive state
const isRunning = !toolResult;
const isError = toolResult?.isError === true;
const isSuccess = !!toolResult && !isError;

// Border and animation classes
const stateClasses = isRunning
  ? 'border-l-2 border-transparent animate-[tool-pulse_1.5s_ease-in-out_infinite]'
  : isError
    ? 'border-l-2 border-red-500 transition-[border-color] duration-300'
    : isSuccess
      ? 'border-l-2 border-green-500/60 transition-[border-color] duration-300'
      : '';
```

### Example 3: Count Badge in Group Header
```tsx
<span className="text-xs font-medium text-muted-foreground">
  Tool Calls
</span>
<span className="text-[10px] bg-muted/30 text-muted-foreground rounded-full px-1.5 py-0.5 font-mono">
  {messages.length}
</span>
{errorCount > 0 && (
  <span className="text-[10px] bg-red-500/15 text-red-400 rounded-full px-1.5 py-0.5 font-mono">
    {errorCount} failed
  </span>
)}
```

### Example 4: Auto-Expand Error Effect
```typescript
// Sync expand state with error results
useEffect(() => {
  if (toolResult?.isError && !isExpanded) {
    setIsExpanded(true);
  }
}, [toolResult?.isError]);
```

## Project Tooling

| Tool | Command | Detected From |
|------|---------|---------------|
| Lint | Not detected | - |
| Type Check | `npm run typecheck` | .planning/config.json |
| Build | `npm run build` | .planning/config.json |
| Test | Not detected | - |

*Already written to `.planning/config.json` under `tooling` key.*

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Verbose tool call blocks | Compact card with expand | v1.0 (Phase 5-6) | Already done — this phase refines further |
| No running state indicator | Border color + pulse animation | This phase (15) | Clear visual feedback for async operations |
| Rectangular cards | Pill shape | This phase (15) | Modern tag/badge aesthetic |

## Open Questions

1. **Pill vs rounded-xl radius**
   - What we know: `rounded-full` gives full pill shape, but with `border-l-2` the corners may not look clean at 28-32px height
   - What's unclear: Whether `rounded-full` or `rounded-xl` (12px) looks better at the actual component height
   - Recommendation: Start with `rounded-full`, test visually, fall back to `rounded-xl` if corner artifacts appear. This is Claude's Discretion territory.

2. **Group auto-collapse delay**
   - What we know: Groups should collapse when all tools complete, but immediate collapse may feel abrupt
   - What's unclear: Optimal delay before auto-collapse
   - Recommendation: Use 500ms delay via `setTimeout` after detecting all-complete state. Can tune during implementation.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `ToolActionCard.tsx`, `ToolCallGroup.tsx`, `groupConsecutiveToolCalls.ts` — direct inspection of existing component structure
- Codebase analysis: `index.css` — verified all CSS variable tokens available (`--rose-accent`, `--accent`, status colors, surface tokens)
- Codebase analysis: `toolConfigs.ts` — per-tool display configuration, category system
- Codebase analysis: `useChatRealtimeHandlers.ts` — confirmed `toolResult: null` is set during tool execution

### Secondary (MEDIUM confidence)
- CSS Animations spec: `@keyframes` for border-color pulse is well-supported, no vendor prefixes needed in modern browsers
- Tailwind arbitrary animation values: `animate-[name_duration_timing_iteration]` syntax works in Tailwind 4

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new dependencies needed, all existing
- Architecture: HIGH - purely visual refinement on existing component structure
- Pitfalls: HIGH - identified from direct codebase analysis of existing patterns

**Research date:** 2026-03-03
**Valid until:** 2026-04-03 (stable — no external dependencies to version-drift)
