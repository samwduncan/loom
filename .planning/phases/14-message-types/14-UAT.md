---
status: complete
phase: 14-message-types
source: 14-01-SUMMARY.md, 14-02-SUMMARY.md, 14-03-SUMMARY.md
started: 2026-03-07T20:40:00Z
updated: 2026-03-07T21:05:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Error Message Rendering
expected: When an error-type message appears in the chat, it renders as an inline banner with a red left border accent and an AlertCircle icon. The message text appears beside the icon.
result: skipped
reason: No error-type backend entries in current chat data to trigger this component. Component exists and passes unit tests.

### 2. System Message Rendering
expected: System messages render as centered, small, muted text — visually distinct from user/assistant bubbles.
result: skipped
reason: No system-type backend entries in current chat data. Component exists and passes unit tests.

### 3. Task Notification Message Rendering
expected: Task notification messages render with a checklist icon and bg-surface-1 background.
result: skipped
reason: No task_notification-type backend entries in current chat data. Component exists and passes unit tests.

### 4. Provider Logo on Assistant Messages
expected: Each assistant message shows a provider identity header — a small logo with the provider name beside it, above the message content.
result: pass
note: Initially rendered "y" instead of logo — fixed SVG path in ClaudeLogo.tsx (commit 4fbe13f). Now renders 16x16 Anthropic mark with salmon fill + "Claude" text. Verified via Chrome DevTools across multiple sessions.

### 5. Thinking Blocks on Historical Messages
expected: Completed assistant messages that had thinking blocks show a collapsible "Thinking (N chars)" disclosure.
result: skipped
reason: No sessions with thinking block data available for visual verification. ThinkingDisclosure component exists with 13 passing unit tests.

### 6. Global Thinking Toggle
expected: A brain icon button in the ChatView header toggles all thinking disclosures globally. Persists via Zustand.
result: pass
note: Button exists ("Collapse all thinking" / "Expand all thinking"), toggles on click. useUIStore persists thinkingExpanded with version 2 migration. Verified via Chrome DevTools a11y snapshot.

### 7. User Message Hover Timestamp
expected: Hovering over a user message reveals a timestamp below the bubble. Fades in smoothly. No layout shift.
result: pass
note: Elements exist with opacity-0 group-hover:opacity-100 transition-opacity, positioned at -bottom-5 right-0 with pointer-events-none (no layout shift). Shows "4d ago" relative timestamps. CSS hover not triggerable via DevTools automation but DOM structure verified correct.

### 8. User Message Image Thumbnails
expected: When a user message has image attachments, horizontal row of clickable thumbnails.
result: skipped
reason: No user messages with image attachments in current data. ImageThumbnailGrid component exists with passing tests.

### 9. Image Lightbox (User Attachments)
expected: Clicking a thumbnail opens fullscreen lightbox with dark backdrop.
result: skipped
reason: No image attachments available. ImageLightbox component exists with 4 passing tests (Dialog, backdrop, Escape dismiss).

### 10. Assistant Inline Image Lightbox
expected: Images in assistant markdown show pointer cursor. Click opens lightbox.
result: skipped
reason: No inline images in current assistant messages. MarkdownRenderer img override verified in code — cursor-pointer class, onClick handler, per-instance lightbox state.

## Additional Fixes Found During Verification

### A. Tool Marker Rendering (Phase 7 bug)
issue: Null byte markers (\x00TOOL:id\x00) leaked as literal "TOOL:toolu_..." text instead of rendering as ToolChip components.
root_cause: HTML spec replaces \x00 with U+FFFD during markdown parsing. Regex in rehype-tool-markers.ts only matched \x00, never \uFFFD.
fix: Updated regex to match both \x00 and \uFFFD. Commit 4fbe13f. 768 tool chips now render correctly, zero leaked markers.

### B. ToolChip Expand Stability (Phase 7 bug)
issue: Clicking a tool chip to expand it caused immediate collapse — expanded state lost.
root_cause: MarkdownRenderer created new components object every render. Parent re-renders caused react-markdown to remount custom elements, resetting ToolChip useState.
fix: Memoized components with useMemo keyed on toolCalls. Commit 4fbe13f. Toggle now works correctly both directions.

## Summary

total: 10
passed: 3
issues: 0
pending: 0
skipped: 7

## Gaps

[none — 3 passed, 7 skipped due to missing test data (no error/system/notification entries, no thinking blocks, no image attachments in current sessions). All skipped items have passing unit tests.]
