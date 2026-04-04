---
status: partial
phase: 75-chat-shell
source: [75-VERIFICATION.md]
started: 2026-04-04T01:05:00Z
updated: 2026-04-04T01:05:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Send a message and see streamed AI response with markdown rendering
expected: User bubble appears, assistant response streams with correct markdown (headings, bold, lists, inline code)
result: [pending]

### 2. Code block renders with syntax highlighting, language label, and copy button
expected: Surface-sunken container with language in header, colored syntax, horizontal scroll, 'Copied' toast on tap
result: [pending]

### 3. Thinking blocks expand during streaming and auto-collapse when done
expected: Block expands while isActive=true, collapses to 'Thought for Xs' (real time) with Expand spring when response starts
result: [pending]

### 4. Tool chip tap opens bottom sheet with full details
expected: Chip renders with correct icon + status, tap opens sheet at 50% snap with args/output
result: [pending]

### 5. Permission card Approve/Deny sends WebSocket response
expected: Card appears with glow, Approve sends allow:true, Deny sends allow:false, card collapses to status line
result: [pending]

### 6. Session switch preserves scroll position
expected: Switch to another session and back — FlatList restores previous scroll offset
result: [pending]

### 7. Swipe-delete undo toast works correctly
expected: Swipe left on session, red action reveals, undo toast appears 5s, Undo button cancels delete
result: [pending]

### 8. Sessions appear in date-grouped sections in drawer
expected: Drawer shows Today / Yesterday / Last Week / Older section headers with sessions underneath
result: [pending]

### 9. Search filters sessions in real-time
expected: Typing in glass search bar filters visible sessions by title, clear button resets
result: [pending]

### 10. Auth and WebSocket connection work end-to-end
expected: App authenticates with Keychain token, WebSocket connects, status shows 'Connected'
result: [pending]

## Summary

total: 10
passed: 0
issues: 0
pending: 10
skipped: 0
blocked: 0

## Gaps
