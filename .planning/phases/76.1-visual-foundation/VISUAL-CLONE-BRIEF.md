# Visual Clone Brief — ChatGPT iOS Parity

**Date:** 2026-04-05 (v2 — comprehensive)
**Sources:** Bard design audit + Galaxies-dev RN clone + better-chatbot web app
**Reference repos:**
- `/tmp/chatgpt-clone-react-native` (Galaxies-dev — React Native, same stack)
- `/tmp/better-chatbot` (better-chatbot — Next.js, beautiful dark mode, shadcn/radix)
**Approach:** Direct implementation, no GSD. Edit → verify TS → commit. Repeat.

---

## Design Language To Steal From better-chatbot

better-chatbot is the visual target. It's web (Next.js/Tailwind/shadcn) but the design decisions translate to RN:

### Dark Mode Colors (OKLCH-based, high contrast)
```
Background:        hsl(220 6% 9%)     ≈ rgb(21, 22, 25)   — MUCH darker than our rgb(44,40,38)
Foreground:        oklch(0.985 0 0)   ≈ rgb(250,250,250)  — near-white text
Card:              oklch(0.21 ...)    ≈ rgb(38, 37, 42)    — cards darker than our raised
Secondary:         oklch(0.274 ...)   ≈ rgb(50, 49, 55)    — subtle highlights
Border:            oklch(1 0 0 / 10%) = rgba(255,255,255,0.10) — more visible than our 0.07
Input:             oklch(1 0 0 / 15%) = rgba(255,255,255,0.15) — input backgrounds
Muted foreground:  oklch(0.552 ...)   ≈ rgb(130, 128, 135) — secondary text
Destructive:       oklch(0.577 0.245) ≈ rgb(220, 60, 50)   — red
```

### Key Insight: Our surfaces are too close together and too warm
- better-chatbot background: `hsl(220 6% 9%)` — nearly black with cool undertone
- Our base: `rgb(44, 40, 38)` — medium-dark, warm brown
- The contrast ratio between their bg and text is much higher
- Their borders at 10% white are more visible than our 7%

### Typography
- Font: Geist Sans (system equivalent: SF Pro on iOS) — NOT Inter
- Body: 14px (`text-sm`) — NOT 15 or 16
- Headings: semibold, not bold
- Code: Geist Mono
- Line height: `leading-6` (24px) for body, `leading-relaxed` for messages

### Border Radius (from their theme)
- User bubble: 16px (`rounded-2xl`)
- Composer input: 32px (`rounded-4xl`) — VERY rounded, almost capsule
- Code blocks: 8px (`rounded-lg`)
- Cards: 12px (`rounded-xl`)
- Blockquotes: 16px (`rounded-2xl`)
- Sidebar items: 6px (`rounded-md`) — tight, not bubbly
- Buttons small: 9999px (`rounded-full`)

### Composer (the star of the show)
- Container: `rounded-4xl` (32px!) with `backdrop-blur-sm`
- Background: `bg-muted/60` — 60% opacity muted color
- On focus: `bg-muted` (fully opaque) + ring
- Shadow: `shadow-lg`
- Min height: 2rem for input
- Send button: `rounded-full p-2 bg-secondary hover:bg-accent-foreground`
- File previews: `w-24 h-24 rounded-lg border-2`
- Mentions: avatar + name inline above input

### Messages
- Container: `max-w-3xl mx-auto px-6` (768px max, 24px padding)
- Gap between messages: `gap-2` (8px) — TIGHT
- User message: `bg-accent text-accent-foreground px-4 py-3 rounded-2xl` + `ring ring-input`
- User max width: `max-w-2xl` (672px)
- Assistant: NO background, NO bubble — just text with `px-2` padding
- Tool calls: icon + name, expandable, shimmer during execution
- Reasoning: collapsible with left border, `text-muted-foreground`

### Sidebar
- Width: 256px (16rem)
- Background: same as page background
- Items: `p-2 rounded-md hover:bg-sidebar-accent`
- Active: `bg-sidebar-accent font-medium`
- Thread items: truncated text, no subtitle/timestamp visible in compact view
- Footer: user avatar + name + settings

### Empty State / Greeting
- Centered, `max-w-3xl`
- `text-2xl md:text-3xl` heading with FlipWords animation
- Time-based greeting: "Good morning, {name}"
- First-time: particles + light rays background effect
- Minimal — no suggestion chips in default view

### Animations
- Reasoning expand: `duration: 0.2s, ease: easeInOut` — FAST
- Scroll-to-bottom: `scale 0.8→1, opacity 0→1, duration: 0.2s`
- Greeting: `opacity 0→1, delay: 0.3s`
- Tool executing: TextShimmer (gradient sweep, 2s loop)
- Think indicator: `scale [1,1.5,1], opacity [0.6,1,0.6], duration: 1.5s, infinite`
- Loading dots: SVG 3-dot bounce, 0.6s staggered

### Shadows & Depth
- Very minimal shadows — `shadow-xs` and `shadow-sm` mostly
- Composer: `shadow-lg` (the main shadow in the whole app)
- Cards: `shadow-sm`
- No glow effects, no heavy shadows
- Depth conveyed through opacity layers (bg-muted/60, bg-accent/30)

### Scrollbar
- `[scrollbar-gutter:stable_both-edges]` — prevents layout shift (web-specific)

---

## Reference Values from Galaxies-dev (RN-specific patterns)

### What to steal (RN implementation details):
- `FlashList` with `estimatedItemSize={400}` for chat
- `zeego/context-menu` for native iOS context menus on messages + sessions
- `zeego/dropdown-menu` for model picker in header
- `BlurView intensity={90}` composer wrapper
- `drawerActiveBackgroundColor` + `drawerItemStyle: { borderRadius: 12 }` for drawer selection
- `DrawerItemList` (built-in) rather than custom session items for base behavior
- Suggestion chips: horizontal ScrollView with `gap: 16, padding: 14, borderRadius: 10`
- KeyboardAvoidingView: absolute bottom, `keyboardVerticalOffset: 70`
- Avatar: 30x30 (not 24)

---

## COMPLETE CHANGE LIST (grouped by area)

### A. Color System Overhaul (theme.ts + colors.ts)
1. **Background darker** — base `rgb(44,40,38)` → closer to `rgb(21,22,25)` (nearly black)
2. **Surface hierarchy re-space** — widen gaps between tiers for contrast
3. **Border opacity 7% → 10%** — `rgba(255,255,255,0.07)` → `0.10`
4. **Input background** — add `rgba(255,255,255,0.15)` token
5. **Text contrast increase** — verify WCAG AA against new darker background
6. **Cool undertone** — shift from warm brown to neutral/cool dark
7. **Accent color review** — does `rgb(196,108,88)` work against nearly-black bg?

### B. Typography (theme.ts)
8. **Body font size** — 15px → 16px (prevents iOS auto-zoom, matches reference)
9. **Font family** — Inter is fine (close to Geist/SF Pro), but verify weights
10. **Line height** — body leading should be 24px (`leading-6` equivalent)
11. **Heading weight** — verify semibold (600) not bold (700) throughout
12. **Code font size** — should match body (16px) in code blocks

### C. Composer (Composer.tsx)
13. **Input border radius** — 12px → 32px (capsule/pill shape per better-chatbot)
14. **Input border** — 1px → `StyleSheet.hairlineWidth`
15. **Input padding** — 16px/8px → 10px uniform
16. **Outer container radius** — 20px top → 32px (match input pill)
17. **Remove glow shadow** — delete `theme.shadows.glow(accent)` on send button
18. **Send button** — accent bg → secondary/subtle bg, rounded-full
19. **Backdrop blur** — keep glass, but background should be muted/60% opacity not solid
20. **Font size** — ensure 16px minimum in TextInput
21. **Shadow** — change from `medium` to `lg` equivalent (more prominent, it's the main shadow)

### D. Messages (UserBubble.tsx, AssistantMessage.tsx, MessageList.tsx)
22. **User bubble radius** — 20px → 16px (`rounded-2xl` equivalent)
23. **User bubble** — add subtle ring/outline (`ring ring-input` pattern)
24. **Remove drop shadow** from user bubble — contrast defines depth, not shadows
25. **Assistant messages** — verify NO background, free-flowing text with minimal px padding
26. **Avatar size** — 24px → 30px
27. **Message gap** — tighten vertical spacing between messages (currently varies, target 8px)
28. **FlatList → FlashList** — install `@shopify/flash-list`, `estimatedItemSize={400}`
29. **Message container max width** — verify reasonable max-width on large screens

### E. Drawer (DrawerContent.tsx, SessionItem.tsx, _layout.tsx)
30. **Selection pattern** — remove 3px left accent border, use `drawerActiveBackgroundColor` with `borderRadius: 12`
31. **Item radius** — `drawerItemStyle: { borderRadius: 12 }`
32. **Branding** — "Loom" 28px largeTitle → 17px heading or remove entirely
33. **Overlay opacity** — `rgba(0,0,0,0.4)` → `rgba(0,0,0,0.2)`
34. **Sidebar items** — tighter, more compact. Remove subtitle/timestamp from compact view?
35. **Active item** — `bg-sidebar-accent font-medium` equivalent (background highlight + bold)
36. **Footer** — user avatar should be larger (40x40 rounded-md) with name + ellipsis

### F. Header (ChatHeader.tsx)
37. **Remove bottom border** — glass blur edge defines the header
38. **Model indicator → tappable** — make pressable, eventually zeego dropdown
39. **Glass overlay opacity** — verify `rgba(0,0,0,0.35)` is right for new darker bg
40. **Header height** — verify 56px is correct (44px is more iOS-standard for non-large-title)

### G. Empty State (EmptyChat.tsx)
41. **Icon size** — 24px → 50px circle with 30px icon inside
42. **Add time-based greeting** — "Good morning" / "Good afternoon" / "Good evening"
43. **Add suggestion chips** — horizontal scroll, 4-6 items, `padding: 14, borderRadius: 10`
44. **Greeting text** — larger, `text-2xl` equivalent
45. **Consider animated entrance** — fade-in with delay

### H. Tool Calls (ToolChip.tsx, ToolDetailSheet)
46. **Executing state** — add text shimmer effect (gradient sweep) instead of just pulsing dot
47. **Expand/collapse** — smoother animation, `duration: 0.2s`
48. **Icon background** — add subtle `bg-input/40` behind tool icon

### I. Thinking Segment (ThinkingSegment.tsx)
49. **Collapsed height** — 44px → 32px (less button-like)
50. **Border** — add left border when expanded (`borderLeftWidth: 2, borderLeftColor: muted`)
51. **Text color** — use muted-foreground (less prominent than primary text)
52. **Animation** — expand speed should be 200ms, not spring physics

### J. Code Blocks (CodeBlockSegment.tsx)
53. **Border radius** — verify 12px → 8px (tighter, more code-like)
54. **Syntax theme** — verify Atom One Dark is close to github-dark
55. **Line numbers** — consider adding (better-chatbot has them)
56. **Container** — verify border is visible against new darker background

### K. Scroll & Performance
57. **Scroll-to-bottom button** — `scale 0.8→1, opacity 0→1, duration: 0.2s` animation
58. **Scrollbar** — hide vertical scroll indicator (already done?)

### L. Shadows & Depth
59. **Remove heavy shadows** — PermissionCard's `shadows.heavy` + `glow` collision (AR finding)
60. **Minimal shadow philosophy** — only composer gets prominent shadow
61. **Depth via opacity** — use 30%, 40%, 60% opacity layers instead of drop shadows

### M. Native Integrations (can defer)
62. **zeego context menus** — long-press on messages (copy), sessions (rename, delete)
63. **zeego dropdown** — model picker in header
64. **Keyboard controller** — replace KeyboardAvoidingView with react-native-keyboard-controller

### N. Loading & Skeleton States
65. **Loading dots** — 3-dot bounce animation for "assistant is typing"
66. **Skeleton items** — verify animation matches (opacity pulse)
67. **Text shimmer** — for tool execution status labels

---

## Dependencies to Install
- `@shopify/flash-list` — FlashList for streaming performance (CRITICAL)
- `zeego` — Native iOS context menus and dropdown menus (HIGH, can defer)
- `react-native-keyboard-controller` — Better keyboard avoidance (MEDIUM, can defer)

## Files to Modify (every file in mobile/components/ + theme)
- `mobile/lib/colors.ts` — new color values
- `mobile/theme/theme.ts` — typography, spacing, shadow adjustments
- `mobile/theme/types.ts` — new tokens if needed
- `mobile/components/chat/UserBubble.tsx`
- `mobile/components/chat/AssistantMessage.tsx`
- `mobile/components/chat/Composer.tsx`
- `mobile/components/chat/MessageList.tsx`
- `mobile/components/chat/EmptyChat.tsx`
- `mobile/components/chat/ScrollToBottomPill.tsx`
- `mobile/components/chat/segments/ToolChip.tsx`
- `mobile/components/chat/segments/ThinkingSegment.tsx`
- `mobile/components/chat/segments/CodeBlockSegment.tsx`
- `mobile/components/chat/segments/PermissionCard.tsx`
- `mobile/components/navigation/ChatHeader.tsx`
- `mobile/components/navigation/DrawerContent.tsx`
- `mobile/components/navigation/SessionItem.tsx`
- `mobile/app/(drawer)/_layout.tsx`
- `mobile/app/(drawer)/(stack)/chat/[id].tsx`

## Execution Order
1. **Color system** — everything else looks wrong until colors are right
2. **Typography** — font sizes, weights, line heights
3. **Composer** — highest-visibility component, pill shape + glass
4. **Messages** — user bubble, assistant layout, spacing
5. **Drawer** — selection pattern, density, branding
6. **Header** — remove border, tappable model
7. **Empty state** — greeting, icon, suggestions
8. **Segments** — tool chips, thinking, code blocks
9. **Performance** — FlashList, scroll behavior
10. **Native integrations** — zeego, keyboard controller
