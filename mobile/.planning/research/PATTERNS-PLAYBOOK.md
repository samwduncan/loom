# Patterns Playbook: Best-of-Breed from 4 Production Chat Apps

**Synthesized:** 2026-04-03
**Sources:** Private Mind (317 stars), Galaxies-dev (284), ChatterUI (2.2k), swift-chat (770)
**Purpose:** Single reference for v3.1 milestone planning — what pattern to use for each concern, which repo it comes from, and why.

---

## Decision Matrix

| Concern | Winner | Pattern | Why |
|---------|--------|---------|-----|
| **Drawer + Session List** | Private Mind | Custom drawer content, date-grouped sections | Production-shipped, Expo Router, Zustand-backed |
| **Context Menus** | Galaxies-dev | Zeego ContextMenu.Root/Trigger/Content | Only candidate with native iOS UIContextMenuInteraction |
| **Message List** | FlatList inverted | `inverted={true}` + `maintainVisibleContentPosition` | ChatterUI reverted from legend-list after 8 days; swift-chat + ChatterUI both ship FlatList inverted |
| **Keyboard Handling** | Private Mind | Custom KeyboardAvoidingView wrapping react-native-keyboard-controller | Software Mansion's own library, they know best |
| **Composer** | Private Mind | ChatBar with send state machine + prompt suggestions | Clean imperative ref pattern, 3-state button |
| **Streaming State** | Private Mind | Zustand phantom chat + placeholder message → append tokens | Identical to Loom's web pattern |
| **Streaming Markdown** | swift-chat | ChunkedCodeView — freeze completed blocks, only update trailing | Prevents re-render storm on long code responses |
| **Multi-Provider** | swift-chat | Single CallbackFunction interface, provider dispatcher by tag | Maps directly to Loom's multiplexer |
| **Store Architecture** | Private Mind | 4 Zustand stores with clean separation | Matches Loom's existing 5-store pattern |
| **Database** | Private Mind | expo-sqlite repository pattern with typed functions | Already in Loom's stack |
| **Theme System** | Private Mind | Typed Theme object + createStyles(theme) + safe-area insets | Clean, dark-mode-ready, composable |
| **Model/Provider Selector** | Galaxies-dev | HeaderDropDown component | Data-driven, works in navigation header |
| **Code Block Copy** | swift-chat | Lazy-loaded highlighter + copy button + Suspense | Best code block UX of any candidate |
| **Citations → Tool Refs** | swift-chat | CitationBadge inline + CitationList modal | Pattern transfers directly to tool call references |

---

## Critical Revision: Message List Strategy

**Legend-list is OUT.** Three signals:

1. **ChatterUI reverted** from @legendapp/list back to FlatList after 8 days (2025-05-22 → 2025-05-30). No documented explanation — likely scroll position issues with streaming.
2. **Private Mind uses ScrollView** — fine for short on-device conversations, but not viable for Loom's 50+ message sessions.
3. **swift-chat uses inverted FlatList** in production with 200+ message conversations.

**Recommendation:** Use `FlatList` with `inverted={true}` + `maintainVisibleContentPosition`. This is what 2/4 production apps ship with. Add `estimatedItemSize` tuning and `React.memo` on message components. If performance issues arise on device, evaluate FlashList v2 as a drop-in replacement (same API).

---

## Pattern Details (Copy-Paste Ready)

### 1. Drawer + Date-Grouped Sessions (Private Mind)

```typescript
// Grouping logic from Private Mind's DrawerMenu
function getRelativeDateSection(date: Date): string {
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays <= 7) return `${diffDays} days ago`;
  if (diffDays <= 14) return 'Last week';
  if (diffDays <= 30) return 'Last month';
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// Drawer layout config
<Drawer
  drawerContent={(props) => <CustomDrawerContent {...props} />}
  screenOptions={{
    drawerType: 'slide',
    swipeEdgeWidth: width,  // full-width swipe area
    overlayColor: 'rgba(0,0,0,0.4)',
  }}
/>
```

### 2. Zeego Context Menu (Galaxies-dev)

```tsx
import * as ContextMenu from 'zeego/context-menu';

<ContextMenu.Root>
  <ContextMenu.Trigger>
    <Pressable onPress={() => router.push(`/chat/${session.id}`)}>
      <SessionItemContent {...session} />
    </Pressable>
  </ContextMenu.Trigger>
  <ContextMenu.Content>
    <ContextMenu.Preview>
      {() => <SessionPreview session={session} />}
    </ContextMenu.Preview>
    <ContextMenu.Item key="rename" onSelect={() => handleRename(session)}>
      <ContextMenu.ItemTitle>Rename</ContextMenu.ItemTitle>
      <ContextMenu.ItemIcon ios={{ name: 'pencil', pointSize: 18 }} />
    </ContextMenu.Item>
    <ContextMenu.Item key="delete" onSelect={() => handleDelete(session)} destructive>
      <ContextMenu.ItemTitle>Delete</ContextMenu.ItemTitle>
      <ContextMenu.ItemIcon ios={{ name: 'trash', pointSize: 18 }} />
    </ContextMenu.Item>
  </ContextMenu.Content>
</ContextMenu.Root>
```

### 3. Phantom Chat Pattern (Private Mind)

```typescript
// In chatStore (Zustand)
createPhantomChat: () => {
  const phantomId = `phantom-${Date.now()}`;
  set({
    activeChat: { id: phantomId, title: 'New Chat', isPhantom: true },
    messages: [],
  });
  return phantomId;
},

convertPhantomToReal: async (phantomId: string) => {
  const realId = await chatRepository.createChat('New Chat');
  set((state) => ({
    activeChat: { ...state.activeChat, id: realId, isPhantom: false },
  }));
  return realId;
},

// Usage: create phantom on "New Chat" tap, convert on first message send
```

### 4. Send Button State Machine (Private Mind)

```typescript
// Three states: generating, hasText, empty
type SendButtonState = 'generating' | 'send' | 'mic';

function getSendButtonState(isGenerating: boolean, text: string): SendButtonState {
  if (isGenerating) return 'generating';  // Stop button (red square)
  if (text.trim().length > 0) return 'send';  // Send arrow (accent)
  return 'mic';  // Mic placeholder (gray)
}
```

### 5. ChunkedCodeView for Streaming (swift-chat)

```typescript
// Split streaming code into frozen chunks + active tail
const CHUNK_SIZE = 100; // lines

function ChunkedCodeView({ code, language, isStreaming }) {
  const lines = code.split('\n');
  const frozenChunks = [];
  
  for (let i = 0; i < lines.length - CHUNK_SIZE; i += CHUNK_SIZE) {
    frozenChunks.push(lines.slice(i, i + CHUNK_SIZE).join('\n'));
  }
  const activeChunk = lines.slice(frozenChunks.length * CHUNK_SIZE).join('\n');

  return (
    <View>
      {frozenChunks.map((chunk, i) => (
        <FrozenCodeBlock key={i} code={chunk} language={language} />
      ))}
      <ActiveCodeBlock code={activeChunk} language={language} isStreaming={isStreaming} />
    </View>
  );
}

// FrozenCodeBlock is React.memo'd — never re-renders
const FrozenCodeBlock = React.memo(({ code, language }) => (
  <HighlightedCode code={code} language={language} />
));
```

### 6. Keyboard Handling (Private Mind)

```tsx
// Custom wrapper around react-native-keyboard-controller
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

// In chat screen — wraps message list + composer
<KeyboardAvoidingView
  behavior="padding"
  keyboardVerticalOffset={headerHeight}  // adjust for nav header
  style={{ flex: 1 }}
>
  <FlatList inverted ... />
  <ChatBar />
</KeyboardAvoidingView>
```

### 7. Theme System (Private Mind)

```typescript
interface Theme {
  colors: {
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    accent: string;
    border: string;
    // ...
  };
  insets: EdgeInsets;  // safe area baked in
}

// Every component:
function ChatScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  // ...
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: { backgroundColor: theme.colors.background },
    // ...
  });
}
```

---

## Libraries Confirmed for v3.1

| Library | Version | Source | Purpose |
|---------|---------|--------|---------|
| react-native-keyboard-controller | 1.18+ | Private Mind | Keyboard avoidance |
| zeego | latest | Galaxies-dev | Native context menus |
| react-native-ios-context-menu | latest | zeego peer | iOS UIContextMenuInteraction |
| @gorhom/bottom-sheet | v5 | Private Mind | Modal sheets |
| react-native-reanimated | 4.1+ | All | Animations |
| react-native-enriched-markdown | latest | Phase 69 decision | Streaming markdown (GFM) |
| expo-sqlite | latest | Private Mind | Local persistence |

**DROPPED:** @legendapp/list (reverted by ChatterUI, insufficient production evidence)

---

## Anti-Patterns (from research)

1. **Don't use gifted-chat** — wrong abstraction for AI chat (Pitfalls.md #3)
2. **Don't use ScrollView for messages** — no virtualization, breaks at 50+ messages
3. **Don't use standard KeyboardAvoidingView** — timing bugs, platform differences
4. **Don't store streaming content in state array** — use ref + rAF batch (Pitfalls.md #4)
5. **Don't auto-scroll during user scroll-up** — track isAtBottom, show scroll-to-bottom button
6. **Don't animate per-character** — batch rendering via debounced setState

---

*This playbook is the single source of truth for v3.1 phase planning.*
*Read alongside: .planning/NATIVE-APP-SOUL.md (visual contract) and .planning/phases/70-chat-polish/70-CONTEXT.md (locked decisions from v3.0 pivot)*
