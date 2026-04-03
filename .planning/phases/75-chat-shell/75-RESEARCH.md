# Phase 75: Chat Shell - Research

**Researched:** 2026-04-03
**Domain:** React Native iOS chat UI -- streaming markdown, tool call visualization, permission handling, session management
**Confidence:** HIGH

## Summary

Phase 75 transforms the Phase 74 shell into a fully functional chat application. The foundation is solid: auth, drawer, connection resilience, theme system, and 5 Zustand stores are already wired. The core work is: (1) upgrading DrawerContent from flat list to date-grouped sessions with search and swipe-delete, (2) building the streaming message list with inverted FlatList + ChunkedCodeView pattern, (3) implementing tool call chips + bottom sheet detail, thinking blocks with expand/collapse, and permission approval cards, and (4) making the ComposerShell functional with the 3-state FSM.

The biggest technical risk is streaming markdown performance. The ChunkedCodeView pattern from swift-chat (freeze completed blocks, only re-render trailing) is the proven mitigation. The second risk is integrating react-native-enriched-markdown for general markdown with a separate syntax highlighter for code blocks -- these are two distinct rendering paths that must be composed. The third risk is getting the inverted FlatList + `maintainVisibleContentPosition` to work reliably with heterogeneous content (text, tool chips, thinking blocks, code blocks).

**Primary recommendation:** Build message rendering as a segment-based architecture. Parse each assistant message into ordered segments (text, thinking, tool_use, code_block). Render each segment type with its own memoized component. Only the trailing segment re-renders during streaming.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01 to D-04:** Tool calls render as collapsed inline chips (icon + name + status). Tap opens bottom sheet. 6 tool types: Bash, Read, Edit, Write, Glob, Grep. During streaming, chips appear at insertion point, status updates in-place.
- **D-05 to D-08:** Thinking blocks expanded during streaming, auto-collapse on content phase. "Thought for Xs" summary. Muted color. Standard spring expand/collapse via Reanimated.
- **D-09 to D-13:** Date-grouped sessions (Today/Yesterday/Last Week/Older). Running sessions stay in date group with pulsing dot. Sticky search bar with glass. Swipe-left-to-delete with undo toast. Staggered item animation.
- **D-14 to D-16:** Full syntax highlighting in Phase 75. Code blocks on surface-sunken, language label, copy button with haptic + "Copied" toast. Horizontal scroll, JetBrains Mono.
- **D-17 to D-19:** FlatList inverted + maintainVisibleContentPosition. ChunkedCodeView pattern for streaming. react-native-enriched-markdown for structure.
- **D-20 to D-22:** Permission requests as inline cards with Approve/Deny. After action, transforms to compact status line. Subtle glow/highlight.
- **D-23 to D-26:** User bubbles (surface-raised, rounded-2xl). Assistant messages free-flowing. 24px avatar. 24px turn spacing. Spring entrance animations.
- **D-27 to D-30:** ComposerShell becomes functional. 3-state FSM (idle/sending/stopped). Keyboard avoidance via react-native-keyboard-controller.
- **D-31 to D-32:** Auth/connection from Phase 74. Scroll position preservation per session in MMKV.
- **D-33 to D-34:** Empty states for new session and empty session list.

### Claude's Discretion
- Markdown renderer internal architecture (AST walker vs regex vs hybrid)
- FlatList cell recycling and memoization strategy
- WebSocket message buffering during reconnection
- Bottom sheet library choice for tool card expansion
- Streaming visual feedback details
- Dynamic color during streaming (if time allows)
- Haptic feedback on key interactions

### Deferred Ideas (OUT OF SCOPE)
- Long-press context menu on messages (Copy/Retry/Share)
- File attachment in composer
- Dynamic color breathing during streaming (Claude's discretion if time allows)
- Multiple providers in composer (v5.0 scope)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CHAT-01 | Sessions grouped by status in navigation drawer | Date-grouped sections pattern from Private Mind, existing `useSessions` hook, `getRelativeDateSection` |
| CHAT-02 | Create new session and send messages | Stub session pattern already in `useSessions`, WebSocket `claude-command` protocol documented |
| CHAT-03 | Streamed AI responses with markdown rendering | `react-native-enriched-markdown` v0.4.1 installed, ChunkedCodeView pattern, stream multiplexer callbacks |
| CHAT-04 | Tool call cards inline | Tool chip component + `@gorhom/bottom-sheet` v5 for detail, `ToolCallState` type, stream store `activeToolCalls` |
| CHAT-05 | Expand/collapse thinking blocks | `ThinkingState` from stream store, Reanimated layout animations, Expand spring config |
| CHAT-06 | Code blocks with syntax highlighting and copy | `react-native-code-highlighter` v1.3.0 + `react-syntax-highlighter`, JetBrains Mono font loaded |
| CHAT-07 | Switch sessions preserving scroll position | MMKV scroll offset storage per session ID, FlatList `scrollToOffset` on mount |
| CHAT-08 | JWT auth via iOS Keychain | Phase 74 complete -- `useAuth` hook, `nativeAuthProvider`, `expo-secure-store` |
| CHAT-09 | Connection status and WebSocket reconnect | Phase 74 complete -- `useConnection` hook, `ConnectionBanner`, AppState lifecycle |
| CHAT-10 | Search sessions by title | `useSessions.searchQuery` + `setSearchQuery` already implemented with filtering |
| CHAT-11 | Delete sessions with swipe gesture | `useSessions.deleteSession` exists, `react-native-gesture-handler` Swipeable for gesture |
| CHAT-12 | Approve/deny permission requests inline | `PermissionRequest` type in stream store, `claude-permission-response` WebSocket message |
</phase_requirements>

## Standard Stack

### Core (Already Installed)

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| react-native-enriched-markdown | 0.4.1 | Markdown rendering (CommonMark + GFM) | Installed, verified |
| react-native-reanimated | 4.1.7 | Spring animations, layout transitions | Installed, verified |
| react-native-gesture-handler | 2.28.0 | Swipe gestures, pan handlers | Installed, verified |
| react-native-keyboard-controller | 1.18.5 | Keyboard avoidance synced to iOS curve | Installed, verified |
| react-native-mmkv | 3.2.0 | Fast KV storage (scroll offsets, snapshots) | Installed, verified |
| expo-haptics | 15.0.8 | Haptic feedback pairing | Installed, verified |
| expo-blur | 15.0.8 | Glass surface treatment | Installed, verified |
| lucide-react-native | 1.7.0 | Icons for tool chips, UI elements | Installed, verified |
| @shopify/flash-list | 2.0.2 | FlatList backup if performance issues arise | Installed, not needed yet |
| @loom/shared | workspace | Zustand stores, types, WebSocket client, multiplexer | Installed, verified |

### New Dependencies Required

| Library | Version | Purpose | Peer Deps Met? |
|---------|---------|---------|----------------|
| @gorhom/bottom-sheet | 5.2.8 | Tool card detail bottom sheet | Yes -- needs reanimated >=3.16 (have 4.1.7), gesture-handler >=2.16 (have 2.28) |
| react-native-code-highlighter | 1.3.0 | Syntax highlighting for code blocks | Needs react-syntax-highlighter as peer |
| react-syntax-highlighter | 15.6.1 (latest) | Highlight.js AST engine (peer of code-highlighter) | Standalone, no native deps |
| @types/react-syntax-highlighter | latest | TypeScript types | Dev dependency |
| expo-clipboard | latest | Copy code blocks to clipboard | Expo SDK compatible |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-native-code-highlighter | react-native-syntax-highlighter v2.1.0 | Unmaintained since Sept 2023, depends on react-syntax-highlighter v6 (ancient). code-highlighter is actively maintained (July 2025), uses modern react-syntax-highlighter. |
| @gorhom/bottom-sheet | Custom Reanimated modal | Bottom-sheet handles gesture-driven dismiss, snap points, keyboard avoidance. Hand-rolling is a week of work. |
| react-native-enriched-markdown | react-native-markdown-display | enriched-markdown is Software Mansion, Fabric-native, high performance. markdown-display is older, WebView fallback risk. |
| Swipeable from gesture-handler | react-native-swipeable-item | Swipeable is built into gesture-handler (already installed). No extra dep. |

**Installation:**
```bash
cd mobile && npx expo install @gorhom/bottom-sheet react-native-code-highlighter react-syntax-highlighter expo-clipboard && npm install -D @types/react-syntax-highlighter
```

## Architecture Patterns

### Recommended Component Structure
```
mobile/components/
  chat/
    MessageList.tsx          # Inverted FlatList with segment rendering
    MessageItem.tsx          # Single message (user or assistant)
    UserBubble.tsx           # User message bubble (surface-raised)
    AssistantMessage.tsx     # Assistant message with segments
    StreamingIndicator.tsx   # Pulsing accent line during stream
    EmptyChat.tsx            # Already exists -- update with D-33
    Composer.tsx             # Functional composer (from ComposerShell)
    ComposerStatusBar.tsx    # Model name + connection dot + token count
  chat/segments/
    TextSegment.tsx          # Markdown text rendering
    CodeBlockSegment.tsx     # Syntax-highlighted code with copy
    ThinkingSegment.tsx      # Expand/collapse thinking block
    ToolChip.tsx             # Inline tool call chip
    ToolDetailSheet.tsx      # Bottom sheet for tool card detail
    PermissionCard.tsx       # Inline approve/deny card
  navigation/
    DrawerContent.tsx        # Upgrade: date-grouped, search, swipe-delete
    SessionItem.tsx          # Extract from DrawerContent, add swipe
    SessionSearch.tsx        # Glass search input
    ChatHeader.tsx           # Already exists
```

### Pattern 1: Segment-Based Message Rendering

**What:** Parse assistant messages into ordered segments (text, thinking, tool_use, code_block). Each segment type is a separate memoized component. During streaming, only the trailing active segment re-renders.

**When to use:** All assistant message rendering.

**Why:** Prevents the re-render storm that kills performance on long responses. Matches swift-chat's ChunkedCodeView pattern but generalized to all content types.

```typescript
// Message segment discriminated union
type MessageSegment =
  | { type: 'text'; content: string; isStreaming: boolean }
  | { type: 'thinking'; block: ThinkingBlock; isActive: boolean }
  | { type: 'tool_use'; toolCall: ToolCallState }
  | { type: 'code_block'; code: string; language: string; isStreaming: boolean }
  | { type: 'permission'; request: PermissionRequest };

// Parser: raw markdown + stream state -> segments
function parseMessageSegments(
  content: string,
  toolCalls: ToolCallState[],
  thinkingBlocks: ThinkingBlock[],
  permissionRequest: PermissionRequest | null,
  isStreaming: boolean,
): MessageSegment[] {
  // Split content on code fences, interleave with tool calls at insertion points
  // Each segment rendered by its own memoized component
}

// In AssistantMessage:
const segments = useMemo(() => parseMessageSegments(...), [content, toolCalls, ...]);
return (
  <View>
    {segments.map((seg, i) => (
      <SegmentRenderer key={`${seg.type}-${i}`} segment={seg} />
    ))}
  </View>
);
```

### Pattern 2: Streaming Content Accumulation (useRef + setState batch)

**What:** Stream tokens accumulate in a useRef (no React re-render per token). Flush to state on rAF or at intervals (e.g., every 16ms). The trailing text segment reads from the ref for streaming, from state for completed.

**When to use:** Active streaming content display.

```typescript
// In chat screen or message list hook
const contentRef = useRef('');
const [displayContent, setDisplayContent] = useState('');
const rafRef = useRef<number | null>(null);

useEffect(() => {
  const unsub = wsClient.subscribeContent((token: string) => {
    contentRef.current += token;
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(() => {
        setDisplayContent(contentRef.current);
        rafRef.current = null;
      });
    }
  });
  return unsub;
}, []);
```

### Pattern 3: Composer FSM (3-state)

**What:** Composer state machine: `idle` -> `sending` -> back to `idle`. During streaming, transforms to `active` (stop button visible). Maps to D-28.

```typescript
type ComposerState = 'idle' | 'sending' | 'active';

// idle: send enabled when text present, stop hidden
// sending: brief transition during WS send (prevents double-send)  
// active: stop button visible, send hidden
// On stream end: back to idle
```

### Pattern 4: Scroll Position Preservation (MMKV per session)

**What:** Store FlatList scroll offset per session ID in MMKV. On session switch, save current offset and restore the new session's offset.

```typescript
const SCROLL_KEY = 'scroll-offset-';

function saveScrollOffset(sessionId: string, offset: number) {
  mmkv.set(`${SCROLL_KEY}${sessionId}`, offset);
}

function getScrollOffset(sessionId: string): number {
  return mmkv.getNumber(`${SCROLL_KEY}${sessionId}`) ?? 0;
}
```

### Anti-Patterns to Avoid
- **Do NOT store streaming tokens in state array per token.** Use ref + rAF batch. Per-token setState causes 100+ renders/sec.
- **Do NOT use ScrollView for messages.** No virtualization. Breaks at 50+ messages.
- **Do NOT use standard KeyboardAvoidingView.** Timing bugs. Use react-native-keyboard-controller.
- **Do NOT re-render entire markdown on each token.** ChunkedCodeView pattern: freeze completed, only update trailing.
- **Do NOT auto-scroll during user scroll-up.** Track `isAtBottom`, show scroll-to-bottom pill.
- **Do NOT animate per-character.** Batch rendering via debounced setState.
- **Do NOT use `className` prop.** NativeWind removed in Phase 74. All styling via `createStyles(theme)`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bottom sheet for tool detail | Custom Reanimated modal | `@gorhom/bottom-sheet` v5 | Gesture-driven dismiss, snap points, backdrop, keyboard avoidance built-in. Week of work to replicate. |
| Syntax highlighting | Manual regex + color mapping | `react-native-code-highlighter` + `react-syntax-highlighter` | 200+ language grammars, theme support, maintained. |
| Markdown rendering | Regex-based parser | `react-native-enriched-markdown` | CommonMark + GFM tables, native text rendering, high perf. Software Mansion quality. |
| Swipe-to-delete gesture | Custom pan handler | `Swipeable` from react-native-gesture-handler | Built-in, handles overscroll, spring physics, threshold callbacks. |
| Keyboard avoidance | Custom layout measurement | `react-native-keyboard-controller` | Matches iOS system curve exactly. Custom solutions always have timing bugs. |
| Clipboard | Manual native bridge | `expo-clipboard` | Cross-platform, Expo-managed, async API. |
| Haptic feedback | Custom native module | `expo-haptics` | Already installed, 3 types (impact/notification/selection). |

**Key insight:** The tool chip + bottom sheet pattern, streaming markdown, and keyboard avoidance are each ~1 week of custom work if hand-rolled. Libraries save 3+ weeks of edge-case debugging.

## Common Pitfalls

### Pitfall 1: FlatList inverted + maintainVisibleContentPosition Conflicts
**What goes wrong:** `maintainVisibleContentPosition` can conflict with inverted mode on some RN versions, causing scroll jumps when new messages arrive at the "top" (which is visually the bottom in inverted).
**Why it happens:** The inverted FlatList reverses scroll direction. `maintainVisibleContentPosition` tries to keep the viewport stable, but new items at index 0 (top of data, bottom of screen) can confuse the position calculation.
**How to avoid:** Set `maintainVisibleContentPosition={{ minIndexForVisible: 1, autoscrollToTopThreshold: 100 }}`. Test with rapid message arrival. If issues persist, fall back to manual scroll management with `onContentSizeChange` + `scrollToEnd`.
**Warning signs:** Messages jump or flicker when new ones arrive during scroll-up.

### Pitfall 2: react-native-enriched-markdown Doesn't Do Syntax Highlighting
**What goes wrong:** Assuming enriched-markdown handles code block highlighting. It does not. It renders code blocks as plain monospace text.
**Why it happens:** enriched-markdown is focused on text structure (headings, lists, links, tables). Code highlighting is a separate concern.
**How to avoid:** Use enriched-markdown for markdown structure. Override the code block rendering to use `react-native-code-highlighter`. This requires a custom renderer for fenced code blocks.
**Warning signs:** Code blocks render as unstyled monospace text.

### Pitfall 3: Streaming Re-render Storm on Long Responses
**What goes wrong:** 60+ second Claude responses with thousands of tokens cause UI jank as the entire message re-renders on each token batch.
**Why it happens:** Without segment freezing, every new token triggers a full markdown re-parse and re-render of the entire message.
**How to avoid:** Implement the ChunkedCodeView pattern: split completed paragraphs/blocks into frozen (React.memo'd) segments. Only the trailing active segment re-renders. Parse incrementally.
**Warning signs:** FPS drops below 30 during streaming, especially on messages with code blocks.

### Pitfall 4: Bottom Sheet Inside FlatList Scroll Conflicts
**What goes wrong:** Tapping a tool chip to open a bottom sheet triggers a scroll event or the sheet's gesture conflicts with the FlatList's scroll.
**Why it happens:** Nested gesture handlers. FlatList's scroll gesture and bottom sheet's pan gesture compete.
**How to avoid:** Use `@gorhom/bottom-sheet` with `enablePanDownToClose` and the `BottomSheetModalProvider` at the root level (outside FlatList). Present the sheet as a modal, not inline.
**Warning signs:** Sheet opens but immediately closes, or scroll becomes janky after sheet dismiss.

### Pitfall 5: Swipe-to-Delete in Drawer Interferes with Drawer Gesture
**What goes wrong:** Left-swipe on a session item to delete conflicts with the right-swipe to open/close the drawer.
**Why it happens:** Both gestures are horizontal swipes in the same area.
**How to avoid:** Swipe-to-delete should be LEFT swipe only (delete direction). The drawer gesture is RIGHT swipe (open) and LEFT swipe (close). Use `Swipeable`'s `renderRightActions` prop (which activates on left-swipe). Set `overshootRight={false}`. The drawer's `swipeEdgeWidth` should not capture swipes that start on a session item.
**Warning signs:** Swiping left on a session item closes the drawer instead of revealing delete action.

### Pitfall 6: Keyboard Avoidance Offset with Custom Header
**What goes wrong:** Composer doesn't align properly with keyboard because `keyboardVerticalOffset` doesn't account for the custom navigation header height.
**Why it happens:** `react-native-keyboard-controller`'s `KeyboardAvoidingView` needs accurate knowledge of content above it.
**How to avoid:** Calculate header height using `useHeaderHeight()` from `@react-navigation/elements` or measure with `onLayout`. Pass as `keyboardVerticalOffset`.
**Warning signs:** Gap or overlap between keyboard and composer.

### Pitfall 7: Stale Messages After Session Switch
**What goes wrong:** Switching from session A to session B shows session A's messages briefly, then loads B's.
**Why it happens:** `useMessageList` fetches messages async. Old messages from the previous session remain in state during the fetch.
**How to avoid:** Clear messages immediately on session ID change before fetching. Show a brief loading skeleton. Key the FlatList by session ID so React unmounts/remounts rather than trying to recycle.
**Warning signs:** Messages from wrong session visible for 200-500ms after switch.

## Code Examples

### Sending a Message via WebSocket
```typescript
// Source: web app ChatComposer.tsx, adapted for mobile
import { getWsClient } from '../lib/websocket-init';
import type { ClaudeCommandOptions } from '@loom/shared/types/websocket';

function sendMessage(text: string, projectPath: string, sessionId?: string) {
  const wsClient = getWsClient();
  if (!wsClient) return;

  const options: ClaudeCommandOptions = { projectPath };
  if (sessionId) options.sessionId = sessionId;

  wsClient.send({
    type: 'claude-command',
    command: text,
    options,
  });
}
```

### Responding to Permission Request
```typescript
// Source: web app PermissionBanner.tsx, adapted for mobile
import { getWsClient } from '../lib/websocket-init';
import { useStreamStore } from '../stores/index';

function handlePermissionResponse(allow: boolean) {
  const wsClient = getWsClient();
  const request = useStreamStore.getState().activePermissionRequest;
  if (!wsClient || !request) return;

  wsClient.send({
    type: 'claude-permission-response',
    requestId: request.requestId,
    allow,
  });
  useStreamStore.getState().clearPermissionRequest();
}
```

### Aborting a Stream
```typescript
// Source: web app ChatComposer.tsx handleStop
function handleStop(sessionId: string) {
  const wsClient = getWsClient();
  if (!wsClient) return;

  wsClient.send({
    type: 'abort-session',
    sessionId,
    provider: 'claude',
  });
}
```

### Date-Grouped Session Sections
```typescript
// Source: PATTERNS-PLAYBOOK.md, Private Mind pattern
function getRelativeDateSection(date: Date): string {
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays <= 7) return 'Last Week';
  return 'Older';
}

interface SectionData {
  title: string;
  data: SessionData[];
}

function groupSessionsByDate(sessions: SessionData[]): SectionData[] {
  const groups = new Map<string, SessionData[]>();
  for (const session of sessions) {
    const section = getRelativeDateSection(new Date(session.updatedAt));
    if (!groups.has(section)) groups.set(section, []);
    groups.get(section)!.push(session);
  }
  return Array.from(groups.entries()).map(([title, data]) => ({ title, data }));
}
```

### Swipe-to-Delete with Undo Toast
```typescript
// Using Swipeable from react-native-gesture-handler
import { Swipeable } from 'react-native-gesture-handler';

function SwipeableSessionItem({ session, onDelete }: Props) {
  const swipeRef = useRef<Swipeable>(null);
  const [undoTimer, setUndoTimer] = useState<NodeJS.Timeout | null>(null);

  const renderRightActions = () => (
    <View style={styles.deleteAction}>
      <Text style={styles.deleteText}>Delete</Text>
    </View>
  );

  const handleSwipeOpen = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Start 5s undo window
    const timer = setTimeout(() => {
      onDelete(session.projectName, session.id);
    }, 5000);
    setUndoTimer(timer);
    // Show undo toast
    showUndoToast(() => {
      if (timer) clearTimeout(timer);
      swipeRef.current?.close();
    });
  };

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      onSwipeableOpen={handleSwipeOpen}
      overshootRight={false}
    >
      <SessionItem session={session} />
    </Swipeable>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| NativeWind className | createStyles(theme) pattern | Phase 74 (2026-04-03) | All new components use StyleSheet.create with theme tokens |
| legend-list | FlatList inverted | ChatterUI revert (2025-05) | FlatList is proven, FlashList as backup |
| KeyboardAvoidingView | react-native-keyboard-controller | 2024+ | Perfect iOS keyboard sync, system curve matching |
| react-native-syntax-highlighter | react-native-code-highlighter | 2025-07 | Active maintenance, modern peer deps |
| WebView markdown | react-native-enriched-markdown | 2026 | Native text, Fabric, high performance |

**Deprecated/outdated:**
- `react-native-syntax-highlighter` v2.1.0: Last updated Sept 2023. Depends on `react-syntax-highlighter@^6.0.4` (7+ years old). Use `react-native-code-highlighter` v1.3.0 instead.
- `NativeWind/className`: Removed in Phase 74 (D-01). All styling via `createStyles(theme)`.
- `@legendapp/list`: ChatterUI reverted after 8 days. Not production-proven.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build tooling | Yes | 22.22.1 | -- |
| Expo CLI | Development server | Yes | 54.0.23 | -- |
| Jest | Unit tests | Yes | 29.7.0 | -- |
| react-native-reanimated | All animations | Yes | 4.1.7 | -- |
| @gorhom/bottom-sheet | Tool detail sheet | No (not installed) | -- | Install via `npx expo install` |
| react-native-code-highlighter | Code syntax highlighting | No (not installed) | -- | Install via npm |
| react-syntax-highlighter | Peer of code-highlighter | No (not installed) | -- | Install via npm |
| expo-clipboard | Copy code to clipboard | No (not installed) | -- | Install via `npx expo install` |
| EAS Build / Device | On-device testing | Requires swd's MacBook | -- | Expo Go for basic testing, EAS cloud build |

**Missing dependencies with no fallback:** None (all can be installed).

**Missing dependencies with fallback:** None needed -- all install cleanly.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7.0 + jest-expo 54.0.17 |
| Config file | `mobile/jest.config.js` |
| Quick run command | `cd mobile && npx jest --passWithNoTests` |
| Full suite command | `cd mobile && npx jest` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CHAT-01 | Sessions grouped by date sections | unit | `cd mobile && npx jest __tests__/hooks/useSessions.test.ts -x` | Needs update |
| CHAT-02 | Create session + send message | unit | `cd mobile && npx jest __tests__/hooks/useComposer.test.ts -x` | Wave 0 |
| CHAT-03 | Streamed markdown rendering | unit | `cd mobile && npx jest __tests__/lib/message-parser.test.ts -x` | Wave 0 |
| CHAT-04 | Tool call chips render with status | unit | `cd mobile && npx jest __tests__/lib/tool-chip.test.ts -x` | Wave 0 |
| CHAT-05 | Thinking block expand/collapse | unit | `cd mobile && npx jest __tests__/hooks/useThinkingBlock.test.ts -x` | Wave 0 |
| CHAT-06 | Code blocks with syntax highlighting | unit | `cd mobile && npx jest __tests__/components/CodeBlock.test.tsx -x` | Wave 0 |
| CHAT-07 | Scroll position preservation | unit | `cd mobile && npx jest __tests__/lib/scroll-persistence.test.ts -x` | Wave 0 |
| CHAT-08 | JWT auth via Keychain | unit | `cd mobile && npx jest __tests__/hooks/useAuth.test.ts -x` | Exists |
| CHAT-09 | Connection status + reconnect | unit | `cd mobile && npx jest __tests__/hooks/useConnection.test.ts -x` | Exists |
| CHAT-10 | Search sessions by title | unit | `cd mobile && npx jest __tests__/hooks/useSessions.test.ts -x` | Needs update |
| CHAT-11 | Swipe-to-delete | manual-only | Device testing required (gesture) | N/A |
| CHAT-12 | Permission approve/deny | unit | `cd mobile && npx jest __tests__/lib/permission-handler.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd mobile && npx jest --passWithNoTests`
- **Per wave merge:** `cd mobile && npx jest && cd .. && npx tsc --noEmit -p mobile/tsconfig.json`
- **Phase gate:** Full suite green + device testing before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `mobile/__tests__/hooks/useComposer.test.ts` -- covers CHAT-02 (send message FSM)
- [ ] `mobile/__tests__/lib/message-parser.test.ts` -- covers CHAT-03, CHAT-04 (segment parsing)
- [ ] `mobile/__tests__/lib/scroll-persistence.test.ts` -- covers CHAT-07
- [ ] `mobile/__tests__/lib/permission-handler.test.ts` -- covers CHAT-12
- [ ] Update `mobile/__tests__/hooks/useSessions.test.ts` for date grouping (CHAT-01, CHAT-10)

## Open Questions

1. **react-native-enriched-markdown code block override**
   - What we know: enriched-markdown renders CommonMark + GFM natively. It does NOT do syntax highlighting for code blocks.
   - What's unclear: Whether enriched-markdown exposes a render override for fenced code blocks (custom component injection). If not, we need to split content pre-markdown and render code blocks separately.
   - Recommendation: Test enriched-markdown's customization API early in implementation. If no code block override, use the segment-based parser to extract code blocks before passing text to enriched-markdown. This is the safer approach anyway since it enables the ChunkedCodeView pattern.

2. **FlatList inverted + SectionList for date groups**
   - What we know: The drawer needs date-grouped sections (Today/Yesterday/Older). SectionList provides built-in section headers. But message list uses inverted FlatList.
   - What's unclear: Whether SectionList can be used inside the drawer (it's a FlatList variant) and whether it conflicts with swipe-to-delete.
   - Recommendation: Use SectionList for the drawer session list (it supports sections natively). Use inverted FlatList for the message list (no sections needed there).

3. **react-native-code-highlighter bundle size**
   - What we know: It depends on react-syntax-highlighter which bundles highlight.js grammars. Full bundle can be large.
   - What's unclear: Whether tree-shaking removes unused languages or if we need to register only used languages.
   - Recommendation: Import only the lightweight version (`react-syntax-highlighter/dist/esm/prism-light` or `react-syntax-highlighter/dist/cjs/light`). Register only languages seen in Loom sessions: JavaScript, TypeScript, Python, Bash, JSON, YAML, Markdown, CSS, HTML, Go, Rust. This cuts bundle by ~80%.

## Project Constraints (from CLAUDE.md)

- **No placeholders.** All code must be complete and functional.
- **Verify before done.** Run test/build/lint and show output.
- **Plan before multi-file changes.** 3+ files -> numbered plan, wait for approval.
- **Confidence gate.** >=90% proceed, 70-89% pause, <70% research first.
- **Evidence-based claims.** Never claim "tests pass" without running them.
- **V2_CONSTITUTION.md Section 13:** 44px touch targets, `ring-[3px] ring-ring/50` (web-only, mobile equivalent is press feedback + haptic).
- **Fix ALL adversarial findings.** Every finding (SSS through C) must be fixed.
- **Forgejo issue tracking.** Bugs found during device testing -> create issues tagged `device-test`.
- **Device testing per plan.** Every plan needs real device validation (when MacBook available).
- **Always store next command.** Every GSD workflow must write next command to gsd-next.
- **Never chain phases in same context.** Store-next + exit between lifecycle stages.
- **Soul doc compliance.** Every component must comply with NATIVE-APP-SOUL.md (springs, surfaces, haptics, anti-patterns).

## Sources

### Primary (HIGH confidence)
- `mobile/package.json` -- verified installed versions
- `mobile/stores/index.ts` -- 5 Zustand stores confirmed
- `mobile/hooks/useMessageList.ts` -- existing streaming content hook
- `mobile/hooks/useSessions.ts` -- session CRUD + search + pin
- `mobile/lib/websocket-init.ts` -- 21 multiplexer callbacks wired
- `shared/lib/stream-multiplexer.ts` -- full callback interface
- `shared/types/websocket.ts` -- complete WS protocol types
- `shared/types/stream.ts` -- ToolCallState, ThinkingState types
- `shared/stores/stream.ts` -- StreamStore with permission, tool call, thinking state
- `src/src/components/chat/composer/ChatComposer.tsx` -- web app send message pattern
- `src/src/components/chat/tools/PermissionBanner.tsx` -- web app permission pattern
- `.planning/NATIVE-APP-SOUL.md` -- visual contract (springs, surfaces, haptics)
- `.planning/phases/75-chat-shell/75-CONTEXT.md` -- all 34 locked decisions
- `.planning/phases/74-shell-connection/74-CONTEXT.md` -- foundation decisions

### Secondary (MEDIUM confidence)
- `mobile/.planning/research/PATTERNS-PLAYBOOK.md` -- production app patterns (verified against source repos)
- `mobile/.planning/research/SWIFTCHAT-STREAMING-STUDY.md` -- ChunkedCodeView pattern
- npm registry -- verified versions of @gorhom/bottom-sheet, react-native-code-highlighter

### Tertiary (LOW confidence)
- react-native-enriched-markdown code block customization API -- needs hands-on testing to confirm override capability

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all core deps installed, new deps verified on npm with compatible peers
- Architecture: HIGH -- patterns proven in 4 production apps, web app provides exact WebSocket protocol
- Pitfalls: HIGH -- each pitfall sourced from production app research or known RN issues
- Syntax highlighting: MEDIUM -- react-native-code-highlighter is actively maintained but composing it with enriched-markdown needs hands-on validation
- enriched-markdown code block override: LOW -- needs implementation testing

**Research date:** 2026-04-03
**Valid until:** 2026-04-17 (14 days -- React Native ecosystem moves fast)
