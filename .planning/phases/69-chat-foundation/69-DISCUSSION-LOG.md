# Phase 69: Chat Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-31
**Phase:** 69-chat-foundation
**Areas discussed:** Streaming markdown, Soul doc fidelity, Auth & first launch, Session list scope, Composer behavior, Message layout details, Empty states & loading, WebSocket lifecycle on iOS

---

## Streaming Markdown — Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Validate streamdown first | Dedicate Plan 1 entirely to react-native-streamdown PoC | |
| Skip streamdown, build custom | Go straight to custom streaming renderer | |
| Parallel evaluation | Try both in Plan 1: streamdown PoC + minimal custom renderer spike | ✓ |

**User's choice:** Parallel evaluation
**Notes:** De-risks the choice early by comparing both approaches against real Claude output

## Streaming Markdown — Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Basic inline + headings | Bold, italic, inline code, headings, paragraphs, links only | |
| Full markdown minus code highlighting | Everything including lists, blockquotes, tables — without syntax highlighting | ✓ |
| Whatever streamdown supports | Let the library dictate scope | |

**User's choice:** Full markdown minus code highlighting
**Notes:** Syntax highlighting deferred to Phase 70 (Shiki). Code blocks render as unstyled monospace.

---

## Soul Doc Visual Fidelity

| Option | Description | Selected |
|--------|-------------|----------|
| Soul-compliant from the start | Every component follows NATIVE-APP-SOUL.md: springs, surfaces, dynamic color | ✓ |
| Functional first, polish later | Basic styling, no springs, no dynamic color | |
| Structural fidelity only | Surface tiers + typography from day one, basic transitions for motion | |

**User's choice:** Soul-compliant from the start (Recommended)
**Notes:** Bard disagreed — recommended 20% motion spec and deferring dynamic color. User overruled. No polish debt.

## Dynamic Color

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, from the start | Implement streaming/idle/error color states alongside messaging loop | ✓ |
| Defer to Phase 71 | Dynamic color is Phase 71 "Native Feel" scope | |
| Streaming warmth only | Just streaming state as proof of concept | |

**User's choice:** Yes, from the start
**Notes:** Consistent with Soul-compliant-from-start decision. All color states implemented.

---

## Auth & First Launch

| Option | Description | Selected |
|--------|-------------|----------|
| Server URL + API key entry | Settings-style screen with URL + key fields | |
| Auto-connect with token prompt | Auto-detect Tailscale backend, only ask for JWT | ✓ |
| Deep link / QR code from web | Generate token link in web app, scan on iPhone | |

**User's choice:** Auto-connect with token prompt
**Notes:** Minimal friction. Manual URL override available in Settings as fallback.

## Connection Banner

| Option | Description | Selected |
|--------|-------------|----------|
| Soul-doc compliant banner | Glass surface, Navigation spring, destructive tint, auto-dismiss | ✓ |
| Minimal text banner | Simple colored bar, functional but not Soul-doc level | |

**User's choice:** Soul-doc compliant banner

---

## Session List Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Core list + grouping + create | Grouped by project, create button, swipe-to-delete. No search/pinned/pull-to-refresh | |
| Full Soul doc session list | Everything: grouped, pinned, search, swipe-to-delete, staggered animations, pull-to-refresh | ✓ |
| Minimal working list | Flat list, create button, tap to switch | |

**User's choice:** Full Soul doc session list

## New Session Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Button in drawer + project picker | "New Chat" button → project selection sheet → new chat screen | ✓ |
| Button in drawer, default project | Creates session in default project immediately | |
| Floating action button | FAB on chat screen | |

**User's choice:** Button in drawer + project picker

---

## Composer Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Full Soul doc composer | Glass backdrop, expanding multi-line, send/stop toggle, attachment placeholder, status bar | ✓ |
| Functional composer, full styling later | Text input + send button, correct colors, no glass/attachment/status bar | |
| Full minus glass + attachment | Send/stop toggle, expanding, status bar. Skip glass and attachment. | |

**User's choice:** Full Soul doc composer
**Notes:** Glass backdrop preferred but falls back to opaque surface-raised if FPS issues. Attachment button present but non-functional.

## Empty States

| Option | Description | Selected |
|--------|-------------|----------|
| Branded welcome with suggestions | Logo, greeting, suggestion chips | |
| Minimal prompt | Centered "Start a conversation" text | |
| Soul-doc contextual | Provider avatar + model name + "How can I help?" + project context if available | ✓ |

**User's choice:** Soul-doc contextual

---

## Message Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Full Soul doc spec | User bubbles, assistant free-flowing, 24px avatar, turn spacing, timestamps on 5-min gaps | ✓ |
| Full minus timestamps + avatars | Correct layout/spacing/springs, skip avatars and timestamp logic | |
| Full minus long-press context menu | All visual layout, skip Copy/Retry/Share menu | |

**User's choice:** Full Soul doc spec
**Notes:** Long-press context menu (Copy/Retry/Share) deferred to Phase 71 as gesture scope. Timestamps show on 5-min gaps only (no long-press reveal in Phase 69).

## WebSocket Lifecycle

| Option | Description | Selected |
|--------|-------------|----------|
| Full AppState integration | Background: disconnect after 30s. Foreground: reconnect with backoff. Partial stream persistence. | ✓ |
| Simple foreground reconnect | Let iOS kill connection, reconnect on foreground, no partial stream recovery | |
| Full with background keep-alive | expo-task-manager to keep WS alive 30s after backgrounding | |

**User's choice:** Full AppState integration
**Notes:** Partial messages persist to Zustand/MMKV. Show "interrupted" state on foreground return. User can retry.

---

## Claude's Discretion

- Markdown renderer internal architecture (AST walker vs regex vs hybrid)
- FlashList vs FlatList for message list
- WebSocket message buffering strategy during reconnection
- Project selection sheet UI pattern (bottom sheet vs modal vs inline)

## Deferred Ideas

- Syntax-highlighted code blocks (Phase 70)
- Long-press context menu Copy/Retry/Share (Phase 71)
- Haptic pairing (Phase 71)
- Tool cards (Phase 70)
- Thinking block disclosure (Phase 70)
- File attachment functionality (Phase 70+)
- Multiple providers (Phase 72+)
- Push notifications (Phase 72)
- Deep linking (Phase 72)
- Share sheet (Phase 73)
