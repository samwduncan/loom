# Feature Landscape: AI Chat iOS App UI

**Domain:** AI Chat Mobile App (ChatGPT/Claude-class)
**Researched:** 2026-04-02

## Table Stakes

Features users expect from any ChatGPT/Claude-tier AI chat app. Missing = "this feels broken."

| Feature | Why Expected | Complexity | Reference Implementation |
|---------|--------------|------------|-------------------------|
| Auto-growing composer input | ChatGPT/Claude both do this. Fixed-height input feels amateur | Low | GAIA UI composer: auto height up to maxRows, then scroll |
| Send button state (enabled/disabled) | Visual feedback that message can be sent | Low | GAIA UI: gray when empty, accent color when ready |
| Keyboard avoidance that doesn't jump | iOS users expect smooth keyboard push-up | Med | react-native-keyboard-controller KeyboardChatScrollView |
| Auto-scroll to latest message | New messages should be visible without manual scroll | Low | legend-list `maintainScrollAtEnd` or FlashList `autoscrollToBottomThreshold` |
| Scroll-to-bottom button | When scrolled up, show button to jump to latest | Low | Stream Chat ScrollToBottomButton pattern, gifted-chat `scrollToBottomComponent` |
| Message bubbles with sender distinction | User messages vs AI messages must be visually distinct | Low | All reference apps: user = right/accent, AI = left/neutral |
| Streaming text display | Token-by-token rendering during AI response | Med | react-native-enriched-markdown, SwiftChat streaming |
| Thinking/loading indicator | Visual signal that AI is processing | Low | react-native-typing-animation (3-dot bounce) or custom shimmer |
| Session list in drawer/sidebar | Browse and switch between conversations | Med | Galaxies-dev ChatGPT clone drawer pattern, expo-router drawer |
| New chat button | Start fresh conversation quickly | Low | ChatGPT: top-right in sidebar. Claude: top of sidebar |
| Empty state with suggestions | New chat shows prompt suggestions, not blank screen | Med | ChatGPT: "How can I help you today?" + suggestion chips. Claude: similar |
| Dark mode | Both ChatGPT and Claude default to dark on iOS | Low | Already in Soul doc. Warm charcoal palette, not cool gray |
| Safe area handling | Respect notch, Dynamic Island, home indicator | Low | Already handled via expo safe-area-context |
| Haptic feedback on send | Physical confirmation of message sent | Low | Impact Light on send -- already in Soul doc |
| Copy message text | Long-press to copy AI response | Low | gifted-chat: long-press -> copy. Standard iOS pattern |

## Differentiators

Features that set Loom apart from ChatGPT/Claude. Not expected, but valued.

| Feature | Value Proposition | Complexity | Reference |
|---------|-------------------|------------|-----------|
| Spring-physics message animations | Messages spring in rather than pop -- feels physical | Med | Soul doc Micro/Standard springs + Reanimated entering animations |
| Dynamic color during streaming | Palette warms during AI response, cools on error | High | Soul doc: +3 degrees hue shift, accent pulse. No reference app does this |
| Swipe-to-reply | Reply to specific messages in conversation | Med | exyte/Chat: swipe gesture reveals reply context |
| Parallax drawer effect | Main content shifts with parallax when drawer opens | Med | Soul doc: 20px right shift + proportional overlay dim |
| Glass/blur surface tiers | 4-tier depth hierarchy with real blur | Med | Soul doc. No ChatGPT/Claude clone implements this |
| Permission card elevation | Permission requests appear as elevated overlays | Med | Soul doc: Tier 3 overlay, Heavy shadow, accent glow |
| Model selector in composer | Switch AI model without leaving chat | Med | GAIA UI tools integration pattern. SwiftChat model dropdown |
| Pull-to-refresh sessions | Pull down in session list to refresh | Low | Standard iOS pattern, Soul doc: custom spring (damping 25, stiffness 120) |

## Anti-Features

Features to explicitly NOT build. Learned from reference implementations.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Gifted-chat as base component | Fights customization at every turn. Designed for person-to-person chat, not AI streaming. 14.4k stars but wrong abstraction | Custom message list with legend-list + custom bubble components |
| Character-by-character typewriter animation | Soul doc explicitly forbids: "Streaming text does NOT animate per-character or per-word. Text appends and scroll follows smoothly." Stream Chat does this and it's distracting | Append markdown chunks, smooth scroll follow |
| Inverted FlatList for message list | 30-40 FPS drops on Android, breaks Reanimated entering animations, weird scroll behavior | legend-list with `alignItemsAtEnd` and `maintainScrollAtEnd` |
| Paid chat SDK (Stream, Sendbird, etc.) | Vendor lock-in, SaaS dependency, overkill for single-user app | Study their patterns (especially Stream's AI components), build custom |
| Generic drawer navigation without session management | Expo's default drawer is a nav pattern, not a session manager | Custom drawer content with session list, search, new-chat button |
| Pure black (#000000) backgrounds | Soul doc: "The darkest surface is `rgb(38, 35, 33)`, not `#000000`." Pure black is cold | Warm charcoal palette from Soul doc |

## Feature Dependencies

```
Auto-growing composer -> Keyboard avoidance (must work together)
Streaming text -> Thinking indicator (show indicator before first token)
Message bubbles -> Message list component (legend-list renders them)
Session list -> Drawer navigation (sessions live in drawer)
Empty state -> New chat (empty state appears on new chat)
Scroll-to-bottom -> Message list (button overlays the list)
Spring animations -> legend-list or Animated.FlatList (list must support entering animations)
Dynamic color -> Streaming state (color shifts tied to stream lifecycle)
```

## MVP Recommendation (UI Polish Pass)

Prioritize (highest impact, table stakes):
1. **Auto-growing composer with proper keyboard avoidance** -- touches every interaction
2. **legend-list migration** (alignItemsAtEnd + maintainScrollAtEnd) -- fixes scroll + enables animations
3. **Message entering animations** (Reanimated springs) -- immediate visual quality boost
4. **Empty state with suggestion chips** -- first thing users see on new chat
5. **Scroll-to-bottom button** -- essential when reading long responses

Defer:
- Dynamic color during streaming: High complexity, not table stakes. Phase it later.
- Swipe-to-reply: Nice but not essential for v3.0 -- needs backend support for reply threading.
- Glass/blur surface tiers: Performance-sensitive on older devices. Test first.

## Sources

- ChatGPT iOS screens: https://mobbin.com/explore/screens/f7e6514e-4106-4b5a-8c37-1b86aa42a9f1
- Claude iOS flow: https://mobbin.com/explore/flows/9a6c28e2-9e3a-43e6-9025-ee08ce863f57
- GAIA UI Composer: https://ui.heygaia.io/docs/components/composer
- exyte/Chat (SwiftUI): https://github.com/exyte/Chat
- Stream Chat RN AI: https://getstream.io/blog/react-native-assistant/
- Galaxies-dev ChatGPT clone: https://github.com/Galaxies-dev/chatgpt-clone-react-native
- react-native-typing-animation: https://github.com/watadarkstar/react-native-typing-animation
