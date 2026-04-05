# Motion Design Documentation Index

**Created:** 2026-04-04  
**Scope:** Complete interaction and animation specification for Loom v4.0 iOS app  
**Audience:** Designers, React Native engineers, QA testers  

---

## Two Core Documents

### 1. INTERACTION-AND-ANIMATION-SPECIFICATION.md (36KB, 1217 lines)

**The Reference Bible.** Every animation value, timing, easing curve, haptic pattern, and accessibility consideration for the iOS app.

**What's Inside:**
- 16 sections covering 10 interaction categories
- Exact timing values (in milliseconds)
- Spring physics configs (damping, stiffness, mass)
- Easing curves (named, CSS linear() format)
- Haptic patterns (hapticImpact, hapticNotification, hapticSelection)
- Accessibility (prefers-reduced-motion fallbacks)
- React Native + Reanimated code examples
- Quick reference table (22 animations)
- Implementation validation checklist (20 items)

**When to Use:**
- You need exact timing for an animation: Look up in Section 12 summary table
- You're implementing a gesture: Find pattern in Section 6 (Screen Transitions) or 5 (Drawer)
- You need to know if motion is wrong: Check Section 15 validation checklist
- You're writing code: Copy example from relevant section
- You're testing: Verify against spec values

**Key Sections:**
1. Streaming Text Behavior (character-by-character, no cursor, auto-scroll throttling)
2. Typing/Loading Indicator (3-dot bounce, 600ms loop, 100ms stagger)
3. Message Animations (user: slide+fade 250ms, assistant: fade 150ms, tool stagger +80ms)
4. Send Button & Composer (scale 0.92 press, height thresholds, growth animation)
5. Drawer/Sidebar (spring physics damping:12, velocity tracking, 50dp threshold)
6. Screen Transitions (iOS push/pop, modal slide-up, sheet snapping)
7. Scroll Physics (deceleration 0.998, bounce overshoot ~20dp, scroll-to-bottom at 200dp)
8. Error & Feedback States (failed message +300ms delay, retry pulse, disconnect banner)
9. Background & Ambient Effects (static dark bg, glass on Composer only, no particles)
10. Micro-interactions (button 0.92→1.0 scale, list highlight, toggle 200ms)
11. Spring Physics Reference (SNAPPY, BOUNCY, GENTLE, TIGHT configs with damping values)
12. Summary Table (quick lookup for all 22 animations)
13. Accessibility (reduced motion → 50ms instant, haptics separate guard)
14. Platform Notes (120Hz ProMotion info.plist, Reanimated v3 patterns)
15. Validation Checklist (20 critical implementation checks)
16. Next Steps (create animations.ts, test on device, gather designer feedback)

**Example Use Cases:**
- "How fast should the send button scale back?" → Section 4.1 (100ms in, 150ms out, spring)
- "What's the thinking indicator animation?" → Section 2 (3-dot bounce, exact code)
- "When does scroll-to-bottom appear?" → Section 7.3 (when > 200dp from end)
- "How do failed messages animate?" → Section 8.1-8.2 (slide in, label +300ms delay, retry scale)

---

### 2. ANIMATION-IMPLEMENTATION-ROADMAP.md (19KB, 667 lines)

**The Execution Plan.** Phased rollout of motion across 6 production phases (75-80), with code examples, acceptance criteria, and testing strategies.

**What's Inside:**
- Strategic overview (why motion matters)
- Current state analysis (Phase 76.1: visual foundation complete, motion systems missing)
- Phase 75 breakdown (6 implementation plans with code)
- Phase 76-77 breakdown (3 gesture animation plans)
- Phase 78-80 breakdown (3 polish plans)
- Success criteria per phase
- Resource links to supporting documentation

**Implementation Plans (6 + 3 + 3 = 12 total):**

**Phase 75 (Chat Shell: Motion Baseline)**
1. 75-01: Streaming text & auto-scroll (debounce 300ms, detect scroll-up)
2. 75-02: Thinking indicator (3-dot bounce, Reanimated.useEffect pattern)
3. 75-03: Message entry animations (UserBubble slide+fade, AssistantMessage fade)
4. 75-04: Send button feedback (scale 0.92, spring recovery, haptic)
5. 75-05: Composer growth (height thresholds per line, max 156dp, snap on clear)
6. 75-06: Error state animations (failed label +300ms, retry scale pulse)

**Phase 76-77 (Navigation & Drawer)**
1. 76-01: Drawer spring physics (velocity tracking, snap open/close, 300ms spring)
2. 76-02: Scroll-to-bottom button (fade in/out, appear at 200dp threshold)
3. 76-03: Pull-to-refresh spinner (60dp threshold, rotation loop, haptic on complete)

**Phase 78-80 (Polish & Tuning)**
1. 78-01: Tool call stagger (200ms entry + 80ms delay per tool)
2. 78-02: Reduced motion system (all springs → 50ms, haptics separate guard)
3. 78-03: Spring tuning session (device testing, damping iteration, final feel)

**When to Use:**
- You're planning Phase 75: Start with 75-01 through 75-06 in order
- You need code examples: Find implementation pattern in relevant section
- You're testing: Check acceptance criteria for your phase
- You need to tune springs: See phase 78-03 process
- You're blocked on motion: Cross-reference to spec for exact values

---

## Supporting Documentation

### Phase Research (Reference Material)

Located in `.planning/phases/`:

**Phase 62: Haptics & Motion**
- File: `62-haptics-motion/62-RESEARCH.md`
- Covers: Capacitor Haptics plugin, iOS ProMotion 120Hz, spring physics frame-rate independence
- Key insight: Haptics are fire-and-forget (no await), spring curves are frame-rate independent (no separate 120Hz variants)

**Phase 67: iOS Native Gestures**
- File: `67-ios-native-gestures/67-RESEARCH.md`
- Covers: Swipe-to-delete, pull-to-refresh, long-press context menus, Radix ContextMenu, @use-gesture/react
- Key insight: Use Radix ContextMenu built-in long-press (not custom), @use-gesture/react for gesture math

**Phase 76.1: Visual Foundation**
- File: `76.1-visual-foundation/VISUAL-CLONE-BRIEF.md`
- Covers: Color system overhaul (dark OKLCH), typography (SF Pro 16px), Composer glass UI
- Key insight: Better-chatbot visual target, much darker background than previous, borders more visible

**Phase 70: Chat Polish (Legacy)**
- File: `70-chat-polish/70-RESEARCH.md`
- Reference for prior animation research (superseded by current spec, but useful historical context)

---

## Quick Navigation

**I need to know...**

| Question | Answer | Source |
|----------|--------|--------|
| **Exact timing for X animation?** | Look up in SPEC section 12 summary table | INTERACTION-AND-ANIMATION-SPECIFICATION.md (Section 12) |
| **Spring physics config?** | See SNAPPY, BOUNCY, GENTLE, TIGHT definitions | SPEC Section 11 |
| **How to implement Y gesture?** | Copy pattern from ROADMAP phase section | ANIMATION-IMPLEMENTATION-ROADMAP.md (Phase 75-80) |
| **What's the thinking indicator?** | 3-dot bounce, 600ms loop, 100ms stagger | SPEC Section 2 |
| **Send button feedback?** | Scale 0.92 press, haptic Medium, spring recovery | SPEC Section 4.1 |
| **Error message animation?** | Message enters normal, label +300ms delay, retry scale | SPEC Section 8.1-8.2 |
| **Drawer swipe threshold?** | 50dp pull, velocity > 0.3 px/ms, spring damping 12 | SPEC Section 5.1 + ROADMAP Phase 76-01 |
| **Reduced motion fallback?** | All springs → 50ms linear, haptics silent | SPEC Section 13 |
| **Device testing target?** | iPhone 13/14/15 (both 60Hz and 120Hz) | SPEC Section 14 |
| **Which phases implement motion?** | Phase 75 (baseline), 76-77 (gestures), 78-80 (polish) | ANIMATION-IMPLEMENTATION-ROADMAP.md |

---

## Integration Checklist

**For Phase 75 Kickoff:**
- [ ] Read ANIMATION-IMPLEMENTATION-ROADMAP.md § "Why This Matters" (context)
- [ ] Read ANIMATION-IMPLEMENTATION-ROADMAP.md § "Phase 75 (Chat Shell): Motion Baseline"
- [ ] Start with plan 75-01: copy code pattern from ROADMAP
- [ ] Verify timing against SPEC Section 1 (streaming) and Section 7 (scroll)
- [ ] Test on device (iPhone 13+)
- [ ] Iterate until feel is smooth (no jank)

**For Gesture Animations (Phase 76-77):**
- [ ] Read SPEC § "Drawer/Sidebar" (5.1-5.5)
- [ ] Read ROADMAP § "Phase 76-77 (Navigation & Drawer)"
- [ ] Implement spring physics pattern from ROADMAP
- [ ] Test velocity tracking (fast swipe vs slow swipe)
- [ ] Verify haptics fire on interaction

**For Final Polish (Phase 78-80):**
- [ ] Read ROADMAP § "Phase 78-80 (Final Polish)"
- [ ] Implement tool call stagger (SPEC § 3.3)
- [ ] Set up reduced motion hook (SPEC § 13)
- [ ] Run spring tuning session (ROADMAP § 78-03)
- [ ] Get designer feedback on feel

---

## For QA / Testing

**Animation Validation (From SPEC § 15 Checklist):**
- [ ] All animations use spring or easing, never linear bounces
- [ ] Haptics fire on release/completion, not press (except send button)
- [ ] Reduced motion tested (all animations < 100ms)
- [ ] Text streams character-by-character, not batched
- [ ] Auto-scroll throttled (300ms minimum between calls)
- [ ] Send button haptic fires before text clears
- [ ] Tool calls have stagger (+80ms per call)
- [ ] Failed messages show after 300ms delay
- [ ] Keyboard avoidance smooth (keyboardVerticalOffset: 70)
- [ ] Drawer swipe threshold 50dp, velocity > 0.3 px/ms
- [ ] Composer max 156dp (5 lines) before internal scroll
- [ ] Context menus use Radix (not custom)
- [ ] Copy feedback visible 1.5s then fade 200ms
- [ ] Long-press 500ms activation (iOS standard)
- [ ] BlurView only on Composer and modal headers
- [ ] Backdrop dimming is rgba(0, 0, 0, 0.4)

---

## Reference Implementation

Once Phase 75 baseline is complete, the `src/src/lib/animations.ts` file will become the single source of truth for all spring configs and easing curves. This file is referenced throughout the codebase (all components import timing constants from here).

Example structure:
```typescript
// src/src/lib/animations.ts
export const SPRING_SNAPPY = { damping: 24, stiffness: 300, ... };
export const SPRING_BOUNCY = { damping: 14, stiffness: 180, ... };
export const EASE_OUT_CUBIC = Easing.out(Easing.cubic);
export const ANIMATION_DURATIONS = {
  MESSAGE_ENTRY_USER: 250,
  MESSAGE_ENTRY_ASSISTANT: 150,
  SEND_BUTTON_PRESS_IN: 100,
  // ...
};
```

---

## Document History

| Date | Document | Change | Commits |
|------|----------|--------|---------|
| 2026-04-04 | INTERACTION-AND-ANIMATION-SPECIFICATION.md | Created (1217 lines) | 06a01ea |
| 2026-04-04 | ANIMATION-IMPLEMENTATION-ROADMAP.md | Created (667 lines) | 344924a |
| 2026-04-04 | MOTION-DESIGN-INDEX.md | Created (this file) | — |

---

## Questions?

- **Motion spec question:** See INTERACTION-AND-ANIMATION-SPECIFICATION.md (or ask Bard/Claude)
- **Implementation question:** See ANIMATION-IMPLEMENTATION-ROADMAP.md (or ask Claude)
- **Phase dependency question:** Ask swd (he owns the GSD timeline)
- **Device testing question:** Test on iPhone 13+ (Phase 76.1 onwards)

---

**Next:** Phase 75-01 implementation. Let's ship premium motion.
