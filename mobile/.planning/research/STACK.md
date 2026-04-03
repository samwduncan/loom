# Technology Stack: Chat UI Components

**Project:** Loom v3.0 Chat UI Polish
**Researched:** 2026-04-02

## Recommended Stack

### Message List Component
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| legend-list | 2.0.19 | Chat message list rendering | `alignItemsAtEnd` eliminates inverted FlatList. `maintainScrollAtEnd` auto-scrolls on new messages. No native deps (pure TS). 3k stars. No inversion = proper animation support |

**Alternative considered:** FlashList v2 with `maintainVisibleContentPosition` + `startRenderingFromBottom`. Also viable but has reported chat pagination regressions (Issue #1844). Legend-list's `alignItemsAtEnd` is purpose-built for chat.

### Keyboard Handling
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| react-native-keyboard-controller | 1.21.3 | Keyboard avoidance for chat | `KeyboardChatScrollView` is built specifically for chat UIs. 3.5k stars. `translate-with-padding` mode best for chat performance. Identical behavior iOS/Android |

**Alternative considered:** Built-in KeyboardAvoidingView. Works but requires manual offset calculation, no chat-specific scroll behavior, no Android `keyboardWillShow` parity.

### Message Animations
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| react-native-reanimated | (existing) | Message entering/exiting animations | Layout animations (`entering`/`exiting` props) on Animated.FlatList/legend-list items. Spring physics match Soul doc. Already in project |

### Streaming Markdown
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| react-native-enriched-markdown | 0.4.0 | Markdown rendering with GFM | Phase 69 decision confirmed -- streamdown (0.1.1) lacks GFM tables. enriched-markdown supports tables, code blocks, inline formatting |

### Gesture Handling
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| react-native-gesture-handler | (existing) | Swipe-to-reply, drawer gestures | Required by drawer navigation, keyboard-controller. Already in project |

### Bottom Sheet
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @gorhom/bottom-sheet | (existing) | Model selector, attachment picker | Seamless keyboard handling, snap points, modal mode. Already in Galaxies-dev reference |

## Supporting Libraries

| Library | Purpose | When to Use |
|---------|---------|-------------|
| react-native-typing-animation | Typing/thinking indicator | AI response loading state. Three-dot bounce animation. Simple trigonometry-based |
| legend-list | Chat message list | Primary message list -- replace inverted FlatList |
| react-native-keyboard-controller | Chat keyboard | Wrap chat screen in KeyboardChatScrollView |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Message list | legend-list | FlashList v2 | FlashList has chat pagination regression (Issue #1844); legend-list purpose-built for chat with `alignItemsAtEnd` |
| Message list | legend-list | react-native-gifted-chat | Gifted chat is a complete opinionated UI, not composable. Wrong abstraction for custom AI chat. Fights customization |
| Message list | legend-list | FlatList (inverted) | 30-40 FPS drops on Android with inverted prop. Animation bugs. Legend-list avoids inversion entirely |
| Keyboard | keyboard-controller | KeyboardAvoidingView (built-in) | No chat-specific scroll, no Android keyboardWillShow, manual offset calculation |
| Streaming MD | enriched-markdown | react-native-streamdown | Streamdown is CommonMark only -- no GFM tables. Phase 69 requirement D-02 needs tables |
| Chat UI | Custom build | react-native-gifted-chat (14.4k stars) | Gifted chat is designed for person-to-person messaging, not AI streaming. No streaming support. Opinionated layout fights Loom's Soul doc vision |
| Chat UI | Custom build | Stream Chat RN SDK | Excellent AI features but paid SaaS. Vendor lock-in. Overkill for single-user local app |

## Installation

```bash
# New dependencies to evaluate
npm install @legendapp/list
npm install react-native-keyboard-controller
npm install react-native-typing-animation

# Already installed (verify versions)
# react-native-reanimated
# react-native-gesture-handler
# @gorhom/bottom-sheet
# react-native-enriched-markdown
```

## Sources

- legend-list: https://github.com/LegendApp/legend-list (3k stars, MIT, Dec 2025)
- react-native-keyboard-controller: https://github.com/kirillzyusko/react-native-keyboard-controller (3.5k stars, Mar 2026)
- FlashList v2: https://shopify.engineering/flashlist-v2 (Shopify Engineering, 2025)
- react-native-gifted-chat: https://github.com/FaridSafi/react-native-gifted-chat (14.4k stars)
- react-native-streamdown: https://github.com/software-mansion-labs/react-native-streamdown (185 stars, Mar 2026)
- react-native-typing-animation: https://github.com/watadarkstar/react-native-typing-animation
