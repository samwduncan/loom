# Chat Interface Standards Reference

A comprehensive checklist of everything that must work flawlessly for a professional, bug-free chat experience. Derived from analysis of Claude.ai, ChatGPT, Perplexity, Open WebUI, LobeChat, and LibreChat.

---

## Category 1: Scroll Behavior

| # | Requirement | Priority |
|---|-------------|----------|
| 1.1 | Auto-scroll follows new content only when user is at/near bottom | Critical |
| 1.2 | Scroll position locks when user scrolls up — new content never yanks them down | Critical |
| 1.3 | "Jump to bottom" button appears when scrolled up with new content arriving | High |
| 1.4 | No layout-shift scroll jumps — content above viewport never pushes/pulls current view | Critical |
| 1.5 | Smooth scroll interpolation — programmatic scrolls animate, never teleport | Medium |
| 1.6 | Scroll position survives window resize | Medium |
| 1.7 | Scroll position survives tab switching | Medium |
| 1.8 | Scroll bar styling matches theme | Low |
| 1.9 | Overscroll containment — chat pane scrolls independently, never the whole page | High |

## Category 2: Streaming & Live Response

| # | Requirement | Priority |
|---|-------------|----------|
| 2.1 | Token/chunk appearance is smooth with no visual stutter | Critical |
| 2.2 | Partial markdown never breaks layout (unclosed fences, half tables, incomplete lists) | Critical |
| 2.3 | Code blocks don't flicker between plain text and highlighted states | High |
| 2.4 | Tables don't reflow wildly as rows/columns appear during streaming | High |
| 2.5 | Lists maintain consistent indentation while being built | Medium |
| 2.6 | No duplicate or ghost content from race conditions | Critical |
| 2.7 | Typing/cursor indicator — clear visual signal AI is still generating | High |
| 2.8 | Performance doesn't degrade over long responses | High |
| 2.9 | Stop button is always responsive, even during heavy rendering | Critical |

## Category 3: Layout Stability (Zero CLS)

| # | Requirement | Priority |
|---|-------------|----------|
| 3.1 | Reserved space for all async content (images, avatars, tool results, embeds) | Critical |
| 3.2 | Code blocks don't resize after syntax highlighting applies | High |
| 3.3 | Nothing appears above viewport and pushes content down — all new content appends below | Critical |
| 3.4 | Thinking/reasoning sections expand with animation, not instant jump | High |
| 3.5 | Tool call results slide in smoothly — collapsible areas grow, not pop | Medium |
| 3.6 | Sidebar toggle doesn't cause chat content reflow or scroll jump | High |
| 3.7 | Avatars/icons are pre-sized — no text shifting as images load | Medium |

## Category 4: Whitespace, Spacing & Content Width

| # | Requirement | Priority |
|---|-------------|----------|
| 4.1 | Maximum content width — centered column (~700-800px), not edge-to-edge on wide screens | High |
| 4.2 | Generous vertical spacing between messages — instant turn distinction | High |
| 4.3 | Consistent internal padding — every message identical regardless of content type | High |
| 4.4 | Breathing room around entire chat — margins from viewport edges | Medium |
| 4.5 | Proper paragraph spacing within messages (gaps between paragraphs, headers, list items) | Medium |
| 4.6 | Code blocks have internal padding — code isn't cramped against edges | Medium |
| 4.7 | Input area has clear visual separation from message stream | High |

## Category 5: Typography & Readability

| # | Requirement | Priority |
|---|-------------|----------|
| 5.1 | Consistent font family and sizing across all message types | High |
| 5.2 | Proper line-height (1.5-1.7 for body text) | High |
| 5.3 | Monospace font for code, sized proportionally to body text | Medium |
| 5.4 | Strong contrast ratios — effortlessly readable | High |
| 5.5 | Long unbreakable strings (URLs, paths, hashes) wrap or truncate — never overflow | High |
| 5.6 | Inline code visually distinct (background, border-radius, padding) | Medium |
| 5.7 | Heading hierarchy within messages is clear but not overwhelming | Low |
| 5.8 | Text selection works naturally — no hidden elements selected, no content skipped | Medium |

## Category 6: Message Visual Hierarchy

| # | Requirement | Priority |
|---|-------------|----------|
| 6.1 | Instant distinction between user and assistant (alignment, background, or styling) | High |
| 6.2 | Clear turn boundaries — never ambiguous where one message ends and another begins | High |
| 6.3 | Consistent avatar/icon placement — same position every time | Medium |
| 6.4 | Timestamps available but not distracting (on hover or very subtle) | Low |
| 6.5 | Message actions (copy, edit, retry) on hover without any layout shift | High |
| 6.6 | Code block headers — language label and copy button visible, not overlapping content | Medium |
| 6.7 | Grouped consecutive messages — multiple from same sender don't each get full header | Low |

## Category 7: Input Area

| # | Requirement | Priority |
|---|-------------|----------|
| 7.1 | Auto-resizing textarea — grows with content up to max height, then scrolls internally | High |
| 7.2 | Zero input lag — typing is instant even during heavy rendering | Critical |
| 7.3 | Submit button state — disabled when empty, sending state, becomes stop button during gen | High |
| 7.4 | Keyboard shortcuts reliable every time — Enter sends, Shift+Enter newlines | Critical |
| 7.5 | Draft preservation — unsent text recovered after accidental navigation/refresh | Medium |
| 7.6 | Paste handling — large text, images, files all work without breaking input | High |
| 7.7 | Focus management — input focused after sending, page load, closing modals | Medium |
| 7.8 | No phantom submissions — Enter never sends same message twice | Critical |

## Category 8: Loading States & Transitions

| # | Requirement | Priority |
|---|-------------|----------|
| 8.1 | Initial load shows skeleton/shimmer — never blank page or flash of unstyled content | High |
| 8.2 | Conversation history loads progressively — graceful fade or virtualized | Medium |
| 8.3 | AI thinking indicator is animated and smooth (60fps) | High |
| 8.4 | Tool execution shows progress — spinner, status text, or progress bar | Medium |
| 8.5 | Page transitions don't flash white — dark mode persists through all state changes | High |
| 8.6 | Loading indicators proportional — subtle spinner for quick ops, progress bar for long ones | Low |

## Category 9: Animations & Motion

| # | Requirement | Priority |
|---|-------------|----------|
| 9.1 | Message entrance animation — subtle fade/slide, 150-300ms, not distracting | Medium |
| 9.2 | Expand/collapse animated — thinking sections, tool results transition height smoothly | Medium |
| 9.3 | Button hover/press micro-interactions with subtle transitions | Low |
| 9.4 | No animation jank — use compositor-friendly properties (transform, opacity) | High |
| 9.5 | Respects `prefers-reduced-motion` — instant transitions for users who disable animation | Medium |
| 9.6 | Sidebar transitions smooth — slide in/out, not instant appear/disappear | Low |
| 9.7 | Toast/notification animations — slide in, auto-dismiss, stackable | Low |

## Category 10: Error Handling & Recovery

| # | Requirement | Priority |
|---|-------------|----------|
| 10.1 | Network errors don't break the chat — banner/toast appears, conversation stays intact | Critical |
| 10.2 | Failed messages show inline retry button | High |
| 10.3 | Connection drop indicator — subtle but visible "reconnecting..." status | High |
| 10.4 | Auto-reconnection — SSE/WebSocket reconnects silently when possible | High |
| 10.5 | Rate limiting feedback — clear message about what happened and when to retry | Medium |
| 10.6 | Timeout handling — clear state shown, not infinite spinning | High |
| 10.7 | Errors are dismissible — don't block the interface | Medium |
| 10.8 | Partial responses preserved — if generation fails mid-stream, received content stays | High |

## Category 11: Performance at Scale

| # | Requirement | Priority |
|---|-------------|----------|
| 11.1 | Long conversations don't slow down — virtual scrolling or DOM recycling for 100+ messages | High |
| 11.2 | Only new message re-renders — adding message N doesn't re-render 1 through N-1 | Critical |
| 11.3 | No memory leaks — hours-long sessions don't bloat memory | High |
| 11.4 | Syntax highlighting is async — large code blocks don't block main thread | Medium |
| 11.5 | Image lazy loading — images outside viewport don't load until scrolled near | Medium |
| 11.6 | Debounced resize/scroll handlers — no event handler storms | Medium |
| 11.7 | RequestAnimationFrame for scroll logic — calculations at the right time | Medium |

## Category 12: Interactive Elements Inside Messages

| # | Requirement | Priority |
|---|-------------|----------|
| 12.1 | Copy button on code blocks — works every time, shows "copied" feedback | High |
| 12.2 | Code block language label — visible, correct, styled | Medium |
| 12.3 | Expandable sections for thinking, tool calls, long outputs — toggle works smoothly | High |
| 12.4 | Links open in new tabs with `rel="noopener"` | Medium |
| 12.5 | Wide tables scroll horizontally inside container — no message overflow | High |
| 12.6 | Image rendering — proper sizing, click-to-enlarge, loading placeholder | Medium |
| 12.7 | Diagrams render once — no flash or re-render on state changes | Medium |

## Category 13: Dark Mode Integrity

| # | Requirement | Priority |
|---|-------------|----------|
| 13.1 | Every single element is themed — no white inputs, unstyled scrollbars, bright borders | High |
| 13.2 | No flash of light theme on load — dark mode applied before first paint | High |
| 13.3 | Code block syntax highlighting uses dark palette | Medium |
| 13.4 | Selection/highlight colors match dark theme | Low |
| 13.5 | Focus rings complement dark theme | Low |
| 13.6 | Third-party embeds/iframes contained or themed | Low |

## Category 14: Responsive Design

| # | Requirement | Priority |
|---|-------------|----------|
| 14.1 | Usable from 375px to 4K — chat column, input, sidebar all adapt | High |
| 14.2 | Mobile: input area stays above virtual keyboard | Critical |
| 14.3 | Mobile: touch targets are 44px minimum | High |
| 14.4 | Tablet: sidebar can overlay or collapse without eating content space | Medium |
| 14.5 | Desktop ultrawide: content contained with max-width, centered | Medium |

## Category 15: Connection & State Integrity

| # | Requirement | Priority |
|---|-------------|----------|
| 15.1 | No stale data — switching conversations always shows current state | Critical |
| 15.2 | No race conditions on rapid switching — wrong conversation's messages never shown | Critical |
| 15.3 | Optimistic UI — user message appears instantly, doesn't wait for server | High |
| 15.4 | Idempotent submissions — network retries don't create duplicate messages | Critical |
| 15.5 | Conversation list reflects reality — new/deleted chats update immediately | Medium |
| 15.6 | Stop generating actually stops — doesn't just hide output while server continues | High |

## Category 16: Subtle Polish Details

| # | Requirement | Priority |
|---|-------------|----------|
| 16.1 | Tab title updates — shows activity indicator when AI responds in background tab | Low |
| 16.2 | Empty state is inviting — warm welcome or suggestions, not blank void | Medium |
| 16.3 | Consistent border-radius language across messages, buttons, inputs, cards | Medium |
| 16.4 | Consistent shadow/elevation system | Low |
| 16.5 | No orphaned UI states — every state (empty, loading, error, streaming, complete, offline) is designed | High |
| 16.6 | Correct cursors — pointer on clickable, text on selectable, resize where applicable | Low |

---

## Priority Summary

| Priority | Count | Description |
|----------|-------|-------------|
| **Critical** | 19 | If broken, the app feels fundamentally broken |
| **High** | 42 | Noticeable quality degradation if missing |
| **Medium** | 32 | Professional polish — distinguishes good from great |
| **Low** | 13 | Fine details that elevate to premium feel |

**Total requirements: 106**
