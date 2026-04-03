# Phase 70: UI Rebuild — Clone ChatGPT/Claude iOS Patterns - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning
**Source:** Previous session handoff (97105653) + mobile/.planning/research/ (9 files, 152KB)

<domain>
## Phase Boundary

Phase 70 is a **complete UI rebuild** of the Loom native iOS app. Phase 69 delivered working business logic (auth, WebSocket, streaming, session stores) but the UI layer was "foundationally flawed" — built from scratch without studying reference implementations, resulting in a developer prototype, not a polished app.

**What stays:** All Phase 69 business logic — hooks (useAuth, useConnection, useSessions, useMessageList), lib/ (api-client, auth-provider, websocket-init, storage-adapter, colors, springs), shared/ workspace.

**What gets rebuilt:** ALL UI components — every file in components/, every screen in app/(drawer)/. The app/ route structure may change too.

**Approach:** Clone -> Integrate -> Elevate
1. First, clone the exact patterns from ChatGPT/Claude iOS (layout, density, interactions)
2. Then integrate Loom's business logic into the cloned UI
3. Then layer Loom personality (springs, dynamic color — but only AFTER the clone is right)

</domain>

<decisions>
## Implementation Decisions

### Message List Infrastructure
- **LOCKED:** Replace current FlatList/FlashList with `legend-list` (`@legendapp/list`)
- `alignItemsAtEnd: true` + `maintainScrollAtEnd: true` — eliminates inverted FlatList anti-pattern
- No CSS transform tricks, animations work correctly, 60fps scroll
- **Why:** Inverted FlatList causes 30-40 FPS drops, breaks Reanimated animations (Pitfall 1)

### Keyboard Handling
- **LOCKED:** Replace RN KeyboardAvoidingView with `react-native-keyboard-controller`
- Use `behavior="translate-with-padding"` — purpose-built for chat
- Wrap app root in `<KeyboardProvider>`
- **Why:** Built-in KAV has timing bugs, platform differences, offset nightmares (Pitfall 2)

### Composer Design
- **LOCKED:** Unified pill — TextInput + SendButton as ONE visual unit (no gap)
- Attachment button OUTSIDE the pill (left side)
- Auto-growing TextInput: min 40px, max 144px (6 lines), `scrollEnabled={false}` until max
- Send button: solid circle with upward arrow, animates with spring "pop" when text entered
- Voice/mic button when empty (can be placeholder for v3.0)
- **Reference:** GAIA UI Composer spec + ChatGPT iOS anatomy

### Message Layout
- **LOCKED:** User messages: right-aligned, colored bubble background (accent color), no avatar
- **LOCKED:** Assistant messages: flat left-aligned, NO bubble background, small circular avatar (32pt)
- Spacing: 4pt between grouped bubbles, 16pt between sender changes
- Bubble radius: 20pt (stadium/pill shape for user), tail-less for assistant
- **Reference:** ChatGPT iOS + Claude iOS teardown

### Session List
- **LOCKED:** Temporal grouping: Today / Yesterday / Previous 7 Days / Monthly
- NOT project-based grouping (current Phase 69 approach)
- Context menu via Zeego: Rename, Delete (native iOS UIContextMenuInteraction)
- Search bar at top of drawer
- **Reference:** Both ChatGPT and Claude iOS use this pattern

### Empty State
- **LOCKED:** Centered greeting + 4-6 suggestion chips in 2-column grid
- Pill-shaped chips, semi-transparent background
- Tapping a chip sends it as the first message
- **Reference:** ChatGPT iOS empty state

### Surface Contrast
- **LOCKED:** Surface tiers need 16-20 RGB unit jumps (not 8) — already committed in 5875b71
- Colors from Soul doc: warm charcoal base, dusty rose accent

### New Library Dependencies
- `@legendapp/list` — Message list (replaces FlatList)
- `react-native-keyboard-controller` — Keyboard avoidance
- `zeego` — Native iOS context menus (long-press)
- `@gorhom/bottom-sheet` — Attachment menu (if needed)

### Tool Cards & Thinking Blocks (within this phase)
- Tool call cards: Read/Write/Execute/Search/Bash/MCP with status indicator + expand/collapse
- Thinking blocks: expand/collapse disclosure with spring animation
- Code blocks: monospace rendering (syntax highlighting deferred to Phase 73)
- These layer ON TOP of the rebuilt message list, not the old one

### Claude's Discretion
- Exact animation timings for message entrance (should follow Soul doc spring configs)
- Component file organization within mobile/components/
- Whether to use NativeWind className or inline styles (TS compat was an issue in Phase 69)
- FlashList vs legend-list fallback strategy if legend-list has Expo SDK 54 issues
- Exact suggestion chip text content

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design & Vision
- `.planning/NATIVE-APP-SOUL.md` — Authoritative visual contract: spring configs, surface tiers, typography, color system, anti-patterns
- `mobile/.planning/research/REFERENCE-APP-TEARDOWN.md` — ChatGPT vs Claude iOS design tokens, layout patterns, composer anatomy
- `mobile/.planning/research/BARD-PRIME-DEEP-DIVE.md` — **Primary reference.** Code snippets from 5 cloned repos. Copy-paste ready patterns for drawer, list, composer, streaming.

### Technical Research
- `mobile/.planning/research/README.md` — Quick reference with code snippets + installation commands
- `mobile/.planning/research/PITFALLS.md` — 13 pitfalls to avoid (inverted FlatList, keyboard fighting, etc.)
- `mobile/.planning/research/ARCHITECTURE.md` — Component hierarchy, storage patterns
- `mobile/.planning/research/CHAT-UI-RESEARCH.md` — Library recommendations, design system references

### Existing Codebase
- `mobile/components/` — Current UI components (ALL being rebuilt)
- `mobile/hooks/` — Business logic hooks (PRESERVED — useAuth, useConnection, useSessions, useMessageList)
- `mobile/lib/` — Utilities (PRESERVED — api-client, auth-provider, websocket-init, etc.)
- `mobile/app/` — Route structure (may change)
- `shared/` — Cross-platform business logic (UNTOUCHED)

### Project Standards
- `.planning/V2_CONSTITUTION.md` — Section 13: Touch Target & Focus Standards (44px minimum)
- `.planning/REQUIREMENTS.md` — CHAT-05 through CHAT-08, CHAT-12

</canonical_refs>

<specifics>
## Specific Ideas

- legend-list is a 3-line change from FlatList — test first in isolation before deep integration
- Galaxies-dev drawer pattern (BARD-PRIME lines 40-100) is the exact Expo Router drawer + custom content we need
- GAIA UI composer spec is the unified pill pattern — auto-grow TextInput + send button state machine
- Soul doc spring configs (Micro/Standard/Navigation/Drawer/Expand/Dramatic) apply to all animations
- Previous session committed partial fixes in 5875b71 (contrast, suggestions) — some of this work transfers
- The `useSessions` hook currently groups by project — needs to switch to temporal grouping
- Device testing on iPhone 16 Pro Max is the quality gate — NOT simulator

</specifics>

<deferred>
## Deferred Ideas

- Syntax highlighting for code blocks — Phase 73 (POLISH-01)
- Share sheet integration — Phase 73 (POLISH-02)
- VoiceOver accessibility — Phase 73 (POLISH-05)
- Haptic feedback on interactions — Phase 71 (NATIVE-01)
- Spring physics on all transitions — Phase 71 (NATIVE-02)
- Swipe-to-delete sessions — Phase 71 (NATIVE-03)
- Pull-to-refresh — Phase 71 (NATIVE-05)
- Push notifications — Phase 72

</deferred>

---

*Phase: 70-chat-polish*
*Context gathered: 2026-04-03 via previous session handoff + research consolidation*
