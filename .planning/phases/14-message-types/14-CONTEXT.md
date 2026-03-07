# Phase 14: Message Types - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Every message type in a real conversation renders with correct styling and layout. Covers all 7 message types (user, assistant, error, system, task_notification, thinking blocks, image blocks), the MessageContainer extension, historical thinking block rendering with global toggle, and image display with lightbox overlay. Tool card rendering is Phase 15-16 scope.

</domain>

<decisions>
## Implementation Decisions

### User message styling
- Right-aligned bubble layout (keep current pattern), switch background from `bg-primary-muted` to `bg-card`
- Plain text only — no markdown rendering for user messages (backticks/asterisks in coding prompts would misrender)
- Hover timestamp below the bubble, right-aligned: "2m ago" in muted xs text
- Zero layout shift: timestamp uses opacity 0->1 transition with absolute positioning (reserves no space)
- `rounded-2xl` bubble shape retained from current implementation

### Assistant message styling
- Small inline provider logo (16px SVG component) + provider name in muted text above message content
- Inline SVG React components for logos: `<ClaudeLogo />`, `<GeminiLogo />`, `<CodexLogo />` — no external image assets
- No background (transparent), left-aligned, content via MarkdownRenderer (existing pattern)
- No hover timestamp on assistant messages — provider header is sufficient visual anchor
- Provider info sourced from `message.providerContext.providerId`

### Error, system & task notification messages
- All message types share extended `MessageContainer` — role prop expanded to `'user' | 'assistant' | 'system' | 'error' | 'task_notification'`
- Consistent spacing for all: `px-4 py-3 leading-relaxed` (existing MessageContainer base)
- System and error messages must NOT use the 80% bubble constraint — full-width or centered treatment to distinguish from chat turns
- Error messages: inline banner with `border-l-4 border-error` accent, `bg-error/10` background, error icon, error text. No retry button in M2 (deferred to Phase 19 per ENH-04).
- System messages: centered horizontally, `text-muted text-xs`, no background. Used for "Session started", "Context compacted", etc.
- Task notifications: distinct checklist icon, label text, `bg-surface-1` background, compact layout
- MessageList dispatch updated from 2-way (user/assistant) to 5-way switch
- `transformBackendMessages` must be expanded to pass through error/system/task entries (currently filters to user/assistant only — blocks MSG-03/04/05 on historical load)

### Thinking blocks for historical messages
- Historical assistant messages render `ThinkingDisclosure` using `message.thinkingBlocks` data
- Default state: collapsed (show summary label, user clicks to expand)
- Collapsed label format: prioritize duration when available ("Thinking (took 3.2s)"), fall back to char count ("Thinking (1,234 chars)"), show both when both available ("Thinking (1,234 chars, 3.2s)")
- Duration calculated from thinking block timestamps if backend provides them
- Plain monospace text styling everywhere (both streaming and historical): `italic text-muted font-mono text-sm` (JetBrains Mono)
- Markdown rendering of thinking content deferred to M3 (Phase 19 per ENH-03)

### Global thinking toggle
- Toggle button in chat header area, next to session title
- Brain/thought-bubble icon (Lucide `Brain` or `BrainCircuit`)
- Click toggles between show-all and collapse-all modes
- Persisted to localStorage via UI store (`useUiStore.thinkingExpanded`)
- When collapse-all: all ThinkingDisclosure instances render in collapsed state
- Individual user override still works (click to expand specific blocks even when global is collapsed)

### Image display
- Add `attachments?: ImageAttachment[]` to Message interface for image data
- `ImageAttachment` type: `{ id: string; url: string; name: string; width?: number; height?: number }`
- User-sent images: thumbnails above text content inside the user bubble (matches composer layout)
- Thumbnail size: max 200px width, aspect ratio preserved, `rounded-lg`, `cursor-pointer`
- Multiple images in horizontal row with `gap-2`, overflow handled gracefully
- Click thumbnail opens lightbox overlay

### Image lightbox
- Simple overlay with dark backdrop (`bg-black/80`) using shadcn Dialog
- Full-size image centered in viewport with `max-w-[90vw] max-h-[90vh] object-contain`
- Dismiss: click backdrop, press Escape, or click X button
- No zoom controls in M2 — just full-size view
- Shared lightbox component used by both user image thumbnails and assistant inline images

### Assistant-referenced images
- Inline at natural size within markdown flow, capped at `max-w-full` (container width)
- Handled by MarkdownRenderer `img` component override
- Also clickable for lightbox (same shared component)
- Rare in coding agent context but handles generated diagrams, screenshots

### ThinkingDisclosure prop refactor (Bard review finding)
- Current `ThinkingDisclosure` takes `ThinkingState` (streaming shape with `isThinking` boolean). Historical messages have `ThinkingBlock[]` — different shape.
- Refactor props to: `blocks: ThinkingBlock[]` + `isStreaming: boolean` (standardized interface for both contexts)
- Streaming caller: passes `streamStore.thinkingState.blocks` + `isStreaming: true`
- Historical caller: passes `message.thinkingBlocks` + `isStreaming: false`
- This ensures "Thinking..." pulse for live streaming and "Thinking (1,234 chars, 3.2s)" for history

### Image URL lifecycle (Bard review finding)
- Optimistic user messages use `URL.createObjectURL(blob)` from composer (Phase 13 pattern)
- Historical messages will have base64 data URLs from backend JSONL
- `ImageAttachment.url` must handle both URL types without unmounting/flashing the image on transition
- When a message goes from optimistic to persisted, the URL may change — handle via key stability (key on attachment id, not URL)

### Historical = streamed consistency (MSG-11)
- Historical messages must use identical components to streamed messages
- AssistantMessage gains ThinkingDisclosure rendering (currently missing)
- Same MarkdownRenderer, same tool chip markers, same MessageContainer
- ThinkingDisclosure component shared between ActiveMessage (streaming) and AssistantMessage (historical)

### Claude's Discretion
- Exact provider logo SVG paths and colors
- Error/system/task notification icon choices (Lucide library)
- Relative time formatting implementation ("2m ago", "1h ago", "yesterday")
- Image thumbnail grid layout details for edge cases (1 image vs 5 images)
- ThinkingDisclosure internal refactoring if needed for shared streaming/historical use

</decisions>

<specifics>
## Specific Ideas

- Provider logo + name pattern: "Claude" / "Gemini" / "Codex" — matches how Cursor shows the model name above responses
- Thinking blocks should feel like "internal monologue" — muted, italic, monospace. Not competing visually with the actual response content.
- Lightbox should be dead simple — shadcn Dialog with dark backdrop, no gallery/carousel. Just one image at a time.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `MessageContainer` (src/src/components/chat/view/MessageContainer.tsx): Currently handles `user|assistant`. Needs role expansion to 5 types. Base spacing already correct.
- `ThinkingDisclosure` (src/src/components/chat/view/ThinkingDisclosure.tsx): Streaming-only currently. Needs prop adaptation for historical ThinkingBlock[] data (currently takes ThinkingState).
- `MarkdownRenderer` (src/src/components/chat/view/MarkdownRenderer.tsx): Has `img` component override slot — can add lightbox click handler there.
- `AssistantMessage` (src/src/components/chat/view/AssistantMessage.tsx): Needs ThinkingDisclosure integration + provider header.
- `UserMessage` (src/src/components/chat/view/UserMessage.tsx): Needs image thumbnails + hover timestamp.
- `MessageList` (src/src/components/chat/view/MessageList.tsx): Currently 2-way dispatch (user/assistant). Needs 5-way switch.
- `Dialog` (src/src/components/ui/dialog.tsx): shadcn Dialog already installed and OKLCH-restyled. Use for lightbox.
- `useUiStore` (src/src/stores/ui.ts): Persisted UI preferences store. Add `thinkingExpanded` boolean.
- `Message` type (src/src/types/message.ts): Has `MessageRole` with all 5 roles already. Needs `attachments` field.

### Established Patterns
- `MessageContainer` with `data-role` attribute for CSS-driven role styling
- `cn()` utility for conditional Tailwind classes
- CSS Grid `grid-template-rows: 0fr/1fr` for expand/collapse (ThinkingDisclosure)
- Selector-only Zustand subscriptions (Constitution 4.2)
- Named exports only (Constitution 2.2)

### Integration Points
- `MessageList` renders all message types — central dispatch point
- `transformBackendMessages` filters to user/assistant only — needs expansion for system/error/task types if backend sends them
- `useStreamStore.thinkingState` feeds streaming ThinkingDisclosure; `message.thinkingBlocks` feeds historical
- `message.providerContext.providerId` drives logo selection in assistant header
- `wsClient` message types may include error/system events that need to create Message objects

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 14-message-types*
*Context gathered: 2026-03-07*
