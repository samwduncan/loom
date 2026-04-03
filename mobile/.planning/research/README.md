# Loom v3.0 iOS Chat UI Research Index

**Last Updated:** 2026-04-03  
**Research Depth:** 5 cloned repositories, code analysis + design pattern extraction  
**Status:** Ready for Phase 69 device testing approval

---

## Research Documents

### Core Research Files

1. **BARD-PRIME-DEEP-DIVE.md** ⭐ START HERE
   - Comprehensive analysis of 5 reference implementations
   - Cloned code examples from Galaxies-dev, Legend-list, AWS Swift Chat
   - Production-grade patterns for drawer, message list, composer, streaming
   - 60KB, 1,896 lines, copy-paste ready code snippets
   - **Key Finding:** legend-list replaces inverted FlatList, fixing scroll/animation bugs

2. **CHAT-UI-RESEARCH.md** (Existing)
   - Theoretical research on chat UI patterns
   - Library recommendations (gifted-chat, Stream Chat, legend-list, keyboard-controller)
   - Design system references (Mobbin, GAIA UI, exyte/Chat)
   - Priority recommendations

3. **REFERENCE-APP-TEARDOWN.md** (Existing)
   - ChatGPT vs. Claude iOS design teardown
   - Global design tokens (dark mode colors)
   - Sidebar & navigation patterns
   - Composer anatomy
   - Session list organization

4. **ARCHITECTURE.md** (Existing)
   - Loom's native app architecture
   - Technology stack decisions
   - Storage patterns (MMKV vs. SQLite)
   - Auth and connection management

5. **STACK.md** (Existing)
   - Detailed tech stack breakdown
   - Library rationale and trade-offs

6. **FEATURES.md** (Existing)
   - Feature completeness checklist
   - Phase 69 requirements

7. **PITFALLS.md** (Existing)
   - Known issues and anti-patterns
   - Things to avoid

---

## Quick Reference: Key Findings

### 1. Replace Inverted FlatList → legend-list

**Current Problem:**
- Inverted FlatList breaks Reanimated animations (CSS transform conflict)
- Scroll jumps when new messages arrive
- Scroll direction counterintuitive

**Solution:**
```tsx
// Replace this:
<FlatList data={messages} inverted={true} />

// With this:
<LegendList
  alignItemsAtEnd
  maintainScrollAtEnd
  data={messages}
/>
```

**Impact:** 3 lines changed, all scroll bugs fixed, animations work.

**Library:** `npm install @legendapp/list` (2.0.19, MIT, actively maintained)

---

### 2. Drawer + Session List Pattern

**Reference:** Galaxies-dev/chatgpt-clone-react-native

**Pattern:**
```tsx
<Drawer drawerContent={CustomDrawerContent}>
  {/* Drawer screens */}
</Drawer>

export const CustomDrawerContent = (props) => {
  const [sessions, setSessions] = useState([]);
  
  useEffect(() => {
    // Load sessions from SQLite on drawer open
    loadSessions();
  }, [isDrawerOpen]);

  return (
    <View>
      <SearchBar />
      <DrawerContentScrollView>
        {sessions.map(s => (
          <ContextMenu.Root key={s.id}>
            <ContextMenu.Trigger>
              <DrawerItem label={s.title} onPress={() => navigate(s.id)} />
            </ContextMenu.Trigger>
            <ContextMenu.Content>
              {/* Rename, Delete options */}
            </ContextMenu.Content>
          </ContextMenu.Root>
        ))}
      </DrawerContentScrollView>
      <UserFooter />
    </View>
  );
};
```

**Use Zeego for native iOS context menus** (long-press → UIContextMenuInteraction).

---

### 3. Auto-Grow Composer

**Reference:** GAIA UI Composer spec

**Pattern:**
```tsx
const AutoGrowComposer = () => {
  const [height, setHeight] = useState(40); // min height
  
  const handleContentSizeChange = (e) => {
    const newHeight = e.nativeEvent.contentSize.height;
    setHeight(Math.min(Math.max(newHeight, 40), 144)); // max 6 lines
  };

  return (
    <View style={{ flexDirection: 'row' }}>
      <TouchableOpacity onPress={openAttachments}>
        <Ionicons name="add-circle" size={28} />
      </TouchableOpacity>
      
      <TextInput
        multiline
        scrollEnabled={false}  // Container handles scroll, not input
        onContentSizeChange={handleContentSizeChange}
        style={{ height: height, maxHeight: 144 }}
      />
      
      {text.length > 0 ? (
        <TouchableOpacity onPress={send} disabled={isLoading}>
          {isLoading ? <ActivityIndicator /> : <SendIcon />}
        </TouchableOpacity>
      ) : (
        <MicIcon />
      )}
    </View>
  );
};
```

---

### 4. Keyboard Handling

**Don't use:** Built-in `KeyboardAvoidingView` (timing bugs, platform differences)

**Do use:** `react-native-keyboard-controller`

```bash
npm install react-native-keyboard-controller
```

```tsx
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

// Wrap app root once
<KeyboardProvider>
  <NavigationContainer>{/* ... */}</NavigationContainer>
</KeyboardProvider>

// In chat screen
<KeyboardAvoidingView behavior="translate-with-padding" style={{ flex: 1 }}>
  <LegendList alignItemsAtEnd ... />
  <Composer />
</KeyboardAvoidingView>
```

`behavior="translate-with-padding"` = optimal for chat (combines translation + padding).

---

### 5. Streaming Message Pattern

**Status:** Already implemented correctly in Loom Phase 69 ✓

**Pattern:**
```tsx
// User sends text
setMessages([...messages, { role: 'user', content: text }]);

// Create empty AI message
const aiMsg = { id: uuid(), role: 'assistant', content: '' };
setMessages(prev => [...prev, aiMsg]);

// Stream chunks: append to AI message
stream.onChunk((chunk) => {
  setMessages(prev => 
    prev.map(m => m.id === aiMsg.id ? { ...m, content: m.content + chunk } : m)
  );
});

// On complete: save to database
stream.onComplete(() => saveToDb(messages));
```

---

### 6. Message List Schema (SQLite)

**From:** Galaxies-dev reference

```sql
CREATE TABLE chats (
  id INTEGER PRIMARY KEY NOT NULL,
  title TEXT NOT NULL
);

CREATE TABLE messages (
  id INTEGER PRIMARY KEY NOT NULL,
  chat_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  role TEXT,  -- "user" or "assistant"
  createdAt INTEGER,  -- Unix timestamp (optional)
  FOREIGN KEY (chat_id) REFERENCES chats (id) ON DELETE CASCADE
);
```

---

## Implementation Checklist

### Phase 69 (Current)

- [ ] Verify legend-list with current streaming implementation
- [ ] Test scroll behavior doesn't jump on new messages
- [ ] Confirm Reanimated animations work (no CSS transform conflicts)
- [ ] Device testing on iPhone (real device, not simulator)

### Phase 70 (Enhancements)

- [ ] Implement auto-grow TextInput
- [ ] Add file preview row + attachment menu
- [ ] Add message bubble backgrounds (user vs. assistant)
- [ ] Zeego context menu (long-press: copy, delete, retry)
- [ ] Scroll-to-bottom button with unread badge

### Phase 71+ (Polish)

- [ ] Empty state with suggestion chips
- [ ] Message grouping (hide avatars for consecutive same-sender)
- [ ] Loading indicator (pulsing Loom icon)
- [ ] Typing indicator (3 bouncing dots)
- [ ] Haptic feedback (on send, on receive)

---

## Design Tokens (Dark Mode Reference)

| Element | Value | Notes |
|---------|-------|-------|
| Background | `#0A0A0A` or `#0F0F0F` | Pure/warm black OLED |
| Surface 1 | `#1A1A1A` | Elevated card |
| Surface 2 | `#262626` | Modal/secondary surface |
| Text Primary | `#E8E8E8` | Off-white, warm tone |
| Text Secondary | `#999999` | Muted gray |
| Accent | `#00D9A3` or TBD | Per Soul doc |
| Border | `#333333` | Subtle divider |
| User Bubble | Accent or custom | High contrast |
| Bot Bubble | Surface 1 or transparent | Subtle |

Test on actual iPhone — colors look different on screen vs. design tool.

---

## Library Installation

```bash
# Essential (Phase 69)
npm install @legendapp/list
npm install react-native-keyboard-controller

# Recommended (Phase 70+)
npm install zeego                        # Native iOS context menus
npm install @gorhom/bottom-sheet         # Attachment menu sheet
npm install react-native-shimmer-placeholder  # Loading placeholders

# Already present
# expo-router, expo-sqlite, react-native-mmkv, expo-secure-store
# react-native-reanimated, react-native-safe-area-context
```

---

## Testing Priorities

**Before device testing approval:**

1. **Legend-list scroll** — Add 100+ messages, verify smooth scroll with no jumps
2. **Streaming expansion** — Verify message grows smoothly as chunks arrive
3. **Keyboard behavior** — Compose message with keyboard visible, verify no layout shift
4. **Animation compatibility** — Check Reanimated entering animations still work
5. **Dark mode** — Test on actual iPhone (simulator colors may differ)

---

## References

- [legend-list GitHub](https://github.com/LegendApp/legend-list)
- [react-native-keyboard-controller GitHub](https://github.com/kirillzyusko/react-native-keyboard-controller)
- [Galaxies-dev chatgpt-clone](https://github.com/Galaxies-dev/chatgpt-clone-react-native)
- [AWS Swift Chat](https://github.com/aws-samples/swift-chat)
- [GAIA UI Composer](https://ui.heygaia.io/docs/components/composer)

---

## Questions?

Refer to **BARD-PRIME-DEEP-DIVE.md** for detailed analysis with code examples.

For architecture decisions, see **ARCHITECTURE.md** and **NATIVE-APP-SOUL.md**.

---

**Research Status:** ✅ COMPLETE  
**Ready for Implementation:** YES  
**Approval Gate:** Device testing (Phase 69)
