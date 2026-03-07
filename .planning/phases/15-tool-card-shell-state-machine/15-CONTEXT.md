# Phase 15: Tool Card Shell + State Machine - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Tool calls display with state machine animations and a consistent card wrapper. Covers the ToolCardShell shared wrapper, CSS transitions between tool states (invoked/executing/resolved/error), live elapsed time counter, error force-expand behavior, and DefaultToolCard upgrade. Per-tool card implementations (Bash, Read, Edit, Write, Glob, Grep) are Phase 16 scope. Tool grouping/accordion is Phase 17 scope.

</domain>

<decisions>
## Implementation Decisions

### Card expansion behavior
- Tool chips stay collapsed after resolve — user clicks to expand. Error cards are the exception (force-expanded on first render).
- Expansion allowed anytime, including during active streaming. Scroll anchor keeps position stable.
- Entire chip is the click target for toggle (no separate chevron). Already implemented this way in current ToolChip.
- No explicit collapse button in card — click chip again to collapse. Keeps cards clean.
- Expand/collapse animation: CSS spring approximation via cubic-bezier, combined with CSS Grid `grid-template-rows: 0fr->1fr` pattern (consistent with ThinkingDisclosure). Uses motion tokens from `motion.ts` but implemented as CSS only (Constitution Tier 1). No LazyMotion/framer-motion.

### Elapsed time display
- Timer shown in both chip and card header — visible regardless of expand state
- Middle dot separator on chip: `Read auth.ts · 1.2s`
- Smart format: sub-second "0.3s", seconds "1.2s", long-running "1m 23s"
- Updates every 100ms via `setInterval` using `startedAt` timestamp from `ToolCallState`
- Timer freezes at final duration on resolve/error — stays visible as static text showing total time
- Timer interval cleaned up on resolve/error/unmount (clearInterval)

### Error state presentation
- Error cards force-expanded on first render, but user CAN collapse them after seeing
- Both chip and card get red treatment: chip gets subtle red border tint + red status dot, card gets `border-error/30` accent + `bg-error/5` tint
- Full error output shown in scrollable container (max-height ~200px, overflow-y auto). No truncation — errors are important enough to show in full.
- Lucide `AlertTriangle` icon in card header next to tool name for error state
- Error text in monospace font, preserving whitespace (stack traces, command output)

### Card header/footer layout
- **Header:** Left side: tool icon + display name. Right side: status dot + status text label ("Running"/"Completed"/"Failed") + elapsed time. Single compact row.
- **No footer.** Collapse via chip click. Per-tool cards (Phase 16) add their own "Show more" buttons within body if needed.
- **Card visual:** Connected but distinct from chip. Appears directly below with matching border radius, subtle border + `surface-raised` background. Small gap (4px) between chip and card body.
- **Status indicator:** Both colored dot AND text label ("Running", "Completed", "Failed") in card header. Dot for quick glance, text for clarity/accessibility.

### DefaultToolCard upgrade
- Structured key-value layout instead of raw JSON dump
- Parse tool input into labeled rows: "command: ls -la", "path: /home/..."
- Output in monospace pre block, scrollable
- DefaultToolCard gets sensible max-height default (~200px scrollable) for its body
- Per-tool cards (Phase 16) handle their own truncation rules — ToolCardShell imposes no max-height on body

### Claude's Discretion
- Exact cubic-bezier values for spring approximation
- Status text label wording (e.g., "Running" vs "Executing", "Done" vs "Completed")
- Key-value parsing logic for DefaultToolCard (handling nested objects, arrays)
- Exact gap/padding values within ToolCardShell header
- Timer implementation details (useRef for interval, cleanup patterns)

</decisions>

<specifics>
## Specific Ideas

- Spring physics feel on expand/collapse — user explicitly chose spring over simple ease-out. CSS cubic-bezier approximation of SPRING_GENTLE parameters.
- Timer format inspired by Claude Code's tool timing display — clean, readable middle-dot separated.
- Error chips should be scannable even when scrolling past collapsed tool groups (Phase 17 will need this for force-expand within groups).

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ToolChip` (src/src/components/chat/tools/ToolChip.tsx): Already has expand toggle with `useState`. Needs elapsed time display added, error styling, and ToolCardShell wrapper for expanded state.
- `tool-chip.css` (src/src/components/chat/tools/tool-chip.css): Has status dot colors (invoked/executing/resolved/rejected) with pulse animation and reduced-motion support. Needs error chip border tint, spring animation keyframes.
- `tool-registry.ts` (src/src/lib/tool-registry.ts): `ToolConfig` interface with `renderCard: ComponentType<ToolCardProps>`. `DefaultToolCard` currently renders raw JSON — needs structured key-value upgrade. 6 tools registered, all using DefaultToolCard.
- `ToolCallState` (src/src/types/stream.ts): Already has `startedAt`, `completedAt`, `status`, `isError`, `output`. All data needed for timer and error state.
- `useStreamStore` (src/src/stores/stream.ts): Has `activeToolCalls`, `addToolCall`, `updateToolCall` — state machine transitions already wired.
- `ThinkingDisclosure` (src/src/components/chat/view/ThinkingDisclosure.tsx): Reference implementation for CSS Grid 0fr/1fr expand/collapse animation pattern.
- `motion.ts` (src/src/lib/motion.ts): SPRING_GENTLE/SNAPPY/BOUNCY tokens — use SPRING_GENTLE stiffness/damping to derive cubic-bezier approximation.

### Established Patterns
- CSS Grid `grid-template-rows: 0fr/1fr` for expand/collapse (ThinkingDisclosure, Constitution Tier 1)
- `data-status` attribute for CSS-driven state styling (tool-chip.css)
- `cn()` utility for conditional classes (Constitution 3.6)
- `memo()` wrapping for performance (ToolChip already wrapped)
- Selector-only Zustand subscriptions (Constitution 4.2)
- `prefers-reduced-motion` media query for animation opt-out

### Integration Points
- `ToolChip` renders inside `ActiveMessage` segments (streaming) and `AssistantMessage` marker replacements (finalized)
- `ToolCardShell` will wrap all `renderCard` components — needs to be inserted between ToolChip expansion and the card component
- `useStreamStore.activeToolCalls` drives live tool state during streaming
- `Message.toolCalls` (timeline store) drives historical tool state
- Phase 16 per-tool cards will replace DefaultToolCard registrations but use ToolCardShell wrapper

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 15-tool-card-shell-state-machine*
*Context gathered: 2026-03-07*
