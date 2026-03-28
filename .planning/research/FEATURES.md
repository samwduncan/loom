# Feature Landscape: iOS-Native UX Patterns for v2.2 "The Touch"

**Domain:** iOS-native UX for a chat/coding agent app (Capacitor WKWebView)
**Researched:** 2026-03-28
**Platform:** iPhone 16 Pro Max, iOS 17+, Capacitor 7.6.1
**Reference Apps:** iMessage, WhatsApp, Telegram, Slack, Discord, GitHub Mobile, Blink Shell, Working Copy

---

## Table Stakes

Features users expect from any quality iOS app. Missing = "this feels like a website in a wrapper."

| # | Feature | Why Expected | Complexity | Dependencies | Notes |
|---|---------|--------------|------------|--------------|-------|
| TS-1 | Swipe-to-delete on session list | Every iOS list app (Mail, Reminders, Notes, WhatsApp) uses this. Users will try it within 10 seconds of opening the sidebar. | Medium | SessionItem, SessionList | NNGroup research: limit swipe to genuinely destructive ops only. Left-swipe reveals red delete button. Requires tap to confirm -- never auto-delete on swipe alone. CSS transform on touch events, spring back if released early. |
| TS-2 | Long-press context menu on sessions | Apple HIG: long-press is THE discoverability mechanism for secondary actions on iOS. Users long-press everything instinctively. | Medium | SessionItem, SessionContextMenu (exists, right-click only) | Current context menu triggers on `onContextMenu` (right-click/two-finger tap). Need touch-native equivalent: 500ms hold triggers same menu at touch point. Apple HIG says: keep to <5 items, always make items available elsewhere too. |
| TS-3 | Long-press context menu on messages | iMessage, WhatsApp, Telegram, Discord ALL have this. Expected actions: Copy Text, Retry/Resend. | Medium | AssistantMessage, UserMessage, MessageContainer | Discord: long-press -> Copy Text. iMessage: long-press -> Tapback reactions + actions. WhatsApp: long-press -> select mode with toolbar. Loom should: long-press -> Copy Text + Retry + Share. |
| TS-4 | Pull-to-refresh on session list | Universal iOS pattern since iOS 6. Users pull down on ANY scrollable list expecting refresh behavior. | Medium | SessionList | Custom JS implementation needed -- WKWebView rubber-band bounce exists natively, but overscroll must be intercepted to trigger reload. Show spinner animation + haptic on completion. |
| TS-5 | Status bar tap-to-scroll-top | Users tap iOS status bar expecting content to scroll to top. Deeply ingrained muscle memory since iPhone OS 1.0. | Low | MessageList, useScrollAnchor | Capacitor provides `window.addEventListener('statusTap', ...)` event. Wire to `scrollContainerRef.scrollTo({ top: 0, behavior: 'smooth' })`. Five lines of code. |
| TS-6 | Rubber band / bounce scroll preserved | WKWebView provides this natively. Do NOT disable it -- users expect overscroll bounce on every scrollable surface. | None | Already works | Verify no CSS `overscroll-behavior: none` on scroll containers. Note: v2.1 research recommended disabling page-level bounce -- this was correct for the app shell body, but individual scroll containers (session list, message list) must bounce. |
| TS-7 | Momentum scroll with deceleration | WKWebView provides inertial scrolling natively. Must not be broken by JS scroll handlers or IntersectionObserver logic. | None | useScrollAnchor | Verify rAF-based scroll-to-bottom and IntersectionObserver don't call `preventDefault()` on touch events. Already likely working correctly. |
| TS-8 | Code block copy button (touch-sized) | Existing copy button on CodeBlock uses desktop sizing. On mobile, must be >= 44px touch target and easy to hit with a thumb. | Low | CodeBlock.tsx | Already has Copy/Check icon swap. Just needs `min-h-[44px] min-w-[44px]` at mobile breakpoint. Also: position copy button at top-right where thumb naturally rests. |
| TS-9 | Haptic feedback on gesture completions | iOS users expect haptic confirmation for: swipe-to-delete reveal, pull-to-refresh complete, context menu open, navigation transitions. | Low | haptics.ts (exists, fully functional) | Haptics infrastructure exists with impact/notification/selection types. Add calls at new gesture completion points. `hapticImpact('Light')` for swipe reveal, `hapticNotification('Success')` for refresh complete, `hapticSelection()` for context menu open. |
| TS-10 | Edge-swipe sidebar open (left edge pan) | iOS standard navigation: pan from left edge opens sidebar/drawer. | None | Sidebar.tsx | Already implemented with touchstart/touchmove/touchend handlers. Has proper left-edge detection. Verify smooth operation on real device. |
| TS-11 | Input focus smooth transition | Tapping composer: keyboard rises, content adjusts, no layout jump, no double-shift. | Low | Composer, native-plugins.ts | Keyboard plugin configured with native Body resize mode. `setAccessoryBarVisible(true)` for Done button. Verify no double-offset from `useKeyboardOffset` hook + native resize. The v2.1 fix already removed manual `--keyboard-offset` in favor of native resize. |
| TS-12 | Text selection on message content | Users must be able to select and copy arbitrary text from assistant messages. iOS native selection with magnifying glass and blue handles. | Low | AssistantMessage, MarkdownRenderer | WKWebView provides native text selection by default. Ensure no `-webkit-user-select: none` on message content. Code blocks are correctly handled by the Copy button (whole-block copy). |

---

## Differentiators

Features that set Loom apart from generic chat apps on iOS. Not expected, but create "this feels better than native" moments.

| # | Feature | Value Proposition | Complexity | Dependencies | Notes |
|---|---------|-------------------|------------|--------------|-------|
| D-1 | Swipe-to-reply on messages | WhatsApp, Telegram, iMessage (iOS 17+) all support right-swipe on a message to quote-reply. Would make Loom feel like a real messaging app rather than a web wrapper. | High | MessageList, Composer, MessageContainer | Right-swipe on message: bubble slides ~60px, reply arrow icon appears, message gets quoted in composer. Requires: touch gesture tracking per message, composer "replying to" state, visual quote indicator, and backend support for reply context. **Blocker: backend/Claude SDK may not support reply threading. Verify before committing.** |
| D-2 | Share sheet integration | Share code blocks or conversation excerpts via iOS native share sheet. No other AI coding chat app does this well on mobile. | Medium | @capacitor/share (not yet installed), CodeBlock, AssistantMessage | Capacitor Share API: `Share.share({ title, text, url })`. Use cases: share a code block to Slack/Notes, share conversation excerpt to email. Wire into long-press context menu as "Share..." option. Needs `npm install @capacitor/share`. |
| D-3 | Keyboard accessory toolbar | Custom toolbar above keyboard with quick actions: @-mention trigger, slash-command trigger, image attach, model picker. Replaces the default "Done" button. | High | Composer, native-plugins.ts, @capacitor/keyboard | In WKWebView, cannot inject native InputAccessoryView from JS. Two options: (a) fixed-position div tracking keyboard height -- simple but not truly native feeling, or (b) custom Capacitor plugin wrapping UIKit InputAccessoryView -- native but requires Swift code. **Recommend option (a) since keyboard resize mode is already native. Low priority unless current composer toolbar feels deficient.** |
| D-4 | Code block horizontal scroll with snap | When viewing code on mobile, horizontal swipe has momentum and optionally snaps to indentation levels for readability. | Medium | CodeBlock | CSS `scroll-snap-type: x proximity` on the pre/code container. Momentum is native in WKWebView. Unique to Loom -- most chat apps show truncated code or wrap lines. |
| D-5 | Spring-physics navigation transitions | Push/pop page transitions with spring animation matching native iOS UINavigationController feel. New view slides from right, old slides left with parallax. | High | React Router, AppShell layout | Requires shared layout animation wrapper around route transitions. CSS transform + cubic-bezier spring approximation, or Framer Motion `AnimatePresence`. **High complexity for moderate payoff in a single-view app.** Best for sidebar open/close and modal presentation, not session-to-session switching. |
| D-6 | Contextual haptic language | Different haptic signatures for different action types, creating a consistent "language" of touch feedback throughout the app. | Low | haptics.ts | Map: `Light` impact = selection/navigation changes, `Medium` impact = action confirmation (delete, pin), `Heavy` impact = destructive warning, `Success` notification = task/send complete, `Warning` = permission needed, `Error` = failure. Infrastructure exists -- just needs consistent policy and application across all touch points. |
| D-7 | Inline code block expand to full-screen | On mobile, long code blocks are cramped at chat-width. Tap to expand into a full-screen sheet with proper scroll, line numbers, and syntax highlighting. | Medium | CodeBlock, UI (bottom sheet) | Bottom sheet / modal presentation with full-screen code view. Close by swipe-down or tap-X. Similar to GitHub Mobile's file viewing. Allows comfortable code review on phone. |
| D-8 | Two-direction swipe on session list | Swipe right to pin/unpin. Swipe left to delete. Two-direction swipe increases action density and discoverability. | Medium | SessionItem, SessionList | Telegram pattern: right-swipe reveals Pin/Read, left-swipe reveals Mute/Delete/Archive. Extends TS-1 into a richer gesture. Pin action is already in context menu -- swipe makes it faster. |
| D-9 | Sticky date headers during message scroll | As user scrolls through messages, date headers stick to top of viewport -- like iMessage conversation dates. | Medium | MessageList | Requires date-boundary detection in message list and `position: sticky` headers. iMessage does this for day boundaries. Loom could do it for date groups or significant time gaps between turns. Helps orientation in long conversations. |
| D-10 | Tap code block to copy (whole block) | Instead of finding the small copy button, tap anywhere on the code block to copy with haptic + brief "Copied" toast. | Low | CodeBlock | Quick-tap = copy to clipboard with `hapticNotification('Success')`. Not a replacement for the button (accessibility), but a convenience gesture. Must not conflict with text selection -- use a short-tap threshold (<300ms). |

---

## Anti-Features

Features to explicitly NOT build. Common mistakes in iOS web-app-to-native conversions.

| # | Anti-Feature | Why Avoid | What to Do Instead |
|---|--------------|-----------|-------------------|
| AF-1 | Custom scroll physics / JS scroll override | WKWebView scroll physics are pixel-perfect. Any JavaScript interference with `touchmove` events or custom inertia makes scrolling feel "off." Users detect non-native scroll within milliseconds. | Let WKWebView handle all scroll physics. Only add IntersectionObserver for bottom-lock (already done). Never `preventDefault()` on touchmove for scroll containers. |
| AF-2 | Swipe gesture for non-destructive actions on messages | NNGroup research: users associate swipe-to-reveal with destructive actions (delete, archive). Spotify's "save" via left-swipe was documented as a UX failure -- users expected delete. | Use long-press context menu for non-destructive secondary actions on messages. Swipe-to-reply is the ONE exception (WhatsApp/Telegram trained this pattern). |
| AF-3 | Peek-and-pop / 3D Touch preview | 3D Touch hardware removed since iPhone 11. Haptic Touch is functionally just long-press. Building "peek" previews adds significant complexity for near-zero benefit. | Long-press context menu without preview. Apple HIG says previews are optional and should show "condensed version of actual content." For sessions, the title IS the content -- a preview adds nothing. |
| AF-4 | Custom text selection handles | WKWebView provides native iOS text selection (magnifying glass, blue handles, callout bar). Any CSS or JS override will feel immediately wrong. | Ensure `-webkit-user-select: text` on message content areas. Let iOS handle selection natively. Only suppress selection on UI chrome (buttons, headers, navigation) with `-webkit-user-select: none`. |
| AF-5 | Gesture-only actions without visible alternatives | Apple HIG: "Gesture shortcuts should supplement, not replace, interface-based navigation." Making actions ONLY available via gesture = hidden functionality = frustrated users. | Every swipe-to-delete must ALSO be in the long-press context menu. Every pull-to-refresh must have an API-accessible refresh somewhere. Gestures are shortcuts, not primary interfaces. |
| AF-6 | Bottom tab bar navigation | Loom is a single-view chat app with sidebar drawer, not a multi-tab app. Adding a tab bar wastes precious vertical space on iPhone and fights with the keyboard area. | Keep sidebar drawer pattern. Use existing panel tabs (Chat, Files, Terminal, Git) in the layout header. |
| AF-7 | Pull-to-refresh on chat message area | Chat messages use scroll-to-load-more (pagination upward) and bottom-lock for streaming. Pull-to-refresh here would conflict with both patterns and confuse users. | Pull-to-refresh ONLY on session list sidebar. Chat area uses scroll-up for history loading (existing pagination) and scroll-down for streaming (existing bottom-lock). |
| AF-8 | Share sheet on everything | Over-sharing makes the share sheet feel spammy and reduces its value. Most message content is context-dependent and meaningless when shared out of context. | Share sheet on: code blocks (useful to share to Slack/Notes) and full conversation export. NOT on: individual text messages, tool call results, thinking blocks, permission banners. |
| AF-9 | Animated transitions on every navigation | Spring-physics transitions on every route change (including session-to-session within chat view) would make the app feel sluggish. Instant switching is faster and what users want for same-context navigation. | Instant session switching (current behavior is correct). Spring animations only for: sidebar drawer open/close, modal presentation (settings, command palette), sheet expand (code viewer). |
| AF-10 | Disabling WKWebView back gesture | Capacitor allows disabling the native swipe-back gesture. Don't -- it's the user's escape hatch if the app gets stuck. It also provides a familiar navigation pattern. | Keep WKWebView back gesture enabled. The sidebar swipe-to-close handles left-edge pans when sidebar is open. When sidebar is closed, iOS back gesture does nothing harmful (SPA, no history to pop back to). |

---

## Feature Dependencies

```
TS-1 (Swipe-to-delete) --> TS-9 (Haptics on gesture completion)
TS-2 (Long-press sessions) --> TS-9 (Haptics on menu open)
TS-3 (Long-press messages) --> TS-12 (Text selection -- must not conflict)
TS-4 (Pull-to-refresh) --> TS-9 (Haptics on refresh complete)
TS-4 (Pull-to-refresh) --> TS-6 (Rubber band scroll -- overscroll provides gesture surface)

D-1 (Swipe-to-reply) --> TS-3 (Long-press messages -- gesture conflict resolution needed)
D-2 (Share sheet) --> TS-3 (Long-press messages -- "Share" as context menu item)
D-2 (Share sheet) --> TS-8 (Code block copy -- "Share" alongside Copy button)
D-3 (Keyboard accessory) --> TS-11 (Input focus -- must not cause double-offset)
D-7 (Code expand) --> TS-8 (Code block copy -- expanded view retains copy)
D-8 (Two-direction swipe) --> TS-1 (Swipe-to-delete -- extends the gesture system)
D-9 (Sticky dates) --> TS-7 (Momentum scroll -- sticky headers must not break momentum)
D-10 (Tap to copy) --> TS-8 (Code block copy -- same action, different trigger)
```

### Critical Conflict: Long-press vs Text Selection (TS-3 vs TS-12)

Long-press on messages conflicts with iOS native text selection. Resolution strategy from reference apps:

- **iMessage**: Long-press triggers Tapback menu, suppresses text selection. Separate "Copy" in context menu copies whole message.
- **WhatsApp**: Long-press selects message (highlight + toolbar). Text selection via separate "Select Text" action.
- **Discord**: Long-press opens action sheet. Copy is whole-message only. No granular text selection.
- **Telegram**: Long-press opens context menu. "Copy" copies full message text. "Select" enters selection mode.

**Recommendation for Loom:** Long-press on the message **container** (padding/background area) triggers context menu. iOS native text selection works on the **text content** itself (via `-webkit-user-select: text`). Implementation: attach the long-press handler to the `MessageContainer` wrapper div, NOT to the text content elements. Set `-webkit-user-select: none` on the container but `-webkit-user-select: text` on `.markdown-content` and code content. This way: long-press on whitespace/padding = context menu, long-press on text = native selection. Both patterns coexist.

### Critical Conflict: Swipe-to-reply vs Sidebar Edge Pan (D-1 vs TS-10)

Right-swipe on a message could trigger sidebar open if the touch starts near the left edge.

**Resolution:** Swipe-to-reply starts on a message bubble (centered in viewport, typically 50-350px from left edge). Sidebar edge pan starts within 20px of screen edge. These are spatially separated. Gesture recognizer should check `touchStart.clientX > 30` before allowing swipe-to-reply. No actual conflict exists if edge detection is correct.

---

## MVP Recommendation

### Phase 1: Table Stakes Gestures (must-have for "feels native")

Priority order based on user expectation frequency:

1. **TS-1: Swipe-to-delete on sessions** -- Highest single-impact feature. Users will try this within seconds. Left-swipe reveals red Delete button with spring-back animation. Haptic on reveal. ~4-6h.
2. **TS-2: Long-press context menu on sessions** -- Mobile replacement for right-click. Same actions (Pin, Rename, Select, Delete) in a popover at touch point. ~3-4h.
3. **TS-4: Pull-to-refresh on session list** -- Spinner + haptic + session reload. Rubber band overscroll provides gesture surface. ~4-6h.
4. **TS-5: Status bar tap-to-scroll-top** -- 5 lines of code via Capacitor `statusTap` event. Near-zero effort, high polish signal. ~0.5h.
5. **TS-9: Haptics on all new gestures** -- Wire haptics.ts into swipe reveal, pull-to-refresh, context menu. Cohesive tactile feedback. ~2h.

### Phase 2: Message Interactions

6. **TS-3: Long-press context menu on messages** -- Copy Text, Retry, Share. Popover or bottom sheet. Text selection conflict resolution. ~4-6h.
7. **TS-8: Code block copy button sizing** -- 44px touch target on mobile breakpoint. CSS-only fix. ~1h.
8. **TS-12: Text selection verification** -- Audit `-webkit-user-select` rules, fix any suppressions on message content. ~1h.

### Phase 3: Differentiators

9. **D-2: Share sheet** -- Install `@capacitor/share`, wire to code block and message context menus. ~3-4h.
10. **D-6: Contextual haptic language** -- Define and document haptic policy, apply consistently. ~2h.
11. **D-7: Inline code block expand** -- Bottom sheet with full-screen code view, swipe-to-dismiss. ~4-6h.
12. **D-10: Tap code block to copy** -- Quick-tap = clipboard + haptic + toast. ~2h.

### Defer to v2.3+

- **D-1 (Swipe-to-reply)**: High complexity (8-12h), requires backend support for reply threading that likely does not exist in the Claude SDK session protocol. Research backend capability first.
- **D-3 (Keyboard accessory toolbar)**: Risk of conflicting with native keyboard resize mode. Current composer with @-mentions and slash commands is already functional. Feasibility research needed before committing.
- **D-5 (Spring navigation transitions)**: High complexity (10-16h), modest payoff for a single-view chat app. Better suited for a dedicated polish milestone.
- **D-8 (Two-direction swipe)**: Nice extension of TS-1 but doubles gesture implementation complexity. Implement swipe-left-to-delete first, evaluate whether right-swipe adds enough value.
- **D-9 (Sticky date headers)**: Requires message list restructuring to insert date boundary elements. Medium complexity with moderate UX value. Better done during a message list refactor.

---

## Implementation Patterns from Reference Apps

### iMessage (most relevant pattern for Loom's chat UX)
- **Long-press message:** Context menu with Tapback reactions row + Copy / Reply / Forward / Delete
- **Swipe right on message:** Reply (iOS 17+, same as WhatsApp)
- **Chat list:** Swipe left for Delete / Pin / Mute. No pull-to-refresh (search bar reveals on pull-down instead)
- **Status bar tap:** Scroll to top of conversation
- **Keyboard:** Standard iOS keyboard, no accessory toolbar beyond autocorrect bar
- **Navigation:** Push/pop with spring animation between conversation list and chat view
- **Text selection:** Not available in message bubbles -- Copy from context menu only

### WhatsApp
- **Long-press message:** Enters selection mode -- message highlighted, top toolbar appears with Reply / Forward / Star / Delete / More
- **Swipe right on message:** Reply with quote (with haptic confirmation at ~60px threshold)
- **Chat list:** Swipe left for More (Pin/Archive) or Delete. Long-press for multi-select
- **Code blocks:** Not applicable (no syntax highlighting)
- **Navigation:** Standard push/pop between chat list and conversation

### Telegram (most gesture-rich reference)
- **Long-press message:** Context menu with Reply / Edit / Copy / Pin / Forward / Delete / Select
- **Swipe right on message:** Reply (with elastic drag and haptic)
- **Chat list swipe right:** Pin / Read toggle
- **Chat list swipe left:** Mute / Delete / Archive (three action buttons)
- **Edge swipe:** Standard iOS back navigation -- slides conversation away to reveal chat list
- **Scroll:** Date header floats during scroll, tapping it jumps to that date
- **Navigation:** Smooth push/pop with parallax offset

### Discord
- **Long-press message:** Action sheet -- Reply / React / Copy Text / Mark Unread / Pin / Edit / Delete
- **Swipe left on message:** Reply (newer iOS versions)
- **Code blocks:** Copy button present but difficult to tap. No text selection within code embeds. Users frequently complain about this.
- **Text copying:** Whole-message copy via long-press action. No partial selection.
- **Navigation:** Bottom tab bar + push within each tab

### GitHub Mobile (most relevant for code viewing)
- **Code viewing:** Horizontal scroll, syntax highlighting, line numbers, tap line for actions
- **File navigation:** Standard push/pop iOS transition
- **Pull-to-refresh:** On all list views (repos, issues, PRs)
- **Share:** Share sheet for repository URLs, file URLs, code permalink
- **Code blocks in comments:** Syntax highlighted, horizontally scrollable, tap to expand

### Blink Shell (most relevant for terminal UX)
- **Touch gestures:** Two-finger tap creates new shell, swipe between shells, pinch to zoom text
- **Code/terminal viewing:** Full-screen, horizontal + vertical scroll, adjustable font size
- **Navigation:** Swipe between active shell sessions
- **Keyboard:** Hardware keyboard focused, but touch keyboard works with custom accessory row

---

## Complexity Assessment Summary

| Feature | Complexity | Effort | Risk | Notes |
|---------|------------|--------|------|-------|
| TS-1 Swipe-to-delete | Medium | 4-6h | Low | Well-understood CSS transform + touch events. Spring-back on incomplete swipe. |
| TS-2 Long-press sessions | Medium | 3-4h | Low | Existing context menu component, need touch-based trigger (500ms hold). |
| TS-3 Long-press messages | Medium | 4-6h | Medium | Text selection conflict needs careful CSS `-webkit-user-select` partitioning. |
| TS-4 Pull-to-refresh | Medium | 4-6h | Medium | Overscroll interception in WKWebView needs real-device testing. May need to track touch delta manually rather than relying on scroll position. |
| TS-5 Status bar tap | Low | 0.5h | None | Capacitor `statusTap` event, one `addEventListener` call. |
| TS-8 Code block sizing | Low | 1h | None | CSS-only: add mobile breakpoint with 44px min dimensions on copy button. |
| TS-9 Haptics expansion | Low | 2h | None | Infrastructure exists and is proven. Just add calls at new gesture points. |
| TS-12 Text selection | Low | 1h | Low | CSS audit and minor fixes. Verify on real device. |
| D-1 Swipe-to-reply | High | 8-12h | High | Backend threading support unknown. Complex gesture state machine. |
| D-2 Share sheet | Medium | 3-4h | Low | Capacitor plugin install + straightforward API wiring. |
| D-5 Spring nav transitions | High | 10-16h | High | Shared layout animation + route integration. Diminishing returns for SPA. |
| D-6 Haptic language | Low | 2h | None | Policy definition + consistent application. |
| D-7 Code expand | Medium | 4-6h | Low | Bottom sheet pattern, existing CodeBlock content. |
| D-10 Tap to copy | Low | 2h | Low | Short-tap detection threshold, clipboard API, haptic. |

**Total estimated effort for recommended MVP (TS-1 through TS-12 + D-2, D-6, D-7, D-10):** ~30-40h

---

## Sources

- [Apple HIG: Gestures](https://developer.apple.com/design/human-interface-guidelines/gestures) -- Confidence: HIGH
- [Apple HIG: Context Menus](https://developer.apple.com/design/human-interface-guidelines/context-menus) -- Confidence: HIGH
- [Apple HIG: Activity Views (Share Sheet)](https://developer.apple.com/design/human-interface-guidelines/activity-views) -- Confidence: HIGH
- [NNGroup: Using Swipe to Trigger Contextual Actions](https://www.nngroup.com/articles/contextual-swipe/) -- Confidence: HIGH
- [Capacitor Share Plugin API](https://capacitorjs.com/docs/apis/share) -- Confidence: HIGH
- [Capacitor Status Bar Plugin API](https://capacitorjs.com/docs/v4/apis/status-bar) -- Confidence: HIGH
- [Ionic Forum: iOS status bar tap scroll-to-top](https://forum.ionicframework.com/t/ios-tap-on-status-bar-doesnt-scroll-to-top/241105) -- Confidence: MEDIUM
- [Discord Community: Mobile code blocks copy function](https://support.discord.com/hc/en-us/community/posts/18892893675159-mobile-code-blocks-copy-function) -- Confidence: MEDIUM
- [Telegram Tips: Swipe left to reply](https://telegram.tips/blog/swipe-left-to-reply/) -- Confidence: MEDIUM
- [Slack Engineering: PanModal for thumb accessibility](https://slack.engineering/panmodal-better-support-for-thumb-accessibility-on-slack-mobile/) -- Confidence: MEDIUM
- [Smashing Magazine: Scroll Bouncing on Websites](https://www.smashingmagazine.com/2018/08/scroll-bouncing-websites/) -- Confidence: MEDIUM
- [WhatsApp: Swipe to Reply](https://www.facebook.com/WhatsApp/posts/in-the-latest-version-of-whatsapp-on-ios-you-can-swipe-right-in-any-message-to-q/1498157990243421/) -- Confidence: HIGH
- [Tom's Guide: iOS 17 Messages swipe-to-reply](https://www.tomsguide.com/how-to/how-to-quick-reply-in-ios-messages) -- Confidence: HIGH
- Codebase analysis: SessionItem.tsx, SessionContextMenu.tsx, Sidebar.tsx, haptics.ts, native-plugins.ts, CodeBlock.tsx, MessageList.tsx, useScrollAnchor.ts, platform.ts -- Confidence: HIGH
