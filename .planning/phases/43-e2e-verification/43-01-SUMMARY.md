---
phase: 43-e2e-verification
plan: 01
subsystem: e2e-testing
tags: [e2e, playwright, permission-banner, token-usage, image-attachment, export, retry]
dependency_graph:
  requires: []
  provides: [e2e-permission-banner, e2e-token-usage, e2e-image-attachment, e2e-export, e2e-retry]
  affects: [stream-store, chat-view, timeline-store]
tech_stack:
  added: []
  patterns: [store-injection-for-e2e, dev-mode-window-exposure]
key_files:
  created:
    - src/e2e/permission-banner.spec.ts
    - src/e2e/token-usage.spec.ts
    - src/e2e/image-attachment.spec.ts
    - src/e2e/export-conversation.spec.ts
    - src/e2e/message-retry.spec.ts
    - src/e2e/helpers.ts
  modified:
    - src/src/stores/stream.ts
    - src/src/stores/stream.test.ts
    - src/src/stores/timeline.ts
    - src/src/components/chat/view/ChatView.tsx
decisions:
  - Synthetic store injection for permission banner tests (deterministic, no API cost)
  - Drop events over paste for image attachment (Chromium clipboardData is read-only)
  - Timeline store injection for retry button tests (error state hard to trigger in E2E)
  - Dev-mode window exposure pattern for Zustand stores (tree-shaken in production)
metrics:
  duration: 38m
  completed: "2026-03-18T02:46:00Z"
---

# Phase 43 Plan 01: Chat E2E Tests Summary

12 Playwright E2E tests across 5 spec files verifying permission banners, token usage, image attachments, conversation export, and message retry.

## One-liner

E2E test suite with store injection pattern for deterministic UI verification plus real API integration tests for token display and export.

## What Was Built

### Task 1: Permission Banner, Token Usage, Image Attachment E2E Specs

**permission-banner.spec.ts** (4 tests):
- Renders banner with tool name, command preview, Allow/Deny buttons
- Y key dismisses banner (allow)
- N key dismisses banner (deny)
- Allow button click dismisses banner
- Uses synthetic store injection via `window.__ZUSTAND_STREAM_STORE__`

**token-usage.spec.ts** (2 tests):
- Shows token usage footer after completed response (real API)
- Expands token detail panel on click (real API)

**image-attachment.spec.ts** (2 tests):
- Drop image shows preview in composer (no API, uses synthetic DragEvent)
- Sends message with dropped image (real API)

### Task 2: Export Conversation and Message Retry E2E Specs

**export-conversation.spec.ts** (2 tests):
- Exports as Markdown: downloads .md file containing sent message text
- Exports as JSON: downloads .json file with parseable message structure

**message-retry.spec.ts** (2 tests):
- Error message renders retry button when preceded by user message
- Retry button is clickable (not disabled) when connected
- Uses timeline store injection to create error state

### Shared Helper (helpers.ts)
- `setupChat()`: Navigate to /chat, wait for WS, return input locator
- `sendMessageAndWait()`: Fill input, click send, wait for active-message and streaming-cursor

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed displaySessionId stub session handling**
- **Found during:** Task 1 (token-usage test)
- **Issue:** After streaming ended and session reconciled from stub-xxx to real ID, `displaySessionId` still used the stub ID from useParams (which replaceState doesn't update synchronously). Messages for the stub session no longer existed in the store (ID was replaced), causing all messages to vanish.
- **Fix:** Changed `displaySessionId` to handle stub prefix: `(sessionId?.startsWith('stub-') ? activeSessionId : sessionId) ?? activeSessionId`
- **Files modified:** `src/src/components/chat/view/ChatView.tsx`
- **Commit:** 616acd6

**2. [Rule 1 - Bug] Fixed endStream clearing resultTokens before handleFlush reads them**
- **Found during:** Task 1 (token-usage test)
- **Issue:** `endStream()` reset ALL stream state including `resultTokens`. The `result` event handler called both `setResultData` (storing tokens) and `onStreamEnd` -> `endStream()` (clearing them) synchronously. When `handleFlush` ran after isStreaming transitioned false, `getState().resultTokens` was already null.
- **Fix:** `endStream()` now preserves `resultTokens` and `resultCost` (they're cleaned on `startStream`)
- **Files modified:** `src/src/stores/stream.ts`, `src/src/stores/stream.test.ts`
- **Commit:** 616acd6

**3. [Rule 3 - Blocking] Exposed Zustand stores on window for E2E testing**
- **Found during:** Task 1 (permission-banner test)
- **Issue:** Permission banner tests required injecting synthetic permission requests. AI model behavior is non-deterministic (Claude may answer without using Bash tool). Store injection provides deterministic E2E testing.
- **Fix:** Added `if (import.meta.env.DEV) { window.__ZUSTAND_*_STORE__ = store }` to stream and timeline stores
- **Files modified:** `src/src/stores/stream.ts`, `src/src/stores/timeline.ts`
- **Commits:** 616acd6, 54d62f0

## Decisions Made

1. **Synthetic store injection over real API calls** for permission banner tests: Claude's tool call behavior is non-deterministic -- sending "Run bash command X" doesn't guarantee a Bash tool call. Store injection tests the actual UI behavior deterministically.

2. **DragEvent over ClipboardEvent** for image attachment: Chromium's `ClipboardEvent` constructor makes `clipboardData` read-only, so synthetic paste events don't carry file data. `DragEvent.dataTransfer` is writable.

3. **Timeline store injection** for retry tests: Triggering a real backend error reliably in E2E is impractical (would need WS disconnect mid-stream). Injecting an error message directly tests the retry UI integration.

4. **Dev-mode window exposure** for Zustand stores: `import.meta.env.DEV` guard ensures the exposure is tree-shaken in production builds. Established as a pattern for future E2E tests.

## Commits

| Task | Commit  | Description                                       |
| ---- | ------- | ------------------------------------------------- |
| 1    | 616acd6 | Permission banner, token usage, image attachment   |
| 2    | 54d62f0 | Export conversation and message retry              |

## Self-Check: PASSED

All 7 created files verified. Both commit hashes confirmed in git log.
