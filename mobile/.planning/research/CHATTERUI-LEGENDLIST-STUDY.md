# ChatterUI Legend-List Integration Study

**Status:** PRODUCTION RESEARCH | Source: https://github.com/Vali-98/ChatterUI | License: AGPL (study only)
**Date:** 2025-04-03 | Context: Learning legend-list chat integration patterns for Loom v3.0 Phase 69+

---

## Executive Summary

ChatterUI uses `@legendapp/list` (v1.0.14) but **reverted to FlatList** on 2025-05-30. However, the codebase contains an **experimental legend-list reimplementation** (commit e372c9e) that offers valuable insights into:

1. **Legend-list configuration for streaming chat** — alignItemsAtEnd, maintainScrollAtEnd, scroll-to-bottom patterns
2. **Why production apps revert** — legend-list v1.0.14 appears to have limitations or performance issues
3. **What *does* work** — FlatList with `maintainVisibleContentPosition` and `inverted` flag handles streaming gracefully

**Key Finding:** ChatterUI abandoning legend-list in favor of FlatList suggests legend-list may not be production-ready for chat UX. Loom should consider this carefully.

---

## 1. Legend-List Chat Implementation (Experimental Branch)

### Configuration (commit e372c9e — "experimental legend list reimplementation")

```typescript
<LegendList
    ref={listRef}
    maintainVisibleContentPosition={!autoScroll}
    keyboardShouldPersistTaps="handled"
    initialContainerPoolRatio={2}
    waitForInitialLayout
    alignItemsAtEnd
    maintainScrollAtEnd
    maintainScrollAtEndThreshold={0.1}
    estimatedItemSize={320}
    initialScrollIndex={chat.messages.length}
    data={chat.messages}
    keyExtractor={(item) => item.id.toString()}
    renderItem={({ index }) => (
        <ChatItem
            index={index}
            isLastMessage={index === chat.messages.length - 1}
            isGreeting={index === 0}
        />
    )}
    extraData={[chat.id, chatLength, chat.messages]}
    onViewableItemsChanged={({ viewableItems }) => {
        if (viewableItems.length > 0) {
            const currentIndex = viewableItems[0].index
            setCurrentIndex(currentIndex)
        }
    }}
/>
```

### Props Breakdown

| Prop | Value | Purpose |
|------|-------|---------|
| `alignItemsAtEnd` | ✓ | Align list items to bottom (chat style) |
| `maintainScrollAtEnd` | ✓ | Auto-scroll to bottom when new messages arrive |
| `maintainScrollAtEndThreshold` | `0.1` | Trigger threshold (10% from bottom) |
| `estimatedItemSize` | `320` | Estimated message height for layout calculation |
| `initialScrollIndex` | `chat.messages.length` | Start scroll position at newest message |
| `initialContainerPoolRatio` | `2` | Container pool size for recycling |
| `waitForInitialLayout` | ✓ | Wait before scrolling (prevents race condition) |
| `keyboardShouldPersistTaps` | `"handled"` | Keyboard doesn't dismiss on message tap |
| `maintainVisibleContentPosition` | Conditional | Only when `!autoScroll` |

### Scroll-to-Bottom

**Initial load:**
```typescript
useEffect(() => {
    setCurrentIndex(chatLength ?? 0)
    listRef.current?.scrollToEnd({ animated: false })
}, [chat.id])
```

**Manual jump:**
```typescript
{chatLength && chatLength - currentIndex > 25 && (
    <Animated.View entering={FadeInDown.delay(2000)}>
        <ThemedButton
            label="Jump To Bottom"
            onPress={() => {
                listRef.current?.scrollToEnd({ animated: false })
                setCurrentIndex(chatLength)
            }}
        />
    </Animated.View>
)}
```

**Key insight:** Shows "Jump to Bottom" button when >25 messages behind (scroll tracking via `onViewableItemsChanged`).

---

## 2. Why ChatterUI Reverted (Critical Finding)

### Timeline
- **2025-05-22:** Legend-list added (commit 32edb72)
- **2025-05-30:** Reverted to FlatList (commit ad66aad, message: "reverted legend list usage")
- **2025-06-01:** Experimental re-implementation (commit e372c9e)

### Production Version (Current — using FlatList)

```typescript
const ChatWindow = () => {
    const { chat } = Chats.useChat()
    const flatlistRef = useRef<FlatList | null>(null)
    
    const list: ListItem[] = (chat?.messages ?? [])
        .map((item, index) => ({
            index: index,
            key: item.id.toString(),
            isGreeting: index === 0,
            isLastMessage: !!chat?.messages && index === chat?.messages.length - 1,
        }))
        .reverse()  // <-- INVERTED

    return (
        <FlatList
            ref={flatlistRef}
            maintainVisibleContentPosition={
                autoScroll ? null : { minIndexForVisible: 1, autoscrollToTopThreshold: 50 }
            }
            keyboardShouldPersistTaps="handled"
            inverted  // <-- KEY: Messages grow downward
            data={list}
            keyExtractor={(item) => item.key}
            renderItem={renderItems}
            scrollEventThrottle={16}
            onViewableItemsChanged={(item) => {
                const index = item.viewableItems?.at(0)?.index
                if (index && chat?.id)
                    updateScrollPosition(index - (item.viewableItems.length === 1 ? 1 : 0), chat.id)
            }}
            onScrollToIndexFailed={(error) => {
                flatlistRef.current?.scrollToOffset({
                    offset: error.averageItemLength * error.index,
                    animated: true,
                })
                setTimeout(() => {
                    if (list.length !== 0 && flatlistRef.current !== null) {
                        flatlistRef.current?.scrollToIndex({
                            index: error.index,
                            animated: true,
                            viewOffset: 32,
                        })
                    }
                }, 100)
            }}
            contentContainerStyle={{
                paddingTop: chatInputHeight + 16,
                rowGap: 16,
            }}
            ListFooterComponent={() => <ChatFooter />}
        />
    )
}
```

**Why FlatList is better for streaming chat:**
1. **Inverted list** — messages render bottom-first, scroll position "sticks" to bottom naturally
2. **maintainVisibleContentPosition** — keeps scroll anchored without explicit `scrollToEnd()` calls
3. **Mature API** — unlike legend-list, FlatList has 5+ years of production battle-testing for chat
4. **Scroll handling** — `onScrollToIndexFailed` fallback handles edge cases better

**Likely legend-list issues:**
- Performance with large message lists (legend-list is newer, less optimized)
- Streaming message growth (new items added to list) may cause layout thrashing
- Scroll position drift when using `maintainScrollAtEnd` with `alignItemsAtEnd`
- Memory overhead of `initialContainerPoolRatio` not worth the gains for chat

---

## 3. Message Rendering & Data Structure

### Data Flow

```typescript
// Chat state (lib/state/Chat.ts)
export interface ChatSwipeState extends ChatSwipe {
    token_count?: number
    attachment_count?: number
    regen_cache?: string
}

export interface ChatEntry extends ChatEntryType {
    swipes: ChatSwipeState[]
    attachments: ChatAttachmentType[]
}

export interface ChatData extends ChatType {
    messages: ChatEntry[]
    autoScroll?: { cause: 'search' | 'saveScroll'; index: number }
}
```

### Message Item Component

```typescript
// ChatItem.tsx
type ChatItemProps = {
    index: number
    isLastMessage: boolean
    isGreeting: boolean
}

const ChatItem: React.FC<ChatItemProps> = ({ index, isLastMessage, isGreeting }) => {
    const nowGenerating = useInference((state) => state.nowGenerating)

    return (
        <View style={styles.chatItem}>
            <ChatFrame index={index} nowGenerating={nowGenerating} isLast={isLastMessage}>
                <ChatBubble
                    nowGenerating={nowGenerating}
                    index={index}
                    isLastMessage={isLastMessage}
                    isGreeting={isGreeting}
                />
            </ChatFrame>
        </View>
    )
}

const styles = StyleSheet.create({
    chatItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: 8,
    },
})
```

### Message Bubble (Rendering Logic)

```typescript
// ChatBubble.tsx — simplified
const ChatBubble: React.FC<ChatTextProps> = ({
    index,
    nowGenerating,
    isLastMessage,
    isGreeting,
}) => {
    const message = Chats.useEntryData(index)  // <-- Index-based lookup
    const { appMode } = useAppMode()
    const { color, spacing, borderRadius, fontSize } = Theme.useTheme()

    const { activeIndex, setShowOptions } = useChatActionsState(...)

    const showEditor = useChatEditorStore((state) => state.show)
    const handleEnableEdit = () => {
        if (!nowGenerating) showEditor(index)
    }

    const hasSwipes = message?.swipes?.length > 1
    const showSwipe = !message.is_user && isLastMessage && (hasSwipes || !isGreeting)
    const timings = message.swipes[message.swipe_id].timings

    return (
        <View>
            <Pressable
                onPress={() => {
                    setShowOptions(activeIndex === index || nowGenerating ? undefined : index)
                }}
                style={{
                    backgroundColor: color.neutral._200,
                    borderColor: color.neutral._200,
                    borderWidth: 1,
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.m,
                    minHeight: 40,
                    borderRadius: borderRadius.m,
                    shadowColor: color.shadow,
                    boxShadow: [
                        {
                            offsetX: 1,
                            offsetY: 1,
                            spreadDistance: 2,
                            color: color.shadow,
                            blurRadius: 4,
                        },
                    ],
                }}
                onLongPress={handleEnableEdit}>
                {isLastMessage ? (
                    <ChatTextLast nowGenerating={nowGenerating} index={index} />
                ) : (
                    <ChatText nowGenerating={nowGenerating} index={index} />
                )}
                <ChatAttachments index={index} />
                {/* Token timing display */}
                <View style={{ flexDirection: 'row' }}>
                    {showTPS && appMode === 'local' && timings && (
                        <Text>Prompt: {getFiniteValue(timings.prompt_per_second)} t/s</Text>
                    )}
                    <ChatQuickActions {...} />
                </View>
            </Pressable>
            {showSwipe && (
                <ChatSwipes index={index} nowGenerating={nowGenerating} isGreeting={isGreeting} />
            )}
        </View>
    )
}
```

### Memoization Pattern

**Not explicitly memoized** in main list. Instead:
- `useEntryData(index)` hook provides selective re-render (queries Zustand store)
- `useInference()` selector gates re-renders on `nowGenerating` state change
- `useChatActionsState()` batches UI state updates

**No React.memo wrapper** — relies on Zustand's granular subscriptions. This is more efficient than memoizing component boundaries.

---

## 4. Keyboard Handling

### Root Layout

```typescript
// app/_layout.tsx
import { KeyboardProvider } from 'react-native-keyboard-controller'

const Layout = () => {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <MenuProvider>
                <AlertBox />
                <KeyboardProvider>  {/* <-- Global provider */}
                    <SystemBars style="dark" />
                    <Stack screenOptions={{...}} />
                </KeyboardProvider>
            </MenuProvider>
        </GestureHandlerRootView>
    )
}
```

### Chat Input Component

```typescript
// app/screens/ChatScreen/ChatInput/index.tsx
export const useInputHeightStore = create<ChatInputHeightStoreProps>()((set) => ({
    height: 54,
    setHeight: (n) => set({ height: Math.ceil(n) }),
}))

const ChatInput = () => {
    const insets = useSafeAreaInsets()
    const inputRef = useUnfocusTextInput()
    const setHeight = useInputHeightStore(useShallow((state) => state.setHeight))

    return (
        <View
            onLayout={(e) => {
                setHeight(e.nativeEvent.layout.height)  // <-- Track input height
            }}
            style={{...}}
        >
            {/* TextInput, buttons, etc. */}
        </View>
    )
}
```

### Chat Window Padding

The chat list uses the input height to add bottom padding:

```typescript
<FlatList
    // ...
    contentContainerStyle={{
        paddingTop: chatInputHeight + 16,  // <-- Dynamic padding
        rowGap: 16,
    }}
/>
```

**Approach:** NOT using KeyboardAvoidingView for chat (which would cause layout thrashing). Instead:
1. **InputHeightStore** tracks actual input component height via `onLayout`
2. Chat list adds padding to content (`paddingTop`) — input floats above
3. **KeyboardProvider** at root handles global keyboard events for dropdowns/modals only
4. Chat list scroll position auto-sticks to bottom (FlatList inverted + maintainVisibleContentPosition)

**No explicit keyboard-aware scrolling needed** for the chat window.

---

## 5. Drizzle ORM Schema & Patterns

### Chat & Message Schema

```typescript
// db/schema.ts
export const chats = sqliteTable('chats', {
    id: integer('id', { mode: 'number' }).primaryKey().notNull(),
    create_date: integer('create_date', { mode: 'timestamp' })
        .notNull()
        .$defaultFn(() => new Date()),
    character_id: integer('character_id', { mode: 'number' })
        .notNull()
        .references(() => characters.id, { onDelete: 'cascade' }),
    user_id: integer('user_id', { mode: 'number' }),
    last_modified: integer('last_modified', { mode: 'number' })
        .$defaultFn(() => Date.now())
        .$onUpdateFn(() => Date.now()),
    name: text('name').notNull().default('New Chat'),
    scroll_offset: integer('scroll_offset', { mode: 'number' }).notNull().default(0),
})

export const chatEntries = sqliteTable('chat_entries', {
    id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
    chat_id: integer('chat_id', { mode: 'number' })
        .notNull()
        .references(() => chats.id, { onDelete: 'cascade' }),
    is_user: integer('is_user', { mode: 'boolean' }).notNull(),
    name: text('name').notNull(),
    order: integer('order').notNull(),
    swipe_id: integer('swipe_id', { mode: 'number' }).default(0).notNull(),
})

export const chatSwipes = sqliteTable('chat_swipes', {
    id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
    entry_id: integer('entry_id', { mode: 'number' })
        .notNull()
        .references(() => chatEntries.id, { onDelete: 'cascade' }),
    swipe: text('swipe').notNull().default(''),
    send_date: integer('send_date', { mode: 'timestamp' })
        .notNull()
        .$defaultFn(() => new Date()),
    gen_started: integer('gen_started', { mode: 'timestamp' })
        .notNull()
        .$defaultFn(() => new Date()),
    gen_finished: integer('gen_finished', { mode: 'timestamp' })
        .notNull()
        .$defaultFn(() => new Date()),
    timings: text('timings', { mode: 'json' }).$type<CompletionTimings>(),
})

export const chatAttachments = sqliteTable('chat_attachment', {
    id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
    chat_entry_id: integer('chat_entry_id', { mode: 'number' })
        .notNull()
        .references(() => chatEntries.id, { onDelete: 'cascade' }),
    uri: text('uri').notNull(),
    type: text('type', { enum: ['audio', 'image', 'document'] }).notNull(),
    mime_type: text('mime_type').notNull(),
    name: text('name').notNull(),
    size: integer('size').notNull().default(0),
})
```

### Relations & Joins

```typescript
export const chatsRelations = relations(chats, ({ many, one }) => ({
    messages: many(chatEntries),
    character: one(characters, {
        fields: [chats.character_id],
        references: [characters.id],
    }),
}))

export const chatEntriesRelations = relations(chatEntries, ({ one, many }) => ({
    chat: one(chats, {
        fields: [chatEntries.chat_id],
        references: [chats.id],
    }),
    swipes: many(chatSwipes),
    attachments: many(chatAttachments),
}))
```

### Why Drizzle Works Well Here

1. **Type safety** — TypeScript automatically enforces FK references
2. **Relations** — `chat.messages` hydrates all entries + nested swipes/attachments
3. **JSON columns** — `timings` stored as JSON, queryable via SQLite JSON functions
4. **Cascade deletes** — removing chat auto-cleans entries, swipes, attachments
5. **expo-sqlite** — Drizzle runs sync on React Native, no network call

---

## 6. What's Worth Stealing for Loom

### STEAL: FlatList Inverted Pattern for Streaming Chat

**Don't use legend-list.** ChatterUI's revert (v1.0.14 → FlatList) signals immaturity. Use FlatList with:

```typescript
<FlatList
    inverted
    maintainVisibleContentPosition={!autoScroll}
    data={messages}
    renderItem={...}
    onScrollToIndexFailed={fallbackScroll}
    // ...
/>
```

**Why:**
- Scroll position naturally "sticks" to bottom as new items prepend
- No `alignItemsAtEnd` / `maintainScrollAtEnd` race conditions
- Production-proven in every major chat app

### STEAL: Input Height Tracking Pattern

```typescript
// Store height in Zustand
export const useInputHeightStore = create((set) => ({
    height: 54,
    setHeight: (n) => set({ height: Math.ceil(n) }),
}))

// Measure input via onLayout
<View onLayout={(e) => setHeight(e.nativeEvent.layout.height)} />

// Apply as padding to list
<FlatList contentContainerStyle={{ paddingTop: inputHeight + 16 }} />
```

**Better than:** KeyboardAvoidingView (causes layout thrashing) or hardcoded heights.

### STEAL: Zustand Selective Re-render via Hooks

ChatterUI doesn't memoize list items explicitly. Instead:
- `useEntryData(index)` selects single message from store
- `useInference()` with `useShallow()` gates `nowGenerating` changes
- Zustand unsubscribes from unchanged fields = no unnecessary renders

```typescript
// Efficient single-item lookup
const message = Chats.useEntryData(index)

// Only re-render if these fields change
const { nowGenerating, abortFunction } = useInference(
    useShallow((state) => ({
        nowGenerating: state.nowGenerating,
        abortFunction: state.abortFunction,
    }))
)
```

**Better than:** React.memo + extraData + comparison. Zustand's granularity wins.

### STEAL: Index-Based Message Access

Every message accessed via `index` from the list, not by ID or object reference:

```typescript
// List passes index
<ChatItem index={index} isLastMessage={...} />

// Component queries store by index
const message = Chats.useEntryData(index)
const nowGenerating = useInference((state) => state.nowGenerating)
```

**Why:** When messages update (streaming), indices stay valid. IDs can change (message regeneration).

### STEAL: Swipe Management Pattern

Multiple text swipes (alternatives) per message:

```typescript
export interface ChatSwipeState extends ChatSwipe {
    token_count?: number
    attachment_count?: number
    regen_cache?: string
}

export interface ChatEntry extends ChatEntryType {
    swipes: ChatSwipeState[]  // <-- Array of alternatives
    attachments: ChatAttachmentType[]
}
```

Message displays current swipe via `message.swipe_id`:

```typescript
const hasSwipes = message?.swipes?.length > 1
const showSwipe = !message.is_user && isLastMessage && (hasSwipes || !isGreeting)

{isLastMessage && showSwipe && <ChatSwipes index={index} {...} />}
```

**Relevant to Loom:** Enabling "regenerate different response" without losing original.

### AVOID: Legend-List for Chat

**Don't adopt legend-list v1.0.14 unless:**
- Performance bottleneck measured with FlatList (unlikely)
- Legend-list v2+ released with production-proven chat app case study

**Current status:** Experimental only. ChatterUI's revert = signal.

### AVOID: KeyboardAvoidingView for Chat Window

Use input height tracking + scroll "stickiness" instead. KeyboardAvoidingView causes:
- Layout thrashing when keyboard pops
- Jank during typing
- Scroll offset math errors

---

## 7. Code Quality Observations

### Strengths
1. **Drizzle schema** — Clean, typed, zero-boilerplate relations
2. **Zustand selectors** — Granular subscriptions avoid memoization complexity
3. **Conditional rendering** — `isLastMessage`, `isGreeting` flags reduce branching
4. **Attachment design** — Flexible enum-based type system (audio, image, document)

### Weaknesses
1. **Message lookup by index** — Brittle if list order changes. Could use stable IDs + Map
2. **No TS errors in NativeWind** — Shadowing in component typing (see loom MEMORY — "40 pre-existing errors")
3. **Legend-list experimental branch abandoned** — Suggests incomplete work; no post-mortem docs

### Applicability to Loom v3.0

Loom Phase 69 (chat foundation) should:
- ✓ Adopt FlatList inverted pattern (proven)
- ✓ Use input height store (avoid KeyboardAvoidingView)
- ✓ Index-based message access (simple, works at scale)
- ✓ Drizzle ORM (MMKV swaps for storage adapter, types stay)
- ✗ Skip legend-list (ChatterUI's revert = production signal)

---

## Appendix: Commits Referenced

| Commit | Date | Message | Insight |
|--------|------|---------|---------|
| 32edb72 | 2025-05-22 | feat: added legend list | Initial v1.0.14 integration |
| ad66aad | 2025-05-30 | chore: reverted legend list usage | Revert to FlatList (reason not documented) |
| e372c9e | 2025-06-01 | feat: experimental legend list reimplementation | Experimental re-attempt with more props |

**Repository:** https://github.com/Vali-98/ChatterUI (AGPL — study only, no code copying)

---

## Final Recommendation

**Use FlatList with inverted flag.** Legend-list v1.0.14 is not production-ready for chat streaming. ChatterUI's abandonment of an experimental re-implementation is a clear signal. The gains from legend-list's recycling algorithm don't offset the scroll/streaming complexity.

Focus Loom Phase 69+ on:
1. Streaming message accumulation (useRef + rAF buffer, not list-driven)
2. Scroll-stick-to-bottom via inverted FlatList
3. Input height tracking (Zustand store)
4. Index-based rendering (fast, works with streaming updates)

This pattern is battle-tested across Expo chat apps.
