# Phase 17: Tool Grouping + Permissions - Context

**Gathered:** 2026-03-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Consecutive tool calls (3+) collapse into manageable accordion groups with real-time grouping during streaming and auto-collapse on completion. Permission requests from the backend render as actionable inline banners above the composer with tool-aware previews, countdown timer, and Allow/Deny interaction. Tool grouping covers TOOL-20 through TOOL-23. Permission banners cover PERM-01 through PERM-05.

</domain>

<decisions>
## Implementation Decisions

### Group collapse behavior
- 3+ consecutive tool calls trigger grouping (not 2 — two side-by-side is common enough to show inline)
- Collapsed header shows count + inline mini-chips with tool names only: "5 tool calls [Read] [Read] [Edit] [Bash] [Bash]"
- Auto-collapse when all tools in the group resolve
- Group in real-time during streaming — header updates live as new tool calls arrive ("3 tool calls" → "4 tool calls")
- Historical groups (loaded from backend) always start collapsed
- Error tool calls are extracted from the group and displayed separately below it — group collapses normally for non-error tools

### Group visual boundary
- Subtle container always visible: thin border + `bg-surface-1` tinted background for the group wrapper
- Container present in both collapsed and expanded states
- Makes groups visually distinct from surrounding assistant message text

### Group expand interaction
- Two-level expand: group → individual ToolChips → individual ToolCards
- Expanding a group reveals all ToolChips in their normal inline form (collapsed chips with key argument + elapsed time)
- Individual chips expand their cards inline, pushing sibling chips down (normal flow, consistent with standalone ToolChips)
- "Expand all" button in group header when group is expanded, to expand all cards at once
- Expand/collapse animation uses CSS Grid `grid-template-rows: 0fr/1fr` (consistent with ToolCardShell, ThinkingDisclosure)

### Permission banner design
- Renders directly above the composer, pushes chat content up (not floating/overlay)
- Part of the CSS Grid layout: `grid-template-rows: 1fr auto auto` (messages, permission banner, composer)
- Tool-aware input preview: each tool type shows its most relevant field (Bash→command, Edit→file path + old/new snippet, Write→file path, Read→file path, Glob/Grep→pattern)
- Input preview truncated to first ~100 chars
- Slide up + fade in entrance animation (~200ms), slide down + fade out on dismiss
- Allow button: solid green/success accent background (dominant, encourages flow)
- Deny button: ghost/outline style (secondary)
- Only one permission banner at a time (backend enforces sequential requests; new request replaces old)
- Auto-dismisses on `claude-permission-cancelled` WebSocket event
- Auto-dismisses on timeout (55s default from `CLAUDE_TOOL_APPROVAL_TIMEOUT_MS`)

### Countdown timer
- Small (24px) circular SVG progress ring that depletes clockwise
- Seconds number displayed centered inside the ring
- Ring uses primary/neutral color, no color change during countdown
- Subtle pulse animation in the last 10 seconds for urgency (no color shift)
- Updates every second (1s interval, not 100ms — seconds granularity sufficient)

### Keyboard shortcuts for permissions
- Y key = Allow, N key = Deny
- Only active when permission banner is visible AND composer textarea does not have focus
- Prevents accidental grants while typing in the composer

### Claude's Discretion
- Exact CSS Grid animation timing for group expand/collapse
- Permission banner internal layout (flex vs grid for tool name / preview / buttons / timer arrangement)
- SVG ring implementation details (stroke-dasharray/dashoffset technique)
- Whether extracted error chips get any special grouping annotation (e.g., "from group above")
- Mini-chip styling in collapsed header (reuse ToolChip mini variant or new lightweight component)
- Exact slide-up animation distance and easing curve

</decisions>

<specifics>
## Specific Ideas

- The collapsed group should feel like a "summary receipt" — scannable at a glance, expandable when you need details
- Permission banners should feel urgent but not alarming — the Allow bias means most interactions are a quick "yes"
- The countdown ring with seconds inside is inspired by iOS timer widgets — compact but immediately readable
- Error extraction from groups means errors are NEVER hidden — they sit below the collapsed group as standalone force-expanded cards, impossible to miss

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ToolChip` (src/src/components/chat/tools/ToolChip.tsx): Existing expand/collapse with status dot, elapsed time. Will be rendered inside groups.
- `ToolCardShell` (src/src/components/chat/tools/ToolCardShell.tsx): CSS Grid expand animation, error force-expand. Group wraps multiple of these.
- `tool-chip.css` (src/src/components/chat/tools/tool-chip.css): Status dot colors, pulse animation, reduced-motion support. Group may need new styles.
- `ThinkingDisclosure` (src/src/components/chat/view/ThinkingDisclosure.tsx): CSS Grid 0fr/1fr animation reference. Group collapse uses same pattern.
- `tool-registry.ts` (src/src/lib/tool-registry.ts): `ToolConfig` with `displayName`, `icon`, `renderCard`. Group header can pull display names and icons from registry.
- `stream-multiplexer.ts` (src/src/lib/stream-multiplexer.ts): Currently auto-allows all permissions — needs modification to surface permission requests to UI instead.

### Established Patterns
- CSS Grid `grid-template-rows: 0fr/1fr` for expand/collapse (ToolCardShell, ThinkingDisclosure)
- `data-status` attribute for CSS-driven state styling
- `cn()` for conditional Tailwind classes
- `memo()` wrapping for performance
- Selector-only Zustand subscriptions
- `prefers-reduced-motion` for animation opt-out

### Integration Points
- **Tool grouping**: Operates at the message rendering layer — `AssistantMessage.tsx` currently injects tool markers into markdown, `MarkdownRenderer` replaces markers with ToolChip components. Grouping needs to intercept consecutive tool markers and wrap them in a `ToolCallGroup` component.
- **Permission banners**: `stream-multiplexer.ts` must stop auto-allowing and instead surface `claude-permission-request` to a new Zustand store slice (or dedicated store). `ChatView.tsx` renders the banner based on this state. Banner sends `claude-permission-response` via the WebSocket `sendFn`.
- **Composer grid**: Currently `grid-template-rows: 1fr auto` (messages, composer). Permission banner adds a third row: `1fr auto auto`.

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 17-tool-grouping-permissions*
*Context gathered: 2026-03-08*
