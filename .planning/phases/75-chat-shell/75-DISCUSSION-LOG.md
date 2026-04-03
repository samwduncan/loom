# Phase 75: Chat Shell - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-03
**Phase:** 75-chat-shell
**Areas discussed:** Tool card design, Thinking block behavior, Session list & grouping, Syntax highlighting scope

---

## Tool Card Design

### Question 1: How should tool cards relate to the assistant message?

| Option | Description | Selected |
|--------|-------------|----------|
| Inline within message | Tool cards appear inside assistant message flow, between text segments. Matches web app. More complex streaming. | |
| Separate visual blocks | Tool cards render as distinct blocks, visually separated. Simpler streaming. ChatGPT iOS pattern. | |
| Collapsed inline chips | Small chips/pills inline (icon + tool name + status). Tap to expand to bottom sheet. Minimal disruption. | |

**User's choice:** Initially unsure. After detailed tradeoff analysis, selected "Collapsed inline chips."
**Notes:** Recommendation was chips for mobile screen real estate, clean streaming, and iOS design convention alignment.

### Question 2: What info should the tool chip show at a glance?

| Option | Description | Selected |
|--------|-------------|----------|
| Icon + tool name + status | e.g. [Read: src/app.tsx ✓]. Status via icon (pending/running/done/error). | ✓ |
| Icon + tool name + first arg + status | e.g. [Bash: npm test ✓]. Shows key argument. | |
| You decide | Claude picks based on chip width. | |

**User's choice:** Icon + tool name + status
**Notes:** Clean, compact. Full details available on tap via bottom sheet.

---

## Thinking Block Behavior

### Question 1: How should thinking blocks behave during and after streaming?

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-expand during, auto-collapse after | Streams visibly while thinking. Collapses to "Thought for Xs" when content starts. Tap to re-expand. | |
| Always collapsed | Shows "Thinking..." indicator. Never auto-expands. Tap to see content. | |
| Always expanded | Stays visible after completion. No auto-collapse. | |

**User's choice:** Initially selected "Always expanded," then clarified: expanded during streaming, collapsed after completion.
**Notes:** User wants to see thinking in real-time but doesn't want it cluttering the final result. This is the auto-expand/auto-collapse behavior.

### Question 2: What should the thinking block header look like?

| Option | Description | Selected |
|--------|-------------|----------|
| Subtle divider + label | "Thinking" label in muted caption text with divider. Thinking text dimmed. Minimal chrome. | ✓ |
| Collapsible card | Surface-sunken card with header and chevron toggle. More structured. | |
| You decide | Claude picks based on Soul doc surface tiers. | |

**User's choice:** Subtle divider + label
**Notes:** Muted color treatment for thinking text, clean divider separation.

---

## Session List & Grouping

### Question 1: How should sessions be organized in the drawer?

| Option | Description | Selected |
|--------|-------------|----------|
| Date-grouped with status indicators | Today/Yesterday/Last Week/Older. Running sessions get pulsing dot but stay in date group. Stable ordering. | ✓ |
| Status-first, then date | "Running" section at top. Below: date-grouped recent. Sessions float based on status. | |
| Flat list with status badges | No grouping. Chronological with status badges. Simplest. | |

**User's choice:** Date-grouped with status indicators
**Notes:** Follows Private Mind pattern. Stable ordering preferred over real-time status reordering.

### Question 2: Session drawer search and delete behavior?

| Option | Description | Selected |
|--------|-------------|----------|
| Sticky search bar + swipe-to-delete | Pinned search at top (glass). Real-time filter. Swipe left for delete with spring animation. | ✓ |
| Pull-down search + swipe-to-delete | Hidden search, pull to reveal. Same swipe-delete. Cleaner default. | |
| You decide | Claude picks based on drawer layout. | |

**User's choice:** Sticky search bar + swipe-to-delete
**Notes:** None.

---

## Syntax Highlighting Scope

### Question 1: Ship in Phase 75 or defer?

| Option | Description | Selected |
|--------|-------------|----------|
| Full syntax highlighting in Phase 75 | Use react-native-syntax-highlighter or similar. CHAT-06 complete. Adds dependency. | ✓ |
| Monospace + copy button now, colors later | Monospace on dark surface with copy button. CHAT-06 partially met. | |
| You decide based on effort | Claude evaluates during planning. Include if < 1 day, defer if multi-day. | |

**User's choice:** Full syntax highlighting in Phase 75
**Notes:** CHAT-06 met as written. No deferral.

---

## Claude's Discretion

- Permission approval UX (auto-resolved: inline card with approve/deny buttons, transforms to status line after action)
- Composer behavior (auto-resolved: make ComposerShell functional with 3-state FSM)
- Message layout (carried from Phase 69 context: user bubbles right-aligned, assistant free-flowing)
- Empty states (carried from Phase 69 context)
- Streaming visual feedback (carried from Phase 69: pulsing accent line)
- FlatList inverted as message list component
- Markdown renderer choice
- Bottom sheet library for tool card expansion

## Deferred Ideas

None — discussion stayed within phase scope.
