# Phase 14: Message Types - Research

**Researched:** 2026-03-07
**Domain:** React component architecture, message type rendering, image lightbox, global state toggle
**Confidence:** HIGH

## Summary

Phase 14 expands the chat message rendering system from a 2-way dispatch (user/assistant) to a 5-way dispatch covering all message roles, plus adds thinking block improvements, image display with lightbox, and historical/streamed consistency. The codebase is well-prepared: `MessageRole` already includes all 5 types, `MessageContainer` needs role expansion, `MessageList` needs a switch, and `transformBackendMessages` needs to pass through non-user/assistant entries.

The work is primarily component creation (3 new message type components, 1 lightbox, 1 image thumbnail grid), component modification (MessageContainer, MessageList, AssistantMessage, UserMessage, ThinkingDisclosure, useUIStore, transformBackendMessages), and one new type field (ImageAttachment on Message). No new external dependencies are needed -- shadcn Dialog is already installed and OKLCH-restyled, Lucide icons are already in use, and `formatRelativeTime` already exists.

**Primary recommendation:** Structure work in 3 waves -- (1) MessageContainer expansion + 3 new message components + MessageList 5-way switch + transformBackendMessages expansion, (2) ThinkingDisclosure refactor + global toggle + AssistantMessage provider header, (3) Image thumbnails + lightbox + MarkdownRenderer img override.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- User messages: right-aligned bubble, switch from `bg-primary-muted` to `bg-card`, plain text only (no markdown), hover timestamp with opacity 0->1 absolute positioning, `rounded-2xl` retained
- Assistant messages: small 16px inline SVG provider logo + provider name above content, inline SVG React components (`<ClaudeLogo />`, `<GeminiLogo />`, `<CodexLogo />`), no background, content via MarkdownRenderer, no hover timestamp, provider from `message.providerContext.providerId`
- Error messages: inline banner with `border-l-4 border-error` accent, `bg-error/10` background, error icon + text, no retry button in M2 (deferred to Phase 19 per ENH-04)
- System messages: centered horizontally, `text-muted text-xs`, no background. For "Session started", "Context compacted", etc.
- Task notifications: distinct checklist icon, label text, `bg-surface-1` background, compact layout
- MessageContainer role prop expanded to `'user' | 'assistant' | 'system' | 'error' | 'task_notification'`
- System and error messages must NOT use 80% bubble constraint -- full-width or centered treatment
- `transformBackendMessages` must be expanded to pass through error/system/task entries
- MessageList dispatch updated from 2-way to 5-way switch
- ThinkingDisclosure: refactor props to `blocks: ThinkingBlock[]` + `isStreaming: boolean`
- ThinkingDisclosure collapsed label: duration first when available ("Thinking (took 3.2s)"), fall back to char count ("Thinking (1,234 chars)"), both when both ("Thinking (1,234 chars, 3.2s)")
- ThinkingDisclosure: plain monospace text `italic text-muted font-mono text-sm`
- Global thinking toggle: button in chat header, Brain/BrainCircuit icon, persisted to localStorage via `useUiStore.thinkingExpanded`, individual override still works
- Image attachment type: `{ id: string; url: string; name: string; width?: number; height?: number }`
- Image thumbnails: max 200px width, aspect preserved, `rounded-lg`, `cursor-pointer`, horizontal row with `gap-2`
- Lightbox: shadcn Dialog with `bg-black/80` backdrop, `max-w-[90vw] max-h-[90vh] object-contain`, dismiss via backdrop/Escape/X, no zoom
- Assistant inline images: handled by MarkdownRenderer `img` component override, also clickable for lightbox
- Image URL lifecycle: key on attachment id not URL to handle optimistic->persisted transition
- Historical = streamed consistency: same components for both

### Claude's Discretion
- Exact provider logo SVG paths and colors
- Error/system/task notification icon choices (Lucide library)
- Relative time formatting implementation ("2m ago", "1h ago", "yesterday")
- Image thumbnail grid layout details for edge cases (1 image vs 5 images)
- ThinkingDisclosure internal refactoring if needed for shared streaming/historical use

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MSG-01 | User messages: `bg-card` background, `rounded-lg`, pre-wrapped text, hover timestamp | UserMessage component modification, `formatRelativeTime` already exists |
| MSG-02 | Assistant messages: no background, left-aligned, MarkdownRenderer, provider logo/icon header | AssistantMessage modification + new provider logo SVG components |
| MSG-03 | Error messages: inline banner with error accent and icon | New ErrorMessage component + `transformBackendMessages` expansion |
| MSG-04 | System messages: centered, muted, small font, no background | New SystemMessage component + `transformBackendMessages` expansion |
| MSG-05 | Task notification messages: distinct icon, label, surface background | New TaskNotificationMessage component + `transformBackendMessages` expansion |
| MSG-06 | Thinking blocks: expand/collapse with char count and duration labels | ThinkingDisclosure refactor (props: blocks + isStreaming) |
| MSG-07 | Thinking content: plain monospace text in M2 | ThinkingDisclosure CSS update (italic text-muted font-mono text-sm) |
| MSG-08 | Global thinking toggle in UI store, persisted to localStorage | useUIStore expansion + ChatHeader toggle button |
| MSG-09 | Image blocks: thumbnails with lightbox for user images, inline for assistant | ImageThumbnailGrid + ImageLightbox components |
| MSG-10 | Consistent spacing across all message types | MessageContainer expansion with role-aware layout |
| MSG-11 | Historical messages identical to streamed messages | AssistantMessage gains ThinkingDisclosure, same components used |

</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react | 19.x | Component rendering | Project stack |
| zustand | 5.x | State management (useUIStore) | Project stack, persist middleware |
| lucide-react | latest | Icons for error/system/task/brain toggle | Already used in 7+ components |
| radix-ui (Dialog) | via shadcn | Lightbox overlay | Already installed and OKLCH-restyled |

### Supporting (Already Available)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `formatRelativeTime` | internal | "2m ago" timestamps | User message hover timestamp |
| `cn()` utility | internal | Conditional Tailwind classes | All component styling |
| `MarkdownRenderer` | internal | Rich markdown for assistant messages | Already wired |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom lightbox | react-medium-image-zoom | Adds ~8KB for one feature, shadcn Dialog already exists |
| Intl.RelativeTimeFormat | Custom formatRelativeTime | Already have `formatRelativeTime` that handles all needed cases |

**Installation:**
```bash
# No new packages needed -- everything is already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/src/components/chat/view/
  MessageContainer.tsx        # MODIFY: expand role union to 5 types
  MessageList.tsx             # MODIFY: 5-way switch dispatch
  UserMessage.tsx             # MODIFY: bg-card, hover timestamp, image thumbnails
  AssistantMessage.tsx        # MODIFY: provider header, ThinkingDisclosure
  ErrorMessage.tsx            # NEW: inline banner with error accent
  SystemMessage.tsx           # NEW: centered muted text
  TaskNotificationMessage.tsx # NEW: icon + label + surface bg
  ThinkingDisclosure.tsx      # MODIFY: refactor props, char count + duration
  ImageThumbnailGrid.tsx      # NEW: horizontal image thumbnails
  ImageLightbox.tsx           # NEW: Dialog-based fullscreen image viewer
  MarkdownRenderer.tsx        # MODIFY: add img component override for lightbox

src/src/components/chat/provider-logos/
  ClaudeLogo.tsx              # NEW: 16px inline SVG
  GeminiLogo.tsx              # NEW: 16px inline SVG
  CodexLogo.tsx               # NEW: 16px inline SVG
  ProviderHeader.tsx          # NEW: logo + name text component

src/src/types/
  message.ts                  # MODIFY: add ImageAttachment + attachments field

src/src/stores/
  ui.ts                       # MODIFY: add thinkingExpanded boolean + toggle action

src/src/lib/
  transformMessages.ts        # MODIFY: pass through error/system/task entries
```

### Pattern 1: MessageContainer Role Expansion
**What:** Expand the role prop union and use `data-role` for CSS-driven styling
**When to use:** All message rendering
**Example:**
```typescript
// MessageContainer.tsx
interface MessageContainerProps {
  children: ReactNode;
  role: 'user' | 'assistant' | 'system' | 'error' | 'task_notification';
}

export function MessageContainer({ children, role }: MessageContainerProps) {
  return (
    <div
      className={cn(
        'px-4 py-3 leading-relaxed text-[length:var(--text-body)]',
        role === 'user' && 'flex justify-end',
        role === 'system' && 'flex justify-center',
        role === 'error' && 'w-full',
        role === 'task_notification' && 'w-full',
      )}
      data-role={role}
      data-testid="message-container"
    >
      {/* Role-specific inner wrapper */}
    </div>
  );
}
```

### Pattern 2: ThinkingDisclosure Dual-Mode Props
**What:** Standardize props to work for both streaming and historical contexts
**When to use:** ThinkingDisclosure component
**Example:**
```typescript
interface ThinkingDisclosureProps {
  blocks: ThinkingBlock[];
  isStreaming: boolean;
  /** Global toggle from UI store -- individual override still works */
  globalExpanded?: boolean;
}
```

Streaming caller passes: `blocks={streamStore.thinkingState.blocks}, isStreaming={true}`
Historical caller passes: `blocks={message.thinkingBlocks ?? []}, isStreaming={false}`

### Pattern 3: Image Lightbox State
**What:** Local component state for lightbox, shared across all image sources
**When to use:** ImageLightbox component consumed by both UserMessage and MarkdownRenderer
**Example:**
```typescript
// Lightbox state managed via React state, not global store
const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

// Shared component
<ImageLightbox
  src={lightboxSrc}
  alt={lightboxAlt}
  open={lightboxSrc !== null}
  onClose={() => setLightboxSrc(null)}
/>
```

### Pattern 4: MessageList 5-Way Switch
**What:** Replace ternary with switch for message role dispatch
**When to use:** MessageList rendering
**Example:**
```typescript
function renderMessage(msg: Message) {
  switch (msg.role) {
    case 'user':
      return <UserMessage message={msg} />;
    case 'assistant':
      return <AssistantMessage message={msg} />;
    case 'error':
      return <ErrorMessage message={msg} />;
    case 'system':
      return <SystemMessage message={msg} />;
    case 'task_notification':
      return <TaskNotificationMessage message={msg} />;
  }
}
```

### Anti-Patterns to Avoid
- **Don't put lightbox state in Zustand:** It's purely ephemeral UI state local to the component that opened it. No persistence, no cross-component access needed.
- **Don't render user messages with MarkdownRenderer:** User explicitly decided no markdown for user messages -- backticks in code prompts would misrender.
- **Don't add `thinkingExpanded` to ephemeral state:** It must be persisted via `partialize` in useUIStore (localStorage).
- **Don't use separate ThinkingDisclosure components for streaming vs historical:** One component, two prop shapes unified via the blocks+isStreaming interface.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Lightbox overlay | Custom portal + backdrop + positioning | shadcn Dialog with custom styling | Accessibility (focus trap, escape, aria), already restyled to OKLCH |
| Relative time formatting | New formatter | Existing `formatRelativeTime()` in `src/src/lib/formatTime.ts` | Already handles all thresholds: just now, Xm ago, Xh ago, Xd ago, date |
| Icon components | Custom SVGs from scratch | Lucide React icons | Consistent with codebase, tree-shakeable, already imported |
| Expand/collapse animation | JS-driven height calc | CSS Grid `grid-template-rows: 0fr/1fr` | Already proven in ThinkingDisclosure, Constitution Tier 1 motion |

**Key insight:** This phase is almost entirely component composition using existing primitives. The only "new infrastructure" is the 3 provider logo SVGs and the ImageLightbox wrapper around shadcn Dialog.

## Common Pitfalls

### Pitfall 1: transformBackendMessages Filtering
**What goes wrong:** New message types (error, system, task_notification) are filtered out by the current `entry.type !== 'user' && entry.type !== 'assistant'` guard, so they never appear in historical sessions.
**Why it happens:** The filter was written when only user/assistant existed. Backend may send entries with `type: 'system'` or `type: 'error'` for context compaction notices, error events, etc.
**How to avoid:** Expand the filter allowlist OR switch to a denylist approach. Check what entry types the backend actually sends -- the backend currently only sends `user` and `assistant` as JSONL entry types, so error/system messages will likely need to be synthesized from WebSocket events (claude-error, system notifications) rather than found in JSONL history.
**Warning signs:** Error messages show during streaming but vanish on page reload.

### Pitfall 2: ThinkingDisclosure Prop Shape Mismatch
**What goes wrong:** Current ThinkingDisclosure takes `ThinkingState` (which has `isThinking: boolean` + `blocks`). Historical messages have `ThinkingBlock[]` without `isThinking`. Changing the interface without updating both callers (ActiveMessage and AssistantMessage) causes type errors.
**Why it happens:** Two different data shapes for the same visual concept.
**How to avoid:** Change to `blocks: ThinkingBlock[]` + `isStreaming: boolean` as decided. Update both ActiveMessage (passes thinkingState.blocks + true) and AssistantMessage (passes message.thinkingBlocks + false) simultaneously.
**Warning signs:** TypeScript errors in ActiveMessage.tsx after modifying ThinkingDisclosure props.

### Pitfall 3: Hover Timestamp Layout Shift
**What goes wrong:** Adding a timestamp element below the user bubble causes layout shift on hover, pushing messages down.
**Why it happens:** Normal flow elements change document height when shown/hidden.
**How to avoid:** Use absolute positioning with opacity transition. The timestamp div sits OUTSIDE normal flow (`position: absolute, bottom: -20px, right: 0`), with the parent having `position: relative`. Only opacity changes on hover -- zero geometry change.
**Warning signs:** Messages below the hovered message jump/shift when hovering.

### Pitfall 4: Global Thinking Toggle vs Individual Override
**What goes wrong:** Setting globalExpanded to false collapses ALL disclosures permanently with no way to expand individual ones.
**Why it happens:** Using global state as the sole source of truth instead of treating it as a default.
**How to avoid:** Three-state logic: `userToggled` (per-instance) takes priority over `globalExpanded` (from store). When global changes, reset `userToggled` to null so the new global takes effect. Individual clicks set `userToggled` to override.
**Warning signs:** User clicks a specific thinking block but nothing happens because global override is dominant.

### Pitfall 5: Image URL Lifecycle Flash
**What goes wrong:** When a user sends a message with images, the optimistic message uses `URL.createObjectURL(blob)`. When the message is persisted and reloaded, the URL changes to a backend URL, causing the image to flash/unmount/remount.
**Why it happens:** React uses the key/src to determine whether to reuse or replace img elements.
**How to avoid:** Key images on `attachment.id` (stable across lifecycle), not on `attachment.url`. The browser handles the src change gracefully if the element stays mounted.
**Warning signs:** Image thumbnails blink when the message transitions from optimistic to persisted.

### Pitfall 6: useUIStore partialize Must Include thinkingExpanded
**What goes wrong:** Adding `thinkingExpanded` to the store but forgetting to include it in `partialize` means it defaults to true on every reload.
**Why it happens:** The persist middleware only saves fields listed in `partialize`. New fields are silently ignored.
**How to avoid:** Add `thinkingExpanded` to the `partialize` return object AND bump the `version` number with a migration that provides a default.
**Warning signs:** Toggle state resets on page reload.

## Code Examples

### ErrorMessage Component
```typescript
// Source: Constitution patterns + CONTEXT.md decisions
import { AlertCircle } from 'lucide-react';
import { MessageContainer } from './MessageContainer';
import type { Message } from '@/types/message';

interface ErrorMessageProps {
  message: Message;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <MessageContainer role="error">
      <div className="flex items-start gap-3 rounded-lg border-l-4 border-destructive bg-destructive/10 px-4 py-3">
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
        <p className="text-sm text-foreground">{message.content}</p>
      </div>
    </MessageContainer>
  );
}
```

### SystemMessage Component
```typescript
import { MessageContainer } from './MessageContainer';
import type { Message } from '@/types/message';

interface SystemMessageProps {
  message: Message;
}

export function SystemMessage({ message }: SystemMessageProps) {
  return (
    <MessageContainer role="system">
      <p className="text-center text-xs text-muted">{message.content}</p>
    </MessageContainer>
  );
}
```

### User Message Hover Timestamp
```typescript
// Absolute positioning, opacity transition, zero layout shift
import { useState } from 'react';
import { formatRelativeTime } from '@/lib/formatTime';

// Inside UserMessage:
<div className="group relative">
  <div className="max-w-[80%] rounded-2xl px-4 py-2 bg-card text-foreground">
    {/* image thumbnails here */}
    <div className="whitespace-pre-wrap break-words">{message.content}</div>
  </div>
  <span className="absolute -bottom-5 right-0 text-xs text-muted opacity-0 transition-opacity group-hover:opacity-100">
    {formatRelativeTime(message.metadata.timestamp)}
  </span>
</div>
```

### ThinkingDisclosure Collapsed Label
```typescript
function getThinkingLabel(blocks: ThinkingBlock[], isStreaming: boolean): string {
  if (isStreaming) return ''; // Pulse "Thinking..." instead

  const totalChars = blocks.reduce((sum, b) => sum + b.text.length, 0);
  const charLabel = `${totalChars.toLocaleString()} chars`;

  // Duration: would come from block timestamps if backend provides them
  // For now, char count only
  return `Thinking (${charLabel})`;
}
```

### ImageAttachment Type Addition
```typescript
// In src/src/types/message.ts
export interface ImageAttachment {
  id: string;
  url: string;
  name: string;
  width?: number;
  height?: number;
}

export interface Message {
  // ... existing fields ...
  attachments?: ImageAttachment[];
}
```

### ImageLightbox Using shadcn Dialog
```typescript
import { Dialog, DialogContent, DialogOverlay } from '@/components/ui/dialog';

interface ImageLightboxProps {
  src: string | null;
  alt?: string;
  open: boolean;
  onClose: () => void;
}

export function ImageLightbox({ src, alt, open, onClose }: ImageLightboxProps) {
  if (!src) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="border-none bg-transparent p-0 shadow-none max-w-[90vw]"
        showCloseButton
      >
        <img
          src={src}
          alt={alt ?? ''}
          className="max-h-[90vh] max-w-[90vw] object-contain"
        />
      </DialogContent>
    </Dialog>
  );
}
```

### Provider Header Component
```typescript
import type { ProviderId } from '@/types/provider';
import { ClaudeLogo } from './ClaudeLogo';
import { GeminiLogo } from './GeminiLogo';
import { CodexLogo } from './CodexLogo';

const PROVIDER_NAMES: Record<ProviderId, string> = {
  claude: 'Claude',
  gemini: 'Gemini',
  codex: 'Codex',
};

const PROVIDER_LOGOS: Record<ProviderId, React.FC<{ className?: string }>> = {
  claude: ClaudeLogo,
  gemini: GeminiLogo,
  codex: CodexLogo,
};

interface ProviderHeaderProps {
  providerId: ProviderId;
}

export function ProviderHeader({ providerId }: ProviderHeaderProps) {
  const Logo = PROVIDER_LOGOS[providerId];
  return (
    <div className="mb-1 flex items-center gap-1.5">
      <Logo className="size-4" />
      <span className="text-xs text-muted">{PROVIDER_NAMES[providerId]}</span>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| ThinkingDisclosure takes `ThinkingState` | Will take `blocks[]` + `isStreaming` | Phase 14 | Enables historical thinking block rendering |
| MessageContainer handles 2 roles | Will handle 5 roles | Phase 14 | Central dispatch for all message types |
| transformBackendMessages filters to user/assistant | Must allow error/system/task | Phase 14 | Historical load of non-chat messages |
| No global thinking toggle | useUIStore.thinkingExpanded | Phase 14 | User preference persisted to localStorage |

**Important backend reality:** Looking at the backend API contract and JSONL format, the backend currently only sends `user` and `assistant` entry types in the JSONL history. Error messages come as `claude-error` WebSocket events, system messages come as `system` SDK data type with subtypes. Task notifications are not currently a standard backend type. This means:
- Error messages during streaming: created from `onError` callback (already wired)
- Error messages in history: likely NOT in JSONL -- need to synthesize from session error state or accept that errors don't persist across reloads
- System messages during streaming: can be created from `system` SDK data subtype
- System messages in history: unlikely in JSONL unless backend is extended
- Task notifications: frontend-only concept for now

This is not a blocker -- the components should be built to render these message types when they exist. The gap is on the data production side, not the rendering side. `transformBackendMessages` should be expanded to pass through any future backend entry types.

## Open Questions

1. **Backend JSONL entry types for error/system messages**
   - What we know: Backend sends `user` and `assistant` as JSONL entry types. Errors arrive as `claude-error` WebSocket events.
   - What's unclear: Whether errors and system messages get persisted to JSONL at all, or if they're ephemeral WebSocket events only.
   - Recommendation: Build the components and the 5-way switch. For `transformBackendMessages`, add a passthrough for `error`/`system` entry types IF they appear. Create error/system messages from WebSocket events during streaming. Accept that they may not survive page reload in M2 -- this is a backend enhancement for later.

2. **ThinkingBlock duration data**
   - What we know: CONTEXT.md says "Duration calculated from thinking block timestamps if backend provides them." Current `ThinkingBlock` type has `id`, `text`, `isComplete` -- no timestamps.
   - What's unclear: Whether the backend/SDK provides start/end timestamps for thinking blocks.
   - Recommendation: Add optional `startedAt`/`completedAt` to ThinkingBlock type. If the multiplexer can extract timing from the SDK data, populate them. Fall back to char count display when duration is unavailable.

3. **Lightbox for assistant inline images**
   - What we know: MarkdownRenderer has component overrides. CONTEXT.md says "Also clickable for lightbox (same shared component)."
   - What's unclear: How to share lightbox state between MarkdownRenderer (which renders inside AssistantMessage) and the lightbox component.
   - Recommendation: Lift lightbox state to MessageList or use a React context. Simplest: each AssistantMessage manages its own lightbox state and renders its own ImageLightbox instance (Dialog portals to body anyway, so nesting doesn't matter).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 |
| Config file | `src/vite.config.ts` (vitest config embedded) |
| Quick run command | `cd /home/swd/loom/src && npx vitest run --reporter=verbose` |
| Full suite command | `cd /home/swd/loom/src && npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MSG-01 | User message renders with bg-card, hover timestamp | unit | `cd /home/swd/loom/src && npx vitest run src/src/components/chat/view/UserMessage.test.tsx -x` | No -- Wave 0 |
| MSG-02 | Assistant message renders provider header + markdown | unit | `cd /home/swd/loom/src && npx vitest run src/src/components/chat/view/AssistantMessage.test.tsx -x` | No -- Wave 0 |
| MSG-03 | Error message renders inline banner with error accent | unit | `cd /home/swd/loom/src && npx vitest run src/src/components/chat/view/ErrorMessage.test.tsx -x` | No -- Wave 0 |
| MSG-04 | System message renders centered and muted | unit | `cd /home/swd/loom/src && npx vitest run src/src/components/chat/view/SystemMessage.test.tsx -x` | No -- Wave 0 |
| MSG-05 | Task notification renders with icon and surface bg | unit | `cd /home/swd/loom/src && npx vitest run src/src/components/chat/view/TaskNotificationMessage.test.tsx -x` | No -- Wave 0 |
| MSG-06 | ThinkingDisclosure shows char count + duration labels | unit | `cd /home/swd/loom/src && npx vitest run src/src/components/chat/view/ThinkingDisclosure.test.tsx -x` | Yes -- needs update |
| MSG-07 | Thinking content uses monospace italic styling | unit | covered by MSG-06 test | -- |
| MSG-08 | Global thinking toggle persists and affects all disclosures | unit | `cd /home/swd/loom/src && npx vitest run src/src/stores/ui.test.ts -x` | No -- Wave 0 |
| MSG-09 | Image thumbnails render, click opens lightbox | unit | `cd /home/swd/loom/src && npx vitest run src/src/components/chat/view/ImageLightbox.test.tsx -x` | No -- Wave 0 |
| MSG-10 | All message types use consistent spacing via MessageContainer | unit | covered by MSG-01 through MSG-05 tests | -- |
| MSG-11 | Historical messages use same components as streamed | unit | `cd /home/swd/loom/src && npx vitest run src/src/lib/transformMessages.test.ts -x` | Yes -- needs update |

### Sampling Rate
- **Per task commit:** `cd /home/swd/loom/src && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd /home/swd/loom/src && npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/src/components/chat/view/UserMessage.test.tsx` -- covers MSG-01
- [ ] `src/src/components/chat/view/AssistantMessage.test.tsx` -- covers MSG-02 (currently no test file)
- [ ] `src/src/components/chat/view/ErrorMessage.test.tsx` -- covers MSG-03
- [ ] `src/src/components/chat/view/SystemMessage.test.tsx` -- covers MSG-04
- [ ] `src/src/components/chat/view/TaskNotificationMessage.test.tsx` -- covers MSG-05
- [ ] `src/src/components/chat/view/ImageLightbox.test.tsx` -- covers MSG-09
- [ ] `src/src/stores/ui.test.ts` -- covers MSG-08 (thinkingExpanded toggle + persistence)
- [ ] Update `src/src/components/chat/view/ThinkingDisclosure.test.tsx` -- covers MSG-06/07 (prop refactor)
- [ ] Update `src/src/lib/transformMessages.test.ts` -- covers MSG-11 (new entry type passthrough)

## Sources

### Primary (HIGH confidence)
- Codebase analysis: All source files read directly (MessageContainer, ThinkingDisclosure, AssistantMessage, UserMessage, MessageList, message.ts, stream.ts, ui.ts, transformMessages.ts, stream-multiplexer.ts, websocket-init.ts, MarkdownRenderer.tsx, dialog.tsx, tokens.css, index.css, formatTime.ts)
- BACKEND_API_CONTRACT.md: WebSocket protocol and JSONL entry shapes
- CONTEXT.md: All user decisions for Phase 14

### Secondary (MEDIUM confidence)
- Backend server/index.js grep: Confirmed backend entry types are user/assistant only in JSONL

### Tertiary (LOW confidence)
- ThinkingBlock timestamp availability: No evidence the SDK provides timing data. Char count fallback is the safe default.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all tools already in codebase
- Architecture: HIGH -- clear component structure, established patterns (MessageContainer, cn(), CSS Grid, data-role)
- Pitfalls: HIGH -- directly identified from reading current code (filter guard, partialize, layout shift)
- Backend data: MEDIUM -- error/system messages may not persist in JSONL; components should handle gracefully

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (stable -- no external dependency changes expected)
