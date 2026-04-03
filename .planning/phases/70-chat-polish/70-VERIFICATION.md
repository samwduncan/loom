# Phase 70 — UI Rebuild: Plan Verification Report

**Phase:** 70-chat-polish  
**Plans verified:** 6 (70-01 through 70-06)  
**Date:** 2026-04-03  
**Verifier:** gsd-plan-checker

---

## Overall Status: ISSUES FOUND

**3 blockers, 4 warnings**

---

## Dimension 1: Requirement Coverage

| Requirement | Description | Plans | Status |
|-------------|-------------|-------|--------|
| CHAT-05 | Tool call cards with expand/collapse | 70-05, 70-06 | COVERED |
| CHAT-06 | Thinking blocks with expand/collapse | 70-05, 70-06 | COVERED |
| CHAT-07 | Code blocks monospace rendering | 70-05, 70-06 | COVERED |
| CHAT-08 | 60fps scroll, 50+ messages | 70-01, 70-02, 70-03, 70-04, 70-06 | COVERED |
| CHAT-12 | 120Hz keyboard sync | 70-01, 70-06 | COVERED |

All 5 requirements have covering plans. No gaps in requirement-to-plan mapping.

---

## Dimension 2: Task Completeness

| Plan | Tasks | Files | Has Action | Has Verify | Has Done |
|------|-------|-------|-----------|-----------|---------|
| 70-01 | 2 | 4 | Yes | Yes | Yes |
| 70-02 | 2 | 5 | Yes | Yes | Yes |
| 70-03 | 2 | 4 | Yes | Yes | Yes |
| 70-04 | 1 | 1 | Yes | Yes | Yes |
| 70-05 | 2 | 5 | Yes | Yes | Yes |
| 70-06 | 2 | 4 | Yes | Yes | Yes |

All task fields are present. Actions are specific with code snippets. Verify commands are runnable. Done criteria are measurable.

**BLOCKER: Plan 05 Task 2 — ToolCallState field name mismatch.**

The plan references `tc.name` but `ToolCallState` in `shared/types/stream.ts` uses `toolName` (not `name`). The plan's code snippet:

```tsx
<ToolCallCard
  key={tc.id}
  toolName={tc.name}     // WRONG — field is tc.toolName
  toolInput={tc.input}   // WRONG — tc.input is Record<string,unknown>, not string
  toolOutput={tc.output}
  isRunning={!tc.isComplete && !tc.isError}   // WRONG — field is tc.status, not tc.isComplete
  isComplete={tc.isComplete}                   // WRONG — no isComplete field; use tc.status === 'complete'
  isError={tc.isError}
/>
```

The actual `ToolCallState` interface is:
```typescript
{ id, toolName, status, input: Record<string,unknown>, output: string|null, isError, startedAt, completedAt }
```

`tc.isComplete` does not exist — status is an enum (`status: ToolCallStatus`). `tc.input` is `Record<string,unknown>`, not a string — the card's `toolInput?: string` will need serialization. If the executor copies this code verbatim, it will produce TypeScript errors and incorrect runtime behavior.

---

## Dimension 3: Dependency Correctness

```
Wave 1: 70-01 (no deps)
Wave 2: 70-02 (depends: 70-01), 70-03 (depends: 70-01)  — parallel OK
Wave 3: 70-04 (depends: 70-02), 70-05 (depends: 70-02) — parallel OK
Wave 4: 70-06 (depends: 70-02, 70-03, 70-04, 70-05)
```

Dependency graph is acyclic and wave assignments are consistent. No forward references. Parallel plans (02+03, 04+05) are independent and can genuinely run in parallel — they touch different file sets with no shared mutations.

**WARNING: Plan 03 and Plan 02 have a latent ordering concern.**

Plan 02 modifies `MessageBubble.tsx`. Plan 05 also modifies `MessageBubble.tsx`. Both are in different waves (2 vs 3), which is correct — Plan 05 depends on Plan 02. However, the dependency is only declared as `70-02`, not `70-01` + `70-02`. This is fine since 70-02 transitively depends on 70-01.

No blockers in dependency correctness.

---

## Dimension 4: Key Links Planned

| Link | From | To | Via | Status |
|------|------|----|-----|--------|
| KeyboardProvider wiring | _layout.tsx | keyboard-controller | KeyboardProvider wrap | Planned (Plan 01 Task 1) |
| LegendList in MessageList | MessageList.tsx | @legendapp/list | LegendList import | Planned (Plan 01 Task 2) |
| translate-with-padding | chat/[id].tsx | keyboard-controller | KAV behavior prop | Planned (Plan 01 Task 2) |
| MessageBubble → ProviderAvatar | MessageBubble.tsx | ProviderAvatar.tsx | isFirstInGroup | Planned (Plan 02 Task 2) |
| Composer → ComposerInput | Composer.tsx | ComposerInput.tsx | onHeightChange | Planned (Plan 02 Task 1) |
| SessionItem → Zeego | SessionItem.tsx | zeego | ContextMenu.Root | Planned (Plan 03 Task 2) |
| useSessions → temporalGroups | useSessions.ts | SessionList.tsx | temporalGroups prop | Planned (Plan 03) |
| EmptyChat → chat screen | EmptyChat.tsx | chat/[id].tsx | onSuggestion callback | Planned (Plan 04) |
| MessageBubble → ToolCallCard | MessageBubble.tsx | ToolCallCard.tsx | ToolCallCard import | Planned (Plan 05 Task 2) |
| MessageBubble → ThinkingBlock | MessageBubble.tsx | ThinkingBlock.tsx | ThinkingBlock import | Planned (Plan 05 Task 2) |

All critical artifact connections have planned wiring tasks. No isolated islands.

**WARNING: ThinkingBlock ↔ thinkingState wiring is underspecified.**

`useStreamStore` has `thinkingState: ThinkingState | null` (not `isThinking: boolean`). Plan 05 Task 2 says "check if useStreamStore has thinking state" and offers fallback strategies. The executor is left to discover the correct API at implementation time. While the fallback handling shows awareness of the problem, the plan should specify: use `useStreamStore(s => s.thinkingState)` directly — it exists and is not ambiguous.

---

## Dimension 5: Scope Sanity

| Plan | Tasks | Files Modified | Wave | Assessment |
|------|-------|---------------|------|------------|
| 70-01 | 2 | 4 | 1 | OK |
| 70-02 | 2 | 5 | 2 | OK |
| 70-03 | 2 | 4 | 2 | OK |
| 70-04 | 1 | 1 | 3 | OK (thin but appropriate) |
| 70-05 | 2 | 5 | 3 | OK — but see below |
| 70-06 | 2 | 4 | 4 | OK |

All plans are within scope thresholds (2-3 tasks, <10 files). No splitting required.

**WARNING: Plan 05 Task 2 does three distinct things in one task.**

Task 2 creates CodeBlock.tsx, wires ToolCallCard + ThinkingBlock into MessageBubble, AND implements the streaming deduplication logic. These are three conceptually separate operations packed into one task. The file count is 3 files but the cognitive complexity is high. This is a warning, not a blocker — the task has clear done criteria and the code snippets are specific enough.

---

## Dimension 6: Verification Derivation

All plans have `must_haves` with truths, artifacts, and key_links. Truths are user-observable (e.g., "Session list groups sessions by temporal buckets," "Composer is a unified pill with auto-growing TextInput"). Artifacts include the `contains` field for automated verification. Key_links specify the wiring mechanism and pattern.

Plan 06 (integration checkpoint) has empty `artifacts: []` and `key_links: []` — acceptable for a device verification plan since it produces no new artifacts; it validates what was built by Plans 01-05.

No issues in verification derivation.

---

## Dimension 7: Context Compliance

CONTEXT.md decisions checked against all plans:

| Decision | Plan | Status |
|----------|------|--------|
| legend-list with alignItemsAtEnd + maintainScrollAtEnd | 70-01 Task 2 | COVERED |
| react-native-keyboard-controller, translate-with-padding, KeyboardProvider | 70-01 Tasks 1+2 | COVERED |
| Unified pill composer, scrollEnabled=false until max, attachment outside | 70-02 Task 1 | COVERED |
| User bubbles: accent color, 20pt radius, 75% max width | 70-02 Task 2 | COVERED |
| Assistant messages: flat left, 32pt avatar, 44px indent for continuations | 70-02 Task 2 | COVERED |
| Spacing: 4pt grouped, 16pt between senders | 70-02 Task 2 | COVERED |
| Session list: temporal grouping Today/Yesterday/Prev 7 Days/Monthly | 70-03 Task 1 | COVERED |
| Zeego context menus: Rename + Delete | 70-03 Task 2 | COVERED |
| Empty state: 4-6 chips in 2-column grid, pill-shaped, semi-transparent | 70-04 Task 1 | COVERED |
| Tool cards, thinking blocks, code blocks in this phase | 70-05 | COVERED |
| No syntax highlighting (deferred Phase 73) | 70-05 Task 2, line 259 | COVERED |
| No haptics (deferred Phase 71) | 70-06 Task 1 step 5 | COVERED |

**No locked decisions are contradicted. No deferred ideas are implemented.**

One alignment note: CONTEXT.md says "4-6 suggestion chips" while Plan 04 implements exactly 6 chips. This is within the stated range — compliant.

---

## Dimension 8: Nyquist Compliance

SKIPPED — No VALIDATION.md or RESEARCH.md with Validation Architecture section found in phase directory.

---

## Dimension 9: Cross-Plan Data Contracts

**BLOCKER: ToolCallState field shape mismatch between shared store and Plan 05 interface.**

This is a cross-plan data contract issue: the shared store (produced by Phase 69, used by Plan 05) has a different field schema than what Plan 05 designs for.

- `shared/types/stream.ts` ToolCallState: `{ id, toolName, status: ToolCallStatus, input: Record<string,unknown>, output: string|null, isError, startedAt, completedAt }`
- Plan 05 ToolCallCard interface assumes: `{ id, name, toolInput?: string, isRunning: boolean, isError: boolean, isComplete: boolean }`
- Plan 05 code snippet accesses `tc.name` (does not exist, should be `tc.toolName`)
- Plan 05 code snippet accesses `tc.isComplete` (does not exist, should be `tc.status === 'complete'` or `'invoked'`)
- Plan 05 code snippet passes `tc.input` (a `Record<string,unknown>`) as `toolInput?: string` — type mismatch, needs `JSON.stringify(tc.input)`

The ToolCallCard component interface in Plan 05 is defined as props the executor creates fresh, but the wiring in Task 2 reads from the live store with incompatible field names. The executor will need to adapt the code or the ToolCallCard interface, but the plan presents it as copy-paste ready — this is a reliability risk.

**BLOCKER: renameSession API endpoint not verified to exist in backend.**

Plan 03 Task 1 adds a `renameSession` callback calling:
```
PATCH /api/projects/:projectName/sessions/:sessionId
```
with body `{ title: newTitle }`. This endpoint is new — Phase 69 did not implement it (Phase 69 only implemented read/create/delete session operations). The backend API contract in `.planning/BACKEND_API_CONTRACT.md` must be checked; if the PATCH endpoint does not exist, Plan 03 will build a frontend function that silently fails when called.

The plan does not include a task for adding the backend endpoint, nor does it reference it as an existing API. This is either a gap (endpoint needs to be added but isn't) or an undocumented assumption (endpoint already exists). Either way, the plan needs to confirm this.

---

## Dimension 10: CLAUDE.md Compliance

CLAUDE.md (project-level at `/home/swd/loom/CLAUDE.md`) does not contain mobile/React Native specific prohibitions. General rules checked:

- **No placeholders:** Plans provide complete code snippets. Compliant.
- **Verify before done:** All tasks include `<verify>` with runnable commands. Compliant.
- **Plan before multi-file changes:** Plans are structured with numbered steps. Compliant.
- **Forgejo issue tracking:** Plan 06 (device verification checkpoint) will discover bugs — executor should file Forgejo issues for any findings. Not explicitly mentioned in any plan. Warning only.

---

## Structured Issues

```yaml
issues:

  - plan: "70-05"
    dimension: "cross_plan_data_contracts"
    severity: blocker
    description: "ToolCallState field names in plan code don't match shared/types/stream.ts. tc.name should be tc.toolName, tc.isComplete doesn't exist (use tc.status), tc.input is Record<string,unknown> not string."
    task: 2
    fix_hint: "Update Plan 05 Task 2 code snippet: change tc.name→tc.toolName, tc.isComplete→(tc.status==='invoked'), tc.isRunning→(tc.status==='running'). Add JSON.stringify(tc.input) for toolInput prop. Alternatively, update ToolCallCard's interface to accept ToolCallState directly and map internally."

  - plan: "70-03"
    dimension: "key_links_planned"
    severity: blocker
    description: "Plan 03 Task 1 adds renameSession calling PATCH /api/projects/:name/sessions/:id but this backend endpoint is not confirmed to exist. Phase 69 did not implement session PATCH."
    task: 1
    fix_hint: "Verify the endpoint exists in BACKEND_API_CONTRACT.md. If absent, either add a backend task to Plan 03 (or a new Plan 03a) to implement the PATCH endpoint, or defer rename to Phase 71 (Native-03 scope) and limit Plan 03 to temporal grouping + delete-only context menu."

  - plan: "70-05"
    dimension: "task_completeness"
    severity: blocker
    description: "Plan 05 Task 2 does three distinct high-complexity operations in one task: create CodeBlock.tsx, wire ToolCallCard+ThinkingBlock into MessageBubble, implement streaming deduplication logic. The streaming deduplication (parseToolCallsFromContent) is completely unspecified — no parser implementation provided, function signature left as placeholder comment."
    task: 2
    fix_hint: "Either split Task 2 into (a) CodeBlock creation and (b) MessageBubble wiring+deduplication, OR specify the parseToolCallsFromContent implementation. The deduplication logic is the most critical piece and needs concrete specification, not a comment stub."

  - plan: "70-05"
    dimension: "task_completeness"
    severity: warning
    description: "ThinkingBlock isStreaming detection is underspecified. Plan says 'check useStreamStore for isThinking or thinkingContent state' but the store has thinkingState: ThinkingState | null. Leaving this to executor discovery risks wrong implementation."
    task: 1
    fix_hint: "Specify: use useStreamStore(s => s.thinkingState). When thinkingState is non-null, isStreaming=true. When null, isStreaming=false. ThinkingState has content and elapsed fields."

  - plan: "70-04"
    dimension: "dependency_correctness"
    severity: warning
    description: "Plan 04 depends on 70-02 (which modifies MessageBubble), but Plan 04 only touches EmptyChat.tsx which is independent of MessageBubble. The dependency is harmless but creates unnecessary wave 3 serialization. EmptyChat could run in wave 2 parallel with 70-02 and 70-03."
    task: null
    fix_hint: "Change depends_on from [70-02] to [70-01] and move to wave 2. EmptyChat.tsx has no dependency on anything from Plan 02. This enables better parallelization."

  - plan: "70-06"
    dimension: "task_completeness"
    severity: warning
    description: "Plan 06 Task 2 (device checkpoint) references 'mobile/components/chat/MessageList.tsx' as its <files> field. This is not a file the task modifies — it's carried over as a placeholder. The checkpoint task modifies no files; it's a verification gate."
    task: 2
    fix_hint: "This is a minor cleanup: remove the stale files field from the checkpoint task or leave as-is (it won't cause execution failure, just cosmetic inaccuracy)."
```

---

## Summary

### Blockers (must fix before execution)

**1. [cross_plan_data_contracts] Plan 05 Task 2 — ToolCallState field mismatch**
- Plan: 70-05, Task 2
- `tc.name` does not exist (use `tc.toolName`), `tc.isComplete` does not exist (use status enum), `tc.input` is `Record<string,unknown>` not string
- Fix: Correct the code snippet in Plan 05 Task 2 to use actual ToolCallState field names, or revise ToolCallCard's internal mapping

**2. [key_links_planned] Plan 03 Task 1 — renameSession calls unconfirmed backend endpoint**
- Plan: 70-03, Task 1
- PATCH endpoint for session rename is not confirmed to exist; Phase 69 did not implement it
- Fix: Confirm endpoint exists or add backend task, or defer rename to Phase 71

**3. [task_completeness] Plan 05 Task 2 — parseToolCallsFromContent is a stub comment, not a specification**
- Plan: 70-05, Task 2
- The streaming-to-complete tool call deduplication relies on `parseToolCallsFromContent()` which is described only as a comment with no implementation guidance
- Fix: Specify the parsing strategy (e.g., how tool calls are stored in completed message content, or confirm they come from a persisted store)

### Warnings (should fix)

1. **[task_completeness] Plan 05 Task 1 — ThinkingBlock store wiring underspecified** — Use `useStreamStore(s => s.thinkingState)` directly; it exists
2. **[dependency_correctness] Plan 04 — unnecessary wave 3 serialization** — EmptyChat has no dependency on Plan 02; could run in wave 2
3. **[task_completeness] Plan 05 Task 2 — three high-complexity operations in one task** — split or ensure parseToolCallsFromContent gets a real spec
4. **[task_completeness] Plan 06 Task 2 — stale `<files>` in checkpoint task** — cosmetic cleanup

### What the Plans Get Right

- Requirements CHAT-05 through CHAT-08 and CHAT-12 are all covered
- Wave structure is clean and logical; parallel plans (02+03, 04+05) are genuinely independent
- Context compliance is excellent — all locked decisions are implemented, no deferred features leak in
- Key artifact wiring is planned (not just artifact creation)
- All plans are within scope thresholds (2 tasks max, <6 files per plan)
- Plan 06 correctly gates on human device verification before phase completion

### Recommendation

3 blockers require revision. Blocker 2 (rename endpoint) is the most critical because it affects backend work scope. Returning to planner with feedback.

