# Phase 15: Tool Call Display - Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Tool call invocations become compact, scannable action pills with clear running/complete/failed states. Sequential calls group into manageable accordions. This phase refines the existing ToolActionCard and ToolCallGroup components into polished pill-style UI with state animations and semantic colors.

</domain>

<decisions>
## Implementation Decisions

### Pill visual style
- Rounded pill shape (full border-radius), not the current rectangular card — modern tag/badge aesthetic
- Info density: icon + tool name + key argument (current pattern preserved)
- Category color tints retained (blue for edit, purple for search, green for bash, etc.)
- Expand behavior: inline below the pill with existing CSS grid animation pattern

### Running state animation
- Pulsing dusty rose left border (2px) that animates between transparent and `--rose-accent`
- Mirrors the existing error left-border pattern but with pulse animation
- No elapsed time counter — pulsing indicator only
- Smooth color transition (~300ms) when state changes: rose pulse fades → green border (success) or red border (error)

### State color scheme
- **Running:** Pulsing dusty rose left border + no status icon (pulse is the indicator)
- **Complete:** Muted green left border + green CheckCircle2 icon (current pattern)
- **Failed:** Red left border + red XCircle icon + auto-expand to show error content
- Double signal: both left border color AND status icon convey state
- Failed pills auto-expand by default — errors need immediate attention
- Completed pills collapsed by default — click to expand input/result

### Accordion grouping
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

</decisions>

<specifics>
## Specific Ideas

- Pill shape should feel like tags in Linear or GitHub — clean, compact, modern
- The left-border-as-state-indicator is the primary visual pattern (running=rose pulse, complete=green, error=red)
- Current ToolActionCard structure is the foundation — this phase refines visual treatment, not architecture

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ToolActionCard` (src/components/chat/view/subcomponents/ToolActionCard.tsx): Main pill component — already has compact layout, chevron expand, category icons, CSS grid animation. Needs visual refinement + running state.
- `ToolCallGroup` (src/components/chat/view/subcomponents/ToolCallGroup.tsx): Already groups 3+ calls with summary header + expand all. Needs pill-style header + count badge.
- `groupConsecutiveToolCalls` (src/components/chat/utils/groupConsecutiveToolCalls.ts): Grouping logic already at 3+ threshold — no changes needed.
- `toolConfigs` (src/components/chat/tools/configs/toolConfigs.ts): Per-tool display config with icon, colorScheme, getValue. Provides the data for pill content.
- `getToolCategory` (src/components/chat/tools/ToolRenderer.tsx): Category classification (edit, search, bash, todo, task, agent, plan, question). Drives icon and color selection.

### Established Patterns
- CSS grid `0fr`/`1fr` animation for expand/collapse (used in both ToolActionCard and ToolCallGroup)
- Dusty rose tokens available: `--rose-accent` (4 54.7% 62.7%), `--accent`, `--ring`
- Error state uses `border-l-2 border-red-500` on ToolActionCard — running state should mirror this with rose
- Category background tints via `categoryBg` map in ToolActionCard
- Status icons: CheckCircle2 (green-500) for success, XCircle (red-500) for error — from lucide-react

### Integration Points
- `TurnBlock` and `MessageComponent` consume grouped tool calls — rendering logic flows through these
- `useChatRealtimeHandlers` provides the streaming state that determines if a tool is "running"
- Tool state (running vs complete) likely determined by presence/absence of `toolResult`

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 15-tool-call-display*
*Context gathered: 2026-03-03*
