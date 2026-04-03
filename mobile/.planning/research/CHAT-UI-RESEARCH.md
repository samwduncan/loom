# Chat UI Reference Implementation Research

**Project:** Loom v3.0 Native iOS Chat App
**Researched:** 2026-04-02
**Purpose:** Study existing implementations to improve Loom's chat UI quality

---

## 1. Open-Source ChatGPT/Claude iOS Clones

### Tier 1: Production-Quality Reference Apps

#### aws-samples/swift-chat
- **URL:** https://github.com/aws-samples/swift-chat
- **Stars:** 769
- **Tech:** React Native 0.83, Hermes, New Architecture, react-native-mmkv
- **Last updated:** v2.8.0 (active, 2026)
- **Maintainer:** AWS (official sample)
- **What we can learn:**
  - Real streaming implementation with multiple AI providers (Bedrock, Ollama, DeepSeek, OpenAI)
  - Rich markdown rendering: tables, LaTeX, Mermaid charts, code blocks
  - Background task management with iOS Live Activity
  - Model provider switching within the app
  - Uses react-native-mmkv (same as Loom) for fast storage
  - Production-grade error handling and auth patterns
  - Cross-platform (Android + iOS + macOS) from single RN codebase
- **Limitations:** AWS-centric backend (Lambda + API Gateway). UI is functional but not ChatGPT-level polished. No spring animations or depth.
- **Verdict:** Best React Native reference for **architecture and streaming patterns**. Study the streaming + markdown pipeline.

#### dabit3/react-native-ai (Nader Dabit)
- **URL:** https://github.com/dabit3/react-native-ai
- **Stars:** 1,300
- **Tech:** React Native, TypeScript, Express.js backend
- **Last updated:** 112 commits (2024-2025)
- **Maintainer:** Nader Dabit (prominent RN community figure)
- **What we can learn:**
  - Multi-provider architecture (OpenAI, Anthropic, Gemini) -- same pattern as Loom
  - Built-in theming system (5 pre-configured themes) -- study theme switching
  - Server proxy pattern for API key management
  - Real-time streaming from all providers
  - Three-tier architecture: mobile app -> Express proxy -> LLM providers
- **Limitations:** More of a framework than a polished app. UI is functional, not beautiful. Not Expo-based.
- **Verdict:** Best for studying **multi-provider streaming architecture** and theming patterns.

### Tier 2: Educational/Tutorial Implementations

#### Galaxies-dev/chatgpt-clone-react-native (Simon Grimm)
- **URL:** https://github.com/Galaxies-dev/chatgpt-clone-react-native
- **Stars:** 284
- **Tech:** Expo Router, TypeScript, Clerk auth, RevenueCat IAP, Expo SQLite, FlashList, Reanimated 3, MMKV, Bottom Sheet, Zeego
- **Last updated:** April 2024 (24 commits)
- **Maintainer:** Galaxies.dev (educational)
- **What we can learn:**
  - **This is the closest to Loom's stack.** Expo Router + FlashList + Reanimated + MMKV + Bottom Sheet.
  - Drawer navigation pattern with session list
  - Shimmer placeholder for loading states
  - Zeego for native context menus (long-press message actions)
  - DALL-E image generation integration
  - 14 screenshots showing the full ChatGPT-like flow
  - SQLite for chat/message persistence (Loom uses MMKV but could study the schema)
- **Limitations:** Tutorial project, not production app. Only 24 commits. Likely not handling edge cases. Last update April 2024.
- **Verdict:** **Most directly applicable to Loom's stack.** Study the Expo Router + drawer + FlashList + Reanimated integration patterns. Clone and run it.

#### bizzara/ChatGPT
- **URL:** https://github.com/bizzara/ChatGPT
- **Stars:** Low
- **Tech:** React Native Expo, Firebase
- **What we can learn:** Firebase auth + Firestore pattern for chat persistence.
- **Verdict:** Skip. Firebase-centric, not relevant to Loom's architecture.

#### jedwards1230/myChat
- **URL:** https://github.com/jedwards1230/myChat
- **Stars:** Low
- **Tech:** React Native, Fastify, PostgreSQL, Docker
- **What we can learn:** Backend architecture with Fastify + Postgres. Docker deployment.
- **Verdict:** Skip for UI research. Backend patterns not relevant (Loom has its own backend).

### Tier 3: SwiftUI Implementations (Design Reference Only)

#### alfianlosari/ChatGPTSwiftUI
- **URL:** https://github.com/alfianlosari/ChatGPTSwiftUI
- **Stars:** 695
- **Tech:** Swift/SwiftUI, OpenAI API, Google Generative AI SDK
- **Last updated:** February 2023 (stale)
- **What we can learn:** Multi-platform SwiftUI chat UI across iOS, macOS, watchOS, tvOS. Markdown + code syntax highlighting.
- **Verdict:** Stale. Design is outdated relative to current ChatGPT iOS app. Skip.

#### zahidkhawaja/swiftchat
- **URL:** https://github.com/zahidkhawaja/swiftchat
- **Stars:** Low
- **Tech:** SwiftUI
- **Verdict:** Skip. Minimal implementation.

---

## 2. React Native Chat UI Libraries

### react-native-gifted-chat
- **URL:** https://github.com/FaridSafi/react-native-gifted-chat
- **Stars:** 14,400 (most popular by far)
- **Version:** 3.3.2
- **What it offers:** Complete chat UI with message bubbles, avatars, typing indicators, quick replies, copy-to-clipboard, load earlier messages, swipe-to-reply, reply threading, smart link parsing.
- **Key feature for AI:** `maintainVisibleContentPosition` support via listProps (keeps scroll position when new messages arrive).
- **What we can learn:**
  - The API surface: what props a complete chat component exposes
  - Message data model: `{ _id, text, createdAt, user, image, video, audio, system, sent, received, pending }`
  - Quick replies pattern for suggestion chips
  - `renderChatEmpty` for empty state
  - `scrollToBottomComponent` for scroll-to-bottom button
  - Swipe-to-reply with reply preview and threading
- **Why NOT to use it:**
  - No streaming message support
  - Uses inverted FlatList internally (performance pitfall)
  - Person-to-person messaging assumptions baked in (avatars both sides, read receipts)
  - Customization requires overriding render methods -- becomes unmaintainable
  - Wrong abstraction for AI chat
- **Verdict:** **Study the API, don't adopt the library.** The prop surface (`renderBubble`, `renderComposer`, `renderSend`, `renderInputToolbar`, `renderChatEmpty`, `scrollToBottomComponent`, etc.) is a useful checklist of features a chat UI needs. The implementation is wrong for AI chat.

### Stream Chat React Native SDK
- **URL:** https://github.com/GetStream/stream-chat-react-native
- **Docs:** https://getstream.io/chat/docs/sdk/react-native/
- **What it offers:** Production chat SDK with AI assistant support. StreamingMessageView component for character-by-character rendering with markdown. AI typing indicator with shimmer animation.
- **AI-specific features:**
  - StreamingMessageView: renders markdown + code in real-time (but typewriter style, which Soul doc forbids)
  - AITypingIndicatorView: shimmer animation during AI thinking
  - Rich markdown: tables, code blocks, inline code, headings, lists, charts
  - ScrollToBottomButton component
  - Custom message input middleware (MessageComposer)
- **What we can learn:**
  - How a production SDK handles AI streaming + markdown
  - Component composition pattern (Channel wraps MessageList + MessageInput)
  - Message status indicators (sent/delivered/read) -- useful for "sending" state
  - Autocomplete/suggestion system for commands
- **Why NOT to use it:** Paid SaaS product. Vendor lock-in. Overkill for single-user local app.
- **Verdict:** **Excellent pattern reference.** Study the StreamingMessageView, AITypingIndicatorView, and ScrollToBottomButton. Don't adopt the SDK.

### react-native-keyboard-controller
- **URL:** https://github.com/kirillzyusko/react-native-keyboard-controller
- **Stars:** 3,500
- **Version:** 1.21.3 (March 2026)
- **What it offers:**
  - `KeyboardChatScrollView`: purpose-built for chat UIs (messenger + AI chat)
  - `KeyboardAvoidingView` with `behavior="translate-with-padding"` (best for chat)
  - `KeyboardStickyView`: keeps views floating above keyboard
  - `KeyboardToolbar`: toolbar that rides above keyboard
  - Identical behavior iOS + Android
  - Reanimated integration for smooth animations
  - `useKeyboardHandler` hook for custom keyboard animation
- **What we can learn:**
  - The "translate-with-padding" behavior: combines translation (moves view up) with paddingTop for best chat performance
  - KeyboardChatScrollView handles the entire chat-specific keyboard dance
  - Interactive keyboard dismissal (drag to dismiss)
- **Verdict:** **Adopt this library.** Solves the hardest UX problem in chat apps. Actively maintained, 3.5k stars, Expo compatible.

### legend-list
- **URL:** https://github.com/LegendApp/legend-list
- **Stars:** 3,000
- **Version:** 2.0.19 (December 2025)
- **What it offers:**
  - `alignItemsAtEnd`: bottom-aligns content without inverted FlatList
  - `maintainScrollAtEnd`: auto-scrolls when items added or heights change
  - Bidirectional infinite scrolling (no flash/jump)
  - Dynamic item heights without performance penalty
  - Drop-in FlatList/FlashList replacement
  - Pure TypeScript, no native dependencies
- **Why it matters for chat:**
  - Eliminates inverted FlatList anti-pattern entirely
  - Animations work correctly (no CSS transform flip)
  - Scroll direction is natural for both reading and pagination
  - No estimated item size needed (unlike FlashList v1)
- **Verdict:** **Adopt for message list.** The `alignItemsAtEnd` + `maintainScrollAtEnd` combination is exactly what a chat list needs.

### FlashList v2 (Shopify)
- **URL:** https://github.com/Shopify/flash-list
- **Stars:** 5,800+
- **What it offers:**
  - `maintainVisibleContentPosition` (enabled by default)
  - `startRenderingFromBottom: true` for chat
  - `autoscrollToBottomThreshold` for auto-scroll
  - Complete ground-up rewrite for New Architecture
  - Powers Shopify's production app
- **Known issue for chat:** Issue #1844 reports inconsistent scroll behavior with paginated messages after v1->v2 migration. Issue #2050 reports bugs when initial data doesn't fill the screen.
- **Verdict:** Viable alternative to legend-list, but chat-specific regressions are concerning. Legend-list's `alignItemsAtEnd` is a cleaner solution.

---

## 3. Design System References

### Mobbin (ChatGPT + Claude iOS Screen Catalog)
- **ChatGPT iOS screens:** https://mobbin.com/explore/screens/f7e6514e-4106-4b5a-8c37-1b86aa42a9f1
- **Claude iOS flow:** https://mobbin.com/explore/flows/9a6c28e2-9e3a-43e6-9025-ee08ce863f57
- **Chatbot UI screens:** https://mobbin.com/explore/mobile/screens/chat-bot
- **What it offers:** Real screenshots of both ChatGPT and Claude iOS apps. Interactive flows showing transitions. Filterable by screen type (empty state, chat, sidebar, settings).
- **What to study:**
  - ChatGPT: Chat interface layout, message input with suggested prompts, camera icon placement
  - Claude: "Chatting with Claude" text input flow
  - Both: Sidebar session list design, empty state greeting, model selector placement
- **Verdict:** **Essential design reference.** Free tier shows screenshots. Paid tier shows flows with animations. Browse before any UI work.

### GAIA UI (Open-Source AI Assistant Component Library)
- **URL:** https://ui.heygaia.io/
- **Composer docs:** https://ui.heygaia.io/docs/components/composer
- **Tech:** React (not React Native), Radix UI, Tailwind CSS
- **What it documents:**
  - **Composer component** with exhaustive spec:
    - Auto-growing textarea: height auto -> lineHeight * maxRows -> internal scroll
    - File attachments: FilePreview row above input
    - Tools integration: SlashCommandDropdown for tool selection
    - Plus button: context menu for camera/files
    - Send button: gray when disabled, accent when enabled, loading state
    - Keyboard shortcuts: Enter to send, Shift+Enter for newline, Escape to close
  - **Color tokens:** `bg-zinc-100 dark:bg-zinc-800` for composer, accent `#00bbff`
  - **Size tokens:** buttons `h-9 w-9`, rounded-full
- **Why it matters:** This is the most detailed open-source documentation of a ChatGPT-style composer. The patterns translate directly to React Native even though the code doesn't.
- **Verdict:** **Use as the composer design blueprint.** Translate the patterns to RN: auto-growing TextInput, PlusButton with context menu, SendButton state machine, FilePreview row.

### exyte/Chat (SwiftUI Framework)
- **URL:** https://github.com/exyte/Chat
- **Stars:** 1,700
- **Tech:** SwiftUI, 601 commits, 67 releases, actively maintained
- **What it offers:**
  - Fully customizable message cells with positional parameters
  - Built-in media picker (photo, video, camera, multi-select)
  - Sticker keyboard with Giphy integration
  - Long-press context menu with auto-scroll for big messages
  - Reply-to-message via swipe gesture
  - Voice recording UI
  - Theme customization via `ChatTheme`
  - Date headers, scroll behavior, keyboard dismiss modes
  - Swipe actions with conditional visibility
  - Message position tracking (user groups, sections, comment groups)
- **What we can learn:**
  - **Message grouping**: How to group consecutive messages from same sender (reduce visual noise)
  - **Swipe actions pattern**: Reveal action surface on horizontal swipe
  - **Long-press menu**: Context menu on message (copy, reply, delete)
  - **Media picker integration**: Camera + library in one sheet
  - **Reply-to-message UI**: Reply preview above composer
- **Verdict:** **Best design reference for message interactions.** Can't use the code (SwiftUI), but every UX pattern is transferable.

### Apple Dark Mode Guidelines
- **URL:** https://developer.apple.com/design/human-interface-guidelines/dark-mode
- **Key principles for Loom:**
  - Use semantic colors that adapt automatically
  - Avoid pure white text (#FFFFFF) -- use off-white for reduced eye strain
  - Reduce saturation of colors in dark mode
  - Maintain minimum 4.5:1 contrast ratio (WCAG)
  - Loom's warm charcoal palette (rgb 38,35,33) aligns with Apple's recommendation of dark gray over pure black
- **Verdict:** Soul doc already follows these principles. Reference for any new surface colors.

### OpenAI Apps SDK UI
- **URL:** https://github.com/openai/apps-sdk-ui
- **Docs:** https://openai.github.io/apps-sdk-ui/
- **What it offers:** OpenAI's own design system for building ChatGPT apps. Tailwind-integrated tokens, React components.
- **What we can learn:** OpenAI's chosen design tokens, spacing, typography for their chat interface.
- **Verdict:** Worth a quick scan for official ChatGPT design token values.

---

## 4. Specific UI Pattern Implementations

### Chat Composer Pattern

**Best reference:** GAIA UI Composer (https://ui.heygaia.io/docs/components/composer)

**Anatomy (ChatGPT/Claude style):**
```
+--------------------------------------------------+
| [FilePreview1] [FilePreview2] [x]                |  <- Attachment row (conditional)
+--------------------------------------------------+
| [+] | Message Loom...               | [^Send]    |  <- Input row
+--------------------------------------------------+
       ^                                    ^
   Plus button                         Send button
   (context menu)                      (state machine)
```

**Key implementation details:**
- TextInput: `multiline={true}`, min height 40px, max height ~144px (6 lines * 24px)
- Plus button: Opens ActionSheet or BottomSheet with Camera, Photo Library, Files options
- Send button: Three states (disabled/gray, enabled/accent, loading/spinner)
- Enter to send (with hardware keyboard), Shift+Enter for newline
- File previews: Horizontal ScrollView above input, each with remove button

### Keyboard Avoidance for Chat

**Best reference:** react-native-keyboard-controller docs

**Pattern:**
```typescript
// Wrap entire app in KeyboardProvider
<KeyboardProvider>
  <NavigationContainer>
    <Stack.Navigator>
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  </NavigationContainer>
</KeyboardProvider>

// Chat screen uses KeyboardChatScrollView or:
<KeyboardAvoidingView behavior="translate-with-padding">
  <MessageList style={{ flex: 1 }} />
  <Composer />
</KeyboardAvoidingView>
```

**Critical:** `translate-with-padding` combines translation with padding for best chat performance. Not `padding` (causes content shift), not `height` (causes resize).

### Session List in Drawer

**Best reference:** Galaxies-dev ChatGPT clone + Expo Router drawer docs

**Pattern:**
```
+---------------------------+
| [Loom Logo]  [New Chat+]  |  <- Header
+---------------------------+
| [Search...]               |  <- Search (optional)
+---------------------------+
| Today                     |  <- Date section header
|   > Session title 1       |
|   > Session title 2       |
| Yesterday                 |
|   > Session title 3       |
| Previous 7 Days           |
|   > Session title 4       |
+---------------------------+
| [Settings]  [Profile]     |  <- Footer
+---------------------------+
```

**Implementation with expo-router:**
- Drawer type: "slide" (both drawer and content slide together) matches ChatGPT iOS
- Custom `drawerContent` prop on `<Drawer>` component
- Session list: FlatList with section headers (Today, Yesterday, Previous 7 Days)
- Swipe-to-delete on session items
- Long-press for rename/archive

### Message Entering Animation

**Best reference:** Reanimated layout animations docs + Soul doc springs

**Pattern:**
```typescript
import Animated, { FadeInDown } from 'react-native-reanimated';

// Soul doc Standard spring: damping 20, stiffness 150, mass 1.0, ~250ms settle
const messageEntering = FadeInDown
  .springify()
  .damping(20)
  .stiffness(150)
  .mass(1.0);

<Animated.View entering={messageEntering}>
  <MessageBubble message={message} />
</Animated.View>
```

**Important:** This requires the list component to support Reanimated layout animations. Legend-list should work since items are normal Views. Inverted FlatList would break this (CSS transform conflict).

### Scroll-to-Bottom Button

**Pattern from gifted-chat + Stream Chat:**
```typescript
const [showScrollButton, setShowScrollButton] = useState(false);

// Track scroll position
const onScroll = (event) => {
  const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
  const distanceFromBottom = contentSize.height - contentOffset.y - layoutMeasurement.height;
  setShowScrollButton(distanceFromBottom > 20); // 20px threshold
};

// Floating button
{showScrollButton && (
  <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.scrollButton}>
    <Pressable onPress={() => listRef.current?.scrollToEnd()}>
      <ChevronDownIcon />
      {unreadCount > 0 && <Badge count={unreadCount} />}
    </Pressable>
  </Animated.View>
)}
```

### Thinking/Loading Indicator

**Best references:** react-native-typing-animation, Stream AITypingIndicatorView

**Options:**
1. **Three bouncing dots** (classic): react-native-typing-animation with configurable dotColor, dotRadius, dotAmplitude, dotSpeed
2. **Shimmer bar** (Stream AI style): Gradient shimmer across a placeholder bar, more modern feel
3. **Pulsing Loom icon**: Custom -- Soul doc accent color with sinusoidal opacity pulse (0.6 to 1.0 over 2.5s), consistent with streaming color warmth

**Recommendation:** Option 3 (pulsing Loom icon) is most on-brand. Falls back to option 1 (dots) for simplicity in v3.0.

---

## 5. Priority Recommendations

### Must Study (Clone and Run)
1. **Galaxies-dev/chatgpt-clone-react-native** -- Closest to our stack. Clone it, run it, study Expo Router + drawer + FlashList + Reanimated integration.
2. **GAIA UI Composer docs** -- Read the full component spec. It's the most detailed open-source ChatGPT-style composer documentation.
3. **Mobbin ChatGPT + Claude screens** -- Browse both apps' screen catalogs for empty state, message list, composer, and drawer patterns.

### Must Evaluate (Install and Test)
1. **legend-list** -- Test with Expo SDK 54. Verify `alignItemsAtEnd` + `maintainScrollAtEnd` work for our message model.
2. **react-native-keyboard-controller** -- Test `KeyboardChatScrollView` with our custom composer. Verify no Expo 54 crashes.

### Should Study (Read Source/Docs)
1. **aws-samples/swift-chat** -- Streaming + markdown pipeline reference for React Native.
2. **exyte/Chat** (SwiftUI) -- Message interaction patterns (swipe, long-press, reply).
3. **Stream Chat RN AI docs** -- AI streaming component patterns (don't adopt, study).
4. **react-native-gifted-chat API surface** -- Checklist of features a complete chat UI needs.

### Nice to Know
1. **dabit3/react-native-ai** -- Theming system and multi-provider architecture.
2. **OpenAI Apps SDK UI** -- Official ChatGPT design tokens.
3. **react-native-typing-animation** -- Simple thinking indicator if custom is too much.

---

## 6. Key Takeaways for Loom

1. **Building from scratch was the right call** -- no existing library fits the Soul doc vision. But the mistake was not studying reference implementations first. Fix this now.

2. **Replace inverted FlatList with legend-list** -- the single highest-impact change. Fixes scroll performance, enables proper animations, natural pagination direction.

3. **Adopt react-native-keyboard-controller** -- the keyboard problem is solved. Don't fight KeyboardAvoidingView. Use the purpose-built chat solution.

4. **The composer needs a redesign** based on GAIA UI patterns -- auto-growing input, send button state machine, plus button for attachments.

5. **Message entering animations are easy wins** -- FadeInDown with Soul doc Standard spring. Immediate quality boost, minimal code.

6. **Empty state with suggestion chips** is table stakes -- every AI chat app does it. ChatGPT, Claude, Gemini all have greeting + tappable prompts.

7. **Don't typewriter-animate streaming** -- Soul doc forbids it, and it's actually slower-feeling for long AI responses. Append chunks, smooth scroll.

8. **Mobbin is the best free design reference** for comparing ChatGPT vs Claude iOS patterns. Use it for every screen design decision.
