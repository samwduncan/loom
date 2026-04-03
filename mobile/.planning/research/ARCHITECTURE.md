# Architecture Patterns: AI Chat iOS App

**Domain:** AI Chat Mobile App (React Native + Expo)
**Researched:** 2026-04-02

## Recommended Architecture

### Chat Screen Component Hierarchy

```
ChatScreen
  |-- ConnectionBanner (WebSocket status)
  |-- MessageList (legend-list with alignItemsAtEnd)
  |   |-- EmptyState (suggestion chips, greeting)
  |   |-- MessageBubble[] (Reanimated entering animation)
  |   |   |-- UserMessage (right-aligned, accent bg)
  |   |   |-- AssistantMessage (left-aligned, neutral bg)
  |   |   |   |-- MarkdownRenderer (react-native-enriched-markdown)
  |   |   |   |-- ThinkingIndicator (typing animation dots)
  |   |   |-- SystemMessage (centered, subtle)
  |   |-- ScrollToBottomButton (floating, absolute positioned)
  |-- Composer
      |-- AttachmentPreviewRow (horizontal scroll of previews)
      |-- InputRow
      |   |-- PlusButton (context menu: camera, files)
      |   |-- AutoGrowingTextInput (multiline, maxRows ~6)
      |   |-- SendButton (disabled/enabled state machine)
      |-- ModelSelector (optional, bottom sheet or inline)
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| ChatScreen | Orchestrates layout, keyboard provider | MessageList, Composer, ConnectionBanner |
| MessageList | Renders messages, handles scroll, empty state | MessageBubble[], EmptyState, ScrollToBottomButton |
| MessageBubble | Single message rendering with animation | MarkdownRenderer, ThinkingIndicator |
| Composer | Text input, send action, attachment management | ChatScreen (via onSend callback), PlusButton, SendButton |
| AutoGrowingTextInput | Multiline input that grows to maxRows then scrolls | Composer (height change callback) |
| SendButton | Disabled/enabled/loading state machine | Composer (onPress callback) |
| EmptyState | Greeting + suggestion chips for new conversations | ChatScreen (onSuggestionPress -> populate composer) |
| ScrollToBottomButton | Floating button when scrolled away from bottom | MessageList (scroll position tracking) |

### Data Flow

```
User types in Composer
  -> AutoGrowingTextInput tracks content height
  -> SendButton enables when text is non-empty
  -> User taps Send
  -> Composer calls onSend(messageText)
  -> ChatScreen creates user message in store
  -> MessageList receives new message via store subscription
  -> legend-list auto-scrolls (maintainScrollAtEnd)
  -> New MessageBubble enters with spring animation
  -> ChatScreen initiates API streaming
  -> ThinkingIndicator appears in new assistant bubble
  -> Streaming tokens update assistant message in store
  -> MarkdownRenderer re-renders incrementally
  -> On stream complete, ThinkingIndicator removed
  -> Final MessageBubble settles with layout animation
```

## Patterns to Follow

### Pattern 1: Bottom-Aligned List Without Inversion

**What:** Use legend-list with `alignItemsAtEnd` instead of inverted FlatList.

**When:** Any chat-like interface where messages accumulate from bottom.

**Why:** Inverted FlatList applies a CSS transform that causes 30-40 FPS drops on Android, breaks Reanimated entering animations, and causes confusion with scroll direction when loading older messages.

**Example:**
```typescript
import { LegendList } from '@legendapp/list';

<LegendList
  data={messages}
  renderItem={({ item }) => <MessageBubble message={item} />}
  alignItemsAtEnd={true}
  maintainScrollAtEnd={true}
  keyExtractor={(item) => item.id}
  // No inverted prop needed!
/>
```

**Source:** legend-list docs, FlashList v2 chat regression Issue #1844

### Pattern 2: Auto-Growing Composer Input

**What:** TextInput that grows vertically as user types, up to a maximum height, then becomes scrollable.

**When:** Chat composer with multiline support.

**Example:**
```typescript
const [inputHeight, setInputHeight] = useState(MIN_HEIGHT);
const MAX_HEIGHT = LINE_HEIGHT * MAX_ROWS; // e.g., 24 * 6 = 144

<TextInput
  multiline
  onContentSizeChange={(e) => {
    const newHeight = Math.min(
      Math.max(e.nativeEvent.contentSize.height, MIN_HEIGHT),
      MAX_HEIGHT
    );
    setInputHeight(newHeight);
  }}
  style={{ height: inputHeight }}
  placeholder="Message Loom..."
/>
```

**Source:** GAIA UI composer, React Native TextInput docs

### Pattern 3: Keyboard-Aware Chat Layout

**What:** Use `react-native-keyboard-controller` with `translate-with-padding` mode for chat screens.

**When:** Any screen with a text input at the bottom and scrollable content above.

**Example:**
```typescript
import { KeyboardProvider } from 'react-native-keyboard-controller';

// In app root:
<KeyboardProvider>
  <App />
</KeyboardProvider>

// In chat screen, either use KeyboardChatScrollView or:
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

<KeyboardAvoidingView behavior="translate-with-padding">
  <MessageList />
  <Composer />
</KeyboardAvoidingView>
```

**Source:** react-native-keyboard-controller docs, Expo keyboard handling guide

### Pattern 4: Send Button State Machine

**What:** Send button transitions between disabled, enabled, and loading states with spring animation.

**When:** Chat composer with async message sending.

**Example:**
```typescript
type SendButtonState = 'disabled' | 'enabled' | 'loading';

// State transitions:
// disabled -> enabled: when input.trim().length > 0 || attachments.length > 0
// enabled -> loading: when send is pressed
// loading -> disabled: when send completes and input is cleared
// enabled -> disabled: when input is cleared

// Visual:
// disabled: gray, scale 0.9, no press handler
// enabled: accent color, scale 1.0, Micro spring on press (0.85 -> 1.0)
// loading: accent color, ActivityIndicator, no press handler
```

**Source:** GAIA UI composer, Soul doc (Micro spring: damping 18, stiffness 220, mass 0.8)

### Pattern 5: Message Entering Animation

**What:** New messages spring in from below with opacity fade.

**When:** Every new message added to the list.

**Example:**
```typescript
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

const MessageBubble = ({ message }) => (
  <Animated.View
    entering={FadeInDown.springify()
      .damping(20)
      .stiffness(150)
      .mass(1.0)}
    layout={LinearTransition.springify()}
  >
    {/* message content */}
  </Animated.View>
);
```

**Source:** Reanimated layout animations docs, Soul doc Standard spring config

### Pattern 6: Empty State with Suggestion Chips

**What:** When conversation has no messages, show greeting + tappable prompt suggestions.

**When:** New chat screen, first load.

**Example (design pattern):**
```
  +---------------------------------------+
  |                                       |
  |                                       |
  |          [Loom icon/avatar]           |
  |                                       |
  |      How can I help you today?        |
  |                                       |
  |  +----------------------------------+ |
  |  |  Explain quantum computing       | |
  |  |  simply                          | |
  |  +----------------------------------+ |
  |  +----------------------------------+ |
  |  |  Write a Python function to      | |
  |  |  sort a list                     | |
  |  +----------------------------------+ |
  |  +----------------------------------+ |
  |  |  Help me debug this error        | |
  |  +----------------------------------+ |
  |                                       |
  +---------------------------------------+
  | [+] Message Loom...          [Send]   |
  +---------------------------------------+
```

Tapping a chip populates the composer and optionally auto-sends.

**Source:** ChatGPT iOS (Mobbin), Claude iOS (Mobbin), Google Gemini empty state

## Anti-Patterns to Avoid

### Anti-Pattern 1: Inverted FlatList for Chat
**What:** Using `<FlatList inverted />` to bottom-align messages.
**Why bad:** CSS transform causes 30-40 FPS drops on Android. Breaks Reanimated entering/exiting animations. Confuses scroll direction for pagination (loading older messages). Items render upside-down then flip, causing visual artifacts.
**Instead:** Use legend-list with `alignItemsAtEnd` or FlashList v2 with `startRenderingFromBottom`.

### Anti-Pattern 2: Character-by-Character Typewriter
**What:** Animating each character/word appearance during streaming.
**Why bad:** Soul doc explicitly forbids it. Causes excessive re-renders. Distracting over long responses. Stream Chat does this and users find it slow-feeling for long outputs.
**Instead:** Append markdown chunks. Let the markdown renderer handle display. Smooth scroll follow.

### Anti-Pattern 3: Gifted Chat as Base
**What:** Using react-native-gifted-chat as the foundation and customizing from there.
**Why bad:** Designed for person-to-person messaging (read receipts, avatars both sides, typing indicators from remote users). Fights AI chat patterns at every turn. No streaming support. Custom renderBubble/renderMessage overrides become unmaintainable.
**Instead:** Build composable message list with legend-list + custom MessageBubble components.

### Anti-Pattern 4: Static Composer Height
**What:** Fixed-height TextInput in the composer.
**Why bad:** Clips multiline messages. Forces user to scroll within a tiny input area. ChatGPT and Claude both auto-grow.
**Instead:** Auto-growing TextInput with min/max height constraints.

### Anti-Pattern 5: KeyboardAvoidingView with Hardcoded Offset
**What:** `<KeyboardAvoidingView keyboardVerticalOffset={88}>` with a magic number.
**Why bad:** Breaks across devices (notch vs no notch, Dynamic Island). Different offset needed with/without tab bar.
**Instead:** Use react-native-keyboard-controller which calculates offsets correctly, or compute offset from navigation header height.

## Scalability Considerations

| Concern | 10 sessions | 100 sessions | 1000+ sessions |
|---------|-------------|--------------|----------------|
| Session list rendering | Simple FlatList | FlatList with windowing | Need search + pagination from server |
| Message history | Load all in memory | Load recent, paginate older | legend-list bidirectional pagination |
| Streaming performance | No concern | No concern | No concern (one stream at a time) |
| Storage (MMKV) | Trivial | ~1-5MB | Consider SQLite for messages |

## Sources

- legend-list: https://github.com/LegendApp/legend-list
- react-native-keyboard-controller: https://kirillzyusko.github.io/react-native-keyboard-controller/
- FlashList v2: https://shopify.engineering/flashlist-v2
- Reanimated layout animations: https://docs.swmansion.com/react-native-reanimated/docs/layout-animations/list-layout-animations/
- GAIA UI Composer: https://ui.heygaia.io/docs/components/composer
- Stream Chat RN AI: https://getstream.io/blog/react-native-assistant/
- Incoming chat messages animation: https://www.animatereactnative.com/post/incoming-chat-messages-animation-reanimated
- Expo keyboard handling: https://docs.expo.dev/guides/keyboard-handling/
