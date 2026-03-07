# Phase 13: Composer - Research

**Researched:** 2026-03-07
**Domain:** React textarea composer with state machine, image attachments, draft persistence
**Confidence:** HIGH

## Summary

Phase 13 replaces the M1 single-line `<input>` ChatComposer with a full-featured multiline composer. The implementation is almost entirely custom React code -- no external libraries needed beyond what's already installed (Lucide icons, Sonner toasts, Zustand stores). The auto-resize textarea is a well-understood 20-line pattern using `useLayoutEffect`. The send/stop state machine is the trickiest part architecturally -- it needs to handle 5 states cleanly while preventing race conditions (double-send, double-stop). Image handling leverages the existing backend `handleImages()` function that already accepts `options.images` as base64 data URLs.

The main risk area is the interaction between composer height changes and scroll position stability. The CSS Grid `1fr auto` pattern handles this naturally, but the `scrollTop` preservation during resize needs explicit attention. Draft persistence via localStorage + in-memory Map is straightforward. Message queuing during streaming is partially supported by the backend already (it queues commands).

**Primary recommendation:** Build the composer in 3-4 plans: (1) textarea + auto-resize + keyboard shortcuts + state machine, (2) image attachments with paste/drag-drop, (3) draft persistence + welcome screen redesign. Keep the state machine as a `useReducer` -- it maps perfectly to the 5-state FSM described in CONTEXT.md.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Floating pill shape: `rounded-xl`, subtle shadow, `bg-surface-1` lift from chat area
- Centered with `max-w-3xl` (768px) -- same column width as message list
- Message list also gets `max-w-3xl` centered column to match (unified reading column)
- Focus state: subtle primary-colored ring (1px, `ring-primary/30`)
- During streaming: border shifts to `border-primary/40` (rose tint) -- placeholder for M3 ElectricBorder
- Send/Stop button inside the pill at bottom-right corner, anchored to bottom as textarea grows
- Placeholder text: "Send a message..."
- Keyboard shortcut hints in bottom-left of pill: `Enter to send` / `Shift+Enter for newline` (muted text, uses kbd component). Hints fade out after first message sent in session.
- Cmd+. / Ctrl+. kbd hint shown next to stop button during streaming
- 5 states: `idle` -> `sending` (200ms disabled) -> `active` (streaming) -> `aborting` (stop pressed) -> `idle`
- idle: Send button (Lucide Send icon, primary bg)
- sending: Send button disabled, 200ms lockout
- active: Stop button (Lucide Square icon, red bg)
- aborting: Disabled button with CSS spinner replacing square icon, muted colors. 5-second timeout before force-reverting to idle if backend doesn't confirm abort.
- CSS crossfade (opacity transition, 100ms) between send/stop states -- position-stable in same grid cell
- Send `abort-session` (existing pattern) for stop, `claude-abort` for Cmd+. shortcut
- User CAN type in composer during streaming (not disabled like M1)
- Enter during streaming sends the message immediately to backend (backend queues it)
- Optimistic user message appears in timeline right away with a muted "Queued" badge
- Horizontal scroll row of 64x64px thumbnail cards inside the pill, above textarea
- Each thumbnail has X remove button on hover
- Counter badge in corner of row: "3/5" -- turns warning color at 5/5
- Drag-and-drop overlay: dashed border replaces pill border, dimmed background (`primary/10`), centered "Drop image here" text with icon
- File size/type errors shown as Sonner toast notifications (auto-dismiss 3s)
- Max 5 images, max 5MB each. Client-side validation before base64 conversion.
- Direct WebSocket: convert images to base64 data URLs client-side via `FileReader.readAsDataURL`
- Send inline in `claude-command` message's `options.images` array: `[{data: "data:image/png;base64,...", name: "filename.png"}]`
- Text drafts only (no image persistence)
- `useRef<Map<string, string>>` for in-memory session drafts during session switches
- Persisted to localStorage keyed by session ID for reload survival
- Subtle primary-colored dot indicator next to sessions in sidebar that have saved drafts
- Enter: send message (blocked during streaming unless queuing)
- Shift+Enter: insert newline
- Cmd+. (Mac) / Ctrl+. (Windows): stop active generation
- Escape: two-step -- first press clears input text (stays focused), second press (when empty) blurs textarea
- On no-session screen: composer pill vertically centered in chat area (not bottom-docked)
- Welcome content above composer: "Loom" in Instrument Serif + tagline
- 3-4 suggestion chips below tagline: clickable, populate composer with text
- Sending from empty state creates new session (existing stub session pattern)
- Custom `useLayoutEffect` hook (no library, per CMP-01): `height = 0; height = scrollHeight`
- Grows from 1 line to max ~200px (~10-12 lines), then `overflow-y: auto` inner scroll
- CSS Grid integration: `grid-template-rows: 1fr auto` -- scroll position stabilized when composer height changes
- Textarea auto-focuses on session switch and app load
- Focus returned to textarea after sending a message (via `requestAnimationFrame`)

### Claude's Discretion
- Exact shadow depth and transition timing for floating pill
- Suggestion chip content and styling
- Draft dot indicator exact positioning and animation
- Internal implementation of auto-resize hook
- CSS spinner design for aborting state

### Deferred Ideas (OUT OF SCOPE)
- Liquid glass animated background on composer -- M3 visual effects (Phase 19 or later)
- Model selector in composer -- M4 multi-provider scope
- Slash commands / mentions in composer -- not in any current milestone
- Rich text editing (TipTap) -- explicitly out of scope per REQUIREMENTS.md
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CMP-01 | Auto-resize textarea via useLayoutEffect, replacing single-line input | useAutoResize hook pattern documented in Code Examples |
| CMP-02 | Textarea grows 1 line to max ~200px, then inner overflow-y scroll | Max-height cap + overflow-y: auto CSS pattern |
| CMP-03 | Enter sends, Shift+Enter inserts newline | KeyboardEvent handler pattern, existing M1 logic reference |
| CMP-04 | Send/Stop button morph with CSS crossfade, position-stable | Grid cell anchoring + opacity transition pattern |
| CMP-05 | 5-state machine (idle/sending/active/aborting/idle) prevents double-send/stop | useReducer FSM pattern documented |
| CMP-06 | Stop sends claude-abort via WebSocket, handles graceful wind-down | Existing abort-session ClientMessage type already defined |
| CMP-07 | Image paste via onPaste, thumbnail preview chips, max 5 | FileReader + URL.createObjectURL pattern |
| CMP-08 | Image drag-and-drop with overlay UX | DragEvent handlers + drag state management |
| CMP-09 | URL.createObjectURL for previews, revoke after send, 5MB max | Object URL lifecycle management |
| CMP-10 | Images sent inline in WebSocket claude-command options.images | Backend handleImages() already accepts this format -- verified |
| CMP-11 | Cmd+./Ctrl+. stops generation (global), Escape clears/blurs | Global useEffect keydown listener pattern |
| CMP-12 | Draft text preserved per session via Map + localStorage | useRef<Map> + localStorage sync pattern |
| CMP-13 | CSS Grid shell integration, scroll position stabilized on resize | grid-template-rows: 1fr auto + scrollTop capture/restore |
| CMP-14 | Auto-focus on session switch and app load, refocus after send | rAF focus pattern (existing M1 pattern) |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 19 | ^19.2.0 | Component framework | Project stack |
| Zustand 5 | ^5.0.11 | State management (stream store, timeline store) | Project stack |
| Lucide React | ^0.577.0 | Send and Square icons | Already used in CodeBlock |
| Sonner | ^2.0.7 | Toast notifications for image errors | Already configured with dark theme |
| react-router-dom | ^7.13.1 | Navigation for new session creation | Already used in ChatComposer |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clsx + tailwind-merge | via cn() | Conditional class composition | All component styling |
| Zustand immer | via timeline store | Immutable state updates | Adding queued message badge |

### No New Dependencies Needed
This phase requires zero new npm packages. Everything is built with React APIs, DOM APIs, and existing project infrastructure.

## Architecture Patterns

### Recommended Project Structure
```
src/src/components/chat/composer/
  ChatComposer.tsx         # Main composer component (rewrite of M1)
  useAutoResize.ts         # Custom hook for textarea auto-resize
  useComposerState.ts      # State machine hook (useReducer)
  useDraftPersistence.ts   # Draft save/restore per session
  useImageAttachments.ts   # Paste, drag-drop, preview management
  ImagePreviewRow.tsx      # Horizontal scroll row of image thumbnails
  ImagePreviewCard.tsx     # Individual 64x64 thumbnail with X remove
  ComposerKeyboardHints.tsx # Fading keyboard shortcut hints
  DragOverlay.tsx          # Dashed border drop target overlay
  composer.css             # Composer-specific CSS (spinner, transitions)
src/src/components/chat/view/
  ChatView.tsx             # Updated: grid-template-rows: 1fr auto
  ChatEmptyState.tsx       # Updated: welcome screen + centered composer
  MessageList.tsx          # Updated: max-w-3xl centered column
src/src/components/sidebar/
  SessionItem.tsx          # Updated: draft dot indicator
```

### Pattern 1: Composer State Machine (useReducer)
**What:** A 5-state FSM managing send/stop button behavior
**When to use:** Whenever UI has discrete states with guarded transitions
**Example:**
```typescript
type ComposerState = 'idle' | 'sending' | 'active' | 'aborting';

type ComposerAction =
  | { type: 'SEND' }
  | { type: 'STREAM_STARTED' }
  | { type: 'STOP' }
  | { type: 'STREAM_ENDED' }
  | { type: 'ABORT_TIMEOUT' };

function composerReducer(state: ComposerState, action: ComposerAction): ComposerState {
  switch (state) {
    case 'idle':
      return action.type === 'SEND' ? 'sending' : state;
    case 'sending':
      return action.type === 'STREAM_STARTED' ? 'active' : state;
    case 'active':
      return action.type === 'STOP' ? 'aborting'
           : action.type === 'STREAM_ENDED' ? 'idle'
           : state;
    case 'aborting':
      return (action.type === 'STREAM_ENDED' || action.type === 'ABORT_TIMEOUT') ? 'idle' : state;
    default:
      return state;
  }
}
```

### Pattern 2: Auto-Resize Textarea Hook
**What:** `useLayoutEffect` that measures scrollHeight and sets height
**When to use:** Any textarea that should grow with content
**Example:**
```typescript
function useAutoResize(
  textareaRef: React.RefObject<HTMLTextAreaElement | null>,
  value: string,
  maxHeight = 200,
) {
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    // Reset to auto to measure natural scrollHeight
    el.style.height = '0px';
    const scrollH = el.scrollHeight;
    el.style.height = `${Math.min(scrollH, maxHeight)}px`;
    el.style.overflowY = scrollH > maxHeight ? 'auto' : 'hidden';
  }, [value, maxHeight]);
}
```

### Pattern 3: Image Attachment Lifecycle
**What:** FileReader -> validation -> ObjectURL preview -> base64 on send -> revoke
**When to use:** Image paste/drop with preview before upload
**Example:**
```typescript
// Preview: use ObjectURL (no memory doubling)
const previewUrl = URL.createObjectURL(file);

// On send: convert to base64 for WebSocket transport
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// After send: revoke all preview URLs
previewUrls.forEach(url => URL.revokeObjectURL(url));
```

### Pattern 4: Draft Persistence (Ref + localStorage)
**What:** In-memory Map for fast session switches, localStorage for reload survival
**When to use:** Preserving form state across navigation
**Example:**
```typescript
const draftsRef = useRef(new Map<string, string>());
const STORAGE_KEY = 'loom-composer-drafts';

// On session switch: save current, restore target
function switchDraft(fromSession: string, toSession: string, currentText: string) {
  if (currentText.trim()) {
    draftsRef.current.set(fromSession, currentText);
  } else {
    draftsRef.current.delete(fromSession);
  }
  // Sync to localStorage (debounced)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(draftsRef.current)));
  return draftsRef.current.get(toSession) ?? '';
}
```

### Anti-Patterns to Avoid
- **Using controlled textarea height with React state:** Setting height via state triggers re-renders on every keystroke. Use `useLayoutEffect` + direct DOM mutation instead.
- **Storing base64 in React state for previews:** Doubles memory usage. Use `URL.createObjectURL` for previews, convert to base64 only at send time.
- **Single useState for FSM:** State machines with guarded transitions need `useReducer` -- `useState` allows illegal transitions.
- **Disabling textarea during streaming (M1 pattern):** CONTEXT.md explicitly says users CAN type during streaming. The textarea stays enabled; Enter queues the message.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toast notifications | Custom toast system | Sonner (already installed + configured) | Edge cases: stacking, auto-dismiss, accessibility |
| Icons | SVG inline (M1 pattern) | Lucide React `Send`, `Square`, `X`, `Image` | Tree-shaken, consistent sizing, already in project |
| Keyboard shortcut hints | Raw text | `<Kbd>` component (already exists) | Consistent styling with design tokens |
| Image type/size validation | N/A -- this IS hand-rolled | Simple conditional checks | Too simple for a library, but validate BEFORE FileReader |

**Key insight:** This phase is mostly custom UI logic. The complexity is in state machine correctness and layout integration, not in finding the right library.

## Common Pitfalls

### Pitfall 1: Textarea Height Measurement Race
**What goes wrong:** `scrollHeight` returns wrong value because browser hasn't reflowed after setting `height = 0`.
**Why it happens:** Some browsers batch style recalculations. Setting height and reading scrollHeight in the same synchronous block can return stale values.
**How to avoid:** Use `useLayoutEffect` (not `useEffect`). The `height = 0; height = scrollHeight` pattern works because `useLayoutEffect` runs synchronously after DOM mutations but before paint. The browser must recalculate layout when you read `scrollHeight` after setting `height = 0`.
**Warning signs:** Textarea height jumps or doesn't grow/shrink correctly.

### Pitfall 2: Double-Send Race Condition
**What goes wrong:** User clicks Send twice quickly, two messages are dispatched.
**Why it happens:** WebSocket `send()` is async -- the state hasn't transitioned to `sending` before the second click fires.
**How to avoid:** The 200ms lockout in `sending` state handles this. Transition to `sending` synchronously in the click handler BEFORE calling `wsClient.send()`. The `useReducer` dispatch is synchronous.
**Warning signs:** Duplicate user messages in timeline.

### Pitfall 3: Object URL Memory Leak
**What goes wrong:** Preview URLs created via `URL.createObjectURL` are never revoked, causing memory leaks.
**Why it happens:** URLs need explicit cleanup -- they don't get garbage collected automatically.
**How to avoid:** Revoke all preview URLs after message send. Also revoke when user removes an image via the X button. Use a cleanup effect on unmount.
**Warning signs:** Memory usage climbs with each image paste, even after sending.

### Pitfall 4: Base64 Memory Spike on Large Images
**What goes wrong:** Converting a 5MB image to base64 creates a ~6.7MB string in memory (33% base64 overhead).
**Why it happens:** `FileReader.readAsDataURL` loads the entire file into a base64 string.
**How to avoid:** Validate `file.size` BEFORE calling `readAsDataURL`. Reject files > 5MB immediately with a Sonner toast. Don't convert to base64 until send time (use ObjectURL for preview).
**Warning signs:** Page freezes or crashes when pasting large images.

### Pitfall 5: Scroll Position Jump on Composer Resize
**What goes wrong:** When textarea grows (user types multiline text), the message list scroll position jumps.
**Why it happens:** CSS Grid `1fr auto` reallocates space when the `auto` row grows, which can shift the `1fr` area's scroll position.
**How to avoid:** Capture `scrollContainer.scrollTop` before the resize, then restore it in `useLayoutEffect` after the height change. If user is at bottom (auto-scroll mode), re-scroll to bottom instead.
**Warning signs:** Messages visually jump up when typing long messages.

### Pitfall 6: Drag-and-Drop Event Bubbling
**What goes wrong:** `dragenter`/`dragleave` fire on child elements, causing the overlay to flicker.
**Why it happens:** Drag events bubble through all children. When entering a child, you get a `dragleave` from parent and `dragenter` on child.
**How to avoid:** Use a `dragCounter` ref. Increment on `dragenter`, decrement on `dragleave`. Show overlay when counter > 0, hide when counter === 0. Reset on `drop`.
**Warning signs:** Drop overlay flickers rapidly as user moves mouse over the composer area.

### Pitfall 7: Keyboard Shortcut Conflicts
**What goes wrong:** Cmd+. shortcut interferes with browser's native "stop loading" behavior, or fires when user is in another input field.
**Why it happens:** Global keyboard listeners capture events from all contexts.
**How to avoid:** Check `event.target` -- only fire the stop shortcut when the target is the composer textarea or the document body. Use `e.preventDefault()` to suppress browser default. Don't prevent Cmd+. when not streaming (it has no effect anyway).
**Warning signs:** Cmd+. stops generation when user is typing in settings or other inputs.

## Code Examples

### Auto-Resize Hook (Verified Pattern)
```typescript
// Source: Standard React pattern, verified against project's useLayoutEffect usage (Phase 9 lessons)
import { useLayoutEffect } from 'react';

export function useAutoResize(
  ref: React.RefObject<HTMLTextAreaElement | null>,
  value: string,
  maxHeight = 200,
) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = '0px';
    const scrollH = el.scrollHeight;
    const clamped = Math.min(scrollH, maxHeight);
    el.style.height = `${clamped}px`;
    el.style.overflowY = scrollH > maxHeight ? 'auto' : 'hidden';
  }, [ref, value, maxHeight]);
}
```

### CSS Crossfade for Send/Stop Button
```css
/* Source: Project convention -- design tokens for all durations */
.composer-button-cell {
  display: grid;
  grid-template-areas: "button";
}
.composer-button-cell > * {
  grid-area: button;
  transition: opacity var(--duration-fast) var(--ease-out);
}
.composer-button-send[data-visible="false"],
.composer-button-stop[data-visible="false"] {
  opacity: 0;
  pointer-events: none;
}
```

### Image Paste Handler
```typescript
// Source: Standard DOM clipboard API
function handlePaste(e: React.ClipboardEvent) {
  const items = Array.from(e.clipboardData.items);
  const imageItems = items.filter(item => item.type.startsWith('image/'));

  for (const item of imageItems) {
    const file = item.getAsFile();
    if (!file) continue;

    if (file.size > 5 * 1024 * 1024) {
      toast.error(`Image too large: ${(file.size / 1024 / 1024).toFixed(1)}MB (max 5MB)`);
      continue;
    }

    if (attachments.length >= 5) {
      toast.error('Maximum 5 images per message');
      break;
    }

    const previewUrl = URL.createObjectURL(file);
    addAttachment({ file, previewUrl });
  }
}
```

### Drag Counter Pattern (Prevents Flicker)
```typescript
const dragCounterRef = useRef(0);

const handleDragEnter = (e: React.DragEvent) => {
  e.preventDefault();
  dragCounterRef.current++;
  if (dragCounterRef.current === 1) setIsDragOver(true);
};

const handleDragLeave = (e: React.DragEvent) => {
  e.preventDefault();
  dragCounterRef.current--;
  if (dragCounterRef.current === 0) setIsDragOver(false);
};

const handleDrop = (e: React.DragEvent) => {
  e.preventDefault();
  dragCounterRef.current = 0;
  setIsDragOver(false);
  // Process dropped files...
};
```

### WebSocket Send with Images
```typescript
// Source: Verified against server/claude-sdk.js handleImages() and types/websocket.ts ClaudeCommandOptions
async function sendWithImages(
  text: string,
  images: Array<{ file: File; previewUrl: string }>,
  options: Record<string, string>,
) {
  // Convert ObjectURL previews to base64 for WebSocket transport
  const imageData = await Promise.all(
    images.map(async (img) => ({
      data: await fileToBase64(img.file),
      name: img.file.name,
    }))
  );

  wsClient.send({
    type: 'claude-command',
    command: text,
    options: {
      ...options,
      images: imageData,
    },
  });

  // Revoke preview URLs after send
  images.forEach(img => URL.revokeObjectURL(img.previewUrl));
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `react-textarea-autosize` | Custom `useLayoutEffect` hook | React 18+ | Avoids `@babel/runtime` dependency (mentioned in REQUIREMENTS.md Out of Scope) |
| Controlled height via state | Direct DOM mutation in useLayoutEffect | React 18+ | Zero re-renders for height changes |
| File upload via REST | WebSocket inline base64 | Project decision | No extra round-trip, backend already supports it |
| Disabled input during streaming | Enabled input with message queuing | This phase | Better UX -- matches Claude CLI behavior |

**Deprecated/outdated:**
- `react-textarea-autosize`: Pulls `@babel/runtime`, explicitly excluded in REQUIREMENTS.md
- REST image upload: Backend has `handleImages()` that works with WebSocket inline data

## Open Questions

1. **Queued message backend behavior**
   - What we know: CONTEXT.md says "backend queues it" and user sees optimistic message with "Queued" badge
   - What's unclear: Does the backend actually queue `claude-command` messages during active streaming, or does it reject/buffer them? The existing `abort-session` type suggests the backend handles concurrent commands.
   - Recommendation: Test manually. If backend doesn't queue, buffer the message client-side and send when `claude-complete` fires. The optimistic UI works either way.

2. **`claude-abort` vs `abort-session` for Cmd+. shortcut**
   - What we know: CONTEXT.md says "Send `abort-session` (existing pattern) for stop, `claude-abort` for Cmd+. shortcut"
   - What's unclear: There is no `claude-abort` type in the current `ClientMessage` union. Only `abort-session` exists.
   - Recommendation: Use `abort-session` for both Stop button and Cmd+. shortcut. Add `claude-abort` as a new ClientMessage type only if backend differentiates the two (check `server/routes/` for handling).

3. **Draft dot indicator in sidebar**
   - What we know: SessionItem needs a primary-colored dot for sessions with drafts
   - What's unclear: How does SessionItem know about drafts? It receives data as props only.
   - Recommendation: Expose a `sessionsWithDrafts: Set<string>` from a custom hook or lightweight store. SessionItem gets `hasDraft` boolean prop.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest + @testing-library/react |
| Config file | `src/vite.config.ts` (test section) |
| Quick run command | `cd /home/swd/loom/src && npx vitest run --reporter=verbose` |
| Full suite command | `cd /home/swd/loom/src && npx vitest run --coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CMP-01 | Auto-resize textarea via useLayoutEffect | unit | `cd /home/swd/loom/src && npx vitest run src/components/chat/composer/useAutoResize.test.ts -x` | Wave 0 |
| CMP-02 | Max height cap + overflow behavior | unit | `cd /home/swd/loom/src && npx vitest run src/components/chat/composer/useAutoResize.test.ts -x` | Wave 0 |
| CMP-03 | Enter sends, Shift+Enter newline | unit | `cd /home/swd/loom/src && npx vitest run src/components/chat/composer/ChatComposer.test.tsx -x` | Wave 0 |
| CMP-04 | Send/Stop button morph crossfade | unit | `cd /home/swd/loom/src && npx vitest run src/components/chat/composer/ChatComposer.test.tsx -x` | Wave 0 |
| CMP-05 | 5-state machine transitions | unit | `cd /home/swd/loom/src && npx vitest run src/components/chat/composer/useComposerState.test.ts -x` | Wave 0 |
| CMP-06 | Stop sends abort via WebSocket | unit | `cd /home/swd/loom/src && npx vitest run src/components/chat/composer/ChatComposer.test.tsx -x` | Wave 0 |
| CMP-07 | Image paste extracts clipboard images | unit | `cd /home/swd/loom/src && npx vitest run src/components/chat/composer/useImageAttachments.test.ts -x` | Wave 0 |
| CMP-08 | Drag-and-drop with overlay | unit | `cd /home/swd/loom/src && npx vitest run src/components/chat/composer/useImageAttachments.test.ts -x` | Wave 0 |
| CMP-09 | ObjectURL lifecycle (create/revoke) | unit | `cd /home/swd/loom/src && npx vitest run src/components/chat/composer/useImageAttachments.test.ts -x` | Wave 0 |
| CMP-10 | Images sent in WebSocket options.images | integration | `cd /home/swd/loom/src && npx vitest run src/components/chat/composer/ChatComposer.test.tsx -x` | Wave 0 |
| CMP-11 | Global Cmd+./Escape shortcuts | unit | `cd /home/swd/loom/src && npx vitest run src/components/chat/composer/ChatComposer.test.tsx -x` | Wave 0 |
| CMP-12 | Draft persistence across sessions | unit | `cd /home/swd/loom/src && npx vitest run src/components/chat/composer/useDraftPersistence.test.ts -x` | Wave 0 |
| CMP-13 | CSS Grid integration scroll stability | manual-only | N/A -- requires visual inspection of scroll behavior during resize | N/A |
| CMP-14 | Auto-focus on session switch | unit | `cd /home/swd/loom/src && npx vitest run src/components/chat/composer/ChatComposer.test.tsx -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd /home/swd/loom/src && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd /home/swd/loom/src && npx vitest run --coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/components/chat/composer/useAutoResize.test.ts` -- covers CMP-01, CMP-02
- [ ] `src/components/chat/composer/useComposerState.test.ts` -- covers CMP-05 (state machine transitions)
- [ ] `src/components/chat/composer/useImageAttachments.test.ts` -- covers CMP-07, CMP-08, CMP-09
- [ ] `src/components/chat/composer/useDraftPersistence.test.ts` -- covers CMP-12
- [ ] `src/components/chat/composer/ChatComposer.test.tsx` -- covers CMP-03, CMP-04, CMP-06, CMP-10, CMP-11, CMP-14

## Sources

### Primary (HIGH confidence)
- Project codebase: `src/src/components/chat/composer/ChatComposer.tsx` -- existing M1 implementation
- Project codebase: `src/src/stores/stream.ts` -- isStreaming, activeSessionId selectors
- Project codebase: `src/src/stores/timeline.ts` -- addMessage, addSession, updateSessionTitle
- Project codebase: `src/src/lib/websocket-client.ts` -- send() method, ClientMessage types
- Project codebase: `src/src/types/websocket.ts` -- ClaudeCommandOptions includes `images?: Array<{ data: string }>`
- Project codebase: `server/claude-sdk.js:311-357` -- handleImages() accepts base64 data URLs, saves to temp files
- Project codebase: `src/src/components/ui/kbd.tsx` -- keyboard hint component
- Project codebase: `src/src/components/ui/sonner.tsx` -- toast configuration (dark theme, OKLCH tokens)
- Project codebase: `src/src/components/sidebar/SessionItem.tsx` -- props-only pattern for draft indicator

### Secondary (MEDIUM confidence)
- React docs: useLayoutEffect for synchronous DOM measurements (standard pattern)
- MDN: ClipboardEvent.clipboardData, DataTransfer API, URL.createObjectURL/revokeObjectURL

### Tertiary (LOW confidence)
- Backend message queuing behavior during active streaming -- needs manual testing

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all existing project infrastructure
- Architecture: HIGH -- patterns are well-understood React/DOM APIs, verified against codebase
- Pitfalls: HIGH -- based on real M1 lessons (useLayoutEffect, rAF focus) and standard DOM gotchas
- Backend integration: MEDIUM -- handleImages() format verified, but message queuing during streaming untested

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (stable -- no fast-moving dependencies)
