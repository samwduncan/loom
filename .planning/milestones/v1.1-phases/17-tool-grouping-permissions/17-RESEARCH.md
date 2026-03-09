# Phase 17: Tool Grouping + Permissions - Research

**Researched:** 2026-03-08
**Domain:** React component architecture, CSS Grid animation, WebSocket event handling
**Confidence:** HIGH

## Summary

This phase adds two distinct features to the chat interface: (1) collapsible tool call groups that condense consecutive tool calls into a scannable accordion, and (2) permission request banners that surface backend permission prompts as inline UI above the composer.

Both features are well-scoped with clear integration points. Tool grouping operates at the message rendering layer -- intercepting consecutive tool markers in `AssistantMessage` (historical) and consecutive `ToolChipFromStore` components in `ActiveMessage` (streaming). Permission banners require modifying the stream multiplexer to stop auto-allowing and instead populate a new `activePermissionRequest` field in the stream store, then rendering a banner component in `ChatView`'s CSS Grid layout.

The codebase already has all the CSS Grid animation patterns needed (ToolCardShell, ThinkingDisclosure), the WebSocket protocol types are fully defined (`claude-permission-request`, `claude-permission-cancelled`, `claude-permission-response`), and the multiplexer already has an `onPermissionRequest` callback wired (currently a no-op in websocket-init.ts).

**Primary recommendation:** Split into 3 plans -- (1) Tool grouping logic + ToolCallGroup component for historical messages, (2) Streaming tool grouping in ActiveMessage, (3) Permission banner with countdown timer and keyboard shortcuts.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- >= 2 consecutive tool calls trigger grouping (not 3+)
- When 2nd consecutive tool arrives, retroactively wrap both into a group within a single render cycle (no flicker/snap)
- Collapsed header: count + inline mini-chips with tool names only: "5 tool calls [Read] [Read] [Edit] [Bash] [Bash]"
- Auto-collapse when all tools in group resolve
- Group in real-time during streaming -- group container established on 2nd tool, header updates live
- Historical groups always start collapsed
- Error tool calls extracted from group and displayed separately below it
- Subtle container always visible: thin border + bg-surface-1 tinted background
- Two-level expand: group -> individual ToolChips -> individual ToolCards
- "Expand all" button in group header when group is expanded
- Expand/collapse uses CSS Grid grid-template-rows: 0fr/1fr (consistent with ToolCardShell, ThinkingDisclosure)
- Permission banner renders directly above composer, pushes chat content up (not floating/overlay)
- Part of CSS Grid layout: grid-template-rows: 1fr auto auto (messages, permission banner, composer)
- Tool-aware input preview: each tool type shows its most relevant field
- Input preview truncated to first ~100 chars
- Slide up + fade in entrance animation (~200ms), slide down + fade out on dismiss
- Allow button: solid green/success accent background. Deny button: ghost/outline style
- Only one permission banner at a time
- Permission request is session-scoped: activePermissionRequest includes sessionId
- Auto-dismisses on claude-permission-cancelled WebSocket event
- Auto-dismisses on timeout (55s default from CLAUDE_TOOL_APPROVAL_TIMEOUT_MS)
- Countdown: 24px circular SVG progress ring, depletes clockwise, seconds centered inside
- Ring uses primary/neutral color, no color change during countdown
- Subtle pulse in last 10 seconds (no color shift)
- Updates every second (1s interval)
- Y key = Allow, N key = Deny
- Only active when banner visible AND no focusable element has focus (check document.activeElement against textarea, input, contenteditable)

### Claude's Discretion
- Exact CSS Grid animation timing for group expand/collapse
- Permission banner internal layout (flex vs grid for arrangement)
- SVG ring implementation details (stroke-dasharray/dashoffset technique)
- Whether extracted error chips get any special grouping annotation
- Mini-chip styling in collapsed header (reuse ToolChip mini variant or new lightweight component)
- Exact slide-up animation distance and easing curve

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TOOL-20 | Consecutive tool calls (>=2) group into collapsible accordion with count + tool type summary | Tool grouping component with CSS Grid animation, mini-chip header, group detection logic |
| TOOL-21 | Accordion expand/collapse uses CSS Grid grid-template-rows: 0fr/1fr animation | Reuse exact pattern from ToolCardShell and ThinkingDisclosure CSS |
| TOOL-22 | Error tool calls within group always force-expanded (never hidden in collapsed state) | Error extraction during grouping -- separate error tools from group, render below |
| TOOL-23 | Individual tool chips within group clickable to expand their specific card | Two-level expand: group reveals ToolChips, each ToolChip expands its ToolCard independently |
| PERM-01 | Permission requests render as inline banners above composer with tool name, input preview, Allow/Deny | New PermissionBanner component in ChatView CSS Grid third row, tool-aware preview |
| PERM-02 | Allow/Deny sends claude-permission-response via WebSocket, banner dismissed | Modify multiplexer to stop auto-allow, wire banner callbacks to wsClient.send |
| PERM-03 | Countdown timer with circular progress (55s default), auto-dismiss on timeout | SVG ring component with stroke-dasharray/dashoffset, 1s interval, pulse in last 10s |
| PERM-04 | Auto-dismiss on claude-permission-cancelled WebSocket event | Wire multiplexer's claude-permission-cancelled case to clear store |
| PERM-05 | Only one permission banner at a time, new request replaces old | Single activePermissionRequest in stream store, replacement on new request |
</phase_requirements>

## Architecture Patterns

### Tool Grouping: Where It Lives

**Historical messages (AssistantMessage):** The current flow is:
1. `injectToolMarkers()` appends `\x00TOOL:id\x00` markers to content
2. `MarkdownRenderer` renders markdown, `rehypeToolMarkers` converts markers to `<tool-marker>` elements
3. `tool-marker` component override renders `ToolChip` for each

Grouping for historical messages needs to happen BEFORE markers are injected into markdown, or as a post-processing step on the tool call array. The cleanest approach: detect consecutive runs in the `toolCalls` array, partition them into groups vs singles, then render groups as `ToolCallGroup` components and singles as individual markers.

**Key insight:** Tool markers in historical messages are always appended at the end of content (see `injectToolMarkers` -- markers go after `content.trimEnd()`). This means all tool calls are rendered sequentially after the text content. Grouping is a simple linear scan of the tool calls array.

**Streaming messages (ActiveMessage):** The current flow is:
1. `useStreamStore.activeToolCalls` grows as tools arrive
2. `ActiveMessage` detects new tools via "adjust state during rendering" pattern
3. New segments (`type: 'tool'` + `type: 'text'`) are appended to the segments array
4. `ToolChipFromStore` renders each tool call

Grouping during streaming: instead of emitting individual tool segments, detect when 2+ consecutive tools appear (no text content between them) and wrap them in a group segment. The group container renders immediately when the 2nd tool arrives, retroactively including the 1st.

### Recommended Component Structure

```
src/src/components/chat/tools/
  ToolCallGroup.tsx          -- Group wrapper: collapsed header + expandable body
  ToolCallGroup.css          -- Group container styles, mini-chip styles
  PermissionBanner.tsx       -- Inline banner above composer
  PermissionBanner.css       -- Banner styles, slide animation
  CountdownRing.tsx          -- SVG circular countdown timer
```

### Pattern 1: Tool Call Grouping Algorithm

**What:** Partition an array of tool calls into groups (>=2 consecutive) and singles.

**For historical messages:**
```typescript
interface ToolGroup {
  type: 'group';
  tools: ToolCallState[];     // non-error tools
  errors: ToolCallState[];    // error tools extracted from group
}

interface ToolSingle {
  type: 'single';
  tool: ToolCallState;
}

type ToolPartition = ToolGroup | ToolSingle;

function partitionToolCalls(toolCalls: ToolCallState[]): ToolPartition[] {
  // Linear scan: consecutive non-error tools form groups
  // Error tools within a consecutive run are extracted
  // Single tools (not part of a consecutive run) render standalone
  const result: ToolPartition[] = [];
  let currentRun: ToolCallState[] = [];

  for (const tc of toolCalls) {
    currentRun.push(tc);
  }

  // All tool calls from historical messages are consecutive
  // (they're appended after text content), so a single partition call works
  if (currentRun.length >= 2) {
    const errors = currentRun.filter(tc => tc.isError);
    const nonErrors = currentRun.filter(tc => !tc.isError);
    if (nonErrors.length >= 2) {
      result.push({ type: 'group', tools: nonErrors, errors });
    } else {
      // Not enough non-errors for a group, render all as singles
      for (const tc of currentRun) {
        result.push({ type: 'single', tool: tc });
      }
    }
  } else {
    for (const tc of currentRun) {
      result.push({ type: 'single', tool: tc });
    }
  }

  return result;
}
```

**For streaming messages:** The grouping logic must be reactive. When the 2nd consecutive tool arrives in `ActiveMessage`, the segments array is restructured:
- Before: `[text, tool-A, text(empty), tool-B, text]`
- After: `[text, group(tool-A, tool-B), text]`

The `ActiveMessage` "adjust state during rendering" block already detects new tool calls. Add logic to check if the previous segment was also a tool (or a group), and if so, merge into a group.

### Pattern 2: ToolCallGroup Component

**What:** Collapsible group container with two-level expand.

```typescript
interface ToolCallGroupProps {
  tools: ToolCallState[];       // non-error tools in the group
  errors: ToolCallState[];      // error tools extracted from group
  defaultExpanded?: boolean;    // false for historical, true for streaming
}
```

State machine:
- `collapsed`: Shows header "N tool calls [Read] [Edit] [Bash]" with count and mini-chips
- `expanded`: Reveals all ToolChips in their normal inline form
- Individual ToolChips manage their own expand/collapse independently

### Pattern 3: Permission Banner Store Integration

**What:** Stream store gets a new `activePermissionRequest` field. Multiplexer stops auto-allowing.

**Stream store addition:**
```typescript
interface PermissionRequest {
  requestId: string;
  toolName: string;
  input: unknown;
  sessionId: string | null;
  receivedAt: number;  // Date.now() for countdown
}

// New fields in StreamState:
activePermissionRequest: PermissionRequest | null;
setPermissionRequest: (request: PermissionRequest | null) => void;
```

**Multiplexer changes (stream-multiplexer.ts):**
- Remove the auto-allow in `claude-permission-request` case
- Route to `onPermissionRequest` callback (already exists)
- Handle `claude-permission-cancelled` by clearing the store

**websocket-init.ts changes:**
- Wire `onPermissionRequest` to set `activePermissionRequest` in stream store
- Add handler for `claude-permission-cancelled` to clear `activePermissionRequest`

### Pattern 4: CSS Grid Layout for Permission Banner

**Current ChatView grid:**
```css
grid-template-rows: 1fr auto
/* [messages] [composer] */
```

**With permission banner:**
```css
grid-template-rows: 1fr auto auto
/* [messages] [permission-banner] [composer] */
```

The banner slot renders conditionally -- when no permission request is active, it renders nothing (zero height). When active, it slides up with a CSS animation.

### Anti-Patterns to Avoid

- **Don't group inside MarkdownRenderer:** Grouping should happen before markdown rendering, not by modifying the rehype plugin. The rehype plugin handles individual markers; grouping is a higher-level concern.
- **Don't use useEffect for streaming group detection:** Follow the existing "adjust state during rendering" pattern in ActiveMessage. useEffect would be one frame late, causing visual flicker.
- **Don't auto-allow + show banner:** The current multiplexer auto-allows ALL permissions. Remove this entirely for non-read-only tools. The banner IS the approval mechanism.
- **Don't use setTimeout for countdown:** Use `setInterval` with 1s ticks referencing `receivedAt` timestamp for drift-resistant countdown. Clear on unmount/dismiss.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SVG circular progress | Canvas-based timer | SVG stroke-dasharray/dashoffset | Simple, CSS-animatable, theme-aware, 20 LOC |
| CSS Grid animation | Height-based animation with JS | `grid-template-rows: 0fr/1fr` | Already proven in ToolCardShell + ThinkingDisclosure, hardware-accelerated |
| Keyboard shortcut handler | Global event listener with manual cleanup | useEffect + addEventListener pattern | Consistent with existing Cmd+. shortcut in ChatComposer |

## Common Pitfalls

### Pitfall 1: Retroactive Group Wrapping During Streaming
**What goes wrong:** When the 2nd tool arrives, the 1st tool was already rendered as an individual ToolChip. Wrapping it into a group causes a visual jump.
**Why it happens:** React re-renders the segments array, unmounting the individual chip and remounting it inside a group.
**How to avoid:** Ensure the group container is established in a single render cycle. Use the "adjust state during rendering" pattern to restructure segments atomically. The key is that React batches state updates in the render phase.
**Warning signs:** Flicker when 2nd tool arrives, tool chip losing expanded state.

### Pitfall 2: Permission Banner Session Scoping
**What goes wrong:** Permission banner appears for a different session's request when user switches sessions.
**Why it happens:** `activePermissionRequest` is global in the stream store, not session-scoped.
**How to avoid:** Include `sessionId` in `PermissionRequest`. Banner only renders when `request.sessionId === currentSessionId`. On session switch, banner vanishes but request stays in store.
**Warning signs:** Banner appearing when it shouldn't, or disappearing permanently when switching away and back.

### Pitfall 3: Countdown Timer Drift
**What goes wrong:** Timer shows incorrect remaining time after tab becomes active again (requestAnimationFrame paused).
**Why it happens:** Using incremental countdown (decrement each tick) instead of absolute time comparison.
**How to avoid:** Store `receivedAt` timestamp. Each tick computes `remaining = 55 - (Date.now() - receivedAt) / 1000`. If remaining <= 0, auto-dismiss.
**Warning signs:** Timer showing negative values or time remaining > timeout after tab switch.

### Pitfall 4: Error Extraction Breaking Group Minimum
**What goes wrong:** A group of 2 tools where 1 has an error -- after extracting the error, the "group" has only 1 non-error tool, which doesn't need grouping.
**Why it happens:** Error extraction happens after group detection.
**How to avoid:** After extracting errors, check if remaining non-error count is still >= 2. If not, demote to individual rendering (all tools as singles, including the error).
**Warning signs:** Groups with a single tool chip inside.

### Pitfall 5: Keyboard Shortcut Conflicts
**What goes wrong:** Y/N keys trigger Allow/Deny while user is typing in the composer textarea.
**Why it happens:** Global keydown listener doesn't check `document.activeElement`.
**How to avoid:** Check `document.activeElement` against `textarea`, `input`, and `[contenteditable]` elements. Only activate shortcuts when no focusable element has focus.
**Warning signs:** Accidental permission grants/denials while typing.

## Code Examples

### SVG Countdown Ring
```typescript
// Source: Standard SVG stroke technique, widely documented
interface CountdownRingProps {
  totalSeconds: number;
  remainingSeconds: number;
  size?: number;  // default 24
}

// SVG circle: radius = (size - strokeWidth) / 2
// circumference = 2 * PI * radius
// stroke-dasharray = circumference
// stroke-dashoffset = circumference * (1 - progress)
// where progress = remaining / total
// Ring depletes clockwise: rotate(-90deg) on SVG + offset calculation
```

### Permission Banner WebSocket Integration
```typescript
// In stream-multiplexer.ts, replace auto-allow:
case 'claude-permission-request':
  callbacks.onPermissionRequest(
    msg.requestId,
    msg.toolName,
    msg.input,
    msg.sessionId,
  );
  // DO NOT auto-send permission-response -- banner handles it
  break;

case 'claude-permission-cancelled':
  callbacks.onPermissionCancelled(msg.requestId);
  break;

// In websocket-init.ts, wire callbacks:
onPermissionRequest: (requestId, toolName, input, sessionId) => {
  streamStore().setPermissionRequest({
    requestId,
    toolName,
    input,
    sessionId,
    receivedAt: Date.now(),
  });
},
```

### Tool-Aware Input Preview
```typescript
// Source: Existing getToolActivityText in stream-multiplexer.ts (similar pattern)
function getPermissionPreview(toolName: string, input: unknown): string {
  const inp = input as Record<string, unknown>;
  switch (toolName) {
    case 'Bash': return truncate(String(inp.command ?? ''), 100);
    case 'Edit': return truncate(String(inp.file_path ?? ''), 100);
    case 'Write': return truncate(String(inp.file_path ?? ''), 100);
    case 'Read': return truncate(String(inp.file_path ?? ''), 100);
    case 'Glob': return truncate(String(inp.pattern ?? ''), 100);
    case 'Grep': return truncate(String(inp.pattern ?? ''), 100);
    default: return truncate(JSON.stringify(input), 100);
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Auto-allow all permissions (M1) | Interactive permission banners | This phase | User can now review/deny tool actions |
| Individual tool chips always | Grouped when >=2 consecutive | This phase | Prevents long tool runs from overwhelming the chat |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 + @testing-library/react 16.3.2 |
| Config file | src/vite.config.ts (vitest config section) |
| Quick run command | `cd src && npx vitest run --reporter=verbose` |
| Full suite command | `cd src && npx vitest run --coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TOOL-20 | Consecutive tools group into accordion | unit | `cd src && npx vitest run src/src/components/chat/tools/ToolCallGroup.test.tsx -x` | No - Wave 0 |
| TOOL-21 | CSS Grid 0fr/1fr expand animation | unit | `cd src && npx vitest run src/src/components/chat/tools/ToolCallGroup.test.tsx -x` | No - Wave 0 |
| TOOL-22 | Error tools force-expanded outside group | unit | `cd src && npx vitest run src/src/components/chat/tools/ToolCallGroup.test.tsx -x` | No - Wave 0 |
| TOOL-23 | Individual chips within group expandable | unit | `cd src && npx vitest run src/src/components/chat/tools/ToolCallGroup.test.tsx -x` | No - Wave 0 |
| PERM-01 | Permission banner renders above composer | unit | `cd src && npx vitest run src/src/components/chat/tools/PermissionBanner.test.tsx -x` | No - Wave 0 |
| PERM-02 | Allow/Deny sends WS response | unit | `cd src && npx vitest run src/src/components/chat/tools/PermissionBanner.test.tsx -x` | No - Wave 0 |
| PERM-03 | Countdown timer with SVG ring | unit | `cd src && npx vitest run src/src/components/chat/tools/CountdownRing.test.tsx -x` | No - Wave 0 |
| PERM-04 | Auto-dismiss on cancelled event | unit | `cd src && npx vitest run src/src/components/chat/tools/PermissionBanner.test.tsx -x` | No - Wave 0 |
| PERM-05 | Only one banner at a time | unit | `cd src && npx vitest run src/src/components/chat/tools/PermissionBanner.test.tsx -x` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `cd src && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd src && npx vitest run --coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/src/components/chat/tools/ToolCallGroup.test.tsx` -- covers TOOL-20, TOOL-21, TOOL-22, TOOL-23
- [ ] `src/src/components/chat/tools/PermissionBanner.test.tsx` -- covers PERM-01, PERM-02, PERM-04, PERM-05
- [ ] `src/src/components/chat/tools/CountdownRing.test.tsx` -- covers PERM-03
- [ ] `src/src/lib/groupToolCalls.test.ts` -- covers grouping algorithm (pure function)

## Open Questions

1. **Should the grouping utility be a standalone function or a hook?**
   - What we know: Historical messages need a pure function. Streaming needs reactive logic in ActiveMessage render body.
   - What's unclear: Whether to share the grouping algorithm or have separate implementations.
   - Recommendation: Pure function `groupToolCalls()` in `src/src/lib/groupToolCalls.ts` for both cases. Historical calls it directly, streaming calls it on the accumulated tool array.

2. **How to handle text between consecutive tools in streaming?**
   - What we know: ActiveMessage inserts empty text spans between tools. These empty spans are invisible but technically break the "consecutive" definition.
   - What's unclear: Whether the streaming buffer ever writes content to these interstitial spans.
   - Recommendation: Check if the text span between two tools has any content. If empty, treat tools as consecutive. The buffer only writes to the LAST text span, so interstitial spans stay empty.

## Sources

### Primary (HIGH confidence)
- Codebase: `src/src/components/chat/tools/ToolCardShell.tsx` -- CSS Grid expand pattern
- Codebase: `src/src/lib/stream-multiplexer.ts` -- Permission auto-allow to remove, callback interface
- Codebase: `src/src/lib/websocket-init.ts` -- Store wiring for permission callbacks
- Codebase: `src/src/types/websocket.ts` -- `claude-permission-request`, `claude-permission-cancelled`, `claude-permission-response` types
- Codebase: `server/claude-sdk.js` -- Backend permission flow (sends request, waits for response, sends cancelled on timeout)
- Codebase: `src/src/components/chat/view/ActiveMessage.tsx` -- Streaming segment architecture
- Codebase: `src/src/components/chat/view/AssistantMessage.tsx` -- Historical tool marker injection
- Codebase: `src/src/components/chat/view/ChatView.tsx` -- CSS Grid layout to modify

### Secondary (MEDIUM confidence)
- SVG stroke-dasharray/dashoffset for circular progress: well-documented pattern, MDN reference

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed, no new dependencies needed
- Architecture: HIGH -- clear integration points identified from codebase reading
- Pitfalls: HIGH -- streaming group wrapping and session scoping are the main risks, both well-understood

**Research date:** 2026-03-08
**Valid until:** 2026-04-08 (stable -- no external dependencies, all codebase-internal)
