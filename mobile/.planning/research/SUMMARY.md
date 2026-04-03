# Research Summary: Loom v3.0 Chat UI Reference Implementations

**Domain:** AI Chat iOS App (React Native + Expo)
**Researched:** 2026-04-02
**Overall confidence:** MEDIUM-HIGH

## Executive Summary

The open-source ecosystem for ChatGPT/Claude-style iOS chat apps is surprisingly thin on high-quality, complete React Native implementations. Most repos are tutorial-grade (Galaxies-dev: 284 stars, 24 commits) or learning projects (jedwards1230/myChat: WIP). The two standout React Native projects are **aws-samples/swift-chat** (769 stars, actively maintained, RN 0.83, real streaming) and **dabit3/react-native-ai** (1.3k stars, multi-provider framework with theming). Neither is a pixel-perfect ChatGPT clone, but both demonstrate proven patterns for streaming chat, markdown rendering, and multi-provider architecture.

The real gold is in the **component library ecosystem**, not complete app clones. `react-native-keyboard-controller` (3.5k stars) solves the hardest chat UX problem (keyboard avoidance) with its `KeyboardChatScrollView`. `legend-list` (3k stars) eliminates the inverted FlatList anti-pattern with `alignItemsAtEnd` and `maintainScrollAtEnd`. `react-native-streamdown` (185 stars, Software Mansion) is purpose-built for LLM markdown streaming but only supports CommonMark (no GFM tables -- confirming Phase 69's decision to use react-native-enriched-markdown directly). FlashList v2 from Shopify provides `maintainVisibleContentPosition` with `startRenderingFromBottom` for chat, though there are reported pagination regressions.

For design reference, **Mobbin** has catalogued both ChatGPT and Claude iOS screens with interactive flows. The SwiftUI ecosystem has higher-quality design implementations: **exyte/Chat** (1.7k stars) demonstrates polished message cells, media picker, reply-to-message, and swipe actions. The GAIA UI composer component documents the exact auto-growing textarea + file attachment + tool selector pattern that ChatGPT uses. These are not usable code for RN, but they are usable **design blueprints**.

The biggest finding: Loom's current approach of building from scratch is not wrong -- it's the only path to the Soul doc's vision. But the mistake was not studying these implementations *before* building. The patterns below should inform a UI polish pass.

## Key Findings

**Stack:** Use `react-native-keyboard-controller` (KeyboardChatScrollView) + `legend-list` (alignItemsAtEnd) + `react-native-reanimated` layout animations + custom composer. Do NOT adopt react-native-gifted-chat (wrong abstraction for AI chat).

**Architecture:** Message list should use `legend-list` with `alignItemsAtEnd` + `maintainScrollAtEnd` instead of inverted FlatList. Composer should be a standalone component with auto-growing TextInput, send button state machine, and attachment preview row.

**Critical pitfall:** Inverted FlatList causes 30-40 FPS drops on Android and weird animation behavior. Legend-list eliminates this entirely with bottom-alignment without inversion.

## Implications for Roadmap

Based on research, the UI polish work should be structured as:

1. **Chat Infrastructure Upgrade** - Replace inverted FlatList with legend-list or FlashList v2
   - Addresses: scroll performance, message animations, bottom-alignment
   - Avoids: inverted list performance pitfall

2. **Composer Redesign** - Study GAIA UI and ChatGPT patterns for auto-growing input + send button + attachment row
   - Addresses: composer UX, keyboard avoidance, multiline input
   - Avoids: keyboard fighting, fixed-height input trap

3. **Message Bubble Polish** - Apply Reanimated entering animations, proper bubble styling from exyte/Chat patterns
   - Addresses: message appearance, visual hierarchy, streaming indicator
   - Avoids: static/flat message rendering

4. **Session List & Drawer Polish** - Study Galaxies-dev drawer pattern + ChatGPT sidebar design
   - Addresses: session management UX, drawer animation
   - Avoids: generic drawer without chat-specific features

**Phase ordering rationale:**
- Infrastructure (list component) must come first because it affects everything else
- Composer is the highest-touch surface -- users interact with it every message
- Message bubbles benefit from the new list component's animation support
- Drawer is lower priority since it's already functional

**Research flags for phases:**
- List migration: Needs testing -- legend-list v2 is relatively new (Dec 2025), verify Expo SDK 54 compatibility
- Keyboard handling: react-native-keyboard-controller v1.21.3 is stable, but had Expo 52 crash reports -- verify on current SDK
- Streaming markdown: Phase 69 already chose react-native-enriched-markdown, which is correct (streamdown lacks GFM)

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Reference repos | HIGH | Directly verified GitHub repos, star counts, and activity |
| Component libraries | HIGH | Verified via GitHub + npm, active maintenance confirmed |
| Design patterns | MEDIUM | Based on Mobbin, GAIA UI docs, and Swift implementations -- not RN-specific |
| Performance claims | MEDIUM | Legend-list and FlashList v2 claims need Loom-specific verification |
| Keyboard controller | MEDIUM | Stable library but Expo compat reports are mixed -- needs testing |

## Gaps to Address

- No high-quality open-source React Native app perfectly replicates ChatGPT/Claude iOS -- design must come from screenshot study + Soul doc
- Legend-list + Expo SDK 54 compatibility not verified in production
- react-native-keyboard-controller KeyboardChatScrollView behavior with custom composers needs testing
- Stream Chat RN SDK has good AI features but is a paid service -- patterns are learnable, code is not reusable
