---
gsd_state_version: 1.0
milestone: v2.2
milestone_name: "The Touch"
status: Ready to execute
stopped_at: Completed 67.1-03-PLAN.md
last_updated: "2026-03-30T01:40:22.218Z"
progress:
  total_phases: 6
  completed_phases: 4
  total_plans: 16
  completed_plans: 14
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-28)

**Core value:** Make AI agent work visible, beautiful, and controllable
**Current focus:** Phase 67.1 — ios-bug-fixes

## Current Position

Phase: 67.1 (ios-bug-fixes) — EXECUTING
Plan: 4 of 5

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: --
- Total execution time: 0 hours

## Accumulated Context

### Decisions

- [v2.2] Scroll performance is Phase 64 (first) -- #1 blocker, everything else meaningless if scrolling broken
- [v2.2] Fix architecture, NOT add virtualization -- JS execution is bottleneck, not DOM size (research confirms)
- [v2.2] SCROLL-06 first internally: delete dead useScrollAnchor.ts before modifying scroll system
- [v2.2] Custom gesture hooks (useSwipeAction, usePullToRefresh, useLongPress), NOT @use-gesture/react -- research recommends custom but GESTURE-07 requirement stands
- [v2.2] 4 new Capacitor plugins: @capacitor/app, @capacitor/clipboard, @capacitor/share, @capacitor/action-sheet
- [v2.2] OLED true black only on outermost background -- surface hierarchy preserved for depth
- [Phase 64]: content-visibility: auto REMOVED from messages -- caused scroll jumping with variable heights. Browser renders all items at natural height.
- [Phase 64]: Infinite scroll anchor restoration uses useLayoutEffect (not rAF) -- fires after DOM mutation before paint
- [Phase 64]: overflow-x: hidden on message list scroll container -- prevents code block horizontal scroll on iOS
- [Phase 64]: Virtualization NOT needed -- 60fps at 50+ messages on iPhone 16 Pro Max confirmed
- [Phase 64]: ActiveMessage finalization reflow deferred by rAF + 50ms setTimeout (D-12)
- [Phase 64]: overscroll-behavior: none on html/body, .native-scroll omits for iOS rubber band bounce
- [Phase 65]: D-05 supersedes TOUCH-07: ring-[3px] ring-ring/50 replaces ring-2 as standard
- [Phase 65]: SkipLink.tsx excluded from focus ring sweep -- uses focus:ring-2 for programmatic focus a11y
- [Phase 65]: All focus rings standardized to 3px oklch (shadcn pattern) -- replaced 2px var(--accent-primary) in sidebar.css and tool-card-shell.css
- [Phase 65]: Playwright touch target test uses CSS class injection for streaming-dependent components -- avoids needing real backend streaming
- [Phase 66]: Token override on :root in tokens.css media query (not selector in base.css) to avoid specificity battle with streaming-markdown.css
- [Phase 66]: CodeBlock desktop size intentionally reduced 14px->13px (--text-code) per D-03; prior 14px was artifact of generic text-sm class
- [Phase 66]: TYPO-02/03/05/08 all pass without code changes -- verify-first approach confirmed existing implementations are compliant
- [Phase 66]: V2_CONSTITUTION Section 14 (Typography) documents all conventions including --text-code :root override strategy
- [Phase 67]: All Capacitor plugins installed as production deps (not devDependencies) to avoid tree-shaking in iOS builds
- [Phase 67]: hapticEvent centralized grammar with 7 named events maps to underlying impact/notification/selection functions
- [Phase 67]: useAppLifecycle debounces at 300ms to prevent reconnection storms on rapid iOS foreground/background cycles
- [Phase 67]: Retry uses wsClient.send with claude-command matching ChatComposer send format -- ensures backend processes retry identically
- [Phase 67]: No user-select:none on ContextMenuTrigger -- text selection preserved, Radix handles long-press via native contextmenu event
- [Phase 67]: Export handler shares title+ID via nativeShare (not full markdown); SessionContextMenu deprecated; Radix ContextMenu for long-press context menus
- [Phase 67]: Haptic on sidebar toggle buttons only (not swipe-to-close or programmatic auto-close) per D-02
- [Phase 67.1]: Accessory bar hidden (isVisible: false) -- Done button row visually intrusive on iPhone
- [Phase 67.1]: Haptics diagnostic console.log added for Xcode debugging (not console.warn)
- [Phase 67.1]: Direction change: kill swipe-to-delete, use context menus like ChatGPT/Claude iOS. Full-width swipe-to-close on sidebar restored.
- [Phase 67.1]: Design benchmark: ChatGPT iOS and Claude iOS for density, spacing, interaction patterns. Stop inventing, copy what works.
- [Phase 67.1]: getBoundingClientRect for edge zone detection (not raw clientX) -- reliable regardless of sidebar transform state
- [Phase 67.1]: z-[var(--z-sticky)] for intra-component z-index elevation on delete button (per loom/no-raw-z-index ESLint rule)
- [Phase 67.1]: useEffect to sync onLongPress ref (not direct assignment during render) -- react-hooks/refs ESLint rule
- [Phase 67.1]: No e.preventDefault() in useLongPress touchstart -- preserves vertical scrolling, CSS handles text selection suppression
- [Phase 67.1]: data-long-press-target on session items only (not messages) -- preserves text selection on message content
- [Phase 67.1]: .popover-menu-item class in base.css (not .context-menu-item) -- avoids cascade conflict with sidebar.css

### Roadmap Evolution

- Phase 67.1 inserted after Phase 67: iOS Bug Fixes (URGENT) -- 8 open Forgejo issues (#2-#10) from device testing

### Pending Todos

- Phase 67 Task 2: Real-device validation of all GESTURE requirements

### Blockers/Concerns

- Can't see iOS app directly from Linux -- depend on user feedback and Claude Relay for Mac testing
- Safari Web Inspector debugging requires Mac connection
- 120Hz spring tuning, scroll perf, and gesture validation all require real device
- Long-press context menu must avoid conflicting with iOS text selection (see research PITFALLS.md)

## Session Continuity

Last session: 2026-03-30T01:40:22.215Z
Stopped at: Completed 67.1-03-PLAN.md
Resume: Approve 67-04 Task 2 checkpoint, then proceed to Phase 68
