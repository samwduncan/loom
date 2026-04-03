# Phase 70: UI Rebuild — Research

**Researched:** 2026-04-02 / 2026-04-03
**Confidence:** HIGH (based on cloned source code analysis from 5 repos)
**Location:** `mobile/.planning/research/` (9 files, 152KB)

## Research Index

All research lives in `mobile/.planning/research/`. Read in this order:

1. **BARD-PRIME-DEEP-DIVE.md** (60KB) — START HERE. Code snippets from 5 cloned repos: Galaxies-dev drawer, legend-list chat, GAIA UI composer, keyboard-controller. Copy-paste ready.
2. **REFERENCE-APP-TEARDOWN.md** (7KB) — ChatGPT vs Claude iOS design tokens, colors, spacing, typography, composer anatomy, session list organization.
3. **README.md** (9KB) — Quick reference with implementation checklist, library installation commands, code patterns.
4. **CHAT-UI-RESEARCH.md** (22KB) — Open-source clones, library recommendations, design system references.
5. **PITFALLS.md** (9KB) — 13 pitfalls ranked by severity. Critical: inverted FlatList, keyboard fighting, gifted-chat lock-in, streaming re-render storm.
6. **ARCHITECTURE.md** (11KB) — Component hierarchy, storage patterns, anti-patterns.
7. **FEATURES.md** (7KB) — Table stakes vs differentiators feature matrix.
8. **STACK.md** (5KB) — Technology recommendations with rationale.
9. **SUMMARY.md** (6KB) — Executive summary of all research.

## Key Technical Decisions (from research)

| Decision | Choice | Alternative | Why |
|----------|--------|-------------|-----|
| Message list | legend-list (`alignItemsAtEnd`) | FlashList v2, inverted FlatList | Eliminates inversion anti-pattern, 3-line change |
| Keyboard | react-native-keyboard-controller | RN KeyboardAvoidingView | Cross-platform, 120Hz, `translate-with-padding` |
| Context menus | Zeego | react-native-ios-context-menu | Zeego wraps native UIContextMenuInteraction, simpler API |
| Bottom sheet | @gorhom/bottom-sheet | react-native-modal | Gesture-driven, Reanimated powered |
| Markdown | react-native-enriched-markdown | streamdown | Enriched has GFM tables, streamdown is CommonMark only |

## Libraries to Install

```bash
npm install @legendapp/list react-native-keyboard-controller zeego
# Optional:
npm install @gorhom/bottom-sheet react-native-shimmer-placeholder
```

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| legend-list Expo SDK 54 compat | LOW | HIGH | Pure TS, no native modules. Test in isolation first. |
| keyboard-controller crash | LOW | HIGH | v1.21.3 stable, Expo 52 crash was gifted-chat combo. We don't use gifted-chat. |
| Scope creep into Phase 71 territory | MEDIUM | MEDIUM | STRICT boundary: no haptics, no spring physics on transitions, no gestures beyond basic tap. Clone first, then elevate. |
| Device testing blocked (no Apple Developer) | HIGH | HIGH | Use Expo Go for basic validation. Real device build requires enrollment. |
